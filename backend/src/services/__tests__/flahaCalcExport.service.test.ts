/**
 * FlahaSOIL v2 API — FlahaCalc export projection tests.
 *
 * Exercises `getFlahaCalcExport` against an in-memory Prisma stub
 * injected via `setPrismaClientForTesting`. No real database is
 * touched. Covers:
 *   - Missing test → NOT_FOUND
 *   - Test exists but no physics row → MISSING_REQUIRED_INPUT
 *   - Physics-only → required fields populated, optional fields omitted
 *   - Physics + chemistry + interpretation → optional fields surfaced
 *   - warningsJson passthrough (and empty-array fallback when missing)
 */

import { afterEach, describe, expect, it } from "vitest";

import {
	type PrismaClientLike,
	setPrismaClientForTesting,
} from "../../prisma/client";
import { ApiError } from "../../utils/apiError";
import { getFlahaCalcExport } from "../flahaCalcExport.service";

interface SoilTestRow {
	id: string;
	physicsResult: Record<string, unknown> | null;
	chemistryResult: Record<string, unknown> | null;
	interpretation: Record<string, unknown> | null;
}

function makeStubPrisma(row: SoilTestRow | null): PrismaClientLike {
	const noop = async () => {
		throw new Error("not implemented in stub");
	};
	const delegate = (
		find: (args: { where: Record<string, unknown> }) => Promise<unknown>
	) =>
		({
			create: noop,
			findUnique: find,
			findFirst: noop,
			update: noop,
			upsert: noop,
			delete: noop,
			findMany: noop,
		}) as unknown as PrismaClientLike["soilTest"];

	return {
		$connect: async () => {},
		$disconnect: async () => {},
		$transaction: async (fn) => fn({} as PrismaClientLike),
		soilSample: delegate(() => Promise.resolve(null)),
		soilTest: delegate(({ where }) =>
			Promise.resolve(row && row.id === where["id"] ? row : null)
		),
		soilTextureInput: delegate(() => Promise.resolve(null)),
		soilChemistryInput: delegate(() => Promise.resolve(null)),
		soilPhysicsResult: delegate(() => Promise.resolve(null)),
		soilChemistryResult: delegate(() => Promise.resolve(null)),
		soilInterpretation: delegate(() => Promise.resolve(null)),
		soilReport: delegate(() => Promise.resolve(null)),
		soilLabValue: delegate(() => Promise.resolve(null)),
	};
}

afterEach(() => {
	setPrismaClientForTesting(null);
});

describe("getFlahaCalcExport", () => {
	it("throws NOT_FOUND when the soil test does not exist", async () => {
		setPrismaClientForTesting(makeStubPrisma(null));
		await expect(getFlahaCalcExport("missing")).rejects.toMatchObject({
			statusCode: 404,
			code: "NOT_FOUND",
		});
	});

	it("throws MISSING_REQUIRED_INPUT when physics result is absent", async () => {
		setPrismaClientForTesting(
			makeStubPrisma({
				id: "t_1",
				physicsResult: null,
				chemistryResult: null,
				interpretation: null,
			})
		);
		const err = await getFlahaCalcExport("t_1").catch((e) => e);
		expect(err).toBeInstanceOf(ApiError);
		expect(err.statusCode).toBe(400);
		expect(err.code).toBe("MISSING_REQUIRED_INPUT");
	});

	it("returns required physics fields and omits optional fields when only physics exists", async () => {
		setPrismaClientForTesting(
			makeStubPrisma({
				id: "t_2",
				physicsResult: {
					textureClass: "loam",
					fieldCapacity: 0.32,
					wiltingPoint: 0.12,
					plantAvailableWater: 0.2,
					saturation: 0.45,
					saturatedConductivity: 12.5,
				},
				chemistryResult: null,
				interpretation: null,
			})
		);
		const result = await getFlahaCalcExport("t_2");
		expect(result).toEqual({
			soilTestId: "t_2",
			textureClass: "loam",
			fieldCapacity: 0.32,
			wiltingPoint: 0.12,
			plantAvailableWater: 0.2,
			saturation: 0.45,
			saturatedConductivity: 12.5,
			warnings: [],
		});
		expect(result.cec).toBeUndefined();
		expect(result.salinityRisk).toBeUndefined();
		expect(result.sodiumRisk).toBeUndefined();
	});

	it("surfaces cec, salinityRisk, sodiumRisk, and warnings when present", async () => {
		setPrismaClientForTesting(
			makeStubPrisma({
				id: "t_3",
				physicsResult: {
					textureClass: "clay",
					fieldCapacity: "0.40",
					wiltingPoint: "0.22",
					plantAvailableWater: "0.18",
					saturation: "0.50",
					saturatedConductivity: "3.2",
				},
				chemistryResult: { cec: 22.5 },
				interpretation: {
					salinityRisk: "Moderate",
					sodiumRisk: "Low",
					warningsJson: ["pH outside optimal range"],
				},
			})
		);
		const result = await getFlahaCalcExport("t_3");
		expect(result.fieldCapacity).toBeCloseTo(0.4, 5);
		expect(result.cec).toBe(22.5);
		expect(result.salinityRisk).toBe("Moderate");
		expect(result.sodiumRisk).toBe("Low");
		expect(result.warnings).toEqual(["pH outside optimal range"]);
	});
});
