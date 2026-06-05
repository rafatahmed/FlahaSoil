/**
 * FlahaSOIL v2 API — authSession middleware (Phase 9A-D).
 *
 * Single resolution point for "who is the caller?" on every protected
 * `/api/v2/*` route. Resolution order:
 *
 *   1. JWT bearer token (`Authorization: Bearer <token>`). Verified
 *      via `verifyAccessToken`; the `sub` and `oid` claims drive the
 *      User + Organization + Membership load.
 *   2. Dev fallback (`x-dev-user-id` header, or the seeded dev user)
 *      ONLY when `env.auth.allowDevAuth === true`. The boot path
 *      refuses to enable this in production (see config/env.ts), so
 *      the fallback is structurally unreachable in prod.
 *
 * When neither resolves, the request is rejected with 401. The error
 * message is intentionally generic — attackers must not be able to
 * distinguish "missing header" from "bad signature" or "expired".
 *
 * The resolved session is attached as `req.authSession`. Phase 9A-E
 * removed the legacy `req.currentUser` back-compat write: every
 * controller now reads `req.authSession` exclusively. See
 * `controllers/me.controller.ts` for the canonical access pattern.
 */

import type { NextFunction, Request, Response } from "express";

import {
	type OrganizationDTO,
	type OrganizationMembershipDTO,
	OrganizationRole,
	type UserDTO,
} from "@flaha/shared-types";

import { env } from "../config/env";
import { getPrismaClient } from "../prisma/client";
import { ApiError } from "../utils/apiError";
import {
	toOrganizationDTO,
	toOrganizationMembershipDTO,
	toUserDTO,
} from "../utils/serializers";

import { ensureDevUser, getUserById } from "./currentUser";
import {
	extractBearerToken,
	verifyAccessToken,
	type AccessTokenClaims,
} from "./jwt";

const DEV_USER_HEADER = "x-dev-user-id";

export type AuthSessionMode = "jwt" | "dev";

/**
 * Resolved session attached to every protected request. `organization`,
 * `role`, and `membershipId` are nullable to cover legacy users + the
 * (rare) case of a JWT minted before the user joined any org. Resource
 * guards in `guards.ts` enforce `requireOrganization` when a route
 * needs a tenant context.
 */
export interface AuthSession {
	mode: AuthSessionMode;
	userId: string;
	organizationId: string | null;
	role: OrganizationRole | null;
	membershipId: string | null;
	user: UserDTO;
	organization: OrganizationDTO | null;
	membership: OrganizationMembershipDTO | null;
	memberships: OrganizationMembershipDTO[];
}

declare module "express-serve-static-core" {
	interface Request {
		authSession?: AuthSession;
	}
}

/**
 * Compact "who is performing this write?" payload accepted by every
 * tenant-scoped service signature in Phase 9A-D.5. `userId` is the
 * historical creator (kept for audit / `created_by`-style columns);
 * `organizationId` is the authoritative tenant boundary used in every
 * Prisma `where`/`data` clause.
 */
export interface AuthorActor {
	userId: string;
	organizationId: string;
}

function readDevUserHeader(req: Request): string | undefined {
	const raw = req.headers[DEV_USER_HEADER];
	if (typeof raw === "string" && raw.length > 0) return raw;
	if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
		return raw[0];
	}
	return undefined;
}

function readAuthorizationHeader(req: Request): string | undefined {
	const raw = req.headers["authorization"];
	if (typeof raw === "string") return raw;
	if (Array.isArray(raw) && typeof raw[0] === "string") return raw[0];
	return undefined;
}

/**
 * Loads the user, every ACTIVE membership, and the active organization
 * (preferred via the JWT `oid` claim; otherwise the user's
 * `activeOrganizationId`) for a resolved user id. Throws 401 on a
 * stale claim (user deleted, membership revoked).
 */
async function loadSessionForUser(
	userId: string,
	mode: AuthSessionMode,
	preferredOrgId: string | null
): Promise<AuthSession> {
	const prisma = getPrismaClient();
	const userRow = (await prisma.user.findUnique({
		where: { id: userId },
	})) as Record<string, unknown> | null;
	if (!userRow) {
		throw ApiError.unauthorized("Invalid or expired access token");
	}
	const user = toUserDTO(userRow);

	const membershipRows = (await prisma.organizationMembership.findMany({
		where: { userId, status: "ACTIVE" },
		include: { organization: true },
		orderBy: { createdAt: "asc" },
	})) as Record<string, unknown>[];
	const memberships = membershipRows.map(toOrganizationMembershipDTO);

	// Resolution order for the active org:
	//   1. JWT `oid` claim (or explicit dev preference) — authoritative.
	//   2. User.activeOrganizationId — what login/switch-org persists.
	//   3. The single ACTIVE membership when there is exactly one — a
	//      convenience so freshly-registered or single-org users get a
	//      tenant context without an extra round-trip.
	const explicitActiveOrgId =
		preferredOrgId ??
		(userRow["activeOrganizationId"] as string | null | undefined) ??
		null;
	const explicitRow = explicitActiveOrgId
		? (membershipRows.find(
				(m) => (m["organizationId"] as string) === explicitActiveOrgId
			) ?? null)
		: null;
	const activeRow =
		explicitRow ?? (membershipRows.length === 1 ? (membershipRows[0] ?? null) : null);
	const membership = activeRow ? toOrganizationMembershipDTO(activeRow) : null;
	const organization =
		activeRow && activeRow["organization"]
			? toOrganizationDTO(activeRow["organization"] as Record<string, unknown>)
			: null;

	return {
		mode,
		userId,
		organizationId: membership?.organizationId ?? null,
		role: (membership?.role as OrganizationRole | undefined) ?? null,
		membershipId: membership?.id ?? null,
		user,
		organization,
		membership,
		memberships,
	};
}

async function resolveFromJwt(claims: AccessTokenClaims): Promise<AuthSession> {
	return loadSessionForUser(claims.sub, "jwt", claims.oid);
}

async function resolveFromDevAuth(req: Request): Promise<AuthSession> {
	const headerId = readDevUserHeader(req);
	if (headerId) {
		const found = await getUserById(headerId);
		if (found) return loadSessionForUser(found.id, "dev", null);
	}
	const seeded = await ensureDevUser();
	return loadSessionForUser(seeded.id, "dev", null);
}

/**
 * Phase 9A-E — the dev resolver is only available when:
 *   - the operator explicitly opted in via `ALLOW_DEV_AUTH=true`, AND
 *   - the runtime is `development` or `test`.
 *
 * The boot path (config/env.ts) already refuses to start under
 * `NODE_ENV=production` with the flag set, so the `nodeEnv` check here
 * is defence-in-depth — any future change that loosens the boot guard
 * still cannot leak the backdoor into a prod-shaped runtime.
 */
function isDevAuthAvailable(): boolean {
	return (
		env.auth.allowDevAuth &&
		(env.nodeEnv === "development" || env.nodeEnv === "test")
	);
}

/**
 * Express middleware. Resolves `req.authSession`. 401s on any failure
 * path so downstream guards can rely on the session being present.
 */
export async function resolveAuthSession(
	req: Request,
	_res: Response,
	next: NextFunction
): Promise<void> {
	try {
		const bearer = extractBearerToken(readAuthorizationHeader(req));
		let session: AuthSession;
		if (bearer) {
			const claims = await verifyAccessToken(bearer);
			session = await resolveFromJwt(claims);
		} else if (isDevAuthAvailable()) {
			session = await resolveFromDevAuth(req);
		} else {
			throw ApiError.unauthorized(
				"Missing or malformed Authorization header."
			);
		}
		req.authSession = session;
		next();
	} catch (err) {
		next(err);
	}
}
