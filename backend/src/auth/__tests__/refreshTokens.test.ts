/**
 * FlahaSOIL v2 API — refresh-token unit tests (Phase 9A-C).
 *
 * Locks in:
 *   - `hashRefreshToken` is a deterministic SHA-256 (same input →
 *     same output, identical-length hex).
 *   - `issueNewRefreshToken` persists the HASH (never the raw token)
 *     and mints a fresh familyId per call.
 *   - `issueRotatedRefreshToken` re-uses the supplied familyId.
 *   - `revokeRefreshTokenFamily` issues a single updateMany filtered
 *     on `revokedAt: null` (idempotent across re-runs).
 */

import { describe, expect, it } from "vitest";

import type { PrismaClientLike } from "../../prisma/client";
import {
	hashRefreshToken,
	issueNewRefreshToken,
	issueRotatedRefreshToken,
	revokeRefreshTokenFamily,
} from "../refreshTokens";

function makeRefreshTokenStub(): {
	prisma: PrismaClientLike;
	creates: Array<Record<string, unknown>>;
	updateManys: Array<{ where: unknown; data: unknown }>;
} {
	const creates: Array<Record<string, unknown>> = [];
	const updateManys: Array<{ where: unknown; data: unknown }> = [];
	const stub = {
		refreshToken: {
			create: async (args: { data: unknown }) => {
				creates.push(args.data as Record<string, unknown>);
				return { id: `rt_${creates.length}` };
			},
			updateMany: async (args: { where?: unknown; data: unknown }) => {
				updateManys.push({ where: args.where, data: args.data });
				return { count: 1 };
			},
		},
	} as unknown as PrismaClientLike;
	return { prisma: stub, creates, updateManys };
}

describe("hashRefreshToken", () => {
	it("returns a 64-char lower-case hex SHA-256 digest", () => {
		const out = hashRefreshToken("hello");
		expect(out).toMatch(/^[0-9a-f]{64}$/);
	});

	it("is deterministic for the same input", () => {
		expect(hashRefreshToken("same")).toBe(hashRefreshToken("same"));
	});

	it("differs for different inputs", () => {
		expect(hashRefreshToken("a")).not.toBe(hashRefreshToken("b"));
	});
});

describe("issueNewRefreshToken", () => {
	it("persists the hash, never the raw token, and returns the raw", async () => {
		const { prisma, creates } = makeRefreshTokenStub();
		const issued = await issueNewRefreshToken(prisma, "user_1", {
			userAgent: "vitest",
			ipAddress: "127.0.0.1",
		});
		expect(issued.rawToken.length).toBeGreaterThan(20);
		expect(issued.familyId.length).toBeGreaterThan(0);
		expect(issued.expiresAt.getTime()).toBeGreaterThan(Date.now());

		expect(creates).toHaveLength(1);
		const persisted = creates[0]!;
		expect(persisted["userId"]).toBe("user_1");
		expect(persisted["tokenHash"]).toBe(hashRefreshToken(issued.rawToken));
		expect(persisted["tokenHash"]).not.toBe(issued.rawToken);
		expect(persisted["userAgent"]).toBe("vitest");
		expect(persisted["ipAddress"]).toBe("127.0.0.1");
	});

	it("mints a fresh familyId on each call", async () => {
		const { prisma } = makeRefreshTokenStub();
		const a = await issueNewRefreshToken(prisma, "user_1");
		const b = await issueNewRefreshToken(prisma, "user_1");
		expect(a.familyId).not.toBe(b.familyId);
		expect(a.rawToken).not.toBe(b.rawToken);
	});
});

describe("issueRotatedRefreshToken", () => {
	it("preserves the supplied familyId across the rotation", async () => {
		const { prisma, creates } = makeRefreshTokenStub();
		const issued = await issueRotatedRefreshToken(
			prisma,
			"user_1",
			"family_fixed"
		);
		expect(issued.familyId).toBe("family_fixed");
		expect(creates[0]?.["familyId"]).toBe("family_fixed");
	});
});

describe("revokeRefreshTokenFamily", () => {
	it("scopes the updateMany to non-revoked rows in the family", async () => {
		const { prisma, updateManys } = makeRefreshTokenStub();
		const count = await revokeRefreshTokenFamily(
			prisma,
			"family_1",
			"reuse_detected"
		);
		expect(count).toBe(1);
		expect(updateManys).toHaveLength(1);
		expect(updateManys[0]?.where).toMatchObject({
			familyId: "family_1",
			revokedAt: null,
		});
		const data = updateManys[0]?.data as Record<string, unknown>;
		expect(data["revokedReason"]).toBe("reuse_detected");
		expect(data["revokedAt"]).toBeInstanceOf(Date);
	});
});
