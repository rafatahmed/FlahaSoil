/**
 * FlahaSOIL v2 API — reports.service unit tests (Phase 8D I.1b).
 *
 * Exercises the immutable-snapshot lifecycle on SoilReport + ReportVersion
 * end-to-end at the service layer, with `buildSoilTestReport` mocked so
 * the tests don't depend on the chemistry/interpretation engines.
 *
 * Coverage:
 *   1. generateReport creates a fresh SoilReport (GENERATING → READY) and
 *      a v1 ReportVersion with the composed snapshot stored verbatim.
 *   2. generateReport(existingReportId) appends v2 while preserving v1.
 *   3. Compose failure paths persist a FAILED ReportVersion + flip the
 *      parent SoilReport to FAILED, and rethrow as ApiError.internal.
 *   4. regenerateReport: 404 when the report doesn't exist; otherwise
 *      delegates to generateReport with the existing soilTestId.
 *   5. Read paths (getReport, getVersion, listVersions, listProjectReports)
 *      return the documented shapes and surface 404s for missing rows.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SoilReportStatus } from "@flaha/shared-types";

import {
	type PrismaClientLike,
	setPrismaClientForTesting,
} from "../../prisma/client";
import { ApiError } from "../../utils/apiError";
import {
	generateReport,
	getReport,
	getVersion,
	listProjectReports,
	listVersions,
	regenerateReport,
} from "../reports.service";
import { buildFixtureEnvelope } from "./fixtures/reportFixture";

vi.mock("../report.service", () => ({
	buildSoilTestReport: vi.fn(),
}));
import { buildSoilTestReport } from "../report.service";
const mockedBuildReport = vi.mocked(buildSoilTestReport);

interface Store {
	reports: Map<string, Record<string, unknown>>;
	versions: Map<string, Record<string, unknown>>;
	autoIdCounter: number;
}

function makeStore(): Store {
	return { reports: new Map(), versions: new Map(), autoIdCounter: 0 };
}

function nextId(store: Store, prefix: string): string {
	store.autoIdCounter += 1;
	return `${prefix}_${store.autoIdCounter}`;
}

const SOIL_TEST_ROW = {
	id: "st_1",
	textureInput: { sandPercent: 22, siltPercent: 38, clayPercent: 40 },
	chemistryInput: { pH: 8.4, ecDsM: 7.2 },
	sample: {
		id: "smp_1",
		userId: "u_1",
		projectId: "p_1",
		locationName: "North paddock",
		project: {
			id: "p_1",
			userId: "u_1",
			name: "Doha Pilot",
			code: "DOHA",
			owner: { id: "u_1", displayName: "Dr. R. Khashan", role: "ADMIN" },
		},
	},
};

function makeStubClient(store: Store, soilTestRow: unknown = SOIL_TEST_ROW): PrismaClientLike {
	const noop = async (): Promise<never> => {
		throw new Error("not implemented in stub");
	};
	const client = {
		$connect: async () => {},
		$disconnect: async () => {},
		$transaction: async (fn: (tx: PrismaClientLike) => Promise<unknown>) =>
			fn(client),
		user: {} as PrismaClientLike["user"],
		project: {} as PrismaClientLike["project"],
		soilSample: {} as PrismaClientLike["soilSample"],
		soilTest: {
			findUnique: async () => soilTestRow as Record<string, unknown> | null,
			findFirst: noop, findMany: noop, create: noop, update: noop,
			upsert: noop, delete: noop,
		} as unknown as PrismaClientLike["soilTest"],
		soilTextureInput: {} as PrismaClientLike["soilTextureInput"],
		soilChemistryInput: {} as PrismaClientLike["soilChemistryInput"],
		soilPhysicsResult: {} as PrismaClientLike["soilPhysicsResult"],
		soilChemistryResult: {} as PrismaClientLike["soilChemistryResult"],
		soilInterpretation: {} as PrismaClientLike["soilInterpretation"],
		soilLabValue: {} as PrismaClientLike["soilLabValue"],
		soilReport: {
			create: async (args: { data: Record<string, unknown> }) => {
				const id = nextId(store, "rpt");
				const now = new Date();
				const row = {
					id,
					archived: false,
					createdAt: now,
					updatedAt: now,
					currentVersionId: null,
					generatedAt: null,
					...args.data,
				};
				store.reports.set(id, row);
				return row;
			},
			update: async (args: {
				where: { id: string };
				data: Record<string, unknown>;
				include?: { currentVersion?: boolean };
			}) => {
				const row = store.reports.get(args.where.id);
				if (!row) throw new Error(`stub: SoilReport ${args.where.id} missing`);
				Object.assign(row, args.data, { updatedAt: new Date() });
				if (args.include?.currentVersion) {
					return {
						...row,
						currentVersion: row["currentVersionId"]
							? store.versions.get(row["currentVersionId"] as string) ?? null
							: null,
					};
				}
				return row;
			},
			findUnique: async (args: {
				where: { id: string };
				include?: { currentVersion?: boolean; versions?: unknown };
			}) => {
				const row = store.reports.get(args.where.id);
				if (!row) return null;
				const out: Record<string, unknown> = { ...row };
				if (args.include?.currentVersion) {
					out["currentVersion"] = row["currentVersionId"]
						? store.versions.get(row["currentVersionId"] as string) ?? null
						: null;
				}
				if (args.include?.versions) {
					out["versions"] = [...store.versions.values()]
						.filter((v) => v["reportId"] === args.where.id)
						.sort(
							(a, b) =>
								(b["versionNumber"] as number) -
								(a["versionNumber"] as number)
						);
				}
				return out;
			},
			findMany: async () => [...store.reports.values()],
			findFirst: noop, upsert: noop, delete: noop,
		} as unknown as PrismaClientLike["soilReport"],
		reportVersion: {
			create: async (args: { data: Record<string, unknown> }) => {
				const id = nextId(store, "ver");
				const row = { id, createdAt: new Date(), generatedAt: new Date(), ...args.data };
				store.versions.set(id, row);
				return row;
			},
			findFirst: async (args: {
				where?: { reportId?: string };
				orderBy?: { versionNumber?: "asc" | "desc" };
			}) => {
				const all = [...store.versions.values()].filter(
					(v) => !args.where?.reportId || v["reportId"] === args.where.reportId
				);
				if (all.length === 0) return null;
				const dir = args.orderBy?.versionNumber === "desc" ? -1 : 1;
				all.sort(
					(a, b) =>
						dir *
						((a["versionNumber"] as number) - (b["versionNumber"] as number))
				);
				return all[0] ?? null;
			},
			findUnique: async (args: {
				where: { reportId_versionNumber: { reportId: string; versionNumber: number } };
			}) => {
				const { reportId, versionNumber } = args.where.reportId_versionNumber;
				for (const row of store.versions.values()) {
					if (
						row["reportId"] === reportId &&
						row["versionNumber"] === versionNumber
					) {
						return row;
					}
				}
				return null;
			},
			findMany: async (args?: { where?: { reportId?: string } }) =>
				[...store.versions.values()]
					.filter(
						(v) =>
							!args?.where?.reportId || v["reportId"] === args.where.reportId
					)
					.sort(
						(a, b) =>
							(b["versionNumber"] as number) -
							(a["versionNumber"] as number)
					),
		} as unknown as PrismaClientLike["reportVersion"],
	} as unknown as PrismaClientLike;
	return client;
}

beforeEach(() => {
	mockedBuildReport.mockReset();
	mockedBuildReport.mockResolvedValue(buildFixtureEnvelope());
});

afterEach(() => {
	setPrismaClientForTesting(null);
});

describe("generateReport — first version", () => {
	it("creates a SoilReport (GENERATING → READY) and ReportVersion v1 with snapshot", async () => {
		const store = makeStore();
		setPrismaClientForTesting(makeStubClient(store));

		const res = await generateReport(
			"st_1",
			{ title: "Custom title" },
			"u_1"
		);

		expect(store.reports.size).toBe(1);
		expect(store.versions.size).toBe(1);
		const [report] = [...store.reports.values()];
		const [version] = [...store.versions.values()];
		expect(report!["status"]).toBe(SoilReportStatus.READY);
		expect(report!["currentVersionId"]).toBe(version!["id"]);
		expect(version!["versionNumber"]).toBe(1);
		expect(version!["status"]).toBe(SoilReportStatus.READY);
		expect(res.report.status).toBe(SoilReportStatus.READY);
		expect(res.report.latestVersionNumber).toBe(1);
		expect(res.version.versionNumber).toBe(1);
		expect(res.version.snapshot.schemaVersion).toBe("1.0");
	});

	it("derives reportNumber when no override is supplied and persists it", async () => {
		const store = makeStore();
		setPrismaClientForTesting(makeStubClient(store));
		await generateReport("st_1", {}, "u_1");
		const [report] = [...store.reports.values()];
		expect(report!["reportNumber"]).toMatch(/^DOHA-\d{4}-001$/);
	});
});

describe("generateReport — failure path", () => {
	it("persists a FAILED ReportVersion + flips report to FAILED and rethrows ApiError.internal", async () => {
		const store = makeStore();
		setPrismaClientForTesting(makeStubClient(store));
		mockedBuildReport.mockRejectedValueOnce(new Error("engine offline"));

		await expect(generateReport("st_1", {}, "u_1")).rejects.toBeInstanceOf(
			ApiError
		);

		expect(store.versions.size).toBe(1);
		const [version] = [...store.versions.values()];
		expect(version!["status"]).toBe(SoilReportStatus.FAILED);
		expect(version!["errorMessage"]).toBe("engine offline");
		const [report] = [...store.reports.values()];
		expect(report!["status"]).toBe(SoilReportStatus.FAILED);
		expect(report!["currentVersionId"]).toBeNull();
	});
});

describe("regenerateReport — appends v2 while preserving v1", () => {
	it("creates a v2 ReportVersion, keeps v1 row intact, and flips currentVersionId", async () => {
		const store = makeStore();
		setPrismaClientForTesting(makeStubClient(store));
		const first = await generateReport("st_1", {}, "u_1");
		const v1Snapshot = first.version.snapshot;

		const second = await regenerateReport(first.report.id, "u_1");

		expect(store.versions.size).toBe(2);
		const versions = [...store.versions.values()].sort(
			(a, b) => (a["versionNumber"] as number) - (b["versionNumber"] as number)
		);
		expect(versions.map((v) => v["versionNumber"])).toEqual([1, 2]);
		// v1 snapshot must be unchanged (immutable history).
		expect(versions[0]!["snapshotJson"]).toEqual(v1Snapshot);
		expect(second.version.versionNumber).toBe(2);
		expect(second.report.currentVersionId).toBe(versions[1]!["id"]);
		expect(second.report.latestVersionNumber).toBe(2);
	});

	it("throws ApiError.notFound for an unknown reportId", async () => {
		const store = makeStore();
		setPrismaClientForTesting(makeStubClient(store));
		await expect(regenerateReport("rpt_missing", "u_1")).rejects.toBeInstanceOf(
			ApiError
		);
	});
});

describe("read paths", () => {
	it("getReport returns report + sorted versions + currentVersion DTO", async () => {
		const store = makeStore();
		setPrismaClientForTesting(makeStubClient(store));
		const { report } = await generateReport("st_1", {}, "u_1");
		await regenerateReport(report.id, "u_1");

		const res = await getReport(report.id);

		expect(res.report.id).toBe(report.id);
		expect(res.versions.map((v) => v.versionNumber)).toEqual([2, 1]);
		expect(res.currentVersion?.versionNumber).toBe(2);
	});

	it("getReport throws ApiError.notFound for unknown reportId", async () => {
		setPrismaClientForTesting(makeStubClient(makeStore()));
		await expect(getReport("rpt_missing")).rejects.toBeInstanceOf(ApiError);
	});

	it("getVersion returns the matched version and 404s otherwise", async () => {
		const store = makeStore();
		setPrismaClientForTesting(makeStubClient(store));
		const { report } = await generateReport("st_1", {}, "u_1");
		const v1 = await getVersion(report.id, 1);
		expect(v1.versionNumber).toBe(1);
		await expect(getVersion(report.id, 99)).rejects.toBeInstanceOf(ApiError);
	});

	it("listVersions + listProjectReports return the documented shapes", async () => {
		const store = makeStore();
		setPrismaClientForTesting(makeStubClient(store));
		const { report } = await generateReport("st_1", {}, "u_1");
		await regenerateReport(report.id, "u_1");

		const vRes = await listVersions(report.id);
		expect(vRes.versions.map((v) => v.versionNumber)).toEqual([2, 1]);

		const pRes = await listProjectReports("p_1");
		// listProjectReports filters by soilTest.sample.projectId — the stub
		// doesn't replay that nested where, but it still returns the array
		// shape so callers can map over it safely.
		expect(Array.isArray(pRes.reports)).toBe(true);
	});
});
