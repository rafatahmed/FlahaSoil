/**
 * FlahaSOIL v2 — application chrome (Phase 8C-A).
 *
 * Platform shell composed of a fixed top app bar, a section-grouped
 * sidebar, an optional page context bar with breadcrumbs/subtitle, and
 * the routed content area. Responsive behaviour:
 *   - Desktop (md+): persistent left sidebar (240px).
 *   - Tablet/mobile (<md): temporary drawer that the menu button opens.
 *
 * Page metadata (title, subtitle, breadcrumbs, project context) flows
 * through `PageHeaderContext`; pages call `usePageHeader(...)` to set
 * theirs. The shell remains route-agnostic.
 */
import { Box, Drawer, Toolbar, useMediaQuery, useTheme } from "@mui/material";
import { useState } from "react";
import { Outlet } from "react-router-dom";

import { FlahaLogo } from "./components/FlahaLogo";
import { PageContextBar } from "./components/PageContextBar";
import { SidebarNav } from "./components/SidebarNav";
import { TopAppBar } from "./components/TopAppBar";
import { PageHeaderProvider } from "./PageHeaderContext";
import { flahaSoilColors } from "../theme/flahaSoilTheme";

const DRAWER_WIDTH = 248;

export function AppLayout() {
	const theme = useTheme();
	const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
	const [mobileOpen, setMobileOpen] = useState(false);

	const drawerContent = (
		<>
			<Toolbar
				sx={{
					backgroundColor: flahaSoilColors.deepSoilBrown,
					minHeight: 64,
					px: 2,
				}}
			>
				<FlahaLogo size={26} variant="full" />
			</Toolbar>
			<SidebarNav onNavigate={() => setMobileOpen(false)} />
		</>
	);

	return (
		<PageHeaderProvider>
			<Box sx={{ display: "flex", minHeight: "100vh" }}>
				<TopAppBar
					drawerWidth={DRAWER_WIDTH}
					onMenuClick={() => setMobileOpen((v) => !v)}
				/>

				<Box
					component="nav"
					sx={{
						width: { md: DRAWER_WIDTH },
						flexShrink: { md: 0 },
					}}
					aria-label="primary navigation"
				>
					{isDesktop ? (
						<Drawer
							variant="permanent"
							open
							sx={{
								"& .MuiDrawer-paper": {
									width: DRAWER_WIDTH,
									boxSizing: "border-box",
								},
							}}
						>
							{drawerContent}
						</Drawer>
					) : (
						<Drawer
							variant="temporary"
							open={mobileOpen}
							onClose={() => setMobileOpen(false)}
							ModalProps={{ keepMounted: true }}
							sx={{
								"& .MuiDrawer-paper": {
									width: DRAWER_WIDTH,
									boxSizing: "border-box",
								},
							}}
						>
							{drawerContent}
						</Drawer>
					)}
				</Box>

				<Box
					component="main"
					sx={{
						flexGrow: 1,
						width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
						minHeight: "100vh",
						backgroundColor: "background.default",
						display: "flex",
						flexDirection: "column",
					}}
				>
					<Toolbar />
					<PageContextBar />
					<Box sx={{ p: { xs: 2, md: 4 }, flexGrow: 1 }}>
						<Outlet />
					</Box>
				</Box>
			</Box>
		</PageHeaderProvider>
	);
}
