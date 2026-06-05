/**
 * FlahaSOIL v2 — ReportFooter (Phase 8D G.1).
 *
 * Final block of the report: schema/version metadata, snapshot
 * generation timestamp, and Flaha branding. Designed to read as a
 * "signature" strip in both the on-screen viewer and the printable
 * HTML template.
 */
import { Box, Stack, Typography } from "@mui/material";

import { flahaSoilColors } from "../../../theme/flahaSoilTheme";

export interface ReportFooterProps {
	schemaVersion: string;
	versionNumber: number;
	generatedAt: string;
	reportNumber: string;
}

export function ReportFooter({
	schemaVersion,
	versionNumber,
	generatedAt,
	reportNumber,
}: ReportFooterProps) {
	const dt = new Date(generatedAt).toLocaleString();
	return (
		<Box
			sx={{
				mt: 4,
				p: 2,
				borderTop: `2px solid ${flahaSoilColors.organicGreen}`,
				backgroundColor: flahaSoilColors.analyticalCream,
				borderRadius: 1,
			}}
		>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				justifyContent="space-between"
				alignItems={{ xs: "flex-start", sm: "center" }}
				spacing={1}
			>
				<Box>
					<Typography
						variant="overline"
						sx={{
							color: flahaSoilColors.deepSoilBrown,
							letterSpacing: "0.2em",
						}}
					>
						FlahaSOIL · Agronomic intelligence platform
					</Typography>
					<Typography variant="caption" color="text.secondary" display="block">
						Report №&nbsp;{reportNumber} · v{versionNumber} · schema{" "}
						{schemaVersion}
					</Typography>
				</Box>
				<Typography variant="caption" color="text.secondary">
					Generated&nbsp;{dt}
				</Typography>
			</Stack>
		</Box>
	);
}
