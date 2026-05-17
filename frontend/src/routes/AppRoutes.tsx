/**
 * FlahaSOIL v2 — route table.
 *
 * Reflects the Phase 8A workflow hierarchy:
 *     Project → Soil Sample → Soil Test → Report → Export.
 *
 * Projects are the entry point for agronomic work; soil tests live
 * under them and are still reachable directly via their stable id.
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { FlahaCalcExportPage } from "../pages/FlahaCalcExportPage";
import { ProjectDetailPage } from "../pages/ProjectDetailPage";
import { ProjectsListPage } from "../pages/ProjectsListPage";
import { ReportsPage } from "../pages/ReportsPage";
import { SoilTestDetailPage } from "../pages/SoilTestDetailPage";
import { SoilTestReportPage } from "../pages/SoilTestReportPage";
import { SoilTestWizardPage } from "../pages/SoilTestWizardPage";

export function AppRoutes() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route index element={<DashboardPage />} />
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
				<Route path="*" element={<Navigate to="/" replace />} />
			</Route>
		</Routes>
	);
}
