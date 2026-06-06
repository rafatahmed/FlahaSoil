/**
 * FlahaSOIL v2 — route table (Phase 9A-G).
 *
 * Three branches sit at the top of the tree:
 *
 *   1. AuthLayout + PublicOnlyRoute → /login, /register
 *        Light-chrome cards for the auth forms. PublicOnlyRoute bounces
 *        already-authenticated users away (preserving ?next=...).
 *
 *   2. AppLayout (public) → /, /standards, /logout
 *        The landing page and the public-facing standards reference
 *        keep working without a session so anonymous traffic can land
 *        on the marketing surface. /logout is here because it must be
 *        reachable while the session is being torn down.
 *
 *   3. AppLayout + ProtectedRoute → everything else
 *        Dashboard, projects, soil tests, reports, profile, settings,
 *        account — all gated on `useAuth().status === "authenticated"`.
 *
 * Unknown paths fall back to the landing page.
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute, PublicOnlyRoute } from "../auth";
import { AppLayout } from "../layouts/AppLayout";
import { AuthLayout } from "../layouts/AuthLayout";
import { AcceptInvitationPage } from "../pages/AcceptInvitationPage";
import { AccountPage } from "../pages/AccountPage";
import { DashboardPage } from "../pages/DashboardPage";
import { FlahaCalcExportPage } from "../pages/FlahaCalcExportPage";
import { LandingPage } from "../pages/LandingPage";
import { LoginPage } from "../pages/LoginPage";
import { LogoutPage } from "../pages/LogoutPage";
import { OrganizationInvitationsPage } from "../pages/OrganizationInvitationsPage";
import { OrganizationMembersPage } from "../pages/OrganizationMembersPage";
import { OrganizationSettingsPage } from "../pages/OrganizationSettingsPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectReportsPage } from "../pages/ProjectReportsPage";
import { ProjectsListPage } from "../pages/ProjectsListPage";
import { RegisterPage } from "../pages/RegisterPage";
import { ReportDetailPage } from "../pages/ReportDetailPage";
import { ReportsPage } from "../pages/ReportsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SoilTestDetailPage } from "../pages/SoilTestDetailPage";
import { SoilTestReportPage } from "../pages/SoilTestReportPage";
import { SoilTestWizardPage } from "../pages/SoilTestWizardPage";
import { StandardsPage } from "../pages/StandardsPage";

export function AppRoutes() {
	return (
		<Routes>
			{/* Public auth surfaces — no app chrome, redirect when signed-in. */}
			<Route element={<AuthLayout />}>
				<Route element={<PublicOnlyRoute />}>
					<Route path="login" element={<LoginPage />} />
					<Route path="register" element={<RegisterPage />} />
				</Route>
			</Route>

			{/* App chrome — split into public-facing and gated subtrees. */}
			<Route element={<AppLayout />}>
				{/* Public-facing pages that work without a session. */}
				<Route index element={<LandingPage />} />
				<Route path="standards" element={<StandardsPage />} />
				<Route path="logout" element={<LogoutPage />} />

				{/* Gated pages — require an authenticated session. */}
				<Route element={<ProtectedRoute />}>
					<Route path="dashboard" element={<DashboardPage />} />
					<Route path="projects" element={<ProjectsListPage />} />
					<Route
						path="projects/:projectId"
						element={<ProjectDetailPage />}
					/>
					<Route
						path="projects/:projectId/reports"
						element={<ProjectReportsPage />}
					/>
					<Route
						path="projects/:projectId/reports/:reportId"
						element={<ReportDetailPage />}
					/>
					<Route path="reports/:reportId" element={<ReportDetailPage />} />
					<Route path="soil-tests/new" element={<SoilTestWizardPage />} />
					<Route
						path="soil-tests/:soilTestId"
						element={<SoilTestDetailPage />}
					/>
					<Route
						path="soil-tests/:soilTestId/report"
						element={<SoilTestReportPage />}
					/>
					<Route path="reports" element={<ReportsPage />} />
					<Route path="flahacalc-export" element={<FlahaCalcExportPage />} />
					<Route path="account" element={<AccountPage />} />
					<Route path="profile" element={<ProfilePage />} />
					<Route path="settings" element={<SettingsPage />} />

					{/* Phase 9B-D — Organization administration. */}
					<Route
						path="organizations/:organizationId/settings"
						element={<OrganizationSettingsPage />}
					/>
					<Route
						path="organizations/:organizationId/members"
						element={<OrganizationMembersPage />}
					/>
					<Route
						path="organizations/:organizationId/invitations"
						element={<OrganizationInvitationsPage />}
					/>
					{/* Convenience redirect: /organizations/:id → settings tab. */}
					<Route
						path="organizations/:organizationId"
						element={
							<Navigate to="settings" replace relative="path" />
						}
					/>
					{/* Top-level "Organization" link resolves to the active org's
					    settings. The page handles the no-active-org case. */}
					<Route
						path="organization/settings"
						element={<OrganizationSettingsPage />}
					/>
					<Route
						path="organization/members"
						element={<OrganizationMembersPage />}
					/>
					<Route
						path="organization/invitations"
						element={<OrganizationInvitationsPage />}
					/>

					{/* Phase 9B-D — Invitation accept landing. */}
					<Route path="invite/:token" element={<AcceptInvitationPage />} />
				</Route>

				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
}
