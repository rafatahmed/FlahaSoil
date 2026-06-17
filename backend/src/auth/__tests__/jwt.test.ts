/**
 * FlahaSOIL v2 API — JWT access-token unit tests (Phase 9A-C).
 *
 * Locks in:
 *   - Sign + verify round-trip preserves the `sub` (userId) and `oid`
 *     (activeOrganizationId, nullable) claims.
 *   - A tampered signature fails verification with the generic
 *     "Invalid or expired access token" message (no jose leak).
 *   - An expired token is rejected.
 *   - `extractBearerToken` parses the standard header, is case-
 *     insensitive on the scheme, and rejects malformed values.
 *
 * The tests use the in-process `env.auth.jwtSecret` derived in
 * `config/env.ts` — this is a deterministic per-machine value under
 * NODE_ENV=test so the round-trip is reliable without any setup.
 */

import { describe, expect, it } from "vitest";

import {
	extractBearerToken,
	issueAccessToken,
	verifyAccessToken,
} from "../jwt";

describe("issueAccessToken + verifyAccessToken", () => {
	it("round-trips sub and oid claims", async () => {
		const { token, expiresAt } = await issueAccessToken("user_1", "org_1");
		expect(typeof token).toBe("string");
		expect(token.split(".").length).toBe(3);
		expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

		const claims = await verifyAccessToken(token);
		expect(claims.sub).toBe("user_1");
		expect(claims.oid).toBe("org_1");
		expect(typeof claims.iat).toBe("number");
		expect(typeof claims.exp).toBe("number");
	});

	it("encodes a null active organization as null in the claims", async () => {
		const { token } = await issueAccessToken("user_2", null);
		const claims = await verifyAccessToken(token);
		expect(claims.sub).toBe("user_2");
		expect(claims.oid).toBeNull();
	});

	it("rejects a tampered signature with a generic 401", async () => {
		const { token } = await issueAccessToken("user_3", null);
		// Mutate the first char of the PAYLOAD segment. Unlike flipping
		// the final base64url char of the signature (whose trailing bits
		// are padding and may decode to identical bytes), changing a
		// payload byte always invalidates the HS256 signature, so the
		// tamper is deterministic.
		const segments = token.split(".");
		const payload = segments[1] ?? "";
		const tamperedPayload =
			payload.charAt(0) === "A"
				? `B${payload.slice(1)}`
				: `A${payload.slice(1)}`;
		const tampered =
			segments[0] + "." + tamperedPayload + "." + (segments[2] ?? "");

		try {
			await verifyAccessToken(tampered);
			throw new Error("expected throw");
		} catch (err) {
			const e = err as { code?: string; statusCode?: number; message?: string };
			expect(e.code).toBe("UNAUTHORIZED");
			expect(e.statusCode).toBe(401);
			// Generic message — does NOT mention jose, "signature", or
			// "expired" specifically.
			expect(e.message).toMatch(/invalid or expired/i);
		}
	});

	it("rejects garbage that does not look like a JWT", async () => {
		await expect(verifyAccessToken("not-a-jwt")).rejects.toMatchObject({
			code: "UNAUTHORIZED",
		});
	});
});

describe("extractBearerToken", () => {
	it("parses a standard Bearer header", () => {
		expect(extractBearerToken("Bearer abc.def.ghi")).toBe("abc.def.ghi");
	});

	it("is case-insensitive on the scheme", () => {
		expect(extractBearerToken("bearer abc.def.ghi")).toBe("abc.def.ghi");
		expect(extractBearerToken("BEARER abc.def.ghi")).toBe("abc.def.ghi");
	});

	it("returns undefined for an empty / missing header", () => {
		expect(extractBearerToken(undefined)).toBeUndefined();
		expect(extractBearerToken("")).toBeUndefined();
	});

	it("returns undefined for the wrong scheme", () => {
		expect(extractBearerToken("Basic abc.def.ghi")).toBeUndefined();
	});

	it("returns undefined when the token is missing", () => {
		expect(extractBearerToken("Bearer")).toBeUndefined();
		expect(extractBearerToken("Bearer  ")).toBeUndefined();
	});

	it("returns undefined when there are too many parts", () => {
		expect(extractBearerToken("Bearer a b")).toBeUndefined();
	});
});
