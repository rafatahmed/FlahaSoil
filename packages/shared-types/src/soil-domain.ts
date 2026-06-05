/**
 * @flaha/shared-types — Soil domain DTOs and enums.
 *
 * Wire-format contracts shared between the v2 frontend, the v2 API, and any
 * downstream consumer (FlahaCalc, reporting). Field names and types are
 * aligned 1:1 with `prisma/v2-schema.prisma`. DateTime fields cross the
 * wire as ISO-8601 strings; Prisma `Decimal` fields cross the wire as
 * decimal strings (lossless round-trip with `Decimal.js`).
 *
 * These DTOs describe the **server-side shape** of a persisted record
 * (every field, including server-generated `id` / timestamps). Request
 * shapes for create / update endpoints live in `./api-contracts.ts` and
 * derive from these DTOs.
 */

// ---------------------------------------------------------------------------
// Wire-format primitives
// ---------------------------------------------------------------------------

/** ISO-8601 string, e.g. `"2026-05-05T08:30:00.000Z"`. */
export type IsoDateString = string;

/** Decimal serialised as a string to preserve full lab-grade precision. */
export type DecimalString = string;

// ---------------------------------------------------------------------------
// Enums (mirror prisma/v2-schema.prisma)
// ---------------------------------------------------------------------------

export enum SoilTestLevel {
	PRELIMINARY = "PRELIMINARY",
	MODERATE = "MODERATE",
	ADVANCED = "ADVANCED",
}

export enum SoilValueSource {
	LAB = "LAB",
	ESTIMATED = "ESTIMATED",
	DEFAULT = "DEFAULT",
	CALCULATED = "CALCULATED",
}

/**
 * Lifecycle of a generated soil report. Mirrors `enum SoilReportStatus`
 * in `prisma/v2-schema.prisma`.
 *
 * Phase 8D introduced the GENERATING / READY / FAILED transitions and
 * renamed the previous GENERATED value to READY for symmetry with the
 * "is at least one ReportVersion successfully persisted" predicate.
 */
export enum SoilReportStatus {
	DRAFT = "DRAFT",
	GENERATING = "GENERATING",
	READY = "READY",
	ARCHIVED = "ARCHIVED",
	FAILED = "FAILED",
}

export enum SoilInterpretationRating {
	GOOD = "GOOD",
	FAIR = "FAIR",
	POOR = "POOR",
}

// ---------------------------------------------------------------------------
// Identity DTOs
// ---------------------------------------------------------------------------

export interface SoilSampleDTO {
	id: string;
	userId: string;
	projectId?: string | null;
	locationName?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	depthFromCm?: number | null;
	depthToCm?: number | null;
	sampleDate?: IsoDateString | null;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}

export interface SoilTestDTO {
	id: string;
	sampleId: string;
	testLevel: SoilTestLevel;
	labName?: string | null;
	labReference?: string | null;
	testDate?: IsoDateString | null;
	notes?: string | null;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}

// ---------------------------------------------------------------------------
// Input DTOs (what the user / lab supplies)
// ---------------------------------------------------------------------------

export interface SoilTextureInputDTO {
	id: string;
	soilTestId: string;
	sandPercent?: number | null;
	siltPercent?: number | null;
	clayPercent?: number | null;
	organicMatterPercent?: number | null;
	bulkDensity?: number | null;
	gravelPercent?: number | null;
	source: SoilValueSource;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}

export interface SoilLabValueDTO {
	id: string;
	soilTestId: string;
	/** Logical key (e.g. `"ca"`, `"mg"`, `"ec"`, `"ph"`). */
	fieldKey: string;
	rawLabValue: DecimalString;
	rawUnit: string;
	convertedStandardValue?: number | null;
	standardUnit?: string | null;
	method?: string | null;
	notes?: string | null;
	measuredAt?: IsoDateString | null;
	createdAt: IsoDateString;
}


export interface SoilChemistryInputDTO {
	id: string;
	soilTestId: string;

	pH?: number | null;
	ecDsM?: number | null;
	tdsMgL?: number | null;

	cec?: number | null;
	ca?: number | null;
	mg?: number | null;
	k?: number | null;
	na?: number | null;
	cl?: number | null;
	n?: number | null;
	p?: number | null;

	fe?: number | null;
	mn?: number | null;
	zn?: number | null;
	cu?: number | null;
	b?: number | null;
	mo?: number | null;
	s?: number | null;

	carbonate?: number | null;
	bicarbonate?: number | null;
	sar?: number | null;
	esp?: number | null;

	heavyMetalsJson?: Record<string, unknown> | null;
	fullNutrientPanelJson?: Record<string, unknown> | null;

	source: SoilValueSource;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}

// ---------------------------------------------------------------------------
// Engine result DTOs
// ---------------------------------------------------------------------------

export interface SoilPhysicsResultDTO {
	id: string;
	soilTestId: string;

	fieldCapacity: number;
	wiltingPoint: number;
	plantAvailableWater: number;
	saturation: number;
	saturatedConductivity: number;
	textureClass: string;

	bulkDensity?: number | null;
	porosity?: number | null;
	voidRatio?: number | null;
	particleDensity?: number | null;
	soilQualityIndex?: number | null;
	drainageClass?: string | null;
	compactionRisk?: string | null;
	erosionRisk?: string | null;

	calculationVersion?: string | null;
	calculationTraceJson?: Record<string, unknown> | null;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}

export interface SoilChemistryResultDTO {
	id: string;
	soilTestId: string;

	cec: number;
	baseSaturation: number;
	caPercent: number;
	mgPercent: number;
	kPercent: number;
	naPercent: number;
	esp: number;
	sar?: number | null;
	cationBalanceOther: number;
	/** Mirrors `@flaha/soil-chemistry` input mode: `"LAB"` | `"ESTIMATED"`. */
	calculationMode: string;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}

/**
 * FAO-29 severity buckets shared by salinity and sodicity. Mirrors the
 * `SalinitySeverity` / `SodicitySeverity` literals exported from
 * `@flaha/soil-interpretation`.
 */
export type SoilSeverityClass =
	| "None"
	| "Slight"
	| "Moderate"
	| "Strong"
	| "Severe";

/** Per-use verdict value in a {@link SuitabilityMatrixDTO} entry. */
export type SuitabilityVerdictValue = "Suitable" | "Marginal" | "Unsuitable";

export interface SuitabilityMatrixEntry {
	verdict: SuitabilityVerdictValue;
	reasons: string[];
}

/**
 * Structured texture-suitability matrix persisted under
 * `SoilInterpretation.textureSuitabilityJson`. Each entry combines a
 * verdict with the human-readable reasons that produced it.
 */
export interface SuitabilityMatrixDTO {
	turfgrass: SuitabilityMatrixEntry;
	landscape: SuitabilityMatrixEntry;
	agriculture: SuitabilityMatrixEntry;
	irrigation: SuitabilityMatrixEntry;
}

export interface SoilInterpretationDTO {
	id: string;
	soilTestId: string;

	phCategory?: string | null;
	salinityRisk?: string | null;
	cecLevel?: string | null;
	baseSaturationCategory?: string | null;
	cationBalance?: string | null;
	sodiumRisk?: string | null;
	waterHoldingClass?: string | null;
	drainageClass?: string | null;
	overallSoilRating: SoilInterpretationRating;
	/** JSON array of warning strings emitted by `@flaha/soil-interpretation`. */
	warningsJson: string[];

	// Phase 8D — extended classifications. All fields nullable; the
	// engine omits each one when its input is not available.
	salinitySeverity?: SoilSeverityClass | null;
	sodicitySeverity?: SoilSeverityClass | null;
	organicMatterCategory?: string | null;
	infiltrationClass?: string | null;
	compactionRisk?: "Low" | "Moderate" | "High" | null;
	textureSuitabilityJson?: SuitabilityMatrixDTO | null;

	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}

// ---------------------------------------------------------------------------
// Report DTO
// ---------------------------------------------------------------------------

export interface SoilReportDTO {
	id: string;
	soilTestId: string;
	status: SoilReportStatus;
	/** Phase 8D — durable handle fields. */
	title?: string | null;
	reportNumber?: string | null;
	archived: boolean;
	/** FK to the latest successful ReportVersion (null while DRAFT). */
	currentVersionId?: string | null;
	/** Convenience: versionNumber of the currentVersion, or 0 when none. */
	latestVersionNumber: number;
	/** Legacy Phase 6 placeholder fields. Retained for compatibility. */
	reportType?: string | null;
	fileUrl?: string | null;
	generatedAt?: IsoDateString | null;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}
