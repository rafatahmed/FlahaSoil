/**
 * FlahaSOIL v2 — passwordPolicy unit tests (Phase 9A-G).
 *
 * The frontend mirrors the backend's password rules so users get instant
 * feedback. These tests pin the boundary cases that the registration
 * form relies on.
 */
import { describe, expect, it } from "vitest";

import {
	PASSWORD_MAX_LENGTH,
	PASSWORD_MIN_LENGTH,
	validatePassword,
} from "../passwordPolicy";

describe("validatePassword", () => {
	it("rejects passwords shorter than the minimum length", () => {
		const short = "a".repeat(PASSWORD_MIN_LENGTH - 1);
		const err = validatePassword(short);
		expect(err).not.toBeNull();
		expect(err?.message).toContain(`${PASSWORD_MIN_LENGTH}`);
	});

	it("accepts a password exactly at the minimum length", () => {
		const exact = "a".repeat(PASSWORD_MIN_LENGTH);
		expect(validatePassword(exact)).toBeNull();
	});

	it("accepts a password exactly at the maximum length", () => {
		const exact = "a".repeat(PASSWORD_MAX_LENGTH);
		expect(validatePassword(exact)).toBeNull();
	});

	it("rejects passwords longer than the maximum length", () => {
		const long = "a".repeat(PASSWORD_MAX_LENGTH + 1);
		const err = validatePassword(long);
		expect(err).not.toBeNull();
		expect(err?.message).toContain(`${PASSWORD_MAX_LENGTH}`);
	});

	it("rejects the empty string", () => {
		expect(validatePassword("")).not.toBeNull();
	});
});
