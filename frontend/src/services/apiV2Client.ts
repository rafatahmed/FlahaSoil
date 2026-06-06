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
	AcceptInvitationRequest,
	AcceptInvitationResponse,
	AuthLoginResponse,
	AuthLogoutResponse,
	AuthMeResponse,
	AuthRefreshResponse,
	AuthRegisterResponse,
	CalculateSoilTestRequest,
	CalculateSoilTestResponse,
	CreateInvitationRequest,
	CreateInvitationResponse,
	CreateProjectRequest,
	CreateProjectResponse,
	CreateSoilReportRequest,
	CreateSoilReportResponse,
	CreateSoilSampleRequest,
	CreateSoilSampleResponse,
	CreateSoilTestRequest,
	CreateSoilTestResponse,
	FlahaCalcExportResponse,
	GenerateReportRequest,
	GenerateReportResponse,
	GetCurrentUserResponse,
	GetOrganizationResponse,
	GetProjectResponse,
	GetReportResponse,
	GetReportVersionResponse,
	GetSoilInterpretationResponse,
	GetSoilSampleResponse,
	GetSoilTestReportResponse,
	GetSoilTestReportSummaryResponse,
	GetSoilTestResponse,
	ListInvitationsResponse,
	ListOrganizationMembersResponse,
	ListProjectReportsResponse,
	ListProjectsQuery,
	ListProjectsResponse,
	ListReportVersionsResponse,
	LoginRequest,
	PatchMembershipRequest,
	PatchMembershipResponse,
	PatchOrganizationRequest,
	PatchOrganizationResponse,
	PatchReportRequest,
	PatchReportResponse,
	RegenerateReportResponse,
	RegisterRequest,
	RemoveMembershipResponse,
	RevokeInvitationResponse,
	ScientificAnalysisResponse,
	SwitchOrganizationRequest,
	SwitchOrganizationResponse,
	UserMembershipsResponse,
} from "@flaha/shared-types";

export interface ApiV2Client {
	// Identity (Phase 8B) — resolve the dev-session user the API thinks
	// the client is. Kept on the interface as a thin compatibility shim
	// over the JWT session for code paths that still rely on the
	// dev-session shape (none in the live tree as of 9A-G; the mock keeps
	// it because removing it would force a v2 dependency on @auth/me).
	getMe(): Promise<GetCurrentUserResponse>;

	// ---------------------------------------------------------------
	// Phase 9A-C / 9A-G — Auth surface
	// ---------------------------------------------------------------
	// `register` / `login` / `refresh` are public (no Authorization
	// header required); `logout` / `authMe` are JWT-protected. The
	// real client manages the HttpOnly refresh-cookie transparently
	// via `credentials: include`; the mock just returns canned
	// fixtures so the SPA can be exercised offline.

	register(body: RegisterRequest): Promise<AuthRegisterResponse>;

	login(body: LoginRequest): Promise<AuthLoginResponse>;

	refresh(): Promise<AuthRefreshResponse>;

	logout(): Promise<AuthLogoutResponse>;

	authMe(): Promise<AuthMeResponse>;

	// ---------------------------------------------------------------
	// Phase 9A-H — Organization listing + switching
	// ---------------------------------------------------------------
	// `listMyOrganizations` is a JWT-protected read against
	// `GET /me/organizations`; it powers the tenant switcher's freshness
	// poll (auth session already carries memberships on hydrate, but a
	// long-running tab may need to discover newly-accepted invites).
	// `switchOrganization` rotates the access token via
	// `POST /auth/switch-organization` and returns a full AuthSessionDTO
	// so the SPA can drop it straight into `applySession`.
	listMyOrganizations(): Promise<UserMembershipsResponse>;

	switchOrganization(
		body: SwitchOrganizationRequest
	): Promise<SwitchOrganizationResponse>;

	// ---------------------------------------------------------------
	// Phase 9B — Organization administration
	// ---------------------------------------------------------------
	// All routes (except `acceptInvitation`) are gated by
	// `requireOrganizationAdmin`/`requireOrganizationMember` server-side.
	// The frontend role-gates the UI to avoid showing buttons that would
	// 403, but the backend remains the authoritative check.
	getOrganization(organizationId: string): Promise<GetOrganizationResponse>;

	patchOrganization(
		organizationId: string,
		body: PatchOrganizationRequest
	): Promise<PatchOrganizationResponse>;

	listOrganizationMembers(
		organizationId: string
	): Promise<ListOrganizationMembersResponse>;

	patchMembership(
		organizationId: string,
		userId: string,
		body: PatchMembershipRequest
	): Promise<PatchMembershipResponse>;

	removeMembership(
		organizationId: string,
		userId: string
	): Promise<RemoveMembershipResponse>;

	listInvitations(organizationId: string): Promise<ListInvitationsResponse>;

	createInvitation(
		organizationId: string,
		body: CreateInvitationRequest
	): Promise<CreateInvitationResponse>;

	revokeInvitation(
		organizationId: string,
		invitationId: string
	): Promise<RevokeInvitationResponse>;

	acceptInvitation(
		body: AcceptInvitationRequest
	): Promise<AcceptInvitationResponse>;

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

	// Phase 10A — Scientific Analysis (texture triangle + water-retention
	// curve + cation/structure triangle), returned together so the
	// Scientific Analysis tab loads in one round-trip. Independent blocks
	// are nullable so a partially-entered soil test renders meaningful
	// empty-state cards instead of failing.
	getScientificAnalysis(
		soilTestId: string
	): Promise<ScientificAnalysisResponse>;

	// Phase 8D — Report management surface.
	generateReport(
		soilTestId: string,
		body: GenerateReportRequest
	): Promise<GenerateReportResponse>;

	listProjectReports(projectId: string): Promise<ListProjectReportsResponse>;

	getReport(reportId: string): Promise<GetReportResponse>;

	listReportVersions(reportId: string): Promise<ListReportVersionsResponse>;

	getReportVersion(
		reportId: string,
		versionNumber: number
	): Promise<GetReportVersionResponse>;

	regenerateReport(reportId: string): Promise<RegenerateReportResponse>;

	patchReport(
		reportId: string,
		body: PatchReportRequest
	): Promise<PatchReportResponse>;

	/** Returns the absolute URL of the rendered HTML preview for a version. */
	getReportVersionPreviewUrl(reportId: string, versionNumber: number): string;
}

// Re-export the fetch-backed implementation so existing imports of
// `realApiV2Client` from this module keep working.
export { realApiV2Client, ApiClientError } from "./realApiV2Client";
