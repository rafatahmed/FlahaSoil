/**
 * FlahaSOIL v2 API — HTTP smoke tests.
 *
 * Mounts the Express app via `createApp()` into supertest and asserts
 * the contract surface that does not require a database:
 *   - GET /healthz returns 200 with the service tag
 *   - Unknown routes return 404 with the standard ApiErrorResponse envelope
 *   - Malformed POST /api/v2/soil-samples returns 400 from the Zod
 *     schema, normalised into the same envelope by `errorHandler`
 *
 * Tests that exercise success paths through Prisma are intentionally
 * out of scope — they require the v2 client to be generated against a
 * live PostgreSQL datasource and belong to a future integration suite.
 *
 * Phase 8B wired `devSessionMiddleware` in front of every `/api/v2/*`
 * route; that middleware calls `ensureDevUser()` which hits Prisma.
 * The suite below injects a minimal stub Prisma client via
 * `setPrismaClientForTesting` so the validation + 404 paths stay
 * exercisable without a live database.
 */

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

import { UserRole } from "@flaha/shared-types";

import { createApp } from "../app";
import { DEV_USER_ID } from "../auth/currentUser";
import {
	type PrismaClientLike,
	setPrismaClientForTesting,
} from "../prisma/client";

const app = createApp();

const devUserRow = {
	id: DEV_USER_ID,
	email: "dev@flahasoil.local",
	displayName: "Development User",
	role: UserRole.ADMIN,
	createdAt: new Date("2024-01-01T00:00:00.000Z"),
	updatedAt: new Date("2024-01-01T00:00:00.000Z"),
	archivedAt: null,
};

function notImplemented(name: string): never {
	throw new Error(`stub prisma client: ${name} not implemented in app.test.ts`);
}

const stubPrisma: PrismaClientLike = {
	$connect: async () => undefined,
	$disconnect: async () => undefined,
	$transaction: async (fn) => fn(stubPrisma),
	user: {
		upsert: async () => devUserRow,
		findUnique: async () => devUserRow,
		findFirst: async () => devUserRow,
		findMany: async () => [devUserRow],
		create: async () => devUserRow,
		update: async () => devUserRow,
		delete: async () => devUserRow,
	},
	project: {
		upsert: () => notImplemented("project.upsert"),
		findUnique: async () => null,
		findFirst: async () => null,
		findMany: async () => [],
		create: () => notImplemented("project.create"),
		update: () => notImplemented("project.update"),
		delete: () => notImplemented("project.delete"),
	},
	soilSample: {
		upsert: () => notImplemented("soilSample.upsert"),
		findUnique: async () => null,
		findFirst: async () => null,
		findMany: async () => [],
		create: () => notImplemented("soilSample.create"),
		update: () => notImplemented("soilSample.update"),
		delete: () => notImplemented("soilSample.delete"),
	},
	soilTest: {
		upsert: () => notImplemented("soilTest.upsert"),
		findUnique: async () => null,
		findFirst: async () => null,
		findMany: async () => [],
		create: () => notImplemented("soilTest.create"),
		update: () => notImplemented("soilTest.update"),
		delete: () => notImplemented("soilTest.delete"),
	},
	soilTextureInput: {} as PrismaClientLike["soilTextureInput"],
	soilChemistryInput: {} as PrismaClientLike["soilChemistryInput"],
	soilPhysicsResult: {} as PrismaClientLike["soilPhysicsResult"],
	soilChemistryResult: {} as PrismaClientLike["soilChemistryResult"],
	soilInterpretation: {} as PrismaClientLike["soilInterpretation"],
	soilReport: {} as PrismaClientLike["soilReport"],
	soilLabValue: {} as PrismaClientLike["soilLabValue"],
};

beforeAll(() => {
	setPrismaClientForTesting(stubPrisma);
});

afterAll(() => {
	setPrismaClientForTesting(null);
});

describe("liveness probes", () => {
	it("GET /health returns 200 with the service identifier", async () => {
		const res = await request(app).get("/health");
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({
			status: "ok",
			service: "flaha-soil-v2-api",
		});
	});

	it("GET /healthz returns the same payload (alias)", async () => {
		const res = await request(app).get("/healthz");
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({
			status: "ok",
			service: "flaha-soil-v2-api",
		});
	});
});

describe("404 fallthrough", () => {
	it("returns the standard error envelope for unknown routes", async () => {
		const res = await request(app).get("/api/v2/does-not-exist");
		expect(res.status).toBe(404);
		expect(res.body).toEqual({
			error: {
				code: "NOT_FOUND",
				message: expect.stringContaining("/api/v2/does-not-exist"),
			},
		});
	});
});

describe("POST /api/v2/soil-samples — input validation", () => {
	it("returns 400 VALIDATION_ERROR for an empty body", async () => {
		const res = await request(app)
			.post("/api/v2/soil-samples")
			.send({})
			.set("Content-Type", "application/json");
		expect(res.status).toBe(400);
		expect(res.body.error.code).toBe("VALIDATION_ERROR");
		expect(Array.isArray(res.body.error.details)).toBe(true);
		expect(res.body.error.details.length).toBeGreaterThan(0);
	});

	it("returns 400 with a path-keyed detail when latitude is out of range", async () => {
		const res = await request(app)
			.post("/api/v2/soil-samples")
			.send({ userId: "u_1", projectId: "p_1", latitude: 999 })
			.set("Content-Type", "application/json");
		expect(res.status).toBe(400);
		expect(res.body.error.code).toBe("VALIDATION_ERROR");
		const paths: string[] = res.body.error.details.map(
			(d: { path: string }) => d.path
		);
		expect(paths).toContain("latitude");
	});

	it("returns 400 with a depthToCm detail when depths are inverted", async () => {
		const res = await request(app)
			.post("/api/v2/soil-samples")
			.send({
				userId: "u_1",
				projectId: "p_1",
				depthFromCm: 50,
				depthToCm: 10,
			})
			.set("Content-Type", "application/json");
		expect(res.status).toBe(400);
		const paths: string[] = res.body.error.details.map(
			(d: { path: string }) => d.path
		);
		expect(paths).toContain("depthToCm");
	});
});
