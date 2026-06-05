/**
 * FlahaSOIL v2 — Projects list (Phase 8A).
 *
 * Top-level entry point for the project-centric workflow. Loads the
 * authenticated user's projects via `listProjects` and renders one
 * card per project with sample count and quick navigation. A
 * `+ New project` action opens a dialog that issues `createProject`
 * and pushes the user into the freshly-created project's detail page.
 */
import {
	Alert,
	Box,
	Button,
	Card,
	CardActionArea,
	CardContent,
	Chip,
	Grid,
	Stack,
	Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProjectSummaryDTO } from "@flaha/shared-types";

import { NewProjectDialog } from "../features/projects/components/NewProjectDialog";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";
import { useAuth } from "../auth";

export function ProjectsListPage() {
	const navigate = useNavigate();
	const { status: sessionStatus } = useAuth();
	const [projects, setProjects] = useState<ProjectSummaryDTO[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	usePageHeader({
		title: "My projects",
		subtitle: "Agronomic containers for soil samples and tests",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Projects" },
		],
	});

	const load = useCallback(() => {
		setError(null);
		setProjects(null);
		getApiClient()
			.listProjects({})
			.then((res) => setProjects(res.projects))
			.catch((err: unknown) =>
				setError(err instanceof Error ? err.message : String(err))
			);
	}, []);

	useEffect(() => {
		if (sessionStatus !== "authenticated") return;
		load();
	}, [load, sessionStatus]);

	const handleCreated = (projectId: string) => {
		setDialogOpen(false);
		navigate(`/projects/${projectId}`);
	};

	return (
		<Box>
			<Stack
				direction="row"
				justifyContent="flex-end"
				alignItems="center"
				sx={{ mb: 3 }}
			>
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={() => setDialogOpen(true)}
				>
					New project
				</Button>
			</Stack>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
					Failed to load projects: {error}
				</Alert>
			)}

			{projects === null && !error && (
				<Typography color="text.secondary">Loading projects…</Typography>
			)}

			{projects !== null && projects.length === 0 && (
				<Card variant="outlined" sx={{ p: 4, textAlign: "center" }}>
					<FolderOpenIcon sx={{ fontSize: 48, color: "text.secondary" }} />
					<Typography variant="h6" sx={{ mt: 1 }}>
						No projects yet
					</Typography>
					<Typography color="text.secondary" sx={{ mb: 2 }}>
						Create your first project to start adding soil samples and
						running soil tests.
					</Typography>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={() => setDialogOpen(true)}
					>
						Create project
					</Button>
				</Card>
			)}

			{projects !== null && projects.length > 0 && (
				<Grid container spacing={2}>
					{projects.map((p) => (
						<Grid item xs={12} sm={6} md={4} key={p.id}>
							<Card variant="outlined" sx={{ height: "100%" }}>
								<CardActionArea
									onClick={() => navigate(`/projects/${p.id}`)}
									sx={{ height: "100%" }}
								>
									<CardContent>
										<Stack direction="row" spacing={1} alignItems="center">
											<Typography variant="h6" sx={{ flexGrow: 1 }}>
												{p.name}
											</Typography>
											<Chip label={p.status} size="small" />
										</Stack>
										{p.code && (
											<Typography variant="caption" color="text.secondary">
												{p.code}
											</Typography>
										)}
										<Typography
											variant="body2"
											color="text.secondary"
											sx={{ mt: 1 }}
										>
											{p.sampleCount} sample
											{p.sampleCount === 1 ? "" : "s"}
										</Typography>
									</CardContent>
								</CardActionArea>
							</Card>
						</Grid>
					))}
				</Grid>
			)}

			<NewProjectDialog
				open={dialogOpen}
				onClose={() => setDialogOpen(false)}
				onCreated={handleCreated}
			/>
		</Box>
	);
}
