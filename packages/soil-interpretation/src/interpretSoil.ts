/**
 * @flaha/soil-interpretation — core decision engine.
 *
 * Pure function. Reads computed values from physics and chemistry inputs,
 * applies the classification rules in `./rules`, and returns a qualitative
 * interpretation. Never mutates inputs, never recomputes any value, and
 * never throws on missing data — fields are simply omitted from the
 * output when their underlying input is unavailable.
 */

import type {
	RatingTraceEntry,
	SoilInterpretationInput,
	SoilInterpretationResult,
} from "./types";
import {
	classifyBaseSaturation,
	classifyCationBalance,
	classifyCec,
	classifyCompactionRisk,
	classifyDrainageFromKsat,
	classifyInfiltration,
	classifyOrganicMatter,
	classifyPh,
	classifySalinity,
	classifySalinitySeverity,
	classifySodicitySeverity,
	classifySodiumRisk,
	classifyTextureSuitability,
	classifyWaterHolding,
	passthroughDrainage,
} from "./rules";

/** Coerces an unknown field to a finite number, or returns `undefined`. */
function toFiniteNumber(value: unknown): number | undefined {
	if (value === undefined || value === null) return undefined;
	const n = typeof value === "string" ? parseFloat(value) : (value as number);
	return typeof n === "number" && Number.isFinite(n) ? n : undefined;
}

function toString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

export function interpretSoil(
	input: SoilInterpretationInput
): SoilInterpretationResult {
	const physics = (input.physics ?? {}) as Record<string, unknown>;
	const chemistry = (input.chemistry ?? {}) as Record<string, unknown>;

	const result: SoilInterpretationResult = {
		overallSoilRating: "Fair",
		warnings: [],
		ratingTrace: {
			severe: [],
			moderateNegative: [],
			positive: [],
			decision: "Fair",
		},
	};

	// -------------------------------------------------------------------
	// Chemistry-derived classifications
	// -------------------------------------------------------------------
	const ph = toFiniteNumber(chemistry.ph);
	if (ph !== undefined) {
		result.phCategory = classifyPh(ph);
	}

	// EC may come from chemistry.ec (preferred) or, failing that, physics.
	const ec =
		toFiniteNumber(chemistry.ec) ??
		toFiniteNumber(physics.electricalConductivity);
	if (ec !== undefined) {
		result.salinityRisk = classifySalinity(ec);
	}

	const cec = toFiniteNumber(chemistry.cec);
	if (cec !== undefined) {
		result.cecLevel = classifyCec(cec);
	}

	const baseSaturation = toFiniteNumber(chemistry.baseSaturation);
	if (baseSaturation !== undefined) {
		result.baseSaturationCategory = classifyBaseSaturation(baseSaturation);
	}

	const esp = toFiniteNumber(chemistry.esp);
	if (esp !== undefined) {
		result.sodiumRisk = classifySodiumRisk(esp);
	}

	const caPercent = toFiniteNumber(chemistry.caPercent);
	const mgPercent = toFiniteNumber(chemistry.mgPercent);
	const kPercent = toFiniteNumber(chemistry.kPercent);
	if (
		caPercent !== undefined ||
		mgPercent !== undefined ||
		kPercent !== undefined
	) {
		result.cationBalance = classifyCationBalance({
			...(caPercent !== undefined ? { caPercent } : {}),
			...(mgPercent !== undefined ? { mgPercent } : {}),
			...(kPercent !== undefined ? { kPercent } : {}),
		});
	}

	// -------------------------------------------------------------------
	// Physics-derived classifications
	// -------------------------------------------------------------------
	const paw = toFiniteNumber(physics.plantAvailableWater);
	if (paw !== undefined) {
		result.waterHoldingClass = classifyWaterHolding(paw);
	}

	const drainage = toString(physics.drainageClass);
	const ksat = toFiniteNumber(physics.saturatedConductivity);
	if (drainage !== undefined) {
		result.drainageClass = passthroughDrainage(drainage);
	} else if (ksat !== undefined) {
		result.drainageClass = classifyDrainageFromKsat(ksat);
	}
	if (ksat !== undefined) {
		result.infiltrationClass = classifyInfiltration(ksat);
	}

	// -------------------------------------------------------------------
	// Phase 8D — extended classifications
	// -------------------------------------------------------------------
	if (ec !== undefined) {
		result.salinitySeverity = classifySalinitySeverity(ec);
	}
	const sar = toFiniteNumber(chemistry.sar);
	if (sar !== undefined || esp !== undefined) {
		result.sodicitySeverity = classifySodicitySeverity({
			...(sar !== undefined ? { sar } : {}),
			...(esp !== undefined ? { esp } : {}),
		});
	}
	const om =
		toFiniteNumber(chemistry.organicMatter) ??
		toFiniteNumber(physics.organicMatter) ??
		toFiniteNumber((physics as Record<string, unknown>).organicMatterPercent);
	if (om !== undefined) {
		result.organicMatterCategory = classifyOrganicMatter(om);
	}
	const bd = toFiniteNumber(physics.bulkDensity);
	const textureClass = toString(physics.textureClass);
	if (bd !== undefined) {
		result.compactionRisk = classifyCompactionRisk({
			bulkDensity: bd,
			...(textureClass !== undefined ? { textureClass } : {}),
		});
	}
	if (textureClass !== undefined) {
		result.textureSuitability = classifyTextureSuitability({
			textureClass,
			...(result.salinitySeverity !== undefined
				? { salinitySeverity: result.salinitySeverity }
				: {}),
			...(result.sodicitySeverity !== undefined
				? { sodicitySeverity: result.sodicitySeverity }
				: {}),
			...(result.drainageClass !== undefined
				? { drainageClass: result.drainageClass }
				: {}),
		});
	}

	// -------------------------------------------------------------------
	// Warnings (additive, deterministic order)
	// -------------------------------------------------------------------
	if (result.salinityRisk === "Severe") {
		result.warnings.push(
			"Severe salinity — most crops will be impaired; leaching and salt-tolerant species recommended."
		);
	} else if (result.salinityRisk === "High") {
		result.warnings.push(
			"High salinity — yields of salt-sensitive crops will be reduced."
		);
	}

	if (result.sodiumRisk === "High") {
		result.warnings.push(
			"High exchangeable sodium (ESP > 15) — sodic soil; structural degradation likely without amendment."
		);
	}

	if (result.phCategory === "Strongly Acidic") {
		result.warnings.push(
			"Strongly acidic pH (< 5.5) — aluminium toxicity and nutrient lockout risk; liming may be required."
		);
	} else if (result.phCategory === "Highly Alkaline") {
		result.warnings.push(
			"Highly alkaline pH (> 8.5) — micronutrient (Fe, Mn, Zn) availability suppressed."
		);
	}

	if (result.cecLevel === "Very Low") {
		result.warnings.push(
			"Very low CEC (< 5) — minimal nutrient buffering; split fertiliser applications advised."
		);
	}

	if (result.cationBalance === "Imbalanced") {
		result.warnings.push(
			"Cation balance outside Ca 60–75 % / Mg 10–20 % / K 2–5 % windows."
		);
	}

	// -------------------------------------------------------------------
	// Overall rating — Poor if any High/Severe risk; Good if no negatives
	// and at least one positive signal; Fair otherwise.
	// -------------------------------------------------------------------
	const categories = [
		result.phCategory,
		result.salinityRisk,
		result.sodiumRisk,
		result.cecLevel,
		result.baseSaturationCategory,
		result.cationBalance,
		result.waterHoldingClass,
	];

	// Per spec: any "High" or "Severe" risk → Poor. The trace records
	// every contributor so the UI/report can explain the decision.
	const severe: RatingTraceEntry[] = [];
	const moderateNegative: RatingTraceEntry[] = [];
	const positive: RatingTraceEntry[] = [];

	const push = (
		bucket: RatingTraceEntry[],
		category: string,
		value: string | undefined,
		note: string
	) => {
		if (value !== undefined) bucket.push({ category, value, note });
	};

	if (result.salinityRisk === "Severe" || result.salinityRisk === "High") {
		push(severe, "salinityRisk", result.salinityRisk, "EC ≥ 4 dS/m (FAO-29)");
	}
	if (result.sodiumRisk === "High") {
		push(severe, "sodiumRisk", result.sodiumRisk, "ESP > 15 % (sodic)");
	}
	if (result.phCategory === "Strongly Acidic" || result.phCategory === "Highly Alkaline") {
		push(severe, "phCategory", result.phCategory, "pH < 5.5 or ≥ 8.5");
	}
	if (result.cecLevel === "Very Low") {
		push(severe, "cecLevel", result.cecLevel, "CEC < 5 cmol(+)/kg");
	}
	if (result.cationBalance === "Imbalanced") {
		push(severe, "cationBalance", result.cationBalance,
			"Outside Ca 60–75 % / Mg 10–20 % / K 2–5 % windows");
	}

	if (result.salinityRisk === "Moderate") {
		push(moderateNegative, "salinityRisk", result.salinityRisk, "EC 2–4 dS/m");
	}
	if (result.sodiumRisk === "Moderate") {
		push(moderateNegative, "sodiumRisk", result.sodiumRisk, "ESP 6–15 %");
	}
	if (result.cecLevel === "Low") {
		push(moderateNegative, "cecLevel", result.cecLevel, "CEC 5–15 cmol(+)/kg");
	}
	if (result.baseSaturationCategory === "Low") {
		push(moderateNegative, "baseSaturationCategory", result.baseSaturationCategory,
			"BS < 50 %");
	}
	if (result.waterHoldingClass === "Low") {
		push(moderateNegative, "waterHoldingClass", result.waterHoldingClass,
			"PAW < 10 % v/v");
	}

	const positiveMatchers: Array<[string, string | undefined, string]> = [
		["phCategory", result.phCategory === "Neutral" ? result.phCategory : undefined, "pH 6.5–7.5"],
		["salinityRisk", result.salinityRisk === "Low" ? result.salinityRisk : undefined, "EC < 2 dS/m"],
		["sodiumRisk", result.sodiumRisk === "Low" ? result.sodiumRisk : undefined, "ESP < 6 %"],
		["cecLevel", result.cecLevel === "High" || result.cecLevel === "Moderate"
			? result.cecLevel : undefined, "CEC ≥ 15 cmol(+)/kg"],
		["baseSaturationCategory", result.baseSaturationCategory === "High" ||
			result.baseSaturationCategory === "Moderate" ? result.baseSaturationCategory : undefined,
			"BS ≥ 50 %"],
		["cationBalance", result.cationBalance === "Balanced" ? result.cationBalance : undefined,
			"Ca/Mg/K within windows"],
		["waterHoldingClass", result.waterHoldingClass === "High" ||
			result.waterHoldingClass === "Moderate" ? result.waterHoldingClass : undefined,
			"PAW ≥ 10 % v/v"],
	];
	for (const [cat, val, note] of positiveMatchers) push(positive, cat, val, note);

	const decision: "Poor" | "Fair" | "Good" =
		severe.length > 0
			? "Poor"
			: moderateNegative.length > 0
				? "Fair"
				: positive.length > 0
					? "Good"
					: "Fair";

	result.overallSoilRating = decision;
	result.ratingTrace = { severe, moderateNegative, positive, decision };

	// `categories` retained for downstream consumers that introspect the
	// classification dictionary; mark as intentionally used.
	void categories;

	return result;
}
