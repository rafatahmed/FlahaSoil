/**
 * @flaha/shared-types — User DTOs and session contracts (Phase 8B).
 *
 * Aligned 1:1 with the `User` model in `prisma/v2-schema.prisma`. The
 * session shapes describe the dev-session layer that v2 uses in place
 * of production auth (JWT / OAuth) — the same shapes are intended to
 * outlive the dev-session implementation so the eventual auth upgrade
 * is additive on the wire.
 */

import type { IsoDateString } from "./soil-domain";

// ---------------------------------------------------------------------------
// Enum (mirrors prisma/v2-schema.prisma `UserRole`)
// ---------------------------------------------------------------------------

export enum UserRole {
	ADMIN = "ADMIN",
	AGRONOMIST = "AGRONOMIST",
	CLIENT = "CLIENT",
	VIEWER = "VIEWER",
}

// ---------------------------------------------------------------------------
// Identity DTO
// ---------------------------------------------------------------------------

export interface UserDTO {
	id: string;
	email: string;
	displayName: string;
	role: UserRole;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
	archivedAt: IsoDateString | null;
}

// ---------------------------------------------------------------------------
// Session contract — GET /api/v2/me
//
// `mode` distinguishes between the dev-session resolver (Phase 8B) and
// the eventual real auth resolver. Clients should treat `dev` as a
// signal to surface a developer chip in the UI; behavioural code should
// branch on `user.role`, not on `mode`.
// ---------------------------------------------------------------------------

export type SessionMode = "dev" | "authenticated";

export interface SessionDTO {
	mode: SessionMode;
	user: UserDTO;
}

export interface GetCurrentUserResponse {
	session: SessionDTO;
}
