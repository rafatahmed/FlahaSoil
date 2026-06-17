/**
 * @flaha/soil-physics — SAXTON_RAWLS_2006 model adapter (Phase 10C-B).
 *
 * Thin wrapper around the EXISTING, unchanged production engine
 * (`buildWaterRetentionCurve` / `calculateSoilPhysics`). It does NOT
 * reimplement or move any Saxton-Rawls formula — it only adapts the engine
 * output into the model-framework result shape so the registry can treat
 * SR2006 as the active default alongside the parameterized models.
 *
 * Water contents are reported as FRACTIONS (0-1), consistent with
 * `WaterRetentionCurvePoint.waterContentFraction`.
 *
 * SCIENTIFIC NOTE
 *   Saxton & Rawls (2006) is a pedotransfer ESTIMATE from texture + organic
 *   matter, not a measured pressure-plate calibration.
 */

import { buildWaterRetentionCurve } from "../../waterRetentionCurve";
import type {
	WaterRetentionCurvePoint,
	WaterRetentionModelInput,
	WaterRetentionModelResult,
} from "../waterRetentionTypes";

/** Texture inputs SR2006 must have to compute anything. */
const REQUIRED_TEXTURE_INPUTS = ["sand", "clay"] as const;

function missingTextureInputs(input: WaterRetentionModelInput): string[] {
	const missing: string[] = [];
	for (const key of REQUIRED_TEXTURE_INPUTS) {
		const value = input[key];
		if (value === undefined || !Number.isFinite(value)) missing.push(key);
	}
	return missing;
}

/**
 * Compute retention outputs via the production Saxton-Rawls engine.
 *
 * Returns:
 *   - MISSING_PARAMETERS when sand/clay are absent,
 *   - INVALID_INPUT when texture/OM are out of the engine's accepted range,
 *   - COMPUTED with finite outputs + curve points otherwise.
 */
export function computeSaxtonRawls2006(
	input: WaterRetentionModelInput
): WaterRetentionModelResult {
	const missing = missingTextureInputs(input);
	if (missing.length > 0) {
		return {
			modelId: "SAXTON_RAWLS_2006",
			status: "MISSING_PARAMETERS",
			missingParameters: missing,
		};
	}

	const sand = input.sand as number;
	const clay = input.clay as number;

	let curve;
	try {
		curve = buildWaterRetentionCurve({
			sand,
			clay,
			...(input.organicMatter !== undefined
				? { organicMatter: input.organicMatter }
				: {}),
			...(input.densityFactor !== undefined
				? { densityFactor: input.densityFactor }
				: {}),
		});
	} catch (err) {
		return {
			modelId: "SAXTON_RAWLS_2006",
			status: "INVALID_INPUT",
			warnings: [err instanceof Error ? err.message : "Invalid Saxton-Rawls input"],
		};
	}

	const fieldCapacity = curve.fieldCapacity.waterContentVolPercent / 100;
	const wiltingPoint = curve.wiltingPoint.waterContentVolPercent / 100;
	const saturation = curve.saturation.waterContentVolPercent / 100;
	const plantAvailableWater = curve.plantAvailableWater / 100;

	const outputs = { fieldCapacity, wiltingPoint, plantAvailableWater, saturation };
	for (const [key, value] of Object.entries(outputs)) {
		if (!Number.isFinite(value)) {
			return {
				modelId: "SAXTON_RAWLS_2006",
				status: "INVALID_INPUT",
				warnings: [`Saxton-Rawls produced a non-finite ${key}`],
			};
		}
	}

	const curvePoints: WaterRetentionCurvePoint[] = curve.points.map((pt) => ({
		matricPotentialKpa: pt.tensionKpa,
		waterContentFraction: pt.waterContentVolPercent / 100,
	}));

	return {
		modelId: "SAXTON_RAWLS_2006",
		status: "COMPUTED",
		outputs,
		curvePoints,
	};
}
