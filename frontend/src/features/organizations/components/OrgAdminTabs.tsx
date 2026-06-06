/**
 * FlahaSOIL v2 — Organization admin tab strip (Phase 9B-D).
 *
 * Tab navigation shared by Settings / Members / Invitations pages.
 * Tabs are rendered as react-router `NavLink`s so the active tab
 * highlights automatically when the URL changes.
 */
import { Tab, Tabs } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";

export interface OrgAdminTabsProps {
	organizationId: string;
	/** When false, the Invitations tab is hidden — viewer-level users
	 * can still see Settings (read-only) and Members. */
	isAdmin: boolean;
}

export function OrgAdminTabs({ organizationId, isAdmin }: OrgAdminTabsProps) {
	const location = useLocation();
	const navigate = useNavigate();
	const base = `/organizations/${organizationId}`;

	let current: string;
	if (location.pathname.startsWith(`${base}/members`)) current = "members";
	else if (location.pathname.startsWith(`${base}/invitations`))
		current = "invitations";
	else current = "settings";

	return (
		<Tabs
			value={current}
			onChange={(_, value: string) => navigate(`${base}/${value}`)}
			sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
		>
			<Tab value="settings" label="Settings" />
			<Tab value="members" label="Members" />
			{isAdmin && <Tab value="invitations" label="Invitations" />}
		</Tabs>
	);
}
