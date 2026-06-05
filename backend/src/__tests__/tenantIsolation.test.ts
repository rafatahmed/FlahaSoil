/**
 * FlahaSOIL v2 API — cross-tenant isolation tests (Phase 9A-D.7).
 *
 * Verifies that a user authenticated against organization B cannot
 * read or address resources belonging to organization A, even when
 * they hold a valid JWT and reference the foreign resource by id.
 *
 * The route-level `requireProjectAccess` / `requireSampleAccess` /
 * `requireSoilTestAccess` / `requireReportAccess` guards call the
 * `assert*Tenancy` helpers in `auth/ownership.ts`, which intentionally
 * return 404 (not 403) on a cross-tenant match so the API never leaks
 * the existence of another tenant's row.
 *
 * Backed by the multi-tenant in-memory Prisma stub in
 * `_helpers/multiTenantStub.ts` so the suite runs without a database.
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

interface Fixture {
	db: MultiTenantDb;
	aliceToken: string;
	bobToken: string;
	orgA: string;
	orgB: string;
	projectAId: string;
	sampleAId: string;
	testAId: string;
	reportAId: string;
}

async function seedFixture(): Promise<Fixture> {
	const { prisma, db } = makeMultiTenantStub();
	setPrismaClientForTesting(prisma);

	const orgA = db.seedOrg({ id: "org_a", name: "Org A", slug: "org-a" });
	const orgB = db.seedOrg({ id: "org_b", name: "Org B", slug: "org-b" });

	const alice = db.seedUser({
		id: "usr_alice",
		email: "alice@example.com",
		displayName: "Alice",
		role: UserRole.AGRONOMIST,
		activeOrganizationId: orgA.id,
	});
	const bob = db.seedUser({
		id: "usr_bob",
		email: "bob@example.com",
		displayName: "Bob",
		role: UserRole.AGRONOMIST,
		activeOrganizationId: orgB.id,
	});
	db.seedMembership({
		userId: alice.id,
		organizationId: orgA.id,
		role: OrganizationRole.OWNER,
	});
	db.seedMembership({
		userId: bob.id,
		organizationId: orgB.id,
		role: OrganizationRole.OWNER,
	});

	const project = db.seedProject({
		id: "prj_a",
		userId: alice.id,
		organizationId: orgA.id,
		name: "Alice's Project",
	});
	const sample = db.seedSample({
		id: "smp_a",
		userId: alice.id,
		organizationId: orgA.id,
		projectId: project.id,
	});
	const test = db.seedTest({
		id: "tst_a",
		sampleId: sample.id,
		organizationId: orgA.id,
	});
	const report = db.seedReport({
		id: "rpt_a",
		soilTestId: test.id,
		organizationId: orgA.id,
	});

	const aliceIssued = await issueAccessToken(alice.id, orgA.id);
	const bobIssued = await issueAccessToken(bob.id, orgB.id);

	return {
		db,
		aliceToken: aliceIssued.token,
		bobToken: bobIssued.token,
		orgA: orgA.id,
		orgB: orgB.id,
		projectAId: project.id,
		sampleAId: sample.id,
		testAId: test.id,
		reportAId: report.id,
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

describe("Phase 9A-D.7 — cross-tenant access returns 404", () => {
	it("rejects Bob's read of Alice's project as NOT_FOUND", async () => {
		const res = await request(app)
			.get(`/api/v2/projects/${fx.projectAId}`)
			.set("Authorization", `Bearer ${fx.bobToken}`);
		expect(res.status).toBe(404);
		expect(res.body.error.code).toBe("NOT_FOUND");
	});

	it("rejects Bob's read of Alice's soil sample as NOT_FOUND", async () => {
		const res = await request(app)
			.get(`/api/v2/soil-samples/${fx.sampleAId}`)
			.set("Authorization", `Bearer ${fx.bobToken}`);
		expect(res.status).toBe(404);
		expect(res.body.error.code).toBe("NOT_FOUND");
	});

	it("rejects Bob's read of Alice's soil test as NOT_FOUND", async () => {
		const res = await request(app)
			.get(`/api/v2/soil-tests/${fx.testAId}`)
			.set("Authorization", `Bearer ${fx.bobToken}`);
		expect(res.status).toBe(404);
		expect(res.body.error.code).toBe("NOT_FOUND");
	});

	it("rejects Bob's read of Alice's report as NOT_FOUND", async () => {
		const res = await request(app)
			.get(`/api/v2/reports/${fx.reportAId}`)
			.set("Authorization", `Bearer ${fx.bobToken}`);
		expect(res.status).toBe(404);
		expect(res.body.error.code).toBe("NOT_FOUND");
	});

	it("rejects Bob's read of Alice's report versions as NOT_FOUND", async () => {
		const res = await request(app)
			.get(`/api/v2/reports/${fx.reportAId}/versions`)
			.set("Authorization", `Bearer ${fx.bobToken}`);
		expect(res.status).toBe(404);
		expect(res.body.error.code).toBe("NOT_FOUND");
	});

	it("rejects Bob's project-scoped report list as NOT_FOUND", async () => {
		const res = await request(app)
			.get(`/api/v2/projects/${fx.projectAId}/reports`)
			.set("Authorization", `Bearer ${fx.bobToken}`);
		expect(res.status).toBe(404);
		expect(res.body.error.code).toBe("NOT_FOUND");
	});

	it("returns an empty projects list for Bob (Alice's projects do not leak)", async () => {
		const res = await request(app)
			.get(`/api/v2/projects`)
			.set("Authorization", `Bearer ${fx.bobToken}`);
		expect(res.status).toBe(200);
		expect(res.body.projects).toEqual([]);
	});

	it("returns Alice's project to Alice (positive control)", async () => {
		const res = await request(app)
			.get(`/api/v2/projects/${fx.projectAId}`)
			.set("Authorization", `Bearer ${fx.aliceToken}`);
		expect(res.status).toBe(200);
		expect(res.body.project.id).toBe(fx.projectAId);
	});
});

describe("Phase 9A-D.7 — auth failures on protected routes", () => {
	it("rejects a malformed bearer token with 401", async () => {
		const res = await request(app)
			.get(`/api/v2/projects/${fx.projectAId}`)
			.set("Authorization", "Bearer not-a-real-jwt");
		expect(res.status).toBe(401);
		expect(res.body.error.code).toBe("UNAUTHORIZED");
	});
});
