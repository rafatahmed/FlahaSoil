/**
 * FlahaSOIL v2 — StatusBadge (Phase 8D G.1).
 *
 * Color-coded chip for the five-step OverallSoilRating scale plus the
 * three-step "good/fair/poor" agronomic status used on interpretation
 * categories. Centralised so the same scale is rendered identically on
 * the report viewer, the dashboard tiles, and the printable HTML
 * template.
 */
import { Chip } from "@mui/material";
import type { ChipProps } from "@mui/material";
import type {
	OverallSoilRating,
	SeverityClass,
} from "@flaha/shared-types";

import { flahaSoilColors, flahaSoilStatus } from "../../../theme/flahaSoilTheme";

type AnyStatus = OverallSoilRating | SeverityClass | "good" | "fair" | "poor";

const COLOR_BY_STATUS: Record<string, string> = {
	Excellent: flahaSoilColors.organicGreenDark,
	Good: flahaSoilStatus.good,
	Fair: flahaSoilStatus.fair,
	Poor: flahaSoilStatus.poor,
	Critical: flahaSoilColors.criticalSalinity,
	None: flahaSoilStatus.good,
	Slight: flahaSoilColors.organicGreenLight,
	Moderate: flahaSoilStatus.fair,
	Strong: flahaSoilColors.mineralWarning,
	Severe: flahaSoilStatus.poor,
	good: flahaSoilStatus.good,
	fair: flahaSoilStatus.fair,
	poor: flahaSoilStatus.poor,
};

export interface StatusBadgeProps extends Omit<ChipProps, "color"> {
	status: AnyStatus;
}

export function StatusBadge({ status, sx, ...rest }: StatusBadgeProps) {
	const bg = COLOR_BY_STATUS[status] ?? flahaSoilColors.textSecondary;
	return (
		<Chip
			label={status}
			size="small"
			sx={{
				backgroundColor: bg,
				color: "#FFFFFF",
				fontWeight: 600,
				...sx,
			}}
			{...rest}
		/>
	);
}
