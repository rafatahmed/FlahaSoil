/**
 * FlahaSOIL v2 — settings placeholder (Phase 8C-A).
 *
 * Reserved surface for organisation, unit-system, and notification
 * preferences. Today the platform has no configurable settings, so the
 * page exposes the planned categories as disabled cards. This keeps
 * the sidebar entry honest rather than leading to a 404.
 */
import {
	Box,
	Card,
	CardContent,
	Chip,
	Stack,
	Typography,
} from "@mui/material";
import LanguageIcon from "@mui/icons-material/Language";
import NotificationsIcon from "@mui/icons-material/Notifications";
import PaletteIcon from "@mui/icons-material/Palette";
import StraightenIcon from "@mui/icons-material/Straighten";
import type { ReactNode } from "react";

import { usePageHeader } from "../layouts/PageHeaderContext";

interface SettingsCategory {
	title: string;
	description: string;
	icon: ReactNode;
}

const CATEGORIES: SettingsCategory[] = [
	{
		title: "Units & Locale",
		description: "Metric/imperial units, language, date and number formats.",
		icon: <LanguageIcon />,
	},
	{
		title: "Measurement Conventions",
		description: "Default sample depths, lab method preferences, EC vs TDS reporting.",
		icon: <StraightenIcon />,
	},
	{
		title: "Notifications",
		description: "Email digests for completed reports, alert thresholds.",
		icon: <NotificationsIcon />,
	},
	{
		title: "Appearance",
		description: "Light / dark theme, density, print-friendly report styling.",
		icon: <PaletteIcon />,
	},
];

export function SettingsPage() {
	usePageHeader({
		title: "Settings",
		subtitle: "Platform preferences (coming in a future release)",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Settings" },
		],
	});

	return (
		<Box>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				FlahaSOIL v2 runs with sensible defaults for soil-science workflows.
				The categories below outline the configuration surface planned for
				an upcoming release; no setting on this page is editable yet.
			</Typography>
			<Box
				sx={{
					display: "grid",
					gap: 2,
					gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
				}}
			>
				{CATEGORIES.map((c) => (
					<Card key={c.title} sx={{ opacity: 0.85 }}>
						<CardContent>
							<Stack
								direction="row"
								spacing={1.5}
								alignItems="center"
								sx={{ mb: 1 }}
							>
								<Box sx={{ color: "text.secondary", display: "flex" }}>
									{c.icon}
								</Box>
								<Typography variant="subtitle1">{c.title}</Typography>
								<Chip
									label="Planned"
									size="small"
									variant="outlined"
									sx={{ ml: "auto" }}
								/>
							</Stack>
							<Typography variant="body2" color="text.secondary">
								{c.description}
							</Typography>
						</CardContent>
					</Card>
				))}
			</Box>
		</Box>
	);
}
