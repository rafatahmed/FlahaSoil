/**
 * FlahaSOIL v2 API — JWT issuance + verification (Phase 9A-C).
 *
 * Single point of coupling to `jose`. Access tokens are short-lived
 * (default 15 min), signed HS256 with `env.auth.jwtSecret`. The claim
 * shape is intentionally minimal:
 *
 *   sub  → user id (cuid)
 *   oid  → activeOrganizationId at issuance, or null if the user has
 *          no membership at the moment the token was minted
 *   iat  → standard issued-at (jose adds it automatically)
 *   exp  → standard expiry (jose adds it from `setExpirationTime`)
 *
 * Refresh tokens are NOT JWTs — they are opaque 32-byte random strings
 * whose SHA-256 hash is stored in the `RefreshToken` table. See
 * `refreshTokens.ts`.
 */

import { jwtVerify, SignJWT } from "jose";

import { env } from "../config/env";
import { ApiError } from "../utils/apiError";

const ISSUER = "flaha-soil-v2";
const AUDIENCE = "flaha-soil-v2-api";

// `jose` accepts the HS256 secret as a Uint8Array. Encoding once at
// module load avoids the repeated TextEncoder allocation on every sign.
const secretKey = new TextEncoder().encode(env.auth.jwtSecret);

export interface AccessTokenClaims {
	/** User id (cuid). */
	sub: string;
	/** Active organization id at issuance, or null. */
	oid: string | null;
	/** Issued-at (seconds since epoch). */
	iat: number;
	/** Expiry (seconds since epoch). */
	exp: number;
}

export interface IssuedAccessToken {
	token: string;
	expiresAt: Date;
}

/**
 * Mints an access token for `userId` carrying its active organization
 * id as `oid`. Returns the encoded token plus the absolute expiry so
 * the caller can echo it to the client (the SPA uses this to schedule
 * a proactive refresh).
 */
export async function issueAccessToken(
	userId: string,
	activeOrganizationId: string | null
): Promise<IssuedAccessToken> {
	const ttlSeconds = env.auth.accessTtlMinutes * 60;
	const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
	const token = await new SignJWT({ oid: activeOrganizationId })
		.setProtectedHeader({ alg: "HS256", typ: "JWT" })
		.setIssuer(ISSUER)
		.setAudience(AUDIENCE)
		.setSubject(userId)
		.setIssuedAt()
		.setExpirationTime(expiresAt)
		.sign(secretKey);
	return { token, expiresAt };
}

/**
 * Verifies signature + issuer + audience + expiry. Throws a typed
 * `ApiError.unauthorized` on any failure so the error handler can map
 * it to a 401 with a stable code, never leaking the underlying jose
 * error name (which would let attackers distinguish "bad signature"
 * from "expired").
 */
export async function verifyAccessToken(
	token: string
): Promise<AccessTokenClaims> {
	try {
		const { payload } = await jwtVerify(token, secretKey, {
			issuer: ISSUER,
			audience: AUDIENCE,
		});
		if (typeof payload.sub !== "string") {
			throw ApiError.unauthorized("Invalid access token");
		}
		const oid =
			payload["oid"] === null || typeof payload["oid"] === "string"
				? (payload["oid"] as string | null)
				: null;
		if (typeof payload.iat !== "number" || typeof payload.exp !== "number") {
			throw ApiError.unauthorized("Invalid access token");
		}
		return {
			sub: payload.sub,
			oid,
			iat: payload.iat,
			exp: payload.exp,
		};
	} catch (err) {
		if (err instanceof ApiError) throw err;
		throw ApiError.unauthorized("Invalid or expired access token");
	}
}

// ---------------------------------------------------------------------------
// Authorization header parsing
// ---------------------------------------------------------------------------

/**
 * Extracts the bearer token from an `Authorization: Bearer <token>`
 * header value. Returns `undefined` when the header is missing or
 * malformed; callers decide whether that maps to a 401 or a fall-
 * through. Case-insensitive on the scheme as RFC 6750 requires.
 */
export function extractBearerToken(
	authorizationHeader: string | undefined
): string | undefined {
	if (!authorizationHeader) return undefined;
	const parts = authorizationHeader.trim().split(/\s+/);
	if (parts.length !== 2) return undefined;
	const scheme = parts[0];
	const token = parts[1];
	if (!scheme || !token) return undefined;
	if (scheme.toLowerCase() !== "bearer") return undefined;
	return token;
}
