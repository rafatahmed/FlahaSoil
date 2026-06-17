/**
 * @flaha/soil-physics — Water-retention model registry (Phase 10C-B).
 *
 * The single source of truth for which retention models exist, their status,
 * required parameters, producible outputs, and citations. This registry is
 * metadata only — it performs no computation.
 *
 * INVARIANTS
 *   - Exactly one model has status "ACTIVE_DEFAULT" (SAXTON_RAWLS_2006).
 *   - Exactly one model has productionDefault === true (SAXTON_RAWLS_2006).
 *   - All model IDs are unique.
 *   - FUTURE / REFERENCE_ONLY models are not computable.
 */

import type {
	WaterRetentionModelId,
	WaterRetentionModelMetadata,
} from "./waterRetentionTypes";

/** Frozen registry keyed by model id. */
export const WATER_RETENTION_MODELS: Readonly<
	Record<WaterRetentionModelId, WaterRetentionModelMetadata>
> = Object.freeze({
	SAXTON_RAWLS_2006: {
		id: "SAXTON_RAWLS_2006",
		name: "Saxton & Rawls (2006)",
		status: "ACTIVE_DEFAULT",
		requiredInputs: ["sand", "clay"],
		optionalInputs: ["organicMatter", "densityFactor"],
		parameters: [],
		outputs: ["fieldCapacity", "wiltingPoint", "plantAvailableWater", "saturation", "curvePoints"],
		productionDefault: true,
		computable: true,
		reference: "Saxton, K.E. & Rawls, W.J. (2006). SSSAJ 70:1569-1578.",
		limitations: [
			"Pedotransfer estimate, not measured pressure-plate validation",
			"Extreme-domain values are clamped for numerical stability",
		],
	},
	VAN_GENUCHTEN: {
		id: "VAN_GENUCHTEN",
		name: "Van Genuchten (1980)",
		status: "PARAMETER_REQUIRED",
		requiredInputs: [],
		optionalInputs: [],
		parameters: [
			{ key: "thetaR", description: "Residual water content", unit: "cm³/cm³", required: true },
			{ key: "thetaS", description: "Saturated water content", unit: "cm³/cm³", required: true },
			{ key: "alpha", description: "Inverse air-entry scaling", unit: "1/kPa", required: true },
			{ key: "n", description: "Pore-size distribution (n > 1)", unit: "-", required: true },
			{ key: "m", description: "Shape (default Mualem m = 1 - 1/n)", unit: "-", required: false },
		],
		outputs: ["curvePoints"],
		productionDefault: false,
		computable: true,
		reference: "van Genuchten, M.Th. (1980). SSSAJ 44:892-898.",
		limitations: [
			"Parameters must be supplied explicitly; not estimated from texture",
			"FC/WP not derived; only curve points are produced",
		],
	},
	BROOKS_COREY: {
		id: "BROOKS_COREY",
		name: "Brooks & Corey (1964)",
		status: "PARAMETER_REQUIRED",
		requiredInputs: [],
		optionalInputs: [],
		parameters: [
			{ key: "thetaR", description: "Residual water content", unit: "cm³/cm³", required: true },
			{ key: "thetaS", description: "Saturated water content", unit: "cm³/cm³", required: true },
			{ key: "airEntryPressure", description: "Air-entry pressure ψb", unit: "kPa", required: true },
			{ key: "lambda", description: "Pore-size distribution index", unit: "-", required: true },
		],
		outputs: ["curvePoints"],
		productionDefault: false,
		computable: true,
		reference: "Brooks, R.H. & Corey, A.T. (1964). Hydrology Paper 3, CSU.",
		limitations: [
			"Parameters must be supplied explicitly; not estimated from texture",
			"FC/WP not derived; only curve points are produced",
		],
	},
	CAMPBELL: {
		id: "CAMPBELL",
		name: "Campbell (1974)",
		status: "PARAMETER_REQUIRED",
		requiredInputs: [],
		optionalInputs: [],
		parameters: [
			{ key: "thetaS", description: "Saturated water content", unit: "cm³/cm³", required: true },
			{ key: "airEntryPotential", description: "Air-entry potential ψe", unit: "kPa", required: true },
			{ key: "b", description: "Campbell b exponent", unit: "-", required: true },
		],
		outputs: ["curvePoints"],
		productionDefault: false,
		computable: true,
		reference: "Campbell, G.S. (1974). Soil Science 117:311-314.",
		limitations: [
			"Parameters must be supplied explicitly; not estimated from texture",
			"FC/WP not derived; only curve points are produced",
		],
	},
	LAB_MEASURED_CURVE: {
		id: "LAB_MEASURED_CURVE",
		name: "Laboratory-Measured Curve",
		status: "PARAMETER_REQUIRED",
		requiredInputs: [],
		optionalInputs: [],
		parameters: [
			{ key: "measuredCurve", description: "Explicit (ψ, θ) measured points", unit: "kPa, cm³/cm³", required: true },
		],
		outputs: ["curvePoints"],
		productionDefault: false,
		computable: true,
		reference: "User-supplied pressure-plate / pressure-membrane data.",
		limitations: [
			"No data is invented, estimated, or interpolated",
			"Requires ≥ 2 explicit measured points",
		],
	},
	ROSETTA_HYPRES_FUTURE: {
		id: "ROSETTA_HYPRES_FUTURE",
		name: "Rosetta / HYPRES Pedotransfer (future)",
		status: "FUTURE",
		requiredInputs: [],
		optionalInputs: [],
		parameters: [],
		outputs: [],
		productionDefault: false,
		computable: false,
		reference: "Schaap et al. (2001); Wösten et al. (1999).",
		limitations: ["Reserved for a future phase; not computable in 10C-B"],
	},
	CUSTOM_ORGANIZATION_MODEL: {
		id: "CUSTOM_ORGANIZATION_MODEL",
		name: "Custom Organization Model (future)",
		status: "FUTURE",
		requiredInputs: [],
		optionalInputs: [],
		parameters: [],
		outputs: [],
		productionDefault: false,
		computable: false,
		reference: "Organization-defined; not yet implemented.",
		limitations: ["Reserved for a future phase; not computable in 10C-B"],
	},
});
