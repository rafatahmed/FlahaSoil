/**
 * FlahaSOIL v2 API — tenant ownership helpers (Phase 9A-E).
 *
 * Centralises the "is the caller's tenant allowed to see / mutate this
 * row?" check so every controller path uses the same predicate.
 *
 * Design choices:
 *   - Cross-tenant access returns 404 (not 403) so the API never leaks
 *     the existence of a record owned by another organization.
 *   - Tenancy of samples / tests / reports is resolved by walking up
 *     to the owning `Project` rather than relying solely on the
 *     denormalised `organizationId` columns (the denormalisation is
 *     kept for fast queries but is not the authoritative source).
 *
 * Phase 9A-E removed the legacy `assert*Ownership(id, userId)` family
 * and the `requireCurrentUser(req)` helper. Every caller now flows
 * through `req.authSession` → `assert*Tenancy(id, organizationId)`.
 */

import { getPrismaClient } from "../prisma/client";
import { ApiError } from "../utils/apiError";

// ---------------------------------------------------------------------------
// Tenant-scoped assertions
// ---------------------------------------------------------------------------
// Each helper short-circuits on the denormalised `organizationId`
// column when present, then falls back to the project chain so rows
// created before the 9A-B backfill still resolve correctly.

/**
 * Asserts that `projectId` exists AND belongs to `organizationId`.
 * Returns the resolved row's owning org id (always equal to the input)
 * so callers can pass it through to nested assertions without an extra
 * lookup.
 */
export async function assertProjectTenancy(
	projectId: string,
	organizationId: string
): Promise<{ organizationId: string }> {
	const prisma = getPrismaClient();
	const row = (await prisma.project.findUnique({
		where: { id: projectId },
	})) as { organizationId?: string | null } | null;
	if (!row || row.organizationId !== organizationId) {
		throw ApiError.notFound(`Project not found: ${projectId}`);
	}
	return { organizationId };
}

/**
 * Asserts that `sampleId` exists AND its owning project (or its own
 * denormalised `organizationId`) belongs to `organizationId`. Samples
 * whose project moved orgs (forbidden, but defensively checked) are
 * rejected as 404.
 */
export async function assertSampleTenancy(
	sampleId: string,
	organizationId: string
): Promise<void> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilSample.findUnique({
		where: { id: sampleId },
		include: { project: true },
	})) as
		| {
				organizationId: string | null;
				project: { organizationId: string | null } | null;
		  }
		| null;
	if (!row) {
		throw ApiError.notFound(`SoilSample not found: ${sampleId}`);
	}
	const resolved = row.project?.organizationId ?? row.organizationId;
	if (resolved !== organizationId) {
		throw ApiError.notFound(`SoilSample not found: ${sampleId}`);
	}
}

/**
 * Asserts that `soilTestId` exists AND its parent sample resolves to
 * `organizationId`. Mirrors `assertSoilTestOwnership` but on tenant
 * scope.
 */
export async function assertSoilTestTenancy(
	soilTestId: string,
	organizationId: string
): Promise<void> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilTest.findUnique({
		where: { id: soilTestId },
		include: { sample: { include: { project: true } } },
	})) as
		| {
				sample: {
					organizationId: string | null;
					project: { organizationId: string | null } | null;
				};
		  }
		| null;
	if (!row) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}
	const resolved =
		row.sample.project?.organizationId ?? row.sample.organizationId;
	if (resolved !== organizationId) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}
}

/**
 * Asserts that `reportId` exists AND its parent test → sample → project
 * resolves to `organizationId`. Returns the resolved `soilTestId` so
 * callers can perform follow-up lookups without re-walking the chain.
 */
export async function assertReportTenancy(
	reportId: string,
	organizationId: string
): Promise<{ soilTestId: string }> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilReport.findUnique({
		where: { id: reportId },
		include: {
			soilTest: {
				include: { sample: { include: { project: true } } },
			},
		},
	})) as
		| {
				soilTestId: string;
				soilTest: {
					sample: {
						organizationId: string | null;
						project: { organizationId: string | null } | null;
					};
				};
		  }
		| null;
	if (!row) {
		throw ApiError.notFound(`SoilReport not found: ${reportId}`);
	}
	const resolved =
		row.soilTest.sample.project?.organizationId ??
		row.soilTest.sample.organizationId;
	if (resolved !== organizationId) {
		throw ApiError.notFound(`SoilReport not found: ${reportId}`);
	}
	return { soilTestId: row.soilTestId };
}
