/**
 * FlahaSOIL v2 — Reports page.
 *
 * Placeholder list of reports. Phase 5 shows mocked rows; Phase 6
 * will replace this with a paginated query against the real backend.
 */
import {
	Box,
	List,
	ListItem,
	ListItemText,
	Paper,
	Typography,
} from "@mui/material";

interface MockReportRow {
	id: string;
	soilTestId: string;
	reportType: string;
	status: string;
}

const MOCK_REPORTS: MockReportRow[] = [
	{
		id: "rpt_mock_001",
		soilTestId: "test_mock_001",
		reportType: "FULL_PDF",
		status: "GENERATED",
	},
];

export function ReportsPage() {
	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				Reports
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				Mocked report list. Generation, download, and pagination land in
				later phases.
			</Typography>

			<Paper variant="outlined">
				<List>
					{MOCK_REPORTS.map((r) => (
						<ListItem key={r.id} divider>
							<ListItemText
								primary={`${r.reportType} — ${r.id}`}
								secondary={`Soil test ${r.soilTestId} · ${r.status}`}
							/>
						</ListItem>
					))}
				</List>
			</Paper>
		</Box>
	);
}
