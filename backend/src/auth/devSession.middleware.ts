/**
 * FlahaSOIL v2 API — dev-session middleware (Phase 8B).
 *
 * Resolves the "current user" for every `/api/v2` request without
 * implementing production auth. Resolution order:
 *
 *   1. The `x-dev-user-id` header, when present and pointing at an
 *      existing `User` row.
 *   2. The seeded dev user (`ensureDevUser()`), upserted on first hit.
 *
 * The resolved `UserDTO` plus a `SessionMode` is attached to
 * `req.currentUser` so downstream controllers / services never need to
 * read the header (or any literal user id) themselves.
 *
 * This file is the single point at which the rest of the v2 backend
 * couples to "who is the caller" — when the real auth layer lands, the
 * only change required is swapping the body of `resolveSession`.
 */

import type { NextFunction, Request, Response } from "express";

import { type UserDTO } from "@flaha/shared-types";

import { ensureDevUser, getUserById } from "./currentUser";

const DEV_USER_HEADER = "x-dev-user-id";

export type SessionMode = "dev" | "authenticated";

export interface CurrentSession {
	mode: SessionMode;
	user: UserDTO;
}

declare module "express-serve-static-core" {
	// eslint-disable-next-line @typescript-eslint/no-empty-interface
	interface Request {
		currentUser?: CurrentSession;
	}
}

function readDevUserHeader(req: Request): string | undefined {
	const raw = req.headers[DEV_USER_HEADER];
	if (typeof raw === "string" && raw.length > 0) return raw;
	if (Array.isArray(raw) && raw.length > 0 && typeof raw[0] === "string") {
		return raw[0];
	}
	return undefined;
}

async function resolveSession(req: Request): Promise<CurrentSession> {
	const headerId = readDevUserHeader(req);
	if (headerId) {
		const user = await getUserById(headerId);
		if (user) return { mode: "dev", user };
	}
	const user = await ensureDevUser();
	return { mode: "dev", user };
}

/**
 * Express middleware. Attaches `req.currentUser`. Errors propagate to
 * the central error handler via `next(err)`; they should be rare in
 * practice (only DB outages).
 */
export async function devSessionMiddleware(
	req: Request,
	_res: Response,
	next: NextFunction
): Promise<void> {
	try {
		req.currentUser = await resolveSession(req);
		next();
	} catch (err) {
		next(err);
	}
}
