/**
 * FlahaSOIL v2 — minimal layout for /login and /register (Phase 9A-G).
 *
 * Renders a centered card on the brand background so the auth surface
 * doesn't carry the full chrome (sidebar, top-bar context, etc). Pages
 * provide the form via `<Outlet />`.
 */

import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink, Outlet } from "react-router-dom";

import { FlahaLogo } from "./components/FlahaLogo";
import { flahaSoilColors } from "../theme/flahaSoilTheme";

export function AuthLayout() {
	return (
		<Box
			sx={{
				minHeight: "100vh",
				backgroundColor: flahaSoilColors.deepSoilBrown,
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				py: 4,
			}}
		>
			<Container maxWidth="xs">
				<Stack spacing={3} alignItems="center">
					<RouterLink
						to="/"
						aria-label="FlahaSOIL home"
						style={{ color: "inherit", textDecoration: "none" }}
					>
						<FlahaLogo size={36} variant="full" />
					</RouterLink>
					<Paper
						elevation={6}
						sx={{
							p: { xs: 3, sm: 4 },
							width: "100%",
							borderRadius: 2,
						}}
					>
						<Outlet />
					</Paper>
					<Typography variant="caption" sx={{ color: "rgba(255,255,255,0.7)" }}>
						© FlahaSOIL · Phase 9A
					</Typography>
				</Stack>
			</Container>
		</Box>
	);
}
