/**
 * FlahaSOIL v2 API — route table.
 *
 * Phase 9A-D: every protected `/api/v2/*` route is gated by the JWT
 * authSession middleware (`resolveAuthSession`) plus a per-route
 * role / resource guard from `auth/guards.ts`. The legacy
 * `devSessionMiddleware` is gone — when `ALLOW_DEV_AUTH=true` is set,
 * the same JWT path falls back to the dev resolver internally.
 *
 * Route order:
 *   1. `/auth` (public surface — register / login / refresh; me + logout
 *      are JWT-protected inside `createAuthRouter`).
 *   2. `resolveAuthSession` middleware for everything below.
 *   3. Domain routes with explicit role / tenancy guards.
 */

import { Router } from "express";

import {
	requireOrganization,
	requireOrganizationAdmin,
	requireOrganizationMember,
	requireOrgRole,
	requireProjectAccess,
	requireReportAccess,
	requireSampleAccess,
	requireSoilTestAccess,
	ROLES_AGRONOMY_WRITE,
	ROLES_LAB_WRITE,
	ROLES_REPORT_WRITE,
} from "../auth/guards";
import { resolveAuthSession } from "../auth/session.middleware";
import { getMe, getMyOrganizations } from "../controllers/me.controller";
import {
	deleteInvitationHandler,
	getOrganizationHandler,
	listInvitationsHandler,
	listMembersHandler,
	patchMembershipHandler,
	patchOrganizationHandler,
	postAcceptInvitationHandler,
	postInvitationHandler,
	removeMembershipHandler,
} from "../controllers/organizations.controller";
import { createAuthRouter } from "./auth.routes";
import {
	getProject,
	getProjects,
	postProject,
} from "../controllers/projects.controller";
import {
	getSoilSample,
	postSoilSample,
} from "../controllers/soilSamples.controller";
import {
	getProjectReports,
	getReportById,
	getReportVersion,
	getReportVersionPreview,
	getReportVersions,
	patchReportById,
	postGenerateReport,
	postRegenerateReport,
} from "../controllers/reports.controller";
import {
	getFlahaCalcExportHandler,
	getScientificAnalysisHandler,
	getSoilInterpretation,
	getSoilTest,
	getSoilTestReport,
	postCalculateSoilTest,
	postSoilTest,
} from "../controllers/soilTests.controller";
import { asyncHandler } from "../utils/asyncHandler";

export function createV2Router(): Router {
	const router = Router();

	// 1. Auth surface — partially public (register/login/refresh).
	router.use("/auth", createAuthRouter());

	// 2. All routes below require an authenticated session.
	router.use(asyncHandler(resolveAuthSession));

	// Session echo — any authenticated user.
	router.get("/me", asyncHandler(getMe));

	// Phase 9A-H — lists the caller's ACTIVE memberships for the tenant
	// switcher. Org-independent: a user with no active org still needs
	// this endpoint to discover whether they have any memberships.
	router.get("/me/organizations", asyncHandler(getMyOrganizations));

	// Projects (Phase 8A) — agronomic container for samples.
	router.post(
		"/projects",
		requireOrgRole(...ROLES_AGRONOMY_WRITE),
		asyncHandler(postProject)
	);
	router.get("/projects", requireOrganization, asyncHandler(getProjects));
	router.get(
		"/projects/:projectId",
		requireProjectAccess(),
		asyncHandler(getProject)
	);

	// Soil samples.
	router.post(
		"/soil-samples",
		requireOrgRole(...ROLES_LAB_WRITE),
		asyncHandler(postSoilSample)
	);
	router.get(
		"/soil-samples/:sampleId",
		requireSampleAccess(),
		asyncHandler(getSoilSample)
	);

	// Soil tests + downstream calculations / interpretation.
	router.post(
		"/soil-tests",
		requireOrgRole(...ROLES_LAB_WRITE),
		asyncHandler(postSoilTest)
	);
	router.get(
		"/soil-tests/:soilTestId",
		requireSoilTestAccess(),
		asyncHandler(getSoilTest)
	);
	router.post(
		"/soil-tests/:soilTestId/calculate",
		requireSoilTestAccess({ roles: ROLES_LAB_WRITE }),
		asyncHandler(postCalculateSoilTest)
	);
	router.get(
		"/soil-tests/:soilTestId/interpretation",
		requireSoilTestAccess(),
		asyncHandler(getSoilInterpretation)
	);
	router.post(
		"/soil-tests/:soilTestId/reports",
		requireSoilTestAccess({ roles: ROLES_REPORT_WRITE }),
		asyncHandler(postGenerateReport)
	);
	router.get(
		"/soil-tests/:soilTestId/report",
		requireSoilTestAccess(),
		asyncHandler(getSoilTestReport)
	);
	router.get(
		"/soil-tests/:soilTestId/flahacalc-export",
		requireSoilTestAccess(),
		asyncHandler(getFlahaCalcExportHandler)
	);
	router.get(
		"/soil-tests/:soilTestId/scientific-analysis",
		requireSoilTestAccess(),
		asyncHandler(getScientificAnalysisHandler)
	);

	// Phase 8D report management.
	router.get(
		"/projects/:projectId/reports",
		requireProjectAccess(),
		asyncHandler(getProjectReports)
	);
	router.get(
		"/reports/:reportId",
		requireReportAccess(),
		asyncHandler(getReportById)
	);
	router.patch(
		"/reports/:reportId",
		requireReportAccess({ roles: ROLES_REPORT_WRITE }),
		asyncHandler(patchReportById)
	);
	router.post(
		"/reports/:reportId/regenerate",
		requireReportAccess({ roles: ROLES_REPORT_WRITE }),
		asyncHandler(postRegenerateReport)
	);
	router.get(
		"/reports/:reportId/versions",
		requireReportAccess(),
		asyncHandler(getReportVersions)
	);
	router.get(
		"/reports/:reportId/versions/:versionNumber",
		requireReportAccess(),
		asyncHandler(getReportVersion)
	);
	router.get(
		"/reports/:reportId/versions/:versionNumber/preview",
		requireReportAccess(),
		asyncHandler(getReportVersionPreview)
	);

	// -----------------------------------------------------------------
	// Phase 9B — Organization administration
	//
	// Member-level reads (GET org, GET members) accept any ACTIVE role;
	// every mutating endpoint plus invitation listing is gated by
	// `requireOrganizationAdmin` (OWNER / ADMIN). Both guards return 404
	// when the caller has no membership in the target org so existence
	// never leaks across tenants.
	//
	// `POST /invitations/accept` is intentionally placed OUTSIDE the
	// `/organizations/:organizationId` prefix: the caller is not yet a
	// member of the target org, so an org-scoped guard would (correctly)
	// reject them. The handler resolves the org from the token instead.
	// -----------------------------------------------------------------
	router.get(
		"/organizations/:organizationId",
		requireOrganizationMember,
		asyncHandler(getOrganizationHandler)
	);
	router.patch(
		"/organizations/:organizationId",
		requireOrganizationAdmin,
		asyncHandler(patchOrganizationHandler)
	);
	router.get(
		"/organizations/:organizationId/members",
		requireOrganizationMember,
		asyncHandler(listMembersHandler)
	);
	router.patch(
		"/organizations/:organizationId/members/:userId",
		requireOrganizationAdmin,
		asyncHandler(patchMembershipHandler)
	);
	router.delete(
		"/organizations/:organizationId/members/:userId",
		requireOrganizationAdmin,
		asyncHandler(removeMembershipHandler)
	);
	router.get(
		"/organizations/:organizationId/invitations",
		requireOrganizationAdmin,
		asyncHandler(listInvitationsHandler)
	);
	router.post(
		"/organizations/:organizationId/invitations",
		requireOrganizationAdmin,
		asyncHandler(postInvitationHandler)
	);
	router.delete(
		"/organizations/:organizationId/invitations/:invitationId",
		requireOrganizationAdmin,
		asyncHandler(deleteInvitationHandler)
	);
	router.post("/invitations/accept", asyncHandler(postAcceptInvitationHandler));

	return router;
}
