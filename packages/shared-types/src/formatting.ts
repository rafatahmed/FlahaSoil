/**
 * @flaha/shared-types — Phase 10A.7 (WS6) canonical number-formatting
 * utilities.
 *
 * One source of truth for per-variable decimal precision across every
 * downstream surface (API responses, professional report HTML/PDF, React
 * UI cards, FlahaCalc export). Eliminates the legacy v1 "FREE shows
 * `bulkDensity.toFixed(3)` / Professional shows `toFixed(2)`" drift
 * documented in `docs/known-issues.md`.
 *
 * Add a new quantity by extending {@link QuantityKind} and registering
 * the precision in {@link QUANTITY_PRECISION}; every call site that uses
 * {@link formatQuantity} will pick it up automatically.
 */

/**
 * Quantity identifier. The names are intentionally domain-flavoured (not
 * unit-flavoured) so the same key drives precision regardless of whether
 * the value is rendered in % v/v, decimal, kPa, or pF.
 */
export type QuantityKind =
	| "pH"
	| "ec" // EC / ECe, dS/m
	| "cec" // cmol(+)/kg
	| "cation" // Ca/Mg/K/Na, cmol(+)/kg
	| "baseSaturation" // %
	| "cationSaturation" // %
	| "esp" // %
	| "sar" // (unitless ratio)
	| "bulkDensity" // g/cm³
	| "particlePercent" // sand / silt / clay / OM %
	| "waterContent" // % v/v
	| "waterContentDecimal" // cm³/cm³ (0 – 1)
	| "tensionKpa"
	| "pF"
	| "conductivity" // mm/h
	| "nutrientMgKg" // N / P / K extractable, mg/kg
	| "micronutrientMgKg" // Fe / Mn / Zn / Cu / B
	| "percent" // generic 0 – 100
	| "ratio"; // generic 0 – 1

/**
 * Canonical decimal precision per quantity. Picked so that the rendered
 * value is at-or-below the engine's documented standard error (Saxton &
 * Rawls 2006 Table 3) and matches the precision lab certificates report
 * (Eurofins / BLGG style).
 */
export const QUANTITY_PRECISION: Readonly<Record<QuantityKind, number>> = {
	pH: 2,
	ec: 2,
	cec: 1,
	cation: 2,
	baseSaturation: 1,
	cationSaturation: 1,
	// Phase 10A.7 R2 (B7) — ESP now matches SAR at 2 decimals so the
	// sodicity panel renders consistent precision across both metrics
	// (the FAO 29 / USDA-NRCS threshold tables themselves report ESP
	// to two decimal places, so the legacy 1-decimal rendering was
	// effectively lossy).
	esp: 2,
	sar: 2,
	bulkDensity: 2,
	particlePercent: 1,
	waterContent: 1,
	waterContentDecimal: 3,
	tensionKpa: 1,
	pF: 2,
	conductivity: 2,
	nutrientMgKg: 0,
	micronutrientMgKg: 1,
	percent: 1,
	ratio: 2,
};

/** Returned when a value is null / NaN / not finite. */
export const MISSING_VALUE_PLACEHOLDER = "—";

/**
 * Format a numeric value using the canonical precision for `kind`. Use
 * this anywhere a value is rendered to the user (cards, tables, PDFs,
 * tooltips). Returns {@link MISSING_VALUE_PLACEHOLDER} for nullish /
 * non-finite input so the call site never has to repeat the null guard.
 *
 * `overrideDigits` is provided as an escape hatch for one-off cases
 * (e.g. confidence-interval cells that need an extra significant digit);
 * if you find yourself reaching for it, register a new {@link QuantityKind}
 * instead.
 */
export function formatQuantity(
	value: number | null | undefined,
	kind: QuantityKind,
	overrideDigits?: number
): string {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return MISSING_VALUE_PLACEHOLDER;
	}
	const digits = overrideDigits ?? QUANTITY_PRECISION[kind];
	return value.toFixed(digits);
}

/**
 * Round (don't render) a numeric value to the canonical precision for
 * `kind`. Useful when persisting a derived value or comparing it against
 * an equality threshold without dragging trailing-decimal noise along.
 */
export function roundQuantity(
	value: number,
	kind: QuantityKind,
	overrideDigits?: number
): number {
	const digits = overrideDigits ?? QUANTITY_PRECISION[kind];
	const factor = Math.pow(10, digits);
	return Math.round(value * factor) / factor;
}
