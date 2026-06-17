/**
 * @flaha/soil-physics — Advanced Water-Retention Model Framework (Phase 10C-B).
 *
 * Type definitions for a model-aware, parameter-honest water-retention layer.
 *
 * SCIENTIFIC HONESTY CONTRACT
 *   Different retention models require different inputs. FlahaSOIL must NEVER
 *   fabricate missing model parameters. A model with absent required inputs
 *   returns `MISSING_PARAMETERS` (not estimated output); a model with bad
 *   inputs returns `INVALID_INPUT`. Only SAXTON_RAWLS_2006 is the active,
 *   production-default model in Phase 10C-B.
 *
 * NOTE: These types are internal to @flaha/soil-physics. They are NOT exposed
 * on the public API/DTO surface in Phase 10C-B.
 */

/** Stable identifiers for every registered water-retention model. */
export type WaterRetentionModelId =
	| "SAXTON_RAWLS_2006"
	| "VAN_GENUCHTEN"
	| "BROOKS_COREY"
	| "CAMPBELL"
	| "LAB_MEASURED_CURVE"
	| "ROSETTA_HYPRES_FUTURE"
	| "CUSTOM_ORGANIZATION_MODEL";

/**
 * Lifecycle / availability status of a model.
 *   - ACTIVE_DEFAULT          : production default (SAXTON_RAWLS_2006 only)
 *   - AVAILABLE_WITH_PARAMETERS : computable today when all params supplied
 *   - PARAMETER_REQUIRED      : registered; requires explicit parameters
 *   - REFERENCE_ONLY          : metadata/citation only, no computation
 *   - FUTURE                  : reserved; not allowed for computation yet
 */
export type WaterRetentionModelStatus =
	| "ACTIVE_DEFAULT"
	| "AVAILABLE_WITH_PARAMETERS"
	| "PARAMETER_REQUIRED"
	| "REFERENCE_ONLY"
	| "FUTURE";

/** Output quantities a model is capable of producing. */
export type WaterRetentionOutputKey =
	| "fieldCapacity"
	| "wiltingPoint"
	| "plantAvailableWater"
	| "saturation"
	| "ksat"
	| "curvePoints";

/** A single point on a soil-water characteristic curve. */
export interface WaterRetentionCurvePoint {
	/** Matric potential / tension, kPa (positive magnitude). */
	matricPotentialKpa: number;
	/** Volumetric water content as a fraction (0-1). */
	waterContentFraction: number;
}

/** A required-parameter descriptor for a model. */
export interface WaterRetentionModelParameterRequirement {
	/** Parameter key, e.g. "alpha", "n", "thetaR". */
	key: string;
	/** Human-readable description. */
	description: string;
	/** Unit string, or "-" for dimensionless. */
	unit: string;
	/** Whether the parameter is required (vs. optional). */
	required: boolean;
}

/** Static, computation-free description of a model. */
export interface WaterRetentionModelMetadata {
	id: WaterRetentionModelId;
	name: string;
	status: WaterRetentionModelStatus;
	/** Texture/composition inputs required (Saxton-Rawls style). */
	requiredInputs: string[];
	/** Optional texture/composition inputs. */
	optionalInputs: string[];
	/** Model-specific parameters (theta_r, alpha, n, …). */
	parameters: WaterRetentionModelParameterRequirement[];
	/** Output quantities the model can produce. */
	outputs: WaterRetentionOutputKey[];
	/** True only for the single production-default model. */
	productionDefault: boolean;
	/** Whether the model can be computed in Phase 10C-B at all. */
	computable: boolean;
	/** Literature citation. */
	reference: string;
	/** Honest limitations / caveats. */
	limitations: string[];
}

/**
 * Caller-supplied input for a retention computation. Texture fields feed
 * Saxton-Rawls; `parameters` carries model-specific values for the
 * parameterized models. Nothing here is ever defaulted into a parameter
 * a model requires.
 */
export interface WaterRetentionModelInput {
	sand?: number;
	clay?: number;
	organicMatter?: number;
	densityFactor?: number;
	/** Model-specific parameters keyed by name (e.g. alpha, n, thetaR). */
	parameters?: Record<string, number>;
	/** Explicitly supplied measured curve (LAB_MEASURED_CURVE only). */
	measuredCurve?: WaterRetentionCurvePoint[];
}

/** Result status for a computation attempt. */
export type WaterRetentionResultStatus =
	| "COMPUTED"
	| "NOT_AVAILABLE"
	| "MISSING_PARAMETERS"
	| "INVALID_INPUT";

/** Numeric outputs a model may produce (all optional, all finite when set). */
export interface WaterRetentionOutputs {
	fieldCapacity?: number;
	wiltingPoint?: number;
	plantAvailableWater?: number;
	saturation?: number;
}

/** Result of attempting a retention computation for one model. */
export interface WaterRetentionModelResult {
	modelId: WaterRetentionModelId;
	status: WaterRetentionResultStatus;
	/** Present (non-empty) only when status === "MISSING_PARAMETERS". */
	missingParameters?: string[];
	/** Non-fatal advisories (e.g. "m derived via Mualem m = 1 - 1/n"). */
	warnings?: string[];
	/** Numeric outputs (only when status === "COMPUTED"). */
	outputs?: WaterRetentionOutputs;
	/** Curve points (only when status === "COMPUTED" and supported). */
	curvePoints?: WaterRetentionCurvePoint[];
}

/** Availability descriptor for a model under a given input. */
export interface WaterRetentionModelAvailability {
	modelId: WaterRetentionModelId;
	status: WaterRetentionModelStatus;
	computableNow: boolean;
	missingParameters: string[];
}
