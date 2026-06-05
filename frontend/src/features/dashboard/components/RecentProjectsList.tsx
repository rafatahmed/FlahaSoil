/**
 * FlahaSOIL v2 — recent projects list (Phase 8C-A).
 *
 * Extracted from DashboardPage so the dashboard composition stays
 * inside a 150-line budget. Renders the most recent projects as
 * clickable rows with sample-count and status chips. Empty state
 * surfaces a "Create project" button.
 */
import {
	Alert,
	Button,
	Card,
	CardActionArea,
	CardContent,
	CardHeader,
	Chip,
	Divider,
	Paper,
	Stack,
	Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import type { ProjectSummaryDTO } from "@flaha/shared-types";

interface RecentProjectsListProps {
	projects: ProjectSummaryDTO[] | null;
	error: string | null;
	limit: number;
	onOpen: (projectId: string) => void;
	onManage: () => void;
}

export function RecentProjectsList(props: RecentProjectsListProps) {
	const { projects, error, limit, onOpen, onManage } = props;
	const recent = (projects ?? []).slice(0, limit);
	return (
		<Card>
			<CardHeader
				title="Recent projects"
				titleTypographyProps={{ variant: "h6" }}
				action={
					<Button size="small" startIcon={<AddIcon />} onClick={onManage}>
						Manage projects
					</Button>
				}
			/>
			<Divider />
			<CardContent>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }}>
						Failed to load projects: {error}
					</Alert>
				)}
				{projects === null && !error && (
					<Typography variant="body2" color="text.secondary">
						Loading projects…
					</Typography>
				)}
				{projects !== null && projects.length === 0 && (
					<Paper variant="outlined" sx={{ p: 3, textAlign: "center" }}>
						<Typography color="text.secondary" sx={{ mb: 1 }}>
							No projects yet — create one to start running soil tests.
						</Typography>
						<Button variant="contained" startIcon={<AddIcon />} onClick={onManage}>
							Create project
						</Button>
					</Paper>
				)}
				{recent.length > 0 && (
					<Stack spacing={1}>
						{recent.map((p) => (
							<Card key={p.id} variant="outlined">
								<CardActionArea onClick={() => onOpen(p.id)}>
									<CardContent sx={{ py: 1.5 }}>
										<Stack direction="row" alignItems="center" spacing={1}>
											<Typography variant="subtitle1" sx={{ flexGrow: 1, minWidth: 0 }}>
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
												color={p.status === "ACTIVE" ? "success" : "default"}
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
			</CardContent>
		</Card>
	);
}
