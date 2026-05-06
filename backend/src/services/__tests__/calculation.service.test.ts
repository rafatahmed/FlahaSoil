/**
 * FlahaSOIL v2 API — calculation orchestration tests.
 *
 * Pure unit tests against a stub Prisma client (injected via
 * `setPrismaClientForTesting`). They lock in the Phase-7B fix that
 * PRELIMINARY-style soil tests (pH/EC only, no cations / CEC) must
 * not surface a `CALCULATION_ERROR` from the chemistry engine.
 *
 * Coverage:
 *   1. PRELIMINARY: pH/EC-only calculation succeeds, no
 *      `SoilChemistryResult` is upserted, a skip warning is returned,
 *      and interpretation still classifies pH and salinity.
 *   2. MODERATE: a full cation panel produces a `SoilChemistryResult`
 *      and the chemistry upsert IS invoked (no skip warning).
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	type PrismaClientLike,
	setPrismaClientForTesting,
} from "../../prisma/client";
import { calculateSoilTest } from "../calculation.service";

interface SoilTestRow extends Record<string, unknown> {
	id: string;
	textureInput: Record<string, unknown> | null;
	chemistryInput: Record<string, unknown> | null;
	physicsResult: Record<string, unknown> | null;
	chemistryResult: Record<string, unknown> | null;
}

function makeStubPrisma(row: SoilTestRow): {
	client: PrismaClientLike;
	upserts: { model: string; data: Record<string, unknown> }[];
} {
	const upserts: { model: string; data: Record<string, unknown> }[] = [];
	const noop = async (): Promise<never> => {
		throw new Error("not implemented in stub");
	};
	const recordingUpsert =
		(model: string) =>
		async (args: { create: Record<string, unknown> }) => {
			upserts.push({ model, data: args.create });
			return { ...args.create, id: `${model}_id` };
		};

	const delegate = (overrides: Partial<PrismaClientLike["soilTest"]>) =>
		({
			create: noop,
			findUnique: noop,
			findFirst: noop,
			update: noop,
			upsert: noop,
			delete: noop,
			findMany: noop,
			...overrides,
		}) as unknown as PrismaClientLike["soilTest"];

	const client: PrismaClientLike = {
		$connect: async () => {},
		$disconnect: async () => {},
		$transaction: async (fn) => fn({} as PrismaClientLike),
		soilSample: delegate({}),
		soilTest: delegate({
			findUnique: async () => row,
		}),
		soilTextureInput: delegate({}),
		soilChemistryInput: delegate({}),
		soilPhysicsResult: delegate({ upsert: recordingUpsert("physics") }),
		soilChemistryResult: delegate({
			upsert: recordingUpsert("chemistry"),
		}),
		soilInterpretation: delegate({
			upsert: recordingUpsert("interpretation"),
		}),
		soilReport: delegate({}),
		soilLabValue: delegate({}),
	};
	return { client, upserts };
}

afterEach(() => {
	setPrismaClientForTesting(null);
	vi.restoreAllMocks();
});

const baseTexture = {
	sandPercent: 40,
	siltPercent: 40,
	clayPercent: 20,
	organicMatterPercent: 2.5,
	bulkDensity: 1.3,
	gravelPercent: 0,
	source: "LAB",
};

describe("calculateSoilTest — PRELIMINARY pH/EC-only input", () => {
	const phEcChemistry = { pH: 7.4, ecDsM: 1.2, source: "LAB" };

	it("succeeds without invoking the chemistry engine", async () => {
		const { client, upserts } = makeStubPrisma({
			id: "t_pre",
			textureInput: baseTexture,
			chemistryInput: phEcChemistry,
			physicsResult: null,
			chemistryResult: null,
		});
		setPrismaClientForTesting(client);

		const res = await calculateSoilTest("t_pre", {
			runPhysics: true,
			runChemistry: true,
			runInterpretation: true,
			calculationMode: "LAB",
		});

		expect(res.physicsResult).toBeDefined();
		expect(res.chemistryResult).toBeUndefined();
		expect(upserts.some((u) => u.model === "chemistry")).toBe(false);
		expect(res.warnings.some((w) => /Chemistry calculation skipped/i.test(w))).toBe(true);
		expect(
			res.warningDetails.some(
				(w) => w.code === "CHEMISTRY_SKIPPED_PRELIMINARY"
			)
		).toBe(true);
		expect(res.interpretation?.phCategory).toBe("Neutral");
		expect(res.interpretation?.salinityRisk).toBe("Low");
	});
});

describe("calculateSoilTest — salinity normalization wiring", () => {
	it("derives EC from TDS-only PRELIMINARY input (no inconsistency warning)", async () => {
		const { client } = makeStubPrisma({
			id: "t_tds",
			textureInput: baseTexture,
			chemistryInput: { pH: 7.4, tdsMgL: 1280, source: "LAB" },
			physicsResult: null,
			chemistryResult: null,
		});
		setPrismaClientForTesting(client);

		const res = await calculateSoilTest("t_tds", {
			runPhysics: true,
			runChemistry: true,
			runInterpretation: true,
			calculationMode: "LAB",
		});

		// EC = 1280/640 = 2.0 dS/m → "Moderate" salinity per the
		// interpretation engine's standard thresholds.
		expect(res.interpretation?.salinityRisk).toBe("Moderate");
		expect(
			res.warnings.some((w) => /TDS inconsistent with EC/i.test(w))
		).toBe(false);
		expect(
			res.warningDetails.some((w) => w.code === "EC_DERIVED_FROM_TDS")
		).toBe(true);
	});

	it("warns and keeps EC authoritative when supplied TDS disagrees by >20 %", async () => {
		const { client } = makeStubPrisma({
			id: "t_inc",
			textureInput: baseTexture,
			chemistryInput: { pH: 7.4, ecDsM: 1.0, tdsMgL: 1000, source: "LAB" },
			physicsResult: null,
			chemistryResult: null,
		});
		setPrismaClientForTesting(client);

		const res = await calculateSoilTest("t_inc", {
			runPhysics: true,
			runChemistry: true,
			runInterpretation: true,
			calculationMode: "LAB",
		});

		expect(
			res.warnings.some((w) => /TDS inconsistent with EC/i.test(w))
		).toBe(true);
		const tdsWarn = res.warningDetails.find(
			(w) => w.code === "TDS_INCONSISTENT_WITH_EC"
		);
		expect(tdsWarn).toBeDefined();
		expect(tdsWarn?.severity).toBe("warning");
		expect(tdsWarn?.details).toMatchObject({
			ecDsM: 1.0,
			suppliedTdsMgL: 1000,
			expectedTdsMgL: 640,
		});
		// EC=1.0 dS/m → "Low" salinity, proving the EC value (not TDS)
		// flowed through to interpretation.
		expect(res.interpretation?.salinityRisk).toBe("Low");
	});
});

describe("calculateSoilTest — MODERATE with full cation panel", () => {
	const fullChemistry = {
		pH: 7.4, ecDsM: 0.8,
		cec: 18, ca: 11, mg: 3, k: 0.6, na: 0.4,
		n: 25, p: 18, source: "LAB",
	};

	it("invokes the chemistry engine and persists SoilChemistryResult", async () => {
		const { client, upserts } = makeStubPrisma({
			id: "t_mod",
			textureInput: baseTexture,
			chemistryInput: fullChemistry,
			physicsResult: null,
			chemistryResult: null,
		});
		setPrismaClientForTesting(client);

		const res = await calculateSoilTest("t_mod", {
			runPhysics: true,
			runChemistry: true,
			runInterpretation: true,
			calculationMode: "LAB",
		});

		expect(res.chemistryResult).toBeDefined();
		expect(upserts.some((u) => u.model === "chemistry")).toBe(true);
		expect(res.warnings.some((w) => /Chemistry calculation skipped/i.test(w))).toBe(false);
	});
});
