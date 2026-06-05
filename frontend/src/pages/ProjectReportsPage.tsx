/**
 * FlahaSOIL v2 — Project-scoped reports list (Phase 8D F.1).
 *
 * Renders every SoilReport attached to a project's tests. Each row
 * shows title, status badge, current version number, generation time
 * and a link into the dedicated report detail page. Reports are
 * generated from the test detail page; the empty state directs the
 * user there.
 */
import {
	Alert,
	Box,
	Button,
	Card,
	CardActionArea,
	CardContent,
	Chip,
	Paper,
	Stack,
	Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { SoilReportDTO } from "@flaha/shared-types";
import { SoilReportStatus } from "@flaha/shared-types";

import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";
import { useAuth } from "../auth";

const STATUS_COLOR: Record<
	SoilReportStatus,
	"default" | "primary" | "success" | "warning" | "error"
> = {
	[SoilReportStatus.DRAFT]: "default",
	[SoilReportStatus.GENERATING]: "warning",
	[SoilReportStatus.READY]: "success",
	[SoilReportStatus.FAILED]: "error",
	[SoilReportStatus.ARCHIVED]: "default",
};

export function ProjectReportsPage() {
	const { projectId = "" } = useParams<{ projectId: string }>();
	const navigate = useNavigate();
	const { status: sessionStatus } = useAuth();
	const [reports, setReports] = useState<SoilReportDTO[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	usePageHeader({
		title: "Project reports",
		subtitle: "Immutable, versioned soil reports for this project",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Projects", to: "/projects" },
			{ label: "Project", to: `/projects/${projectId}` },
			{ label: "Reports" },
		],
	});

	const load = useCallback(() => {
		if (!projectId) return () => undefined;
		let cancelled = false;
		setError(null);
		setReports(null);
		getApiClient()
			.listProjectReports(projectId)
			.then((res) => {
				if (!cancelled) setReports(res.reports);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : String(err));
				}
			});
		return () => {
			cancelled = true;
		};
	}, [projectId]);

	useEffect(() => {
		if (sessionStatus !== "authenticated" || !projectId) return;
		return load();
	}, [load, projectId, sessionStatus]);

	if (error) {
		return (
			<Alert
				severity="error"
				action={
					<Button color="inherit" size="small" onClick={load}>
						Retry
					</Button>
				}
			>
				Failed to load reports: {error}
			</Alert>
		);
	}
	if (reports === null) {
		return <Typography color="text.secondary">Loading reports…</Typography>;
	}

	if (reports.length === 0) {
		return (
			<Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
				<Typography color="text.secondary" sx={{ mb: 2 }}>
					No reports generated yet. Open a soil test in this project
					and use the &quot;Generate report&quot; action.
				</Typography>
			</Paper>
		);
	}

	return (
		<Box>
			<Stack spacing={1}>
				{reports.map((r) => (
					<Card key={r.id} variant="outlined">
						<CardActionArea
							onClick={() =>
								navigate(`/projects/${projectId}/reports/${r.id}`)
							}
						>
							<CardContent>
								<Stack
									direction="row"
									alignItems="center"
									spacing={1}
									sx={{ mb: 0.5 }}
								>
									<Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
										{r.title ?? "Untitled report"}
										{r.reportNumber ? ` · ${r.reportNumber}` : ""}
									</Typography>
									<Chip
										size="small"
										color={STATUS_COLOR[r.status] ?? "default"}
										label={r.status}
									/>
									<Chip
										size="small"
										variant="outlined"
										label={`v${r.latestVersionNumber}`}
									/>
								</Stack>
								<Typography variant="body2" color="text.secondary">
									Generated:{" "}
									{r.generatedAt
										? new Date(r.generatedAt).toLocaleString()
										: "—"}
									{" · "}Test {r.soilTestId.slice(0, 8)}…
								</Typography>
							</CardContent>
						</CardActionArea>
					</Card>
				))}
			</Stack>
		</Box>
	);
}
