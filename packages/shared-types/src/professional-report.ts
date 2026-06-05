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
		moisture: string; // e.g. "cm/cm" or "%"
		bulkDensity: string; // e.g. "g/cm³"
		conductivity: string; // e.g. "mm/h"
	};
}

export interface ChemistrySection {
	pH?: number | null;
	ece?: number | null;
	organicMatter?: number | null;
	cec?: number | null;
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
	calculationMode?: "LAB" | "ESTIMATED" | null;
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
	 * The raw assembled envelope used as the source for this snapshot.
	 * Embedded for audit / debugging — never used for rendering.
	 */
	source: SoilReportEnvelope;
}
