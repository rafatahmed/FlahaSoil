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
// Note: legacy physics output emits PAW as a percent (e.g. "13.1"); the
// thresholds here (50 / 150) are the spec-supplied buckets. They are
// applied to whatever numeric value is passed in without unit assumptions.
// ---------------------------------------------------------------------------
export function classifyWaterHolding(paw: number): string {
	if (paw < 50) return "Low";
	if (paw <= 150) return "Moderate";
	return "High";
}

// ---------------------------------------------------------------------------
// Drainage — pure passthrough of the physics-supplied class.
// ---------------------------------------------------------------------------
export function passthroughDrainage(drainageClass: string): string {
	return drainageClass;
}
