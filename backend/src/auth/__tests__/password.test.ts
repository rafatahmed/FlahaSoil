/**
 * FlahaSOIL v2 API — password policy + Argon2id unit tests (Phase 9A-C).
 *
 * Locks in:
 *   - The policy rules in `validatePasswordPolicy` (min length, must
 *     have a letter and a digit). These are also the only checks the
 *     auth service ever performs — schemas only enforce structural
 *     bounds.
 *   - The hash/verify round-trip is symmetric and uses Argon2id (the
 *     encoded prefix is asserted so a future regression to argon2i/d
 *     would fail loudly).
 *
 * Argon2id hash work-factor in `password.ts` is intentionally heavy
 * (64 MiB / 3 iterations) so we keep the hashing test to a SINGLE call
 * and bump the per-test timeout — running it in a tight loop would
 * inflate suite runtime by an order of magnitude.
 */

import { describe, expect, it } from "vitest";

import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	assertPasswordPolicy,
	hashPassword,
	validatePasswordPolicy,
	verifyPassword,
} from "../password";

describe("validatePasswordPolicy", () => {
	it("accepts a compliant password", () => {
		expect(validatePasswordPolicy("CorrectHorse42!")).toEqual([]);
	});

	it("rejects non-string input as a typed failure", () => {
		const failures = validatePasswordPolicy(undefined);
		expect(failures).toHaveLength(1);
		expect(failures[0]?.rule).toBe("type");
	});

	it("flags passwords shorter than the minimum", () => {
		const failures = validatePasswordPolicy("Short1");
		expect(failures.some((f) => f.rule === "minLength")).toBe(true);
	});

	it("flags passwords longer than the maximum", () => {
		const tooLong = "a1" + "x".repeat(PASSWORD_MAX_LENGTH);
		const failures = validatePasswordPolicy(tooLong);
		expect(failures.some((f) => f.rule === "maxLength")).toBe(true);
	});

	it("requires at least one letter", () => {
		const failures = validatePasswordPolicy("12345678901234");
		expect(failures.some((f) => f.rule === "requiresLetter")).toBe(true);
	});

	it("requires at least one digit", () => {
		const failures = validatePasswordPolicy("abcdefghijklmn");
		expect(failures.some((f) => f.rule === "requiresDigit")).toBe(true);
	});

	it("returns multiple violations at once", () => {
		const failures = validatePasswordPolicy("aa");
		const rules = new Set(failures.map((f) => f.rule));
		expect(rules.has("minLength")).toBe(true);
		expect(rules.has("requiresDigit")).toBe(true);
	});

	it("exposes the configured min/max as constants", () => {
		expect(PASSWORD_MIN_LENGTH).toBeGreaterThanOrEqual(12);
		expect(PASSWORD_MAX_LENGTH).toBeGreaterThan(PASSWORD_MIN_LENGTH);
	});
});

describe("assertPasswordPolicy", () => {
	it("returns nothing on a valid password", () => {
		expect(() => assertPasswordPolicy("CorrectHorse42!")).not.toThrow();
	});

	it("throws a typed VALIDATION_ERROR on a bad password", () => {
		try {
			assertPasswordPolicy("short");
			throw new Error("expected throw");
		} catch (err) {
			expect((err as { code?: string }).code).toBe("VALIDATION_ERROR");
			expect((err as { statusCode?: number }).statusCode).toBe(400);
			expect(Array.isArray((err as { details?: unknown }).details)).toBe(true);
		}
	});
});

describe("hashPassword / verifyPassword", () => {
	// Argon2id memory-hard hashing takes ~200–400 ms per call; bump
	// the default 5s timeout so flaky CI boxes don't false-fail.
	it(
		"round-trips a password through Argon2id",
		async () => {
			const hash = await hashPassword("CorrectHorse42!");
			// Encoded prefix proves we're on argon2id (not argon2i or
			// argon2d). The format is $argon2id$v=19$...
			expect(hash.startsWith("$argon2id$")).toBe(true);
			expect(await verifyPassword(hash, "CorrectHorse42!")).toBe(true);
			expect(await verifyPassword(hash, "WrongPassword99")).toBe(false);
		},
		15_000
	);

	it("returns false (not throws) on a malformed stored hash", async () => {
		expect(await verifyPassword("not-an-argon2-hash", "anything")).toBe(
			false
		);
	});
});
