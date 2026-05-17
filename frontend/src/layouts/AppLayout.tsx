/**
 * FlahaSOIL v2 — application chrome.
 *
 * Permanent left drawer on desktop, AppBar with the page title, and
 * an `<Outlet />` for the active route. Navigation mirrors the
 * Phase 8A workflow hierarchy: Project → Soil Test → Report → Export.
 */
import {
	AppBar,
	Box,
	Drawer,
	List,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Toolbar,
	Typography,
} from "@mui/material";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import FolderIcon from "@mui/icons-material/Folder";
import IosShareIcon from "@mui/icons-material/IosShare";
import ScienceIcon from "@mui/icons-material/Science";
import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";

const DRAWER_WIDTH = 240;

interface NavItem {
	label: string;
	to: string;
	icon: ReactNode;
}

const NAV_ITEMS: NavItem[] = [
	{ label: "Dashboard", to: "/", icon: <DashboardIcon /> },
	{ label: "Projects", to: "/projects", icon: <FolderIcon /> },
	{ label: "Soil Tests", to: "/soil-tests/new", icon: <ScienceIcon /> },
	{ label: "Reports", to: "/reports", icon: <AssessmentIcon /> },
	{
		label: "FlahaCalc Export",
		to: "/flahacalc-export",
		icon: <IosShareIcon />,
	},
];

export function AppLayout() {
	return (
		<Box sx={{ display: "flex", minHeight: "100vh" }}>
			<AppBar
				position="fixed"
				sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
			>
				<Toolbar>
					<Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
						FlahaSOIL v2
					</Typography>
				</Toolbar>
			</AppBar>

			<Drawer
				variant="permanent"
				sx={{
					width: DRAWER_WIDTH,
					flexShrink: 0,
					[`& .MuiDrawer-paper`]: {
						width: DRAWER_WIDTH,
						boxSizing: "border-box",
					},
				}}
			>
				<Toolbar />
				<Box sx={{ overflow: "auto" }}>
					<List>
						{NAV_ITEMS.map((item) => (
							<ListItemButton
								key={item.to}
								component={NavLink}
								to={item.to}
								end={item.to === "/"}
								sx={{
									"&.active": {
										backgroundColor: "action.selected",
									},
								}}
							>
								<ListItemIcon>{item.icon}</ListItemIcon>
								<ListItemText primary={item.label} />
							</ListItemButton>
						))}
					</List>
				</Box>
			</Drawer>

			<Box
				component="main"
				sx={{
					flexGrow: 1,
					p: 3,
					width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
				}}
			>
				<Toolbar />
				<Outlet />
			</Box>
		</Box>
	);
}
