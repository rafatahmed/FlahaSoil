/**
 * FlahaSOIL v2 — login page (Phase 9A-G).
 *
 * Posts credentials to `/api/v2/auth/login` via `useAuth().actions.login`.
 * On success the HttpOnly refresh cookie is set by the backend, the
 * access token is stored in memory by `AuthProvider`, and we navigate
 * to the `?next=` URL (default `/dashboard`).
 *
 * Server errors arrive as `ApiClientError`; the standard error envelope
 * has `code` and `message` fields — we surface `message` directly.
 */

import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../auth";

interface FieldErrors {
	email?: string;
	password?: string;
}

function readNext(search: string): string {
	const params = new URLSearchParams(search);
	const next = params.get("next");
	if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
	return next;
}

export function LoginPage() {
	const { actions } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	function validate(): boolean {
		const next: FieldErrors = {};
		if (!email.trim()) next.email = "Email is required.";
		if (!password) next.password = "Password is required.";
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSubmitError(null);
		if (!validate()) return;
		setSubmitting(true);
		try {
			await actions.login({ email: email.trim(), password });
			navigate(readNext(location.search), { replace: true });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Login failed.";
			setSubmitError(msg);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Box>
			<Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
				Sign in
			</Typography>
			<Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
				Access your FlahaSOIL workspace.
			</Typography>
			<form noValidate onSubmit={onSubmit}>
				<Stack spacing={2}>
					{submitError && <Alert severity="error">{submitError}</Alert>}
					<TextField
						label="Email"
						type="email"
						autoComplete="email"
						required
						fullWidth
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						error={Boolean(errors.email)}
						helperText={errors.email}
					/>
					<TextField
						label="Password"
						type="password"
						autoComplete="current-password"
						required
						fullWidth
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						error={Boolean(errors.password)}
						helperText={errors.password}
					/>
					<Button
						type="submit"
						variant="contained"
						size="large"
						disabled={submitting}
					>
						{submitting ? "Signing in…" : "Sign in"}
					</Button>
					<Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
						No account yet?{" "}
						<RouterLink to="/register" style={{ color: "inherit" }}>
							Create one
						</RouterLink>
					</Typography>
				</Stack>
			</form>
		</Box>
	);
}
