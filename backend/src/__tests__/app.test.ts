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
 * Phase 9A-E hardened the default: `ALLOW_DEV_AUTH` is now `false` in
 * every environment. This smoke suite still exercises the dev-auth
 * fallback (so validation + 404 paths stay coverable without a live
 * database + real JWTs), so it explicitly opts in by setting the env
 * var BEFORE the first import that materialises the `env` proxy and
 * calls `_resetEnvForTesting` to drop any value cached by a previous
 * suite.
 */

// MUST run before importing `createApp` / `../app` so the env proxy
// reads ALLOW_DEV_AUTH=true on first access.
process.env.ALLOW_DEV_AUTH = "true";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";

import { UserRole } from "@flaha/shared-types";

import { createApp } from "../app";
import { DEV_USER_ID } from "../auth/currentUser";
import { _resetEnvForTesting } from "../config/env";
import {
	type PrismaClientLike,
	setPrismaClientForTesting,
} from "../prisma/client";

_resetEnvForTesting();
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

// Phase 9A — `ensureDevUser` now also upserts the Flaha Demo
// organization and an OWNER membership for the dev user. The stubs
// below return shapes good enough for the middleware to succeed; the
// tests in this file do not assert on org / membership fields.
const demoOrgRow = {
	id: "org_flaha_demo",
	name: "Flaha Demo",
	slug: "flaha-demo",
	type: "COMPANY",
	status: "ACTIVE",
	createdAt: new Date("2024-01-01T00:00:00.000Z"),
	updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};
const devMembershipRow = {
	id: "mbr_dev_admin_demo",
	organizationId: "org_flaha_demo",
	userId: DEV_USER_ID,
	role: "OWNER",
	status: "ACTIVE",
	invitedById: null,
	invitedAt: null,
	acceptedAt: new Date("2024-01-01T00:00:00.000Z"),
	createdAt: new Date("2024-01-01T00:00:00.000Z"),
	updatedAt: new Date("2024-01-01T00:00:00.000Z"),
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
	// Phase 9A — multi-tenant + auth delegates. Only `upsert` is wired
	// because `ensureDevUser` is the sole caller exercised here.
	organization: {
		upsert: async () => demoOrgRow,
		findUnique: async () => demoOrgRow,
		findFirst: async () => demoOrgRow,
		findMany: async () => [demoOrgRow],
		create: async () => demoOrgRow,
		update: async () => demoOrgRow,
		delete: async () => demoOrgRow,
	} as unknown as PrismaClientLike["organization"],
	organizationMembership: {
		upsert: async () => devMembershipRow,
		findUnique: async () => devMembershipRow,
		findFirst: async () => devMembershipRow,
		findMany: async () => [devMembershipRow],
		create: async () => devMembershipRow,
		update: async () => devMembershipRow,
		delete: async () => devMembershipRow,
	} as unknown as PrismaClientLike["organizationMembership"],
	refreshToken: {} as PrismaClientLike["refreshToken"],
	auditLog: {} as PrismaClientLike["auditLog"],
	soilTextureInput: {} as PrismaClientLike["soilTextureInput"],
	soilChemistryInput: {} as PrismaClientLike["soilChemistryInput"],
	soilPhysicsResult: {} as PrismaClientLike["soilPhysicsResult"],
	soilChemistryResult: {} as PrismaClientLike["soilChemistryResult"],
	soilInterpretation: {} as PrismaClientLike["soilInterpretation"],
	soilReport: {} as PrismaClientLike["soilReport"],
	reportVersion: {} as PrismaClientLike["reportVersion"],
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

describe("security headers (Phase 9A-I)", () => {
	it("sets the locked-down CSP and core hardening headers on JSON API responses", async () => {
		const res = await request(app).get("/healthz");
		expect(res.status).toBe(200);
		expect(res.headers["content-security-policy"]).toContain(
			"default-src 'none'"
		);
		expect(res.headers["content-security-policy"]).toContain(
			"frame-ancestors 'none'"
		);
		expect(res.headers["x-content-type-options"]).toBe("nosniff");
		expect(res.headers["referrer-policy"]).toBe("no-referrer");
		// x-powered-by must be stripped so the framework is not leaked.
		expect(res.headers["x-powered-by"]).toBeUndefined();
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
			.send({ projectId: "p_1", latitude: 999 })
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
