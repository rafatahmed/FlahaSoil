/**
 * FlahaSOIL v2 — "Flaha Demo Organization" seed (Phase 9A-K).
 *
 * Idempotent fixture for dev / smoke environments. Creates one
 * organization with four memberships, each backed by a real argon2id
 * password hash, so the SPA login flow + role matrix can be exercised
 * end-to-end without hand-rolling accounts through `/auth/register`.
 *
 * Run via `npm run prisma:seed:v2 --workspace @flaha/api`. The script
 * aborts under NODE_ENV=production (see `seed.ts`) — every credential
 * defined here is a public, well-known demo password and must never be
 * provisioned against a real database.
 *
 * Stable ids let repeated runs converge on the same rows without
 * duplicating audit trails. The argon2id hash is computed lazily once
 * per user so the seed remains cheap on cold starts.
 */

import { OrganizationRole } from "@flaha/shared-types";

import { DEV_USER_ID } from "../src/auth/currentUser";
import { hashPassword } from "../src/auth/password";
import { getPrismaClient } from "../src/prisma/client";

export const FLAHA_DEMO_ORG_ID = "org_flaha_demo_full";
export const FLAHA_DEMO_ORG_SLUG = "flaha-demo-org";
const FLAHA_DEMO_ORG_NAME = "Flaha Demo Organization";
// Phase 9A-H — stable id for the dev admin's OWNER membership in the
// demo org. Cross-mapping the dev admin gives them two memberships
// after a fresh `db:seed`, which is exactly what the tenant switcher
// needs to render end-to-end.
const DEV_ADMIN_DEMO_MEMBERSHIP_ID = "mbr_dev_admin_demo_full";

/**
 * Shared password for every demo user. Public on purpose — the seed is
 * dev-only and the credentials are documented in
 * `docs/v2-multi-tenant-architecture.md`. Meets the 12-char +
 * letter + digit policy enforced by `auth/password.ts`.
 */
export const FLAHA_DEMO_PASSWORD = "FlahaDemo!2026";

interface DemoUserSpec {
	userId: string;
	membershipId: string;
	email: string;
	displayName: string;
	role: OrganizationRole;
}

export const FLAHA_DEMO_USERS: readonly DemoUserSpec[] = [
	{
		userId: "user_flaha_demo_owner",
		membershipId: "mbr_flaha_demo_owner",
		email: "owner@flahademo.test",
		displayName: "Demo Owner",
		role: OrganizationRole.OWNER,
	},
	{
		userId: "user_flaha_demo_agronomist",
		membershipId: "mbr_flaha_demo_agronomist",
		email: "agronomist@flahademo.test",
		displayName: "Demo Agronomist",
		role: OrganizationRole.AGRONOMIST,
	},
	{
		userId: "user_flaha_demo_lab",
		membershipId: "mbr_flaha_demo_lab",
		email: "lab@flahademo.test",
		displayName: "Demo Lab Technician",
		role: OrganizationRole.LAB_TECHNICIAN,
	},
	{
		userId: "user_flaha_demo_viewer",
		membershipId: "mbr_flaha_demo_viewer",
		email: "viewer@flahademo.test",
		displayName: "Demo Viewer",
		role: OrganizationRole.VIEWER,
	},
] as const;

export interface SeededDemoOrgResult {
	organizationId: string;
	users: { email: string; userId: string; role: OrganizationRole }[];
}

/**
 * Upserts the demo organization and its four memberships. Returns a
 * compact summary so the calling seed script can log the resulting
 * accounts without exposing the password hash. Safe to call repeatedly.
 */
export async function seedFlahaDemoOrganization(): Promise<SeededDemoOrgResult> {
	const prisma = getPrismaClient();

	await prisma.organization.upsert({
		where: { id: FLAHA_DEMO_ORG_ID },
		create: {
			id: FLAHA_DEMO_ORG_ID,
			name: FLAHA_DEMO_ORG_NAME,
			slug: FLAHA_DEMO_ORG_SLUG,
			type: "COMPANY",
			status: "ACTIVE",
		},
		update: {
			name: FLAHA_DEMO_ORG_NAME,
			slug: FLAHA_DEMO_ORG_SLUG,
		},
	});

	// Hash once — argon2id is intentionally slow, and every demo user
	// shares the same plaintext password so a single hash is reused.
	const passwordHash = await hashPassword(FLAHA_DEMO_PASSWORD);

	const seededUsers: SeededDemoOrgResult["users"] = [];
	for (const spec of FLAHA_DEMO_USERS) {
		await prisma.user.upsert({
			where: { id: spec.userId },
			create: {
				id: spec.userId,
				email: spec.email,
				displayName: spec.displayName,
				passwordHash,
				activeOrganizationId: FLAHA_DEMO_ORG_ID,
			},
			update: {
				// Re-hash on every run so password rotation in this file
				// propagates immediately, but never clobber an existing
				// activeOrganizationId in case the user has switched to
				// another org they belong to.
				passwordHash,
			},
		});
		await prisma.organizationMembership.upsert({
			where: { id: spec.membershipId },
			create: {
				id: spec.membershipId,
				organizationId: FLAHA_DEMO_ORG_ID,
				userId: spec.userId,
				role: spec.role,
				status: "ACTIVE",
				acceptedAt: new Date(),
			},
			update: {
				role: spec.role,
				status: "ACTIVE",
			},
		});
		seededUsers.push({
			email: spec.email,
			userId: spec.userId,
			role: spec.role,
		});
	}

	// Phase 9A-H — cross-map the dev admin into the demo org so a
	// `npm run db:seed` produces at least one user with multiple
	// memberships. Without this, the tenant switcher stays hidden on a
	// freshly seeded dev DB (it only renders for users with >=2 orgs).
	// Best-effort: the dev user may not exist yet if `ensureDevUser`
	// hasn't run — `seed.ts` calls it first, so in practice it always
	// does, but we guard for direct callers of this seed.
	const devUserExists = await prisma.user.findUnique({
		where: { id: DEV_USER_ID },
	});
	if (devUserExists) {
		await prisma.organizationMembership.upsert({
			where: { id: DEV_ADMIN_DEMO_MEMBERSHIP_ID },
			create: {
				id: DEV_ADMIN_DEMO_MEMBERSHIP_ID,
				organizationId: FLAHA_DEMO_ORG_ID,
				userId: DEV_USER_ID,
				role: OrganizationRole.OWNER,
				status: "ACTIVE",
				acceptedAt: new Date(),
			},
			update: { role: OrganizationRole.OWNER, status: "ACTIVE" },
		});
	}

	return { organizationId: FLAHA_DEMO_ORG_ID, users: seededUsers };
}
