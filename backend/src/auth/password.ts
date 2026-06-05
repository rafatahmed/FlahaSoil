/**
 * FlahaSOIL v2 API — password policy + Argon2id hashing (Phase 9A-C).
 *
 * Single point of coupling to the `argon2` library. Callers in the auth
 * service should only ever import {hashPassword, verifyPassword,
 * validatePasswordPolicy} from here.
 *
 * Parameters target OWASP 2024 minimum for Argon2id (memory ≥ 64 MiB,
 * iterations ≥ 3, parallelism = 1). On a modest dev box (Apple M1 / a
 * 2020-era x86 laptop) this lands a single hash around 200–400 ms,
 * which is the right side of the latency-vs-bruteforce trade-off.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const argon2: typeof import("argon2") = require("argon2");

import type { ValidationFailureDetail } from "@flaha/shared-types";

import { ApiError } from "../utils/apiError";

// ---------------------------------------------------------------------------
// Argon2id parameters
// ---------------------------------------------------------------------------

const ARGON2_OPTIONS = {
	type: argon2.argon2id,
	// 64 MiB. argon2 takes memory cost in KiB.
	memoryCost: 64 * 1024,
	// 3 passes over the memory matrix.
	timeCost: 3,
	parallelism: 1,
} as const;

// ---------------------------------------------------------------------------
// Policy
// ---------------------------------------------------------------------------

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;

const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /[0-9]/;

/**
 * Returns the list of policy violations for a candidate password, or an
 * empty array when the password is acceptable. The shape matches
 * `ValidationFailureDetail` so callers can drop the result straight
 * into an `ApiError.validation(..., details)` payload.
 */
export function validatePasswordPolicy(
	password: unknown
): ValidationFailureDetail[] {
	const failures: ValidationFailureDetail[] = [];
	if (typeof password !== "string") {
		failures.push({
			path: "password",
			rule: "type",
			message: "password must be a string",
		});
		return failures;
	}
	if (password.length < PASSWORD_MIN_LENGTH) {
		failures.push({
			path: "password",
			rule: "minLength",
			message: `password must be at least ${PASSWORD_MIN_LENGTH} characters`,
			expected: PASSWORD_MIN_LENGTH,
			received: password.length,
		});
	}
	if (password.length > PASSWORD_MAX_LENGTH) {
		failures.push({
			path: "password",
			rule: "maxLength",
			message: `password must be at most ${PASSWORD_MAX_LENGTH} characters`,
			expected: PASSWORD_MAX_LENGTH,
			received: password.length,
		});
	}
	if (!HAS_LETTER.test(password)) {
		failures.push({
			path: "password",
			rule: "requiresLetter",
			message: "password must contain at least one letter",
		});
	}
	if (!HAS_DIGIT.test(password)) {
		failures.push({
			path: "password",
			rule: "requiresDigit",
			message: "password must contain at least one digit",
		});
	}
	return failures;
}

/**
 * Throws a 400 VALIDATION_ERROR if `password` violates the policy.
 * Convenience wrapper for the auth service so it doesn't have to
 * inline the if-throw dance everywhere.
 */
export function assertPasswordPolicy(password: unknown): void {
	const failures = validatePasswordPolicy(password);
	if (failures.length === 0) return;
	throw ApiError.validation(
		"password does not meet the security policy",
		failures
	);
}

// ---------------------------------------------------------------------------
// Hashing
// ---------------------------------------------------------------------------

export async function hashPassword(plaintext: string): Promise<string> {
	// argon2.hash returns the encoded form ($argon2id$v=...$...$...) so
	// the parameters travel with the hash and verification doesn't need
	// to re-supply them.
	return argon2.hash(plaintext, ARGON2_OPTIONS);
}

/**
 * Constant-time-ish verification. `argon2.verify` returns `false` on a
 * mismatch and throws only on a malformed encoded hash; we catch those
 * and treat them as a verification failure so a corrupted DB row never
 * 500s the login endpoint.
 */
export async function verifyPassword(
	encodedHash: string,
	plaintext: string
): Promise<boolean> {
	try {
		return await argon2.verify(encodedHash, plaintext);
	} catch {
		return false;
	}
}
