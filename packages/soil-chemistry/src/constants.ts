/**
 * @flaha/soil-chemistry — constants.
 *
 * Every value here is a fixed parameter of the chemistry engine. Do NOT
 * fold interpretation thresholds into this file — the chemistry engine is
 * calculation-only; interpretation lives in `@flaha/soil-interpretation`
 * (Phase 2.3+).
 */

// ---------------------------------------------------------------------------
// Unit identifiers (informational — the engine assumes inputs are already in
// these units and does NOT convert).
// ---------------------------------------------------------------------------

export const UNITS = {
	cation: "cmol(+)/kg",
	cec: "cmol(+)/kg",
	texture: "percent (0-100)",
	ec: "dS/m",
	ph: "dimensionless",
} as const;

// ---------------------------------------------------------------------------
// CEC estimation — used in ESTIMATED mode only.
//
// Formula: CEC = clay × CLAY_CEC_COEFFICIENT
//              + organicMatter × OM_CEC_COEFFICIENT
//
// Clay and organic matter both contribute exchange sites; the coefficients
// reflect typical surface-charge density per unit mass of each fraction.
// These are screening values; lab-measured CEC always supersedes them.
// ---------------------------------------------------------------------------

export const CLAY_CEC_COEFFICIENT = 0.5;
export const OM_CEC_COEFFICIENT = 2;

// ---------------------------------------------------------------------------
// Numerical safety thresholds (NOT interpretation thresholds).
// ---------------------------------------------------------------------------

/** CEC values below this are treated as zero and rejected by the engine. */
export const MIN_VALID_CEC = 1e-9;

/** Lower bound for percent outputs after clamping. */
export const PERCENT_MIN = 0;

/** Upper bound for percent outputs after clamping. */
export const PERCENT_MAX = 100;

/** Lower bound for the SAR denominator argument before sqrt. */
export const MIN_SAR_DENOM = 1e-12;
