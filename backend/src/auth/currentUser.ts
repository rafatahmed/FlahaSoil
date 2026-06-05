/**
 * FlahaSOIL v2 API — dev-user resolver (Phase 8B, trimmed in 9A-E).
 *
 * Owns the read/write surface for the seeded development user that the
 * `ALLOW_DEV_AUTH=true` fallback in `resolveAuthSession` falls back to
 * when a `/api/v2/*` request arrives without a JWT bearer token.
 *
 * Production auth (JWT / password / OAuth) is implemented in
 * `services/auth.service.ts`; this module is intentionally narrow.
 * Callers in the live tree:
 *
 *   - `auth/session.middleware.ts` — dev fallback path only.
 *   - `bootstrap.ts` — ensures the seeded dev user exists when
 *     `ALLOW_DEV_AUTH=true` during dev boot.
 */

import {
	type UserDTO,
	UserRole,
} from "@flaha/shared-types";

import { getPrismaClient } from "../prisma/client";
import { toUserDTO } from "../utils/serializers";

/**
 * Stable identifier for the seeded development user. Lives outside
 * Prisma's `cuid()` default on purpose so existing rows + tests that
 * still reference the literal stay valid through the Phase 8B sweep.
 */
export const DEV_USER_ID = "user_dev_admin";

const DEV_USER_EMAIL = "dev@flahasoil.local";
const DEV_USER_DISPLAY_NAME = "Development User";

/**
 * Phase 9A — stable identifiers for the seeded "Flaha Demo" organization
 * and the dev user's OWNER membership in it. Fixed ids let the backfill
 * script + dev seed converge on the same rows without races.
 */
export const DEV_ORG_ID = "org_flaha_demo";
const DEV_ORG_NAME = "Flaha Demo";
const DEV_ORG_SLUG = "flaha-demo";
export const DEV_MEMBERSHIP_ID = "mbr_dev_admin_demo";

/**
 * Idempotently ensures the seeded dev user exists, plus the Flaha Demo
 * organization and the dev user's OWNER membership in it. Safe to call
 * from the boot path and from tests; uses fixed ids so repeated calls
 * do not produce duplicates.
 *
 * Phase 9A — also sets `User.activeOrganizationId` so writes performed
 * via the dev-session middleware can populate `Project.organizationId`
 * and `SoilSample.organizationId` correctly during the migration
 * window.
 */
export async function ensureDevUser(): Promise<UserDTO> {
	const prisma = getPrismaClient();

	// 1. Demo organization (top-level tenant for dev / smoke data).
	await prisma.organization.upsert({
		where: { id: DEV_ORG_ID },
		create: {
			id: DEV_ORG_ID,
			name: DEV_ORG_NAME,
			slug: DEV_ORG_SLUG,
			type: "COMPANY",
			status: "ACTIVE",
		},
		update: {},
	});

	// 2. Dev user. `activeOrganizationId` set on first create so writes
	//    immediately get tagged; never overwritten by the upsert so a
	//    later switch-org action survives bootstraps.
	const row = await prisma.user.upsert({
		where: { id: DEV_USER_ID },
		create: {
			id: DEV_USER_ID,
			email: DEV_USER_EMAIL,
			displayName: DEV_USER_DISPLAY_NAME,
			role: UserRole.ADMIN,
			activeOrganizationId: DEV_ORG_ID,
		},
		update: {},
	});

	// 3. OWNER membership for the dev user in the demo org. Idempotent
	//    via the composite (organizationId, userId) unique index — we
	//    use a fixed id so the row is recognisable in logs / audits.
	await prisma.organizationMembership.upsert({
		where: { id: DEV_MEMBERSHIP_ID },
		create: {
			id: DEV_MEMBERSHIP_ID,
			organizationId: DEV_ORG_ID,
			userId: DEV_USER_ID,
			role: "OWNER",
			status: "ACTIVE",
			acceptedAt: new Date(),
		},
		update: {},
	});

	return toUserDTO(row);
}

/**
 * Loads a user by id. Returns `null` when no row matches (callers
 * decide whether that is a 401, a 404, or a fall-through to the dev
 * user). Archived users (`archivedAt != null`) are still returned so
 * historical ownership chains remain readable.
 */
export async function getUserById(userId: string): Promise<UserDTO | null> {
	const prisma = getPrismaClient();
	const row = await prisma.user.findUnique({ where: { id: userId } });
	return row ? toUserDTO(row) : null;
}


