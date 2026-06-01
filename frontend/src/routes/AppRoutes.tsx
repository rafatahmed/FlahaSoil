/**
 * FlahaSOIL v2 — route table (Phase 8C-A).
 *
 * Final platform hierarchy:
 *   /                      Landing (marketing / entry surface)
 *   /dashboard             Operational workspace
 *   /projects              My projects
 *   /projects/:id          Project detail (samples, tests)
 *   /soil-tests/new        Guided test wizard
 *   /soil-tests/:id        Result detail
 *   /soil-tests/:id/report Printable report
 *   /reports               Reports index
 *   /flahacalc-export      Hydraulics handoff
 *   /profile               User workspace
 *   /standards             Standards reference (placeholder)
 *   /settings              Platform settings (placeholder)
 *
 * Unknown paths fall back to the landing page; the wizard and detail
 * pages remain reachable via deep link for backwards compatibility.
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { FlahaCalcExportPage } from "../pages/FlahaCalcExportPage";
import { LandingPage } from "../pages/LandingPage";
import { ProfilePage } from "../pages/ProfilePage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectsListPage } from "../pages/ProjectsListPage";
import { ReportsPage } from "../pages/ReportsPage";
import { SettingsPage } from "../pages/SettingsPage";
import { SoilTestDetailPage } from "../pages/SoilTestDetailPage";
import { SoilTestReportPage } from "../pages/SoilTestReportPage";
import { SoilTestWizardPage } from "../pages/SoilTestWizardPage";
import { StandardsPage } from "../pages/StandardsPage";

export function AppRoutes() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route index element={<LandingPage />} />
				<Route path="dashboard" element={<DashboardPage />} />
				<Route path="projects" element={<ProjectsListPage />} />
				<Route
					path="projects/:projectId"
					element={<ProjectDetailPage />}
				/>
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
				<Route path="profile" element={<ProfilePage />} />
				<Route path="standards" element={<StandardsPage />} />
				<Route path="settings" element={<SettingsPage />} />
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
}
