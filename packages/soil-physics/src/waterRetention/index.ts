/**
 * @flaha/soil-physics — Advanced Water-Retention Model Framework (Phase 10C-B).
 *
 * Public surface of the model-aware retention layer. SAXTON_RAWLS_2006 remains
 * the active production default; the parameterized models (Van Genuchten,
 * Brooks-Corey, Campbell) and the lab-measured-curve passthrough are
 * registered and computable only when explicit parameters are supplied. No
 * model fabricates missing inputs.
 *
 * This module is internal to @flaha/soil-physics and is NOT wired into the
 * public API/DTO surface in Phase 10C-B.
 */

export * from "./waterRetentionTypes";
export * from "./waterRetentionValidation";
export {
	WATER_RETENTION_MODELS,
} from "./waterRetentionModels";
export {
	DEFAULT_WATER_RETENTION_MODEL_ID,
	getDefaultWaterRetentionModel,
	listWaterRetentionModels,
	getWaterRetentionModelMetadata,
	resolveWaterRetentionModel,
	getWaterRetentionModelAvailability,
	isWaterRetentionModelComputable,
	computeWaterRetentionModel,
} from "./waterRetentionResolver";
export { computeSaxtonRawls2006 } from "./models/saxtonRawls2006";
export { computeVanGenuchten } from "./models/vanGenuchten";
export { computeBrooksCorey } from "./models/brooksCorey";
export { computeCampbell } from "./models/campbell";
export { computeLabMeasuredCurve } from "./models/labMeasuredCurve";
