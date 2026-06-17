/**
 * @flaha/soil-interpretation — classification rules.
 *
 * All rules are simple piecewise classifiers over already-computed values.
 * No formulas. No unit conversions. Inputs are assumed to already be in
 * the units defined by `@flaha/soil-physics` and `@flaha/soil-chemistry`.
 *
 * Threshold provenance: Phase-2.3 specification (FlahaSOIL v2). These are
 * project house thresholds; they are NOT cited from a peer-reviewed
 * source. Document the source before any agronomic-claim publication.
 */

// ---------------------------------------------------------------------------
// pH classification (dimensionless)
// ---------------------------------------------------------------------------
export function classifyPh(ph: number): string {
	if (ph < 5.5) return "Strongly Acidic";
	if (ph < 6.5) return "Slightly Acidic";
	if (ph < 7.5) return "Neutral";
	if (ph < 8.5) return "Alkaline";
	return "Highly Alkaline";
}

// ---------------------------------------------------------------------------
// EC / salinity risk (dS/m)
// ---------------------------------------------------------------------------
export function classifySalinity(ec: number): string {
	if (ec < 2) return "Low";
	if (ec < 4) return "Moderate";
	if (ec < 8) return "High";
	return "Severe";
}

// ---------------------------------------------------------------------------
// CEC level (cmol(+)/kg)
// ---------------------------------------------------------------------------
export function classifyCec(cec: number): string {
	if (cec < 5) return "Very Low";
	if (cec < 15) return "Low";
	if (cec < 25) return "Moderate";
	return "High";
}

// ---------------------------------------------------------------------------
// Base saturation (percent)
// ---------------------------------------------------------------------------
export function classifyBaseSaturation(bs: number): string {
	if (bs < 50) return "Low";
	if (bs <= 80) return "Moderate";
	return "High";
}

// ---------------------------------------------------------------------------
// Sodium risk via ESP (percent)
// ---------------------------------------------------------------------------
export function classifySodiumRisk(esp: number): string {
	if (esp < 6) return "Low";
	if (esp <= 15) return "Moderate";
	return "High";
}

// ---------------------------------------------------------------------------
// Cation balance (percent shares of CEC)
//
// Optimal windows:
//   Ca: 60–75 %
//   Mg: 10–20 %
//   K : 2–5  %
//
// If any supplied cation is outside its window the balance is "Imbalanced",
// otherwise "Balanced". Missing cations are skipped (i.e. cannot fail the
// rule by absence).
// ---------------------------------------------------------------------------
export interface CationBalanceInput {
	caPercent?: number;
	mgPercent?: number;
	kPercent?: number;
}

const CATION_WINDOWS: Array<[keyof CationBalanceInput, number, number]> = [
	["caPercent", 60, 75],
	["mgPercent", 10, 20],
	["kPercent", 2, 5],
];

export function classifyCationBalance(input: CationBalanceInput): string {
	for (const [field, min, max] of CATION_WINDOWS) {
		const value = input[field];
		if (value === undefined) continue;
		if (value < min || value > max) return "Imbalanced";
	}
	return "Balanced";
}

// ---------------------------------------------------------------------------
// Water-holding class — operates on `plantAvailableWater` from physics.
//
// Phase 10A.7 (Scientific Audit R1): the upstream physics engine emits
// PAW as **volumetric percent** (θFC − θWP, %v/v), typically in the
// 3–25 % range across mineral soils. The pre-correction thresholds
// (50 / 150) were anchored to a depth-integrated mm-per-metre scale
// (1000 × %v/v), so every realistic %v/v PAW value collapsed to "Low".
//
// Corrected thresholds (volumetric %, per Brady & Weil 14 ed. Table 5.3
// and the USDA NRCS Soil Survey Manual interpretive ranges):
//   < 10 %   → Low      (most sands and loamy sands)
//   10–15 %  → Moderate (sandy loams, loams)
//   ≥ 15 %   → High     (silt loams, clay loams, well-aggregated clays)
// ---------------------------------------------------------------------------
export function classifyWaterHolding(paw: number): string {
	if (paw < 10) return "Low";
	if (paw < 15) return "Moderate";
	return "High";
}

// ---------------------------------------------------------------------------
// Drainage — pure passthrough of the physics-supplied class.
// ---------------------------------------------------------------------------
export function passthroughDrainage(drainageClass: string): string {
	return drainageClass;
}

// ===========================================================================
// Phase 8D — extended classifiers (severities, suitability, OM, drainage,
// infiltration, compaction). All thresholds documented inline reference the
// project house spec; FAO-29 is the established source for salinity /
// sodicity severities, the remainder are project conventions and MUST be
// reviewed before any external agronomic claim.
// ===========================================================================

/**
 * FAO-29 salinity severity class on ECe (dS/m).
 * None < 2  ≤ Slight < 4 ≤ Moderate < 8 ≤ Strong < 16 ≤ Severe.
 */
export type SalinitySeverity =
	| "None"
	| "Slight"
	| "Moderate"
	| "Strong"
	| "Severe";

export function classifySalinitySeverity(ec: number): SalinitySeverity {
	if (ec < 2) return "None";
	if (ec < 4) return "Slight";
	if (ec < 8) return "Moderate";
	if (ec < 16) return "Strong";
	return "Severe";
}

/**
 * Sodicity severity from SAR and/or ESP. ESP wins when supplied (more
 * direct measure of exchange complex). FAO-29 thresholds:
 *   SAR  : <3 None,  3–6 Slight,  6–9 Moderate,  9–13 Strong,  ≥13 Severe.
 *   ESP  : <5 None,  5–10 Slight, 10–15 Moderate, 15–20 Strong, ≥20 Severe.
 */
export type SodicitySeverity = SalinitySeverity;

export function classifySodicitySeverity(input: {
	sar?: number;
	esp?: number;
}): SodicitySeverity {
	if (typeof input.esp === "number") {
		if (input.esp < 5) return "None";
		if (input.esp < 10) return "Slight";
		if (input.esp < 15) return "Moderate";
		if (input.esp < 20) return "Strong";
		return "Severe";
	}
	if (typeof input.sar === "number") {
		if (input.sar < 3) return "None";
		if (input.sar < 6) return "Slight";
		if (input.sar < 9) return "Moderate";
		if (input.sar < 13) return "Strong";
		return "Severe";
	}
	return "None";
}

/**
 * Organic matter classification (percent by mass). House thresholds:
 *   < 1.0   = Very Low; 1.0–2.0 = Low; 2.0–4.0 = Adequate; > 4.0 = High.
 */
export function classifyOrganicMatter(omPercent: number): string {
	if (omPercent < 1) return "Very Low";
	if (omPercent < 2) return "Low";
	if (omPercent <= 4) return "Adequate";
	return "High";
}

/**
 * Drainage classifier derived from Ksat (mm/h) when no physics-supplied
 * label is available. House thresholds (NRCS-aligned):
 *   < 0.15  Very Poor
 *   < 1.5   Poor
 *   < 5     Moderate
 *   < 50    Good
 *   ≥ 50    Excessive
 */
export function classifyDrainageFromKsat(ksatMmH: number): string {
	if (ksatMmH < 0.15) return "Very Poor";
	if (ksatMmH < 1.5) return "Poor";
	if (ksatMmH < 5) return "Moderate";
	if (ksatMmH < 50) return "Good";
	return "Excessive";
}

/**
 * Infiltration class from Ksat (mm/h). USDA-style buckets:
 *   < 1   Very Slow; 1–5 Slow; 5–20 Moderate; 20–60 Rapid; ≥60 Very Rapid.
 */
export function classifyInfiltration(ksatMmH: number): string {
	if (ksatMmH < 1) return "Very Slow";
	if (ksatMmH < 5) return "Slow";
	if (ksatMmH < 20) return "Moderate";
	if (ksatMmH < 60) return "Rapid";
	return "Very Rapid";
}

/**
 * Compaction risk from bulk density (g/cm³), branched by texture class.
 * House thresholds derived from NRCS bulk-density guidance:
 *   sandy / loamy sand : ≥1.80 High, ≥1.65 Moderate, else Low
 *   loam / silt loam   : ≥1.65 High, ≥1.50 Moderate, else Low
 *   clay / clay loam   : ≥1.47 High, ≥1.35 Moderate, else Low
 *   unknown            : ≥1.65 High, ≥1.50 Moderate, else Low
 */
export function classifyCompactionRisk(input: {
	bulkDensity: number;
	textureClass?: string | undefined;
}): "Low" | "Moderate" | "High" {
	const tc = (input.textureClass ?? "").toLowerCase();
	const isSandy = /sand/.test(tc) && !/clay/.test(tc);
	const isClay = /clay/.test(tc);
	const isLoam = !isSandy && !isClay && /loam|silt/.test(tc);
	if (isSandy) {
		if (input.bulkDensity >= 1.8) return "High";
		if (input.bulkDensity >= 1.65) return "Moderate";
		return "Low";
	}
	if (isClay) {
		if (input.bulkDensity >= 1.47) return "High";
		if (input.bulkDensity >= 1.35) return "Moderate";
		return "Low";
	}
	if (isLoam) {
		if (input.bulkDensity >= 1.65) return "High";
		if (input.bulkDensity >= 1.5) return "Moderate";
		return "Low";
	}
	if (input.bulkDensity >= 1.65) return "High";
	if (input.bulkDensity >= 1.5) return "Moderate";
	return "Low";
}

// ---------------------------------------------------------------------------
// Texture suitability matrix
// ---------------------------------------------------------------------------

export type SuitabilityVerdict = "Suitable" | "Marginal" | "Unsuitable";

export interface SuitabilityEntry {
	verdict: SuitabilityVerdict;
	reasons: string[];
}

export interface SuitabilityMatrix {
	turfgrass: SuitabilityEntry;
	landscape: SuitabilityEntry;
	agriculture: SuitabilityEntry;
	irrigation: SuitabilityEntry;
}

/** Lookup map from normalised USDA textural class → per-use verdicts. */
const TEXTURE_USE_TABLE: Record<
	string,
	{ turfgrass: SuitabilityVerdict; landscape: SuitabilityVerdict; agriculture: SuitabilityVerdict; irrigation: SuitabilityVerdict }
> = {
	sand: { turfgrass: "Marginal", landscape: "Marginal", agriculture: "Marginal", irrigation: "Marginal" },
	"loamy sand": { turfgrass: "Suitable", landscape: "Suitable", agriculture: "Marginal", irrigation: "Suitable" },
	"sandy loam": { turfgrass: "Suitable", landscape: "Suitable", agriculture: "Suitable", irrigation: "Suitable" },
	loam: { turfgrass: "Suitable", landscape: "Suitable", agriculture: "Suitable", irrigation: "Suitable" },
	"silt loam": { turfgrass: "Suitable", landscape: "Suitable", agriculture: "Suitable", irrigation: "Suitable" },
	silt: { turfgrass: "Marginal", landscape: "Suitable", agriculture: "Suitable", irrigation: "Marginal" },
	"sandy clay loam": { turfgrass: "Suitable", landscape: "Suitable", agriculture: "Suitable", irrigation: "Marginal" },
	"clay loam": { turfgrass: "Marginal", landscape: "Suitable", agriculture: "Suitable", irrigation: "Marginal" },
	"silty clay loam": { turfgrass: "Marginal", landscape: "Suitable", agriculture: "Suitable", irrigation: "Marginal" },
	"sandy clay": { turfgrass: "Marginal", landscape: "Marginal", agriculture: "Marginal", irrigation: "Unsuitable" },
	"silty clay": { turfgrass: "Unsuitable", landscape: "Marginal", agriculture: "Marginal", irrigation: "Unsuitable" },
	clay: { turfgrass: "Unsuitable", landscape: "Marginal", agriculture: "Marginal", irrigation: "Unsuitable" },
};

function downgrade(
	current: SuitabilityVerdict,
	target: SuitabilityVerdict
): SuitabilityVerdict {
	const rank: Record<SuitabilityVerdict, number> = {
		Suitable: 2,
		Marginal: 1,
		Unsuitable: 0,
	};
	return rank[target] < rank[current] ? target : current;
}

export interface TextureSuitabilityInput {
	textureClass?: string;
	salinitySeverity?: SalinitySeverity;
	sodicitySeverity?: SodicitySeverity;
	drainageClass?: string;
}

/**
 * Returns the per-use suitability matrix, starting from the texture-only
 * lookup table and downgrading verdicts as salinity / sodicity / drainage
 * findings warrant. All downgrades append a human-readable reason.
 */
export function classifyTextureSuitability(
	input: TextureSuitabilityInput
): SuitabilityMatrix {
	const tc = (input.textureClass ?? "").toLowerCase().trim();
	const base = TEXTURE_USE_TABLE[tc] ?? {
		turfgrass: "Marginal",
		landscape: "Marginal",
		agriculture: "Marginal",
		irrigation: "Marginal",
	};

	const matrix: SuitabilityMatrix = {
		turfgrass: { verdict: base.turfgrass, reasons: reasonsFor("turfgrass", tc) },
		landscape: { verdict: base.landscape, reasons: reasonsFor("landscape", tc) },
		agriculture: { verdict: base.agriculture, reasons: reasonsFor("agriculture", tc) },
		irrigation: { verdict: base.irrigation, reasons: reasonsFor("irrigation", tc) },
	};

	if (input.salinitySeverity === "Strong" || input.salinitySeverity === "Severe") {
		const tag = `${input.salinitySeverity} salinity restricts crop choice`;
		matrix.agriculture.verdict = downgrade(matrix.agriculture.verdict, "Unsuitable");
		matrix.agriculture.reasons.push(tag);
		matrix.turfgrass.verdict = downgrade(matrix.turfgrass.verdict, "Marginal");
		matrix.turfgrass.reasons.push(tag);
	} else if (input.salinitySeverity === "Moderate") {
		matrix.agriculture.verdict = downgrade(matrix.agriculture.verdict, "Marginal");
		matrix.agriculture.reasons.push("Moderate salinity — salt-tolerant species recommended");
	}

	if (input.sodicitySeverity === "Strong" || input.sodicitySeverity === "Severe") {
		const tag = `${input.sodicitySeverity} sodicity — structural risk without amendment`;
		matrix.agriculture.verdict = downgrade(matrix.agriculture.verdict, "Unsuitable");
		matrix.agriculture.reasons.push(tag);
		matrix.irrigation.verdict = downgrade(matrix.irrigation.verdict, "Unsuitable");
		matrix.irrigation.reasons.push(tag);
	}

	if (input.drainageClass === "Very Poor" || input.drainageClass === "Poor") {
		const tag = `${input.drainageClass} drainage limits use`;
		matrix.turfgrass.verdict = downgrade(matrix.turfgrass.verdict, "Marginal");
		matrix.turfgrass.reasons.push(tag);
		matrix.irrigation.verdict = downgrade(matrix.irrigation.verdict, "Marginal");
		matrix.irrigation.reasons.push(tag);
	}

	return matrix;
}

function reasonsFor(_use: string, tc: string): string[] {
	return tc ? [`Texture class: ${tc}`] : [];
}
