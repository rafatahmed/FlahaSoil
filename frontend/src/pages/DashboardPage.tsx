/**
 * FlahaSOIL v2 — Dashboard (Phase 8A).
 *
 * Operational landing page. Loads the user's projects from the active
 * API client and surfaces Recent Projects, Quick Actions, and a
 * System Status indicator. Recent Soil Tests / Reports are scoped per
 * project (no global list endpoints exist in v2), so the dashboard
 * deep-links into project detail for those views.
 */
import {
	Alert,
	Box,
	Button,
	Card,
	CardActionArea,
	CardContent,
	Chip,
	Divider,
	Grid,
	Paper,
	Stack,
	Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FolderIcon from "@mui/icons-material/Folder";
import IosShareIcon from "@mui/icons-material/IosShare";
import ScienceIcon from "@mui/icons-material/Science";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { ProjectSummaryDTO } from "@flaha/shared-types";

import { SystemStatusCard } from "../features/dashboard/components/SystemStatusCard";
import { getApiClient, getApiClientMode } from "../services/apiClientProvider";
import { useSession } from "../session";

interface QuickAction {
	title: string;
	description: string;
	to: string;
	icon: ReactNode;
}

const QUICK_ACTIONS: QuickAction[] = [
	{
		title: "New project",
		description: "Create a project to organise soil samples and tests.",
		to: "/projects",
		icon: <FolderIcon color="primary" />,
	},
	{
		title: "New soil test",
		description: "Run the guided wizard against an existing project.",
		to: "/soil-tests/new",
		icon: <ScienceIcon color="primary" />,
	},
	{
		title: "Reports",
		description: "Browse generated soil-test reports.",
		to: "/reports",
		icon: <AssessmentIcon color="primary" />,
	},
	{
		title: "FlahaCalc export",
		description: "Export hydraulic parameters to FlahaCalc.",
		to: "/flahacalc-export",
		icon: <IosShareIcon color="primary" />,
	},
];

const MAX_RECENT_PROJECTS = 5;

export function DashboardPage() {
	const navigate = useNavigate();
	const { status: sessionStatus, user } = useSession();
	const apiMode = getApiClientMode();
	const [projects, setProjects] = useState<ProjectSummaryDTO[] | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Wait for the session to resolve before issuing project queries so
	// the `x-dev-user-id` header is populated for the very first request.
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

	const recent = (projects ?? []).slice(0, MAX_RECENT_PROJECTS);

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				{user
					? `Welcome back, ${user.displayName.split(" ")[0]}`
					: "FlahaSOIL workspace"}
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 4 }}>
				Manage agronomic projects, run soil tests, and generate reports.
			</Typography>

			<Typography variant="h6" sx={{ mb: 1 }}>
				Quick actions
			</Typography>
			<Divider sx={{ mb: 2 }} />
			<Grid container spacing={2} sx={{ mb: 4 }}>
				{QUICK_ACTIONS.map((card) => (
					<Grid item xs={12} sm={6} md={3} key={card.title}>
						<Card variant="outlined" sx={{ height: "100%" }}>
							<CardActionArea
								onClick={() => navigate(card.to)}
								sx={{ height: "100%" }}
							>
								<CardContent>
									<Box sx={{ mb: 1 }}>{card.icon}</Box>
									<Typography variant="h6">{card.title}</Typography>
									<Typography variant="body2" color="text.secondary">
										{card.description}
									</Typography>
								</CardContent>
							</CardActionArea>
						</Card>
					</Grid>
				))}
			</Grid>

			<Grid container spacing={3}>
				<Grid item xs={12} md={8}>
					<RecentProjectsSection
						projects={projects}
						recent={recent}
						error={error}
						onNew={() => navigate("/projects")}
						onOpen={(id) => navigate(`/projects/${id}`)}
					/>
				</Grid>
				<Grid item xs={12} md={4}>
					<SystemStatusCard apiMode={apiMode} />
				</Grid>
			</Grid>
		</Box>
	);
}

interface RecentProjectsSectionProps {
	projects: ProjectSummaryDTO[] | null;
	recent: ProjectSummaryDTO[];
	error: string | null;
	onNew: () => void;
	onOpen: (projectId: string) => void;
}

function RecentProjectsSection(props: RecentProjectsSectionProps) {
	const { projects, recent, error, onNew, onOpen } = props;
	return (
		<Box>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				sx={{ mb: 1 }}
			>
				<Typography variant="h6">Recent projects</Typography>
				<Button size="small" startIcon={<AddIcon />} onClick={onNew}>
					Manage projects
				</Button>
			</Stack>
			<Divider sx={{ mb: 2 }} />
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
					<Typography color="text.secondary" sx={{ mb: 1 }}>
						No projects yet — create one to get started.
					</Typography>
					<Button variant="contained" startIcon={<AddIcon />} onClick={onNew}>
						Create project
					</Button>
				</Paper>
			)}
			{recent.length > 0 && (
				<Stack spacing={1}>
					{recent.map((p) => (
						<Card key={p.id} variant="outlined">
							<CardActionArea onClick={() => onOpen(p.id)}>
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
									<Typography variant="caption" color="text.secondary">
										Updated {new Date(p.updatedAt).toLocaleString()}
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

