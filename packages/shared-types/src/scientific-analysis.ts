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

import type { SoilTestLevel } from "./soil-domain";

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

/**
 * Phase 10A.7 (WS1) — explicit unit labels so every downstream surface
 * (UI cards, PDF report, JSON export) renders volumes as `% v/v` and
 * tensions as `kPa`, eliminating the depth-integrated `mm/m` ambiguity
 * that motivated the R1 unit-mismatch defect.
 */
export interface WaterRetentionUnits {
	waterContent: "% v/v";
	tension: "kPa";
	plantAvailableWater: "% v/v";
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
	/** Phase 10A.7 (WS1) — explicit unit anchors for downstream rendering. */
	units: WaterRetentionUnits;
	/**
	 * Phase 10A.7 (WS2 — R2) — bulk-density traceability echo, sourced
	 * directly from the physics engine.
	 */
	bulkDensity: {
		predicted: number;
		used: number;
		source: "USER_INPUT" | "DEFAULT";
		unit: "g/cm³";
	};
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
	/**
	 * Phase 10A.7 (WS5 — R3) — unit of the absolute cation values. The
	 * normalized triple is dimensionless percent of (Ca + Mg + K).
	 */
	unit: "cmol(+)/kg";
	/**
	 * Phase 10A.7 (WS5 — R3) — mandatory Bear/Albrecht (BCSR) caveat
	 * sourced from `@flaha/soil-chemistry` so the UI, the JSON export,
	 * and the PDF report all surface the same disclaimer text.
	 */
	disclaimer: string;
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
	/**
	 * Phase 10A.7 (Correction) — evidence-contract coverage, anchored on
	 * the SoilTest's declared `SoilTestLevel`. Optional for backward
	 * compatibility with snapshots persisted before the correction; new
	 * responses always emit it.
	 */
	coverage?: ScientificCoverage;
}

// ---------------------------------------------------------------------------
// Phase 10A.7 (Correction) — SoilTestLevel-anchored coverage contract
// ---------------------------------------------------------------------------

/**
 * Per-module / per-level evidence status.
 *
 *   - `Met`         — every expected field for this module was submitted.
 *   - `Partial`     — some expected fields submitted, others missing.
 *   - `Missing`     — no expected fields submitted, but the module is
 *                     expected at the declared level.
 *   - `NotRequired` — the module is not expected at the declared level.
 *                     Any submitted fields are still reported as
 *                     `extraSubmittedFields` for transparency.
 */
export type CoverageStatus = "Met" | "Partial" | "Missing" | "NotRequired";

/**
 * Coverage for a single thematic module (texture, basic chemistry,
 * cations, etc.). The module always reports both what was expected at
 * the declared level *and* what was actually submitted — extras are
 * never blocked, they are just labelled as supplementary.
 */
export interface CoverageModule {
	/** Stable machine id, e.g. `"texture"`, `"basicChemistry"`. */
	id: string;
	/** Human-readable module name, e.g. `"Soil texture"`. */
	label: string;
	/**
	 * Minimum `SoilTestLevel` at which this module is expected. `null`
	 * means the module is always optional regardless of declared level.
	 */
	requiredFrom: SoilTestLevel | null;
	/** True when `requiredFrom` is satisfied by the declared level. */
	required: boolean;
	/** Stable display keys for every field the module looks for. */
	expectedFields: string[];
	/** Display keys that were present in the submitted lab inputs. */
	submittedFields: string[];
	/**
	 * Expected fields that were NOT submitted. Empty for `NotRequired`
	 * modules (everything is optional by definition).
	 */
	missingExpectedFields: string[];
	/**
	 * Fields that were submitted but are not on the expected list for the
	 * declared level — they are still reported so consumers can credit
	 * the lab for extra work.
	 */
	extraSubmittedFields: string[];
	status: CoverageStatus;
}

/**
 * Roll-up of evidence completeness for the declared `SoilTestLevel`.
 *
 * `coveragePercent` is the ratio of required-field slots that were
 * satisfied, expressed as percent (0-100, one decimal). Alternate
 * groups (e.g. EC OR TDS) count as a single slot.
 */
export interface LevelCompleteness {
	declaredLevel: SoilTestLevel;
	status: CoverageStatus;
	coveragePercent: number;
	/** Pre-formatted single-sentence summary safe to render verbatim. */
	statement: string;
	/** Module ids whose status is `"Met"`. */
	metModules: string[];
	/** Module ids whose status is `"Partial"`. */
	partialModules: string[];
	/** Module ids whose status is `"Missing"`. */
	missingModules: string[];
}

/** Top-level evidence contract — `level` summary + per-module detail. */
export interface ScientificCoverage {
	level: LevelCompleteness;
	modules: CoverageModule[];
}
