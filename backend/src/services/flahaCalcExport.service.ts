/**
 * FlahaSOIL v2 API — FlahaCalc export projection.
 *
 * Builds the stable downstream contract consumed by FlahaCalc from the
 * already-persisted physics, chemistry, and interpretation rows for a
 * given soil test. This endpoint is read-only — it never triggers an
 * engine run; it only projects what's already in the database.
 *
 * If the physics result is missing (no calculation has been run yet),
 * we surface `MISSING_REQUIRED_INPUT` so the caller knows to invoke
 * `/calculate` first. Optional chemistry / interpretation fields are
 * simply omitted when their tables are empty.
 */

import type { FlahaCalcExportResponse } from "@flaha/shared-types";

import { getPrismaClient } from "../prisma/client";
import { ApiError } from "../utils/apiError";

function toNumber(value: unknown): number {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const n = parseFloat(value);
		return Number.isFinite(n) ? n : 0;
	}
	return 0;
}

function toOptionalNumber(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const n = parseFloat(value);
		return Number.isFinite(n) ? n : undefined;
	}
	return undefined;
}

function toOptionalString(value: unknown): string | undefined {
	if (typeof value === "string" && value.length > 0) return value;
	return undefined;
}

export async function getFlahaCalcExport(
	soilTestId: string
): Promise<FlahaCalcExportResponse> {
	const prisma = getPrismaClient();

	const test = (await prisma.soilTest.findUnique({
		where: { id: soilTestId },
		include: {
			physicsResult: true,
			chemistryResult: true,
			interpretation: true,
		},
	})) as Record<string, unknown> | null;

	if (!test) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}

	const physics = test["physicsResult"] as Record<string, unknown> | null;
	if (!physics) {
		throw ApiError.missingRequiredInput(
			"FlahaCalc export requires a physics result; call POST /soil-tests/:id/calculate with runPhysics=true first."
		);
	}

	const chemistry = test["chemistryResult"] as Record<string, unknown> | null;
	const interpretation = test["interpretation"] as
		| Record<string, unknown>
		| null;

	const warnings = interpretation
		? Array.isArray(interpretation["warningsJson"])
			? (interpretation["warningsJson"] as string[])
			: []
		: [];

	const response: FlahaCalcExportResponse = {
		soilTestId,
		textureClass: physics["textureClass"] as string,
		fieldCapacity: toNumber(physics["fieldCapacity"]),
		wiltingPoint: toNumber(physics["wiltingPoint"]),
		plantAvailableWater: toNumber(physics["plantAvailableWater"]),
		saturation: toNumber(physics["saturation"]),
		saturatedConductivity: toNumber(physics["saturatedConductivity"]),
		warnings,
	};

	if (chemistry) {
		const cec = toOptionalNumber(chemistry["cec"]);
		if (cec !== undefined) response.cec = cec;
	}

	if (interpretation) {
		const salinity = toOptionalString(interpretation["salinityRisk"]);
		if (salinity !== undefined) response.salinityRisk = salinity;
		const sodium = toOptionalString(interpretation["sodiumRisk"]);
		if (sodium !== undefined) response.sodiumRisk = sodium;
	}

	return response;
}
