/**
 * FlahaSOIL v2 — dashboard metric card (Phase 8C-A).
 *
 * Compact KPI tile used by the Soil Health Overview row. The accent
 * stripe across the top of each card carries an agronomic colour cue
 * (cream, green, sand) without relying on icon colour alone.
 */
import { Box, Card, CardContent, Skeleton, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

import { flahaSoilColors } from "../../../theme/flahaSoilTheme";

interface MetricCardProps {
	label: string;
	value: number | string | null;
	hint?: string;
	icon?: ReactNode;
	accent?: "soil" | "green" | "sand" | "warning";
}

const ACCENT_COLOR: Record<NonNullable<MetricCardProps["accent"]>, string> = {
	soil: flahaSoilColors.deepSoilBrown,
	green: flahaSoilColors.organicGreen,
	sand: flahaSoilColors.clayEarth,
	warning: flahaSoilColors.mineralWarning,
};

export function MetricCard({
	label,
	value,
	hint,
	icon,
	accent = "green",
}: MetricCardProps) {
	const accentColor = ACCENT_COLOR[accent];
	return (
		<Card sx={{ height: "100%", borderTop: `3px solid ${accentColor}` }}>
			<CardContent>
				<Stack direction="row" spacing={1.5} alignItems="flex-start">
					{icon && (
						<Box sx={{ color: accentColor, display: "flex", mt: 0.25 }}>{icon}</Box>
					)}
					<Box sx={{ minWidth: 0, flex: 1 }}>
						<Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
							{label}
						</Typography>
						{value === null ? (
							<Skeleton variant="text" width={64} sx={{ fontSize: 28 }} />
						) : (
							<Typography variant="h4" sx={{ lineHeight: 1.1, mt: 0.25 }}>
								{value}
							</Typography>
						)}
						{hint && (
							<Typography variant="caption" color="text.secondary">
								{hint}
							</Typography>
						)}
					</Box>
				</Stack>
			</CardContent>
		</Card>
	);
}
