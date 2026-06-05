/**
 * @flaha/shared-types — Phase 8D report-versioning contracts.
 *
 * Wire shapes for the report management surface added in Phase 8D:
 *   - GET    /api/v2/projects/:projectId/reports
 *   - GET    /api/v2/reports/:reportId
 *   - GET    /api/v2/reports/:reportId/versions
 *   - GET    /api/v2/reports/:reportId/versions/:versionNumber
 *   - POST   /api/v2/soil-tests/:soilTestId/reports
 *   - POST   /api/v2/reports/:reportId/regenerate
 *   - PATCH  /api/v2/reports/:reportId
 *
 * `ReportVersionDTO` is the on-the-wire view of one immutable
 * `ReportVersion` row plus its decoded `snapshotJson` payload.
 */

import type { IsoDateString, SoilReportDTO, SoilReportStatus } from "./soil-domain";
import type { ProfessionalReportDTO } from "./professional-report";

export interface ReportVersionDTO {
	id: string;
	reportId: string;
	versionNumber: number;
	status: SoilReportStatus;
	generatedByUserId?: string | null;
	overallSoilRating?: string | null;
	textureClass?: string | null;
	errorMessage?: string | null;
	generatedAt: IsoDateString;
	createdAt: IsoDateString;
	/** Decoded ProfessionalReportDTO snapshot. */
	snapshot: ProfessionalReportDTO;
}

/** Compact projection used by list endpoints (no snapshot payload). */
export interface ReportVersionSummaryDTO {
	id: string;
	reportId: string;
	versionNumber: number;
	status: SoilReportStatus;
	overallSoilRating?: string | null;
	textureClass?: string | null;
	generatedAt: IsoDateString;
	generatedByUserId?: string | null;
}

export interface ReportWithVersionsDTO {
	report: SoilReportDTO;
	versions: ReportVersionSummaryDTO[];
	/** Decoded snapshot of the report's currentVersion, when one exists. */
	currentVersion: ReportVersionDTO | null;
}

// ---------------------------------------------------------------------------
// Requests
// ---------------------------------------------------------------------------

export interface GenerateReportRequest {
	/**
	 * Optional human-readable title. When omitted the generator derives
	 * one from the parent sample's locationName + test level.
	 */
	title?: string;
	/**
	 * Optional pre-assigned report number. When omitted the generator
	 * assigns one as `FLH-YYYY-NNN` scoped to the project.
	 */
	reportNumber?: string;
	/**
	 * Optional structured cover overrides (client / consultant names).
	 * Pulled from the project / user when omitted.
	 */
	cover?: {
		clientName?: string;
		consultantName?: string;
		consultantRole?: string;
	};
}

export interface RegenerateReportRequest {
	/** Optional note appended to the new version for change tracking. */
	reason?: string;
}

export interface PatchReportRequest {
	title?: string;
	archived?: boolean;
}

// ---------------------------------------------------------------------------
// Responses
// ---------------------------------------------------------------------------

export interface GenerateReportResponse {
	report: SoilReportDTO;
	version: ReportVersionDTO;
}

export type RegenerateReportResponse = GenerateReportResponse;

export interface ListProjectReportsResponse {
	reports: SoilReportDTO[];
}

export type GetReportResponse = ReportWithVersionsDTO;

export interface ListReportVersionsResponse {
	versions: ReportVersionSummaryDTO[];
}

export interface GetReportVersionResponse {
	version: ReportVersionDTO;
}

export interface PatchReportResponse {
	report: SoilReportDTO;
}
