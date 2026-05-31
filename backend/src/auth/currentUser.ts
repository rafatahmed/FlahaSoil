/**
 * FlahaSOIL v2 API — current-user resolver (Phase 8B).
 *
 * Owns the read/write surface for the v2 `User` model needed by the
 * dev-session layer. Production auth (JWT / password / OAuth) is
 * deliberately out of scope here; the only callers are:
 *
 *   - `devSession.middleware.ts` — looks up `req.currentUser` from a
 *     header or the seeded dev user.
 *   - `bootstrap.ts` — ensures the seeded dev user exists on boot in
 *     development.
 *   - `controllers/me.controller.ts` — serves GET /api/v2/me.
 */

import {
	type UserDTO,
	UserRole,
} from "@flaha/shared-types";

import { getPrismaClient } from "../prisma/client";
import { toUserDTO } from "../utils/serializers";

/**
 * Stable identifier for the seeded development user. Lives outside
 * Prisma's `cuid()` default on purpose so existing rows + tests that
 * still reference the literal stay valid through the Phase 8B sweep.
 */
export const DEV_USER_ID = "user_dev_admin";

const DEV_USER_EMAIL = "dev@flahasoil.local";
const DEV_USER_DISPLAY_NAME = "Development User";

/**
 * Idempotently ensures the seeded dev user exists. Safe to call from
 * the boot path and from tests; uses a fixed id so repeated calls do
 * not produce duplicates.
 */
export async function ensureDevUser(): Promise<UserDTO> {
	const prisma = getPrismaClient();
	const row = await prisma.user.upsert({
		where: { id: DEV_USER_ID },
		create: {
			id: DEV_USER_ID,
			email: DEV_USER_EMAIL,
			displayName: DEV_USER_DISPLAY_NAME,
			role: UserRole.ADMIN,
		},
		update: {},
	});
	return toUserDTO(row);
}

/**
 * Loads a user by id. Returns `null` when no row matches (callers
 * decide whether that is a 401, a 404, or a fall-through to the dev
 * user). Archived users (`archivedAt != null`) are still returned so
 * historical ownership chains remain readable.
 */
export async function getUserById(userId: string): Promise<UserDTO | null> {
	const prisma = getPrismaClient();
	const row = await prisma.user.findUnique({ where: { id: userId } });
	return row ? toUserDTO(row) : null;
}

/**
 * Convenience wrapper: returns the user for `userId` when it resolves,
 * otherwise the seeded dev user. Used by the dev-session middleware so
 * a stale `x-dev-user-id` header never produces a 500.
 */
export async function getUserOrDev(userId: string | undefined): Promise<UserDTO> {
	if (userId) {
		const found = await getUserById(userId);
		if (found) return found;
	}
	return ensureDevUser();
}
