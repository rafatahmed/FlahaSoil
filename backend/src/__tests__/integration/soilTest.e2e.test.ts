/**
 * FlahaSOIL v2 — DB-backed end-to-end flow.
 *
 * Exercises the full happy path through the v2 HTTP surface against a
 * real PostgreSQL database (and the generated Prisma v2 client):
 *
 *   1. POST  /api/v2/soil-samples          → create sample
 *   2. POST  /api/v2/soil-tests            → create test (PRELIMINARY +
 *                                            MODERATE inputs in one body)
 *   3. POST  /api/v2/soil-tests/:id/calculate
 *                                          → physics + chemistry +
 *                                            interpretation
 *   4. GET   /api/v2/soil-tests/:id        → fetch persisted state
 *   5. GET   /api/v2/soil-tests/:id/flahacalc-export
 *                                          → downstream projection
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

describeIfDb()("v2 end-to-end flow (DB-backed)", () => {
	it("creates project → sample → test → calculation → fetch → flahacalc-export", async () => {
		// 0. Create the owning project (Phase 8A — required parent).
		const projectRes = await request(app)
			.post("/api/v2/projects")
			.send({ userId: "user_e2e", name: "E2E Project" })
			.set("Content-Type", "application/json");
		expect(projectRes.status).toBe(201);
		const projectId = projectRes.body.project.id as string;

		// 1. Create sample bound to the project.
		const sampleRes = await request(app)
			.post("/api/v2/soil-samples")
			.send({
				userId: "user_e2e",
				projectId,
				locationName: "E2E Field",
				latitude: 25.276987,
				longitude: 51.520008,
				depthFromCm: 0,
				depthToCm: 30,
			})
			.set("Content-Type", "application/json");
		expect(sampleRes.status).toBe(201);
		const sampleId = sampleRes.body.sample.id as string;
		expect(typeof sampleId).toBe("string");

		// 2. Create test with PRELIMINARY + MODERATE inputs.
		const testRes = await request(app)
			.post("/api/v2/soil-tests")
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
			})
			.set("Content-Type", "application/json");
		expect(testRes.status).toBe(201);
		const soilTestId = testRes.body.soilTest.id as string;

		// 3. Calculate (physics + chemistry + interpretation).
		const calcRes = await request(app)
			.post(`/api/v2/soil-tests/${soilTestId}/calculate`)
			.send({
				runPhysics: true,
				runChemistry: true,
				runInterpretation: true,
				calculationMode: "LAB",
			})
			.set("Content-Type", "application/json");
		expect(calcRes.status).toBe(200);
		expect(calcRes.body.physicsResult).toBeDefined();
		expect(calcRes.body.chemistryResult).toBeDefined();
		expect(calcRes.body.interpretation).toBeDefined();
		expect(Array.isArray(calcRes.body.warnings)).toBe(true);

		// 4. Fetch the persisted soil test.
		const getRes = await request(app).get(
			`/api/v2/soil-tests/${soilTestId}`
		);
		expect(getRes.status).toBe(200);
		expect(getRes.body.soilTest.id).toBe(soilTestId);
		expect(getRes.body.physicsResult).toBeDefined();
		expect(getRes.body.chemistryResult).toBeDefined();
		expect(getRes.body.interpretation).toBeDefined();

		// 5. FlahaCalc export.
		const expRes = await request(app).get(
			`/api/v2/soil-tests/${soilTestId}/flahacalc-export`
		);
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
