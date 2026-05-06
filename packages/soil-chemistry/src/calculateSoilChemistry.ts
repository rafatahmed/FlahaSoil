/**
 * @flaha/soil-chemistry — core engine.
 *
 * Pure-function CEC / base saturation / cation-balance / ESP / SAR
 * calculator. Produces a numeric `SoilChemistryResult`; never interprets
 * (interpretation lives in `@flaha/soil-interpretation`).
 *
 * Determinism contract:
 *   - No internal state.
 *   - No randomness.
 *   - No I/O.
 *   - Same input → same output, byte-for-byte.
 */

import {
	CLAY_CEC_COEFFICIENT,
	MIN_SAR_DENOM,
	MIN_VALID_CEC,
	OM_CEC_COEFFICIENT,
	PERCENT_MAX,
	PERCENT_MIN,
} from "./constants";
import type { SoilChemistryInput, SoilChemistryResult } from "./types";
import { validateInput } from "./validation";

/** Clamps `value` into [PERCENT_MIN, PERCENT_MAX]. */
function clampPercent(value: number): number {
	if (!Number.isFinite(value)) {
		return PERCENT_MIN;
	}
	return Math.min(PERCENT_MAX, Math.max(PERCENT_MIN, value));
}

/**
 * Resolves CEC and the four base cations from the input under the rules of
 * the active mode. Cations default to `0` when omitted (LAB mode), texture
 * inputs are required when ESTIMATED.
 */
function resolveCecAndCations(
	input: SoilChemistryInput
): { cec: number; ca: number; mg: number; k: number; na: number; caProvided: boolean; mgProvided: boolean } {
	const ca = input.ca ?? 0;
	const mg = input.mg ?? 0;
	const k = input.k ?? 0;
	const na = input.na ?? 0;

	let cec: number;

	if (input.mode === "LAB") {
		// Lab CEC takes precedence; otherwise sum of supplied base cations.
		cec = input.cec !== undefined ? input.cec : ca + mg + k + na;
	} else {
		// ESTIMATED — texture-derived CEC.
		// validateInput guarantees clay & organicMatter are present here.
		const clay = input.clay as number;
		const om = input.organicMatter as number;
		cec = clay * CLAY_CEC_COEFFICIENT + om * OM_CEC_COEFFICIENT;
	}

	return {
		cec,
		ca,
		mg,
		k,
		na,
		caProvided: input.ca !== undefined,
		mgProvided: input.mg !== undefined,
	};
}

/**
 * Top-level entry point.
 *
 * @param input  See {@link SoilChemistryInput}. Validated up-front.
 * @returns      See {@link SoilChemistryResult}. All percent fields are
 *               clamped to [0, 100].
 * @throws       `Error` on invalid input or when the resolved CEC is zero
 *               (would otherwise force division-by-zero).
 */
export function calculateSoilChemistry(
	input: SoilChemistryInput
): SoilChemistryResult {
	validateInput(input);

	const { cec, ca, mg, k, na, caProvided, mgProvided } =
		resolveCecAndCations(input);

	if (cec < MIN_VALID_CEC) {
		throw new Error(
			"Invalid state: resolved CEC is zero (cannot compute saturation percentages); " +
				"check that LAB cations or ESTIMATED texture inputs are non-zero"
		);
	}

	// Individual cation percentages of CEC.
	const caPercentRaw = (ca / cec) * 100;
	const mgPercentRaw = (mg / cec) * 100;
	const kPercentRaw = (k / cec) * 100;
	const naPercentRaw = (na / cec) * 100;

	const caPercent = clampPercent(caPercentRaw);
	const mgPercent = clampPercent(mgPercentRaw);
	const kPercent = clampPercent(kPercentRaw);
	const naPercent = clampPercent(naPercentRaw);

	// Base saturation = sum of base-cation share of CEC.
	const baseSaturation = clampPercent(
		((ca + mg + k + na) / cec) * 100
	);

	// Exchangeable Sodium Percentage (Richards 1954, USDA Handbook 60).
	const esp = naPercent;

	// Cation balance (the part NOT held by Ca + Mg).
	const cationBalanceOther = clampPercent(
		PERCENT_MAX - (caPercent + mgPercent)
	);

	// SAR (Sodium Adsorption Ratio) — emitted only when both Ca and Mg are
	// supplied. Formula: SAR = Na / sqrt((Ca + Mg) / 2), all in cmol(+)/kg.
	let sar: number | undefined;
	if (caProvided && mgProvided) {
		const denom = (ca + mg) / 2;
		sar = denom < MIN_SAR_DENOM ? 0 : na / Math.sqrt(denom);
		if (!Number.isFinite(sar)) {
			sar = 0;
		}
	}

	const result: SoilChemistryResult = {
		cec,
		baseSaturation,
		caPercent,
		mgPercent,
		kPercent,
		naPercent,
		esp,
		cationBalanceOther,
		calculationMode: input.mode,
	};

	if (sar !== undefined) {
		result.sar = sar;
	}
	if (input.ph !== undefined) {
		result.ph = input.ph;
	}
	if (input.ec !== undefined) {
		result.ec = input.ec;
	}

	return result;
}
