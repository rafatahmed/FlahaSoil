/**
 * FlahaSOIL v2 — ReportSectionHeader (Phase 8D G.1).
 *
 * Branded section title used between the report cover and each
 * ProfessionalReportDTO section. Renders an Organic-Green accent bar
 * with a Deep-Soil-Brown title + optional subtitle. Pure presentational
 * — no business logic.
 */
import { Box, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { flahaSoilColors } from "../../../theme/flahaSoilTheme";

export interface ReportSectionHeaderProps {
	title: string;
	subtitle?: string;
	action?: ReactNode;
}

export function ReportSectionHeader({
	title,
	subtitle,
	action,
}: ReportSectionHeaderProps) {
	return (
		<Stack
			direction="row"
			alignItems="center"
			spacing={1.5}
			sx={{ mb: 1.5, mt: 3 }}
		>
			<Box
				sx={{
					width: 4,
					height: 28,
					borderRadius: 1,
					backgroundColor: flahaSoilColors.organicGreen,
				}}
			/>
			<Box sx={{ flexGrow: 1 }}>
				<Typography
					variant="h6"
					sx={{ color: flahaSoilColors.deepSoilBrown, lineHeight: 1.2 }}
				>
					{title}
				</Typography>
				{subtitle && (
					<Typography variant="caption" color="text.secondary">
						{subtitle}
					</Typography>
				)}
			</Box>
			{action}
		</Stack>
	);
}
