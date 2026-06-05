/**
 * FlahaSOIL v2 API — GET /api/v2/me controller (Phase 9A-E).
 *
 * Surfaces the auth session that `resolveAuthSession` attaches to the
 * request. Pure projection: no business logic, no DB calls. Clients
 * use this endpoint on boot to discover "who the API thinks they are"
 * and to populate the session-aware UI chrome (user chip, role label).
 *
 * The legacy `req.currentUser` back-compat write was removed in 9A-E;
 * this controller is the canonical example of consuming
 * `req.authSession` directly.
 */

import type { Request, Response } from "express";

import type {
	GetCurrentUserResponse,
	UserMembershipsResponse,
} from "@flaha/shared-types";

import { listUserMemberships } from "../services/auth.service";
import { ApiError } from "../utils/apiError";

export async function getMe(req: Request, res: Response): Promise<void> {
	const session = req.authSession;
	if (!session) {
		throw ApiError.internal(
			"req.authSession is missing — resolveAuthSession must be mounted before this handler."
		);
	}
	const payload: GetCurrentUserResponse = {
		session: {
			// `jwt` → wire "authenticated"; `dev` → wire "dev". Keeps the
			// public SessionDTO contract stable across the auth migration.
			mode: session.mode === "jwt" ? "authenticated" : "dev",
			user: session.user,
		},
	};
	res.status(200).json(payload);
}

/**
 * Phase 9A-H — GET /api/v2/me/organizations.
 *
 * Returns every ACTIVE membership the caller has, with hydrated
 * organizations, plus the user's current `activeOrganizationId` so the
 * frontend tenant switcher can highlight the right entry without a
 * second `GET /auth/me` round-trip.
 */
export async function getMyOrganizations(
	req: Request,
	res: Response
): Promise<void> {
	const session = req.authSession;
	if (!session) {
		throw ApiError.internal(
			"req.authSession is missing — resolveAuthSession must be mounted before this handler."
		);
	}
	const result = await listUserMemberships(session.userId);
	const payload: UserMembershipsResponse = {
		activeOrganizationId: result.activeOrganizationId,
		memberships: result.memberships,
	};
	res.status(200).json(payload);
}
