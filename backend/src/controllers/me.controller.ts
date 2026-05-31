/**
 * FlahaSOIL v2 API — GET /api/v2/me controller (Phase 8B).
 *
 * Surfaces the dev-session that `devSessionMiddleware` attaches to the
 * request. Pure projection: no business logic, no DB calls. Clients
 * use this endpoint on boot to discover "who the API thinks they are"
 * and to populate the session-aware UI chrome (user chip, role label).
 */

import type { Request, Response } from "express";

import type { GetCurrentUserResponse } from "@flaha/shared-types";

import { requireCurrentUser } from "../auth/ownership";

export async function getMe(req: Request, res: Response): Promise<void> {
	const session = requireCurrentUser(req);
	const payload: GetCurrentUserResponse = {
		session: {
			mode: session.mode,
			user: session.user,
		},
	};
	res.status(200).json(payload);
}
