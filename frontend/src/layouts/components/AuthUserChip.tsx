/**
 * FlahaSOIL v2 — top-bar auth chip (Phase 9A-G).
 *
 * Replaces the dev-only `SessionUserChip`. Behaviour:
 *   - loading        → small spinner placeholder so chrome height
 *                      doesn't jump while the silent refresh runs.
 *   - unauthenticated→ Sign in / Sign up buttons.
 *   - error          → "Offline" chip with the error in a tooltip; the
 *                      chrome stays mounted because the user may still
 *                      want to retry or visit a public page.
 *   - authenticated  → Avatar + name + role chip; click opens a menu
 *                      with Account / Sign out.
 */

import {
	Avatar,
	Box,
	Button,
	Chip,
	CircularProgress,
	IconButton,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import { useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

import { useAuth } from "../../auth";

function initialsOf(name: string): string {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (parts.length === 0) return "?";
	const head = parts[0]?.[0] ?? "";
	const tail = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
	return (head + tail).toUpperCase();
}

export function AuthUserChip() {
	const { status, user, activeOrganization, error } = useAuth();
	const navigate = useNavigate();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

	if (status === "loading") {
		return (
			<Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 80 }}>
				<CircularProgress size={20} sx={{ color: "inherit" }} />
			</Stack>
		);
	}

	if (status === "unauthenticated") {
		return (
			<Stack direction="row" spacing={1} alignItems="center">
				<Button
					component={RouterLink}
					to="/login"
					color="inherit"
					size="small"
					sx={{ textTransform: "none" }}
				>
					Sign in
				</Button>
				<Button
					component={RouterLink}
					to="/register"
					variant="outlined"
					color="inherit"
					size="small"
					sx={{ textTransform: "none", borderColor: "rgba(255,255,255,0.6)" }}
				>
					Sign up
				</Button>
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
					sx={{ color: "inherit", borderColor: "rgba(255,255,255,0.5)" }}
				/>
			</Tooltip>
		);
	}

	const open = Boolean(anchorEl);

	function close() {
		setAnchorEl(null);
	}

	return (
		<>
			<Stack direction="row" spacing={1.25} alignItems="center">
				<Box sx={{ textAlign: "right", lineHeight: 1.1, display: { xs: "none", md: "block" } }}>
					<Typography variant="body2" sx={{ color: "inherit", fontWeight: 600 }}>
						{user.displayName}
					</Typography>
					{activeOrganization && (
						<Typography variant="caption" sx={{ color: "inherit", opacity: 0.85 }}>
							{activeOrganization.name}
						</Typography>
					)}
				</Box>
				<IconButton
					onClick={(e) => setAnchorEl(e.currentTarget)}
					size="small"
					aria-label="Account menu"
					aria-haspopup="menu"
					aria-expanded={open ? "true" : undefined}
				>
					<Avatar sx={{ width: 32, height: 32, fontSize: 14, bgcolor: "primary.main" }}>
						{initialsOf(user.displayName)}
					</Avatar>
				</IconButton>
			</Stack>
			<Menu anchorEl={anchorEl} open={open} onClose={close} keepMounted>
				<MenuItem
					onClick={() => {
						close();
						navigate("/account");
					}}
				>
					<ListItemIcon>
						<PersonIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Account" secondary={user.email} />
				</MenuItem>
				<MenuItem
					onClick={() => {
						close();
						navigate("/logout");
					}}
				>
					<ListItemIcon>
						<LogoutIcon fontSize="small" />
					</ListItemIcon>
					<ListItemText primary="Sign out" />
				</MenuItem>
			</Menu>
		</>
	);
}
