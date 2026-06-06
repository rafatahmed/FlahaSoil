/**
 * FlahaSOIL v2 — Organization members page (Phase 9B-D).
 *
 * Lists ACTIVE / PENDING memberships in a table. ADMIN/OWNER see role
 * editors and a "Remove" button per row. The server enforces:
 *   - ADMIN cannot grant or revoke OWNER (UI hides those options).
 *   - The last OWNER cannot be demoted or removed (UI surfaces the
 *     resulting error inline; client-side prevention is best-effort).
 */
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	IconButton,
	MenuItem,
	Paper,
	Select,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import {
	OrganizationRole,
	type OrganizationMemberDTO,
} from "@flaha/shared-types";
import { useCallback, useEffect, useState } from "react";

import { OrgAdminTabs } from "../features/organizations/components/OrgAdminTabs";
import { useActiveOrgAdmin } from "../features/organizations/useActiveOrgAdmin";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";

const ROLE_OPTIONS_OWNER: OrganizationRole[] = [
	OrganizationRole.OWNER,
	OrganizationRole.ADMIN,
	OrganizationRole.AGRONOMIST,
	OrganizationRole.LAB_TECHNICIAN,
	OrganizationRole.CONSULTANT,
	OrganizationRole.VIEWER,
];
const ROLE_OPTIONS_ADMIN = ROLE_OPTIONS_OWNER.filter(
	(r) => r !== OrganizationRole.OWNER
);

export function OrganizationMembersPage() {
	const { organizationId, isAdmin, isOwner } = useActiveOrgAdmin();
	const [members, setMembers] = useState<OrganizationMemberDTO[] | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [pendingUserId, setPendingUserId] = useState<string | null>(null);

	usePageHeader({
		title: "Members",
		subtitle: members ? `${members.length} member(s)` : "Members",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Organization" },
			{ label: "Members" },
		],
	});

	const load = useCallback(() => {
		if (!organizationId) return;
		setError(null);
		setMembers(null);
		getApiClient()
			.listOrganizationMembers(organizationId)
			.then((res) => setMembers(res.members))
			.catch((err: unknown) =>
				setError(err instanceof Error ? err.message : String(err))
			);
	}, [organizationId]);

	useEffect(() => {
		load();
	}, [load]);

	const handleRoleChange = async (userId: string, nextRole: OrganizationRole) => {
		if (!organizationId) return;
		setPendingUserId(userId);
		setError(null);
		try {
			await getApiClient().patchMembership(organizationId, userId, {
				role: nextRole,
			});
			load();
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setPendingUserId(null);
		}
	};

	const handleRemove = async (userId: string) => {
		if (!organizationId) return;
		if (!window.confirm("Remove this member from the organization?")) return;
		setPendingUserId(userId);
		setError(null);
		try {
			await getApiClient().removeMembership(organizationId, userId);
			load();
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setPendingUserId(null);
		}
	};

	if (!organizationId) {
		return (
			<Alert severity="info">
				No active organization. Pick one from the tenant switcher above.
			</Alert>
		);
	}

	const roleOptions = isOwner ? ROLE_OPTIONS_OWNER : ROLE_OPTIONS_ADMIN;

	return (
		<Box>
			<OrgAdminTabs organizationId={organizationId} isAdmin={isAdmin} />
			{error && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}
			{!members ? (
				<CircularProgress size={24} />
			) : (
				<TableContainer component={Paper} variant="outlined">
					<Table size="small">
						<TableHead>
							<TableRow>
								<TableCell>Name</TableCell>
								<TableCell>Email</TableCell>
								<TableCell>Role</TableCell>
								<TableCell>Status</TableCell>
								<TableCell align="right" />
							</TableRow>
						</TableHead>
						<TableBody>
							{members.map((m) => {
								const isTargetOwner = m.role === OrganizationRole.OWNER;
								const canEdit =
									isAdmin && (isOwner || !isTargetOwner);
								return (
									<TableRow key={m.id}>
										<TableCell>{m.userDisplayName}</TableCell>
										<TableCell>{m.userEmail}</TableCell>
										<TableCell>
											{canEdit ? (
												<Select
													size="small"
													value={m.role}
													disabled={pendingUserId === m.userId}
													onChange={(e) =>
														handleRoleChange(
															m.userId,
															e.target.value as OrganizationRole
														)
													}
												>
													{roleOptions.map((r) => (
														<MenuItem key={r} value={r}>
															{r}
														</MenuItem>
													))}
												</Select>
											) : (
												m.role
											)}
										</TableCell>
										<TableCell>{m.status}</TableCell>
										<TableCell align="right">
											{canEdit && (
												<Tooltip title="Remove">
													<span>
														<IconButton
															size="small"
															color="error"
															aria-label={`Remove ${m.userEmail}`}
															disabled={pendingUserId === m.userId}
															onClick={() => handleRemove(m.userId)}
														>
															<DeleteOutlineIcon fontSize="small" />
														</IconButton>
													</span>
												</Tooltip>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			)}
			{isAdmin && (
				<Button
					variant="text"
					sx={{ mt: 2 }}
					href={`/organizations/${organizationId}/invitations`}
				>
					Manage invitations →
				</Button>
			)}
		</Box>
	);
}
