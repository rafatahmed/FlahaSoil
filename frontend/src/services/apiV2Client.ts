/**
 * FlahaSOIL v2 — typed API client surface.
 *
 * Defines the `ApiV2Client` interface that both `mockApiV2Client` and
 * `realApiV2Client` implement. The real implementation lives in
 * `realApiV2Client.ts` and is re-exported here for backwards
 * compatibility; selection between mock and real at runtime is the
 * responsibility of `apiClientProvider.ts`.
 */
import type {
	CalculateSoilTestRequest,
	CalculateSoilTestResponse,
	CreateProjectRequest,
	CreateProjectResponse,
	CreateSoilReportRequest,
	CreateSoilReportResponse,
	CreateSoilSampleRequest,
	CreateSoilSampleResponse,
	CreateSoilTestRequest,
	CreateSoilTestResponse,
	FlahaCalcExportResponse,
	GetCurrentUserResponse,
	GetProjectResponse,
	GetSoilInterpretationResponse,
	GetSoilSampleResponse,
	GetSoilTestReportResponse,
	GetSoilTestReportSummaryResponse,
	GetSoilTestResponse,
	ListProjectsQuery,
	ListProjectsResponse,
} from "@flaha/shared-types";

export interface ApiV2Client {
	// Identity (Phase 8B) — resolve the dev-session user the API thinks
	// the client is. Used by SessionProvider on boot.
	getMe(): Promise<GetCurrentUserResponse>;

	// Projects (Phase 8A) — agronomic container for samples.
	// Phase 8B: `userId` was removed from these signatures; the owning
	// user is resolved server-side from the dev-session.
	createProject(body: CreateProjectRequest): Promise<CreateProjectResponse>;

	listProjects(query: ListProjectsQuery): Promise<ListProjectsResponse>;

	getProjectById(projectId: string): Promise<GetProjectResponse>;

	createSoilSample(
		body: CreateSoilSampleRequest
	): Promise<CreateSoilSampleResponse>;

	getSoilSample(sampleId: string): Promise<GetSoilSampleResponse>;

	createSoilTest(
		body: CreateSoilTestRequest
	): Promise<CreateSoilTestResponse>;

	getSoilTest(soilTestId: string): Promise<GetSoilTestResponse>;

	calculateSoilTest(
		soilTestId: string,
		body: CalculateSoilTestRequest
	): Promise<CalculateSoilTestResponse>;

	getSoilInterpretation(
		soilTestId: string
	): Promise<GetSoilInterpretationResponse>;

	createSoilReport(
		soilTestId: string,
		body: CreateSoilReportRequest
	): Promise<CreateSoilReportResponse>;

	getSoilTestReport(
		soilTestId: string
	): Promise<GetSoilTestReportResponse>;

	getSoilTestReportSummary(
		soilTestId: string
	): Promise<GetSoilTestReportSummaryResponse>;

	getFlahaCalcExport(soilTestId: string): Promise<FlahaCalcExportResponse>;
}

// Re-export the fetch-backed implementation so existing imports of
// `realApiV2Client` from this module keep working.
export { realApiV2Client, ApiClientError } from "./realApiV2Client";
