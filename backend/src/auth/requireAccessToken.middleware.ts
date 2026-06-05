/**
 * FlahaSOIL v2 API — JWT bearer-token middleware (Phase 9A-C).
 *
 * Verifies the `Authorization: Bearer <jwt>` header against the auth
 * config and attaches the decoded claims to `req.accessTokenClaims`.
 * This is intentionally *narrow* — it is wired only onto the auth
 * surface (`/api/v2/auth/me`, `/api/v2/auth/logout`) where the request
 * must prove identity but does not yet need a full tenant context.
 * Every other `/api/v2/*` route uses `resolveAuthSession` instead,
 * which builds the full `req.authSession` (user + org + membership).
 */

import type { NextFunction, Request, Response } from "express";

import {
	extractBearerToken,
	verifyAccessToken,
	type AccessTokenClaims,
} from "./jwt";
import { ApiError } from "../utils/apiError";

declare module "express-serve-static-core" {
	interface Request {
		/** Decoded access-token claims (sub, oid, iat, exp). */
		accessTokenClaims?: AccessTokenClaims;
		/** Raw bearer token, kept for endpoints that need to echo it. */
		accessTokenRaw?: string;
	}
}

/**
 * Express middleware. Rejects with 401 on any of: missing header,
 * malformed header, bad signature, expired token. The error message
 * is intentionally generic so attackers cannot distinguish the
 * failure mode (jose's distinct error names are mapped to a single
 * "Invalid or expired access token" by `verifyAccessToken`).
 */
export async function requireAccessToken(
	req: Request,
	_res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const header = req.headers["authorization"];
		const headerStr =
			typeof header === "string"
				? header
				: Array.isArray(header) && typeof header[0] === "string"
					? header[0]
					: undefined;
		const token = extractBearerToken(headerStr);
		if (!token) {
			throw ApiError.unauthorized("Missing or malformed Authorization header.");
		}
		const claims = await verifyAccessToken(token);
		req.accessTokenClaims = claims;
		req.accessTokenRaw = token;
		next();
	} catch (err) {
		next(err);
	}
}
