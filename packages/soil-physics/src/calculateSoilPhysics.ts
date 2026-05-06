/**
 * @flaha/soil-physics — Saxton & Rawls (2006) 24-equation engine.
 *
 * Pure-function TypeScript port of
 * `api-implementation/src/services/soilCalculationService.js`.
 *
 * EXTRACTION RULES (Phase 2):
 *   - No formulas, constants, clamps, thresholds or `toFixed` precisions
 *     have been altered.
 *   - Output structure (string vs number, field names, plan-tier shape) is
 *     preserved exactly so the new engine is byte-for-byte compatible with
 *     the legacy regression baseline in
 *     `docs/legacy-calculation-samples.md`.
 *   - The legacy `class` was flattened into a set of module-scope functions
 *     because TypeScript handles `static`-only classes equivalently; no
 *     internal state existed.
 */

import {
	BASIC_DEFAULTS,
	BASIC_ESTIMATES,
	CLAMPS,
	CONFIDENCE_DATA,
	DEFAULTS,
	KS_COEFFICIENT,
	OSMOTIC_POTENTIAL_COEFFICIENT,
	OSMOTIC_POTENTIAL_FC_MULTIPLIER,
	PARTICLE_DENSITY,
} from "./constants";
import type {
	BaseSoilPhysicsResult,
	SoilPhysicsInput,
	SoilPhysicsResult,
	UserPlan,
} from "./types";

// ---------------------------------------------------------------------------
// Internal intermediate-result shapes (kept loose to mirror legacy spread/
// `Object.assign` semantics).
// ---------------------------------------------------------------------------

interface MoistureRegressionResults {
	theta1500t: number;
	theta33t: number;
	thetaS33t: number;
	psiE: number;
	thetaS: number;
}

interface DensityResults extends MoistureRegressionResults {
	rhoN: number;
	rhoDF: number;
	thetaSDF: number;
	theta33DF: number;
	thetaS33DF: number;
	theta1500DF: number;
}

interface TensionResults extends DensityResults {
	A: number;
	B: number;
	lambda: number;
	psiEAdj: number;
	airEntryTension: string;
}

interface ConductivityResults extends TensionResults {
	saturatedConductivity: string;
	unsaturatedConductivity: string;
	conductivityExponent: string;
	relativeK: string;
}

interface GravelResults {
	gravelVolumeFraction: number;
	bulkDensity: string;
	plantAvailableWaterBulk: string;
	bulkConductivity: string;
	conductivityRatio: string;
}

interface SalinityResults {
	osmoticPotential: string;
	osmoticPotentialFC: string;
	electricalConductivity: string;
}

interface AdditionalProperties {
	porosity: string;
	voidRatio: string;
	particleDensity: string;
	inputGravelContent: number;
}

interface QualityIndicators {
	soilQualityIndex: string;
	drainageClass: string;
	compactionRisk: string;
	erosionRisk: string;
}

interface ConfidenceBlock {
	confidenceIntervals: {
		wiltingPoint: number;
		fieldCapacity: number;
		saturation: number;
		airEntryTension: number;
		saturatedConductivity: number;
	};
	rSquaredValues: {
		wiltingPoint: number;
		fieldCapacity: number;
		saturation: number;
		airEntryTension: number;
		saturatedConductivity: number;
	};
}

interface InputParametersEcho {
	sand: number;
	clay: number;
	organicMatter: number;
	densityFactor: number;
	gravelContent: number;
	electricalConductivity: number;
}

// ---------------------------------------------------------------------------
// Equations 1-5: Moisture regressions (θ1500, θ33, θ(S-33), Ψe, θS)
// ---------------------------------------------------------------------------

export function calculateMoistureRegressions(
	S: number,
	C: number,
	OM: number
): MoistureRegressionResults {
	// Equation 1: Wilting point moisture (θ1500)
	const theta1500t =
		-0.024 * S +
		0.487 * C +
		0.006 * OM +
		0.005 * (S * OM) -
		0.013 * (C * OM) +
		0.068 * (S * C) +
		0.031;

	// Equation 2: Field capacity moisture (θ33)
	const theta33t =
		-0.251 * S +
		0.195 * C +
		0.011 * OM +
		0.006 * (S * OM) -
		0.027 * (C * OM) +
		0.452 * (S * C) +
		0.299;

	// Equation 3: Moisture difference (θ(S-33))
	const thetaS33t =
		0.278 * S +
		0.034 * C +
		0.022 * OM -
		0.018 * (S * OM) -
		0.027 * (C * OM) -
		0.584 * (S * C) +
		0.078;

	// Equation 4: Air-entry tension (Ψe)
	const psiE =
		-21.67 * S -
		27.93 * C -
		81.97 * thetaS33t +
		71.12 * (S * thetaS33t) +
		8.29 * (C * thetaS33t) +
		14.05 * (S * C) +
		27.16;

	// Equation 5: Saturation moisture (θS)
	const thetaS = theta33t + thetaS33t - 0.097 * S + 0.043;

	return {
		theta1500t,
		theta33t,
		thetaS33t,
		psiE: Math.max(0, psiE),
		thetaS: Math.min(CLAMPS.thetaSMax, Math.max(CLAMPS.thetaSMin, thetaS)),
	};
}

// ---------------------------------------------------------------------------
// Equations 6-10: Density effects (ρN, ρDF, θS-DF, θ33-DF, θ(S-33)DF)
// ---------------------------------------------------------------------------

export function calculateDensityEffects(
	moistureResults: MoistureRegressionResults,
	densityFactor: number
): DensityResults {
	const { theta1500t, theta33t, thetaS33t, thetaS } = moistureResults;

	// Equation 6: Normal density (ρN) — CALCULATED from soil texture
	const rhoN = (1 - thetaS) * 2.65;

	// Equation 7: Density factor (ρDF) — USER INPUT for comparison
	const rhoDF = densityFactor;

	// Equation 8: Saturation with density factor (θS-DF)
	const thetaSDF = 1 - rhoDF / 2.65;

	// Equation 9: Field capacity with density factor (θ33-DF)
	const theta33DF =
		theta33t + (1.283 * Math.pow(theta33t, 2) - 0.374 * theta33t - 0.015);

	// Equation 10: Moisture difference with density factor (θ(S-33)DF)
	const thetaS33DF = thetaSDF - theta33DF;

	return {
		...moistureResults,
		rhoN,
		rhoDF,
		thetaSDF: Math.min(CLAMPS.thetaSDFMax, Math.max(CLAMPS.thetaSDFMin, thetaSDF)),
		theta33DF: Math.min(CLAMPS.theta33DFMax, Math.max(CLAMPS.theta33DFMin, theta33DF)),
		thetaS33DF: Math.max(CLAMPS.thetaS33DFMin, thetaS33DF),
		theta1500DF: theta1500t + (0.14 * theta1500t - 0.02),
	};
}

// ---------------------------------------------------------------------------
// Equations 11-15: Moisture-tension relationships (A, B, λ parameters)
// ---------------------------------------------------------------------------

export function calculateMoistureTensionRelationships(
	_S: number,
	_C: number,
	_OM: number,
	densityResults: DensityResults
): TensionResults {
	const { theta33DF, theta1500DF, thetaSDF, psiE } = densityResults;

	// Equation 11: Parameter A
	const A = Math.exp(
		Math.log(33) +
			((Math.log(1500) - Math.log(33)) *
				(Math.log(theta33DF) - Math.log(thetaSDF))) /
				(Math.log(theta1500DF) - Math.log(thetaSDF))
	);

	// Equation 12: Parameter B
	const B =
		(Math.log(1500) - Math.log(33)) /
		(Math.log(theta33DF) - Math.log(theta1500DF));

	// Equation 13: Lambda parameter (λ)
	const lambda = 1 / B;

	// Equation 14: Air-entry tension adjusted (Ψe-adj)
	const psiEAdj = psiE * Math.pow(theta33DF / densityResults.theta33t, -B);

	// Equation 15: θ(ψ) = θ1500 + (θ33 - θ1500) * (ψ/1500)^(-λ) — definition only

	return {
		...densityResults,
		A: Math.max(CLAMPS.AMin, A),
		B: Math.max(CLAMPS.BMin, Math.min(CLAMPS.BMax, B)),
		lambda: Math.max(CLAMPS.lambdaMin, Math.min(CLAMPS.lambdaMax, lambda)),
		psiEAdj: Math.max(CLAMPS.psiEAdjMin, psiEAdj),
		airEntryTension: psiEAdj.toFixed(1),
	};
}

// ---------------------------------------------------------------------------
// Equations 16-18: Moisture-conductivity (KS, Ku calculations)
// ---------------------------------------------------------------------------

export function calculateMoistureConductivity(
	tensionResults: TensionResults,
	_S: number,
	_C: number
): ConductivityResults {
	const { thetaSDF, theta33DF, lambda } = tensionResults;

	// Equation 16: Saturated hydraulic conductivity (KS)
	const KS = KS_COEFFICIENT * Math.pow(thetaSDF - theta33DF, 3 - lambda);

	// Equation 17: Unsaturated hydraulic conductivity exponent
	const conductivityExponent = 3 + 2 / lambda;

	// Equation 18: Relative conductivity
	const relativeK = Math.pow(theta33DF / thetaSDF, conductivityExponent);

	return {
		...tensionResults,
		saturatedConductivity: Math.max(CLAMPS.ksMin, KS).toFixed(1),
		unsaturatedConductivity: (KS * relativeK).toFixed(1),
		conductivityExponent: conductivityExponent.toFixed(2),
		relativeK: relativeK.toFixed(3),
	};
}


// ---------------------------------------------------------------------------
// Equations 19-22: Gravel effects (Rv, ρB, PAWB, Kb/KS ratios)
// ---------------------------------------------------------------------------

/**
 * NOTE — Legacy parity: `densityResults` here is the output of
 * `calculateDensityEffects`, which does NOT carry a `saturatedConductivity`
 * field. The legacy implementation destructures it anyway, producing
 * `parseFloat(undefined) === NaN` for `Kb` and `conductivityRatio`. That
 * behaviour is preserved verbatim and intentionally NOT fixed in Phase 2.
 */
export function calculateGravelEffects(
	densityResults: DensityResults & { saturatedConductivity?: string },
	Rv: number
): GravelResults {
	const { theta33DF, theta1500DF, saturatedConductivity } = densityResults;

	// Equation 19: Bulk density with gravel (ρB)
	const rhoBulk = densityResults.rhoDF * (1 - Rv) + 2.65 * Rv;

	// Equation 20: Plant available water bulk (PAWB)
	const PAWB = (theta33DF - theta1500DF) * (1 - Rv);

	// Equation 21: Bulk saturated conductivity (Kb)
	// `parseFloat(undefined)` yields NaN — preserved from legacy.
	const Kb = parseFloat(saturatedConductivity as string) * Math.pow(1 - Rv, 2);

	// Equation 22: Conductivity ratio (Kb/KS)
	const conductivityRatio = Kb / parseFloat(saturatedConductivity as string);

	return {
		gravelVolumeFraction: Rv,
		bulkDensity: rhoBulk.toFixed(2),
		plantAvailableWaterBulk: (PAWB * 100).toFixed(1),
		bulkConductivity: Kb.toFixed(1),
		conductivityRatio: conductivityRatio.toFixed(3),
	};
}

// ---------------------------------------------------------------------------
// Equations 23-24: Salinity effects (ΨO, ΨOu osmotic potentials)
// ---------------------------------------------------------------------------

export function calculateSalinityEffects(
	electricalConductivity: number
): SalinityResults {
	// Equation 23: Osmotic potential (ΨO)
	const psiO = OSMOTIC_POTENTIAL_COEFFICIENT * electricalConductivity;

	// Equation 24: Osmotic potential at field capacity (ΨOu)
	const psiOu = psiO * OSMOTIC_POTENTIAL_FC_MULTIPLIER;

	return {
		osmoticPotential: psiO.toFixed(1),
		osmoticPotentialFC: psiOu.toFixed(1),
		electricalConductivity: electricalConductivity.toFixed(1),
	};
}

// ---------------------------------------------------------------------------
// Confidence intervals and R² values (Saxton & Rawls 2006)
// ---------------------------------------------------------------------------

export function calculateConfidenceIntervals(
	userPlan: UserPlan
): ConfidenceBlock | null {
	if (userPlan === "FREE") {
		return null;
	}

	return {
		confidenceIntervals: {
			wiltingPoint: CONFIDENCE_DATA.wiltingPoint.se,
			fieldCapacity: CONFIDENCE_DATA.fieldCapacity.se,
			saturation: CONFIDENCE_DATA.saturation.se,
			airEntryTension: CONFIDENCE_DATA.airEntryTension.se,
			saturatedConductivity: CONFIDENCE_DATA.saturatedConductivity.se,
		},
		rSquaredValues: {
			wiltingPoint: CONFIDENCE_DATA.wiltingPoint.r2,
			fieldCapacity: CONFIDENCE_DATA.fieldCapacity.r2,
			saturation: CONFIDENCE_DATA.saturation.r2,
			airEntryTension: CONFIDENCE_DATA.airEntryTension.r2,
			saturatedConductivity: CONFIDENCE_DATA.saturatedConductivity.r2,
		},
	};
}

// ---------------------------------------------------------------------------
// Soil quality indicators (SQI, drainage, compaction, erosion)
// ---------------------------------------------------------------------------

export function calculateSoilQualityIndicators(
	densityResults: DensityResults,
	conductivityResults: ConductivityResults,
	textureClass: string
): QualityIndicators {
	const { theta33DF, theta1500DF } = densityResults;
	const { saturatedConductivity } = conductivityResults;

	// Plant Available Water (percent units)
	const paw = (theta33DF - theta1500DF) * 100;

	// Soil Quality Index (0-10 scale)
	let qualityScore = 5; // Base score

	// PAW contribution (0-3 points)
	if (paw > 20) qualityScore += 3;
	else if (paw > 15) qualityScore += 2;
	else if (paw > 10) qualityScore += 1;
	else if (paw < 5) qualityScore -= 2;

	// Conductivity contribution (0-2 points)
	const ksat = parseFloat(saturatedConductivity);
	if (ksat > 10 && ksat < 100) qualityScore += 2;
	else if (ksat > 5 && ksat < 200) qualityScore += 1;
	else if (ksat < 1 || ksat > 500) qualityScore -= 1;

	// Drainage classification
	let drainageClass: string;
	if (ksat > 100) drainageClass = "Excellent";
	else if (ksat > 50) drainageClass = "Good";
	else if (ksat > 10) drainageClass = "Moderate";
	else if (ksat > 1) drainageClass = "Poor";
	else drainageClass = "Very Poor";

	return {
		soilQualityIndex: Math.max(
			CLAMPS.soilQualityMin,
			Math.min(CLAMPS.soilQualityMax, qualityScore)
		).toFixed(1),
		drainageClass,
		compactionRisk: assessCompactionRisk(textureClass, densityResults),
		erosionRisk: assessErosionRisk(textureClass, ksat),
	};
}

export function assessCompactionRisk(
	textureClass: string,
	densityResults: DensityResults
): string {
	const { rhoDF } = densityResults;

	if (textureClass.includes("Clay") && rhoDF > 1.4) return "High";
	if (textureClass.includes("Clay") && rhoDF > 1.3) return "Moderate";
	if (rhoDF > 1.6) return "Moderate";
	return "Low";
}

export function assessErosionRisk(textureClass: string, ksat: number): string {
	if (textureClass.includes("Sand") && ksat > 100) return "High";
	if (textureClass.includes("Sand") && ksat > 50) return "Moderate";
	if (textureClass.includes("Silt") && ksat < 10) return "Moderate";
	return "Low";
}


// ---------------------------------------------------------------------------
// Additional soil properties (porosity, void ratio, particle density)
// ---------------------------------------------------------------------------

export function calculateAdditionalProperties(
	densityResults: DensityResults,
	gravelContent: number,
	_userPlan: UserPlan
): AdditionalProperties {
	const { thetaSDF } = densityResults;

	// Porosity from saturation moisture content (percent)
	const porosity = thetaSDF * 100;

	// Void ratio (e = n / (1 - n))
	const voidRatio = porosity / (100 - porosity);

	// Particle density assumed 2.65 g/cm³ for mineral soils
	const particleDensity = PARTICLE_DENSITY;

	return {
		porosity: porosity.toFixed(1),
		voidRatio: voidRatio.toFixed(3),
		particleDensity: particleDensity.toFixed(2),
		inputGravelContent: gravelContent,
	};
}

// ---------------------------------------------------------------------------
// USDA texture classification (simplified — verbatim from legacy)
// ---------------------------------------------------------------------------

export function determineSoilTextureClass(sand: number, clay: number): string {
	const silt = 100 - sand - clay;

	if (clay >= 40) {
		if (sand > 45) return "Sandy Clay";
		if (silt > 40) return "Silty Clay";
		return "Clay";
	}

	if (clay >= 27) {
		if (sand > 45) return "Sandy Clay Loam";
		if (silt > 40) return "Silty Clay Loam";
		return "Clay Loam";
	}

	if (clay >= 20) {
		return "Loam";
	}

	if (silt >= 80) {
		return "Silt";
	}

	if (silt >= 50) {
		return "Silt Loam";
	}

	if (sand >= 85) {
		return "Sand";
	}

	if (sand >= 70) {
		return "Loamy Sand";
	}

	return "Sandy Loam";
}

// ---------------------------------------------------------------------------
// formatResultsByPlan — assembles the tiered response payload
// ---------------------------------------------------------------------------

export function formatResultsByPlan(
	densityResults: DensityResults,
	conductivityResults: ConductivityResults,
	gravelResults: GravelResults | Record<string, never>,
	salinityResults: SalinityResults | Record<string, never>,
	confidenceIntervals: ConfidenceBlock | null,
	textureClass: string,
	qualityIndicators: QualityIndicators,
	additionalProperties: AdditionalProperties,
	userPlan: UserPlan,
	inputParameters: InputParametersEcho
): SoilPhysicsResult {
	// Base results for all users
	const baseResults: BaseSoilPhysicsResult = {
		fieldCapacity: (densityResults.theta33DF * 100).toFixed(1),
		wiltingPoint: (densityResults.theta1500DF * 100).toFixed(1),
		plantAvailableWater: (
			(densityResults.theta33DF - densityResults.theta1500DF) *
			100
		).toFixed(1),
		saturation: (densityResults.thetaSDF * 100).toFixed(1),
		saturatedConductivity: conductivityResults.saturatedConductivity,
		textureClass,
		soilQualityIndex: qualityIndicators.soilQualityIndex,
		drainageClass: qualityIndicators.drainageClass,
		compactionRisk: qualityIndicators.compactionRisk,
		erosionRisk: qualityIndicators.erosionRisk,

		// Bulk density information with clarification
		bulkDensity: densityResults.rhoN.toFixed(3), // CALCULATED bulk density (Eq 6)
		bulkDensityFactor: densityResults.rhoN.toFixed(2),
		inputBulkDensity: inputParameters.densityFactor,

		// Additional soil properties
		porosity: additionalProperties.porosity,
		voidRatio: additionalProperties.voidRatio,
		particleDensity: additionalProperties.particleDensity,

		// Input parameters echoed for report display
		sand: inputParameters.sand,
		clay: inputParameters.clay,
		silt: 100 - inputParameters.sand - inputParameters.clay,
		organicMatter: inputParameters.organicMatter,
		gravelContent: inputParameters.gravelContent || 0,
		electricalConductivity: inputParameters.electricalConductivity || 0,
	};

	const result: SoilPhysicsResult = { ...baseResults };

	// Professional tier additions
	if (userPlan === "PROFESSIONAL" || userPlan === "ENTERPRISE") {
		Object.assign(result, {
			airEntryTension: conductivityResults.airEntryTension,
			bulkDensity: densityResults.rhoN.toFixed(2), // Use calculated bulk density (rhoN)
			lambda: conductivityResults.lambda.toFixed(2),
			compactionRisk: qualityIndicators.compactionRisk,
			erosionRisk: qualityIndicators.erosionRisk,
			unsaturatedConductivity: conductivityResults.unsaturatedConductivity,
		});

		if (Object.keys(gravelResults).length > 0) {
			Object.assign(result, gravelResults);
		}

		if (confidenceIntervals) {
			Object.assign(result, confidenceIntervals);
		}
	}

	// Enterprise tier additions
	if (userPlan === "ENTERPRISE") {
		if (Object.keys(salinityResults).length > 0) {
			Object.assign(result, salinityResults);
		}

		Object.assign(result, {
			parameterA: conductivityResults.A.toFixed(3),
			parameterB: conductivityResults.B.toFixed(3),
			relativeK: conductivityResults.relativeK,
			conductivityExponent: conductivityResults.conductivityExponent,
		});
	}

	return result;
}


// ---------------------------------------------------------------------------
// FREE-tier basic estimate (lookup table)
// ---------------------------------------------------------------------------

export interface BasicSoilResult {
	fieldCapacity: string;
	wiltingPoint: string;
	plantAvailableWater: string;
	saturation: string;
	saturatedConductivity: string;
	textureClass: string;
	message: string;
}

export function calculateBasic(sand: number, clay: number): BasicSoilResult {
	const textureClass = determineSoilTextureClass(sand, clay);
	const values = BASIC_ESTIMATES[textureClass] ?? BASIC_DEFAULTS;

	return {
		fieldCapacity: values.fc.toFixed(1),
		wiltingPoint: values.wp.toFixed(1),
		plantAvailableWater: values.paw.toFixed(1),
		saturation: values.sat.toFixed(1),
		saturatedConductivity: values.ks.toFixed(1),
		textureClass,
		message: "For advanced calculations, sign up for a free account.",
	};
}

// ---------------------------------------------------------------------------
// Top-level entry point — equivalent to legacy
// `SoilCalculationService.calculateWaterCharacteristics(...)`.
// ---------------------------------------------------------------------------

export function calculateSoilPhysics(
	input: SoilPhysicsInput
): SoilPhysicsResult {
	const sand = input.sand;
	const clay = input.clay;
	const om = input.organicMatter ?? DEFAULTS.organicMatter;
	const densityFactor = input.densityFactor ?? DEFAULTS.densityFactor;
	const gravelContent = input.gravelContent ?? DEFAULTS.gravelContent;
	const electricalConductivity =
		input.electricalConductivity ?? DEFAULTS.electricalConductivity;
	const userPlan: UserPlan = input.userPlan ?? DEFAULTS.userPlan;

	// Input validation (verbatim)
	if (sand < 0 || sand > 100 || clay < 0 || clay > 100 || sand + clay > 100) {
		throw new Error("Invalid sand/clay percentages");
	}
	if (om < 0 || om > 8) {
		throw new Error("Organic matter must be between 0-8%");
	}

	// Convert percentages to decimal fractions
	const S = sand / 100;
	const C = clay / 100;
	const OM = om / 100;
	const Rv = gravelContent / 100;

	// Equations 1-5
	const moistureResults = calculateMoistureRegressions(S, C, OM);

	// Equations 6-10
	const densityResults = calculateDensityEffects(moistureResults, densityFactor);

	// Equations 11-15
	const tensionResults = calculateMoistureTensionRelationships(
		S,
		C,
		OM,
		densityResults
	);

	// Equations 16-18
	const conductivityResults = calculateMoistureConductivity(
		tensionResults,
		S,
		C
	);

	// Equations 19-22 (Professional+ feature)
	// Legacy parity: pass `densityResults` only (no saturatedConductivity).
	let gravelResults: GravelResults | Record<string, never> = {};
	if (userPlan !== "FREE" && gravelContent > 0) {
		gravelResults = calculateGravelEffects(densityResults, Rv);
	}

	// Equations 23-24 (Enterprise feature)
	let salinityResults: SalinityResults | Record<string, never> = {};
	if (userPlan === "ENTERPRISE" && electricalConductivity > 0) {
		salinityResults = calculateSalinityEffects(electricalConductivity);
	}

	const confidenceIntervals = calculateConfidenceIntervals(userPlan);
	const textureClass = determineSoilTextureClass(sand, clay);
	const qualityIndicators = calculateSoilQualityIndicators(
		densityResults,
		conductivityResults,
		textureClass
	);
	const additionalProperties = calculateAdditionalProperties(
		densityResults,
		gravelContent,
		userPlan
	);

	return formatResultsByPlan(
		densityResults,
		conductivityResults,
		gravelResults,
		salinityResults,
		confidenceIntervals,
		textureClass,
		qualityIndicators,
		additionalProperties,
		userPlan,
		{
			sand,
			clay,
			organicMatter: om,
			densityFactor,
			gravelContent,
			electricalConductivity,
		}
	);
}
