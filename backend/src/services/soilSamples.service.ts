/**
 * FlahaSOIL v2 API — soil-sample service.
 *
 * Owns the read/write surface for `SoilSample`. Delegates serialisation
 * to `utils/serializers.ts` and never returns a Prisma row directly.
 */

import type {
	CreateSoilSampleResponse,
	GetSoilSampleResponse,
	SoilTestSummaryDTO,
} from "@flaha/shared-types";
import { type SoilTestLevel } from "@flaha/shared-types";

import { assertProjectOwnership } from "../auth/ownership";
import { getPrismaClient } from "../prisma/client";
import { ApiError } from "../utils/apiError";
import { toIso, toSoilSampleDTO } from "../utils/serializers";
import type { CreateSoilSampleParsed } from "../validation/schemas";

export async function createSoilSample(
	userId: string,
	input: CreateSoilSampleParsed
): Promise<CreateSoilSampleResponse> {
	const prisma = getPrismaClient();

	// Phase 8A: every newly created sample must belong to a Project owned
	// by the same user. Reject before touching the soil_samples table so
	// we don't rely on the database FK to produce a clean 404.
	await assertProjectOwnership(input.projectId, userId);

	const data: Record<string, unknown> = {
		userId,
		projectId: input.projectId,
	};
	if (input.locationName !== undefined) data["locationName"] = input.locationName;
	if (input.latitude !== undefined) data["latitude"] = input.latitude;
	if (input.longitude !== undefined) data["longitude"] = input.longitude;
	if (input.depthFromCm !== undefined) data["depthFromCm"] = input.depthFromCm;
	if (input.depthToCm !== undefined) data["depthToCm"] = input.depthToCm;
	if (input.sampleDate !== undefined) {
		data["sampleDate"] = input.sampleDate ? new Date(input.sampleDate) : null;
	}

	const row = await prisma.soilSample.create({ data });
	return { sample: toSoilSampleDTO(row) };
}

export async function getSoilSampleById(
	sampleId: string
): Promise<GetSoilSampleResponse> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilSample.findUnique({
		where: { id: sampleId },
		include: {
			tests: {
				include: {
					physicsResult: true,
					chemistryResult: true,
					interpretation: true,
				},
				orderBy: { createdAt: "desc" },
			},
		},
	})) as Record<string, unknown> | null;

	if (!row) {
		throw ApiError.notFound(`SoilSample not found: ${sampleId}`);
	}

	const tests = ((row["tests"] as Record<string, unknown>[]) ?? []).map(
		(t): SoilTestSummaryDTO => ({
			id: t["id"] as string,
			testLevel: t["testLevel"] as SoilTestLevel,
			labName: (t["labName"] as string | null | undefined) ?? null,
			testDate:
				t["testDate"] === null || t["testDate"] === undefined
					? null
					: toIso(t["testDate"] as Date),
			hasPhysicsResult: Boolean(t["physicsResult"]),
			hasChemistryResult: Boolean(t["chemistryResult"]),
			hasInterpretation: Boolean(t["interpretation"]),
			createdAt: toIso(t["createdAt"] as Date),
		})
	);

	return { sample: toSoilSampleDTO(row), tests };
}
