/**
 * FlahaSOIL v2 — Dashboard.
 *
 * Welcome message + four navigation cards. No live data in Phase 5.
 */
import {
	Box,
	Card,
	CardActionArea,
	CardContent,
	Grid,
	Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import IosShareIcon from "@mui/icons-material/IosShare";
import HistoryIcon from "@mui/icons-material/History";
import ScienceIcon from "@mui/icons-material/Science";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface DashCard {
	title: string;
	description: string;
	to: string;
	icon: ReactNode;
}

const CARDS: DashCard[] = [
	{
		title: "New Soil Test",
		description: "Start a guided soil-test wizard.",
		to: "/soil-tests/new",
		icon: <ScienceIcon fontSize="large" color="primary" />,
	},
	{
		title: "Recent Tests",
		description: "Recent tests will appear here in a later phase.",
		to: "/",
		icon: <HistoryIcon fontSize="large" color="primary" />,
	},
	{
		title: "Reports",
		description: "Generated PDF / CSV reports.",
		to: "/reports",
		icon: <AssessmentIcon fontSize="large" color="primary" />,
	},
	{
		title: "FlahaCalc Export",
		description: "Export soil parameters to FlahaCalc.",
		to: "/flahacalc-export",
		icon: <IosShareIcon fontSize="large" color="primary" />,
	},
];

export function DashboardPage() {
	const navigate = useNavigate();

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				Welcome to FlahaSOIL v2
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 4 }}>
				Contract-driven preview build. All data on this screen is mocked.
			</Typography>

			<Grid container spacing={3}>
				{CARDS.map((card) => (
					<Grid item xs={12} sm={6} md={3} key={card.title}>
						<Card variant="outlined" sx={{ height: "100%" }}>
							<CardActionArea
								onClick={() => navigate(card.to)}
								sx={{ height: "100%" }}
							>
								<CardContent>
									<Box sx={{ mb: 1 }}>{card.icon}</Box>
									<Typography variant="h6">{card.title}</Typography>
									<Typography variant="body2" color="text.secondary">
										{card.description}
									</Typography>
								</CardContent>
							</CardActionArea>
						</Card>
					</Grid>
				))}
			</Grid>
		</Box>
	);
}
