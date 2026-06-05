/**
 * FlahaSOIL v2 API — auth controllers (Phase 9A-C).
 *
 * Thin HTTP adapters over `services/auth.service.ts`. Responsibilities:
 *   - Parse the request (Zod), extract request context (IP / UA / req id).
 *   - Translate service results to HTTP responses.
 *   - Manage the HttpOnly+Secure refresh-token cookie. The raw refresh
 *     token NEVER appears in a JSON body and is NEVER returned to the
 *     SPA in a header — it is set on / cleared from the response cookie
 *     and read back from `req.cookies` on the next request.
 *
 * Every handler is wrapped by `asyncHandler` in the routes module, so
 * thrown ApiError instances reach the central error middleware.
 */

import type { CookieOptions, Request, Response } from "express";

import type {
	AuthLoginResponse,
	AuthLogoutResponse,
	AuthMeResponse,
	AuthRefreshResponse,
	AuthRegisterResponse,
	SwitchOrganizationResponse,
} from "@flaha/shared-types";

import { env } from "../config/env";
import {
	getAuthMeSession,
	loginUser,
	logoutUser,
	refreshAuthTokens,
	registerUser,
	switchUserOrganization,
	type RequestContext,
} from "../services/auth.service";
import { ApiError } from "../utils/apiError";
import {
	loginSchema,
	registerSchema,
	switchOrganizationSchema,
} from "../validation/schemas";

// ---------------------------------------------------------------------------
// Cookie helpers
// ---------------------------------------------------------------------------

function buildRefreshCookieOptions(expiresAt: Date): CookieOptions {
	const opts: CookieOptions = {
		httpOnly: true,
		secure: env.auth.cookieSecure,
		sameSite: env.auth.cookieSameSite,
		// Scoped to the refresh + logout endpoints. The cookie is
		// useless on any other path, so scoping it limits accidental
		// exposure (e.g. via mixed-origin XHR or service workers).
		path: "/api/v2/auth",
		expires: expiresAt,
	};
	if (env.auth.cookieDomain) opts.domain = env.auth.cookieDomain;
	return opts;
}

function setRefreshCookie(
	res: Response,
	rawToken: string,
	expiresAt: Date
): void {
	res.cookie(
		env.auth.refreshCookieName,
		rawToken,
		buildRefreshCookieOptions(expiresAt)
	);
}

function clearRefreshCookie(res: Response): void {
	// `clearCookie` re-emits the cookie with maxAge=0; the path / domain
	// MUST match the original set call or the browser ignores the
	// directive (silent footgun).
	const opts: CookieOptions = {
		httpOnly: true,
		secure: env.auth.cookieSecure,
		sameSite: env.auth.cookieSameSite,
		path: "/api/v2/auth",
	};
	if (env.auth.cookieDomain) opts.domain = env.auth.cookieDomain;
	res.clearCookie(env.auth.refreshCookieName, opts);
}

function readRefreshCookie(req: Request): string | undefined {
	const cookies = req.cookies as Record<string, unknown> | undefined;
	const raw = cookies?.[env.auth.refreshCookieName];
	return typeof raw === "string" && raw.length > 0 ? raw : undefined;
}

// ---------------------------------------------------------------------------
// Request context
// ---------------------------------------------------------------------------

function readContext(req: Request): RequestContext {
	const ua = req.headers["user-agent"];
	const ipRaw = req.ip ?? req.socket.remoteAddress ?? undefined;
	const reqIdHeader = req.headers["x-request-id"];
	const reqId =
		typeof reqIdHeader === "string" && reqIdHeader.length > 0
			? reqIdHeader
			: undefined;
	const ctx: RequestContext = {};
	if (typeof ua === "string") ctx.userAgent = ua.slice(0, 256);
	if (ipRaw) ctx.ipAddress = ipRaw;
	if (reqId) ctx.requestId = reqId;
	return ctx;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

export async function postRegister(req: Request, res: Response): Promise<void> {
	const parsed = registerSchema.parse(req.body);
	const ctx = readContext(req);
	const { session, refreshToken } = await registerUser(parsed, ctx);
	setRefreshCookie(res, refreshToken.rawToken, refreshToken.expiresAt);
	const payload: AuthRegisterResponse = { session };
	res.status(201).json(payload);
}

export async function postLogin(req: Request, res: Response): Promise<void> {
	const parsed = loginSchema.parse(req.body);
	const ctx = readContext(req);
	const { session, refreshToken } = await loginUser(parsed, ctx);
	setRefreshCookie(res, refreshToken.rawToken, refreshToken.expiresAt);
	const payload: AuthLoginResponse = { session };
	res.status(200).json(payload);
}

export async function postRefresh(req: Request, res: Response): Promise<void> {
	const raw = readRefreshCookie(req);
	if (!raw) {
		throw ApiError.unauthorized("Missing refresh token.");
	}
	const ctx = readContext(req);
	const { session, refreshToken } = await refreshAuthTokens(raw, ctx);
	setRefreshCookie(res, refreshToken.rawToken, refreshToken.expiresAt);
	const payload: AuthRefreshResponse = { session };
	res.status(200).json(payload);
}

export async function postLogout(req: Request, res: Response): Promise<void> {
	const raw = readRefreshCookie(req);
	const ctx = readContext(req);
	await logoutUser(raw, ctx);
	clearRefreshCookie(res);
	const payload: AuthLogoutResponse = { ok: true };
	res.status(200).json(payload);
}

export async function getAuthMe(req: Request, res: Response): Promise<void> {
	const claims = req.accessTokenClaims;
	const raw = req.accessTokenRaw;
	if (!claims || !raw) {
		throw ApiError.unauthorized("Missing access token.");
	}
	const session = await getAuthMeSession(claims.sub, {
		token: raw,
		expiresAt: new Date(claims.exp * 1000),
	});
	const payload: AuthMeResponse = {
		user: session.user,
		activeOrganization: session.activeOrganization,
		memberships: session.memberships,
	};
	res.status(200).json(payload);
}

/**
 * Phase 9A-H — POST /api/v2/auth/switch-organization.
 *
 * Rotates the access token to carry the new `oid` claim. The refresh-
 * token family is intentionally preserved (no cookie reset) so a
 * switch is a single round-trip with no impact on the user's reauth
 * timeline. Returns a full AuthSessionDTO so the SPA can drop the
 * payload straight into `applySession` — same shape as login/refresh.
 */
export async function postSwitchOrganization(
	req: Request,
	res: Response
): Promise<void> {
	const claims = req.accessTokenClaims;
	if (!claims) {
		throw ApiError.unauthorized("Missing access token.");
	}
	const parsed = switchOrganizationSchema.parse(req.body);
	const ctx = readContext(req);
	const session = await switchUserOrganization(
		claims.sub,
		parsed.organizationId,
		ctx
	);
	const payload: SwitchOrganizationResponse = { session };
	res.status(200).json(payload);
}
