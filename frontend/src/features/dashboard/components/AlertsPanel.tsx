/**
 * FlahaSOIL v2 — dashboard alerts panel (Phase 8C-A).
 *
 * Surfaces operational alerts the platform can compute from data the
 * dashboard already has loaded. Today that is limited to archived
 * projects and active projects with no samples, since the v2 API does
 * not yet expose a cross-project warnings index. The panel is
 * intentionally honest: when nothing material is in flight it shows a
 * clean empty state.
 */
import {
	Alert,
	Card,
	CardContent,
	CardHeader,
	Divider,
	Stack,
	Typography,
} from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import { ProjectStatus, type ProjectSummaryDTO } from "@flaha/shared-types";

interface AlertsPanelProps {
	projects: ProjectSummaryDTO[] | null;
}

interface DashboardAlert {
	severity: "info" | "warning" | "error";
	title: string;
	detail: string;
}

function computeAlerts(projects: ProjectSummaryDTO[] | null): DashboardAlert[] {
	if (!projects) return [];
	const alerts: DashboardAlert[] = [];
	const archived = projects.filter((p) => p.status === ProjectStatus.ARCHIVED);
	const emptyActive = projects.filter(
		(p) => p.status === ProjectStatus.ACTIVE && p.sampleCount === 0
	);
	if (archived.length > 0) {
		alerts.push({
			severity: "info",
			title: `${archived.length} archived project${archived.length === 1 ? "" : "s"}`,
			detail: "Archived projects remain accessible for audit reference.",
		});
	}
	if (emptyActive.length > 0) {
		alerts.push({
			severity: "info",
			title: `${emptyActive.length} active project${emptyActive.length === 1 ? "" : "s"} have no samples yet`,
			detail: "Start a soil test from a project page to capture the first sample.",
		});
	}
	return alerts;
}

export function AlertsPanel({ projects }: AlertsPanelProps) {
	const alerts = computeAlerts(projects);
	return (
		<Card>
			<CardHeader
				title="Alerts"
				titleTypographyProps={{ variant: "h6" }}
				subheader="Issues that may need agronomic attention"
				subheaderTypographyProps={{ variant: "caption" }}
			/>
			<Divider />
			<CardContent>
				{projects === null ? (
					<Typography variant="body2" color="text.secondary">
						Loading…
					</Typography>
				) : alerts.length === 0 ? (
					<Stack direction="row" spacing={1.5} alignItems="center">
						<CheckCircleOutlineIcon color="success" />
						<Typography variant="body2" color="text.secondary">
							No active alerts. Critical salinity, chemistry-skipped tests, and
							pending reports will appear here as soil tests are processed.
						</Typography>
					</Stack>
				) : (
					<Stack spacing={1.5}>
						{alerts.map((a, idx) => (
							<Alert key={idx} severity={a.severity} variant="outlined">
								<Typography variant="subtitle2">{a.title}</Typography>
								<Typography variant="caption" color="text.secondary">
									{a.detail}
								</Typography>
							</Alert>
						))}
					</Stack>
				)}
			</CardContent>
		</Card>
	);
}
