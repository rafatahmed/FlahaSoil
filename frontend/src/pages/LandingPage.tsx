/**
 * FlahaSOIL v2 — landing page (Phase 8C-A).
 *
 * Marketing-style entry surface that frames FlahaSOIL as a scientific
 * agronomic platform rather than a developer dashboard. Layered as:
 *   1. Hero with primary "Start Analysis" + secondary "Open Dashboard".
 *   2. Platform Overview — five intelligence layers FlahaSOIL covers.
 *   3. Workflow — Sample → Analysis → Interpretation → Report → Export.
 *   4. Flaha Ecosystem — FlahaSOIL, FlahaCalc, FlahaFAST.
 *   5. Footer with version + runtime mode + platform status.
 *
 * The landing page intentionally does not load API data; it is the
 * unauthenticated face of the platform and must render even when the
 * backend is unreachable.
 */
import {
	Box,
	Button,
	Card,
	CardContent,
	Container,
	Divider,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssessmentIcon from "@mui/icons-material/Assessment";
import IosShareIcon from "@mui/icons-material/IosShare";
import OpacityIcon from "@mui/icons-material/Opacity";
import PsychologyIcon from "@mui/icons-material/Psychology";
import ScienceIcon from "@mui/icons-material/Science";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { FlahaEcosystemSection } from "../features/landing/components/FlahaEcosystemSection";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClientMode } from "../services/apiClientProvider";
import { flahaSoilColors } from "../theme/flahaSoilTheme";

interface PlatformPillar {
	title: string;
	description: string;
	icon: ReactNode;
}

const PILLARS: PlatformPillar[] = [
	{
		title: "Soil Physics",
		description:
			"Water-holding capacity, field capacity, wilting point, and hydraulic conductivity from Saxton & Rawls 2006.",
		icon: <OpacityIcon fontSize="large" />,
	},
	{
		title: "Soil Chemistry",
		description:
			"CEC, base saturation, cation balance, salinity, and sodium hazard from lab cation and nutrient panels.",
		icon: <ScienceIcon fontSize="large" />,
	},
	{
		title: "Scientific Interpretation",
		description:
			"Categorical, agronomy-grade interpretation of pH, EC, drainage class, and overall soil rating.",
		icon: <PsychologyIcon fontSize="large" />,
	},
	{
		title: "Decision Reports",
		description:
			"Structured agronomic reports with warnings, calculation trace, and a portable export.",
		icon: <AssessmentIcon fontSize="large" />,
	},
	{
		title: "FlahaCalc Export",
		description:
			"Hand off hydraulic parameters to FlahaCalc for irrigation scheduling and ET₀-driven planning.",
		icon: <IosShareIcon fontSize="large" />,
	},
];

const WORKFLOW = ["Sample", "Analysis", "Interpretation", "Report", "Export"];

export function LandingPage() {
	const navigate = useNavigate();
	const theme = useTheme();
	const apiMode = getApiClientMode();
	usePageHeader({ title: "FlahaSOIL — Earth Intelligence Platform" });

	return (
		<Box>
			{/* Hero */}
			<Box
				sx={{
					backgroundImage: `linear-gradient(135deg, ${flahaSoilColors.deepSoilBrown} 0%, ${flahaSoilColors.clayEarth} 100%)`,
					color: "#FFFFFF",
					borderRadius: 3,
					px: { xs: 3, md: 8 },
					py: { xs: 6, md: 10 },
					mb: 6,
				}}
			>
				<Container maxWidth="md" disableGutters>
					<Typography
						variant="overline"
						sx={{ color: flahaSoilColors.sandBeige, letterSpacing: "0.15em" }}
					>
						Scientific Agronomic Platform
					</Typography>
					<Typography variant="h2" sx={{ mt: 1, mb: 2, lineHeight: 1.1 }}>
						Understand Your Soil.
						<br />
						Power Better Decisions.
					</Typography>
					<Typography variant="h6" sx={{ fontWeight: 400, color: "rgba(255,255,255,0.85)", mb: 4 }}>
						Scientific soil intelligence for precision agronomy, irrigation planning,
						and professional land analysis.
					</Typography>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
						<Button
							variant="contained"
							color="primary"
							size="large"
							endIcon={<ArrowForwardIcon />}
							onClick={() => navigate("/soil-tests/new")}
						>
							Start Analysis
						</Button>
						<Button
							variant="outlined"
							size="large"
							onClick={() => navigate("/dashboard")}
							sx={{
								color: "#FFFFFF",
								borderColor: "rgba(255,255,255,0.6)",
								"&:hover": {
									borderColor: "#FFFFFF",
									backgroundColor: "rgba(255,255,255,0.08)",
								},
							}}
						>
							Open Dashboard
						</Button>
					</Stack>
				</Container>
			</Box>

			{/* Platform Overview */}
			<Box sx={{ mb: 8 }}>
				<Stack spacing={1} sx={{ mb: 4, textAlign: "center" }}>
					<Typography variant="overline" color="primary" sx={{ letterSpacing: "0.1em" }}>
						Platform Overview
					</Typography>
					<Typography variant="h4">Five intelligence layers, one workflow</Typography>
				</Stack>
				<Box
					sx={{
						display: "grid",
						gap: 2,
						gridTemplateColumns: {
							xs: "1fr",
							sm: "repeat(2, 1fr)",
							md: "repeat(3, 1fr)",
							lg: "repeat(5, 1fr)",
						},
					}}
				>
					{PILLARS.map((p) => (
						<Card key={p.title} sx={{ height: "100%", backgroundColor: flahaSoilColors.analyticalCream }}>
							<CardContent>
								<Box sx={{ color: flahaSoilColors.organicGreen, mb: 1 }}>{p.icon}</Box>
								<Typography variant="h6" sx={{ mb: 0.5 }}>
									{p.title}
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{p.description}
								</Typography>
							</CardContent>
						</Card>
					))}
				</Box>
			</Box>

			{/* Workflow */}
			<Box sx={{ mb: 8 }}>
				<Stack spacing={1} sx={{ mb: 4, textAlign: "center" }}>
					<Typography variant="overline" color="primary" sx={{ letterSpacing: "0.1em" }}>
						Workflow
					</Typography>
					<Typography variant="h4">From sample to decision in five steps</Typography>
				</Stack>
				<Stack
					direction={{ xs: "column", md: "row" }}
					spacing={{ xs: 2, md: 1 }}
					alignItems="center"
					justifyContent="center"
				>
					{WORKFLOW.map((step, idx) => (
						<Stack
							key={step}
							direction={{ xs: "column", md: "row" }}
							alignItems="center"
							spacing={1}
						>
							<Box
								sx={{
									px: 3,
									py: 1.5,
									borderRadius: 2,
									backgroundColor: "background.paper",
									border: `1px solid ${theme.palette.divider}`,
									fontWeight: 600,
									minWidth: 140,
									textAlign: "center",
								}}
							>
								<Typography variant="caption" color="text.secondary">
									Step {idx + 1}
								</Typography>
								<Typography variant="subtitle1">{step}</Typography>
							</Box>
							{idx < WORKFLOW.length - 1 && (
								<ArrowForwardIcon
									sx={{
										color: "text.secondary",
										transform: { xs: "rotate(90deg)", md: "none" },
									}}
								/>
							)}
						</Stack>
					))}
				</Stack>
			</Box>

			{/* Flaha Ecosystem */}
			<Box sx={{ mb: 8 }}>
				<FlahaEcosystemSection />
			</Box>

			{/* Footer */}
			<Divider sx={{ mb: 3 }} />
			<Stack
				direction={{ xs: "column", md: "row" }}
				justifyContent="space-between"
				alignItems={{ xs: "flex-start", md: "center" }}
				spacing={1}
				sx={{ pb: 2, color: "text.secondary" }}
			>
				<Typography variant="caption">
					FlahaSOIL · v2 Platform Foundation
				</Typography>
				<Typography variant="caption">
					Runtime mode: {apiMode === "real" ? "Live backend" : "Demonstration mode"}
				</Typography>
				<Typography variant="caption">
					Platform status: Operational
				</Typography>
			</Stack>
		</Box>
	);
}
