/**
 * FlahaSOIL v2 API — Phase 10A.8 in-memory Prisma store.
 *
 * A deterministic, DB-free stand-in for the generated Prisma v2 client
 * that supports exactly the delegates the golden regression pipeline
 * touches:
 *
 *   - `soilTest.findUnique`            (read test + relations)
 *   - `soilPhysicsResult.upsert`       (persist physics result)
 *   - `soilChemistryResult.upsert`     (persist chemistry result)
 *   - `soilInterpretation.upsert`      (persist interpretation)
 *
 * Upserts mutate the backing record so a subsequent `findUnique`
 * (issued by `buildSoilTestReport`) observes exactly what
 * `calculateSoilTest` just wrote — mirroring the production round-trip
 * without a database. Every other delegate is a throwing stub so an
 * accidental new dependency fails loudly instead of reading null.
 */
import type { PrismaClientLike } from "../../../prisma/client";
import { GOLDEN_TS, type GoldenSoilTest } from "./goldenSoilTests";

interface TestRecord {
	base: Record<string, unknown>;
	sample: Record<string, unknown>;
	textureInput: Record<string, unknown> | null;
	chemistryInput: Record<string, unknown> | null;
	physicsResult: Record<string, unknown> | null;
	chemistryResult: Record<string, unknown> | null;
	interpretation: Record<string, unknown> | null;
}

function mergedRow(rec: TestRecord): Record<string, unknown> {
	return {
		...rec.base,
		sample: rec.sample,
		textureInput: rec.textureInput,
		chemistryInput: rec.chemistryInput,
		physicsResult: rec.physicsResult,
		chemistryResult: rec.chemistryResult,
		interpretation: rec.interpretation,
	};
}

function throwingDelegate(model: string): PrismaClientLike["soilTest"] {
	const fail = async (): Promise<never> => {
		throw new Error(`golden store: ${model} delegate not implemented`);
	};
	return {
		create: fail,
		findUnique: fail,
		findFirst: fail,
		update: fail,
		updateMany: fail,
		upsert: fail,
		delete: fail,
		findMany: fail,
		count: fail,
	} as unknown as PrismaClientLike["soilTest"];
}

/**
 * Builds a {@link PrismaClientLike} seeded with the supplied golden
 * tests. Each `*Result` upsert writes back into the matching record so
 * the report builder reads the freshly-computed values.
 */
export function createGoldenStore(tests: GoldenSoilTest[]): PrismaClientLike {
	const records = new Map<string, TestRecord>();
	for (const t of tests) {
		records.set(t.id, {
			base: t.base,
			sample: t.sample,
			textureInput: t.textureInput,
			chemistryInput: t.chemistryInput,
			physicsResult: null,
			chemistryResult: null,
			interpretation: null,
		});
	}

	const requireRecord = (soilTestId: string): TestRecord => {
		const rec = records.get(soilTestId);
		if (!rec) throw new Error(`golden store: unknown soilTestId ${soilTestId}`);
		return rec;
	};

	const upsertInto = (field: keyof TestRecord) =>
		async (args: {
			where: Record<string, unknown>;
			create: Record<string, unknown>;
		}): Promise<Record<string, unknown>> => {
			const soilTestId = String(args.where["soilTestId"]);
			const rec = requireRecord(soilTestId);
			const row = {
				id: `${String(field)}_${soilTestId}`,
				...args.create,
				createdAt: GOLDEN_TS,
				updatedAt: GOLDEN_TS,
			};
			(rec[field] as Record<string, unknown>) = row;
			return row;
		};

	const soilTest = {
		...throwingDelegate("soilTest"),
		findUnique: async (args: { where: Record<string, unknown> }) => {
			const rec = requireRecord(String(args.where["id"]));
			return mergedRow(rec);
		},
	} as unknown as PrismaClientLike["soilTest"];

	const soilPhysicsResult = {
		...throwingDelegate("soilPhysicsResult"),
		upsert: upsertInto("physicsResult"),
	} as unknown as PrismaClientLike["soilPhysicsResult"];

	const soilChemistryResult = {
		...throwingDelegate("soilChemistryResult"),
		upsert: upsertInto("chemistryResult"),
	} as unknown as PrismaClientLike["soilChemistryResult"];

	const soilInterpretation = {
		...throwingDelegate("soilInterpretation"),
		upsert: upsertInto("interpretation"),
	} as unknown as PrismaClientLike["soilInterpretation"];

	return {
		$connect: async () => {},
		$disconnect: async () => {},
		$transaction: async (fn) => fn({} as PrismaClientLike),
		user: throwingDelegate("user"),
		organization: throwingDelegate("organization"),
		organizationMembership: throwingDelegate("organizationMembership"),
		organizationInvitation: throwingDelegate("organizationInvitation"),
		refreshToken: throwingDelegate("refreshToken"),
		auditLog: throwingDelegate("auditLog"),
		project: throwingDelegate("project"),
		soilSample: throwingDelegate("soilSample"),
		soilTest,
		soilTextureInput: throwingDelegate("soilTextureInput"),
		soilChemistryInput: throwingDelegate("soilChemistryInput"),
		soilPhysicsResult,
		soilChemistryResult,
		soilInterpretation,
		soilReport: throwingDelegate("soilReport"),
		reportVersion: throwingDelegate(
			"reportVersion"
		) as PrismaClientLike["reportVersion"],
		soilLabValue: throwingDelegate("soilLabValue"),
	};
}
