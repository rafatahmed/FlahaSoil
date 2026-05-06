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
	SoilInterpretationInput,
	SoilInterpretationResult,
} from "./types";
import {
	classifyBaseSaturation,
	classifyCationBalance,
	classifyCec,
	classifyPh,
	classifySalinity,
	classifySodiumRisk,
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
			caPercent,
			mgPercent,
			kPercent,
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
	if (drainage !== undefined) {
		result.drainageClass = passthroughDrainage(drainage);
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

	// Per spec: any "High" or "Severe" risk → Poor.
	const hasSevere =
		result.salinityRisk === "Severe" ||
		result.salinityRisk === "High" ||
		result.sodiumRisk === "High" ||
		result.phCategory === "Strongly Acidic" ||
		result.phCategory === "Highly Alkaline" ||
		result.cecLevel === "Very Low" ||
		result.cationBalance === "Imbalanced";

	const hasModerateNegative =
		result.salinityRisk === "Moderate" ||
		result.sodiumRisk === "Moderate" ||
		result.cecLevel === "Low" ||
		result.baseSaturationCategory === "Low" ||
		result.waterHoldingClass === "Low";

	const positiveSignals = categories.filter(
		(c) =>
			c === "Neutral" ||
			c === "Low" || // salinity / sodium "Low" is positive
			c === "Moderate" ||
			c === "High" || // CEC / water-holding "High" is positive
			c === "Balanced"
	).length;

	if (hasSevere) {
		result.overallSoilRating = "Poor";
	} else if (hasModerateNegative) {
		result.overallSoilRating = "Fair";
	} else if (positiveSignals > 0) {
		result.overallSoilRating = "Good";
	}

	return result;
}
