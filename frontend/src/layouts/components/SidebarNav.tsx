/**
 * FlahaSOIL v2 — sidebar navigation (Phase 8C-A).
 *
 * Renders the platform sidebar organised into four sections —
 * Primary, Analysis, Integration, Account — matching the Phase 8C-A
 * spec. Items use NavLink so the active route highlights without
 * imperative state. Placeholder items are dimmed and tagged "Coming
 * soon" rather than hidden so users can see the platform's planned
 * surface.
 */
import {
	Box,
	Chip,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Stack,
	Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import HomeIcon from "@mui/icons-material/Home";
import IosShareIcon from "@mui/icons-material/IosShare";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";
import PersonIcon from "@mui/icons-material/Person";
import ScienceIcon from "@mui/icons-material/Science";
import SettingsIcon from "@mui/icons-material/Settings";
import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";

interface NavItem {
	label: string;
	to: string;
	icon: ReactNode;
	exact?: boolean;
	placeholder?: boolean;
}

interface NavSection {
	id: string;
	label: string;
	items: NavItem[];
}

const SECTIONS: NavSection[] = [
	{
		id: "primary",
		label: "Primary",
		items: [
			{ label: "Home", to: "/", icon: <HomeIcon />, exact: true },
			{ label: "Dashboard", to: "/dashboard", icon: <DashboardIcon /> },
			{ label: "Projects", to: "/projects", icon: <FolderIcon /> },
		],
	},
	{
		id: "analysis",
		label: "Analysis",
		items: [
			{ label: "New Soil Test", to: "/soil-tests/new", icon: <ScienceIcon /> },
			{ label: "Reports", to: "/reports", icon: <AssessmentIcon /> },
			{
				label: "Standards",
				to: "/standards",
				icon: <LibraryBooksIcon />,
				placeholder: true,
			},
		],
	},
	{
		id: "integration",
		label: "Integration",
		items: [
			{
				label: "FlahaCalc Export",
				to: "/flahacalc-export",
				icon: <IosShareIcon />,
			},
		],
	},
	{
		id: "account",
		label: "Account",
		items: [
			{ label: "Profile", to: "/profile", icon: <PersonIcon /> },
			{
				label: "Settings",
				to: "/settings",
				icon: <SettingsIcon />,
				placeholder: true,
			},
		],
	},
];

interface SidebarNavProps {
	onNavigate?: () => void;
}

export function SidebarNav({ onNavigate }: SidebarNavProps) {
	return (
		<Box sx={{ py: 2 }}>
			{SECTIONS.map((section) => (
				<Box key={section.id} sx={{ mb: 1.5 }}>
					<Typography
						variant="overline"
						sx={{
							px: 2,
							color: "text.secondary",
							fontSize: 11,
							letterSpacing: "0.08em",
						}}
					>
						{section.label}
					</Typography>
					<List dense disablePadding>
						{section.items.map((item) => (
							<ListItemButton
								key={item.to}
								component={NavLink}
								to={item.to}
								end={item.exact ?? false}
								onClick={onNavigate}
								sx={{
									mx: 1,
									my: 0.25,
									borderRadius: 1.5,
									color: item.placeholder ? "text.secondary" : "text.primary",
									"&.active": {
										backgroundColor: (t) => t.palette.primary.main,
										color: (t) => t.palette.primary.contrastText,
										"& .MuiListItemIcon-root": {
											color: (t) => t.palette.primary.contrastText,
										},
									},
									"&:hover": {
										backgroundColor: "action.hover",
									},
								}}
							>
								<ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
									{item.icon}
								</ListItemIcon>
								<Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1 }}>
									<ListItemText
										primary={item.label}
										primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }}
									/>
									{item.placeholder && (
										<Chip
											label="Planned"
											size="small"
											variant="outlined"
											sx={{ height: 18, fontSize: 10 }}
										/>
									)}
								</Stack>
							</ListItemButton>
						))}
					</List>
				</Box>
			))}
		</Box>
	);
}
