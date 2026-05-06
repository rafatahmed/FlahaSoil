/**
 * @flaha/soil-chemistry — input validation.
 *
 * Validation rules:
 *   - All cation concentrations must be finite numbers ≥ 0.
 *   - CEC, when supplied, must be a finite number ≥ 0.
 *   - Texture percentages (`sand`, `clay`, `organicMatter`) must be in
 *     [0, 100] when supplied.
 *   - pH, when supplied, must be in [0, 14].
 *   - EC, when supplied, must be ≥ 0.
 *   - Mode-specific requirements are enforced separately.
 *
 * The engine throws a single `Error` with a self-describing message on the
 * first violation; it does NOT collect violations.
 */

import type { SoilChemistryInput } from "./types";

const NON_NEGATIVE_FIELDS = ["cec", "ca", "mg", "k", "na", "ec"] as const;
const PERCENT_FIELDS = ["sand", "clay", "organicMatter"] as const;

/**
 * Throws if `value` is not a finite number ≥ `min` (and ≤ `max` when set).
 * `undefined` is accepted (the field is optional).
 */
function assertNumberInRange(
	field: string,
	value: number | undefined,
	min: number,
	max?: number
): void {
	if (value === undefined) {
		return;
	}
	if (typeof value !== "number" || !Number.isFinite(value)) {
		throw new Error(
			`Invalid input: '${field}' must be a finite number, received ${String(value)}`
		);
	}
	if (value < min) {
		throw new Error(
			`Invalid input: '${field}' must be >= ${min}, received ${value}`
		);
	}
	if (max !== undefined && value > max) {
		throw new Error(
			`Invalid input: '${field}' must be <= ${max}, received ${value}`
		);
	}
}

/** Validates the shared input contract. Throws on the first violation. */
export function validateInput(input: SoilChemistryInput): void {
	if (input === null || typeof input !== "object") {
		throw new Error("Invalid input: expected SoilChemistryInput object");
	}
	if (input.mode !== "LAB" && input.mode !== "ESTIMATED") {
		throw new Error(
			`Invalid input: 'mode' must be "LAB" or "ESTIMATED", received ${String(input.mode)}`
		);
	}

	for (const field of NON_NEGATIVE_FIELDS) {
		assertNumberInRange(field, input[field], 0);
	}

	for (const field of PERCENT_FIELDS) {
		assertNumberInRange(field, input[field], 0, 100);
	}

	assertNumberInRange("ph", input.ph, 0, 14);

	if (input.mode === "ESTIMATED") {
		if (input.clay === undefined) {
			throw new Error(
				"Invalid input: ESTIMATED mode requires 'clay' (percent)"
			);
		}
		if (input.organicMatter === undefined) {
			throw new Error(
				"Invalid input: ESTIMATED mode requires 'organicMatter' (percent)"
			);
		}
	}
}
