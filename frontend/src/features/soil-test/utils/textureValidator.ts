/**
 * FlahaSOIL v2 — texture sum validator.
 *
 * Pure helper used by the preliminary wizard step to surface a live
 * status chip showing whether the sand/silt/clay components are
 * consistent. No I/O, no React.
 *
 * The validator never blocks submission — it is a guidance aid. The
 * backend zod schema is still the authoritative gate (sand+silt+clay
 * must be within 0.5 % of 100 when all three are supplied).
 */
import type { SoilTestDraftTextureInput } from "../state/soilTestDraft";

/** Tolerance, in percentage points, around the 100 % target sum. */
export const TEXTURE_SUM_TOLERANCE = 0.5;

export type TextureValidationStatus =
	| "incomplete"
	| "valid"
	| "off-by-a-little"
	| "invalid";

export interface TextureValidationResult {
	status: TextureValidationStatus;
	sum: number | null;
	missingComponents: ReadonlyArray<"sand" | "silt" | "clay">;
	/** Human-readable hint suitable for a small caption / chip label. */
	message: string;
}

const ALL_COMPONENTS = ["sand", "silt", "clay"] as const;

export function validateTextureSum(
	input: SoilTestDraftTextureInput
): TextureValidationResult {
	const values = {
		sand: numOrNull(input.sandPercent),
		silt: numOrNull(input.siltPercent),
		clay: numOrNull(input.clayPercent),
	};
	const missing = ALL_COMPONENTS.filter((k) => values[k] === null);

	if (missing.length === 3) {
		return {
			status: "incomplete",
			sum: null,
			missingComponents: missing,
			message: "Enter sand, silt and clay to see the texture sum.",
		};
	}
	if (missing.length > 0) {
		return {
			status: "incomplete",
			sum: null,
			missingComponents: missing,
			message: `Add ${missing.join(", ")} to complete the texture.`,
		};
	}

	const sum = (values.sand ?? 0) + (values.silt ?? 0) + (values.clay ?? 0);
	const delta = Math.abs(sum - 100);
	if (delta <= TEXTURE_SUM_TOLERANCE) {
		return {
			status: "valid",
			sum,
			missingComponents: [],
			message: `Texture sums to ${sum.toFixed(1)} % \u2014 valid.`,
		};
	}
	if (delta <= 2) {
		return {
			status: "off-by-a-little",
			sum,
			missingComponents: [],
			message: `Sum is ${sum.toFixed(1)} %. Aim for 100 % (\u00B10.5).`,
		};
	}
	return {
		status: "invalid",
		sum,
		missingComponents: [],
		message: `Sum is ${sum.toFixed(1)} %. Sand + silt + clay must total 100 % (\u00B10.5).`,
	};
}

function numOrNull(v: number | null | undefined): number | null {
	return typeof v === "number" && Number.isFinite(v) ? v : null;
}
