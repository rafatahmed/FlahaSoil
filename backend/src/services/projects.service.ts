/**
 * FlahaSOIL v2 API — Project service (Phase 8A).
 *
 * Owns the read/write surface for `Project`. Every list/read path is
 * scoped by `userId` so v2 can never leak cross-user records, even
 * before the real auth layer lands.
 */

import {
	type CreateProjectResponse,
	type GetProjectResponse,
	type ListProjectsResponse,
	ProjectStatus,
} from "@flaha/shared-types";

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
	userId: string,
	input: CreateProjectParsed
): Promise<CreateProjectResponse> {
	const prisma = getPrismaClient();

	const data: Record<string, unknown> = {
		userId,
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
				`A project with code "${input.code ?? ""}" already exists for this user.`
			);
		}
		throw err;
	}
}

export async function listProjects(
	userId: string,
	query: ListProjectsQueryParsed
): Promise<ListProjectsResponse> {
	const prisma = getPrismaClient();

	const where: Record<string, unknown> = { userId };
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
	userId: string
): Promise<GetProjectResponse> {
	const prisma = getPrismaClient();

	const row = await prisma.project.findFirst({
		where: { id: projectId, userId },
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

// `assertProjectOwnership` was moved to `auth/ownership.ts` in Phase 8B
// so every owning-row check lives next to the dev-session resolver.
