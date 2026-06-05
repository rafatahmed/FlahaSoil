/**
 * FlahaSOIL v2 — dashboard quick actions (Phase 8C-A).
 *
 * Card grid for the operational entry points: Create Project, New Soil
 * Test, Browse Reports, Open FlahaCalc Export. Renders as a 2/4-column
 * grid depending on viewport.
 */
import {
	Box,
	Card,
	CardActionArea,
	CardContent,
	Stack,
	Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import AssessmentIcon from "@mui/icons-material/Assessment";
import FolderIcon from "@mui/icons-material/Folder";
import IosShareIcon from "@mui/icons-material/IosShare";
import ScienceIcon from "@mui/icons-material/Science";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface QuickAction {
	title: string;
	description: string;
	to: string;
	icon: ReactNode;
}

const ACTIONS: QuickAction[] = [
	{
		title: "Create Project",
		description: "Organise field samples under an agronomic project.",
		to: "/projects",
		icon: <FolderIcon />,
	},
	{
		title: "New Soil Test",
		description: "Run the guided wizard against an existing project.",
		to: "/soil-tests/new",
		icon: <ScienceIcon />,
	},
	{
		title: "Generate Report",
		description: "Browse and assemble agronomic decision reports.",
		to: "/reports",
		icon: <AssessmentIcon />,
	},
	{
		title: "FlahaCalc Export",
		description: "Hand off hydraulic parameters for irrigation planning.",
		to: "/flahacalc-export",
		icon: <IosShareIcon />,
	},
];

export function QuickActionsGrid() {
	const navigate = useNavigate();
	return (
		<Box
			sx={{
				display: "grid",
				gap: 2,
				gridTemplateColumns: {
					xs: "1fr",
					sm: "repeat(2, 1fr)",
					lg: "repeat(4, 1fr)",
				},
			}}
		>
			{ACTIONS.map((action) => (
				<Card key={action.title} sx={{ height: "100%" }}>
					<CardActionArea
						onClick={() => navigate(action.to)}
						sx={{ height: "100%", p: 0 }}
					>
						<CardContent>
							<Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
								<Box sx={{ color: "primary.main", display: "flex" }}>
									{action.icon}
								</Box>
								<Typography variant="subtitle1">{action.title}</Typography>
								<AddIcon
									fontSize="small"
									sx={{ ml: "auto", color: "text.secondary" }}
								/>
							</Stack>
							<Typography variant="body2" color="text.secondary">
								{action.description}
							</Typography>
						</CardContent>
					</CardActionArea>
				</Card>
			))}
		</Box>
	);
}
