/**
 * FlahaSOIL v2 — Reports page (Phase 8A).
 *
 * Reports are generated per soil test (POST /api/v2/soil-tests/:id/reports)
 * and there is no aggregate `/reports` query in v2 yet. This page
 * therefore acts as the navigation hub: pick a project, drill into a
 * soil test, and generate or view its report from the test detail
 * view. The list below mirrors the active API client's projects.
 */
import {
	Alert,
	Box,
	Card,
	CardActionArea,
	CardContent,
	Chip,
	Divider,
	Paper,
	Stack,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProjectSummaryDTO } from "@flaha/shared-types";

import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";
import { useSession } from "../session";

export function ReportsPage() {
	const navigate = useNavigate();
	const { status: sessionStatus } = useSession();
	const [projects, setProjects] = useState<ProjectSummaryDTO[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	usePageHeader({
		title: "Reports",
		subtitle: "Browse projects to open per-test reports",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Reports" },
		],
	});

	useEffect(() => {
		if (sessionStatus !== "ready") return;
		let cancelled = false;
		setError(null);
		getApiClient()
			.listProjects({})
			.then((res) => {
				if (!cancelled) setProjects(res.projects);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : String(err));
				}
			});
		return () => {
			cancelled = true;
		};
	}, [sessionStatus]);

	return (
		<Box>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				Reports are generated per soil test. Choose a project to browse
				its samples and tests, then open a test to generate or download
				its report.
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					Failed to load projects: {error}
				</Alert>
			)}

			{projects === null && !error && (
				<Typography color="text.secondary">Loading…</Typography>
			)}

			{projects !== null && projects.length === 0 && (
				<Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
					<Typography color="text.secondary">
						No projects yet — create one from the Projects page to start
						generating reports.
					</Typography>
				</Paper>
			)}

			{projects !== null && projects.length > 0 && (
				<Stack spacing={1}>
					{projects.map((p) => (
						<Card key={p.id} variant="outlined">
							<CardActionArea onClick={() => navigate(`/projects/${p.id}`)}>
								<CardContent>
									<Stack direction="row" alignItems="center" spacing={1}>
										<Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
											{p.name}
											{p.code ? ` · ${p.code}` : ""}
										</Typography>
										<Chip
											label={`${p.sampleCount} sample${p.sampleCount === 1 ? "" : "s"}`}
											size="small"
										/>
										<Chip
											label={p.status}
											size="small"
											variant="outlined"
										/>
									</Stack>
									<Divider sx={{ my: 1 }} />
									<Typography variant="body2" color="text.secondary">
										Open project to browse soil tests and their reports.
									</Typography>
								</CardContent>
							</CardActionArea>
						</Card>
					))}
				</Stack>
			)}
		</Box>
	);
}
