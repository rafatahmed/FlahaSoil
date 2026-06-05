/**
 * FlahaSOIL v2 API — auth HTTP integration tests (Phase 9A-C).
 *
 * Exercises the wire protocol from register → login → me → refresh →
 * logout against a supertest agent. The agent persists cookies across
 * requests so the HttpOnly refresh-token cookie is automatically
 * carried back to /refresh and /logout, exactly as a browser would.
 *
 * Backed by the same in-memory Prisma stub used by the auth service
 * unit tests — the goal here is to validate the controller + routing
 * + cookie handling, not the underlying SQL.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import request from "supertest";

import { createApp } from "../app";
import {
	type PrismaClientLike,
	setPrismaClientForTesting,
} from "../prisma/client";

interface StubState {
	users: Map<string, Record<string, unknown>>;
	usersByEmail: Map<string, string>;
	orgs: Map<string, Record<string, unknown>>;
	orgsBySlug: Map<string, string>;
	memberships: Array<Record<string, unknown>>;
	refreshTokens: Map<string, Record<string, unknown>>;
	auditLogs: Array<Record<string, unknown>>;
	idCounter: number;
}

function nextId(s: StubState, p: string): string {
	s.idCounter += 1;
	return `${p}_${s.idCounter}`;
}

function makeStub(): { prisma: PrismaClientLike; state: StubState } {
	const state: StubState = {
		users: new Map(),
		usersByEmail: new Map(),
		orgs: new Map(),
		orgsBySlug: new Map(),
		memberships: [],
		refreshTokens: new Map(),
		auditLogs: [],
		idCounter: 0,
	};
	const stub = {
		$connect: async () => undefined,
		$disconnect: async () => undefined,
		$transaction: async <R>(fn: (tx: PrismaClientLike) => Promise<R>) =>
			fn(stub as unknown as PrismaClientLike),
		user: {
			upsert: async (args: {
				where: Record<string, unknown>;
				create: Record<string, unknown>;
				update: Record<string, unknown>;
			}) => {
				const id = (args.where["id"] as string) ?? nextId(state, "user");
				const existing = state.users.get(id);
				const now = new Date();
				const row = existing
					? { ...existing, ...args.update, updatedAt: now }
					: { id, ...args.create, createdAt: now, updatedAt: now, archivedAt: null };
				state.users.set(id, row);
				if (typeof row["email"] === "string") {
					state.usersByEmail.set(row["email"] as string, id);
				}
				return row;
			},
			findUnique: async (args: { where: Record<string, unknown> }) => {
				if (typeof args.where["email"] === "string") {
					const id = state.usersByEmail.get(args.where["email"] as string);
					return id ? (state.users.get(id) ?? null) : null;
				}
				if (typeof args.where["id"] === "string") {
					return state.users.get(args.where["id"] as string) ?? null;
				}
				return null;
			},
			create: async (args: { data: Record<string, unknown> }) => {
				const id = nextId(state, "user");
				const now = new Date();
				const row = {
					id,
					...args.data,
					createdAt: now,
					updatedAt: now,
					archivedAt: null,
				};
				state.users.set(id, row);
				state.usersByEmail.set(row["email"] as string, id);
				return row;
			},
		},
		organization: {
			upsert: async (args: {
				where: Record<string, unknown>;
				create: Record<string, unknown>;
			}) => {
				const id = (args.where["id"] as string) ?? nextId(state, "org");
				const now = new Date();
				const existing = state.orgs.get(id);
				const row = existing
					? { ...existing, updatedAt: now }
					: { id, ...args.create, createdAt: now, updatedAt: now };
				state.orgs.set(id, row);
				if (typeof row["slug"] === "string") {
					state.orgsBySlug.set(row["slug"] as string, id);
				}
				return row;
			},
			findUnique: async (args: { where: Record<string, unknown> }) => {
				if (typeof args.where["slug"] === "string") {
					const id = state.orgsBySlug.get(args.where["slug"] as string);
					return id ? (state.orgs.get(id) ?? null) : null;
				}
				if (typeof args.where["id"] === "string") {
					return state.orgs.get(args.where["id"] as string) ?? null;
				}
				return null;
			},
			create: async (args: { data: Record<string, unknown> }) => {
				const id = nextId(state, "org");
				const now = new Date();
				const row = { id, ...args.data, createdAt: now, updatedAt: now };
				state.orgs.set(id, row);
				state.orgsBySlug.set(row["slug"] as string, id);
				return row;
			},
		},
		organizationMembership: {
			upsert: async (args: {
				where: Record<string, unknown>;
				create: Record<string, unknown>;
			}) => {
				const now = new Date();
				const row = { id: nextId(state, "mbr"), ...args.create, createdAt: now, updatedAt: now };
				state.memberships.push(row);
				return row;
			},
			create: async (args: { data: Record<string, unknown> }) => {
				const id = nextId(state, "mbr");
				const now = new Date();
				const row = { id, ...args.data, createdAt: now, updatedAt: now };
				state.memberships.push(row);
				return row;
			},
			findMany: async (args: { where: Record<string, unknown> }) => {
				return state.memberships
					.filter(
						(m) =>
							m["userId"] === args.where["userId"] &&
							m["status"] === (args.where["status"] ?? "ACTIVE")
					)
					.map((m) => ({
						...m,
						organization: state.orgs.get(m["organizationId"] as string),
					}));
			},
		},
		refreshToken: {
			create: async (args: { data: Record<string, unknown> }) => {
				const id = nextId(state, "rt");
				const row = { id, ...args.data, revokedAt: null };
				state.refreshTokens.set(id, row);
				return row;
			},
			findUnique: async (args: { where: Record<string, unknown> }) => {
				const hash = args.where["tokenHash"];
				for (const row of state.refreshTokens.values()) {
					if (row["tokenHash"] === hash) return row;
				}
				return null;
			},
			update: async (args: {
				where: { id: string };
				data: Record<string, unknown>;
			}) => {
				const row = state.refreshTokens.get(args.where.id);
				if (!row) throw new Error("not found");
				Object.assign(row, args.data);
				return row;
			},
			updateMany: async (args: {
				where: Record<string, unknown>;
				data: Record<string, unknown>;
			}) => {
				let count = 0;
				for (const row of state.refreshTokens.values()) {
					if (
						row["familyId"] === args.where["familyId"] &&
						(args.where["revokedAt"] === undefined ||
							row["revokedAt"] === args.where["revokedAt"])
					) {
						Object.assign(row, args.data);
						count += 1;
					}
				}
				return { count };
			},
		},
		auditLog: {
			create: async (args: { data: Record<string, unknown> }) => {
				state.auditLogs.push(args.data);
				return { id: nextId(state, "audit"), ...args.data };
			},
		},
	} as unknown as PrismaClientLike;
	return { prisma: stub, state };
}

const app = createApp();
let currentState: StubState;

beforeAll(() => {
	const built = makeStub();
	currentState = built.state;
	setPrismaClientForTesting(built.prisma);
});

beforeEach(() => {
	// Fresh state between tests so refresh-token rotation chains don't
	// bleed across cases.
	const built = makeStub();
	currentState = built.state;
	setPrismaClientForTesting(built.prisma);
});

afterAll(() => {
	setPrismaClientForTesting(null);
});

const VALID_PASSWORD = "CorrectHorse42!";
const TEST_TIMEOUT = 20_000;

describe("POST /api/v2/auth/register", () => {
	it(
		"returns 201, sets HttpOnly refresh cookie, and returns the session",
		async () => {
			const res = await request(app)
				.post("/api/v2/auth/register")
				.send({
					email: "alice@example.com",
					password: VALID_PASSWORD,
					displayName: "Alice",
				});

			expect(res.status).toBe(201);
			expect(res.body.session.user.email).toBe("alice@example.com");
			expect(res.body.session.activeOrganization?.name).toBe(
				"Alice's workspace"
			);
			expect(typeof res.body.session.accessToken).toBe("string");

			const setCookie = res.headers["set-cookie"];
			expect(setCookie).toBeDefined();
			const cookieStr = Array.isArray(setCookie)
				? setCookie.join("\n")
				: String(setCookie);
			expect(cookieStr).toMatch(/fsoil_rt=/);
			expect(cookieStr).toMatch(/HttpOnly/i);
			expect(cookieStr).toMatch(/Path=\/api\/v2\/auth/i);
		},
		TEST_TIMEOUT
	);

	it("returns 400 on missing fields", async () => {
		const res = await request(app).post("/api/v2/auth/register").send({
			email: "bob@example.com",
		});
		expect(res.status).toBe(400);
		expect(res.body.error.code).toBe("VALIDATION_ERROR");
	});
});

describe("POST /api/v2/auth/login → /refresh → /me → /logout", () => {
	it(
		"completes the full session lifecycle",
		async () => {
			const agent = request.agent(app);
			// Provision an account up front.
			const reg = await agent.post("/api/v2/auth/register").send({
				email: "carol@example.com",
				password: VALID_PASSWORD,
				displayName: "Carol",
			});
			expect(reg.status).toBe(201);
			const firstAccess = reg.body.session.accessToken as string;

			// /me with the original access token works.
			const meRes = await agent
				.get("/api/v2/auth/me")
				.set("Authorization", `Bearer ${firstAccess}`);
			expect(meRes.status).toBe(200);
			expect(meRes.body.user.email).toBe("carol@example.com");

			// /refresh rotates the cookie and issues a fresh access token.
			const refreshRes = await agent.post("/api/v2/auth/refresh");
			expect(refreshRes.status).toBe(200);
			// JWTs minted within the same second produce identical strings,
			// so we assert the refresh cookie rotated instead (below).
			expect(typeof refreshRes.body.session.accessToken).toBe("string");
			const refreshSetCookie = refreshRes.headers["set-cookie"];
			expect(refreshSetCookie).toBeDefined();
			const firstCookieHeader = reg.headers["set-cookie"];
			const firstCookieStr = Array.isArray(firstCookieHeader)
				? firstCookieHeader.join("\n")
				: String(firstCookieHeader);
			const refreshCookieStr = Array.isArray(refreshSetCookie)
				? refreshSetCookie.join("\n")
				: String(refreshSetCookie);
			const firstRt = /fsoil_rt=([^;\s]+)/.exec(firstCookieStr)?.[1];
			const secondRt = /fsoil_rt=([^;\s]+)/.exec(refreshCookieStr)?.[1];
			expect(firstRt).toBeDefined();
			expect(secondRt).toBeDefined();
			expect(secondRt).not.toBe(firstRt);

			// /logout clears the cookie and revokes the family. Phase 9A-D
			// requires the access token on the bearer header so the server
			// can attribute the logout audit event.
			const refreshedAccess = refreshRes.body.session.accessToken as string;
			const logoutRes = await agent
				.post("/api/v2/auth/logout")
				.set("Authorization", `Bearer ${refreshedAccess}`);
			expect(logoutRes.status).toBe(200);
			expect(logoutRes.body).toEqual({ ok: true });

			const logouts = currentState.auditLogs.filter(
				(a) => a["action"] === "AUTH_LOGOUT"
			);
			expect(logouts.length).toBe(1);
		},
		TEST_TIMEOUT * 3
	);

	it("rejects /refresh without a cookie with 401", async () => {
		const res = await request(app).post("/api/v2/auth/refresh");
		expect(res.status).toBe(401);
		expect(res.body.error.code).toBe("UNAUTHORIZED");
	});

	it("rejects /me without a bearer token with 401", async () => {
		const res = await request(app).get("/api/v2/auth/me");
		expect(res.status).toBe(401);
		expect(res.body.error.code).toBe("UNAUTHORIZED");
	});
});

describe("POST /api/v2/auth/login — wrong credentials", () => {
	it(
		"returns the same 401 for unknown email and wrong password",
		async () => {
			await request(app).post("/api/v2/auth/register").send({
				email: "dave@example.com",
				password: VALID_PASSWORD,
				displayName: "Dave",
			});

			const unknownRes = await request(app)
				.post("/api/v2/auth/login")
				.send({ email: "nobody@example.com", password: VALID_PASSWORD });
			expect(unknownRes.status).toBe(401);
			expect(unknownRes.body.error.code).toBe("UNAUTHORIZED");

			const wrongRes = await request(app)
				.post("/api/v2/auth/login")
				.send({ email: "dave@example.com", password: "WrongPassword42!" });
			expect(wrongRes.status).toBe(401);
			expect(wrongRes.body.error.code).toBe("UNAUTHORIZED");
			expect(wrongRes.body.error.message).toBe(unknownRes.body.error.message);
		},
		TEST_TIMEOUT * 3
	);
});
