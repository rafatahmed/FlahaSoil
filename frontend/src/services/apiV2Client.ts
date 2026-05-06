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
	CreateSoilReportRequest,
	CreateSoilReportResponse,
	CreateSoilSampleRequest,
	CreateSoilSampleResponse,
	CreateSoilTestRequest,
	CreateSoilTestResponse,
	FlahaCalcExportResponse,
	GetSoilInterpretationResponse,
	GetSoilSampleResponse,
	GetSoilTestReportResponse,
	GetSoilTestReportSummaryResponse,
	GetSoilTestResponse,
} from "@flaha/shared-types";

export interface ApiV2Client {
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
