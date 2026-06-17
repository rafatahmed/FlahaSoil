/**
 * @flaha/soil-physics — LAB_MEASURED_CURVE model (Phase 10C-B).
 *
 * Passthrough validator for an explicitly supplied, measured soil-water
 * characteristic curve (e.g. pressure-plate / pressure-membrane data).
 *
 * SCIENTIFIC HONESTY
 *   This model NEVER invents, estimates, or interpolates data. It only
 *   validates and echoes back the curve points the caller actually provides.
 *   With no `measuredCurve` supplied it returns MISSING_PARAMETERS; with a
 *   malformed curve it returns INVALID_INPUT. No FC/WP are derived in this
 *   phase (interpolation conventions are not yet defined/tested).
 *
 * CONVENTION
 *   Each point: matricPotentialKpa > 0 (kPa) and waterContentFraction ∈ [0,1].
 */

import type {
	WaterRetentionCurvePoint,
	WaterRetentionModelInput,
	WaterRetentionModelResult,
} from "../waterRetentionTypes";
import { validateLabMeasuredCurve } from "../waterRetentionValidation";

export function computeLabMeasuredCurve(
	input: WaterRetentionModelInput
): WaterRetentionModelResult {
	const validation = validateLabMeasuredCurve(input.measuredCurve);
	if (validation.status === "MISSING_PARAMETERS") {
		return {
			modelId: "LAB_MEASURED_CURVE",
			status: "MISSING_PARAMETERS",
			missingParameters: validation.missingParameters,
		};
	}
	if (validation.status === "INVALID_INPUT") {
		return {
			modelId: "LAB_MEASURED_CURVE",
			status: "INVALID_INPUT",
			warnings: validation.errors,
		};
	}

	// Echo back the caller's data, sorted by ascending tension. No values are
	// added, removed, or interpolated.
	const curvePoints: WaterRetentionCurvePoint[] = [
		...(input.measuredCurve as WaterRetentionCurvePoint[]),
	].sort((a, b) => a.matricPotentialKpa - b.matricPotentialKpa);

	return {
		modelId: "LAB_MEASURED_CURVE",
		status: "COMPUTED",
		curvePoints,
	};
}
