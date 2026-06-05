/**
 * @flaha/soil-interpretation — public type contracts.
 *
 * The interpretation engine is a pure decision layer. It receives the
 * fully-computed outputs of the calculation engines and emits qualitative
 * categories, risk classes, and a warnings array. It MUST NOT recompute
 * any value, mutate any input, or perform any I/O.
 *
 * `physics` and `chemistry` are typed loosely so this package can consume
 * the legacy and v2 calculation outputs interchangeably; the engine reads
 * fields defensively (`?.` / runtime presence checks) and never assumes
 * any field is present.
 */

export interface SoilInterpretationInput {
	/** Output of `@flaha/soil-physics` `calculateSoilPhysics` (or legacy equivalent). Optional. */
	physics?: Record<string, unknown> | null;
	/** Output of `@flaha/soil-chemistry` `calculateSoilChemistry`. Optional. */
	chemistry?: Record<string, unknown> | null;
}

/**
 * Qualitative interpretation result.
 *
 * Every category field is OPTIONAL — a field is present only when the
 * corresponding input was supplied. Consumers must therefore branch on
 * `'phCategory' in result` (or equivalent) before using a category.
 *
 * `warnings` is always present; it is `[]` when no warnings apply.
 * `overallSoilRating` is always present (one of "Good" / "Fair" / "Poor")
 * — when no inputs are available it falls back to "Fair".
 */
export interface SoilInterpretationResult {
	phCategory?: string;
	salinityRisk?: string;

	cecLevel?: string;
	baseSaturationCategory?: string;

	cationBalance?: string;
	sodiumRisk?: string;

	waterHoldingClass?: string;
	drainageClass?: string;

	overallSoilRating: string;

	warnings: string[];

	// Phase 8D additions — severity classes and structured suitability
	// matrix. All fields are OPTIONAL with the same "input present →
	// field present" contract as the categories above.
	salinitySeverity?:
		| "None"
		| "Slight"
		| "Moderate"
		| "Strong"
		| "Severe";
	sodicitySeverity?:
		| "None"
		| "Slight"
		| "Moderate"
		| "Strong"
		| "Severe";
	organicMatterCategory?: string;
	infiltrationClass?: string;
	compactionRisk?: "Low" | "Moderate" | "High";
	textureSuitability?: {
		turfgrass: { verdict: "Suitable" | "Marginal" | "Unsuitable"; reasons: string[] };
		landscape: { verdict: "Suitable" | "Marginal" | "Unsuitable"; reasons: string[] };
		agriculture: { verdict: "Suitable" | "Marginal" | "Unsuitable"; reasons: string[] };
		irrigation: { verdict: "Suitable" | "Marginal" | "Unsuitable"; reasons: string[] };
	};
}
