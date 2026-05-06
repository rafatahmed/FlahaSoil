/**
 * FlahaSOIL v2 API — salinity input normalization.
 *
 * EC (electrical conductivity, dS/m) is the authoritative salinity
 * metric for the v2 stack. This module reduces a `(ecDsM, tdsMgL)`
 * pair from a `SoilChemistryInput` into a single canonical EC for the
 * physics, chemistry, and interpretation engines:
 *
 *   1. `ecDsM` present              → use it verbatim.
 *   2. only `tdsMgL` present        → derive `ecDsM = tdsMgL / 640`.
 *   3. both present                 → use `ecDsM`; if it predicts a TDS
 *                                     more than 20 % away from the
 *                                     supplied `tdsMgL`, push a single
 *                                     warning string.
 *   4. neither present              → return no EC, no warnings.
 *
 * Hard rules:
 *   - Pure function. No I/O, no Prisma, no engine imports.
 *   - Independent of CEC / cation data. Safe for PRELIMINARY tests
 *     (which collect pH/EC/TDS only).
 *   - Never throws on missing input — bad/missing values are simply
 *     ignored by the downstream engines.
 */

/** USDA / FAO standard EC↔TDS conversion factor (mg/L per dS/m). */
export const TDS_PER_DSM = 640;

/**
 * Maximum tolerated relative difference between supplied TDS and the
 * TDS predicted by `ecDsM × 640` before a consistency warning is
 * emitted. 0.20 = 20 %, taken from the requirement.
 */
export const SALINITY_CONSISTENCY_TOLERANCE = 0.2;

/**
 * Standard warning surfaced on the calculate response when EC and TDS
 * disagree by more than `SALINITY_CONSISTENCY_TOLERANCE`. EC always
 * wins as the authoritative value.
 */
export const SALINITY_INCONSISTENCY_WARNING =
	"TDS inconsistent with EC; EC used as primary";

export interface SalinityInput {
	ecDsM?: number | null;
	tdsMgL?: number | null;
}

export interface NormalizedSalinity {
	/**
	 * Canonical EC in dS/m. Either the supplied `ecDsM` (when present)
	 * or `tdsMgL / 640` (when only TDS was supplied). Omitted when no
	 * salinity data was supplied at all.
	 */
	ecDsM?: number;
	/** Original TDS as supplied, echoed for downstream callers that need it. */
	tdsMgL?: number;
	/** Whether `ecDsM` was derived from `tdsMgL` rather than supplied directly. */
	derivedFromTds: boolean;
	/** Per-call warnings to surface in the calculate response. */
	warnings: string[];
}

function toFiniteNonNegative(value: number | null | undefined): number | undefined {
	if (typeof value !== "number") return undefined;
	if (!Number.isFinite(value)) return undefined;
	if (value < 0) return undefined;
	return value;
}

/**
 * Reduces `(ecDsM, tdsMgL)` to a canonical EC plus optional warnings.
 *
 * See module docstring for the rules. Inputs are not mutated; the
 * function returns a fresh `NormalizedSalinity`.
 */
export function normalizeSalinity(
	input: SalinityInput | null | undefined
): NormalizedSalinity {
	const warnings: string[] = [];
	if (input === null || input === undefined) {
		return { derivedFromTds: false, warnings };
	}

	const ec = toFiniteNonNegative(input.ecDsM);
	const tds = toFiniteNonNegative(input.tdsMgL);

	if (ec !== undefined) {
		if (tds !== undefined) {
			if (!isWithinTolerance(ec, tds)) {
				warnings.push(SALINITY_INCONSISTENCY_WARNING);
			}
		}
		const result: NormalizedSalinity = {
			ecDsM: ec,
			derivedFromTds: false,
			warnings,
		};
		if (tds !== undefined) result.tdsMgL = tds;
		return result;
	}

	if (tds !== undefined) {
		return {
			ecDsM: tds / TDS_PER_DSM,
			tdsMgL: tds,
			derivedFromTds: true,
			warnings,
		};
	}

	return { derivedFromTds: false, warnings };
}

/**
 * Relative difference between the TDS predicted by `ecDsM × 640` and
 * the supplied `tdsMgL`. Uses the larger of the two as the denominator
 * so the test is symmetric and well-defined when one of them is zero.
 */
function isWithinTolerance(ec: number, tds: number): boolean {
	const expectedTds = ec * TDS_PER_DSM;
	const denom = Math.max(expectedTds, tds);
	if (denom === 0) {
		// Both EC and supplied TDS are exactly zero → fully consistent.
		return true;
	}
	const relativeDiff = Math.abs(expectedTds - tds) / denom;
	return relativeDiff <= SALINITY_CONSISTENCY_TOLERANCE;
}
