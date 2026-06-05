/**
 * FlahaSOIL v2 — mock API client.
 *
 * Returns deterministic, typed mock objects from `@flaha/shared-types`
 * so Phase 5 pages can render realistic UI without a backend. Every
 * method satisfies `ApiV2Client`; switching to the real client in
 * Phase 6 is a one-line change at the import site.
 */
import {
	type AuthLoginResponse,
	type AuthLogoutResponse,
	type AuthMeResponse,
	type AuthRefreshResponse,
	type AuthRegisterResponse,
	type AuthSessionDTO,
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
	type GenerateReportRequest,
	type GenerateReportResponse,
	type GetCurrentUserResponse,
	type GetProjectResponse,
	type GetReportResponse,
	type GetReportVersionResponse,
	type GetSoilInterpretationResponse,
	type GetSoilSampleResponse,
	type GetSoilTestReportResponse,
	type GetSoilTestReportSummaryResponse,
	type GetSoilTestResponse,
	type ListProjectReportsResponse,
	type ListProjectsQuery,
	type ListProjectsResponse,
	type ListReportVersionsResponse,
	type LoginRequest,
	type OrganizationMembershipDTO,
	type PatchReportRequest,
	type PatchReportResponse,
	type ProfessionalReportDTO,
	type ProjectDTO,
	type ProjectSummaryDTO,
	type RegenerateReportResponse,
	type RegisterRequest,
	type ReportVersionDTO,
	type SoilReportDTO,
	MembershipStatus,
	OrganizationRole,
	OrganizationStatus,
	OrganizationType,
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

// Phase 9A-G — mock auth fixtures. The mock client always pretends the
// caller is signed in as `user_dev_admin` and a member of one personal
// org. Auth methods return canned tokens so the SPA can be exercised
// end-to-end without a backend; `accessToken` is a sentinel value the
// real client would never accept.
const MOCK_ORG_ID = "org_dev_admin";
const MOCK_MEMBERSHIP_ID = "mem_dev_admin";
const MOCK_ACCESS_TOKEN = "mock.access.token";
// Far future so the in-memory store never flags it as expired during
// a mock-only session.
const MOCK_ACCESS_TOKEN_EXPIRES_AT = "2099-12-31T23:59:59.000Z";

function buildMockAuthSession(): AuthSessionDTO {
	const user = {
		id: MOCK_USER_ID,
		email: "dev@flahasoil.local",
		displayName: "Development User",
		role: UserRole.ADMIN,
		createdAt: NOW,
		updatedAt: NOW,
		archivedAt: null,
	};
	const organization = {
		id: MOCK_ORG_ID,
		name: "Development User's workspace",
		slug: "dev-admin",
		type: OrganizationType.CONSULTANCY,
		status: OrganizationStatus.ACTIVE,
		createdAt: NOW,
		updatedAt: NOW,
	};
	const membership: OrganizationMembershipDTO = {
		id: MOCK_MEMBERSHIP_ID,
		organizationId: MOCK_ORG_ID,
		userId: MOCK_USER_ID,
		role: OrganizationRole.OWNER,
		status: MembershipStatus.ACTIVE,
		invitedById: null,
		invitedAt: null,
		acceptedAt: NOW,
		createdAt: NOW,
		updatedAt: NOW,
		organization,
	};
	return {
		accessToken: MOCK_ACCESS_TOKEN,
		accessTokenExpiresAt: MOCK_ACCESS_TOKEN_EXPIRES_AT,
		user,
		activeOrganization: organization,
		memberships: [membership],
	};
}

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

	// ---------------------------------------------------------------
	// Phase 9A-G — Auth (mock)
	//
	// The mock client treats register/login/refresh as no-ops that
	// always succeed and return the same canned session. The real
	// 401/credentials flow is exercised against the backend.
	// ---------------------------------------------------------------
	async register(_body: RegisterRequest): Promise<AuthRegisterResponse> {
		return { session: buildMockAuthSession() };
	},

	async login(_body: LoginRequest): Promise<AuthLoginResponse> {
		return { session: buildMockAuthSession() };
	},

	async refresh(): Promise<AuthRefreshResponse> {
		return { session: buildMockAuthSession() };
	},

	async logout(): Promise<AuthLogoutResponse> {
		return { ok: true };
	},

	async authMe(): Promise<AuthMeResponse> {
		const session = buildMockAuthSession();
		return {
			user: session.user,
			activeOrganization: session.activeOrganization,
			memberships: session.memberships,
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
				status: SoilReportStatus.READY,
				title: "Mock report",
				reportNumber: "FLH-MOCK-001",
				archived: false,
				currentVersionId: "rpv_mock_001",
				latestVersionNumber: 1,
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

	// Phase 8D — Report management surface (mock).
	async generateReport(
		soilTestId: string,
		body: GenerateReportRequest
	): Promise<GenerateReportResponse> {
		const report = mockSoilReport(soilTestId, body);
		const version = mockReportVersion(report.id, 1);
		return { report, version };
	},

	async listProjectReports(
		projectId: string
	): Promise<ListProjectReportsResponse> {
		void projectId;
		return { reports: [mockSoilReport(MOCK_TEST_ID, {})] };
	},

	async getReport(reportId: string): Promise<GetReportResponse> {
		const report = mockSoilReport(MOCK_TEST_ID, {}, reportId);
		const v1 = mockReportVersion(reportId, 1);
		return {
			report,
			versions: [
				{
					id: v1.id,
					reportId: v1.reportId,
					versionNumber: v1.versionNumber,
					status: v1.status,
					overallSoilRating: v1.overallSoilRating ?? null,
					textureClass: v1.textureClass ?? null,
					generatedAt: v1.generatedAt,
					generatedByUserId: v1.generatedByUserId ?? null,
				},
			],
			currentVersion: v1,
		};
	},

	async listReportVersions(
		reportId: string
	): Promise<ListReportVersionsResponse> {
		const v1 = mockReportVersion(reportId, 1);
		return {
			versions: [
				{
					id: v1.id,
					reportId: v1.reportId,
					versionNumber: v1.versionNumber,
					status: v1.status,
					overallSoilRating: v1.overallSoilRating ?? null,
					textureClass: v1.textureClass ?? null,
					generatedAt: v1.generatedAt,
					generatedByUserId: v1.generatedByUserId ?? null,
				},
			],
		};
	},

	async getReportVersion(
		reportId: string,
		versionNumber: number
	): Promise<GetReportVersionResponse> {
		return { version: mockReportVersion(reportId, versionNumber) };
	},

	async regenerateReport(reportId: string): Promise<RegenerateReportResponse> {
		const report = mockSoilReport(MOCK_TEST_ID, {}, reportId);
		const version = mockReportVersion(reportId, 2);
		return { report, version };
	},

	async patchReport(
		reportId: string,
		body: PatchReportRequest
	): Promise<PatchReportResponse> {
		const report = mockSoilReport(MOCK_TEST_ID, {}, reportId);
		if (body.title) report.title = body.title;
		if (typeof body.archived === "boolean") report.archived = body.archived;
		return { report };
	},

	getReportVersionPreviewUrl(reportId: string, versionNumber: number): string {
		return `mock://reports/${reportId}/versions/${versionNumber}/preview`;
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


function mockSoilReport(
	soilTestId: string,
	body: GenerateReportRequest,
	reportId = "rpt_mock_001"
): SoilReportDTO {
	return {
		id: reportId,
		soilTestId,
		status: SoilReportStatus.READY,
		title: body.title ?? "Doha Demo report",
		reportNumber: body.reportNumber ?? "FLH-MOCK-001",
		archived: false,
		currentVersionId: "rpv_mock_001",
		latestVersionNumber: 1,
		reportType: "PROFESSIONAL_V1",
		fileUrl: null,
		generatedAt: NOW,
		createdAt: NOW,
		updatedAt: NOW,
	};
}

function mockProfessionalReport(): ProfessionalReportDTO {
	return {
		schemaVersion: "1.0",
		cover: {
			projectName: "Doha Demo Project",
			projectCode: "DOHA-01",
			clientName: "Demo Client",
			consultantName: "Development User",
			consultantRole: "Senior Agronomist",
			location: "Doha, Qatar",
			latitude: 25.276987,
			longitude: 51.520008,
			sampleId: MOCK_SAMPLE_ID,
			sampleCode: null,
			reportNumber: "FLH-MOCK-001",
			reportTitle: "Doha Demo report",
			reportDate: NOW,
			testLevel: "MODERATE",
		},
		executiveSummary: {
			overallRating: "Good",
			headlineFindings: [
				"USDA texture class: Loam — well suited to most crops.",
				"Plant-available water 16% — good water holding capacity.",
				"Salinity low (ECe < 2 dS/m) — no leaching required.",
			],
			actionItemCount: 1,
		},
		texture: { usdaClass: "Loam", sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.5 },
		physics: {
			fieldCapacity: 0.28, wiltingPoint: 0.12, plantAvailableWater: 0.16,
			bulkDensity: 1.35, porosity: 0.49, saturation: 0.45, saturatedConductivity: 12.5,
			units: { moisture: "cm/cm", bulkDensity: "g/cm³", conductivity: "mm/h" },
		},
		chemistry: {
			pH: 7.6, ece: 1.2, organicMatter: 2.5, cec: 18.2,
			macroNutrients: { n: 25, p: 18, k: 220 },
			secondaryNutrients: { ca: 1500, mg: 220, s: 15 },
			micronutrients: { fe: 8, mn: 12, zn: 2, cu: 1.5, b: 0.6 },
			calculationMode: "LAB",
		},
		salinity: { severity: "Slight", riskLabel: "Low", ece: 1.2, recommendation: "No action required." },
		sodicity: { severity: "None", riskLabel: "Low", sar: 1.5, esp: 2.0, recommendation: "No action required." },
		irrigation: { infiltrationClass: "Moderate", drainageClass: "Well drained", waterHoldingClass: "Moderate", leachingRequirement: 0.05, notes: [] },
		agronomic: {
			overallSoilRating: "Good",
			categories: [
				{ label: "pH", value: "7.6", status: "good" },
				{ label: "Salinity", value: "1.2 dS/m", status: "good" },
				{ label: "CEC", value: "18.2 cmol+/kg", status: "good" },
			],
			suitability: {
				turfgrass: { verdict: "Suitable", reasons: ["Loam texture, balanced chemistry."] },
				agriculture: { verdict: "Suitable", reasons: ["Adequate water holding capacity."] },
			},
		},
		recommendations: {
			short: [{ code: "REC-MON-001", severity: "INFO", horizon: "SHORT", category: "MONITORING", title: "Monitor pH quarterly", body: "Track soil pH over the season." }],
			medium: [], long: [],
		},
		notes: { missingValues: [], estimatedValues: [], calculationWarnings: [] },
		appendix: { calculationSummary: "Saxton & Rawls 2006 + chemistry pipeline.", inputs: {} },
		source: {} as never,
	};
}

function mockReportVersion(reportId: string, versionNumber: number): ReportVersionDTO {
	return {
		id: `rpv_mock_${versionNumber.toString().padStart(3, "0")}`,
		reportId,
		versionNumber,
		status: SoilReportStatus.READY,
		generatedByUserId: MOCK_USER_ID,
		overallSoilRating: "Good",
		textureClass: "Loam",
		errorMessage: null,
		generatedAt: NOW,
		createdAt: NOW,
		snapshot: mockProfessionalReport(),
	};
}
