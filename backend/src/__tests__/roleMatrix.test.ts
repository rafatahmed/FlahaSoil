/**
 * FlahaSOIL v2 API — role matrix tests (Phase 9A-D.7).
 *
 * Locks in the per-route authorization matrix enforced by the guards in
 * `auth/guards.ts`. One organization is seeded with one member per
 * `OrganizationRole`; each role then attempts the same protected
 * endpoint and the response is asserted against the documented matrix:
 *
 *   POST /projects             → ROLES_AGRONOMY_WRITE = OWNER, ADMIN,
 *                                AGRONOMIST.
 *   POST /soil-samples         → ROLES_LAB_WRITE      = + LAB_TECHNICIAN.
 *   POST /reports/:id/regen…   → ROLES_REPORT_WRITE   = OWNER, ADMIN,
 *                                AGRONOMIST, CONSULTANT.
 *
 * Disallowed roles surface a 403 with `INSUFFICIENT_PERMISSION` /
 * `FORBIDDEN` code; allowed roles get past the gate and the controller
 * runs against the in-memory Prisma stub (the report regenerate handler
 * is intentionally not driven to a 2xx — the test only asserts the
 * gate, not the downstream snapshot pipeline).
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { OrganizationRole, UserRole } from "@flaha/shared-types";

import { createApp } from "../app";
import { issueAccessToken } from "../auth/jwt";
import {
	type MultiTenantDb,
	makeMultiTenantStub,
} from "./_helpers/multiTenantStub";
import { setPrismaClientForTesting } from "../prisma/client";

const app = createApp();

const ALL_ROLES: OrganizationRole[] = [
	OrganizationRole.OWNER,
	OrganizationRole.ADMIN,
	OrganizationRole.AGRONOMIST,
	OrganizationRole.LAB_TECHNICIAN,
	OrganizationRole.CONSULTANT,
	OrganizationRole.VIEWER,
];

const AGRONOMY_WRITE: OrganizationRole[] = [
	OrganizationRole.OWNER,
	OrganizationRole.ADMIN,
	OrganizationRole.AGRONOMIST,
];

const LAB_WRITE: OrganizationRole[] = [
	...AGRONOMY_WRITE,
	OrganizationRole.LAB_TECHNICIAN,
];

const REPORT_WRITE: OrganizationRole[] = [
	...AGRONOMY_WRITE,
	OrganizationRole.CONSULTANT,
];

interface Fixture {
	db: MultiTenantDb;
	orgId: string;
	projectId: string;
	reportId: string;
	tokens: Record<OrganizationRole, string>;
}

async function seedFixture(): Promise<Fixture> {
	const { prisma, db } = makeMultiTenantStub();
	setPrismaClientForTesting(prisma);

	const org = db.seedOrg({ id: "org_main", name: "Main", slug: "main" });
	const tokens = {} as Record<OrganizationRole, string>;

	for (const role of ALL_ROLES) {
		const userId = `usr_${role.toLowerCase()}`;
		db.seedUser({
			id: userId,
			email: `${role.toLowerCase()}@example.com`,
			displayName: role,
			role: UserRole.AGRONOMIST,
			activeOrganizationId: org.id,
		});
		db.seedMembership({
			userId,
			organizationId: org.id,
			role,
		});
		const issued = await issueAccessToken(userId, org.id);
		tokens[role] = issued.token;
	}

	// Owner is the canonical "author" of pre-seeded resources used by
	// the report-write gate test below.
	const ownerId = `usr_${OrganizationRole.OWNER.toLowerCase()}`;
	const project = db.seedProject({
		id: "prj_main",
		userId: ownerId,
		organizationId: org.id,
	});
	const sample = db.seedSample({
		id: "smp_main",
		userId: ownerId,
		organizationId: org.id,
		projectId: project.id,
	});
	const test = db.seedTest({
		id: "tst_main",
		sampleId: sample.id,
		organizationId: org.id,
	});
	const report = db.seedReport({
		id: "rpt_main",
		soilTestId: test.id,
		organizationId: org.id,
	});

	return {
		db,
		orgId: org.id,
		projectId: project.id,
		reportId: report.id,
		tokens,
	};
}

let fx: Fixture;

beforeAll(async () => {
	fx = await seedFixture();
});

beforeEach(async () => {
	fx = await seedFixture();
});

afterAll(() => {
	setPrismaClientForTesting(null);
});

describe("Phase 9A-D.7 — POST /api/v2/projects (ROLES_AGRONOMY_WRITE)", () => {
	for (const role of ALL_ROLES) {
		const allowed = AGRONOMY_WRITE.includes(role);
		it(`${role} ${allowed ? "may" : "must NOT"} create a project`, async () => {
			const res = await request(app)
				.post("/api/v2/projects")
				.set("Authorization", `Bearer ${fx.tokens[role]}`)
				.send({ name: `Project for ${role}` });
			if (allowed) {
				expect(res.status).toBe(201);
				expect(res.body.project.name).toBe(`Project for ${role}`);
			} else {
				expect(res.status).toBe(403);
				expect(res.body.error.code).toBe("FORBIDDEN");
			}
		});
	}
});

describe("Phase 9A-D.7 — POST /api/v2/soil-samples (ROLES_LAB_WRITE)", () => {
	for (const role of ALL_ROLES) {
		const allowed = LAB_WRITE.includes(role);
		it(`${role} ${allowed ? "may" : "must NOT"} create a soil sample`, async () => {
			const res = await request(app)
				.post("/api/v2/soil-samples")
				.set("Authorization", `Bearer ${fx.tokens[role]}`)
				.send({ projectId: fx.projectId });
			if (allowed) {
				expect(res.status).toBe(201);
				expect(res.body.sample.projectId).toBe(fx.projectId);
			} else {
				expect(res.status).toBe(403);
				expect(res.body.error.code).toBe("FORBIDDEN");
			}
		});
	}
});

describe("Phase 9A-D.7 — POST /api/v2/reports/:reportId/regenerate (ROLES_REPORT_WRITE)", () => {
	for (const role of ALL_ROLES) {
		const allowed = REPORT_WRITE.includes(role);
		it(`${role} ${allowed ? "passes" : "is blocked by"} the role gate`, async () => {
			const res = await request(app)
				.post(`/api/v2/reports/${fx.reportId}/regenerate`)
				.set("Authorization", `Bearer ${fx.tokens[role]}`)
				.send({});
			if (allowed) {
				// Past the role gate: the regenerate pipeline is intentionally
				// not exercised here (it depends on the full report assembler
				// + Prisma surface). All we assert is that the request was NOT
				// rejected by the authorization guard.
				expect(res.status).not.toBe(403);
			} else {
				expect(res.status).toBe(403);
				expect(res.body.error.code).toBe("FORBIDDEN");
			}
		});
	}
});

describe("Phase 9A-D.7 — read access is open to every role in the org", () => {
	for (const role of ALL_ROLES) {
		it(`${role} can read the project (GET /projects/:projectId)`, async () => {
			const res = await request(app)
				.get(`/api/v2/projects/${fx.projectId}`)
				.set("Authorization", `Bearer ${fx.tokens[role]}`);
			expect(res.status).toBe(200);
			expect(res.body.project.id).toBe(fx.projectId);
		});
	}
});
