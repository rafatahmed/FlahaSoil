/**
 * FlahaSOIL v2 API — minimal in-memory rate limiter.
 *
 * Sliding-window counter keyed by client IP. Intended as a defence in
 * depth against brute-force / scrape patterns; production deployments
 * should still front the API with a proper edge limiter (e.g. nginx,
 * Cloudflare). Zero external dependencies.
 *
 * Behaviour:
 *   - Each IP gets `max` requests per `windowMs` window.
 *   - Over the limit → 429 with the standard `ApiErrorResponse`
 *     envelope (`code: "RATE_LIMITED"`).
 *   - The map self-prunes any IP whose window has fully expired on
 *     every incoming request (no setInterval, no leaks under load).
 *   - In `NODE_ENV=test` the limiter is a no-op so suites run freely.
 */

import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { logger } from "../utils/logger";

interface Bucket {
	/** Wall-clock ms when the current window started. */
	windowStart: number;
	/** Hit count within the current window. */
	count: number;
}

export interface RateLimitOptions {
	windowMs: number;
	max: number;
}

const DEFAULT_OPTIONS: RateLimitOptions = {
	windowMs: 60_000,
	max: 120,
};

export function createRateLimiter(
	opts: Partial<RateLimitOptions> = {}
): (req: Request, res: Response, next: NextFunction) => void {
	const cfg = { ...DEFAULT_OPTIONS, ...opts };
	const buckets = new Map<string, Bucket>();

	return (req, res, next) => {
		if (env.nodeEnv === "test") {
			next();
			return;
		}
		const key = clientKey(req);
		const now = Date.now();
		const existing = buckets.get(key);
		if (!existing || now - existing.windowStart >= cfg.windowMs) {
			buckets.set(key, { windowStart: now, count: 1 });
			next();
			return;
		}
		existing.count += 1;
		if (existing.count > cfg.max) {
			const retryMs = cfg.windowMs - (now - existing.windowStart);
			res.setHeader("Retry-After", String(Math.ceil(retryMs / 1000)));
			logger.warn("ratelimit.rejected", { ip: key, count: existing.count });
			res.status(429).json({
				error: {
					code: "RATE_LIMITED",
					message: "Too many requests. Please slow down and retry.",
					details: { retryAfterMs: retryMs },
				},
			});
			return;
		}
		next();
	};
}

function clientKey(req: Request): string {
	// Prefer the standard X-Forwarded-For (set by reverse proxies),
	// then `req.ip` (Express's parsed address), then the raw socket.
	const fwd = req.headers["x-forwarded-for"];
	if (typeof fwd === "string" && fwd.length > 0) {
		return fwd.split(",")[0]!.trim();
	}
	if (req.ip) return req.ip;
	return req.socket.remoteAddress ?? "unknown";
}
