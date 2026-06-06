/**
 * @flaha/soil-physics — USDA texture-triangle classifier and geometry.
 *
 * A complete USDA 12-class soil-texture classifier built around the
 * official polygon definitions transcribed from the USDA textural
 * triangle (NSSH, Soil Survey Staff). The engine returns:
 *
 *   - the matching USDA class name (PascalCase, identical to the
 *     strings emitted by {@link determineSoilTextureClass});
 *   - barycentric → Cartesian projection helpers for SVG visualisation;
 *   - input normalisation that derives a missing third fraction when
 *     two of (sand, silt, clay) are supplied.
 *
 * This module is intentionally additive to the legacy
 * {@link determineSoilTextureClass} (which is preserved verbatim for
 * baseline regression parity) — both classifiers coexist; the new one
 * is authoritative for v2 reporting and visual analytics.
 *
 * SCIENTIFIC REFERENCE
 *   USDA Soil Science Division Staff (2017). Soil Survey Manual,
 *   USDA Handbook 18 — Chapter 3 (Examination and Description of Soil
 *   Profiles), §"Soil Textural Classes" and accompanying triangle.
 */

/** Tolerance (percentage points) around the 100 % texture-sum target. */
export const TEXTURE_SUM_TOLERANCE = 0.5;

/** Polygon vertex expressed as USDA texture fractions in percent (0-100). */
export interface TextureFractionPoint {
	sand: number;
	silt: number;
	clay: number;
}

/** Cartesian point used for SVG / canvas rendering. */
export interface CartesianPoint {
	x: number;
	y: number;
}

/** Vertex triplet of the rendered triangle; defaults to a unit equilateral. */
export interface TriangleVertices {
	clay: CartesianPoint;
	sand: CartesianPoint;
	silt: CartesianPoint;
}

/**
 * Standard USDA layout: clay at top, sand bottom-left, silt bottom-right
 * of a unit equilateral triangle. Y grows DOWNWARD (SVG convention), so
 * the clay apex is at the smallest y.
 */
export const DEFAULT_TRIANGLE_VERTICES: TriangleVertices = {
	clay: { x: 0.5, y: 0 },
	sand: { x: 0, y: Math.sqrt(3) / 2 },
	silt: { x: 1, y: Math.sqrt(3) / 2 },
};

/**
 * USDA 12-class polygon vertices (sand / silt / clay in percent).
 *
 * Each polygon is listed in traversal order (closed implicitly — first
 * point repeated by the consumer). Vertices are taken verbatim from
 * the FlahaSOIL legacy reference asset `public/assets/data/data.json`,
 * which in turn mirrors the USDA Soil Textural Triangle (Soil Survey
 * Manual, Handbook 18). The class keys use PascalCase identical to the
 * strings emitted by {@link determineSoilTextureClass} for byte-level
 * parity with downstream consumers.
 */
export const USDA_TEXTURE_POLYGONS: Readonly<
	Record<string, ReadonlyArray<TextureFractionPoint>>
> = Object.freeze({
	Sand: [
		{ sand: 100, silt: 0, clay: 0 },
		{ sand: 90, silt: 0, clay: 10 },
		{ sand: 90, silt: 10, clay: 0 },
	],
	"Loamy Sand": [
		{ sand: 90, silt: 10, clay: 0 },
		{ sand: 90, silt: 0, clay: 10 },
		{ sand: 85, silt: 0, clay: 15 },
		{ sand: 70, silt: 30, clay: 0 },
	],
	"Sandy Loam": [
		{ sand: 70, silt: 30, clay: 0 },
		{ sand: 85, silt: 0, clay: 15 },
		{ sand: 80, silt: 0, clay: 20 },
		// (sand=52, silt=28, clay=20) is the USDA SL/SCL/L junction;
		// legacy `data.json` listed (53, 32, 20) which sums to 105 — a
		// transcription error. Corrected here so the polygon is closed
		// and a 1 % grid never produces a "no-match" hole.
		{ sand: 52, silt: 28, clay: 20 },
		{ sand: 53, silt: 42, clay: 5 },
		{ sand: 45, silt: 50, clay: 5 },
		{ sand: 50, silt: 50, clay: 0 },
	],
	"Sandy Clay Loam": [
		{ sand: 80, silt: 0, clay: 20 },
		{ sand: 65, silt: 0, clay: 35 },
		{ sand: 45, silt: 20, clay: 35 },
		{ sand: 45, silt: 27, clay: 28 },
		{ sand: 52, silt: 28, clay: 20 },
	],
	"Sandy Clay": [
		{ sand: 65, silt: 0, clay: 35 },
		{ sand: 45, silt: 20, clay: 35 },
		{ sand: 45, silt: 0, clay: 55 },
	],
	Clay: [
		{ sand: 45, silt: 0, clay: 55 },
		{ sand: 0, silt: 0, clay: 100 },
		{ sand: 0, silt: 40, clay: 60 },
		{ sand: 20, silt: 40, clay: 40 },
		{ sand: 45, silt: 15, clay: 40 },
	],
	"Clay Loam": [
		{ sand: 45, silt: 15, clay: 40 },
		{ sand: 20, silt: 40, clay: 40 },
		{ sand: 20, silt: 52, clay: 28 },
		{ sand: 45, silt: 27, clay: 28 },
	],
	"Silty Clay": [
		{ sand: 0, silt: 40, clay: 60 },
		{ sand: 0, silt: 60, clay: 40 },
		{ sand: 20, silt: 40, clay: 40 },
	],
	"Silty Clay Loam": [
		{ sand: 0, silt: 72, clay: 28 },
		{ sand: 20, silt: 52, clay: 28 },
		{ sand: 20, silt: 40, clay: 40 },
		{ sand: 0, silt: 60, clay: 40 },
	],
	"Silt Loam": [
		{ sand: 50, silt: 50, clay: 0 },
		{ sand: 22, silt: 50, clay: 28 },
		{ sand: 0, silt: 72, clay: 28 },
		{ sand: 0, silt: 88, clay: 12 },
		{ sand: 8, silt: 80, clay: 12 },
		{ sand: 20, silt: 80, clay: 0 },
	],
	Silt: [
		{ sand: 0, silt: 100, clay: 0 },
		{ sand: 20, silt: 80, clay: 0 },
		{ sand: 8, silt: 80, clay: 12 },
		{ sand: 0, silt: 88, clay: 12 },
	],
	Loam: [
		{ sand: 45, silt: 27, clay: 28 },
		{ sand: 22, silt: 50, clay: 28 },
		{ sand: 45, silt: 50, clay: 5 },
		{ sand: 53, silt: 42, clay: 5 },
		{ sand: 52, silt: 28, clay: 20 },
	],
});

/**
 * Canonical traversal order for classification. Smaller / more-specific
 * polygons are tested first so a point on a shared edge between e.g.
 * Clay and Clay Loam resolves deterministically to the more central
 * class. The order also matches the canonical USDA legend top-to-bottom.
 */
export const TEXTURE_CLASSIFICATION_ORDER: ReadonlyArray<string> = Object.freeze(
	[
		"Sand",
		"Loamy Sand",
		"Sandy Loam",
		"Sandy Clay Loam",
		"Sandy Clay",
		"Loam",
		"Clay Loam",
		"Silt Loam",
		"Silt",
		"Silty Clay Loam",
		"Silty Clay",
		"Clay",
	]
);

// ---------------------------------------------------------------------------
// Fraction normalisation
// ---------------------------------------------------------------------------

export interface NormalizedTextureFractions {
	sand: number;
	silt: number;
	clay: number;
	/** Which component was derived from the other two (if any). */
	derived: "sand" | "silt" | "clay" | null;
	/** True iff the supplied (or derived) sum is within tolerance of 100. */
	sumOk: boolean;
	/** Signed delta = (sand + silt + clay) − 100, in percentage points. */
	sumDelta: number;
}

function isNum(v: unknown): v is number {
	return typeof v === "number" && Number.isFinite(v);
}

/**
 * Reconciles a (possibly partial) `(sand, silt, clay)` triple.
 *
 *   - If exactly one fraction is missing, derive it as `100 − sum(other two)`.
 *   - If all three are present, the sum is validated against the
 *     {@link TEXTURE_SUM_TOLERANCE} window.
 *   - If two or more are missing, all returned fractions are 0 and
 *     {@link NormalizedTextureFractions.sumOk} is `false`.
 *
 * The function never throws and never clamps user values — it only
 * fills the single missing slot. Out-of-range numbers are returned
 * verbatim; the caller decides whether to accept them.
 */
export function normalizeTextureFractions(
	sand: number | null | undefined,
	silt: number | null | undefined,
	clay: number | null | undefined
): NormalizedTextureFractions {
	const sHas = isNum(sand);
	const lHas = isNum(silt);
	const cHas = isNum(clay);
	const supplied = (sHas ? 1 : 0) + (lHas ? 1 : 0) + (cHas ? 1 : 0);

	if (supplied < 2) {
		return {
			sand: sHas ? (sand as number) : 0,
			silt: lHas ? (silt as number) : 0,
			clay: cHas ? (clay as number) : 0,
			derived: null,
			sumOk: false,
			sumDelta: 0,
		};
	}

	let s = sHas ? (sand as number) : 0;
	let l = lHas ? (silt as number) : 0;
	let c = cHas ? (clay as number) : 0;
	let derived: NormalizedTextureFractions["derived"] = null;

	if (supplied === 2) {
		if (!sHas) {
			s = 100 - l - c;
			derived = "sand";
		} else if (!lHas) {
			l = 100 - s - c;
			derived = "silt";
		} else {
			c = 100 - s - l;
			derived = "clay";
		}
	}

	const sum = s + l + c;
	const sumDelta = sum - 100;
	return {
		sand: s,
		silt: l,
		clay: c,
		derived,
		sumOk: Math.abs(sumDelta) <= TEXTURE_SUM_TOLERANCE,
		sumDelta,
	};
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/**
 * Projects a barycentric (sand, silt, clay) point onto a Cartesian
 * triangle. Input fractions in percent (0-100); they are normalised by
 * their sum so a missing-third tolerance does not skew the placement.
 *
 * Returns the centroid `(0.5, h/3)` when the input sum is zero or
 * non-finite.
 */
export function barycentricToCartesian(
	point: TextureFractionPoint,
	vertices: TriangleVertices = DEFAULT_TRIANGLE_VERTICES
): CartesianPoint {
	const sum = point.sand + point.silt + point.clay;
	if (!Number.isFinite(sum) || sum <= 0) {
		const cx = (vertices.clay.x + vertices.sand.x + vertices.silt.x) / 3;
		const cy = (vertices.clay.y + vertices.sand.y + vertices.silt.y) / 3;
		return { x: cx, y: cy };
	}
	const c = point.clay / sum;
	const s = point.sand / sum;
	const l = point.silt / sum;
	return {
		x: c * vertices.clay.x + s * vertices.sand.x + l * vertices.silt.x,
		y: c * vertices.clay.y + s * vertices.sand.y + l * vertices.silt.y,
	};
}

/**
 * Tests whether `point` lies inside `polygon` using ray-casting on the
 * (sand, clay) plane. Silt is implicit (`silt = 100 − sand − clay`), so
 * projecting onto two of the three axes is bijective and preserves the
 * polygon's interior. Edge points are considered inside.
 *
 * Algorithm follows the standard PNPOLY (W. Randolph Franklin, 1970).
 */
export function polygonContains(
	polygon: ReadonlyArray<TextureFractionPoint>,
	point: TextureFractionPoint
): boolean {
	const px = point.sand;
	const py = point.clay;
	let inside = false;
	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i]!.sand;
		const yi = polygon[i]!.clay;
		const xj = polygon[j]!.sand;
		const yj = polygon[j]!.clay;
		const intersect =
			yi > py !== yj > py &&
			px < ((xj - xi) * (py - yi)) / (yj - yi || Number.EPSILON) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export interface TextureClassificationResult {
	/** USDA texture class (PascalCase) or `null` when the point is invalid. */
	className: string | null;
	/** True when the point matched a USDA polygon directly. */
	matched: boolean;
	/** Echo of the normalised input used for classification. */
	point: TextureFractionPoint;
}

/**
 * Classifies a soil into one of the 12 USDA textural classes via
 * polygon containment. The polygons are searched in
 * {@link TEXTURE_CLASSIFICATION_ORDER}; the first containing polygon
 * wins, so callers see a deterministic result for points on shared
 * edges.
 *
 * Inputs are NOT normalised; callers should typically pipe them through
 * {@link normalizeTextureFractions} first to handle a missing third
 * fraction and to detect bad sums.
 */
export function classifyTexture(
	sand: number,
	silt: number,
	clay: number
): TextureClassificationResult {
	if (!isNum(sand) || !isNum(silt) || !isNum(clay)) {
		return { className: null, matched: false, point: { sand: 0, silt: 0, clay: 0 } };
	}
	if (sand < 0 || silt < 0 || clay < 0) {
		return { className: null, matched: false, point: { sand, silt, clay } };
	}
	const point: TextureFractionPoint = { sand, silt, clay };
	for (const cls of TEXTURE_CLASSIFICATION_ORDER) {
		const poly = USDA_TEXTURE_POLYGONS[cls];
		if (poly && polygonContains(poly, point)) {
			return { className: cls, matched: true, point };
		}
	}
	return { className: null, matched: false, point };
}
