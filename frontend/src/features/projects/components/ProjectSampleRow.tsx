/**
 * FlahaSOIL v2 — collapsible sample row used by `ProjectDetailPage`.
 *
 * Lazy-loads the sample's tests through `getSoilSample` the first time
 * the row is expanded, then renders one entry per test with links to
 * the test detail and report pages.
 */
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Button,
	Chip,
	List,
	ListItem,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import type {
	GetSoilSampleResponse,
	SoilSampleDTO,
} from "@flaha/shared-types";

import { getApiClient } from "../../../services/apiClientProvider";

interface ProjectSampleRowProps {
	sample: SoilSampleDTO;
	projectId: string;
}

function depthLabel(s: SoilSampleDTO): string {
	if (s.depthFromCm === null && s.depthToCm === null) return "Depth unknown";
	const from = s.depthFromCm ?? 0;
	const to = s.depthToCm ?? from;
	return `${from}–${to} cm`;
}

export function ProjectSampleRow({ sample, projectId }: ProjectSampleRowProps) {
	const [expanded, setExpanded] = useState(false);
	const [data, setData] = useState<GetSoilSampleResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleChange = (_: unknown, isOpen: boolean) => {
		setExpanded(isOpen);
		if (isOpen && data === null && !loading) {
			setLoading(true);
			setError(null);
			getApiClient()
				.getSoilSample(sample.id)
				.then((res) => setData(res))
				.catch((err: unknown) =>
					setError(err instanceof Error ? err.message : String(err))
				)
				.finally(() => setLoading(false));
		}
	};

	return (
		<Accordion
			expanded={expanded}
			onChange={handleChange}
			variant="outlined"
			disableGutters
		>
			<AccordionSummary expandIcon={<ExpandMoreIcon />}>
				<Stack
					direction="row"
					spacing={2}
					alignItems="center"
					sx={{ width: "100%" }}
				>
					<Typography sx={{ flexGrow: 1 }}>
						{sample.locationName ?? "Unnamed sample"}
					</Typography>
					<Chip label={depthLabel(sample)} size="small" />
					<Typography variant="caption" color="text.secondary">
						{sample.sampleDate
							? new Date(sample.sampleDate).toLocaleDateString()
							: "Date unknown"}
					</Typography>
				</Stack>
			</AccordionSummary>
			<AccordionDetails>
				{loading && <Typography>Loading tests…</Typography>}
				{error && <Alert severity="error">{error}</Alert>}
				{data && data.tests.length === 0 && (
					<Stack spacing={1} alignItems="flex-start">
						<Typography color="text.secondary">
							No soil tests captured for this sample yet.
						</Typography>
						<Button
							size="small"
							variant="outlined"
							component={RouterLink}
							to={`/soil-tests/new?projectId=${projectId}`}
						>
							Add a soil test
						</Button>
					</Stack>
				)}
				{data && data.tests.length > 0 && (
					<List dense disablePadding>
						{data.tests.map((t) => (
							<ListItem
								key={t.id}
								divider
								secondaryAction={
									<Stack direction="row" spacing={1}>
										<Button
											size="small"
											startIcon={<VisibilityIcon />}
											component={RouterLink}
											to={`/soil-tests/${t.id}`}
										>
											Open
										</Button>
										<Button
											size="small"
											startIcon={<AssessmentIcon />}
											component={RouterLink}
											to={`/soil-tests/${t.id}/report`}
										>
											Report
										</Button>
									</Stack>
								}
							>
								<ListItemText
									primary={`${t.testLevel} · ${t.labName ?? "Lab unknown"}`}
									secondary={`Created ${new Date(t.createdAt).toLocaleString()}`}
								/>
							</ListItem>
						))}
					</List>
				)}
			</AccordionDetails>
		</Accordion>
	);
}
