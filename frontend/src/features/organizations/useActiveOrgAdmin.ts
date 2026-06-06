/**
 * FlahaSOIL v2 — active-org admin hook (Phase 9B-D).
 *
 * Resolves the organization the admin pages should operate on:
 *   1. `:organizationId` route param wins when present, so a power user
 *      can open `/organizations/<id>/members` directly.
 *   2. Falls back to the auth session's `activeOrganization` so the
 *      sidebar "Members" link works without a path arg.
 *
 * Returns the resolved id + the caller's role inside that org (as
 * stored in `memberships`), plus a boolean that admin-only UI can use
 * to hide write controls. The backend remains the authoritative gate;
 * this is purely for hiding buttons that would 403.
 */
import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { OrganizationRole } from "@flaha/shared-types";

import { useAuth } from "../../auth";

export interface ActiveOrgAdmin {
	organizationId: string | null;
	role: OrganizationRole | null;
	isAdmin: boolean;
	isOwner: boolean;
}

export function useActiveOrgAdmin(): ActiveOrgAdmin {
	const { activeOrganization, memberships } = useAuth();
	const params = useParams<{ organizationId?: string }>();

	return useMemo(() => {
		const organizationId =
			params.organizationId ?? activeOrganization?.id ?? null;
		if (!organizationId) {
			return { organizationId: null, role: null, isAdmin: false, isOwner: false };
		}
		const membership = memberships.find(
			(m) => m.organizationId === organizationId
		);
		const role = membership?.role ?? null;
		const isOwner = role === OrganizationRole.OWNER;
		const isAdmin = isOwner || role === OrganizationRole.ADMIN;
		return { organizationId, role, isAdmin, isOwner };
	}, [params.organizationId, activeOrganization, memberships]);
}
