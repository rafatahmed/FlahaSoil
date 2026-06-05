/**
 * FlahaSOIL v2 API — auth service unit tests (Phase 9A-C).
 *
 * Drives the happy + sad paths through `registerUser`, `loginUser`,
 * `refreshAuthTokens`, and `logoutUser` against a hand-rolled Prisma
 * stub. The stub is intentionally small: it stores rows in arrays so
 * each test can assert against the recorded calls.
 *
 * The argon2 work-factor is the slowest single operation in the
 * suite (~200–400 ms per hash). Per-test timeout is bumped to 20s
 * to leave headroom on shared CI runners.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
	type PrismaClientLike,
	setPrismaClientForTesting,
} from "../../prisma/client";
import { hashRefreshToken } from "../../auth/refreshTokens";
import {
	loginUser,
	logoutUser,
	refreshAuthTokens,
	registerUser,
} from "../auth.service";

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

function nextId(state: StubState, prefix: string): string {
	state.idCounter += 1;
	return `${prefix}_${state.idCounter}`;
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

let state: StubState;

beforeEach(() => {
	const built = makeStub();
	state = built.state;
	setPrismaClientForTesting(built.prisma);
});

afterEach(() => {
	setPrismaClientForTesting(null);
});

const VALID_PASSWORD = "CorrectHorse42!";
const TEST_TIMEOUT = 20_000;

describe("registerUser", () => {
	it(
		"provisions user, org, membership, and tokens",
		async () => {
			const result = await registerUser({
				email: "Alice@Example.com",
				password: VALID_PASSWORD,
				displayName: "Alice",
			});

			expect(result.session.user.email).toBe("alice@example.com");
			expect(result.session.activeOrganization?.name).toBe("Alice's workspace");
			expect(result.session.memberships).toHaveLength(1);
			expect(result.session.memberships[0]?.role).toBe("OWNER");
			expect(result.session.accessToken).toMatch(/\./);
			expect(result.refreshToken.rawToken.length).toBeGreaterThan(20);

			expect(state.users.size).toBe(1);
			expect(state.orgs.size).toBe(1);
			expect(state.memberships).toHaveLength(1);
			expect(state.refreshTokens.size).toBe(1);

			const actions = state.auditLogs.map((a) => a["action"]);
			expect(actions).toContain("AUTH_REGISTER");
			expect(actions).toContain("ORG_CREATED");
			expect(actions).toContain("MEMBERSHIP_CREATED");
		},
		TEST_TIMEOUT
	);

	it(
		"uses the supplied organizationName when provided",
		async () => {
			const result = await registerUser({
				email: "bob@example.com",
				password: VALID_PASSWORD,
				displayName: "Bob",
				organizationName: "Acme Soil",
			});
			expect(result.session.activeOrganization?.name).toBe("Acme Soil");
			expect(result.session.activeOrganization?.slug).toBe("acme-soil");
		},
		TEST_TIMEOUT
	);

	it(
		"rejects duplicate email with VALIDATION_ERROR",
		async () => {
			await registerUser({
				email: "dup@example.com",
				password: VALID_PASSWORD,
				displayName: "Dup",
			});
			await expect(
				registerUser({
					email: "DUP@example.com",
					password: VALID_PASSWORD,
					displayName: "Other",
				})
			).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
		},
		TEST_TIMEOUT * 2
	);

	it(
		"rejects passwords that violate policy",
		async () => {
			await expect(
				registerUser({
					email: "weak@example.com",
					password: "short",
					displayName: "Weak",
				})
			).rejects.toMatchObject({ code: "VALIDATION_ERROR" });
		},
		TEST_TIMEOUT
	);
});

describe("loginUser", () => {
	it(
		"verifies password and issues new tokens",
		async () => {
			await registerUser({
				email: "carol@example.com",
				password: VALID_PASSWORD,
				displayName: "Carol",
			});

			const result = await loginUser({
				email: "carol@example.com",
				password: VALID_PASSWORD,
			});
			expect(result.session.user.email).toBe("carol@example.com");
			expect(result.refreshToken.rawToken.length).toBeGreaterThan(20);

			const actions = state.auditLogs.map((a) => a["action"]);
			expect(actions).toContain("AUTH_LOGIN");
		},
		TEST_TIMEOUT * 2
	);

	it(
		"returns the same generic 401 for unknown email and wrong password",
		async () => {
			await registerUser({
				email: "dave@example.com",
				password: VALID_PASSWORD,
				displayName: "Dave",
			});

			await expect(
				loginUser({
					email: "nobody@example.com",
					password: VALID_PASSWORD,
				})
			).rejects.toMatchObject({
				code: "UNAUTHORIZED",
				message: "Invalid email or password.",
			});
			await expect(
				loginUser({
					email: "dave@example.com",
					password: "WrongPassword42!",
				})
			).rejects.toMatchObject({
				code: "UNAUTHORIZED",
				message: "Invalid email or password.",
			});

			const failures = state.auditLogs.filter(
				(a) => a["action"] === "AUTH_LOGIN_FAILED"
			);
			expect(failures.length).toBeGreaterThanOrEqual(2);
		},
		TEST_TIMEOUT * 3
	);
});

describe("refreshAuthTokens", () => {
	it(
		"rotates the token and keeps the same familyId",
		async () => {
			const reg = await registerUser({
				email: "erin@example.com",
				password: VALID_PASSWORD,
				displayName: "Erin",
			});
			const firstFamily = reg.refreshToken.familyId;

			const rot = await refreshAuthTokens(reg.refreshToken.rawToken);
			expect(rot.refreshToken.familyId).toBe(firstFamily);
			expect(rot.refreshToken.rawToken).not.toBe(reg.refreshToken.rawToken);

			// Previous token row must be revoked.
			const prevHash = hashRefreshToken(reg.refreshToken.rawToken);
			const prevRow = Array.from(state.refreshTokens.values()).find(
				(r) => r["tokenHash"] === prevHash
			);
			expect(prevRow?.["revokedAt"]).toBeInstanceOf(Date);
			expect(prevRow?.["revokedReason"]).toBe("rotated");
		},
		TEST_TIMEOUT * 2
	);

	it(
		"detects reuse and revokes the entire family",
		async () => {
			const reg = await registerUser({
				email: "frank@example.com",
				password: VALID_PASSWORD,
				displayName: "Frank",
			});
			const familyId = reg.refreshToken.familyId;

			// First rotation succeeds.
			await refreshAuthTokens(reg.refreshToken.rawToken);

			// Replaying the (now-revoked) original should trip reuse detection.
			await expect(
				refreshAuthTokens(reg.refreshToken.rawToken)
			).rejects.toMatchObject({ code: "UNAUTHORIZED" });

			// Every row in the family must now be revoked.
			const familyRows = Array.from(state.refreshTokens.values()).filter(
				(r) => r["familyId"] === familyId
			);
			expect(familyRows.every((r) => r["revokedAt"] !== null)).toBe(true);

			const securityRows = state.auditLogs.filter(
				(a) => a["action"] === "AUTH_REFRESH_REUSE_DETECTED"
			);
			expect(securityRows.length).toBe(1);
			expect(securityRows[0]?.["severity"]).toBe("SECURITY");
		},
		TEST_TIMEOUT * 2
	);

	it(
		"rejects an unknown token with 401",
		async () => {
			await expect(refreshAuthTokens("not-a-real-token")).rejects.toMatchObject(
				{ code: "UNAUTHORIZED" }
			);
		},
		TEST_TIMEOUT
	);
});

describe("logoutUser", () => {
	it(
		"revokes the family and audits the action",
		async () => {
			const reg = await registerUser({
				email: "gina@example.com",
				password: VALID_PASSWORD,
				displayName: "Gina",
			});

			await logoutUser(reg.refreshToken.rawToken);

			const familyRows = Array.from(state.refreshTokens.values()).filter(
				(r) => r["familyId"] === reg.refreshToken.familyId
			);
			expect(familyRows.every((r) => r["revokedAt"] !== null)).toBe(true);

			const logouts = state.auditLogs.filter(
				(a) => a["action"] === "AUTH_LOGOUT"
			);
			expect(logouts).toHaveLength(1);
		},
		TEST_TIMEOUT * 2
	);

	it("is a no-op when no token is supplied", async () => {
		await expect(logoutUser(undefined)).resolves.toBeUndefined();
		expect(state.auditLogs).toHaveLength(0);
	});
});
