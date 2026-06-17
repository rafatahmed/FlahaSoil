/**
 * @flaha/soil-physics — CAMPBELL model (Phase 10C-B).
 *
 * Campbell (1974) retention function:
 *
 *   ψ(θ) = ψe·(θ/θs)^(−b)     ⇒     θ(ψ) = θs·(ψ/ψe)^(−1/b)   for ψ ≥ ψe
 *   θ(ψ) = θs                                                   for ψ < ψe
 *
 * Parameters are NEVER estimated from texture in Phase 10C-B; they must be
 * supplied explicitly. Missing required parameters → MISSING_PARAMETERS;
 * present-but-invalid → INVALID_INPUT. FC/WP are not emitted (pressure-head
 * conventions are not defined/tested in this phase).
 *
 * CONVENTION
 *   ψ and ψe (airEntryPotential) are both expressed in kPa as positive
 *   magnitudes.
 *
 * REFERENCE
 *   Campbell, G.S. (1974). A simple method for determining unsaturated
 *   conductivity from moisture retention data. Soil Science 117:311-314.
 */

import type {
	WaterRetentionCurvePoint,
	WaterRetentionModelInput,
	WaterRetentionModelResult,
} from "../waterRetentionTypes";
import { validateCampbell } from "../waterRetentionValidation";

/** Standard tension sample points (kPa) spanning saturation → wilting. */
const TENSION_SAMPLES_KPA: ReadonlyArray<number> = Object.freeze([
	1, 3, 6, 10, 33, 100, 300, 1000, 1500,
]);

function thetaAt(psi: number, thetaS: number, psiE: number, b: number): number {
	if (psi <= psiE) return thetaS;
	return thetaS * Math.pow(psi / psiE, -1 / b);
}

export function computeCampbell(
	input: WaterRetentionModelInput
): WaterRetentionModelResult {
	const validation = validateCampbell(input);
	if (validation.status === "MISSING_PARAMETERS") {
		return {
			modelId: "CAMPBELL",
			status: "MISSING_PARAMETERS",
			missingParameters: validation.missingParameters,
		};
	}
	if (validation.status === "INVALID_INPUT") {
		return {
			modelId: "CAMPBELL",
			status: "INVALID_INPUT",
			warnings: validation.errors,
		};
	}

	const p = input.parameters as Record<string, number>;
	const thetaS = p.thetaS as number;
	const airEntryPotential = p.airEntryPotential as number;
	const b = p.b as number;

	const curvePoints: WaterRetentionCurvePoint[] = [];
	for (const psi of TENSION_SAMPLES_KPA) {
		const theta = thetaAt(psi, thetaS, airEntryPotential, b);
		if (!Number.isFinite(theta)) {
			return {
				modelId: "CAMPBELL",
				status: "INVALID_INPUT",
				warnings: [`Non-finite water content at ψ=${psi} kPa`],
			};
		}
		curvePoints.push({ matricPotentialKpa: psi, waterContentFraction: theta });
	}

	return {
		modelId: "CAMPBELL",
		status: "COMPUTED",
		curvePoints,
	};
}
