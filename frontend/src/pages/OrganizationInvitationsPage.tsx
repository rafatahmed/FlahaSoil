/**
 * FlahaSOIL v2 — Organization invitations page (Phase 9B-D).
 *
 * Lists pending / accepted / revoked / expired invitations for the
 * active organization and lets ADMIN/OWNER mint or revoke invites.
 * Status is computed server-side (lazy EXPIRED transition on list), so
 * the page just renders what comes back.
 */
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
	InvitationStatus,
	OrganizationRole,
	type OrganizationInvitationDTO,
} from "@flaha/shared-types";
import { useCallback, useEffect, useState } from "react";

import { InviteMemberDialog } from "../features/organizations/components/InviteMemberDialog";
import { OrgAdminTabs } from "../features/organizations/components/OrgAdminTabs";
import { useActiveOrgAdmin } from "../features/organizations/useActiveOrgAdmin";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";

const STATUS_COLOR: Record<
	InvitationStatus,
	"default" | "success" | "warning" | "error"
> = {
	[InvitationStatus.PENDING]: "warning",
	[InvitationStatus.ACCEPTED]: "success",
	[InvitationStatus.REVOKED]: "default",
	[InvitationStatus.EXPIRED]: "error",
};

export function OrganizationInvitationsPage() {
	const { organizationId, isAdmin, isOwner } = useActiveOrgAdmin();
	const [rows, setRows] = useState<OrganizationInvitationDTO[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pendingId, setPendingId] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);

	usePageHeader({
		title: "Invitations",
		subtitle: rows ? `${rows.length} invitation(s)` : "Invitations",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Organization" },
			{ label: "Invitations" },
		],
	});

	const load = useCallback(() => {
		if (!organizationId) return;
		setError(null);
		setRows(null);
		getApiClient()
			.listInvitations(organizationId)
			.then((res) => setRows(res.invitations))
			.catch((err: unknown) =>
				setError(err instanceof Error ? err.message : String(err))
			);
	}, [organizationId]);

	useEffect(() => {
		load();
	}, [load]);

	const handleRevoke = async (invitationId: string) => {
		if (!organizationId) return;
		if (!window.confirm("Revoke this invitation?")) return;
		setPendingId(invitationId);
		setError(null);
		try {
			await getApiClient().revokeInvitation(organizationId, invitationId);
			load();
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setPendingId(null);
		}
	};

	if (!organizationId) {
		return (
			<Alert severity="info">
				No active organization. Pick one from the tenant switcher above.
			</Alert>
		);
	}
	if (!isAdmin) {
		return (
			<Box>
				<OrgAdminTabs organizationId={organizationId} isAdmin={isAdmin} />
				<Alert severity="warning">
					You need ADMIN or OWNER access to manage invitations.
				</Alert>
			</Box>
		);
	}

	// OWNER can issue ADMIN invites; ADMIN cannot (server enforces too).
	const allowedRoles = isOwner
		? [
				OrganizationRole.ADMIN,
				OrganizationRole.AGRONOMIST,
				OrganizationRole.LAB_TECHNICIAN,
				OrganizationRole.CONSULTANT,
				OrganizationRole.VIEWER,
		  ]
		: [
				OrganizationRole.AGRONOMIST,
				OrganizationRole.LAB_TECHNICIAN,
				OrganizationRole.CONSULTANT,
				OrganizationRole.VIEWER,
		  ];

	return (
		<Box>
			<OrgAdminTabs organizationId={organizationId} isAdmin={isAdmin} />
			<Stack
				direction="row"
				alignItems="center"
				justifyContent="space-between"
				sx={{ mb: 2 }}
			>
				<Box />
				<Button
					variant="contained"
					startIcon={<AddIcon />}
					onClick={() => setDialogOpen(true)}
				>
					Invite member
				</Button>
			</Stack>
			{error && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}
			{!rows ? (
				<CircularProgress size={24} />
			) : (
				<TableContainer component={Paper} variant="outlined">
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Email</TableCell>
								<TableCell>Role</TableCell>
								<TableCell>Status</TableCell>
								<TableCell>Expires</TableCell>
								<TableCell align="right" />
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.length === 0 ? (
								<TableRow>
									<TableCell colSpan={5} align="center">
										No invitations yet. Click “Invite member” to send one.
									</TableCell>
								</TableRow>
							) : (
								rows.map((inv) => (
									<TableRow key={inv.id}>
										<TableCell>{inv.email}</TableCell>
										<TableCell>{inv.role}</TableCell>
										<TableCell>
											<Chip
												size="small"
												label={inv.status}
												color={STATUS_COLOR[inv.status]}
												variant={
													inv.status === InvitationStatus.PENDING
														? "filled"
														: "outlined"
												}
											/>
										</TableCell>
										<TableCell>
											{new Date(inv.expiresAt).toLocaleDateString()}
										</TableCell>
										<TableCell align="right">
											{inv.status === InvitationStatus.PENDING && (
												<Tooltip title="Revoke">
													<span>
														<IconButton
															size="small"
															color="error"
															aria-label={`Revoke ${inv.email}`}
															disabled={pendingId === inv.id}
															onClick={() => handleRevoke(inv.id)}
														>
															<DeleteOutlineIcon fontSize="small" />
														</IconButton>
													</span>
												</Tooltip>
											)}
										</TableCell>
									</TableRow>
								))
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}
			<InviteMemberDialog
				open={dialogOpen}
				organizationId={organizationId}
				allowedRoles={allowedRoles}
				onClose={() => setDialogOpen(false)}
				onCreated={() => {
					setDialogOpen(false);
					load();
				}}
			/>
		</Box>
	);
}
