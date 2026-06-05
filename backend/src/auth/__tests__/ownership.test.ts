/**
 * FlahaSOIL v2 API — tenant isolation tests (Phase 9A-E).
 *
 * Locks in the cross-tenant 404 behaviour enforced by the helpers in
 * `auth/ownership.ts`:
 *
 *     - assertProjectTenancy
 *     - assertSampleTenancy
 *     - assertSoilTestTenancy
 *     - assertReportTenancy
 *
 * Stub-Prisma only — no DB access. Cross-tenant matches return 404 (not
 * 403) so the API never reveals that a resource exists in another org.
 * The legacy `assert*Ownership(id, userId)` helpers were removed in
 * 9A-E along with the dev-session middleware that fed them.
 */
import { afterEach, describe, expect, it } from "vitest";

import {
	assertProjectTenancy,
	assertReportTenancy,
	assertSampleTenancy,
	assertSoilTestTenancy,
} from "../ownership";
import {
	type PrismaClientLike,
	setPrismaClientForTesting,
} from "../../prisma/client";
import { ApiError } from "../../utils/apiError";

afterEach(() => {
	setPrismaClientForTesting(null);
});

const noop = async (): Promise<never> => {
	throw new Error("not implemented in stub");
};

function makeClientWith(
	overrides: Partial<{
		project: unknown;
		sample: unknown;
		soilTest: unknown;
		report: unknown;
	}>
): PrismaClientLike {
	return {
		$connect: async () => {},
		$disconnect: async () => {},
		$transaction: noop,
		user: {} as PrismaClientLike["user"],
		project: {
			findUnique: async () =>
				overrides.project as Record<string, unknown> | null,
			findFirst: noop, findMany: noop, create: noop,
			update: noop, upsert: noop, delete: noop,
		} as unknown as PrismaClientLike["project"],
		soilSample: {
			findUnique: async () => overrides.sample as Record<string, unknown> | null,
			findFirst: noop, findMany: noop, create: noop,
			update: noop, upsert: noop, delete: noop,
		} as unknown as PrismaClientLike["soilSample"],
		soilTest: {
			findUnique: async () =>
				overrides.soilTest as Record<string, unknown> | null,
			findFirst: noop, findMany: noop, create: noop,
			update: noop, upsert: noop, delete: noop,
		} as unknown as PrismaClientLike["soilTest"],
		soilTextureInput: {} as PrismaClientLike["soilTextureInput"],
		soilChemistryInput: {} as PrismaClientLike["soilChemistryInput"],
		soilPhysicsResult: {} as PrismaClientLike["soilPhysicsResult"],
		soilChemistryResult: {} as PrismaClientLike["soilChemistryResult"],
		soilInterpretation: {} as PrismaClientLike["soilInterpretation"],
		soilLabValue: {} as PrismaClientLike["soilLabValue"],
		soilReport: {
			findUnique: async () =>
				overrides.report as Record<string, unknown> | null,
			findFirst: noop, findMany: noop, create: noop,
			update: noop, upsert: noop, delete: noop,
		} as unknown as PrismaClientLike["soilReport"],
		reportVersion: {} as PrismaClientLike["reportVersion"],
	} as unknown as PrismaClientLike;
}

describe("assertProjectTenancy", () => {
	it("404s when the project row does not exist", async () => {
		setPrismaClientForTesting(makeClientWith({ project: null }));
		await expect(
			assertProjectTenancy("prj_x", "org_1")
		).rejects.toBeInstanceOf(ApiError);
	});

	it("404s when the project belongs to a different organization", async () => {
		setPrismaClientForTesting(
			makeClientWith({ project: { organizationId: "org_2" } })
		);
		await expect(
			assertProjectTenancy("prj_1", "org_1")
		).rejects.toBeInstanceOf(ApiError);
	});

	it("404s when the project has no organizationId (legacy unbackfilled row)", async () => {
		setPrismaClientForTesting(
			makeClientWith({ project: { organizationId: null } })
		);
		await expect(
			assertProjectTenancy("prj_1", "org_1")
		).rejects.toBeInstanceOf(ApiError);
	});

	it("resolves with the organizationId when tenant matches", async () => {
		setPrismaClientForTesting(
			makeClientWith({ project: { organizationId: "org_1" } })
		);
		const res = await assertProjectTenancy("prj_1", "org_1");
		expect(res.organizationId).toBe("org_1");
	});
});

describe("assertSampleTenancy", () => {
	it("404s when the sample row does not exist", async () => {
		setPrismaClientForTesting(makeClientWith({ sample: null }));
		await expect(
			assertSampleTenancy("smp_x", "org_1")
		).rejects.toBeInstanceOf(ApiError);
	});

	it("404s when the sample's project belongs to a different organization", async () => {
		setPrismaClientForTesting(
			makeClientWith({
				sample: {
					organizationId: "org_1",
					project: { organizationId: "org_2" },
				},
			})
		);
		await expect(
			assertSampleTenancy("smp_1", "org_1")
		).rejects.toBeInstanceOf(ApiError);
	});

	it("resolves when the parent project's organizationId matches", async () => {
		setPrismaClientForTesting(
			makeClientWith({
				sample: {
					organizationId: "org_1",
					project: { organizationId: "org_1" },
				},
			})
		);
		await expect(
			assertSampleTenancy("smp_1", "org_1")
		).resolves.toBeUndefined();
	});

	it("falls back to denormalized sample.organizationId when project is null", async () => {
		setPrismaClientForTesting(
			makeClientWith({
				sample: { organizationId: "org_1", project: null },
			})
		);
		await expect(
			assertSampleTenancy("smp_1", "org_1")
		).resolves.toBeUndefined();
	});
});

describe("assertSoilTestTenancy", () => {
	it("404s when the test row does not exist", async () => {
		setPrismaClientForTesting(makeClientWith({ soilTest: null }));
		await expect(
			assertSoilTestTenancy("st_x", "org_1")
		).rejects.toBeInstanceOf(ApiError);
	});

	it("404s when the test's sample resolves to a different organization", async () => {
		setPrismaClientForTesting(
			makeClientWith({
				soilTest: {
					sample: {
						organizationId: "org_1",
						project: { organizationId: "org_2" },
					},
				},
			})
		);
		await expect(
			assertSoilTestTenancy("st_1", "org_1")
		).rejects.toBeInstanceOf(ApiError);
	});

	it("resolves when the sample's project organizationId matches", async () => {
		setPrismaClientForTesting(
			makeClientWith({
				soilTest: {
					sample: {
						organizationId: "org_1",
						project: { organizationId: "org_1" },
					},
				},
			})
		);
		await expect(
			assertSoilTestTenancy("st_1", "org_1")
		).resolves.toBeUndefined();
	});
});

describe("assertReportTenancy", () => {
	const foreignReport = {
		soilTestId: "st_42",
		soilTest: {
			sample: {
				organizationId: "org_1",
				project: { organizationId: "org_2" },
			},
		},
	};
	const ownReport = {
		soilTestId: "st_7",
		soilTest: {
			sample: {
				organizationId: "org_1",
				project: { organizationId: "org_1" },
			},
		},
	};

	it("404s when the report row does not exist", async () => {
		setPrismaClientForTesting(makeClientWith({ report: null }));
		await expect(
			assertReportTenancy("rpt_x", "org_1")
		).rejects.toBeInstanceOf(ApiError);
	});

	it("404s when the report belongs to a different organization — no soilTestId leak", async () => {
		setPrismaClientForTesting(makeClientWith({ report: foreignReport }));
		await expect(
			assertReportTenancy("rpt_x", "org_1")
		).rejects.toBeInstanceOf(ApiError);
	});

	it("returns the resolved soilTestId for an in-tenant report", async () => {
		setPrismaClientForTesting(makeClientWith({ report: ownReport }));
		const res = await assertReportTenancy("rpt_1", "org_1");
		expect(res.soilTestId).toBe("st_7");
	});
});

