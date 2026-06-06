/**
 * FlahaSOIL v2 — Invite member dialog (Phase 9B-D).
 *
 * Captures an email + role and POSTs to
 * `/organizations/:organizationId/invitations`. OWNER is intentionally
 * absent from the role picker — ownership is transferred separately,
 * the server also rejects OWNER invites with 400. Email is validated
 * with a minimal regex to catch typos before the round-trip.
 */
import {
	Alert,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	MenuItem,
	Stack,
	TextField,
} from "@mui/material";
import { OrganizationRole } from "@flaha/shared-types";
import { useState } from "react";

import { getApiClient } from "../../../services/apiClientProvider";

const INVITABLE_ROLES: OrganizationRole[] = [
	OrganizationRole.ADMIN,
	OrganizationRole.AGRONOMIST,
	OrganizationRole.LAB_TECHNICIAN,
	OrganizationRole.CONSULTANT,
	OrganizationRole.VIEWER,
];

// Lightweight pre-flight check; the server is authoritative.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface InviteMemberDialogProps {
	open: boolean;
	organizationId: string;
	/** Roles the caller is allowed to grant. ADMIN may grant ADMIN and
	 * below; OWNER may grant anything except OWNER (still excluded). */
	allowedRoles?: OrganizationRole[];
	onClose: () => void;
	onCreated: () => void;
}

export function InviteMemberDialog(props: InviteMemberDialogProps) {
	const { open, organizationId, allowedRoles, onClose, onCreated } = props;
	const options = allowedRoles ?? INVITABLE_ROLES;
	const [email, setEmail] = useState("");
	const [role, setRole] = useState<OrganizationRole>(options[0] ?? OrganizationRole.VIEWER);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const reset = () => {
		setEmail("");
		setRole(options[0] ?? OrganizationRole.VIEWER);
		setError(null);
		setSubmitting(false);
	};

	const handleClose = () => {
		if (submitting) return;
		reset();
		onClose();
	};

	const handleSubmit = async () => {
		const normalized = email.trim().toLowerCase();
		if (!EMAIL_RE.test(normalized)) {
			setError("Enter a valid email address.");
			return;
		}
		setSubmitting(true);
		setError(null);
		try {
			await getApiClient().createInvitation(organizationId, {
				email: normalized,
				role,
			});
			reset();
			onCreated();
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>Invite member</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					{error && <Alert severity="error">{error}</Alert>}
					<TextField
						label="Email"
						type="email"
						required
						fullWidth
						autoFocus
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<TextField
						label="Role"
						select
						value={role}
						onChange={(e) => setRole(e.target.value as OrganizationRole)}
						fullWidth
					>
						{options.map((r) => (
							<MenuItem key={r} value={r}>
								{r}
							</MenuItem>
						))}
					</TextField>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={submitting}>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={handleSubmit}
					disabled={submitting || email.trim().length === 0}
				>
					{submitting ? "Sending…" : "Send invitation"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
