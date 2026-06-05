/**
 * FlahaSOIL v2 — operational dashboard (Phase 8C-A).
 *
 * The dashboard is the operator's workspace, distinct from the landing
 * page. It surfaces a Soil Health Overview (KPI tiles), recent
 * projects, alerts derived from project status, the system-status
 * card, and the quick-action grid. Recent soil tests / reports are
 * scoped per project in the v2 API, so the dashboard deep-links into
 * project detail for those views rather than mock-aggregating them.
 */
import { Box, Stack, Typography } from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FolderIcon from "@mui/icons-material/Folder";
import OpacityIcon from "@mui/icons-material/Opacity";
import ScienceIcon from "@mui/icons-material/Science";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProjectSummaryDTO } from "@flaha/shared-types";

import { AlertsPanel } from "../features/dashboard/components/AlertsPanel";
import { MetricCard } from "../features/dashboard/components/MetricCard";
import { QuickActionsGrid } from "../features/dashboard/components/QuickActionsGrid";
import { RecentProjectsList } from "../features/dashboard/components/RecentProjectsList";
import { SystemStatusCard } from "../features/dashboard/components/SystemStatusCard";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient, getApiClientMode } from "../services/apiClientProvider";
import { useAuth } from "../auth";

const MAX_RECENT_PROJECTS = 5;

export function DashboardPage() {
	const navigate = useNavigate();
	const { status: sessionStatus, user } = useAuth();
	const apiMode = getApiClientMode();
	const [projects, setProjects] = useState<ProjectSummaryDTO[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	usePageHeader({
		title: "Soil Intelligence Workspace",
		subtitle: user
			? `${user.displayName} · operational dashboard`
			: "Operational dashboard",
		breadcrumbs: [{ label: "Home", to: "/" }, { label: "Dashboard" }],
	});

	useEffect(() => {
		if (sessionStatus !== "authenticated") return;
		let cancelled = false;
		setError(null);
		getApiClient()
			.listProjects({})
			.then((res) => {
				if (!cancelled) setProjects(res.projects);
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(err instanceof Error ? err.message : String(err));
			});
		return () => {
			cancelled = true;
		};
	}, [sessionStatus]);

	const totalProjects = projects?.length ?? null;
	const totalSamples =
		projects === null
			? null
			: projects.reduce((sum, p) => sum + p.sampleCount, 0);
	const activeProjects =
		projects === null ? null : projects.filter((p) => p.status === "ACTIVE").length;
	const archived =
		projects === null ? null : projects.filter((p) => p.status === "ARCHIVED").length;

	return (
		<Box>
			<Typography variant="h6" sx={{ mb: 1.5 }}>
				Soil Health Overview
			</Typography>
			<Box
				sx={{
					display: "grid",
					gap: 2,
					gridTemplateColumns: {
						xs: "1fr",
						sm: "repeat(2, 1fr)",
						md: "repeat(4, 1fr)",
					},
					mb: 4,
				}}
			>
				<MetricCard
					label="Projects"
					value={totalProjects}
					icon={<FolderIcon />}
					accent="soil"
					hint="All agronomic projects"
				/>
				<MetricCard
					label="Samples"
					value={totalSamples}
					icon={<OpacityIcon />}
					accent="green"
					hint="Field samples collected"
				/>
				<MetricCard
					label="Active"
					value={activeProjects}
					icon={<ScienceIcon />}
					accent="sand"
					hint="Projects in active analysis"
				/>
				<MetricCard
					label="Archived"
					value={archived}
					icon={<AssessmentIcon />}
					accent="warning"
					hint="Projects kept for audit reference"
				/>
			</Box>

			<Box
				sx={{
					display: "grid",
					gap: 3,
					gridTemplateColumns: { xs: "1fr", lg: "2fr 1fr" },
					mb: 4,
				}}
			>
				<RecentProjectsList
					projects={projects}
					error={error}
					limit={MAX_RECENT_PROJECTS}
					onOpen={(id) => navigate(`/projects/${id}`)}
					onManage={() => navigate("/projects")}
				/>
				<Stack spacing={3}>
					<AlertsPanel projects={projects} />
					<SystemStatusCard apiMode={apiMode} />
				</Stack>
			</Box>

			<Typography variant="h6" sx={{ mb: 1.5 }}>
				Quick actions
			</Typography>
			<QuickActionsGrid />
		</Box>
	);
}

