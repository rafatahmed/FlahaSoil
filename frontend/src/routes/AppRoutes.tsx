/**
 * FlahaSOIL v2 — route table.
 *
 * Each `/api/v2`-backed page is reachable here. The mock client used
 * by the pages lives in `services/mockApiV2Client.ts`; no real network
 * calls are wired in Phase 5.
 */
import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "../layouts/AppLayout";
import { DashboardPage } from "../pages/DashboardPage";
import { FlahaCalcExportPage } from "../pages/FlahaCalcExportPage";
import { ReportsPage } from "../pages/ReportsPage";
import { SoilTestDetailPage } from "../pages/SoilTestDetailPage";
import { SoilTestReportPage } from "../pages/SoilTestReportPage";
import { SoilTestWizardPage } from "../pages/SoilTestWizardPage";

export function AppRoutes() {
	return (
		<Routes>
			<Route element={<AppLayout />}>
				<Route index element={<DashboardPage />} />
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
