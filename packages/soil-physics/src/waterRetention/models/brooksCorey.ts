/**
 * @flaha/soil-physics — BROOKS_COREY model (Phase 10C-B).
 *
 * Brooks & Corey (1964) retention function:
 *
 *   θ(ψ) = θr + (θs − θr)·(ψb/ψ)^λ      for ψ ≥ ψb (air-entry pressure)
 *   θ(ψ) = θs                           for ψ < ψb
 *
 * Parameters are NEVER estimated from texture in Phase 10C-B; they must be
 * supplied explicitly. Missing required parameters → MISSING_PARAMETERS;
 * present-but-invalid → INVALID_INPUT. FC/WP are not emitted (pressure-head
 * conventions are not defined/tested in this phase).
 *
 * CONVENTION
 *   ψ and ψb (airEntryPressure) are both expressed in kPa.
 *
 * REFERENCE
 *   Brooks, R.H. and Corey, A.T. (1964). Hydraulic properties of porous
 *   media. Hydrology Paper 3, Colorado State University.
 */

import type {
	WaterRetentionCurvePoint,
	WaterRetentionModelInput,
	WaterRetentionModelResult,
} from "../waterRetentionTypes";
import { validateBrooksCorey } from "../waterRetentionValidation";

/** Standard tension sample points (kPa) spanning saturation → wilting. */
const TENSION_SAMPLES_KPA: ReadonlyArray<number> = Object.freeze([
	1, 3, 6, 10, 33, 100, 300, 1000, 1500,
]);

function thetaAt(
	psi: number,
	thetaR: number,
	thetaS: number,
	psiB: number,
	lambda: number
): number {
	if (psi <= psiB) return thetaS;
	return thetaR + (thetaS - thetaR) * Math.pow(psiB / psi, lambda);
}

export function computeBrooksCorey(
	input: WaterRetentionModelInput
): WaterRetentionModelResult {
	const validation = validateBrooksCorey(input);
	if (validation.status === "MISSING_PARAMETERS") {
		return {
			modelId: "BROOKS_COREY",
			status: "MISSING_PARAMETERS",
			missingParameters: validation.missingParameters,
		};
	}
	if (validation.status === "INVALID_INPUT") {
		return {
			modelId: "BROOKS_COREY",
			status: "INVALID_INPUT",
			warnings: validation.errors,
		};
	}

	const p = input.parameters as Record<string, number>;
	const thetaR = p.thetaR as number;
	const thetaS = p.thetaS as number;
	const airEntryPressure = p.airEntryPressure as number;
	const lambda = p.lambda as number;

	const curvePoints: WaterRetentionCurvePoint[] = [];
	for (const psi of TENSION_SAMPLES_KPA) {
		const theta = thetaAt(psi, thetaR, thetaS, airEntryPressure, lambda);
		if (!Number.isFinite(theta)) {
			return {
				modelId: "BROOKS_COREY",
				status: "INVALID_INPUT",
				warnings: [`Non-finite water content at ψ=${psi} kPa`],
			};
		}
		curvePoints.push({ matricPotentialKpa: psi, waterContentFraction: theta });
	}

	return {
		modelId: "BROOKS_COREY",
		status: "COMPUTED",
		curvePoints,
	};
}
