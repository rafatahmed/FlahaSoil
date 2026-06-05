/**
 * @flaha/shared-types — Project DTOs and contracts (Phase 8A).
 *
 * Aligned 1:1 with the `Project` model in `prisma/v2-schema.prisma`.
 * Projects are the top-level agronomic container in v2; every
 * `SoilSampleDTO.projectId` resolves to a `ProjectDTO.id`.
 */

import type { IsoDateString, SoilSampleDTO } from "./soil-domain";

// ---------------------------------------------------------------------------
// Enum (mirrors prisma/v2-schema.prisma)
// ---------------------------------------------------------------------------

export enum ProjectStatus {
	ACTIVE = "ACTIVE",
	ARCHIVED = "ARCHIVED",
}

// ---------------------------------------------------------------------------
// Identity DTO
// ---------------------------------------------------------------------------

export interface ProjectDTO {
	id: string;
	userId: string;
	name: string;
	code?: string | null;
	description?: string | null;
	locationName?: string | null;
	status: ProjectStatus;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}

/** Compact row used in list views. */
export interface ProjectSummaryDTO {
	id: string;
	name: string;
	code?: string | null;
	status: ProjectStatus;
	sampleCount: number;
	createdAt: IsoDateString;
	updatedAt: IsoDateString;
}

// ---------------------------------------------------------------------------
// Request / response shapes — POST /api/v2/projects
// ---------------------------------------------------------------------------

/**
 * Wire-format request for `POST /api/v2/projects`. Ownership + tenancy
 * are resolved server-side from the auth session (see backend
 * `auth/session.middleware`), NOT from a body field — Phase 8B
 * intentionally removed `userId` from the client-supplied payload (and
 * 9A-E removed the parallel `organizationId` field) so the API never
 * trusts the client to declare its own identity or tenant.
 */
export interface CreateProjectRequest {
	name: string;
	code?: string | null;
	description?: string | null;
	locationName?: string | null;
	status?: ProjectStatus;
}

export interface CreateProjectResponse {
	project: ProjectDTO;
}

// ---------------------------------------------------------------------------
// GET /api/v2/projects
// ---------------------------------------------------------------------------

/**
 * Read-side filters for `GET /api/v2/projects`. Ownership scoping is
 * resolved server-side from the dev-session (see Phase 8B); the client
 * does not supply a user identifier. `status` is optional; the server
 * returns all statuses when omitted.
 */
export interface ListProjectsQuery {
	status?: ProjectStatus;
}

export interface ListProjectsResponse {
	projects: ProjectSummaryDTO[];
}

// ---------------------------------------------------------------------------
// GET /api/v2/projects/:projectId
// ---------------------------------------------------------------------------

export interface GetProjectResponse {
	project: ProjectDTO;
	samples: SoilSampleDTO[];
}
