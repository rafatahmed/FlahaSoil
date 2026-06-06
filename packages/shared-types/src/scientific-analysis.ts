/**
 * @flaha/shared-types — Phase 10 Scientific Analysis contracts.
 *
 * Wire schema for `GET /api/v2/soil-tests/:soilTestId/scientific-analysis`.
 * Mirrors the three engine outputs (texture triangle, water-retention
 * curve, cation structure triangle) into a single response so the
 * Scientific Analysis tab can render in one round-trip.
 *
 * Every block is **independently nullable** — a soil test with only
 * texture inputs returns `texture` + `waterRetention` and `structure: null`,
 * and vice-versa. The accompanying `warnings[]` array surfaces partial-
 * data states so the UI can render explanatory empty-state cards.
 */

/** 2-D Cartesian point on a normalised equilateral triangle (side = 100). */
export interface TrianglePoint {
	x: number;
	y: number;
}

/** A single retention-curve sample at a given pF / kPa. */
export interface RetentionCurvePointDTO {
	pF: number;
	tensionKpa: number;
	waterContentVolPercent: number;
	label?: string;
}

// ---------------------------------------------------------------------------
// Texture triangle
// ---------------------------------------------------------------------------

export interface TextureAnalysisBlock {
	/** Raw input fractions (percent, 0-100). May contain the derived value. */
	sand: number;
	silt: number;
	clay: number;
	/** Which fraction (if any) was derived from the other two (sum = 100). */
	derived: "sand" | "silt" | "clay" | null;
	/** True when |sum − 100| ≤ engine tolerance. */
	sumOk: boolean;
	/** Signed delta of (sand + silt + clay − 100). */
	sumDelta: number;
	/** Normalised fractions (sum exactly 100), suitable for plotting. */
	normalized: { sand: number; silt: number; clay: number };
	/** Cartesian projection on the USDA triangle (side = 100). */
	point: TrianglePoint;
	/** USDA texture class — null when no polygon contains the point. */
	classification: string | null;
	matched: boolean;
}

// ---------------------------------------------------------------------------
// Water-retention curve
// ---------------------------------------------------------------------------

export interface WaterRetentionAnalysisBlock {
	method: "saxton-rawls-2006";
	textureClass: string;
	points: RetentionCurvePointDTO[];
	saturation: RetentionCurvePointDTO;
	fieldCapacity: RetentionCurvePointDTO;
	wiltingPoint: RetentionCurvePointDTO;
	irrigationThreshold: RetentionCurvePointDTO;
	plantAvailableWater: number;
	madFraction: number;
	airEntryTensionKpa: number;
	parameterA: number;
	parameterB: number;
}

// ---------------------------------------------------------------------------
// Cation / structure triangle
// ---------------------------------------------------------------------------

export interface StructureAnalysisBlock {
	/** Raw inputs (cmol(+)/kg). */
	ca: number;
	mg: number;
	k: number;
	na: number | null;
	cec: number | null;
	/** Normalised triangle coordinates (Ca + Mg + K = 100). */
	normalized: { ca: number; mg: number; k: number };
	point: TrianglePoint;
	/** Classification under the Bear/Albrecht ratio school. */
	classification: string | null;
	matched: boolean;
	/** Diagnostic ratios (0 when denominator is zero). */
	caMgRatio: number;
	caKRatio: number;
	mgKRatio: number;
	basesTotal: number;
}

// ---------------------------------------------------------------------------
// Top-level response
// ---------------------------------------------------------------------------

export interface ScientificAnalysisResponse {
	soilTestId: string;
	texture: TextureAnalysisBlock | null;
	waterRetention: WaterRetentionAnalysisBlock | null;
	structure: StructureAnalysisBlock | null;
	/**
	 * Soft-failure messages. Typical entries:
	 *   - "Texture inputs missing — texture triangle unavailable"
	 *   - "Chemistry inputs missing — structure triangle unavailable"
	 *   - "Texture fractions sum to 101 % — engine normalised"
	 */
	warnings: string[];
}
