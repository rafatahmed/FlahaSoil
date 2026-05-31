/**
 * FlahaSOIL v2 API — ownership helpers (Phase 8B).
 *
 * Centralises the "is the current user allowed to see / mutate this
 * row?" check so every controller path uses the same predicate.
 *
 * Design choices:
 *   - Cross-user access returns 404 (not 403) so the API never leaks
 *     the existence of a record owned by someone else.
 *   - Ownership of samples and tests is resolved by walking up to the
 *     owning `Project` rather than relying on the denormalized
 *     `SoilSample.userId` column (the denormalization is kept for fast
 *     per-user queries but is not the authoritative source).
 */

import type { Request } from "express";

import { getPrismaClient } from "../prisma/client";
import { ApiError } from "../utils/apiError";

import type { CurrentSession } from "./devSession.middleware";

/**
 * Pulls `req.currentUser` or throws an internal-error envelope. The
 * dev-session middleware is mounted globally on `/api/v2`, so missing
 * `currentUser` indicates a routing bug, not a client error.
 */
export function requireCurrentUser(req: Request): CurrentSession {
	if (!req.currentUser) {
		throw ApiError.internal(
			"req.currentUser is missing — devSessionMiddleware must be mounted before this handler."
		);
	}
	return req.currentUser;
}

/**
 * Asserts that `projectId` exists AND is owned by `userId`. Used by
 * project read/write paths and by `assertSampleOwnership` when
 * resolving sample → project → user.
 */
export async function assertProjectOwnership(
	projectId: string,
	userId: string
): Promise<void> {
	const prisma = getPrismaClient();
	const row = await prisma.project.findFirst({
		where: { id: projectId, userId },
	});
	if (!row) {
		throw ApiError.notFound(`Project not found: ${projectId}`);
	}
}

/**
 * Asserts that `sampleId` exists AND is owned by `userId` (via its
 * `project.userId`). Samples with `projectId = null` (legacy rows
 * created before Phase 8A) fall back to the denormalized
 * `SoilSample.userId`.
 */
export async function assertSampleOwnership(
	sampleId: string,
	userId: string
): Promise<void> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilSample.findUnique({
		where: { id: sampleId },
		include: { project: true },
	})) as
		| { userId: string; project: { userId: string } | null }
		| null;
	if (!row) {
		throw ApiError.notFound(`SoilSample not found: ${sampleId}`);
	}
	const ownerId = row.project?.userId ?? row.userId;
	if (ownerId !== userId) {
		throw ApiError.notFound(`SoilSample not found: ${sampleId}`);
	}
}

/**
 * Asserts that `soilTestId` exists AND its parent sample is owned by
 * `userId`. Used by every soil-test read/write path and inherited by
 * the calculate / interpretation / report / export endpoints.
 */
export async function assertSoilTestOwnership(
	soilTestId: string,
	userId: string
): Promise<void> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilTest.findUnique({
		where: { id: soilTestId },
		include: { sample: { include: { project: true } } },
	})) as
		| {
				sample: {
					userId: string;
					project: { userId: string } | null;
				};
		  }
		| null;
	if (!row) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}
	const ownerId = row.sample.project?.userId ?? row.sample.userId;
	if (ownerId !== userId) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}
}
