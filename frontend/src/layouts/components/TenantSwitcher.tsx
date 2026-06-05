/**
 * FlahaSOIL v2 — TenantSwitcher (Phase 9A-H).
 *
 * Top-bar control that surfaces every ACTIVE membership the current
 * user holds and lets them rotate the active organization. Reads the
 * memberships + active org from `useAuth()` (already hydrated by the
 * auth bootstrap) and dispatches `actions.switchOrganization` on
 * select. The action calls `POST /auth/switch-organization` under the
 * hood, mints a new access token, and re-runs `applySession` so every
 * tenant-aware page re-renders in one tick.
 *
 * Renders nothing when the user is unauthenticated or has fewer than
 * two memberships — single-tenant users get an immutable display, no
 * picker chrome.
 */
import { useState } from "react";
import {
	Box,
	Button,
	Chip,
	CircularProgress,
	ListItemIcon,
	ListItemText,
	Menu,
	MenuItem,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import CheckIcon from "@mui/icons-material/Check";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import { useAuth } from "../../auth";

function roleLabel(role: string): string {
	// Title-case the SCREAMING_SNAKE_CASE role labels: "LAB_TECHNICIAN" →
	// "Lab Technician". Keeps the picker readable without reaching for a
	// translation table.
	return role
		.toLowerCase()
		.split("_")
		.map((p) => (p.length > 0 ? p[0]!.toUpperCase() + p.slice(1) : p))
		.join(" ");
}

export function TenantSwitcher() {
	const { status, activeOrganization, memberships, actions } = useAuth();
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (status !== "authenticated") return null;
	if (memberships.length < 2) {
		// Single-tenant users see a read-only chip — the org chrome lives
		// on the user chip itself, so we render nothing here to avoid
		// duplicating the label.
		return null;
	}

	const open = Boolean(anchorEl);
	const activeId = activeOrganization?.id ?? null;

	function close() {
		setAnchorEl(null);
	}

	async function handleSelect(organizationId: string) {
		if (organizationId === activeId) {
			close();
			return;
		}
		setPending(true);
		setError(null);
		try {
			await actions.switchOrganization(organizationId);
			close();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to switch.");
		} finally {
			setPending(false);
		}
	}

	return (
		<>
			<Tooltip title="Switch organization">
				<Button
					onClick={(e) => setAnchorEl(e.currentTarget)}
					color="inherit"
					size="small"
					variant="outlined"
					aria-haspopup="menu"
					aria-expanded={open ? "true" : undefined}
					aria-label="Switch organization"
					startIcon={<BusinessIcon fontSize="small" />}
					endIcon={
						pending ? (
							<CircularProgress size={14} sx={{ color: "inherit" }} />
						) : (
							<ExpandMoreIcon fontSize="small" />
						)
					}
					disabled={pending}
					sx={{
						textTransform: "none",
						borderColor: "rgba(255,255,255,0.5)",
						color: "inherit",
						maxWidth: { xs: 140, md: 220 },
						"& .MuiButton-startIcon, & .MuiButton-endIcon": {
							marginLeft: 0.5,
							marginRight: 0.5,
						},
					}}
				>
					<Typography
						variant="body2"
						noWrap
						sx={{ fontWeight: 600, color: "inherit" }}
					>
						{activeOrganization?.name ?? "Select organization"}
					</Typography>
				</Button>
			</Tooltip>
			<Menu anchorEl={anchorEl} open={open} onClose={close} keepMounted>
				{error && (
					<Box sx={{ px: 2, py: 1, color: "error.main", maxWidth: 320 }}>
						<Typography variant="caption">{error}</Typography>
					</Box>
				)}
				{memberships.map((m) => {
					const isActive = m.organizationId === activeId;
					const name = m.organization?.name ?? m.organizationId;
					return (
						<MenuItem
							key={m.id}
							onClick={() => void handleSelect(m.organizationId)}
							selected={isActive}
							disabled={pending}
						>
							<ListItemIcon>
								{isActive ? <CheckIcon fontSize="small" /> : <Box sx={{ width: 20 }} />}
							</ListItemIcon>
							<ListItemText
								primary={
									<Stack direction="row" spacing={1} alignItems="center">
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{name}
										</Typography>
										<Chip size="small" label={roleLabel(m.role)} />
									</Stack>
								}
							/>
						</MenuItem>
					);
				})}
			</Menu>
		</>
	);
}
