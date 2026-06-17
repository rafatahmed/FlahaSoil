/**
 * @flaha/soil-physics — Water-retention model resolver (Phase 10C-B).
 *
 * Resolves a model id to its metadata, reports availability/computability for
 * a given input, and dispatches a computation to the correct model adapter.
 *
 * RESOLUTION RULES
 *   - missing modelId            → SAXTON_RAWLS_2006 (production default)
 *   - SAXTON_RAWLS_2006          → active default, computable from texture
 *   - PARAMETER_REQUIRED model   → metadata available; computes only when all
 *                                   required parameters are supplied
 *   - FUTURE model               → NOT_AVAILABLE (never computed)
 *   - unknown model              → throws a safe, explicit error
 */

import { WATER_RETENTION_MODELS } from "./waterRetentionModels";
import type {
	WaterRetentionModelAvailability,
	WaterRetentionModelId,
	WaterRetentionModelInput,
	WaterRetentionModelMetadata,
	WaterRetentionModelResult,
} from "./waterRetentionTypes";
import {
	collectMissingParameters,
} from "./waterRetentionValidation";
import { computeSaxtonRawls2006 } from "./models/saxtonRawls2006";
import { computeVanGenuchten } from "./models/vanGenuchten";
import { computeBrooksCorey } from "./models/brooksCorey";
import { computeCampbell } from "./models/campbell";
import { computeLabMeasuredCurve } from "./models/labMeasuredCurve";

/** The single production-default model id. */
export const DEFAULT_WATER_RETENTION_MODEL_ID: WaterRetentionModelId =
	"SAXTON_RAWLS_2006";

function isKnownModelId(id: string): id is WaterRetentionModelId {
	return Object.prototype.hasOwnProperty.call(WATER_RETENTION_MODELS, id);
}

/** Returns the metadata for the production-default model. */
export function getDefaultWaterRetentionModel(): WaterRetentionModelMetadata {
	return WATER_RETENTION_MODELS[DEFAULT_WATER_RETENTION_MODEL_ID];
}

/** Returns metadata for every registered model. */
export function listWaterRetentionModels(): WaterRetentionModelMetadata[] {
	return Object.values(WATER_RETENTION_MODELS);
}

/** Returns metadata for a specific model, or throws for an unknown id. */
export function getWaterRetentionModelMetadata(
	modelId: WaterRetentionModelId
): WaterRetentionModelMetadata {
	return WATER_RETENTION_MODELS[modelId];
}

/**
 * Resolve a (possibly absent / possibly unknown) model id to metadata.
 * Missing id falls back to the default; unknown id throws a safe error.
 */
export function resolveWaterRetentionModel(
	modelId?: WaterRetentionModelId | string
): WaterRetentionModelMetadata {
	if (modelId === undefined || modelId === null || modelId === "") {
		return getDefaultWaterRetentionModel();
	}
	if (!isKnownModelId(modelId)) {
		throw new Error(`Unknown water-retention model id: "${modelId}"`);
	}
	return WATER_RETENTION_MODELS[modelId];
}

/** Required parameter keys for each parameterized model. */
const REQUIRED_PARAMS: Partial<Record<WaterRetentionModelId, string[]>> = {
	VAN_GENUCHTEN: ["thetaR", "thetaS", "alpha", "n"],
	BROOKS_COREY: ["thetaR", "thetaS", "airEntryPressure", "lambda"],
	CAMPBELL: ["thetaS", "airEntryPotential", "b"],
};

/**
 * Report whether a model can be computed now for the given input, and which
 * required parameters (if any) are still missing.
 */
export function getWaterRetentionModelAvailability(
	modelId: WaterRetentionModelId,
	input: WaterRetentionModelInput
): WaterRetentionModelAvailability {
	const meta = WATER_RETENTION_MODELS[modelId];
	if (!meta.computable) {
		return { modelId, status: meta.status, computableNow: false, missingParameters: [] };
	}
	if (modelId === "SAXTON_RAWLS_2006") {
		const missing = collectMissingParameters(
			{ sand: input.sand as number, clay: input.clay as number },
			["sand", "clay"]
		);
		return { modelId, status: meta.status, computableNow: missing.length === 0, missingParameters: missing };
	}
	if (modelId === "LAB_MEASURED_CURVE") {
		const missing = input.measuredCurve && input.measuredCurve.length > 0 ? [] : ["measuredCurve"];
		return { modelId, status: meta.status, computableNow: missing.length === 0, missingParameters: missing };
	}
	const required = REQUIRED_PARAMS[modelId] ?? [];
	const missing = collectMissingParameters(input.parameters, required);
	return { modelId, status: meta.status, computableNow: missing.length === 0, missingParameters: missing };
}

/** Convenience boolean wrapper around {@link getWaterRetentionModelAvailability}. */
export function isWaterRetentionModelComputable(
	modelId: WaterRetentionModelId,
	input: WaterRetentionModelInput
): boolean {
	return getWaterRetentionModelAvailability(modelId, input).computableNow;
}

/**
 * Dispatch a computation to the correct model adapter. FUTURE / non-computable
 * models return a safe NOT_AVAILABLE result rather than throwing.
 */
export function computeWaterRetentionModel(
	modelId: WaterRetentionModelId,
	input: WaterRetentionModelInput
): WaterRetentionModelResult {
	const meta = WATER_RETENTION_MODELS[modelId];
	if (!meta.computable) {
		return { modelId, status: "NOT_AVAILABLE" };
	}
	switch (modelId) {
		case "SAXTON_RAWLS_2006":
			return computeSaxtonRawls2006(input);
		case "VAN_GENUCHTEN":
			return computeVanGenuchten(input);
		case "BROOKS_COREY":
			return computeBrooksCorey(input);
		case "CAMPBELL":
			return computeCampbell(input);
		case "LAB_MEASURED_CURVE":
			return computeLabMeasuredCurve(input);
		default:
			return { modelId, status: "NOT_AVAILABLE" };
	}
}
