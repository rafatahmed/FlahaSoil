/**
 * FlahaSOIL v2 API — Project service unit tests
 * (Phase 8A → 9A-D.5, trimmed in 9A-E).
 *
 * Pure unit tests against a stub Prisma client injected via
 * `setPrismaClientForTesting`. They lock in the read/write contract
 * documented in `docs/v2-api-contracts.md`:
 *
 *   - createProject persists exactly the columns it should (now
 *     including the authoritative organizationId from the actor) and
 *     rejects a duplicate (userId, code) with a typed 400 instead of
 *     a 500.
 *   - listProjects scopes by organizationId and exposes _count.samples.
 *   - getProjectById refuses to leak across tenants.
 *
 * Phase 9A-D.5 swapped the first parameter of `createProject` for an
 * `AuthorActor` ({ userId, organizationId }) and the lookup parameter
 * of `listProjects` / `getProjectById` for `organizationId`. Phase
 * 9A-E removed the legacy `assertProjectOwnership(id, userId)` helper;
 * cross-tenant 404 coverage now lives in
 * `auth/__tests__/ownership.test.ts` under `assertProjectTenancy`.
 */
import { afterEach, describe, expect, it } from "vitest";

import { ProjectStatus } from "@flaha/shared-types";

import {
	type PrismaClientLike,
	setPrismaClientForTesting,
} from "../../prisma/client";
import { ApiError } from "../../utils/apiError";
import {
	createProject,
	getProjectById,
	listProjects,
} from "../projects.service";

afterEach(() => {
	setPrismaClientForTesting(null);
});

interface ProjectStubOptions {
	readonly findFirstResult?: Record<string, unknown> | null;
	readonly findManyResult?: Array<Record<string, unknown>>;
	readonly createImpl?: (args: { data: Record<string, unknown> }) => Promise<
		Record<string, unknown>
	>;
}

function makeProjectStub(opts: ProjectStubOptions = {}): {
	client: PrismaClientLike;
	calls: {
		create: Array<{ data: Record<string, unknown> }>;
		findMany: Array<Record<string, unknown>>;
		findFirst: Array<Record<string, unknown>>;
	};
} {
	const calls = {
		create: [] as Array<{ data: Record<string, unknown> }>,
		findMany: [] as Array<Record<string, unknown>>,
		findFirst: [] as Array<Record<string, unknown>>,
	};
	const noop = async (): Promise<never> => {
		throw new Error("not implemented in stub");
	};
	const defaultCreate = async (args: { data: Record<string, unknown> }) => ({
		id: "proj_1",
		...args.data,
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	});
	const project = {
		create: async (args: { data: unknown }) => {
			calls.create.push({ data: args.data as Record<string, unknown> });
			return (opts.createImpl ?? defaultCreate)({
				data: args.data as Record<string, unknown>,
			});
		},
		findMany: async (args: Record<string, unknown>) => {
			calls.findMany.push(args);
			return opts.findManyResult ?? [];
		},
		findFirst: async (args: Record<string, unknown>) => {
			calls.findFirst.push(args);
			return opts.findFirstResult ?? null;
		},
		findUnique: noop,
		update: noop,
		upsert: noop,
		delete: noop,
	} as unknown as PrismaClientLike["project"];

	const client = { project } as unknown as PrismaClientLike;
	return { client, calls };
}

const ACTOR = { userId: "u_1", organizationId: "org_acme" } as const;

describe("createProject", () => {
	it("persists only the supplied optional columns and defaults status to ACTIVE", async () => {
		const { client, calls } = makeProjectStub();
		setPrismaClientForTesting(client);

		const res = await createProject(ACTOR, {
			name: "Doha Pilot",
			code: "DOHA-01",
		});

		expect(calls.create).toHaveLength(1);
		expect(calls.create[0]!.data).toEqual({
			userId: "u_1",
			organizationId: "org_acme",
			name: "Doha Pilot",
			status: ProjectStatus.ACTIVE,
			code: "DOHA-01",
		});
		expect(res.project.id).toBe("proj_1");
		expect(res.project.status).toBe(ProjectStatus.ACTIVE);
	});

	it("translates a Prisma P2002 unique-key error into a typed ApiError", async () => {
		const { client } = makeProjectStub({
			createImpl: async () => {
				const err = Object.assign(new Error("Unique constraint failed"), {
					code: "P2002",
				});
				throw err;
			},
		});
		setPrismaClientForTesting(client);

		await expect(
			createProject(ACTOR, { name: "Dup", code: "DOHA-01" })
		).rejects.toBeInstanceOf(ApiError);
	});

	// Phase 9A-D.5 — the actor's organizationId is the authoritative
	// tenant boundary, sourced from the resolved authSession at the
	// controller layer and persisted verbatim onto the new row.
	it("tags the new row with the actor's organizationId", async () => {
		const { client, calls } = makeProjectStub();
		setPrismaClientForTesting(client);

		await createProject(
			{ userId: "u_1", organizationId: "org_acme" },
			{ name: "Acme Trial" }
		);

		expect(calls.create).toHaveLength(1);
		expect(calls.create[0]!.data["organizationId"]).toBe("org_acme");
	});
});

describe("listProjects", () => {
	it("scopes by organizationId and reports _count.samples", async () => {
		const { client, calls } = makeProjectStub({
			findManyResult: [
				{
					id: "p_a",
					name: "A",
					code: null,
					status: ProjectStatus.ACTIVE,
					createdAt: new Date("2026-01-02T00:00:00.000Z"),
					updatedAt: new Date("2026-01-02T00:00:00.000Z"),
					_count: { samples: 3 },
				},
			],
		});
		setPrismaClientForTesting(client);

		const res = await listProjects("org_acme", {});

		expect(calls.findMany[0]!["where"]).toEqual({ organizationId: "org_acme" });
		expect(res.projects).toHaveLength(1);
		expect(res.projects[0]!.sampleCount).toBe(3);
	});
});

describe("getProjectById", () => {
	it("returns the project and its samples when the tenant owns it", async () => {
		const { client, calls } = makeProjectStub({
			findFirstResult: {
				id: "p_1",
				userId: "u_1",
				organizationId: "org_acme",
				name: "Doha",
				code: null,
				description: null,
				locationName: null,
				status: ProjectStatus.ACTIVE,
				createdAt: new Date("2026-01-01T00:00:00.000Z"),
				updatedAt: new Date("2026-01-01T00:00:00.000Z"),
				samples: [
					{
						id: "s_1",
						userId: "u_1",
						projectId: "p_1",
						locationName: "Field A",
						latitude: null,
						longitude: null,
						depthFromCm: 0,
						depthToCm: 30,
						sampleDate: null,
						createdAt: new Date("2026-01-01T00:00:00.000Z"),
						updatedAt: new Date("2026-01-01T00:00:00.000Z"),
					},
				],
			},
		});
		setPrismaClientForTesting(client);

		const res = await getProjectById("p_1", "org_acme");

		expect(calls.findFirst[0]!["where"]).toEqual({
			id: "p_1",
			organizationId: "org_acme",
		});
		expect(res.project.id).toBe("p_1");
		expect(res.samples).toHaveLength(1);
		expect(res.samples[0]!.id).toBe("s_1");
	});

	it("throws ApiError.notFound when no row matches the tenant", async () => {
		const { client } = makeProjectStub({ findFirstResult: null });
		setPrismaClientForTesting(client);

		await expect(getProjectById("p_x", "org_acme")).rejects.toBeInstanceOf(
			ApiError
		);
	});
});

