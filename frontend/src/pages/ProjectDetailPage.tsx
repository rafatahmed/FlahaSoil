/**
 * FlahaSOIL v2 — Project detail (Phase 8A).
 *
 * Shows the project header, a list of its soil samples and, on
 * expansion, the soil tests captured for each sample. Quick actions
 * link to the wizard preselected with `?projectId=<id>` and to a
 * sample-scoped wizard call when the user wants to add another test.
 */
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Divider,
	Paper,
	Stack,
	Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ScienceIcon from "@mui/icons-material/Science";
import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import type { GetProjectResponse } from "@flaha/shared-types";

import { ProjectSampleRow } from "../features/projects/components/ProjectSampleRow";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";
import { useSession } from "../session";

export function ProjectDetailPage() {
	const { projectId = "" } = useParams<{ projectId: string }>();
	const navigate = useNavigate();
	const { status: sessionStatus } = useSession();
	const [data, setData] = useState<GetProjectResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	usePageHeader({
		title: data?.project.name ?? "Project",
		subtitle: data
			? `${data.project.status} · ${data.samples.length} sample${data.samples.length === 1 ? "" : "s"}`
			: "Loading project…",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Projects", to: "/projects" },
			{ label: data?.project.name ?? "…" },
		],
		...(data
			? {
					projectContext: {
						id: data.project.id,
						name: data.project.name,
						...(data.project.code ? { code: data.project.code } : {}),
					},
				}
			: {}),
	});

	const load = useCallback(() => {
		setError(null);
		setData(null);
		getApiClient()
			.getProjectById(projectId)
			.then(setData)
			.catch((err: unknown) =>
				setError(err instanceof Error ? err.message : String(err))
			);
	}, [projectId]);

	useEffect(() => {
		// Defer until the dev-session is resolved; otherwise the very
		// first request would race the `x-dev-user-id` header write.
		if (sessionStatus !== "ready") return;
		load();
	}, [load, sessionStatus]);

	if (error) {
		return (
			<Alert severity="error">
				Failed to load project {projectId}: {error}
			</Alert>
		);
	}
	if (!data) {
		return <Typography>Loading project…</Typography>;
	}

	const { project, samples } = data;

	return (
		<Box>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				justifyContent="space-between"
				alignItems={{ xs: "flex-start", sm: "flex-start" }}
				spacing={2}
				sx={{ mb: 3 }}
			>
				<Box>
					<Typography variant="body2" color="text.secondary">
						{project.locationName ?? "No location set"}
					</Typography>
					{project.description && (
						<Typography sx={{ mt: 1 }}>{project.description}</Typography>
					)}
				</Box>
				<Stack direction="row" spacing={1}>
					<Button
						component={RouterLink}
						to="/projects"
						variant="outlined"
					>
						All projects
					</Button>
					<Button
						variant="contained"
						startIcon={<ScienceIcon />}
						onClick={() =>
							navigate(`/soil-tests/new?projectId=${project.id}`)
						}
					>
						New soil test
					</Button>
				</Stack>
			</Stack>

			<Card variant="outlined" sx={{ mb: 3 }}>
				<CardContent>
					<Stack direction="row" spacing={4}>
						<SummaryStat label="Samples" value={samples.length} />
						<SummaryStat
							label="Created"
							value={new Date(project.createdAt).toLocaleDateString()}
						/>
						<SummaryStat
							label="Last updated"
							value={new Date(project.updatedAt).toLocaleDateString()}
						/>
					</Stack>
				</CardContent>
			</Card>

			<Typography variant="h6" sx={{ mb: 1 }}>
				Soil samples
			</Typography>
			<Divider sx={{ mb: 2 }} />

			{samples.length === 0 ? (
				<Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
					<Typography color="text.secondary" sx={{ mb: 2 }}>
						No samples yet. Soil samples are created when you start a soil
						test from this project.
					</Typography>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={() =>
							navigate(`/soil-tests/new?projectId=${project.id}`)
						}
					>
						Start first soil test
					</Button>
				</Paper>
			) : (
				<Stack spacing={1}>
					{samples.map((s) => (
						<ProjectSampleRow key={s.id} sample={s} projectId={project.id} />
					))}
				</Stack>
			)}
		</Box>
	);
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
	return (
		<Box>
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="h6">{value}</Typography>
		</Box>
	);
}
