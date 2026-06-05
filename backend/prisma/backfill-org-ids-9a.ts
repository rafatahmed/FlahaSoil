/**
 * FlahaSOIL v2 — Phase 9A-B tenancy backfill.
 *
 * Migrates the pre-9A "one user → many projects" ownership model to the
 * Phase 9A "one organization → many projects" model by:
 *
 *   1. Ensuring a stable "Flaha Demo" organization exists
 *      (id = `org_flaha_demo`). This is the catch-all tenant for rows
 *      that pre-date the multi-tenant cut.
 *   2. Ensuring every existing `User` has an ACTIVE membership in the
 *      Flaha Demo org. The seeded dev user (`user_dev_admin`) is given
 *      OWNER; all other pre-9A users get AGRONOMIST (the closest
 *      least-privileged write role).
 *   3. Setting `User.activeOrganizationId = org_flaha_demo` for any user
 *      whose column is currently null so write paths in 9A-D start
 *      tagging new rows correctly.
 *   4. Backfilling `Project.organizationId` and
 *      `SoilSample.organizationId` for every row whose column is null.
 *      Projects and samples are tagged via the organization their
 *      creator (`userId`) is now a member of.
 *
 * The script is idempotent — every step uses `upsert` or `updateMany`
 * with a null-filter so re-running it is a no-op once converged. It is
 * safe to run in development AND in production; the only env-driven
 * difference is the connection string.
 *
 * Run from `backend/`:
 *
 *   npm run prisma:backfill:org-ids:v2
 *
 * After this script converges, Phase 9A-B's follow-up `db push` flips
 * `organizationId` from optional to required on both columns.
 */

import { getPrismaClient } from "../src/prisma/client";

// Same stable id used by `ensureDevUser` so the dev seed and the
// backfill converge on the SAME organization row.
const DEMO_ORG_ID = "org_flaha_demo";
const DEMO_ORG_NAME = "Flaha Demo";
const DEMO_ORG_SLUG = "flaha-demo";
const DEV_USER_ID = "user_dev_admin";

interface BackfillSummary {
	demoOrgId: string;
	membershipsCreated: number;
	usersActivated: number;
	projectsTagged: number;
	samplesTagged: number;
}

async function backfill(): Promise<BackfillSummary> {
	const prisma = getPrismaClient();

	// 1. Demo organization (stable id, idempotent).
	await prisma.organization.upsert({
		where: { id: DEMO_ORG_ID },
		create: {
			id: DEMO_ORG_ID,
			name: DEMO_ORG_NAME,
			slug: DEMO_ORG_SLUG,
			type: "COMPANY",
			status: "ACTIVE",
		},
		update: {},
	});

	// 2. Membership per existing user. `upsert` on the composite
	//    (organizationId, userId) unique index is the idempotent path.
	const users = (await prisma.user.findMany({})) as Array<{
		id: string;
		archivedAt: Date | null;
	}>;
	let membershipsCreated = 0;
	for (const user of users) {
		// Use findFirst-then-create so we can count NEW rows accurately.
		const existing = (await prisma.organizationMembership.findFirst({
			where: { organizationId: DEMO_ORG_ID, userId: user.id },
		})) as { id: string } | null;
		if (existing) continue;
		await prisma.organizationMembership.create({
			data: {
				organizationId: DEMO_ORG_ID,
				userId: user.id,
				role: user.id === DEV_USER_ID ? "OWNER" : "AGRONOMIST",
				status: user.archivedAt ? "REMOVED" : "ACTIVE",
				acceptedAt: new Date(),
			},
		});
		membershipsCreated += 1;
	}

	// 3. Activate the demo org for users that have no active tenant.
	const { count: usersActivated } = await prisma.user.updateMany({
		where: { activeOrganizationId: null },
		data: { activeOrganizationId: DEMO_ORG_ID },
	});

	// 4a. Tag every project lacking organizationId with the demo org.
	//    Authoritative tenancy = the creator's org membership, but since
	//    every user is now a member of the demo org, the demo org id is
	//    the correct tag for any null-row in this single-tenant snapshot.
	const { count: projectsTagged } = await prisma.project.updateMany({
		where: { organizationId: null },
		data: { organizationId: DEMO_ORG_ID },
	});

	// 4b. Same treatment for samples — denormalised mirror of
	//    project.organizationId.
	const { count: samplesTagged } = await prisma.soilSample.updateMany({
		where: { organizationId: null },
		data: { organizationId: DEMO_ORG_ID },
	});

	return {
		demoOrgId: DEMO_ORG_ID,
		membershipsCreated,
		usersActivated,
		projectsTagged,
		samplesTagged,
	};
}

async function main(): Promise<void> {
	const summary = await backfill();
	// eslint-disable-next-line no-console
	console.log("[backfill-org-ids-9a] complete:", JSON.stringify(summary));
}

main()
	.then(() => process.exit(0))
	.catch((err: unknown) => {
		// eslint-disable-next-line no-console
		console.error("[backfill-org-ids-9a] failed:", err);
		process.exit(1);
	});
