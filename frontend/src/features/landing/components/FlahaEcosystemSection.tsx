/**
 * FlahaSOIL v2 — Flaha ecosystem section (Phase 8C-A).
 *
 * Visual acknowledgement of FlahaSOIL's siblings — FlahaCalc and
 * FlahaFAST — positioning each as a focused intelligence layer that
 * connects through shared agronomic data. Purely presentational; the
 * cards do not link out yet because the sibling products are tracked
 * by separate roadmaps.
 */
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import AgricultureIcon from "@mui/icons-material/Agriculture";
import GrassIcon from "@mui/icons-material/Grass";
import WaterDropIcon from "@mui/icons-material/WaterDrop";
import type { ReactNode } from "react";

import { flahaSoilColors } from "../../../theme/flahaSoilTheme";

interface EcosystemEntry {
	name: string;
	tagline: string;
	intelligence: string;
	accent: string;
	icon: ReactNode;
	current?: boolean;
}

const ENTRIES: EcosystemEntry[] = [
	{
		name: "FlahaSOIL",
		tagline: "Earth intelligence",
		intelligence: "Soil physics, chemistry, interpretation, and agronomic reporting.",
		accent: flahaSoilColors.deepSoilBrown,
		icon: <GrassIcon fontSize="large" />,
		current: true,
	},
	{
		name: "FlahaCalc",
		tagline: "Climate intelligence",
		intelligence: "ET₀, irrigation scheduling, and climate-driven crop water demand.",
		accent: "#1E6091",
		icon: <WaterDropIcon fontSize="large" />,
	},
	{
		name: "FlahaFAST",
		tagline: "Nutrient intelligence",
		intelligence: "Fertigation planning, nutrient balance, and yield-oriented dosing.",
		accent: "#7A5A00",
		icon: <AgricultureIcon fontSize="large" />,
	},
];

export function FlahaEcosystemSection() {
	return (
		<Box>
			<Stack spacing={1} sx={{ mb: 3, textAlign: "center" }}>
				<Typography variant="overline" color="primary" sx={{ letterSpacing: "0.1em" }}>
					The Flaha Ecosystem
				</Typography>
				<Typography variant="h4">One platform family, three layers of intelligence</Typography>
				<Typography color="text.secondary" sx={{ maxWidth: 720, mx: "auto" }}>
					FlahaSOIL operates inside the Flaha agronomic platform. Earth, climate, and
					nutrient intelligence interconnect to power precision agronomy decisions.
				</Typography>
			</Stack>

			<Box
				sx={{
					display: "grid",
					gap: 2,
					gridTemplateColumns: {
						xs: "1fr",
						md: "repeat(3, 1fr)",
					},
				}}
			>
				{ENTRIES.map((entry) => (
					<Card
						key={entry.name}
						sx={{
							height: "100%",
							borderTop: `4px solid ${entry.accent}`,
							opacity: entry.current ? 1 : 0.88,
						}}
					>
						<CardContent>
							<Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1 }}>
								<Box sx={{ color: entry.accent, display: "flex" }}>{entry.icon}</Box>
								<Box>
									<Typography variant="h6" sx={{ lineHeight: 1.1 }}>
										{entry.name}
									</Typography>
									<Typography variant="caption" sx={{ color: entry.accent, fontWeight: 600 }}>
										{entry.tagline}
									</Typography>
								</Box>
							</Stack>
							<Typography variant="body2" color="text.secondary">
								{entry.intelligence}
							</Typography>
							{!entry.current && (
								<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
									Connected through shared agronomic data.
								</Typography>
							)}
						</CardContent>
					</Card>
				))}
			</Box>
		</Box>
	);
}
