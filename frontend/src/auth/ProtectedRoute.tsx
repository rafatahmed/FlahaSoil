/**
 * FlahaSOIL v2 — ProtectedRoute (Phase 9A-G).
 *
 * Wraps any subtree (typically via React Router's nested `<Route>`) and
 * gates access on the auth state machine:
 *
 *   loading        → render a centered spinner; never redirect, because
 *                    the silent refresh on first mount is still in
 *                    flight and the user may already be logged in.
 *   authenticated  → render the protected outlet.
 *   unauthenticated→ redirect to /login, preserving the requested URL
 *                    in `?next=...` so post-login we can land the user
 *                    back where they tried to go.
 *   error          → render the outlet anyway with a banner-friendly
 *                    state; pages observe `useAuth().error`. We
 *                    intentionally DO NOT redirect on transient network
 *                    errors so users aren't bounced to /login when the
 *                    backend hiccups.
 */

import { Box, CircularProgress } from "@mui/material";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "./useAuth";

export function ProtectedRoute() {
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

	if (status === "unauthenticated") {
		const next = `${location.pathname}${location.search}`;
		const search = new URLSearchParams({ next }).toString();
		return <Navigate to={`/login?${search}`} replace />;
	}

	return <Outlet />;
}
