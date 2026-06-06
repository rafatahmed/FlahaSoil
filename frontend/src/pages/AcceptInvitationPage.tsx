/**
 * FlahaSOIL v2 — Accept-invitation landing page (Phase 9B-D).
 *
 * Rendered at `/invite/:token`. Reads the SHA-256 invitation token from
 * the URL and POSTs it to `/invitations/accept`. The backend matches
 * the hash, validates expiry/state, and creates the ACTIVE membership.
 *
 * Auth model:
 *   - Unauthenticated visitors are bounced to /login with a
 *     ?next=/invite/<token> param so they come back here after sign-in.
 *   - Authenticated visitors with an email mismatch get the server's
 *     403 surfaced verbatim.
 *   - On success, the user's memberships are refreshed via `refresh()`
 *     so the tenant switcher immediately lists the new org.
 */
import { Alert, Box, Button, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

import { useAuth } from "../auth";
import { getApiClient } from "../services/apiClientProvider";

type State =
	| { kind: "loading" }
	| { kind: "ready" }
	| { kind: "submitting" }
	| { kind: "success"; organizationName: string }
	| { kind: "error"; message: string };

export function AcceptInvitationPage() {
	const { token } = useParams<{ token: string }>();
	const navigate = useNavigate();
	const { status, actions } = useAuth();
	const [state, setState] = useState<State>({ kind: "loading" });

	// Wait for auth hydration, then either redirect to /login (preserving
	// the deep-link) or unlock the Accept button.
	useEffect(() => {
		if (status === "loading") return;
		if (!token) {
			setState({ kind: "error", message: "Missing invitation token." });
			return;
		}
		if (status !== "authenticated") {
			const next = encodeURIComponent(`/invite/${token}`);
			navigate(`/login?next=${next}`, { replace: true });
			return;
		}
		setState({ kind: "ready" });
	}, [status, token, navigate]);

	const handleAccept = async () => {
		if (!token) return;
		setState({ kind: "submitting" });
		try {
			const res = await getApiClient().acceptInvitation({ token });
			// Re-hydrate the auth session so memberships include the new org.
			await actions.refresh();
			setState({ kind: "success", organizationName: res.organization.name });
		} catch (err) {
			setState({
				kind: "error",
				message: err instanceof Error ? err.message : String(err),
			});
		}
	};

	return (
		<Box sx={{ maxWidth: 560, mx: "auto", mt: 4 }}>
			<Card>
				<CardContent>
					<Stack spacing={2}>
						<Typography variant="h5">Join organization</Typography>
						{state.kind === "loading" && <CircularProgress size={24} />}
						{state.kind === "ready" && (
							<>
								<Typography color="text.secondary">
									You were invited to join an organization on FlahaSOIL.
									Confirm below to accept.
								</Typography>
								<Button
									variant="contained"
									onClick={handleAccept}
									sx={{ alignSelf: "flex-start" }}
								>
									Accept invitation
								</Button>
							</>
						)}
						{state.kind === "submitting" && (
							<Stack direction="row" spacing={1} alignItems="center">
								<CircularProgress size={18} />
								<Typography>Accepting…</Typography>
							</Stack>
						)}
						{state.kind === "success" && (
							<>
								<Alert severity="success">
									You’re now a member of <strong>{state.organizationName}</strong>.
								</Alert>
								<Button
									component={RouterLink}
									to="/dashboard"
									variant="contained"
									sx={{ alignSelf: "flex-start" }}
								>
									Continue to dashboard
								</Button>
							</>
						)}
						{state.kind === "error" && (
							<>
								<Alert severity="error">{state.message}</Alert>
								<Button
									component={RouterLink}
									to="/dashboard"
									sx={{ alignSelf: "flex-start" }}
								>
									Back to dashboard
								</Button>
							</>
						)}
					</Stack>
				</CardContent>
			</Card>
		</Box>
	);
}
