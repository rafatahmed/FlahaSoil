/**
 * FlahaSOIL v2 — registration page (Phase 9A-G).
 *
 * Creates a new User + personal Organization (+ OWNER membership) via
 * `POST /api/v2/auth/register` and lands the user on the dashboard. The
 * backend issues both an access token (in JSON) and a refresh cookie,
 * so the user is immediately signed in.
 */

import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import { useState, type FormEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useAuth } from "../auth";
import {
	PASSWORD_MIN_LENGTH,
	validatePassword,
} from "../auth/passwordPolicy";

interface FieldErrors {
	email?: string;
	password?: string;
	displayName?: string;
}

export function RegisterPage() {
	const { actions } = useAuth();
	const navigate = useNavigate();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [displayName, setDisplayName] = useState("");
	const [organizationName, setOrganizationName] = useState("");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	function validate(): boolean {
		const next: FieldErrors = {};
		const trimmedEmail = email.trim();
		if (!trimmedEmail) next.email = "Email is required.";
		else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmedEmail)) {
			next.email = "Enter a valid email address.";
		}
		if (!displayName.trim()) next.displayName = "Display name is required.";
		const pwErr = validatePassword(password);
		if (pwErr) next.password = pwErr.message;
		setErrors(next);
		return Object.keys(next).length === 0;
	}

	async function onSubmit(e: FormEvent<HTMLFormElement>) {
		e.preventDefault();
		setSubmitError(null);
		if (!validate()) return;
		setSubmitting(true);
		try {
			const orgName = organizationName.trim();
			await actions.register({
				email: email.trim(),
				password,
				displayName: displayName.trim(),
				...(orgName.length > 0 ? { organizationName: orgName } : {}),
			});
			navigate("/dashboard", { replace: true });
		} catch (err) {
			const msg = err instanceof Error ? err.message : "Registration failed.";
			setSubmitError(msg);
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Box>
			<Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
				Create your account
			</Typography>
			<Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
				A personal workspace is created for you.
			</Typography>
			<form noValidate onSubmit={onSubmit}>
				<Stack spacing={2}>
					{submitError && <Alert severity="error">{submitError}</Alert>}
					<TextField
						label="Display name"
						autoComplete="name"
						required
						fullWidth
						value={displayName}
						onChange={(e) => setDisplayName(e.target.value)}
						error={Boolean(errors.displayName)}
						helperText={errors.displayName}
					/>
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
						autoComplete="new-password"
						required
						fullWidth
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						error={Boolean(errors.password)}
						helperText={
							errors.password ??
							`At least ${PASSWORD_MIN_LENGTH} characters.`
						}
					/>
					<TextField
						label="Organization name (optional)"
						autoComplete="organization"
						fullWidth
						value={organizationName}
						onChange={(e) => setOrganizationName(e.target.value)}
						helperText="Defaults to your display name's workspace."
					/>
					<Button
						type="submit"
						variant="contained"
						size="large"
						disabled={submitting}
					>
						{submitting ? "Creating account…" : "Create account"}
					</Button>
					<Typography variant="body2" sx={{ textAlign: "center", color: "text.secondary" }}>
						Already have an account?{" "}
						<RouterLink to="/login" style={{ color: "inherit" }}>
							Sign in
						</RouterLink>
					</Typography>
				</Stack>
			</form>
		</Box>
	);
}
