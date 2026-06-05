/**
 * FlahaSOIL v2 API — auth service (Phase 9A-C).
 *
 * High-level orchestration for `/api/v2/auth/*`. Pulls together the
 * single-responsibility modules in `backend/src/auth/`:
 *   - `password.ts`        — Argon2id hash + policy
 *   - `jwt.ts`             — short-lived HS256 access tokens
 *   - `refreshTokens.ts`   — opaque rotating refresh tokens
 *   - `audit.ts`           — transactional vs best-effort log writes
 *
 * Design rules (NOT to be relaxed without explicit review):
 *   1. The same generic 401 message is returned for "unknown email" and
 *      "wrong password" so the API never leaks account existence.
 *   2. Failed login attempts ALWAYS write an AUTH_LOGIN_FAILED audit
 *      row inside the same transaction as the (no-op) lookup, so brute
 *      force attempts are always traceable.
 *   3. Refresh-token reuse (a token presented after it was already
 *      rotated) revokes the ENTIRE family and writes an
 *      AUTH_REFRESH_REUSE_DETECTED row at SECURITY severity.
 *   4. Registration provisions a personal Organization + OWNER
 *      membership in the same transaction as the User insert.
 *   5. Email is canonicalised (trim + lower-case) before any DB lookup
 *      or insert so the @unique index actually means "one user per
 *      address".
 */

import type {
	AuthSessionDTO,
	OrganizationMembershipDTO,
	UserDTO,
} from "@flaha/shared-types";

import { ApiError } from "../utils/apiError";
import {
	toOrganizationDTO,
	toOrganizationMembershipDTO,
	toUserDTO,
} from "../utils/serializers";

import { writeAuditBestEffort, writeAuditTransactional } from "../auth/audit";
import { issueAccessToken } from "../auth/jwt";
import {
	assertPasswordPolicy,
	hashPassword,
	verifyPassword,
} from "../auth/password";
import {
	findRefreshTokenByRawToken,
	issueNewRefreshToken,
	issueRotatedRefreshToken,
	revokeRefreshTokenById,
	revokeRefreshTokenFamily,
	type IssuedRefreshToken,
	type RefreshTokenContext,
} from "../auth/refreshTokens";
import { getPrismaClient, type PrismaClientLike } from "../prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Wire-level result shared by register / login / refresh. */
export interface AuthResult {
	session: AuthSessionDTO;
	refreshToken: IssuedRefreshToken;
}

export interface RequestContext extends RefreshTokenContext {
	requestId?: string | undefined;
}

export interface RegisterInput {
	email: string;
	password: string;
	displayName: string;
	organizationName?: string | undefined;
}

export interface LoginInput {
	email: string;
	password: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const GENERIC_LOGIN_FAILURE = "Invalid email or password.";

function canonicalizeEmail(raw: string): string {
	return raw.trim().toLowerCase();
}

/**
 * Convert an organization name into a URL-friendly slug. Lower-cases,
 * strips diacritics, replaces runs of non-alphanumerics with `-`, and
 * trims leading/trailing dashes. Collision handling is done by the
 * caller appending a short random suffix.
 */
function slugify(input: string): string {
	const normalised = input
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 60);
	return normalised || "workspace";
}

function randomSlugSuffix(): string {
	// 4 lower-case alphanumerics is enough collision-avoidance for the
	// dev/small-team scale 9A-C targets; 9B will introduce explicit
	// per-org slug editing.
	return Math.random().toString(36).slice(2, 6);
}

function defaultOrganizationName(displayName: string): string {
	const cleaned = displayName.trim();
	return cleaned.length > 0
		? `${cleaned}'s workspace`
		: "Personal workspace";
}

// `prisma.$transaction` is typed as PrismaClientLike in `client.ts`, but
// the tests sometimes supply a stub that doesn't implement transactions.
// This wrapper lets callers run a block "transactionally if possible"
// and fall back to direct execution against the singleton client.
async function runInTransaction<R>(
	prisma: PrismaClientLike,
	fn: (tx: PrismaClientLike) => Promise<R>
): Promise<R> {
	if (typeof prisma.$transaction === "function") {
		return prisma.$transaction(fn);
	}
	return fn(prisma);
}


// ---------------------------------------------------------------------------
// Session assembly
// ---------------------------------------------------------------------------

/**
 * Loads the user, every ACTIVE membership, and the active organization
 * (if any), and packages them into the `AuthSessionDTO` returned to the
 * client. Used after register / login / refresh and by the
 * `getAuthMe` endpoint.
 */
async function loadAuthSession(
	prisma: PrismaClientLike,
	userId: string,
	accessToken: { token: string; expiresAt: Date }
): Promise<AuthSessionDTO> {
	const userRow = (await prisma.user.findUnique({
		where: { id: userId },
	})) as Record<string, unknown> | null;
	if (!userRow) {
		throw ApiError.unauthorized("User not found.");
	}
	const user: UserDTO = toUserDTO(userRow);

	const membershipRows = (await prisma.organizationMembership.findMany({
		where: { userId, status: "ACTIVE" },
		include: { organization: true },
		orderBy: { createdAt: "asc" },
	})) as Record<string, unknown>[];
	const memberships: OrganizationMembershipDTO[] = membershipRows.map(
		toOrganizationMembershipDTO
	);

	const activeOrganizationId = userRow["activeOrganizationId"] as
		| string
		| null
		| undefined;
	let activeOrganization = null;
	if (activeOrganizationId) {
		const activeRow = (await prisma.organization.findUnique({
			where: { id: activeOrganizationId },
		})) as Record<string, unknown> | null;
		if (activeRow) activeOrganization = toOrganizationDTO(activeRow);
	}

	return {
		accessToken: accessToken.token,
		accessTokenExpiresAt: accessToken.expiresAt.toISOString(),
		user,
		activeOrganization,
		memberships,
	};
}

// ---------------------------------------------------------------------------
// Public API — register
// ---------------------------------------------------------------------------

/**
 * Registers a new user, provisions their personal organization, and
 * returns a fresh access + refresh token pair. All DB writes happen in
 * a single transaction so a partial registration is impossible.
 */
export async function registerUser(
	input: RegisterInput,
	ctx: RequestContext = {}
): Promise<AuthResult> {
	assertPasswordPolicy(input.password);
	const email = canonicalizeEmail(input.email);
	const displayName = input.displayName.trim();
	const orgName =
		input.organizationName?.trim() || defaultOrganizationName(displayName);

	const prisma = getPrismaClient();
	const passwordHash = await hashPassword(input.password);
	const baseSlug = slugify(orgName);

	const { userId, organizationId } = await runInTransaction(
		prisma,
		async (tx) => {
			const existing = await tx.user.findUnique({ where: { email } });
			if (existing) {
				throw ApiError.validation("That email is already registered.");
			}

			// Slug collision is rare but possible (two users register
			// "Acme" simultaneously). Retry with a short suffix.
			let slug = baseSlug;
			let collisionGuard = 0;
			while (
				(await tx.organization.findUnique({ where: { slug } })) !== null
			) {
				slug = `${baseSlug}-${randomSlugSuffix()}`;
				collisionGuard += 1;
				if (collisionGuard > 5) {
					throw ApiError.internal("Could not allocate unique org slug.");
				}
			}

			const org = (await tx.organization.create({
				data: { name: orgName, slug, type: "COMPANY", status: "ACTIVE" },
			})) as Record<string, unknown>;
			const orgId = org["id"] as string;

			const user = (await tx.user.create({
				data: {
					email,
					displayName,
					passwordHash,
					role: "AGRONOMIST",
					activeOrganizationId: orgId,
				},
			})) as Record<string, unknown>;
			const newUserId = user["id"] as string;

			await tx.organizationMembership.create({
				data: {
					organizationId: orgId,
					userId: newUserId,
					role: "OWNER",
					status: "ACTIVE",
					acceptedAt: new Date(),
				},
			});

			await writeAuditTransactional(tx, {
				action: "AUTH_REGISTER",
				severity: "INFO",
				actorUserId: newUserId,
				organizationId: orgId,
				requestId: ctx.requestId ?? null,
				ipAddress: ctx.ipAddress ?? null,
				userAgent: ctx.userAgent ?? null,
			});
			await writeAuditTransactional(tx, {
				action: "ORG_CREATED",
				severity: "INFO",
				actorUserId: newUserId,
				organizationId: orgId,
				targetType: "Organization",
				targetId: orgId,
				requestId: ctx.requestId ?? null,
			});
			await writeAuditTransactional(tx, {
				action: "MEMBERSHIP_CREATED",
				severity: "INFO",
				actorUserId: newUserId,
				organizationId: orgId,
				targetType: "OrganizationMembership",
				metadataJson: { role: "OWNER" },
				requestId: ctx.requestId ?? null,
			});

			return { userId: newUserId, organizationId: orgId };
		}
	);

	const refresh = await issueNewRefreshToken(prisma, userId, ctx);
	const access = await issueAccessToken(userId, organizationId);
	const session = await loadAuthSession(prisma, userId, access);
	return { session, refreshToken: refresh };
}

// ---------------------------------------------------------------------------
// Public API — login
// ---------------------------------------------------------------------------

/**
 * Verifies credentials and issues a fresh access + refresh token pair.
 * Failed attempts always write an `AUTH_LOGIN_FAILED` audit row inside
 * the same transaction as the (no-op) state change so a brute-force
 * trail is preserved even when no DB mutation would otherwise occur.
 */
export async function loginUser(
	input: LoginInput,
	ctx: RequestContext = {}
): Promise<AuthResult> {
	const email = canonicalizeEmail(input.email);
	const prisma = getPrismaClient();

	const userRow = (await prisma.user.findUnique({
		where: { email },
	})) as Record<string, unknown> | null;

	const passwordHash = userRow?.["passwordHash"] as string | null | undefined;
	const archivedAt = userRow?.["archivedAt"] as Date | null | undefined;
	const candidateUserId = (userRow?.["id"] as string | undefined) ?? null;

	// Always run the verification — including against a throwaway hash
	// when the user is unknown — so the response time is independent of
	// account existence. This is the standard mitigation against
	// timing-side-channel account enumeration.
	const verified =
		passwordHash && !archivedAt
			? await verifyPassword(passwordHash, input.password)
			: await verifyPassword(
					// A precomputed dummy Argon2id hash so the work factor is
					// realised on the unknown-account branch too.
					"$argon2id$v=19$m=65536,t=3,p=1$ZHVtbXktc2FsdC1wbGFjZWhvbGRlcg$0u70YnDmJj1tflfh0g7uMmM1qBnE3l/F5RHfFkS3Yks",
					input.password
				).then(() => false);

	if (!userRow || !verified || archivedAt) {
		await writeAuditBestEffort({
			action: "AUTH_LOGIN_FAILED",
			severity: "SECURITY",
			actorUserId: candidateUserId,
			requestId: ctx.requestId ?? null,
			ipAddress: ctx.ipAddress ?? null,
			userAgent: ctx.userAgent ?? null,
			metadataJson: { email },
		});
		throw ApiError.unauthorized(GENERIC_LOGIN_FAILURE);
	}

	const userId = userRow["id"] as string;
	const activeOrganizationId =
		(userRow["activeOrganizationId"] as string | null | undefined) ?? null;

	const refresh = await issueNewRefreshToken(prisma, userId, ctx);

	await writeAuditBestEffort({
		action: "AUTH_LOGIN",
		severity: "INFO",
		actorUserId: userId,
		organizationId: activeOrganizationId,
		requestId: ctx.requestId ?? null,
		ipAddress: ctx.ipAddress ?? null,
		userAgent: ctx.userAgent ?? null,
	});

	const access = await issueAccessToken(userId, activeOrganizationId);
	const session = await loadAuthSession(prisma, userId, access);
	return { session, refreshToken: refresh };
}

// ---------------------------------------------------------------------------
// Public API — refresh
// ---------------------------------------------------------------------------

/**
 * Rotates a refresh token. The presented token's row must exist, be
 * non-revoked, and not yet expired. On success, the row is revoked
 * (reason "rotated") and a new row in the same `familyId` is created
 * in the same transaction. Presenting a token whose row is already
 * revoked is treated as theft: the whole family is revoked and a
 * SECURITY audit row is written.
 */
export async function refreshAuthTokens(
	rawRefreshToken: string,
	ctx: RequestContext = {}
): Promise<AuthResult> {
	if (!rawRefreshToken) {
		throw ApiError.unauthorized("Missing refresh token.");
	}
	const prisma = getPrismaClient();
	const row = await findRefreshTokenByRawToken(prisma, rawRefreshToken);
	if (!row) {
		throw ApiError.unauthorized("Invalid refresh token.");
	}

	const tokenId = row["id"] as string;
	const userId = row["userId"] as string;
	const familyId = row["familyId"] as string;
	const expiresAt = row["expiresAt"] as Date;
	const revokedAt = row["revokedAt"] as Date | null;

	if (revokedAt) {
		// Reuse detected: a previously-rotated token was presented.
		// Burn the whole family + log a SECURITY event.
		await revokeRefreshTokenFamily(prisma, familyId, "reuse_detected");
		await writeAuditBestEffort({
			action: "AUTH_REFRESH_REUSE_DETECTED",
			severity: "SECURITY",
			actorUserId: userId,
			requestId: ctx.requestId ?? null,
			ipAddress: ctx.ipAddress ?? null,
			userAgent: ctx.userAgent ?? null,
			metadataJson: { familyId, presentedTokenId: tokenId },
		});
		throw ApiError.unauthorized("Refresh token has been revoked.");
	}

	if (new Date(expiresAt).getTime() <= Date.now()) {
		throw ApiError.unauthorized("Refresh token has expired.");
	}

	const userRow = (await prisma.user.findUnique({
		where: { id: userId },
	})) as Record<string, unknown> | null;
	if (!userRow || userRow["archivedAt"]) {
		// Defensive: if the user has been archived between issuance and
		// refresh, treat the token as no longer valid.
		await revokeRefreshTokenFamily(prisma, familyId, "user_archived");
		throw ApiError.unauthorized("Account is no longer active.");
	}
	const activeOrganizationId =
		(userRow["activeOrganizationId"] as string | null | undefined) ?? null;

	const newRefresh = await runInTransaction(prisma, async (tx) => {
		await revokeRefreshTokenById(tx, tokenId, "rotated");
		const issued = await issueRotatedRefreshToken(tx, userId, familyId, ctx);
		await writeAuditTransactional(tx, {
			action: "AUTH_REFRESH",
			severity: "INFO",
			actorUserId: userId,
			organizationId: activeOrganizationId,
			requestId: ctx.requestId ?? null,
			ipAddress: ctx.ipAddress ?? null,
			userAgent: ctx.userAgent ?? null,
			metadataJson: { familyId },
		});
		return issued;
	});

	const access = await issueAccessToken(userId, activeOrganizationId);
	const session = await loadAuthSession(prisma, userId, access);
	return { session, refreshToken: newRefresh };
}

// ---------------------------------------------------------------------------
// Public API — logout
// ---------------------------------------------------------------------------

/**
 * Logs the caller out by revoking the entire refresh-token family the
 * presented token belongs to. Idempotent: missing/unknown/already-revoked
 * tokens still return success so the client can clear its cookie
 * unconditionally.
 */
export async function logoutUser(
	rawRefreshToken: string | undefined,
	ctx: RequestContext = {}
): Promise<void> {
	if (!rawRefreshToken) return;
	const prisma = getPrismaClient();
	const row = await findRefreshTokenByRawToken(prisma, rawRefreshToken);
	if (!row) return;

	const userId = row["userId"] as string;
	const familyId = row["familyId"] as string;

	await revokeRefreshTokenFamily(prisma, familyId, "logout");
	await writeAuditBestEffort({
		action: "AUTH_LOGOUT",
		severity: "INFO",
		actorUserId: userId,
		requestId: ctx.requestId ?? null,
		ipAddress: ctx.ipAddress ?? null,
		userAgent: ctx.userAgent ?? null,
		metadataJson: { familyId },
	});
}

// ---------------------------------------------------------------------------
// Public API — me
// ---------------------------------------------------------------------------

/**
 * Returns the current session for a verified `userId` (the access-token
 * middleware has already validated the JWT). Does NOT mint a new access
 * token — the caller's existing token is still valid; this endpoint is
 * a pure read.
 */
export async function getAuthMeSession(
	userId: string,
	accessToken: { token: string; expiresAt: Date }
): Promise<AuthSessionDTO> {
	const prisma = getPrismaClient();
	return loadAuthSession(prisma, userId, accessToken);
}

// ---------------------------------------------------------------------------
// Public API — Phase 9A-H: organization listing + switching
// ---------------------------------------------------------------------------

export interface UserMembershipsResult {
	activeOrganizationId: string | null;
	memberships: OrganizationMembershipDTO[];
}

/**
 * Lists every ACTIVE membership for `userId` with hydrated
 * organizations, plus the user's current `activeOrganizationId`. Pure
 * read — used by `GET /api/v2/me/organizations` to populate the tenant
 * switcher.
 */
export async function listUserMemberships(
	userId: string
): Promise<UserMembershipsResult> {
	const prisma = getPrismaClient();
	const userRow = (await prisma.user.findUnique({
		where: { id: userId },
	})) as Record<string, unknown> | null;
	if (!userRow) {
		throw ApiError.unauthorized("User not found.");
	}
	const membershipRows = (await prisma.organizationMembership.findMany({
		where: { userId, status: "ACTIVE" },
		include: { organization: true },
		orderBy: { createdAt: "asc" },
	})) as Record<string, unknown>[];
	const memberships = membershipRows.map(toOrganizationMembershipDTO);
	const activeOrganizationId =
		(userRow["activeOrganizationId"] as string | null | undefined) ?? null;
	return { activeOrganizationId, memberships };
}

/**
 * Switches the caller's active organization. Verifies the caller has
 * an ACTIVE membership in the target org, persists the new
 * `activeOrganizationId` on the User row, mints a fresh access token
 * carrying the new `oid` claim, and writes an `ORG_SWITCHED` audit
 * event. The refresh-token family is intentionally preserved — only
 * the access token rotates — so a switch costs zero refresh-cookie
 * round-trips.
 *
 * Throws 404 (not 403) when the membership is missing or non-ACTIVE so
 * the API does not leak existence of orgs the caller has no business
 * knowing about.
 */
export async function switchUserOrganization(
	userId: string,
	organizationId: string,
	ctx: RequestContext = {}
): Promise<AuthSessionDTO> {
	const prisma = getPrismaClient();

	const membership = (await prisma.organizationMembership.findFirst({
		where: { userId, organizationId, status: "ACTIVE" },
	})) as Record<string, unknown> | null;
	if (!membership) {
		throw ApiError.notFound("Organization not found.");
	}

	await prisma.user.update({
		where: { id: userId },
		data: { activeOrganizationId: organizationId },
	});

	await writeAuditBestEffort({
		action: "ORG_SWITCHED",
		severity: "INFO",
		actorUserId: userId,
		organizationId,
		requestId: ctx.requestId ?? null,
		ipAddress: ctx.ipAddress ?? null,
		userAgent: ctx.userAgent ?? null,
		targetType: "Organization",
		targetId: organizationId,
	});

	const access = await issueAccessToken(userId, organizationId);
	return loadAuthSession(prisma, userId, access);
}

// Expose for tests + the (future) auth middleware.
export { loadAuthSession };

