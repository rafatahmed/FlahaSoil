/**
 * @flaha/soil-physics — VAN_GENUCHTEN model (Phase 10C-B).
 *
 * Van Genuchten (1980) retention function:
 *
 *   θ(ψ) = θr + (θs − θr) / [ 1 + (α·ψ)^n ]^m
 *
 * with m derived from n via the Mualem relation m = 1 − 1/n when m is not
 * supplied. Parameters are NEVER estimated from texture in Phase 10C-B; they
 * must be supplied explicitly. If required parameters are missing the model
 * returns MISSING_PARAMETERS; if present-but-invalid it returns INVALID_INPUT.
 *
 * CONVENTION
 *   ψ (matric potential) is expressed in kPa and α in 1/kPa, so (α·ψ) is
 *   dimensionless. FC/WP are intentionally NOT emitted — pressure-head
 *   conventions for FC/WP are not defined/tested in this phase.
 *
 * REFERENCE
 *   van Genuchten, M.Th. (1980). A closed-form equation for predicting the
 *   hydraulic conductivity of unsaturated soils. SSSAJ 44:892-898.
 */

import type {
	WaterRetentionCurvePoint,
	WaterRetentionModelInput,
	WaterRetentionModelResult,
} from "../waterRetentionTypes";
import { validateVanGenuchten } from "../waterRetentionValidation";

/** Standard tension sample points (kPa) spanning saturation → wilting. */
const TENSION_SAMPLES_KPA: ReadonlyArray<number> = Object.freeze([
	1, 3, 6, 10, 33, 100, 300, 1000, 1500,
]);

/** θ(ψ) for the Van Genuchten model at a single tension. */
function thetaAt(
	psi: number,
	thetaR: number,
	thetaS: number,
	alpha: number,
	n: number,
	m: number
): number {
	const denom = Math.pow(1 + Math.pow(alpha * psi, n), m);
	return thetaR + (thetaS - thetaR) / denom;
}

export function computeVanGenuchten(
	input: WaterRetentionModelInput
): WaterRetentionModelResult {
	const validation = validateVanGenuchten(input);
	if (validation.status === "MISSING_PARAMETERS") {
		return {
			modelId: "VAN_GENUCHTEN",
			status: "MISSING_PARAMETERS",
			missingParameters: validation.missingParameters,
		};
	}
	if (validation.status === "INVALID_INPUT") {
		return {
			modelId: "VAN_GENUCHTEN",
			status: "INVALID_INPUT",
			warnings: validation.errors,
		};
	}

	const p = input.parameters as Record<string, number>;
	const thetaR = p.thetaR as number;
	const thetaS = p.thetaS as number;
	const alpha = p.alpha as number;
	const n = p.n as number;
	const mParam = p.m as number | undefined;
	const m = mParam !== undefined && Number.isFinite(mParam) ? mParam : 1 - 1 / n;

	const curvePoints: WaterRetentionCurvePoint[] = [];
	for (const psi of TENSION_SAMPLES_KPA) {
		const theta = thetaAt(psi, thetaR, thetaS, alpha, n, m);
		if (!Number.isFinite(theta)) {
			return {
				modelId: "VAN_GENUCHTEN",
				status: "INVALID_INPUT",
				warnings: [`Non-finite water content at ψ=${psi} kPa`],
			};
		}
		curvePoints.push({ matricPotentialKpa: psi, waterContentFraction: theta });
	}

	return {
		modelId: "VAN_GENUCHTEN",
		status: "COMPUTED",
		...(validation.warnings.length > 0 ? { warnings: validation.warnings } : {}),
		curvePoints,
	};
}
