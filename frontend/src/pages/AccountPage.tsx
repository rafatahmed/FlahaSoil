/**
 * FlahaSOIL v2 — account page (Phase 9A-G).
 *
 * Read-only identity surface that complements `/profile` (which is the
 * broader workspace page). Shows:
 *   - Signed-in user identity (display name, email).
 *   - Active organization (name, slug, type, status).
 *   - Memberships across every organization the user belongs to with
 *     their role + membership status.
 *   - A sign-out button that navigates to `/logout`.
 *
 * No write actions live here yet — invitations, role changes, and
 * member management are explicitly out of scope for Phase 9A-G.
 */

import {
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Divider,
	Stack,
	Typography,
} from "@mui/material";
import LogoutIcon from "@mui/icons-material/Logout";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../auth";
import { usePageHeader } from "../layouts/PageHeaderContext";

export function AccountPage() {
	const { user, activeOrganization, memberships } = useAuth();
	const navigate = useNavigate();

	usePageHeader({
		title: "Account",
		subtitle: user ? `${user.displayName} · identity & org` : "Account",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Account" },
		],
	});

	if (!user) return null;

	return (
		<Box sx={{ display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
			<Card>
				<CardHeader title="Identity" titleTypographyProps={{ variant: "h6" }} />
				<Divider />
				<CardContent>
					<Stack spacing={1}>
						<Typography variant="body1" sx={{ fontWeight: 600 }}>
							{user.displayName}
						</Typography>
						<Typography variant="body2" color="text.secondary">
							{user.email}
						</Typography>
						<Chip
							label={user.role}
							size="small"
							color="primary"
							variant="outlined"
							sx={{ alignSelf: "flex-start", mt: 1 }}
						/>
					</Stack>
					<Divider sx={{ my: 2 }} />
					<Button
						color="inherit"
						startIcon={<LogoutIcon />}
						onClick={() => navigate("/logout")}
					>
						Sign out
					</Button>
				</CardContent>
			</Card>

			<Card>
				<CardHeader
					title="Active organization"
					titleTypographyProps={{ variant: "h6" }}
				/>
				<Divider />
				<CardContent>
					{activeOrganization ? (
						<Stack spacing={1}>
							<Typography variant="body1" sx={{ fontWeight: 600 }}>
								{activeOrganization.name}
							</Typography>
							<Typography variant="caption" color="text.secondary">
								{activeOrganization.slug}
							</Typography>
							<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
								<Chip label={activeOrganization.type} size="small" />
								<Chip label={activeOrganization.status} size="small" variant="outlined" />
							</Stack>
						</Stack>
					) : (
						<Typography variant="body2" color="text.secondary">
							No active organization. Contact an administrator to be added
							to one.
						</Typography>
					)}
				</CardContent>
			</Card>

			<Card sx={{ gridColumn: { md: "span 2" } }}>
				<CardHeader
					title={`Memberships (${memberships.length})`}
					titleTypographyProps={{ variant: "h6" }}
				/>
				<Divider />
				<CardContent>
					{memberships.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							You are not a member of any organization yet.
						</Typography>
					) : (
						<Stack spacing={1.5}>
							{memberships.map((m) => (
								<Stack
									key={m.id}
									direction="row"
									spacing={2}
									alignItems="center"
								>
									<Typography variant="body2" sx={{ minWidth: 240, fontWeight: 500 }}>
										{m.organization?.name ?? m.organizationId}
									</Typography>
									<Chip label={m.role} size="small" />
									<Chip label={m.status} size="small" variant="outlined" />
								</Stack>
							))}
						</Stack>
					)}
				</CardContent>
			</Card>
		</Box>
	);
}
