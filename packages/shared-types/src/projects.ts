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

export interface CreateProjectRequest {
	userId: string;
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
 * Read-side filters. `userId` is required so v2 cannot accidentally
 * leak cross-user projects; `status` is optional and defaults to
 * `ACTIVE` server-side when omitted.
 */
export interface ListProjectsQuery {
	userId: string;
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
