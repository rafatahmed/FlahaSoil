/**
 * FlahaSOIL v2 — logout page (Phase 9A-G).
 *
 * Calls `actions.logout()` exactly once on mount, then navigates the
 * user back to `/`. Rendered as a plain spinner; if logout fails the
 * provider still drops local session state so the user always ends up
 * signed out client-side.
 */

import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../auth";

export function LogoutPage() {
	const { actions, status } = useAuth();
	const firedRef = useRef(false);

	useEffect(() => {
		if (firedRef.current) return;
		firedRef.current = true;
		void actions.logout();
	}, [actions]);

	if (status === "unauthenticated") {
		return <Navigate to="/login" replace />;
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				minHeight: "60vh",
				gap: 2,
			}}
		>
			<CircularProgress aria-label="Signing out" />
			<Typography variant="body2" color="text.secondary">
				Signing out…
			</Typography>
		</Box>
	);
}
