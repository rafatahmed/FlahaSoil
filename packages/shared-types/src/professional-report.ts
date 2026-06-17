/**
 * @flaha/shared-types — Phase 8D professional report contract.
 *
 * `ProfessionalReportDTO` is the *immutable snapshot* persisted on every
 * `ReportVersion.snapshotJson` and rendered by the frontend report viewer
 * + the HTML/PDF templates. Every field is intentionally pre-formatted
 * for presentation — the renderer never re-derives values from the
 * underlying soil-test row.
 *
 * `RecommendationDTO` carries the structured output of the
 * recommendation engine. Each recommendation is identified by a stable
 * `code` (e.g. `REC-SAL-001`) so the human copy lives in exactly one
 * place (the rule registry) and downstream surfaces (UI, PDF, email,
 * translations) can re-render the same recommendation in any locale.
 */

import type {
	CoverageModule,
	LevelCompleteness,
} from "./scientific-analysis";
import type { IsoDateString } from "./soil-domain";
import type { SoilReportEnvelope } from "./reports";
import type { SystemWarning } from "./warnings";

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

/** Time horizon over which a recommendation should be acted on. */
export type RecommendationHorizon = "SHORT" | "MEDIUM" | "LONG";

/** High-level category for grouping recommendations on the report. */
export type RecommendationCategory =
	| "IRRIGATION"
	| "AMENDMENT"
	| "AGRONOMY"
	| "MONITORING"
	| "DRAINAGE"
	| "FERTILITY";

/** Severity of the underlying agronomic finding (drives badge colour). */
export type RecommendationSeverity = "INFO" | "WATCH" | "ACTION" | "CRITICAL";

export interface RecommendationDTO {
	/** Stable, machine-readable rule code. Example: `REC-SAL-001`. */
	code: string;
	severity: RecommendationSeverity;
	horizon: RecommendationHorizon;
	category: RecommendationCategory;
	/** Short headline rendered as the recommendation title. */
	title: string;
	/** Plain-language body. May reference numeric values inline. */
	body: string;
	/** Optional structured bullets / sub-actions. */
	bullets?: string[];
	/**
	 * Optional machine-readable payload (e.g. `{ ecDsM: 6.2 }`). Used by
	 * downstream automation; never required for rendering.
	 */
	context?: Record<string, unknown>;
}

export interface RecommendationSetDTO {
	short: RecommendationDTO[];
	medium: RecommendationDTO[];
	long: RecommendationDTO[];
}

// ---------------------------------------------------------------------------
// Report sections
// ---------------------------------------------------------------------------

/** Overall five-step soil rating used on the executive summary card. */
export type OverallSoilRating =
	| "Excellent"
	| "Good"
	| "Fair"
	| "Poor"
	| "Critical";

/** Severity classes for salinity / sodicity assessments (FAO 29 style). */
export type SeverityClass =
	| "None"
	| "Slight"
	| "Moderate"
	| "Strong"
	| "Severe";

export interface ReportCoverSection {
	/** Project display name (free-form; may be the project code if no name). */
	projectName: string;
	projectCode?: string | null;
	/** Client / organisation the project was prepared for. */
	clientName?: string | null;
	/** Person responsible for the report (typically the agronomist). */
	consultantName?: string | null;
	consultantRole?: string | null;
	location?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	sampleId: string;
	sampleCode?: string | null;
	/** Human-readable identifier (e.g. `FLH-2025-001`). */
	reportNumber: string;
	reportTitle: string;
	reportDate: IsoDateString;
	testLevel: string;
}

export interface ExecutiveSummarySection {
	overallRating: OverallSoilRating;
	/** 3–5 short bullet findings written for non-technical readers. */
	headlineFindings: string[];
	/** Count of critical / action recommendations, for the badge. */
	actionItemCount: number;
}

export interface TextureSection {
	usdaClass?: string | null;
	sandPercent?: number | null;
	siltPercent?: number | null;
	clayPercent?: number | null;
	organicMatterPercent?: number | null;
}

/**
 * Phase 10A.7 (B3) — bulk-density traceability echoed into the report.
 * `predicted` is the engine's Saxton-Rawls ρN; `used` is the value that
 * actually entered every density-coupled equation (ρDF); `source` flags
 * whether `used` came from a USER_INPUT or fell back to the engine
 * DEFAULT. All three live alongside the legacy `bulkDensity` field so
 * snapshots predating the correction continue to render.
 */
export interface BulkDensityTrace {
	predicted: number | null;
	used: number | null;
	source: "USER_INPUT" | "DEFAULT" | "UNKNOWN";
	unit: "g/cm³";
}

export interface PhysicsSection {
	fieldCapacity?: number | null;
	wiltingPoint?: number | null;
	plantAvailableWater?: number | null;
	bulkDensity?: number | null;
	porosity?: number | null;
	saturation?: number | null;
	saturatedConductivity?: number | null;
	/** Units, one-shot for the table footer. */
	units: {
		moisture: string; // Phase 10A.7 (B2) — water content is stored as % v/v.
		bulkDensity: string; // e.g. "g/cm³"
		conductivity: string; // e.g. "mm/h"
		porosity: string; // Phase 10A.7 (B2) — explicit "% v/v" anchor.
		saturation: string; // Phase 10A.7 (B2) — explicit "% v/v" anchor.
	};
	/**
	 * Phase 10A.7 (B3) — bulk-density traceability. Optional for back-compat
	 * with snapshots persisted before the correction; new snapshots always
	 * populate it from `calculationTraceJson`.
	 */
	bulkDensityTrace?: BulkDensityTrace;
}

/**
 * Phase 10A.7 (B5) — provenance of the CEC value rendered in the report.
 *
 *   LAB                 — `cec` came directly from the chemistry input row.
 *   DERIVED_CATION_SUM  — LAB mode with no CEC input; engine summed cations.
 *   ESTIMATED           — ESTIMATED mode (clay × 0.5 + OM × 2).
 *   MISSING             — no chemistry result was produced.
 */
export type CecSource =
	| "LAB"
	| "DERIVED_CATION_SUM"
	| "ESTIMATED"
	| "MISSING";

/**
 * Phase 10A.7 (B4) — exchangeable cations expressed in cmol(+)/kg.
 * Distinct from the fertility `secondaryNutrients` block which carries
 * mg/kg quantities. The two MUST NOT be merged at the renderer.
 */
export interface ExchangeableCationsBlock {
	ca?: number | null;
	mg?: number | null;
	k?: number | null;
	na?: number | null;
	unit: "cmol(+)/kg";
}

export interface ChemistrySection {
	pH?: number | null;
	ece?: number | null;
	organicMatter?: number | null;
	cec?: number | null;
	/** Phase 10A.7 (B5) — CEC provenance flag. Optional for back-compat. */
	cecSource?: CecSource;
	macroNutrients: {
		n?: number | null;
		p?: number | null;
		k?: number | null;
	};
	secondaryNutrients: {
		ca?: number | null;
		mg?: number | null;
		s?: number | null;
	};
	micronutrients: {
		fe?: number | null;
		mn?: number | null;
		zn?: number | null;
		cu?: number | null;
		b?: number | null;
	};
	/**
	 * Phase 10A.7 (B4) — exchangeable cation block (cmol(+)/kg). Optional
	 * for back-compat with snapshots persisted before the correction.
	 */
	exchangeableCations?: ExchangeableCationsBlock;
	calculationMode?: "LAB" | "ESTIMATED" | null;
	/**
	 * Phase 10A.7 (WS5 — R3) — Bear/Albrecht (BCSR) mandatory caveat from
	 * Kopittke & Menzies (2007). Present whenever exchangeable Ca, Mg, K
	 * are all supplied so the report surface is complete. The renderer MUST
	 * display this under a "CEC structure triangle" heading.
	 */
	structureDisclaimer?: string;
}

export interface SalinityAssessmentSection {
	severity: SeverityClass;
	riskLabel: string;
	/** Short headline recommendation (full ones live in RecommendationSet). */
	recommendation: string;
	ece?: number | null;
}

export interface SodicityAssessmentSection {
	severity: SeverityClass;
	riskLabel: string;
	sar?: number | null;
	esp?: number | null;
	recommendation: string;
}

export interface IrrigationImplicationsSection {
	infiltrationClass?: string | null;
	drainageClass?: string | null;
	waterHoldingClass?: string | null;
	/** Numeric leaching requirement fraction (0–1) when computable. */
	leachingRequirement?: number | null;
	notes: string[];
}

export interface AgronomicInterpretationSection {
	overallSoilRating: OverallSoilRating;
	categories: Array<{
		label: string;
		value: string;
		status: "good" | "fair" | "poor";
	}>;
	/** Suitability matrix from the interpretation engine. */
	suitability: {
		turfgrass?: SuitabilityVerdict;
		landscape?: SuitabilityVerdict;
		agriculture?: SuitabilityVerdict;
		irrigation?: SuitabilityVerdict;
	};
}

export interface SuitabilityVerdict {
	verdict: "Suitable" | "Marginal" | "Unsuitable";
	reasons: string[];
}

export interface NotesAndWarningsSection {
	missingValues: string[];
	estimatedValues: string[];
	calculationWarnings: SystemWarning[];
}

export interface AppendixSection {
	calculationSummary: string;
	/**
	 * Frozen copy of the inputs used (texture + chemistry rows) so the
	 * appendix can show "what we calculated from".
	 */
	inputs: Record<string, unknown>;
}

/**
 * Phase 10A.7 (Correction) — evidence-contract completeness section.
 *
 * Replaces the earlier `Basic / Professional / Advanced` panel model
 * with one anchored on the SoilTest's declared `SoilTestLevel`. The
 * composer NEVER silently downgrades the test level; instead it reports
 * what was *expected at the declared level* vs what was *submitted*,
 * and lists any extras as supplementary evidence.
 *
 * Field shape mirrors the wire contract in `./scientific-analysis.ts`
 * so frontend and PDF report read the same DTOs end-to-end.
 */
export interface CompletenessSection {
	level: LevelCompleteness;
	modules: CoverageModule[];
}

// ---------------------------------------------------------------------------
// Top-level DTO
// ---------------------------------------------------------------------------

export interface ProfessionalReportDTO {
	/** Schema version of the DTO itself — bump when sections change. */
	schemaVersion: "1.0";
	cover: ReportCoverSection;
	executiveSummary: ExecutiveSummarySection;
	texture: TextureSection;
	physics: PhysicsSection;
	chemistry: ChemistrySection;
	salinity: SalinityAssessmentSection;
	sodicity: SodicityAssessmentSection;
	irrigation: IrrigationImplicationsSection;
	agronomic: AgronomicInterpretationSection;
	recommendations: RecommendationSetDTO;
	notes: NotesAndWarningsSection;
	appendix: AppendixSection;
	/**
	 * Phase 10A.7 (Correction) — evidence-contract coverage anchored on
	 * the SoilTest's declared `SoilTestLevel`. Optional for backward
	 * compatibility with snapshots persisted before the correction; new
	 * snapshots always emit it.
	 */
	completeness?: CompletenessSection;
	/**
	 * The raw assembled envelope used as the source for this snapshot.
	 * Embedded for audit / debugging — never used for rendering.
	 */
	source: SoilReportEnvelope;
}
