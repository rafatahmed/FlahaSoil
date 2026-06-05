/**
 * FlahaSOIL v2 — PublicOnlyRoute (Phase 9A-G).
 *
 * Wraps `/login` and `/register` so an already-authenticated user
 * cannot land on them; instead we bounce to the dashboard (or the
 * `next` URL they were originally heading for).
 *
 *   loading        → spinner (don't flash the login form during boot)
 *   authenticated  → redirect to `next` or /dashboard
 *   any other state→ render the public outlet
 */

import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./useAuth";

function readNext(search: string): string {
	const params = new URLSearchParams(search);
	const next = params.get("next");
	// Defence in depth: only allow same-origin relative paths so a
	// malicious link can't bounce a freshly-logged-in user to an
	// attacker-controlled host.
	if (!next || !next.startsWith("/") || next.startsWith("//")) {
		return "/dashboard";
	}
	return next;
}

export function PublicOnlyRoute() {
	const { status } = useAuth();
	const location = useLocation();

	if (status === "loading") {
		return (
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					minHeight: "60vh",
				}}
			>
				<CircularProgress aria-label="Loading session" />
			</Box>
		);
	}

	if (status === "authenticated") {
		return <Navigate to={readNext(location.search)} replace />;
	}

	return <Outlet />;
}
