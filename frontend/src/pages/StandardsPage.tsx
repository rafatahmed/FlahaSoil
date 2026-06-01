/**
 * FlahaSOIL v2 — standards reference placeholder (Phase 8C-A).
 *
 * The platform is anchored to published soil-science standards
 * (Saxton & Rawls 2006, USDA texture triangle, FAO salinity classes).
 * This page is the planned reference surface so agronomists can look
 * up the standards FlahaSOIL applies. Content is intentionally a
 * descriptive index — the linked deep-dive pages are not built yet.
 */
import {
	Box,
	Card,
	CardContent,
	Chip,
	Stack,
	Typography,
} from "@mui/material";
import OpacityIcon from "@mui/icons-material/Opacity";
import ScienceIcon from "@mui/icons-material/Science";
import StraightenIcon from "@mui/icons-material/Straighten";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import type { ReactNode } from "react";

import { usePageHeader } from "../layouts/PageHeaderContext";

interface Standard {
	title: string;
	source: string;
	description: string;
	icon: ReactNode;
}

const STANDARDS: Standard[] = [
	{
		title: "Soil Hydraulic Properties",
		source: "Saxton & Rawls (2006)",
		description:
			"Pedotransfer functions used to estimate field capacity, wilting point, " +
			"and plant-available water from texture and organic matter.",
		icon: <OpacityIcon />,
	},
	{
		title: "Texture Classification",
		source: "USDA Soil Texture Triangle",
		description:
			"Twelve classes (Sand … Clay) derived from sand/silt/clay percentages, " +
			"used throughout the interpretation layer.",
		icon: <StraightenIcon />,
	},
	{
		title: "Salinity Classes",
		source: "FAO Irrigation & Drainage Paper 29",
		description:
			"EC and ESP thresholds for non-saline, slightly saline, moderately " +
			"saline, strongly saline, and sodic soils.",
		icon: <WaterDropIcon />,
	},
	{
		title: "Cation Exchange & Base Saturation",
		source: "Soil Science Society of America",
		description:
			"CEC, base saturation, and SAR conventions applied in the chemistry " +
			"engine and surfaced on the interpretation card.",
		icon: <ScienceIcon />,
	},
];

export function StandardsPage() {
	usePageHeader({
		title: "Standards Reference",
		subtitle: "Methods and thresholds FlahaSOIL applies",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Standards" },
		],
	});

	return (
		<Box>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				FlahaSOIL only applies published, peer-reviewed soil-science
				standards. Detailed reference pages — including formulas, ranges,
				and citations — will be linked from each card in a future release.
			</Typography>
			<Box
				sx={{
					display: "grid",
					gap: 2,
					gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
				}}
			>
				{STANDARDS.map((s) => (
					<Card key={s.title} sx={{ opacity: 0.95 }}>
						<CardContent>
							<Stack
								direction="row"
								spacing={1.5}
								alignItems="center"
								sx={{ mb: 1 }}
							>
								<Box sx={{ color: "primary.main", display: "flex" }}>
									{s.icon}
								</Box>
								<Typography variant="subtitle1">{s.title}</Typography>
								<Chip
									label="Reference in preparation"
									size="small"
									variant="outlined"
									sx={{ ml: "auto" }}
								/>
							</Stack>
							<Typography variant="caption" color="text.secondary">
								{s.source}
							</Typography>
							<Typography variant="body2" sx={{ mt: 1 }}>
								{s.description}
							</Typography>
						</CardContent>
					</Card>
				))}
			</Box>
		</Box>
	);
}
