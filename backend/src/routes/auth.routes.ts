/**
 * FlahaSOIL v2 API — auth routes (Phase 9A-C, hardened in Phase 9A-I).
 *
 * Mounted at `/api/v2/auth` from `routes/v2.routes.ts`. Every handler
 * is wrapped with `asyncHandler` so thrown ApiError instances reach
 * the central error middleware. The `register`, `login`, and `refresh`
 * routes are intentionally public — auth IS the surface that creates a
 * session. `logout` and `me` are JWT-protected via
 * `requireAccessToken`; the broader `resolveAuthSession` middleware
 * does NOT wrap this router so an unauthenticated client can still
 * register/login.
 *
 *   POST   /register   → create User + personal Org + OWNER membership
 *   POST   /login      → verify credentials, issue tokens
 *   POST   /refresh    → rotate refresh token, mint new access token
 *   POST   /logout     → revoke the refresh-token family
 *   GET    /me         → JWT-protected; returns current session
 *
 * Phase 9A-I — login + refresh are wrapped with `createAuthRateLimiter`
 * instances (one per surface) so brute-force loops are throttled per-IP
 * AND per-identity, with automatic temporary lockout. The limiter
 * instances are attached to `req` so the controllers can feed the
 * outcome back (success → reset bucket, failure → advance counter).
 */

import { createHash } from "node:crypto";
import { Router, type Request, type Response, type NextFunction } from "express";

import {
	getAuthMe,
	postLogin,
	postLogout,
	postRefresh,
	postRegister,
	postSwitchOrganization,
} from "../controllers/auth.controller";
import { requireAccessToken } from "../auth/requireAccessToken.middleware";
import { env } from "../config/env";
import {
	createAuthRateLimiter,
	DEFAULT_LOGIN_LIMITS,
	DEFAULT_REFRESH_LIMITS,
	type AuthRateLimiter,
} from "../middleware/authRateLimit";
import { asyncHandler } from "../utils/asyncHandler";

declare module "express-serve-static-core" {
	interface Request {
		authRateLimiter?: AuthRateLimiter;
	}
}

export function createAuthRouter(): Router {
	const router = Router();

	const loginLimiter = createAuthRateLimiter(DEFAULT_LOGIN_LIMITS);
	const refreshLimiter = createAuthRateLimiter(
		DEFAULT_REFRESH_LIMITS,
		(req) => readRefreshCookieIdentity(req)
	);

	const attach = (limiter: AuthRateLimiter) =>
		(req: Request, _res: Response, next: NextFunction): void => {
			req.authRateLimiter = limiter;
			next();
		};

	router.post("/register", asyncHandler(postRegister));
	router.post(
		"/login",
		attach(loginLimiter),
		loginLimiter.middleware,
		asyncHandler(postLogin)
	);
	router.post(
		"/refresh",
		attach(refreshLimiter),
		refreshLimiter.middleware,
		asyncHandler(postRefresh)
	);

	// Phase 9A-D — /logout and /me are JWT-protected: the client must
	// prove identity before we revoke the refresh-token family.
	router.post(
		"/logout",
		asyncHandler(requireAccessToken),
		asyncHandler(postLogout)
	);
	router.get(
		"/me",
		asyncHandler(requireAccessToken),
		asyncHandler(getAuthMe)
	);

	// Phase 9A-H — switch the caller's active organization. JWT-only
	// (no role gate): membership eligibility is validated inside the
	// service. Lives under /auth because it rotates the access token.
	router.post(
		"/switch-organization",
		asyncHandler(requireAccessToken),
		asyncHandler(postSwitchOrganization)
	);

	return router;
}

/**
 * Phase 9A-I — identity extractor for the refresh limiter. Uses the
 * SHA-256 hash of the refresh-cookie value (truncated for log brevity)
 * so the audit trail never persists a raw token. Returns `undefined`
 * when no cookie is present so the per-IP tier still applies but the
 * per-identity tier is skipped (anonymous flooders).
 */
function readRefreshCookieIdentity(req: Request): string | undefined {
	const cookies = req.cookies as Record<string, unknown> | undefined;
	const raw = cookies?.[env.auth.refreshCookieName];
	if (typeof raw !== "string" || raw.length === 0) return undefined;
	const hash = createHash("sha256").update(raw).digest("hex");
	return `rt:${hash.slice(0, 32)}`;
}
