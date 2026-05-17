/**
 * @flaha/shared-types — v2 API request / response contracts.
 *
 * One pair of types per route in the v2 surface (`/api/v2/...`). Request
 * shapes never include server-generated fields (`id`, `createdAt`,
 * `updatedAt`); response shapes mirror the persisted DTOs from
 * `./soil-domain.ts`.
 *
 * These types describe wire format only; runtime validation is the
 * concern of `@flaha/validation` (Phase-1 placeholder, future phase).
 */

import type {
	IsoDateString,
	SoilChemistryInputDTO,
	SoilChemistryResultDTO,
	SoilInterpretationDTO,
	SoilLabValueDTO,
	SoilPhysicsResultDTO,
	SoilReportDTO,
	SoilReportStatus,
	SoilSampleDTO,
	SoilTestDTO,
	SoilTestLevel,
	SoilTextureInputDTO,
	SoilValueSource,
} from "./soil-domain";
import type {
	CreateProjectResponse,
	GetProjectResponse,
	ListProjectsResponse,
} from "./projects";
import type { SoilReportEnvelope, SoilReportSummary } from "./reports";
import type { SystemWarning } from "./warnings";

// ---------------------------------------------------------------------------
// Helper: per-DTO "create" shapes — strip server-generated fields.
// ---------------------------------------------------------------------------

type ServerGenerated = "id" | "createdAt" | "updatedAt";

export type CreateSoilTextureInputPayload = Omit<
	SoilTextureInputDTO,
	ServerGenerated | "soilTestId"
>;

export type CreateSoilChemistryInputPayload = Omit<
	SoilChemistryInputDTO,
	ServerGenerated | "soilTestId"
>;

export type CreateSoilLabValuePayload = Omit<
	SoilLabValueDTO,
	"id" | "createdAt" | "soilTestId"
>;

// ===========================================================================
// 1. POST /api/v2/soil-samples
// ===========================================================================

export interface CreateSoilSampleRequest {
	userId: string;
	projectId?: string | null;
	locationName?: string | null;
	latitude?: number | null;
	longitude?: number | null;
	depthFromCm?: number | null;
	depthToCm?: number | null;
	sampleDate?: IsoDateString | null;
}

export interface CreateSoilSampleResponse {
	sample: SoilSampleDTO;
}

// ===========================================================================
// 2. GET /api/v2/soil-samples/:sampleId
// ===========================================================================

/** One-row summary of a SoilTest, suitable for list views. */
export interface SoilTestSummaryDTO {
	id: string;
	testLevel: SoilTestLevel;
	labName?: string | null;
	testDate?: IsoDateString | null;
	hasPhysicsResult: boolean;
	hasChemistryResult: boolean;
	hasInterpretation: boolean;
	createdAt: IsoDateString;
}

export interface GetSoilSampleResponse {
	sample: SoilSampleDTO;
	tests: SoilTestSummaryDTO[];
}

// ===========================================================================
// 3. POST /api/v2/soil-tests
// ===========================================================================

export interface CreateSoilTestRequest {
	sampleId: string;
	testLevel: SoilTestLevel;
	labName?: string | null;
	labReference?: string | null;
	testDate?: IsoDateString | null;
	notes?: string | null;
	textureInput?: CreateSoilTextureInputPayload;
	chemistryInput?: CreateSoilChemistryInputPayload;
	labValues?: CreateSoilLabValuePayload[];
}

export interface CreateSoilTestResponse {
	soilTest: SoilTestDTO;
	textureInput?: SoilTextureInputDTO;
	chemistryInput?: SoilChemistryInputDTO;
	labValues?: SoilLabValueDTO[];
}

// ===========================================================================
// 4. GET /api/v2/soil-tests/:soilTestId
// ===========================================================================

export interface GetSoilTestResponse {
	soilTest: SoilTestDTO;
	textureInput?: SoilTextureInputDTO | null;
	chemistryInput?: SoilChemistryInputDTO | null;
	physicsResult?: SoilPhysicsResultDTO | null;
	chemistryResult?: SoilChemistryResultDTO | null;
	interpretation?: SoilInterpretationDTO | null;
	reports: SoilReportDTO[];
	labValues?: SoilLabValueDTO[];
}

// ===========================================================================
// 5. POST /api/v2/soil-tests/:soilTestId/calculate
// ===========================================================================

/**
 * Drives which engines run for a given test. A `false` flag skips the
 * engine; the corresponding result field on the response is omitted.
 *
 * `calculationMode` is forwarded to `@flaha/soil-chemistry` when
 * `runChemistry === true`. `includeTrace`, when true, asks the physics
 * engine to populate `SoilPhysicsResultDTO.calculationTraceJson`.
 */
export interface CalculateSoilTestRequest {
	runPhysics: boolean;
	runChemistry: boolean;
	runInterpretation: boolean;
	calculationMode?: "LAB" | "ESTIMATED";
	includeTrace?: boolean;
}

export interface CalculateSoilTestResponse {
	physicsResult?: SoilPhysicsResultDTO;
	chemistryResult?: SoilChemistryResultDTO;
	interpretation?: SoilInterpretationDTO;
	/**
	 * Aggregated warnings from this calculation request. Includes the
	 * interpretation engine's `warningsJson` plus any soft-failure
	 * messages emitted while resolving inputs.
	 *
	 * Backward-compat wire field. New consumers should prefer
	 * `warningDetails` for machine-readable codes.
	 */
	warnings: string[];
	/**
	 * Structured counterpart to `warnings`. Each `SystemWarning` carries
	 * a stable `code`, severity, and optional `details`. Always present;
	 * `[]` when no warnings apply. Added in Phase 8 — older clients can
	 * keep ignoring it without loss.
	 */
	warningDetails: SystemWarning[];
}

// ===========================================================================
// 6. GET /api/v2/soil-tests/:soilTestId/interpretation
// ===========================================================================

export interface GetSoilInterpretationResponse {
	interpretation: SoilInterpretationDTO;
}

// ===========================================================================
// 7. POST /api/v2/soil-tests/:soilTestId/reports
// ===========================================================================

export interface CreateSoilReportRequest {
	/** Free-form discriminator (e.g. `"FULL_PDF"`, `"CSV_EXPORT"`). */
	reportType: string;
	includeTrace?: boolean;
	includeRawLabValues?: boolean;
}

export interface CreateSoilReportResponse {
	report: SoilReportDTO;
}

// ===========================================================================
// 8. GET /api/v2/soil-tests/:soilTestId/report
//    Optional `?format=summary` returns the compact `SoilReportSummary`.
// ===========================================================================

export type GetSoilTestReportFormat = "full" | "summary";

export interface GetSoilTestReportRequest {
	format?: GetSoilTestReportFormat;
}

export type GetSoilTestReportResponse = SoilReportEnvelope;
export type GetSoilTestReportSummaryResponse = SoilReportSummary;

// ===========================================================================
// 9. GET /api/v2/soil-tests/:soilTestId/flahacalc-export
// ===========================================================================

/**
 * Stable contract consumed by FlahaCalc. Required fields are the minimum
 * physics surface FlahaCalc needs to run an irrigation / leaching plan;
 * optional fields enrich the plan with chemistry-derived risk gates.
 */
export interface FlahaCalcExportResponse {
	soilTestId: string;

	textureClass: string;
	fieldCapacity: number;
	wiltingPoint: number;
	plantAvailableWater: number;
	saturation: number;
	saturatedConductivity: number;

	cec?: number;
	salinityRisk?: string;
	sodiumRisk?: string;

	warnings: string[];
}

// ---------------------------------------------------------------------------
// Convenience union for a v2 client `fetch` wrapper.
// ---------------------------------------------------------------------------

/** All v2 success response shapes, keyed by route id. */
export interface ApiV2RouteResponseMap {
	"POST /api/v2/projects": CreateProjectResponse;
	"GET /api/v2/projects": ListProjectsResponse;
	"GET /api/v2/projects/:projectId": GetProjectResponse;
	"POST /api/v2/soil-samples": CreateSoilSampleResponse;
	"GET /api/v2/soil-samples/:sampleId": GetSoilSampleResponse;
	"POST /api/v2/soil-tests": CreateSoilTestResponse;
	"GET /api/v2/soil-tests/:soilTestId": GetSoilTestResponse;
	"POST /api/v2/soil-tests/:soilTestId/calculate": CalculateSoilTestResponse;
	"GET /api/v2/soil-tests/:soilTestId/interpretation": GetSoilInterpretationResponse;
	"POST /api/v2/soil-tests/:soilTestId/reports": CreateSoilReportResponse;
	"GET /api/v2/soil-tests/:soilTestId/report": GetSoilTestReportResponse;
	"GET /api/v2/soil-tests/:soilTestId/report?format=summary": GetSoilTestReportSummaryResponse;
	"GET /api/v2/soil-tests/:soilTestId/flahacalc-export": FlahaCalcExportResponse;
}

// Re-export the source enums so consumers can import everything from one place.
export type { SoilReportStatus, SoilValueSource };
