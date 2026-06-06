/**
 * FlahaSOIL v2 — Organization settings page (Phase 9B-D).
 *
 * Read for any member; the Save button is hidden for non-admins. Loads
 * the org via `GET /organizations/:id` and submits a partial update via
 * `PATCH /organizations/:id` containing only the changed fields. The
 * backend enforces the OWNER/ADMIN gate; this page just hides controls
 * that would 403.
 */
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	MenuItem,
	Stack,
	TextField,
} from "@mui/material";
import {
	OrganizationType,
	type OrganizationDTO,
} from "@flaha/shared-types";
import { useCallback, useEffect, useState } from "react";

import { OrgAdminTabs } from "../features/organizations/components/OrgAdminTabs";
import { useActiveOrgAdmin } from "../features/organizations/useActiveOrgAdmin";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";

export function OrganizationSettingsPage() {
	const { organizationId, isAdmin } = useActiveOrgAdmin();
	const [org, setOrg] = useState<OrganizationDTO | null>(null);
	const [name, setName] = useState("");
	const [type, setType] = useState<OrganizationType>(OrganizationType.COMPANY);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState(false);

	usePageHeader({
		title: "Organization settings",
		subtitle: org ? `${org.name} · ${org.slug}` : "Settings",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Organization" },
		],
	});

	const load = useCallback(() => {
		if (!organizationId) return;
		setError(null);
		getApiClient()
			.getOrganization(organizationId)
			.then((res) => {
				setOrg(res.organization);
				setName(res.organization.name);
				setType(res.organization.type);
			})
			.catch((err: unknown) =>
				setError(err instanceof Error ? err.message : String(err))
			);
	}, [organizationId]);

	useEffect(() => {
		load();
	}, [load]);

	const handleSave = async () => {
		if (!organizationId) return;
		setSaving(true);
		setSaved(false);
		setError(null);
		try {
			const patch: { name?: string; type?: OrganizationType } = {};
			if (org && name.trim() !== org.name) patch.name = name.trim();
			if (org && type !== org.type) patch.type = type;
			if (Object.keys(patch).length === 0) {
				setSaving(false);
				return;
			}
			const res = await getApiClient().patchOrganization(organizationId, patch);
			setOrg(res.organization);
			setSaved(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setSaving(false);
		}
	};

	if (!organizationId) {
		return (
			<Alert severity="info">
				No active organization. Pick one from the tenant switcher above.
			</Alert>
		);
	}

	return (
		<Box>
			<OrgAdminTabs organizationId={organizationId} isAdmin={isAdmin} />
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}
			{saved && (
				<Alert severity="success" sx={{ mb: 2 }}>
					Saved.
				</Alert>
			)}
			<Card sx={{ maxWidth: 640 }}>
				<CardContent>
					{!org ? (
						<CircularProgress size={24} />
					) : (
						<Stack spacing={2}>
							<TextField
								label="Organization name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								disabled={!isAdmin || saving}
								required
								fullWidth
							/>
							<TextField
								label="Type"
								select
								value={type}
								onChange={(e) => setType(e.target.value as OrganizationType)}
								disabled={!isAdmin || saving}
								fullWidth
							>
								{Object.values(OrganizationType).map((t) => (
									<MenuItem key={t} value={t}>
										{t}
									</MenuItem>
								))}
							</TextField>
							<TextField label="Slug" value={org.slug} disabled fullWidth />
							{isAdmin && (
								<Button
									variant="contained"
									onClick={handleSave}
									disabled={saving || name.trim().length === 0}
									sx={{ alignSelf: "flex-start" }}
								>
									{saving ? "Saving…" : "Save changes"}
								</Button>
							)}
						</Stack>
					)}
				</CardContent>
			</Card>
		</Box>
	);
}
