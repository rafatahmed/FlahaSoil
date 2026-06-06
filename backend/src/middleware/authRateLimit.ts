/**
 * FlahaSOIL v2 API — auth-surface rate limiter (Phase 9A-I).
 *
 * Two layered defences mounted on the public auth endpoints
 * (`/api/v2/auth/login`, `/api/v2/auth/refresh`):
 *
 *   1. Per-IP sliding window — caps the number of attempts a single
 *      client address can make in `windowMs`. Catches naive flooders
 *      and broken clients that retry in a tight loop.
 *   2. Per-identity sliding window + temporary lockout — keyed on the
 *      canonicalised email for login (or the refresh-cookie hash for
 *      refresh). When the identity exceeds `maxIdentityFailures`
 *      within a window, the identity is locked for `lockoutMs` and
 *      every subsequent attempt returns 429 with a `Retry-After`
 *      header until the lockout expires. The lockout is automatic
 *      and time-based — no DB column to flip, no operator action
 *      required.
 *
 * Counter is in-process memory: per-pod state is acceptable for a
 * defence-in-depth tier; production deployments behind multiple pods
 * should still front the API with a shared edge limiter (nginx, CDN,
 * etc.). The limiter is a no-op under `NODE_ENV=test` so the existing
 * supertest suite is not affected; each rate-limit test mounts a
 * dedicated limiter with explicit thresholds to exercise the path.
 *
 * Audit hooks: when an attempt is BLOCKED by the limiter (either the
 * IP or identity tier), a best-effort audit row is written so the
 * security trail captures the rejection. `recordAuthOutcome` lets the
 * controllers feed back successful / failed login outcomes so the
 * per-identity counter can reset on success or increment on failure.
 */

import type { NextFunction, Request, Response } from "express";

import type { AuditAction } from "../auth/audit";
import { writeAuditBestEffort } from "../auth/audit";
import { env } from "../config/env";
import { logger } from "../utils/logger";

interface SlidingBucket {
	windowStart: number;
	count: number;
	/** When set, the identity is locked until this wall-clock ms. */
	lockoutUntil?: number;
}

export interface AuthRateLimitOptions {
	/** Sliding-window length for the per-IP counter. */
	ipWindowMs: number;
	/** Max attempts per IP per window. */
	maxIpAttempts: number;
	/** Sliding-window length for the per-identity counter. */
	identityWindowMs: number;
	/** Failed attempts that trigger a per-identity lockout. */
	maxIdentityFailures: number;
	/** Duration of the per-identity lockout once triggered. */
	lockoutMs: number;
	/** Audit action recorded on a blocked attempt. */
	blockedAuditAction: AuditAction;
}

export const DEFAULT_LOGIN_LIMITS: AuthRateLimitOptions = {
	ipWindowMs: 60_000,
	maxIpAttempts: 20,
	identityWindowMs: 15 * 60_000,
	maxIdentityFailures: 5,
	lockoutMs: 15 * 60_000,
	blockedAuditAction: "AUTH_LOGIN_RATE_LIMITED",
};

export const DEFAULT_REFRESH_LIMITS: AuthRateLimitOptions = {
	ipWindowMs: 60_000,
	maxIpAttempts: 60,
	identityWindowMs: 5 * 60_000,
	maxIdentityFailures: 30,
	lockoutMs: 5 * 60_000,
	blockedAuditAction: "AUTH_REFRESH_RATE_LIMITED",
};

export type AuthRateIdentityKeyFn = (req: Request) => string | undefined;

export interface AuthRateLimiter {
	middleware: (req: Request, res: Response, next: NextFunction) => void;
	/**
	 * Feed back the outcome of an attempt so the per-identity bucket
	 * stays accurate. `recordFailure` advances the counter (and may
	 * trigger lockout); `recordSuccess` clears the bucket entirely.
	 */
	recordFailure: (identity: string | undefined, req: Request) => void;
	recordSuccess: (identity: string | undefined) => void;
	/** Test-only: drops every bucket. */
	_resetForTesting: () => void;
	/** Test-only: reads the current options. */
	_getOptions: () => AuthRateLimitOptions;
}

/**
 * Builds a stateful auth-rate limiter. Each call returns an isolated
 * instance with its own in-memory maps — production wiring instantiates
 * one for `/login` and one for `/refresh` so the two surfaces have
 * independent budgets.
 */
export function createAuthRateLimiter(
	opts: Partial<AuthRateLimitOptions> = {},
	identityKey: AuthRateIdentityKeyFn = defaultIdentityFromBody
): AuthRateLimiter {
	const cfg: AuthRateLimitOptions = { ...DEFAULT_LOGIN_LIMITS, ...opts };
	const ipBuckets = new Map<string, SlidingBucket>();
	const identityBuckets = new Map<string, SlidingBucket>();

	function rejectWith429(
		res: Response,
		retryMs: number,
		kind: "ip" | "identity",
		identity: string | null
	): void {
		res.setHeader("Retry-After", String(Math.ceil(retryMs / 1000)));
		void writeAuditBestEffort({
			action: cfg.blockedAuditAction,
			severity: "SECURITY",
			metadataJson: { kind, identity, retryAfterMs: retryMs },
		});
		res.status(429).json({
			error: {
				code: "RATE_LIMITED",
				message:
					kind === "identity"
						? "Account temporarily locked due to repeated failures."
						: "Too many requests. Please slow down and retry.",
				details: { retryAfterMs: retryMs },
			},
		});
	}

	function middleware(
		req: Request,
		res: Response,
		next: NextFunction
	): void {
		if (env.nodeEnv === "test" && !(req as { _forceAuthRateLimit?: boolean })._forceAuthRateLimit) {
			next();
			return;
		}
		const now = Date.now();
		const ipKey = clientKey(req);
		const ipBucket = touchBucket(ipBuckets, ipKey, now, cfg.ipWindowMs);
		ipBucket.count += 1;
		if (ipBucket.count > cfg.maxIpAttempts) {
			const retryMs = cfg.ipWindowMs - (now - ipBucket.windowStart);
			logger.warn("authratelimit.ip_blocked", { ip: ipKey });
			rejectWith429(res, retryMs, "ip", null);
			return;
		}

		const identity = identityKey(req);
		if (identity) {
			const idBucket = touchBucket(
				identityBuckets,
				identity,
				now,
				cfg.identityWindowMs
			);
			if (idBucket.lockoutUntil && idBucket.lockoutUntil > now) {
				const retryMs = idBucket.lockoutUntil - now;
				logger.warn("authratelimit.identity_locked", { identity });
				rejectWith429(res, retryMs, "identity", redactIdentity(identity));
				return;
			}
			// Lockout naturally expires once `lockoutUntil` is in the
			// past; clear it so the counter can rebuild from scratch.
			if (idBucket.lockoutUntil && idBucket.lockoutUntil <= now) {
				idBucket.lockoutUntil = undefined;
				idBucket.count = 0;
				idBucket.windowStart = now;
			}
		}

		next();
	}

	function recordFailure(identity: string | undefined, req: Request): void {
		if (!identity) return;
		const now = Date.now();
		const bucket = touchBucket(
			identityBuckets,
			identity,
			now,
			cfg.identityWindowMs
		);
		bucket.count += 1;
		if (bucket.count >= cfg.maxIdentityFailures && !bucket.lockoutUntil) {
			bucket.lockoutUntil = now + cfg.lockoutMs;
			logger.warn("authratelimit.identity_lockout_triggered", {
				identity: redactIdentity(identity),
				lockoutMs: cfg.lockoutMs,
			});
			void writeAuditBestEffort({
				action: "AUTH_LOCKOUT",
				severity: "SECURITY",
				metadataJson: {
					identity: redactIdentity(identity),
					lockoutMs: cfg.lockoutMs,
					reason: "max_identity_failures",
					ipAddress: req.ip ?? null,
				},
			});
		}
	}

	function recordSuccess(identity: string | undefined): void {
		if (!identity) return;
		identityBuckets.delete(identity);
	}

	return {
		middleware,
		recordFailure,
		recordSuccess,
		_resetForTesting() {
			ipBuckets.clear();
			identityBuckets.clear();
		},
		_getOptions() {
			return cfg;
		},
	};
}

function touchBucket(
	store: Map<string, SlidingBucket>,
	key: string,
	now: number,
	windowMs: number
): SlidingBucket {
	const existing = store.get(key);
	if (!existing || now - existing.windowStart >= windowMs) {
		const fresh: SlidingBucket = { windowStart: now, count: 0 };
		store.set(key, fresh);
		return fresh;
	}
	return existing;
}

function clientKey(req: Request): string {
	const fwd = req.headers["x-forwarded-for"];
	if (typeof fwd === "string" && fwd.length > 0) {
		return fwd.split(",")[0]!.trim();
	}
	if (req.ip) return req.ip;
	return req.socket.remoteAddress ?? "unknown";
}

/**
 * Default identity extractor for `/login`: the canonical email from
 * the JSON body. For `/refresh` the controller wires its own
 * extractor that hashes the cookie token.
 */
function defaultIdentityFromBody(req: Request): string | undefined {
	const body = req.body as { email?: unknown } | undefined;
	const raw = body?.email;
	if (typeof raw !== "string") return undefined;
	const canonical = raw.trim().toLowerCase();
	return canonical.length > 0 ? `email:${canonical}` : undefined;
}

/**
 * Hashes / shortens the identity before it leaves the process so the
 * audit log never persists a raw refresh-token cookie value. Email
 * identities are recorded as-is because they are already user data
 * and tying lockouts to addresses is the whole point of the trail.
 */
function redactIdentity(identity: string): string {
	if (identity.startsWith("email:")) return identity;
	return `${identity.slice(0, 8)}…(${identity.length})`;
}
