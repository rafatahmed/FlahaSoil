/**
 * @flaha/soil-chemistry — Cation / structure triangle.
 *
 * Plots the three primary structural base cations (Ca, Mg, K) on an
 * equilateral ternary diagram and classifies the soil-structure balance
 * against published "ideal-ratio" zones derived from the Albrecht /
 * Bear ratio school (Bear 1945; Albrecht 1975) and the Eurofins lab
 * report convention.
 *
 *   - Axes are normalised so Ca% + Mg% + K% = 100 (Na and H are
 *     **excluded** from the triangle but reported separately via
 *     {@link summariseCationStructure}).
 *   - Classification is performed with a polygon-containment test
 *     identical to the USDA texture-triangle engine in
 *     `@flaha/soil-physics`.
 *
 * SCIENTIFIC REFERENCES
 *   Bear, F.E., Prince, A.L., Malcolm, J.L. (1945). Potassium Needs
 *     of New Jersey Soils. New Jersey Agric. Exp. Station Bull. 721.
 *   Albrecht, W.A. (1975). The Albrecht Papers, Vol. I. Acres U.S.A.
 *   Kopittke, P.M., Menzies, N.W. (2007). A review of the use of the
 *     basic cation saturation ratio and the "ideal" soil. SSSAJ 71:
 *     259-265.  (Critical perspective.)
 */

// ---------------------------------------------------------------------------
// Scientific disclaimer (Phase 10A.7 — Scientific Audit R3)
// ---------------------------------------------------------------------------

/**
 * Mandatory caveat that MUST accompany every visual or report surface
 * that renders the Bear/Albrecht structural cation triangle.
 *
 * The Basic Cation Saturation Ratio (BCSR) school is widely used in
 * commercial lab interpretations (Eurofins, BLGG, Brookside) but its
 * predictive power for yield, soil structure, and aggregate stability
 * is **not supported** by controlled trials when sufficiency-level
 * cation supplies are already met (Kopittke & Menzies 2007, SSSAJ
 * 71:259–265). The triangle is provided as a diagnostic visualisation
 * of relative cation balance only; agronomic decisions should also
 * weigh absolute sufficiency, pH, OM, texture, and crop demand.
 */
export const STRUCTURE_TRIANGLE_DISCLAIMER =
	"Bear/Albrecht (BCSR) cation balance is a diagnostic visualisation only. " +
	"Per Kopittke & Menzies (2007, SSSAJ 71:259–265), the basic cation " +
	"saturation ratio concept lacks consistent peer-reviewed support for " +
	"predicting crop yield once sufficiency-level supplies of Ca, Mg, and K " +
	"are met. Treat the triangle as a balance indicator, not a yield model; " +
	"interpret alongside absolute sufficiency, pH, OM, texture, and crop demand.";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Triangle classification labels in **diagnostic-priority order**.
 *
 * Deficiency flags rank above excess flags because the Albrecht /
 * Bear ratio school treats nutrient shortfall as the limiting factor
 * even when the same input also exceeds an upper threshold (a soil
 * with Ca = 92 %, Mg = 3 %, K = 5 % is reported as "Magnesium
 * Deficient", not "Calcium Excess", since the Mg shortfall is what
 * the agronomist must remediate).
 */
export const STRUCTURE_CLASSIFICATION_ORDER = [
	"Magnesium Deficient",
	"Potassium Deficient",
	"Calcium Deficient",
	"Calcium Excess",
	"Magnesium Excess",
	"Potassium Excess",
	"Balanced",
] as const;

export type StructureClass = (typeof STRUCTURE_CLASSIFICATION_ORDER)[number];

export interface CationVertex {
	/** Ca percent of (Ca + Mg + K), 0-100. */
	ca: number;
	/** Mg percent of (Ca + Mg + K), 0-100. */
	mg: number;
	/** K percent of (Ca + Mg + K), 0-100. */
	k: number;
}

export interface CationStructureInput {
	/** Calcium, cmol(+)/kg. */
	ca: number;
	/** Magnesium, cmol(+)/kg. */
	mg: number;
	/** Potassium, cmol(+)/kg. */
	k: number;
	/** Sodium, cmol(+)/kg (optional — reported separately). */
	na?: number;
	/** CEC, cmol(+)/kg (optional — used for absolute saturation %). */
	cec?: number;
}

export interface CationStructureResult {
	/** Normalised triangle coordinates (sum to 100). */
	normalized: CationVertex;
	/** Cartesian projection on the default equilateral triangle. */
	point: { x: number; y: number };
	/** Polygon-containment classification ("Balanced", etc.). */
	classification: StructureClass | null;
	/** Whether any polygon matched. */
	matched: boolean;
	/** Ca:Mg molar ratio (cmol/kg → cmol/kg, no unit conversion). */
	caMgRatio: number;
	/** Ca:K molar ratio. */
	caKRatio: number;
	/** Mg:K molar ratio. */
	mgKRatio: number;
	/** Sum Ca + Mg + K (cmol(+)/kg) for diagnostics. */
	basesTotal: number;
}

// ---------------------------------------------------------------------------
// Triangle geometry — equilateral, side = 100 units
// ---------------------------------------------------------------------------

const SQRT3_OVER_2 = Math.sqrt(3) / 2;

/**
 * Default equilateral triangle vertex layout. Axes are aligned so the
 * triangle reads "Ca apex at top, Mg bottom-right, K bottom-left",
 * which matches the convention used by the Eurofins report and the
 * V2 frontend cation-balance chart.
 */
export const DEFAULT_STRUCTURE_VERTICES = {
	ca: { x: 50, y: 0 },
	mg: { x: 100, y: 100 * SQRT3_OVER_2 },
	k: { x: 0, y: 100 * SQRT3_OVER_2 },
} as const;

/** Project a normalised (ca, mg, k) triple onto Cartesian coordinates. */
export function cationToCartesian(
	v: CationVertex,
	vertices: typeof DEFAULT_STRUCTURE_VERTICES = DEFAULT_STRUCTURE_VERTICES
): { x: number; y: number } {
	const sum = v.ca + v.mg + v.k;
	if (sum <= 0) {
		// Degenerate input: project to centroid so the SVG never produces NaN.
		const cx = (vertices.ca.x + vertices.mg.x + vertices.k.x) / 3;
		const cy = (vertices.ca.y + vertices.mg.y + vertices.k.y) / 3;
		return { x: cx, y: cy };
	}
	const a = v.ca / sum;
	const b = v.mg / sum;
	const c = v.k / sum;
	return {
		x: a * vertices.ca.x + b * vertices.mg.x + c * vertices.k.x,
		y: a * vertices.ca.y + b * vertices.mg.y + c * vertices.k.y,
	};
}

// ---------------------------------------------------------------------------
// Classification thresholds
// ---------------------------------------------------------------------------

/**
 * Thresholds in (Ca, Mg, K) percent of (Ca + Mg + K). Derived from
 * Bear (1945) / Albrecht (1975) "ideal-ratio" guidance and the
 * Eurofins lab report convention. Classification is **first-match**
 * in the order published by {@link STRUCTURE_CLASSIFICATION_ORDER}.
 */
export const STRUCTURE_THRESHOLDS = {
	/** Ca % ≥ this → "Calcium Excess". */
	caExcess: 80,
	/** Mg % ≥ this → "Magnesium Excess". */
	mgExcess: 25,
	/** K  % ≥ this → "Potassium Excess". */
	kExcess: 10,
	/** Ca % <  this → "Calcium Deficient". */
	caDeficient: 50,
	/** Mg % <  this → "Magnesium Deficient". */
	mgDeficient: 8,
	/** K  % <  this → "Potassium Deficient". */
	kDeficient: 1,
} as const;

function classifyFromNormalized(v: CationVertex): StructureClass | null {
	if (v.ca === 0 && v.mg === 0 && v.k === 0) return null;
	// Deficiency takes precedence (see STRUCTURE_CLASSIFICATION_ORDER docs).
	if (v.mg < STRUCTURE_THRESHOLDS.mgDeficient) return "Magnesium Deficient";
	if (v.k < STRUCTURE_THRESHOLDS.kDeficient) return "Potassium Deficient";
	if (v.ca < STRUCTURE_THRESHOLDS.caDeficient) return "Calcium Deficient";
	if (v.ca >= STRUCTURE_THRESHOLDS.caExcess) return "Calcium Excess";
	if (v.mg >= STRUCTURE_THRESHOLDS.mgExcess) return "Magnesium Excess";
	if (v.k >= STRUCTURE_THRESHOLDS.kExcess) return "Potassium Excess";
	return "Balanced";
}

// ---------------------------------------------------------------------------
// Public engine
// ---------------------------------------------------------------------------

/** Normalise (Ca, Mg, K) in cmol(+)/kg to percent of (Ca + Mg + K). */
export function normalizeCationFractions(
	ca: number,
	mg: number,
	k: number
): CationVertex {
	const sum = ca + mg + k;
	if (sum <= 0) return { ca: 0, mg: 0, k: 0 };
	return {
		ca: (ca / sum) * 100,
		mg: (mg / sum) * 100,
		k: (k / sum) * 100,
	};
}

/**
 * Classify a soil's structural cation balance.
 *
 * @param input  Ca / Mg / K in cmol(+)/kg. Na and CEC are optional and
 *               only used to populate diagnostic fields on the result.
 */
export function classifyCationStructure(
	input: CationStructureInput
): CationStructureResult {
	const ca = Number.isFinite(input.ca) ? Math.max(0, input.ca) : 0;
	const mg = Number.isFinite(input.mg) ? Math.max(0, input.mg) : 0;
	const k = Number.isFinite(input.k) ? Math.max(0, input.k) : 0;

	const normalized = normalizeCationFractions(ca, mg, k);
	const point = cationToCartesian(normalized);
	const classification = classifyFromNormalized(normalized);

	const safeDiv = (num: number, den: number): number =>
		den > 0 ? num / den : 0;

	return {
		normalized,
		point,
		classification,
		matched: classification !== null,
		caMgRatio: safeDiv(ca, mg),
		caKRatio: safeDiv(ca, k),
		mgKRatio: safeDiv(mg, k),
		basesTotal: ca + mg + k,
	};
}

/**
 * Convenience summariser used by the API layer — emits the triangle
 * result plus the optional Na / CEC echo so the frontend renders the
 * full Eurofins-style "structural cation balance" panel in one pass.
 */
export function summariseCationStructure(input: CationStructureInput) {
	const structure = classifyCationStructure(input);
	return {
		...structure,
		na: input.na ?? null,
		cec: input.cec ?? null,
	};
}
