/**
 * FlahaSOIL v2 — session user chip (Phase 8B).
 *
 * Compact display of the currently-resolved dev-session user, intended
 * for the `AppBar`. Shows an avatar with the user's initials, the
 * display name, and a small role badge. While the session is still
 * loading it renders a neutral "Loading…" placeholder so the chrome
 * height stays stable.
 *
 * Errors loading `/api/v2/me` are surfaced inline as a tooltip rather
 * than a banner — the bar should never crash the UI when the API is
 * unreachable.
 */
import {
	Avatar,
	Box,
	Chip,
	Skeleton,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import type { UserRole } from "@flaha/shared-types";

import { useSession } from "./useSession";

function initialsOf(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	const head = parts[0]?.[0] ?? "";
	const tail = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
	return (head + tail).toUpperCase();
}

function roleColor(
	role: UserRole | null
): "default" | "primary" | "secondary" | "info" | "warning" {
	switch (role) {
		case "ADMIN":
			return "warning";
		case "AGRONOMIST":
			return "primary";
		case "CLIENT":
			return "info";
		case "VIEWER":
			return "secondary";
		default:
			return "default";
	}
}

export function SessionUserChip() {
	const { status, user, role, error } = useSession();

	if (status === "loading") {
		return (
			<Stack direction="row" spacing={1} alignItems="center">
				<Skeleton variant="circular" width={28} height={28} />
				<Skeleton variant="text" width={96} />
			</Stack>
		);
	}

	if (status === "error" || !user) {
		return (
			<Tooltip
				title={
					error
						? `Session unavailable: ${error.message}`
						: "No session resolved."
				}
			>
				<Chip
					label="Offline"
					size="small"
					color="default"
					variant="outlined"
				/>
			</Tooltip>
		);
	}

	return (
		<Stack direction="row" spacing={1} alignItems="center">
			<Avatar sx={{ width: 28, height: 28, fontSize: 14 }}>
				{initialsOf(user.displayName)}
			</Avatar>
			<Box sx={{ lineHeight: 1.1 }}>
				<Typography variant="body2" sx={{ color: "inherit" }}>
					{user.displayName}
				</Typography>
				<Typography
					variant="caption"
					sx={{ color: "inherit", opacity: 0.85 }}
				>
					{user.email}
				</Typography>
			</Box>
			{role && (
				<Chip
					label={role}
					size="small"
					color={roleColor(role)}
					sx={{ ml: 1 }}
				/>
			)}
		</Stack>
	);
}
