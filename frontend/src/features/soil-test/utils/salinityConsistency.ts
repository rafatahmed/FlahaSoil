/**
 * FlahaSOIL v2 — salinity (EC ↔ TDS) consistency helper.
 *
 * The empirical relationship TDS ≈ EC × 640 mg/L per dS/m is standard
 * for typical irrigation/soil-saturated-paste extracts (Hanlon &
 * Provin; FAO 29). When users enter both EC (dS/m) and TDS (mg/L),
 * this helper checks the ratio falls inside a tolerant 500–800
 * mg/L·dS⁻¹ window and surfaces a soft warning when it does not, so
 * the user can double-check the lab worksheet before submitting.
 *
 * Submission is never blocked — backend `salinity-normalization`
 * (Phase 7C) still picks EC as primary and emits its own
 * `SALINITY_INCONSISTENT` warning code on the calculate response.
 */
import type { SoilTestDraftChemistryInput } from "../state/soilTestDraft";

export const TDS_PER_EC_MIN = 500;
export const TDS_PER_EC_MAX = 800;

export type SalinityConsistencyStatus =
	| "missing"
	| "ec-only"
	| "tds-only"
	| "consistent"
	| "inconsistent";

export interface SalinityConsistencyResult {
	status: SalinityConsistencyStatus;
	ratio: number | null;
	message: string | null;
}

export function checkSalinityConsistency(
	input: SoilTestDraftChemistryInput
): SalinityConsistencyResult {
	const ec = numOrNull(input.ecDsM);
	const tds = numOrNull(input.tdsMgL);

	if (ec === null && tds === null) {
		return { status: "missing", ratio: null, message: null };
	}
	if (ec !== null && tds === null) {
		return {
			status: "ec-only",
			ratio: null,
			message: "EC entered; TDS will be derived if needed.",
		};
	}
	if (ec === null && tds !== null) {
		return {
			status: "tds-only",
			ratio: null,
			message: "TDS entered; EC will be derived if needed.",
		};
	}
	if (ec === null || ec === 0) {
		return { status: "missing", ratio: null, message: null };
	}

	const ratio = (tds as number) / ec;
	if (ratio >= TDS_PER_EC_MIN && ratio <= TDS_PER_EC_MAX) {
		return {
			status: "consistent",
			ratio,
			message: `EC and TDS look consistent (\u2248${Math.round(ratio)} mg/L per dS/m).`,
		};
	}
	return {
		status: "inconsistent",
		ratio,
		message: `Ratio ${Math.round(ratio)} mg/L per dS/m is outside the expected ${TDS_PER_EC_MIN}\u2013${TDS_PER_EC_MAX} window. Please double-check the lab worksheet.`,
	};
}

function numOrNull(v: number | null | undefined): number | null {
	return typeof v === "number" && Number.isFinite(v) ? v : null;
}
