/**
 * FlahaSOIL v2 — DB-backed end-to-end flow.
 *
 * Exercises the full happy path through the v2 HTTP surface against a
 * real PostgreSQL database (and the generated Prisma v2 client):
 *
 *   0. POST  /api/v2/auth/register         → register a fresh user
 *                                            (returns access token +
 *                                            personal organization +
 *                                            OWNER membership)
 *   1. POST  /api/v2/projects              → create project
 *   2. POST  /api/v2/soil-samples          → create sample
 *   3. POST  /api/v2/soil-tests            → create test (PRELIMINARY +
 *                                            MODERATE inputs in one body)
 *   4. POST  /api/v2/soil-tests/:id/calculate
 *                                          → physics + chemistry +
 *                                            interpretation
 *   5. GET   /api/v2/soil-tests/:id        → fetch persisted state
 *   6. GET   /api/v2/soil-tests/:id/flahacalc-export
 *                                          → downstream projection
 *
 * Phase 9A-D: every protected request carries `Authorization: Bearer
 * <accessToken>` issued by the register endpoint, exercising the real
 * JWT auth path end-to-end (no dev-auth fallback). The user is created
 * with a unique email per run so the suite is idempotent against the
 * non-truncated `user` / `organization` / `refreshToken` tables.
 *
 * The whole suite is gated on `getIntegrationDb`. When the harness
 * reports the database is unavailable (no `DATABASE_URL_V2`, db name
 * does not contain `test`, client not generated, or connection fails),
 * the suite is skipped with a clear reason. It NEVER fails the build
 * because the database is missing.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";

import { createApp } from "../../app";
import { SoilTestLevel, SoilValueSource } from "@flaha/shared-types";
import {
	getIntegrationDb,
	releaseIntegrationDb,
	resetIntegrationDb,
	type TestDbAvailability,
} from "./testDatabase";
import type { PrismaClientLike } from "../../prisma/client";

let availability: TestDbAvailability;
let client: PrismaClientLike | null = null;
let app: Express;

beforeAll(async () => {
	availability = await getIntegrationDb();
	if (availability.available) {
		client = availability.client;
		await resetIntegrationDb(client);
		app = createApp();
	}
});

afterAll(async () => {
	if (client) {
		await releaseIntegrationDb(client);
	}
});

const describeIfDb = () =>
	availability?.available ? describe : describe.skip;

/**
 * Registers a fresh user with a unique email and returns the access
 * token so the rest of the e2e flow can authenticate as the new tenant
 * owner. Password meets the policy enforced by `assertPasswordPolicy`.
 */
async function registerE2EUser(): Promise<string> {
	const suffix = `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
	const res = await request(app)
		.post("/api/v2/auth/register")
		.send({
			email: `e2e-${suffix}@flahasoil.test`,
			password: "CorrectHorseBattery42!",
			displayName: `E2E User ${suffix}`,
		})
		.set("Content-Type", "application/json");
	expect(res.status).toBe(201);
	const accessToken = res.body?.session?.accessToken as string | undefined;
	expect(typeof accessToken).toBe("string");
	expect((accessToken ?? "").length).toBeGreaterThan(20);
	return accessToken as string;
}

describeIfDb()("v2 end-to-end flow (DB-backed)", () => {
	it("registers → project → sample → test → calculation → fetch → flahacalc-export", async () => {
		// 0. Register a brand-new tenant owner and capture the JWT.
		const accessToken = await registerE2EUser();
		const bearer = `Bearer ${accessToken}`;

		// 1. Create the owning project (Phase 8A — required parent).
		const projectRes = await request(app)
			.post("/api/v2/projects")
			.set("Authorization", bearer)
			.set("Content-Type", "application/json")
			.send({ name: "E2E Project" });
		expect(projectRes.status).toBe(201);
		const projectId = projectRes.body.project.id as string;

		// 2. Create sample bound to the project.
		const sampleRes = await request(app)
			.post("/api/v2/soil-samples")
			.set("Authorization", bearer)
			.set("Content-Type", "application/json")
			.send({
				projectId,
				locationName: "E2E Field",
				latitude: 25.276987,
				longitude: 51.520008,
				depthFromCm: 0,
				depthToCm: 30,
			});
		expect(sampleRes.status).toBe(201);
		const sampleId = sampleRes.body.sample.id as string;
		expect(typeof sampleId).toBe("string");

		// 3. Create test with PRELIMINARY + MODERATE inputs.
		const testRes = await request(app)
			.post("/api/v2/soil-tests")
			.set("Authorization", bearer)
			.set("Content-Type", "application/json")
			.send({
				sampleId,
				testLevel: SoilTestLevel.MODERATE,
				labName: "E2E Lab",
				textureInput: {
					sandPercent: 40,
					siltPercent: 40,
					clayPercent: 20,
					organicMatterPercent: 2.5,
					bulkDensity: 1.35,
					gravelPercent: 0,
					source: SoilValueSource.LAB,
				},
				chemistryInput: {
					pH: 7.4,
					ecDsM: 0.8,
					cec: 18.2,
					ca: 11,
					mg: 2.3,
					k: 0.7,
					na: 0.4,
					n: 25,
					p: 18,
					source: SoilValueSource.LAB,
				},
			});
		expect(testRes.status).toBe(201);
		const soilTestId = testRes.body.soilTest.id as string;

		// 4. Calculate (physics + chemistry + interpretation).
		const calcRes = await request(app)
			.post(`/api/v2/soil-tests/${soilTestId}/calculate`)
			.set("Authorization", bearer)
			.set("Content-Type", "application/json")
			.send({
				runPhysics: true,
				runChemistry: true,
				runInterpretation: true,
				calculationMode: "LAB",
			});
		expect(calcRes.status).toBe(200);
		expect(calcRes.body.physicsResult).toBeDefined();
		expect(calcRes.body.chemistryResult).toBeDefined();
		expect(calcRes.body.interpretation).toBeDefined();
		expect(Array.isArray(calcRes.body.warnings)).toBe(true);

		// 5. Fetch the persisted soil test.
		const getRes = await request(app)
			.get(`/api/v2/soil-tests/${soilTestId}`)
			.set("Authorization", bearer);
		expect(getRes.status).toBe(200);
		expect(getRes.body.soilTest.id).toBe(soilTestId);
		expect(getRes.body.physicsResult).toBeDefined();
		expect(getRes.body.chemistryResult).toBeDefined();
		expect(getRes.body.interpretation).toBeDefined();

		// 6. FlahaCalc export.
		const expRes = await request(app)
			.get(`/api/v2/soil-tests/${soilTestId}/flahacalc-export`)
			.set("Authorization", bearer);
		expect(expRes.status).toBe(200);
		const exp = expRes.body;
		expect(exp.soilTestId).toBe(soilTestId);
		expect(typeof exp.textureClass).toBe("string");
		expect(typeof exp.fieldCapacity).toBe("number");
		expect(typeof exp.wiltingPoint).toBe("number");
		expect(typeof exp.plantAvailableWater).toBe("number");
		expect(typeof exp.cec).toBe("number");
		expect(Array.isArray(exp.warnings)).toBe(true);
	});
});

// Surface skip reason in the test output when the DB is not available.
if (availability && !availability.available) {
	console.warn(`[soilTest.e2e] skipped: ${availability.reason}`);
}
