/**
 * FlahaSOIL v2 API — refresh-token lifecycle (Phase 9A-C).
 *
 * Refresh tokens are opaque random strings: 32 bytes of CSPRNG output
 * encoded as base64url. The raw token is sent to the client in an
 * HttpOnly+Secure cookie; the database stores ONLY the SHA-256 hex
 * digest in `RefreshToken.tokenHash`, so a DB leak does not reveal any
 * usable refresh token.
 *
 * Rotation chain: every login mints a new `familyId`. Every successful
 * refresh inserts a new row with the SAME `familyId` and revokes the
 * old row in the same transaction. Presenting a token whose row is
 * already revoked is treated as a STOLEN-TOKEN signal — the whole
 * family is revoked and the caller gets a 401.
 *
 * This module owns the crypto + persistence primitives; the higher-
 * level orchestration (audit logging, transactional combining with the
 * access-token issuance) lives in `services/auth.service.ts`.
 */

import crypto from "node:crypto";

import { env } from "../config/env";
import type { PrismaClientLike } from "../prisma/client";

export interface IssuedRefreshToken {
	/** The raw token to send to the client (cookie value). */
	rawToken: string;
	/** Absolute expiry of the row. */
	expiresAt: Date;
	/** Stable id of the rotation chain this token belongs to. */
	familyId: string;
}

export interface RefreshTokenContext {
	userAgent?: string | undefined;
	ipAddress?: string | undefined;
}

// ---------------------------------------------------------------------------
// Crypto primitives
// ---------------------------------------------------------------------------

function randomToken(): string {
	return crypto.randomBytes(32).toString("base64url");
}

function newFamilyId(): string {
	// Slightly shorter (16 bytes / 22 chars b64url) — familyIds are
	// opaque DB-internal correlators, not security-sensitive on their
	// own. Still CSPRNG so they're unpredictable in logs.
	return crypto.randomBytes(16).toString("base64url");
}

export function hashRefreshToken(rawToken: string): string {
	return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function computeExpiresAt(): Date {
	const ms = env.auth.refreshTtlDays * 24 * 60 * 60 * 1000;
	return new Date(Date.now() + ms);
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

/**
 * Mints a brand-new refresh token (new `familyId`) for `userId` and
 * persists the hash. Used on login + register. Accepts a Prisma client
 * or transaction handle so the caller can wrap multiple ops together.
 */
export async function issueNewRefreshToken(
	prisma: PrismaClientLike,
	userId: string,
	ctx: RefreshTokenContext = {}
): Promise<IssuedRefreshToken> {
	const rawToken = randomToken();
	const familyId = newFamilyId();
	const expiresAt = computeExpiresAt();
	await prisma.refreshToken.create({
		data: {
			userId,
			tokenHash: hashRefreshToken(rawToken),
			familyId,
			expiresAt,
			userAgent: ctx.userAgent ?? null,
			ipAddress: ctx.ipAddress ?? null,
		},
	});
	return { rawToken, familyId, expiresAt };
}

/**
 * Issues a refresh token that continues an EXISTING rotation chain.
 * Used inside the refresh transaction after the previous row has been
 * marked revoked.
 */
export async function issueRotatedRefreshToken(
	prisma: PrismaClientLike,
	userId: string,
	familyId: string,
	ctx: RefreshTokenContext = {}
): Promise<IssuedRefreshToken> {
	const rawToken = randomToken();
	const expiresAt = computeExpiresAt();
	await prisma.refreshToken.create({
		data: {
			userId,
			tokenHash: hashRefreshToken(rawToken),
			familyId,
			expiresAt,
			userAgent: ctx.userAgent ?? null,
			ipAddress: ctx.ipAddress ?? null,
		},
	});
	return { rawToken, familyId, expiresAt };
}

/** Loads a row by its raw-token hash (O(1) via unique index). */
export async function findRefreshTokenByRawToken(
	prisma: PrismaClientLike,
	rawToken: string
): Promise<Record<string, unknown> | null> {
	const tokenHash = hashRefreshToken(rawToken);
	return prisma.refreshToken.findUnique({ where: { tokenHash } });
}

/** Marks a single token row revoked. */
export async function revokeRefreshTokenById(
	prisma: PrismaClientLike,
	id: string,
	reason: string
): Promise<void> {
	await prisma.refreshToken.update({
		where: { id },
		data: { revokedAt: new Date(), revokedReason: reason },
	});
}

/**
 * Revokes every still-active row in `familyId`. Used on reuse
 * detection and on logout. Idempotent: rows already revoked are
 * excluded by the `revokedAt: null` filter.
 */
export async function revokeRefreshTokenFamily(
	prisma: PrismaClientLike,
	familyId: string,
	reason: string
): Promise<number> {
	const { count } = await prisma.refreshToken.updateMany({
		where: { familyId, revokedAt: null },
		data: { revokedAt: new Date(), revokedReason: reason },
	});
	return count;
}
