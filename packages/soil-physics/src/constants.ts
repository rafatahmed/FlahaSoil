/**
 * @flaha/soil-physics — Constants extracted verbatim from
 * `api-implementation/src/services/soilCalculationService.js`.
 *
 * Every numeric value here is taken directly from the legacy file. Do NOT
 * edit values; do NOT add tolerances; do NOT round.
 */

/** Particle density assumed for mineral soils (g/cm³). */
export const PARTICLE_DENSITY = 2.65;

/** Saturated hydraulic conductivity multiplier in equation 16 (KS). */
export const KS_COEFFICIENT = 1930;

/** Osmotic potential multiplier in equation 23 (Ψo = -0.36 · EC). */
export const OSMOTIC_POTENTIAL_COEFFICIENT = -0.36;

/** Concentration effect at field capacity in equation 24 (Ψou = 2 · Ψo). */
export const OSMOTIC_POTENTIAL_FC_MULTIPLIER = 2;

/** Defaults applied by `calculateWaterCharacteristics` parameter list. */
export const DEFAULTS = {
	organicMatter: 2.5,
	densityFactor: 1.3,
	gravelContent: 0,
	electricalConductivity: 0.5,
	userPlan: "FREE" as const,
};

/** Clamp ranges used by the legacy engine. */
export const CLAMPS = {
	thetaSMin: 0.25,
	thetaSMax: 0.6,
	thetaSDFMin: 0.25,
	thetaSDFMax: 0.6,
	theta33DFMin: 0.05,
	theta33DFMax: 0.5,
	thetaS33DFMin: 0.01,
	AMin: 0.1,
	BMin: 0.1,
	BMax: 10,
	lambdaMin: 0.1,
	lambdaMax: 5,
	psiEAdjMin: 1,
	ksMin: 0.1,
	soilQualityMin: 0,
	soilQualityMax: 10,
};

/**
 * R² and standard-error values from Saxton & Rawls (2006) used to populate
 * Professional+ confidence-interval blocks.
 */
export const CONFIDENCE_DATA = {
	wiltingPoint: { r2: 0.86, se: 0.02 },
	fieldCapacity: { r2: 0.63, se: 0.05 },
	saturation: { r2: 0.29, se: 0.04 },
	airEntryTension: { r2: 0.78, se: 2.9 },
	saturatedConductivity: { r2: 0.45, se: 0.3 },
};

/**
 * FREE-tier basic-estimate lookup table (used by `calculateBasic`).
 * Values are taken verbatim from the legacy `basicEstimates` object.
 */
export const BASIC_ESTIMATES: Record<
	string,
	{ fc: number; wp: number; paw: number; sat: number; ks: number }
> = {
	Sand: { fc: 10, wp: 4, paw: 6, sat: 40, ks: 200 },
	"Loamy Sand": { fc: 12, wp: 5, paw: 7, sat: 42, ks: 150 },
	"Sandy Loam": { fc: 18, wp: 8, paw: 10, sat: 45, ks: 80 },
	Loam: { fc: 28, wp: 12, paw: 16, sat: 47, ks: 20 },
	"Silt Loam": { fc: 30, wp: 12, paw: 18, sat: 50, ks: 15 },
	Silt: { fc: 32, wp: 13, paw: 19, sat: 52, ks: 10 },
	"Clay Loam": { fc: 36, wp: 22, paw: 14, sat: 48, ks: 5 },
	Clay: { fc: 40, wp: 30, paw: 10, sat: 53, ks: 1 },
};

export const BASIC_DEFAULTS = { fc: 25, wp: 10, paw: 15, sat: 45, ks: 10 };
