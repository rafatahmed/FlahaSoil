/**
 * FlahaSOIL v2 API — auth routes (Phase 9A-C).
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
 */

import { Router } from "express";

import {
	getAuthMe,
	postLogin,
	postLogout,
	postRefresh,
	postRegister,
	postSwitchOrganization,
} from "../controllers/auth.controller";
import { requireAccessToken } from "../auth/requireAccessToken.middleware";
import { asyncHandler } from "../utils/asyncHandler";

export function createAuthRouter(): Router {
	const router = Router();

	router.post("/register", asyncHandler(postRegister));
	router.post("/login", asyncHandler(postLogin));
	router.post("/refresh", asyncHandler(postRefresh));

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
