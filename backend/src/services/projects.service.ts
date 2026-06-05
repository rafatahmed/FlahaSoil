/**
 * FlahaSOIL v2 API — Project service (Phase 8A → 9A-D.5).
 *
 * Owns the read/write surface for `Project`. Phase 9A-D moved the
 * authoritative tenancy boundary from `userId` to `organizationId`:
 * every list/read path now filters by `organizationId` and writes
 * persist both the creator (`userId`, audit) and the tenant
 * (`organizationId`, isolation). The controller layer is responsible
 * for providing both via the resolved `req.authSession`.
 */

import {
	type CreateProjectResponse,
	type GetProjectResponse,
	type ListProjectsResponse,
	ProjectStatus,
} from "@flaha/shared-types";

import type { AuthorActor } from "../auth/session.middleware";
import { getPrismaClient } from "../prisma/client";
import { ApiError } from "../utils/apiError";
import {
	toProjectDTO,
	toProjectSummaryDTO,
	toSoilSampleDTO,
} from "../utils/serializers";
import type {
	CreateProjectParsed,
	ListProjectsQueryParsed,
} from "../validation/schemas";

/** Prisma client error shape we care about for unique-key conflicts. */
function isPrismaUniqueConstraintError(err: unknown): boolean {
	return (
		typeof err === "object" &&
		err !== null &&
		(err as { code?: unknown }).code === "P2002"
	);
}

export async function createProject(
	actor: AuthorActor,
	input: CreateProjectParsed
): Promise<CreateProjectResponse> {
	const prisma = getPrismaClient();

	const data: Record<string, unknown> = {
		userId: actor.userId,
		organizationId: actor.organizationId,
		name: input.name,
		status: input.status ?? ProjectStatus.ACTIVE,
	};
	if (input.code !== undefined && input.code !== null) data["code"] = input.code;
	if (input.description !== undefined && input.description !== null) {
		data["description"] = input.description;
	}
	if (input.locationName !== undefined && input.locationName !== null) {
		data["locationName"] = input.locationName;
	}

	try {
		const row = await prisma.project.create({ data });
		return { project: toProjectDTO(row) };
	} catch (err) {
		// The (userId, code) unique constraint maps to a 400 with a
		// human-readable message instead of leaking the raw Prisma error.
		if (isPrismaUniqueConstraintError(err)) {
			throw ApiError.validation(
				`A project with code "${input.code ?? ""}" already exists.`
			);
		}
		throw err;
	}
}

export async function listProjects(
	organizationId: string,
	query: ListProjectsQueryParsed
): Promise<ListProjectsResponse> {
	const prisma = getPrismaClient();

	const where: Record<string, unknown> = { organizationId };
	if (query.status !== undefined) where["status"] = query.status;

	const rows = await prisma.project.findMany({
		where,
		orderBy: { updatedAt: "desc" },
		include: { _count: { select: { samples: true } } },
	});

	const projects = rows.map((row) => {
		const count =
			(row["_count"] as { samples?: number } | undefined)?.samples ?? 0;
		return toProjectSummaryDTO(row, count);
	});

	return { projects };
}

export async function getProjectById(
	projectId: string,
	organizationId: string
): Promise<GetProjectResponse> {
	const prisma = getPrismaClient();

	const row = await prisma.project.findFirst({
		where: { id: projectId, organizationId },
		include: { samples: { orderBy: { createdAt: "desc" } } },
	});

	if (!row) {
		throw ApiError.notFound(`Project not found: ${projectId}`);
	}

	const samples = ((row["samples"] as Record<string, unknown>[]) ?? []).map(
		toSoilSampleDTO
	);
	return { project: toProjectDTO(row), samples };
}

// Tenancy helpers live in `auth/ownership.ts` (`assertProjectTenancy`)
// and are mounted as route-level guards in `routes/v2.routes.ts`.
