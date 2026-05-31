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
	type CreateProjectRequest,
	type CreateProjectResponse,
	type CreateSoilReportRequest,
	type CreateSoilReportResponse,
	type CreateSoilSampleRequest,
	type CreateSoilSampleResponse,
	type CreateSoilTestRequest,
	type CreateSoilTestResponse,
	type FlahaCalcExportResponse,
	type GetCurrentUserResponse,
	type GetProjectResponse,
	type GetSoilInterpretationResponse,
	type GetSoilSampleResponse,
	type GetSoilTestReportResponse,
	type GetSoilTestReportSummaryResponse,
	type GetSoilTestResponse,
	type ListProjectsQuery,
	type ListProjectsResponse,
	type ProjectDTO,
	type ProjectSummaryDTO,
	ProjectStatus,
	SoilInterpretationRating,
	SoilReportStatus,
	SoilTestLevel,
	SoilValueSource,
	UserRole,
} from "@flaha/shared-types";

import type { ApiV2Client } from "./apiV2Client";

const NOW = "2026-05-05T08:00:00.000Z";
const MOCK_SAMPLE_ID = "smpl_mock_001";
const MOCK_TEST_ID = "test_mock_001";
const MOCK_PROJECT_ID = "proj_mock_001";

// Phase 8B: the mock client mirrors the dev-session model — every
// fixture is owned by a single seeded user that matches the backend's
// `user_dev_admin`. The mock no longer accepts a user id from the
// caller; all ownership filtering uses MOCK_USER_ID internally.
const MOCK_USER_ID = "user_dev_admin";

// In-memory project store so the wizard's "select project" dropdown and
// the Projects pages stay consistent across navigations within a single
// browser session. Seeded with one fixture so the empty-state can be
// inspected by clearing it.
const projectStore = new Map<string, ProjectDTO>();
projectStore.set(MOCK_PROJECT_ID, {
	id: MOCK_PROJECT_ID,
	userId: MOCK_USER_ID,
	name: "Doha Demo Project",
	code: "DOHA-01",
	description: "Seed project used by the mock client.",
	locationName: "Doha, Qatar",
	status: ProjectStatus.ACTIVE,
	createdAt: NOW,
	updatedAt: NOW,
});

function nextProjectId(): string {
	return `proj_mock_${(projectStore.size + 1).toString().padStart(3, "0")}`;
}

function projectSummary(p: ProjectDTO, sampleCount: number): ProjectSummaryDTO {
	return {
		id: p.id,
		name: p.name,
		code: p.code ?? null,
		status: p.status,
		sampleCount,
		createdAt: p.createdAt,
		updatedAt: p.updatedAt,
	};
}

export const mockApiV2Client: ApiV2Client = {
	async getMe(): Promise<GetCurrentUserResponse> {
		return {
			session: {
				mode: "dev",
				user: {
					id: MOCK_USER_ID,
					email: "dev@flahasoil.local",
					displayName: "Development User",
					role: UserRole.ADMIN,
					createdAt: NOW,
					updatedAt: NOW,
					archivedAt: null,
				},
			},
		};
	},

	async createProject(
		body: CreateProjectRequest
	): Promise<CreateProjectResponse> {
		const id = nextProjectId();
		const project: ProjectDTO = {
			id,
			userId: MOCK_USER_ID,
			name: body.name,
			code: body.code ?? null,
			description: body.description ?? null,
			locationName: body.locationName ?? null,
			status: body.status ?? ProjectStatus.ACTIVE,
			createdAt: NOW,
			updatedAt: NOW,
		};
		projectStore.set(id, project);
		return { project };
	},

	async listProjects(query: ListProjectsQuery): Promise<ListProjectsResponse> {
		const rows = Array.from(projectStore.values()).filter((p) => {
			if (p.userId !== MOCK_USER_ID) return false;
			if (query.status !== undefined && p.status !== query.status) return false;
			return true;
		});
		// One mock sample for the seed project, none for created-in-session.
		return {
			projects: rows.map((p) =>
				projectSummary(p, p.id === MOCK_PROJECT_ID ? 1 : 0)
			),
		};
	},

	async getProjectById(projectId: string): Promise<GetProjectResponse> {
		const project = projectStore.get(projectId);
		if (!project || project.userId !== MOCK_USER_ID) {
			throw new Error(`Mock project not found: ${projectId}`);
		}
		const samples =
			projectId === MOCK_PROJECT_ID
				? [
						{
							id: MOCK_SAMPLE_ID,
							userId: MOCK_USER_ID,
							projectId,
							locationName: "Mock Field A",
							latitude: 25.276987,
							longitude: 51.520008,
							depthFromCm: 0,
							depthToCm: 30,
							sampleDate: NOW,
							createdAt: NOW,
							updatedAt: NOW,
						},
				  ]
				: [];
		return { project, samples };
	},

	async createSoilSample(
		body: CreateSoilSampleRequest
	): Promise<CreateSoilSampleResponse> {
		return {
			sample: {
				id: MOCK_SAMPLE_ID,
				userId: MOCK_USER_ID,
				projectId: body.projectId,
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
				userId: MOCK_USER_ID,
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
				userId: MOCK_USER_ID,
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
