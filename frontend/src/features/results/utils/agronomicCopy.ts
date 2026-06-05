/**
 * FlahaSOIL v2 — agronomic copy snippets.
 *
 * Short, plain-language captions displayed under technical numbers
 * and interpretation labels so a non-specialist user can understand
 * what each value means in practice. These are advisory snippets
 * only — no values are computed here and no thresholds are encoded
 * (the classifiers in `@flaha/soil-interpretation` own that).
 */

/** One-line description per interpretation field, keyed by DTO field name. */
export const INTERPRETATION_FIELD_HELP: Record<string, string> = {
	phCategory:
		"Soil pH governs nutrient availability. A near-neutral pH (6.5\u20137.5) usually suits most crops.",
	salinityRisk:
		"Salinity (EC) tracks soluble salts. Higher EC reduces water uptake and crop establishment.",
	cecLevel:
		"Cation exchange capacity reflects the soil's ability to hold nutrients. Higher CEC = more buffering.",
	baseSaturationCategory:
		"Base saturation is the share of exchange sites held by Ca, Mg, K and Na. Mid values are typically optimal.",
	cationBalance:
		"A balanced Ca:Mg:K ratio improves nutrient uptake. Excess of any one cation can suppress the others.",
	sodiumRisk:
		"Exchangeable sodium (ESP) above ~15 % degrades soil structure and water infiltration.",
	waterHoldingClass:
		"Plant-available water capacity. Low values mean shorter irrigation intervals.",
	drainageClass:
		"How freely water drains through the profile. Poor drainage risks waterlogging.",
};

/** Short caption per overall rating. */
export const OVERALL_RATING_HELP: Record<string, string> = {
	GOOD: "Soil conditions are generally favourable for the typical crop range.",
	FAIR: "Soil is workable but has one or more limiting factors worth managing.",
	POOR: "One or more major constraints are present; targeted remediation is advised.",
};

/** Per-physics-number captions for the results page. */
export const PHYSICS_HELP: Record<string, string> = {
	textureClass: "USDA texture class derived from sand/silt/clay percentages.",
	fieldCapacity:
		"Soil moisture (vol %) two to three days after a wetting event \u2014 the upper limit of plant-usable water.",
	wiltingPoint:
		"Soil moisture (vol %) at which most crops can no longer extract water.",
	plantAvailableWater:
		"Water (vol %) between field capacity and wilting point \u2014 what the crop can actually use.",
	saturation:
		"Total pore space (vol %); the upper bound of water the soil can hold when fully wet.",
	saturatedConductivity:
		"How fast water moves through saturated soil. High values can mean leaching; very low values can mean ponding.",
	bulkDensity:
		"Dry mass per unit volume. High values often indicate compaction limiting roots.",
};

/** Per-chemistry-number captions for the results page. */
export const CHEMISTRY_HELP: Record<string, string> = {
	cec: "Cation exchange capacity (cmol(+)/kg). Higher = more nutrient buffering.",
	baseSaturation:
		"Share of CEC occupied by Ca, Mg, K and Na. Mid-range values are typically optimal.",
	esp: "Exchangeable sodium percentage. Above ~15 % structural problems are common.",
	sar: "Sodium adsorption ratio of the soil solution. High SAR signals sodicity risk.",
	cationShare:
		"Share of CEC held by each major cation. Imbalance can suppress nutrient uptake.",
};
