/**
 * @flaha/soil-physics — Soil-water characteristic (retention) curve.
 *
 * Generates a continuous moisture-tension curve `θ(ψ)` from the
 * Saxton & Rawls (2006) regression parameters. The curve spans three
 * physically distinct segments:
 *
 *   1. Saturated zone        ψ < ψE        →  θ = θS
 *   2. Capillary-fringe zone ψE ≤ ψ ≤ 33   →  linear in ln(ψ) between
 *                                            (ψE, θS) and (33, θFC)
 *   3. Soil-matric tension   33 ≤ ψ ≤ ∞    →  θ(ψ) = (ψ / A)^(-1/B)
 *
 * where `A` and `B` are the Saxton-Rawls tension-curve parameters
 * (equations 11 & 12 in the reference paper, also exposed by
 * {@link calculateMoistureTensionRelationships}).
 *
 * The pF scale is reported alongside the kPa tensions:
 *   pF = log10(|ψ| in cm H₂O), with 1 kPa = 10.1972 cm H₂O.
 *
 * Field capacity is anchored at 33 kPa (pF 2.53) and permanent
 * wilting point at 1500 kPa (pF 4.18) per Saxton & Rawls.
 *
 * SCIENTIFIC REFERENCE
 *   Saxton, K.E. and Rawls, W.J. (2006). Soil Water Characteristic
 *   Estimates by Texture and Organic Matter for Hydrologic Solutions.
 *   Soil Sci. Soc. Am. J. 70:1569-1578. doi:10.2136/sssaj2005.0117.
 */

import { CLAMPS, DEFAULTS } from "./constants";
import {
	calculateDensityEffects,
	calculateMoistureRegressions,
	calculateMoistureTensionRelationships,
	determineSoilTextureClass,
} from "./calculateSoilPhysics";

// ---------------------------------------------------------------------------
// Constants (NOT mirrored from `constants.ts` — they are local to this engine)
// ---------------------------------------------------------------------------

/** Tension at field capacity (kPa) per the Saxton-Rawls calibration. */
export const TENSION_FIELD_CAPACITY_KPA = 33;

/** Tension at permanent wilting point (kPa). */
export const TENSION_WILTING_POINT_KPA = 1500;

/** 1 kPa expressed in cm of water column (4 °C). Used for the pF scale. */
export const KPA_TO_CM_H2O = 10.1972;

/** Default Management-Allowable-Depletion fraction for irrigation triggers. */
export const DEFAULT_MAD_FRACTION = 0.5;

/**
 * Canonical pF anchor points sampled by the curve generator. The set
 * matches the agronomic / soil-physics convention (Hillel, 1998):
 *
 *   - pF 0 …  near-saturation
 *   - pF 2.5 …  field-capacity proxy
 *   - pF 4.2 …  permanent-wilting-point proxy
 *   - pF 5 - 7 … air-dry → oven-dry (truncated below in this engine; we
 *                 stop at pF 4.2 because Saxton-Rawls is uncalibrated past
 *                 the wilting point).
 */
export const PF_SAMPLES: ReadonlyArray<number> = Object.freeze([
	0, 0.5, 1, 1.5, 1.8, 2, 2.3, 2.53, 3, 3.5, 4, 4.18,
]);

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface WaterRetentionCurveInput {
	/** Sand content as percent (0-100). */
	sand: number;
	/** Clay content as percent (0-100). */
	clay: number;
	/** Organic matter as percent (0-8). Defaults to engine baseline. */
	organicMatter?: number;
	/** Bulk-density factor (g/cm³). Defaults to 1.3. */
	densityFactor?: number;
}

export interface RetentionPoint {
	/** Soil-water matric potential, kPa (always positive in this engine). */
	tensionKpa: number;
	/** pF = log10(|ψ| in cm H₂O). */
	pF: number;
	/** Volumetric water content, percent (0-100). */
	waterContentVolPercent: number;
	/** Optional label for anchor points (e.g. "FC", "WP", "MAD"). */
	label?: string;
}

export interface WaterRetentionCurveResult {
	/** Sampled points spanning the saturated → wilting range, in pF order. */
	points: RetentionPoint[];

	/** θ at saturation (0 kPa) — equal to θS-DF, percent. */
	saturation: RetentionPoint;
	/** θ at field capacity (33 kPa, pF ≈ 2.53), percent. */
	fieldCapacity: RetentionPoint;
	/** θ at permanent wilting point (1500 kPa, pF ≈ 4.18), percent. */
	wiltingPoint: RetentionPoint;
	/** Threshold at MAD × PAW depletion (used as an irrigation trigger). */
	irrigationThreshold: RetentionPoint;

	/** Plant-available water = θFC − θWP, percent. */
	plantAvailableWater: number;
	/** Management-allowable-depletion fraction used to derive the trigger. */
	madFraction: number;

	/** Saxton-Rawls tension parameter A (kPa). */
	parameterA: number;
	/** Saxton-Rawls tension parameter B (dimensionless). */
	parameterB: number;
	/** Air-entry tension (kPa, ψE-adj). */
	airEntryTensionKpa: number;
	/** USDA texture class (PascalCase) used as the curve label. */
	textureClass: string;

	/**
	 * Phase 10A.7 (WS2 — R2) — bulk-density traceability.
	 *
	 *   - `predicted` : ρN from Saxton-Rawls Eq 6 ((1 − θS) × 2.65), g/cm³.
	 *   - `used`      : ρDF — the value actually fed to the density-
	 *                   adjusted equations (= user `densityFactor` when
	 *                   supplied, else engine default).
	 *   - `source`    : provenance flag for `used`.
	 */
	bulkDensity: {
		predicted: number;
		used: number;
		source: "USER_INPUT" | "DEFAULT";
	};

	/** Engine identifier — locked to the published Saxton-Rawls calibration. */
	method: "saxton-rawls-2006";
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function kpaToPf(tensionKpa: number): number {
	if (!Number.isFinite(tensionKpa) || tensionKpa <= 0) {
		return 0;
	}
	return Math.log10(tensionKpa * KPA_TO_CM_H2O);
}

function pfToKpa(pF: number): number {
	return Math.pow(10, pF) / KPA_TO_CM_H2O;
}

interface CurveParameters {
	thetaS: number;
	thetaFC: number;
	thetaWP: number;
	/** Canonical SR06 coefficient: ψ = A · θ^(B), with A in kPa. */
	A: number;
	/** Canonical SR06 exponent (negative; ψ falls as θ rises). */
	B: number;
	psiE: number;
}

/**
 * Calibrate the canonical Saxton-Rawls (2006) power-law coefficients
 * `A` and `B` from the engine-derived θ at 33 kPa and 1500 kPa, so the
 * curve passes exactly through (θFC, 33) and (θWP, 1500) in log-log
 * space. These are independent of (and not interchangeable with) the
 * legacy `tension.A` / `tension.B` exposed by the parent engine, which
 * are calibrated against θS rather than θ1500 and are used downstream
 * only to compute λ and ψE-adj.
 */
function calibrateSrCoefficients(
	thetaFC: number,
	thetaWP: number
): { A: number; B: number } {
	const B =
		(Math.log(TENSION_FIELD_CAPACITY_KPA) - Math.log(TENSION_WILTING_POINT_KPA)) /
		(Math.log(thetaFC) - Math.log(thetaWP));
	const A = TENSION_FIELD_CAPACITY_KPA / Math.pow(thetaFC, B);
	return { A, B };
}

function waterContentAt(tensionKpa: number, p: CurveParameters): number {
	if (tensionKpa <= p.psiE) {
		return p.thetaS;
	}
	if (tensionKpa <= TENSION_FIELD_CAPACITY_KPA) {
		// Linear interpolation in ln(ψ) between (ψE, θS) and (33, θFC).
		const x = Math.log(tensionKpa);
		const x0 = Math.log(p.psiE);
		const x1 = Math.log(TENSION_FIELD_CAPACITY_KPA);
		const t = (x - x0) / (x1 - x0);
		return p.thetaS + (p.thetaFC - p.thetaS) * t;
	}
	// Saxton-Rawls power law: ψ = A · θ^B  (B < 0)  ⇒  θ = (ψ / A)^(1/B).
	return Math.pow(tensionKpa / p.A, 1 / p.B);
}

function tensionAt(theta: number, p: CurveParameters): number {
	if (theta >= p.thetaS) return p.psiE;
	if (theta <= p.thetaWP) return TENSION_WILTING_POINT_KPA;
	if (theta >= p.thetaFC) {
		// Inverse of the ln(ψ) interpolation in the capillary-fringe zone.
		const t = (theta - p.thetaS) / (p.thetaFC - p.thetaS);
		const x0 = Math.log(p.psiE);
		const x1 = Math.log(TENSION_FIELD_CAPACITY_KPA);
		return Math.exp(x0 + (x1 - x0) * t);
	}
	return p.A * Math.pow(theta, p.B);
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

/**
 * Builds the soil-water characteristic curve for a given soil. Returns
 * an ordered set of `(pF, ψ, θ)` triples plus the four agronomic
 * anchors (saturation, field capacity, wilting point, irrigation
 * threshold).
 *
 * The curve uses the Saxton-Rawls 2006 calibration; outside the
 * calibrated range (ψ > 1500 kPa or ψ < ψE) the engine clamps to
 * θWP / θS respectively rather than extrapolating.
 */
export function buildWaterRetentionCurve(
	input: WaterRetentionCurveInput
): WaterRetentionCurveResult {
	const sand = input.sand;
	const clay = input.clay;
	const om = input.organicMatter ?? DEFAULTS.organicMatter;
	const densityFactor = input.densityFactor ?? DEFAULTS.densityFactor;
	const densityFactorSource: "USER_INPUT" | "DEFAULT" =
		input.densityFactor !== undefined && Number.isFinite(input.densityFactor)
			? "USER_INPUT"
			: "DEFAULT";

	if (sand < 0 || sand > 100 || clay < 0 || clay > 100 || sand + clay > 100) {
		throw new Error("Invalid sand/clay percentages");
	}
	if (om < 0 || om > 8) {
		throw new Error("Organic matter must be between 0-8%");
	}

	const S = sand / 100;
	const C = clay / 100;
	const OM = om / 100;

	const moisture = calculateMoistureRegressions(S, C, OM);
	const density = calculateDensityEffects(moisture, densityFactor);
	const tension = calculateMoistureTensionRelationships(S, C, OM, density);
	// Phase 10A.7 R2 — capture the predicted vs. used bulk density.
	const predictedBulkDensity = density.rhoN;
	const usedBulkDensity = density.rhoDF;
	const { A, B } = calibrateSrCoefficients(density.theta33DF, density.theta1500DF);

	const params: CurveParameters = {
		thetaS: density.thetaSDF,
		thetaFC: density.theta33DF,
		thetaWP: density.theta1500DF,
		A,
		B,
		// Clamped to the same minimum the engine uses for ψE-adj so the
		// curve never crosses zero tension on a wide-open soil.
		psiE: Math.max(CLAMPS.psiEAdjMin, tension.psiEAdj),
	};

	const points: RetentionPoint[] = PF_SAMPLES.map((pF): RetentionPoint => {
		const tensionKpa = pfToKpa(pF);
		const theta = waterContentAt(tensionKpa, params);
		return {
			pF,
			tensionKpa,
			waterContentVolPercent: Math.max(0, theta * 100),
		};
	});

	const saturation: RetentionPoint = {
		pF: 0,
		tensionKpa: 0,
		waterContentVolPercent: params.thetaS * 100,
		label: "Saturation",
	};
	const fieldCapacity: RetentionPoint = {
		pF: kpaToPf(TENSION_FIELD_CAPACITY_KPA),
		tensionKpa: TENSION_FIELD_CAPACITY_KPA,
		waterContentVolPercent: params.thetaFC * 100,
		label: "FC",
	};
	const wiltingPoint: RetentionPoint = {
		pF: kpaToPf(TENSION_WILTING_POINT_KPA),
		tensionKpa: TENSION_WILTING_POINT_KPA,
		waterContentVolPercent: params.thetaWP * 100,
		label: "WP",
	};
	const pawDecimal = params.thetaFC - params.thetaWP;
	const triggerTheta = params.thetaFC - DEFAULT_MAD_FRACTION * pawDecimal;
	const triggerTensionKpa = tensionAt(triggerTheta, params);
	const irrigationThreshold: RetentionPoint = {
		pF: kpaToPf(triggerTensionKpa),
		tensionKpa: triggerTensionKpa,
		waterContentVolPercent: triggerTheta * 100,
		label: `MAD ${Math.round(DEFAULT_MAD_FRACTION * 100)}%`,
	};

	return {
		points,
		saturation,
		fieldCapacity,
		wiltingPoint,
		irrigationThreshold,
		plantAvailableWater: pawDecimal * 100,
		madFraction: DEFAULT_MAD_FRACTION,
		parameterA: params.A,
		parameterB: params.B,
		airEntryTensionKpa: params.psiE,
		textureClass: determineSoilTextureClass(sand, clay),
		bulkDensity: {
			predicted: predictedBulkDensity,
			used: usedBulkDensity,
			source: densityFactorSource,
		},
		method: "saxton-rawls-2006",
	};
}

export { kpaToPf as tensionKpaToPf, pfToKpa };
