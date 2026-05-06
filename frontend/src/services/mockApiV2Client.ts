/**
 * FlahaSOIL v2 — mock API client.
 *
 * Returns deterministic, typed mock objects from `@flaha/shared-types`
 * so Phase 5 pages can render realistic UI without a backend. Every
 * method satisfies `ApiV2Client`; switching to the real client in
 * Phase 6 is a one-line change at the import site.
 */
import {
	type CalculateSoilTestRequest,
	type CalculateSoilTestResponse,
	type CreateSoilReportRequest,
	type CreateSoilReportResponse,
	type CreateSoilSampleRequest,
	type CreateSoilSampleResponse,
	type CreateSoilTestRequest,
	type CreateSoilTestResponse,
	type FlahaCalcExportResponse,
	type GetSoilInterpretationResponse,
	type GetSoilSampleResponse,
	type GetSoilTestReportResponse,
	type GetSoilTestReportSummaryResponse,
	type GetSoilTestResponse,
	SoilInterpretationRating,
	SoilReportStatus,
	SoilTestLevel,
	SoilValueSource,
} from "@flaha/shared-types";

import type { ApiV2Client } from "./apiV2Client";

const NOW = "2026-05-05T08:00:00.000Z";
const MOCK_SAMPLE_ID = "smpl_mock_001";
const MOCK_TEST_ID = "test_mock_001";

export const mockApiV2Client: ApiV2Client = {
	async createSoilSample(
		body: CreateSoilSampleRequest
	): Promise<CreateSoilSampleResponse> {
		return {
			sample: {
				id: MOCK_SAMPLE_ID,
				userId: body.userId,
				projectId: body.projectId ?? null,
				locationName: body.locationName ?? "Mock Field A",
				latitude: body.latitude ?? 25.276987,
				longitude: body.longitude ?? 51.520008,
				depthFromCm: body.depthFromCm ?? 0,
				depthToCm: body.depthToCm ?? 30,
				sampleDate: body.sampleDate ?? NOW,
				createdAt: NOW,
				updatedAt: NOW,
			},
		};
	},

	async getSoilSample(sampleId: string): Promise<GetSoilSampleResponse> {
		return {
			sample: {
				id: sampleId,
				userId: "user_mock",
				projectId: null,
				locationName: "Mock Field A",
				latitude: 25.276987,
				longitude: 51.520008,
				depthFromCm: 0,
				depthToCm: 30,
				sampleDate: NOW,
				createdAt: NOW,
				updatedAt: NOW,
			},
			tests: [
				{
					id: MOCK_TEST_ID,
					testLevel: SoilTestLevel.MODERATE,
					labName: "Mock Lab",
					testDate: NOW,
					hasPhysicsResult: true,
					hasChemistryResult: true,
					hasInterpretation: true,
					createdAt: NOW,
				},
			],
		};
	},

	async createSoilTest(
		body: CreateSoilTestRequest
	): Promise<CreateSoilTestResponse> {
		return {
			soilTest: {
				id: MOCK_TEST_ID,
				sampleId: body.sampleId,
				testLevel: body.testLevel,
				labName: body.labName ?? "Mock Lab",
				labReference: body.labReference ?? null,
				testDate: body.testDate ?? NOW,
				notes: body.notes ?? null,
				createdAt: NOW,
				updatedAt: NOW,
			},
		};
	},

	async getSoilTest(soilTestId: string): Promise<GetSoilTestResponse> {
		return {
			soilTest: {
				id: soilTestId,
				sampleId: MOCK_SAMPLE_ID,
				testLevel: SoilTestLevel.MODERATE,
				labName: "Mock Lab",
				labReference: "MOCK-001",
				testDate: NOW,
				notes: null,
				createdAt: NOW,
				updatedAt: NOW,
			},
			textureInput: {
				id: "txin_mock_001",
				soilTestId,
				sandPercent: 40,
				siltPercent: 40,
				clayPercent: 20,
				organicMatterPercent: 2.5,
				bulkDensity: 1.35,
				gravelPercent: 0,
				source: SoilValueSource.LAB,
				createdAt: NOW,
				updatedAt: NOW,
			},
			physicsResult: mockPhysicsResult(soilTestId),
			chemistryResult: mockChemistryResult(soilTestId),
			interpretation: mockInterpretation(soilTestId),
			reports: [],
		};
	},

	async calculateSoilTest(
		soilTestId: string,
		body: CalculateSoilTestRequest
	): Promise<CalculateSoilTestResponse> {
		const response: CalculateSoilTestResponse = {
			warnings: [],
			warningDetails: [],
		};
		if (body.runPhysics) {
			response.physicsResult = mockPhysicsResult(soilTestId);
		}
		if (body.runChemistry) {
			response.chemistryResult = mockChemistryResult(soilTestId);
		}
		if (body.runInterpretation) {
			response.interpretation = mockInterpretation(soilTestId);
		}
		return response;
	},

	async getSoilInterpretation(
		soilTestId: string
	): Promise<GetSoilInterpretationResponse> {
		return { interpretation: mockInterpretation(soilTestId) };
	},

	async createSoilReport(
		soilTestId: string,
		body: CreateSoilReportRequest
	): Promise<CreateSoilReportResponse> {
		return {
			report: {
				id: "rpt_mock_001",
				soilTestId,
				status: SoilReportStatus.GENERATED,
				reportType: body.reportType,
				fileUrl: "https://example.invalid/mock-report.pdf",
				generatedAt: NOW,
				createdAt: NOW,
				updatedAt: NOW,
			},
		};
	},

	async getSoilTestReport(
		soilTestId: string
	): Promise<GetSoilTestReportResponse> {
		const full = await this.getSoilTest(soilTestId);
		return {
			sample: {
				id: full.soilTest.sampleId,
				userId: "user_mock",
				projectId: null,
				locationName: "Mock Field A",
				latitude: 25.276987,
				longitude: 51.520008,
				depthFromCm: 0,
				depthToCm: 30,
				sampleDate: NOW,
				createdAt: NOW,
				updatedAt: NOW,
			},
			test: full.soilTest,
			physics: full.physicsResult ?? null,
			chemistry: full.chemistryResult ?? null,
			interpretation: full.interpretation ?? null,
			warnings: [],
			warningDetails: [],
			auditTrace: {
				physicsTrace: null,
				chemistryInputsUsed: null,
				skippedModules: [],
			},
			metadata: {
				generatedAt: NOW,
				version: "v2.0.0",
				calculationMode: "LAB",
				testLevel: full.soilTest.testLevel,
			},
		};
	},

	async getSoilTestReportSummary(
		soilTestId: string
	): Promise<GetSoilTestReportSummaryResponse> {
		const full = await this.getSoilTest(soilTestId);
		return {
			soilTestId,
			sampleId: full.soilTest.sampleId,
			testLevel: full.soilTest.testLevel,
			labName: full.soilTest.labName ?? null,
			textureClass: full.physicsResult?.textureClass ?? null,
			overallSoilRating: full.interpretation?.overallSoilRating ?? null,
			phCategory: full.interpretation?.phCategory ?? null,
			salinityRisk: full.interpretation?.salinityRisk ?? null,
			hasChemistry: !!full.chemistryResult,
			hasInterpretation: !!full.interpretation,
			warningCount: 0,
			generatedAt: NOW,
		};
	},

	async getFlahaCalcExport(
		soilTestId: string
	): Promise<FlahaCalcExportResponse> {
		return {
			soilTestId,
			textureClass: "Loam",
			fieldCapacity: 0.28,
			wiltingPoint: 0.12,
			plantAvailableWater: 0.16,
			saturation: 0.45,
			saturatedConductivity: 12.5,
			cec: 18.2,
			salinityRisk: "Low",
			sodiumRisk: "Low",
			warnings: [],
		};
	},
};

// ---------------------------------------------------------------------------
// Internal fixtures
// ---------------------------------------------------------------------------

function mockPhysicsResult(soilTestId: string) {
	return {
		id: "phys_mock_001",
		soilTestId,
		fieldCapacity: 0.28,
		wiltingPoint: 0.12,
		plantAvailableWater: 0.16,
		saturation: 0.45,
		saturatedConductivity: 12.5,
		textureClass: "Loam",
		bulkDensity: 1.35,
		porosity: 0.49,
		voidRatio: 0.96,
		particleDensity: 2.65,
		soilQualityIndex: null,
		drainageClass: "Well drained",
		compactionRisk: "Low",
		erosionRisk: "Low",
		calculationVersion: "saxton-rawls-2006",
		calculationTraceJson: null,
		createdAt: NOW,
		updatedAt: NOW,
	};
}

function mockChemistryResult(soilTestId: string) {
	return {
		id: "chem_mock_001",
		soilTestId,
		cec: 18.2,
		baseSaturation: 78.5,
		caPercent: 60.0,
		mgPercent: 12.5,
		kPercent: 4.0,
		naPercent: 2.0,
		esp: 2.0,
		sar: 1.5,
		cationBalanceOther: 21.5,
		calculationMode: "LAB",
		createdAt: NOW,
		updatedAt: NOW,
	};
}

function mockInterpretation(soilTestId: string) {
	return {
		id: "intp_mock_001",
		soilTestId,
		phCategory: "Slightly alkaline",
		salinityRisk: "Low",
		cecLevel: "Moderate",
		baseSaturationCategory: "Adequate",
		cationBalance: "Balanced",
		sodiumRisk: "Low",
		waterHoldingClass: "Moderate",
		drainageClass: "Well drained",
		overallSoilRating: SoilInterpretationRating.GOOD,
		warningsJson: [],
		createdAt: NOW,
		updatedAt: NOW,
	};
}
