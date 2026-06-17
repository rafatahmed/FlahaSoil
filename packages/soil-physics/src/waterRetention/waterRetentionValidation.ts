/**
 * @flaha/soil-physics — Water-retention parameter validation (Phase 10C-B).
 *
 * Strict, model-specific parameter checks. The rules here are the single
 * source of truth for "is this model computable for this input?". No model
 * may emit NaN / Infinity / undefined / unexplained null — every failure is
 * reported as either MISSING_PARAMETERS (absent required input) or
 * INVALID_INPUT (present but out of physical/mathematical range).
 */

import type {
	WaterRetentionCurvePoint,
	WaterRetentionModelInput,
} from "./waterRetentionTypes";

/** Outcome of a parameter-validation pass. */
export interface ParameterValidationResult {
	/** Resolved status; "OK" means the model may compute. */
	status: "OK" | "MISSING_PARAMETERS" | "INVALID_INPUT";
	/** Names of required parameters that are absent or non-finite. */
	missingParameters: string[];
	/** Human-readable explanations for INVALID_INPUT failures. */
	errors: string[];
	/** Non-fatal advisories (e.g. a derived parameter). */
	warnings: string[];
}

function isFiniteNumber(v: unknown): v is number {
	return typeof v === "number" && Number.isFinite(v);
}

/**
 * Collect required parameters that are missing or non-finite. A present but
 * out-of-range value is NOT reported here — that is an INVALID_INPUT concern.
 */
export function collectMissingParameters(
	params: Record<string, number> | undefined,
	requiredKeys: readonly string[]
): string[] {
	const missing: string[] = [];
	for (const key of requiredKeys) {
		const value = params?.[key];
		if (value === undefined || !isFiniteNumber(value)) missing.push(key);
	}
	return missing;
}

/** A water content expressed as a fraction must lie in [0, 1]. */
export function isValidWaterContentFraction(v: number): boolean {
	return isFiniteNumber(v) && v >= 0 && v <= 1;
}

/**
 * Van Genuchten requires theta_r, theta_s, alpha, n (m optional → Mualem).
 * Constraints: n > 1, theta_s > theta_r, alpha > 0, contents in [0, 1].
 */
export function validateVanGenuchten(
	input: WaterRetentionModelInput
): ParameterValidationResult {
	const p = input.parameters;
	const missing = collectMissingParameters(p, ["thetaR", "thetaS", "alpha", "n"]);
	if (missing.length > 0) {
		return { status: "MISSING_PARAMETERS", missingParameters: missing, errors: [], warnings: [] };
	}
	const params = p as Record<string, number>;
	const thetaR = params.thetaR as number;
	const thetaS = params.thetaS as number;
	const alpha = params.alpha as number;
	const n = params.n as number;
	const m = params.m as number | undefined;
	const errors: string[] = [];
	const warnings: string[] = [];
	if (!isValidWaterContentFraction(thetaR)) errors.push("thetaR must be a fraction in [0,1]");
	if (!isValidWaterContentFraction(thetaS)) errors.push("thetaS must be a fraction in [0,1]");
	if (n <= 1) errors.push("n must be > 1");
	if (alpha <= 0) errors.push("alpha must be > 0");
	if (thetaS <= thetaR) errors.push("thetaS must be > thetaR");
	if (m !== undefined && isFiniteNumber(m) && m <= 0) errors.push("m must be > 0 when supplied");
	if (m === undefined) warnings.push("m derived via Mualem relation m = 1 - 1/n");
	if (errors.length > 0) {
		return { status: "INVALID_INPUT", missingParameters: [], errors, warnings };
	}
	return { status: "OK", missingParameters: [], errors: [], warnings };
}

/**
 * Brooks-Corey requires theta_r, theta_s, airEntryPressure, lambda.
 * Constraints: theta_s > theta_r, lambda > 0, airEntryPressure > 0.
 */
export function validateBrooksCorey(
	input: WaterRetentionModelInput
): ParameterValidationResult {
	const p = input.parameters;
	const missing = collectMissingParameters(p, ["thetaR", "thetaS", "airEntryPressure", "lambda"]);
	if (missing.length > 0) {
		return { status: "MISSING_PARAMETERS", missingParameters: missing, errors: [], warnings: [] };
	}
	const params = p as Record<string, number>;
	const thetaR = params.thetaR as number;
	const thetaS = params.thetaS as number;
	const airEntryPressure = params.airEntryPressure as number;
	const lambda = params.lambda as number;
	const errors: string[] = [];
	if (!isValidWaterContentFraction(thetaR)) errors.push("thetaR must be a fraction in [0,1]");
	if (!isValidWaterContentFraction(thetaS)) errors.push("thetaS must be a fraction in [0,1]");
	if (thetaS <= thetaR) errors.push("thetaS must be > thetaR");
	if (lambda <= 0) errors.push("lambda must be > 0");
	if (airEntryPressure <= 0) errors.push("airEntryPressure must be > 0");
	if (errors.length > 0) {
		return { status: "INVALID_INPUT", missingParameters: [], errors, warnings: [] };
	}
	return { status: "OK", missingParameters: [], errors: [], warnings: [] };
}

/**
 * Campbell requires theta_s, airEntryPotential, b.
 * Constraints: theta_s > 0, airEntryPotential > 0, b > 0.
 */
export function validateCampbell(
	input: WaterRetentionModelInput
): ParameterValidationResult {
	const p = input.parameters;
	const missing = collectMissingParameters(p, ["thetaS", "airEntryPotential", "b"]);
	if (missing.length > 0) {
		return { status: "MISSING_PARAMETERS", missingParameters: missing, errors: [], warnings: [] };
	}
	const params = p as Record<string, number>;
	const thetaS = params.thetaS as number;
	const airEntryPotential = params.airEntryPotential as number;
	const b = params.b as number;
	const errors: string[] = [];
	if (thetaS <= 0 || thetaS > 1) errors.push("thetaS must be a fraction in (0,1]");
	if (airEntryPotential <= 0) errors.push("airEntryPotential must be > 0");
	if (b <= 0) errors.push("b must be > 0");
	if (errors.length > 0) {
		return { status: "INVALID_INPUT", missingParameters: [], errors, warnings: [] };
	}
	return { status: "OK", missingParameters: [], errors: [], warnings: [] };
}

/**
 * Lab-measured curves require an explicit, monotonic set of ≥ 2 points with
 * finite tension > 0 and water content in [0, 1]. No data is ever invented.
 */
export function validateLabMeasuredCurve(
	points: WaterRetentionCurvePoint[] | undefined
): ParameterValidationResult {
	if (!points || points.length === 0) {
		return { status: "MISSING_PARAMETERS", missingParameters: ["measuredCurve"], errors: [], warnings: [] };
	}
	const errors: string[] = [];
	if (points.length < 2) errors.push("measuredCurve must contain at least 2 points");
	for (const pt of points) {
		if (!isFiniteNumber(pt.matricPotentialKpa) || pt.matricPotentialKpa <= 0) {
			errors.push("each curve point requires matricPotentialKpa > 0");
			break;
		}
		if (!isValidWaterContentFraction(pt.waterContentFraction)) {
			errors.push("each curve point requires waterContentFraction in [0,1]");
			break;
		}
	}
	if (errors.length > 0) {
		return { status: "INVALID_INPUT", missingParameters: [], errors, warnings: [] };
	}
	return { status: "OK", missingParameters: [], errors: [], warnings: [] };
}
