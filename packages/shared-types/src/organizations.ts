/**
 * @flaha/shared-types — Organization, Membership, and Auth DTOs
 * (Phase 9A).
 *
 * Aligned 1:1 with the Phase 9A additions in `prisma/v2-schema.prisma`
 * (Organization, OrganizationMembership, RefreshToken). The auth DTOs
 * (AuthSessionDTO, RegisterRequest, LoginRequest, AuthMeResponse) live
 * in this file rather than `users.ts` so the Phase 8B session shapes
 * stay untouched during the migration window.
 */

import type { IsoDateString } from "./soil-domain";
import type { UserDTO } from "./users";

// ---------------------------------------------------------------------------
// Enums — mirror prisma/v2-schema.prisma
// ---------------------------------------------------------------------------

export enum OrganizationType {
	COMPANY = "COMPANY",
	CONSULTANCY = "CONSULTANCY",
	LABORATORY = "LABORATORY",
	FARM = "FARM",
	CLIENT = "CLIENT",
}

export enum OrganizationStatus {
	ACTIVE = "ACTIVE",
	SUSPENDED = "SUSPENDED",
	ARCHIVED = "ARCHIVED",
}

export enum OrganizationRole {
	OWNER = "OWNER",
	ADMIN = "ADMIN",
	AGRONOMIST = "AGRONOMIST",
	LAB_TECHNICIAN = "LAB_TECHNICIAN",
	CONSULTANT = "CONSULTANT",
	VIEWER = "VIEWER",
}

export enum MembershipStatus {
	PENDING = "PENDING",
	ACTIVE = "ACTIVE",
	SUSPENDED = "SUSPENDED",
	REMOVED = "REMOVED",
}

// ---------------------------------------------------------------------------
// Read DTOs
// ---------------------------------------------------------------------------

export interface OrganizationDTO {
	id: string;
	name: string;
	slug: string;
	type: OrganizationType;
	status: OrganizationStatus;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}

export interface OrganizationMembershipDTO {
	id: string;
	organizationId: string;
	userId: string;
	role: OrganizationRole;
	status: MembershipStatus;
	invitedById: string | null;
	invitedAt: IsoDateString | null;
	acceptedAt: IsoDateString | null;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
	/** Hydrated when the endpoint returns the parent org alongside. */
	organization?: OrganizationDTO;
}

// ---------------------------------------------------------------------------
// Auth — request DTOs
// ---------------------------------------------------------------------------

export interface RegisterRequest {
	email: string;
	password: string;
	displayName: string;
	/** Optional personal org name; falls back to "<displayName>'s workspace". */
	organizationName?: string;
}

export interface LoginRequest {
	email: string;
	password: string;
}

// ---------------------------------------------------------------------------
// Auth — response DTOs
//
// Refresh tokens are NEVER returned in the JSON body — they live in the
// HttpOnly+Secure `fsoil_rt` cookie. The shapes below describe only the
// access token + session context the client actually needs to know
// about.
// ---------------------------------------------------------------------------

export interface AuthSessionDTO {
	accessToken: string;
	/** Absolute expiry of the access token. Client uses this to
	 * proactively refresh ~1 minute before expiry. */
	accessTokenExpiresAt: IsoDateString;
	user: UserDTO;
	activeOrganization: OrganizationDTO | null;
	memberships: OrganizationMembershipDTO[];
}

export interface AuthLoginResponse {
	session: AuthSessionDTO;
}

export interface AuthRegisterResponse {
	session: AuthSessionDTO;
}

export interface AuthRefreshResponse {
	session: AuthSessionDTO;
}

export interface AuthLogoutResponse {
	ok: true;
}

export interface AuthMeResponse {
	user: UserDTO;
	activeOrganization: OrganizationDTO | null;
	memberships: OrganizationMembershipDTO[];
}

// ---------------------------------------------------------------------------
// Phase 9A-H — Organization management & switching
//
// `GET /api/v2/me/organizations` lists the caller's ACTIVE memberships
// with hydrated organizations and surfaces the active org id so the
// frontend tenant switcher can highlight it without a second call.
//
// `POST /api/v2/auth/switch-organization` rotates the access token by
// re-issuing a JWT with the new `oid` claim. The response shape mirrors
// the login/refresh flow so the frontend can reuse its existing
// `applySession` reducer.
// ---------------------------------------------------------------------------

export interface UserMembershipsResponse {
	activeOrganizationId: string | null;
	memberships: OrganizationMembershipDTO[];
}

export interface SwitchOrganizationRequest {
	organizationId: string;
}

export type SwitchOrganizationResponse = AuthRefreshResponse;
