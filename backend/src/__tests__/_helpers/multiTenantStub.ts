/**
 * FlahaSOIL v2 API — multi-tenant Prisma stub (Phase 9A-D.7).
 *
 * Backs the tenant-isolation and role-matrix HTTP tests with an
 * in-memory store that mirrors the slice of the Prisma surface those
 * tests exercise. Built around a small `MultiTenantDb` whose `seed*`
 * helpers let each test pre-populate Users / Orgs / Memberships and
 * the four tenant-scoped resources used by the v2 route guards
 * (Project / SoilSample / SoilTest / SoilReport).
 *
 * The stub deliberately models ONLY the queries reached during
 * authSession resolution + resource guard checks + the controllers'
 * happy-path writes for `POST /projects` and `POST /soil-samples`.
 * Anything richer (calculate, reports pipeline, etc.) is out of scope
 * here and stays covered by the dedicated unit suites.
 */

import {
	MembershipStatus,
	type OrganizationRole,
	OrganizationStatus,
	OrganizationType,
	ProjectStatus,
	UserRole,
} from "@flaha/shared-types";

import type { PrismaClientLike } from "../../prisma/client";

export interface SeededUser {
	id: string;
	email: string;
	displayName: string;
	role: UserRole;
	activeOrganizationId: string | null;
	createdAt: Date;
	updatedAt: Date;
	archivedAt: Date | null;
}

export interface SeededOrg {
	id: string;
	name: string;
	slug: string;
	type: OrganizationType;
	status: OrganizationStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface SeededMembership {
	id: string;
	organizationId: string;
	userId: string;
	role: OrganizationRole;
	status: MembershipStatus;
	invitedById: string | null;
	invitedAt: Date | null;
	acceptedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface SeededProject {
	id: string;
	userId: string;
	organizationId: string;
	name: string;
	code: string | null;
	description: string | null;
	locationName: string | null;
	status: ProjectStatus;
	createdAt: Date;
	updatedAt: Date;
}

export interface SeededSample {
	id: string;
	userId: string;
	organizationId: string;
	projectId: string;
	locationName: string | null;
	latitude: number | null;
	longitude: number | null;
	depthFromCm: number | null;
	depthToCm: number | null;
	sampleDate: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface SeededTest {
	id: string;
	sampleId: string;
	organizationId: string;
	testLevel: string;
	labName: string | null;
	labReference: string | null;
	testDate: Date | null;
	notes: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface SeededReport {
	id: string;
	soilTestId: string;
	organizationId: string;
	title: string | null;
	status: string;
	archivedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface MultiTenantDb {
	users: Map<string, SeededUser>;
	orgs: Map<string, SeededOrg>;
	memberships: SeededMembership[];
	projects: Map<string, SeededProject>;
	samples: Map<string, SeededSample>;
	tests: Map<string, SeededTest>;
	reports: Map<string, SeededReport>;
	auditLogs: Array<Record<string, unknown>>;
	seedOrg(opts: Partial<SeededOrg> & { id: string; name: string }): SeededOrg;
	seedUser(opts: Partial<SeededUser> & { id: string; email: string }): SeededUser;
	seedMembership(
		opts: Partial<SeededMembership> & {
			userId: string;
			organizationId: string;
			role: OrganizationRole;
		}
	): SeededMembership;
	seedProject(
		opts: Partial<SeededProject> & {
			id: string;
			userId: string;
			organizationId: string;
		}
	): SeededProject;
	seedSample(
		opts: Partial<SeededSample> & {
			id: string;
			userId: string;
			organizationId: string;
			projectId: string;
		}
	): SeededSample;
	seedTest(
		opts: Partial<SeededTest> & {
			id: string;
			sampleId: string;
			organizationId: string;
		}
	): SeededTest;
	seedReport(
		opts: Partial<SeededReport> & {
			id: string;
			soilTestId: string;
			organizationId: string;
		}
	): SeededReport;
}

export interface MultiTenantStub {
	prisma: PrismaClientLike;
	db: MultiTenantDb;
}

export function makeMultiTenantStub(): MultiTenantStub {
	const now = (): Date => new Date();
	const db: MultiTenantDb = {
		users: new Map(),
		orgs: new Map(),
		memberships: [],
		projects: new Map(),
		samples: new Map(),
		tests: new Map(),
		reports: new Map(),
		auditLogs: [],
		seedOrg(opts) {
			const row: SeededOrg = {
				slug: opts.slug ?? opts.id,
				type: opts.type ?? OrganizationType.COMPANY,
				status: opts.status ?? OrganizationStatus.ACTIVE,
				createdAt: opts.createdAt ?? now(),
				updatedAt: opts.updatedAt ?? now(),
				id: opts.id,
				name: opts.name,
			};
			db.orgs.set(row.id, row);
			return row;
		},
		seedUser(opts) {
			const row: SeededUser = {
				displayName: opts.displayName ?? opts.email,
				role: opts.role ?? UserRole.AGRONOMIST,
				activeOrganizationId: opts.activeOrganizationId ?? null,
				createdAt: opts.createdAt ?? now(),
				updatedAt: opts.updatedAt ?? now(),
				archivedAt: opts.archivedAt ?? null,
				id: opts.id,
				email: opts.email,
			};
			db.users.set(row.id, row);
			return row;
		},
		seedMembership(opts) {
			const row: SeededMembership = {
				id: opts.id ?? `mbr_${db.memberships.length + 1}`,
				status: opts.status ?? MembershipStatus.ACTIVE,
				invitedById: opts.invitedById ?? null,
				invitedAt: opts.invitedAt ?? null,
				acceptedAt: opts.acceptedAt ?? now(),
				createdAt: opts.createdAt ?? now(),
				updatedAt: opts.updatedAt ?? now(),
				userId: opts.userId,
				organizationId: opts.organizationId,
				role: opts.role,
			};
			db.memberships.push(row);
			return row;
		},
		seedProject(opts) {
			const row: SeededProject = {
				name: opts.name ?? `Project ${opts.id}`,
				code: opts.code ?? null,
				description: opts.description ?? null,
				locationName: opts.locationName ?? null,
				status: opts.status ?? ProjectStatus.ACTIVE,
				createdAt: opts.createdAt ?? now(),
				updatedAt: opts.updatedAt ?? now(),
				id: opts.id,
				userId: opts.userId,
				organizationId: opts.organizationId,
			};
			db.projects.set(row.id, row);
			return row;
		},
		seedSample(opts) {
			const row: SeededSample = {
				locationName: opts.locationName ?? null,
				latitude: opts.latitude ?? null,
				longitude: opts.longitude ?? null,
				depthFromCm: opts.depthFromCm ?? null,
				depthToCm: opts.depthToCm ?? null,
				sampleDate: opts.sampleDate ?? null,
				createdAt: opts.createdAt ?? now(),
				updatedAt: opts.updatedAt ?? now(),
				id: opts.id,
				userId: opts.userId,
				organizationId: opts.organizationId,
				projectId: opts.projectId,
			};
			db.samples.set(row.id, row);
			return row;
		},
		seedTest(opts) {
			const row: SeededTest = {
				testLevel: opts.testLevel ?? "BASIC",
				labName: opts.labName ?? null,
				labReference: opts.labReference ?? null,
				testDate: opts.testDate ?? null,
				notes: opts.notes ?? null,
				createdAt: opts.createdAt ?? now(),
				updatedAt: opts.updatedAt ?? now(),
				id: opts.id,
				sampleId: opts.sampleId,
				organizationId: opts.organizationId,
			};
			db.tests.set(row.id, row);
			return row;
		},
		seedReport(opts) {
			const row: SeededReport = {
				title: opts.title ?? null,
				status: opts.status ?? "DRAFT",
				archivedAt: opts.archivedAt ?? null,
				createdAt: opts.createdAt ?? now(),
				updatedAt: opts.updatedAt ?? now(),
				id: opts.id,
				soilTestId: opts.soilTestId,
				organizationId: opts.organizationId,
			};
			db.reports.set(row.id, row);
			return row;
		},
	};

	const prisma = buildPrisma(db);
	return { prisma, db };
}

function buildPrisma(db: MultiTenantDb): PrismaClientLike {
	let counter = 0;
	const nextId = (p: string): string => {
		counter += 1;
		return `${p}_gen_${counter}`;
	};

	const stub = {
		$connect: async () => undefined,
		$disconnect: async () => undefined,
		$transaction: async <R>(fn: (tx: PrismaClientLike) => Promise<R>) =>
			fn(stub as unknown as PrismaClientLike),
		user: {
			findUnique: async (args: { where: Record<string, unknown> }) => {
				const id = args.where["id"];
				if (typeof id === "string") return db.users.get(id) ?? null;
				return null;
			},
		},
		organization: {
			findUnique: async (args: { where: Record<string, unknown> }) => {
				const id = args.where["id"];
				if (typeof id === "string") return db.orgs.get(id) ?? null;
				return null;
			},
		},
		organizationMembership: {
			findMany: async (args: { where: Record<string, unknown> }) => {
				const userId = args.where["userId"];
				const status = args.where["status"] ?? "ACTIVE";
				return db.memberships
					.filter((m) => m.userId === userId && m.status === status)
					.map((m) => ({
						...m,
						organization: db.orgs.get(m.organizationId),
					}));
			},
		},
		project: {
			findUnique: async (args: { where: Record<string, unknown> }) => {
				const id = args.where["id"];
				if (typeof id !== "string") return null;
				return db.projects.get(id) ?? null;
			},
			findFirst: async (args: { where: Record<string, unknown> }) => {
				const id = args.where["id"];
				const organizationId = args.where["organizationId"];
				if (typeof id !== "string") return null;
				const row = db.projects.get(id);
				if (!row) return null;
				if (organizationId && row.organizationId !== organizationId) {
					return null;
				}
				const samples = [...db.samples.values()].filter(
					(s) => s.projectId === row.id
				);
				return { ...row, samples };
			},
			findMany: async (args: { where?: Record<string, unknown> } = {}) => {
				const organizationId = args.where?.["organizationId"];
				return [...db.projects.values()]
					.filter((p) =>
						organizationId ? p.organizationId === organizationId : true
					)
					.map((p) => ({ ...p, _count: { samples: 0 } }));
			},
			create: async (args: { data: Record<string, unknown> }) => {
				const id = nextId("prj");
				const row: SeededProject = {
					id,
					userId: args.data["userId"] as string,
					organizationId: args.data["organizationId"] as string,
					name: args.data["name"] as string,
					code: (args.data["code"] as string | undefined) ?? null,
					description:
						(args.data["description"] as string | undefined) ?? null,
					locationName:
						(args.data["locationName"] as string | undefined) ?? null,
					status:
						(args.data["status"] as ProjectStatus | undefined) ??
						ProjectStatus.ACTIVE,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
				db.projects.set(id, row);
				return row;
			},
		},
		soilSample: {
			findUnique: async (args: { where: Record<string, unknown> }) => {
				const id = args.where["id"];
				if (typeof id !== "string") return null;
				const row = db.samples.get(id);
				if (!row) return null;
				const project = db.projects.get(row.projectId) ?? null;
				const tests = [...db.tests.values()].filter(
					(t) => t.sampleId === row.id
				);
				return { ...row, project, tests };
			},
			create: async (args: { data: Record<string, unknown> }) => {
				const id = nextId("smp");
				const row: SeededSample = {
					id,
					userId: args.data["userId"] as string,
					organizationId: args.data["organizationId"] as string,
					projectId: args.data["projectId"] as string,
					locationName:
						(args.data["locationName"] as string | undefined) ?? null,
					latitude: (args.data["latitude"] as number | undefined) ?? null,
					longitude: (args.data["longitude"] as number | undefined) ?? null,
					depthFromCm:
						(args.data["depthFromCm"] as number | undefined) ?? null,
					depthToCm:
						(args.data["depthToCm"] as number | undefined) ?? null,
					sampleDate: (args.data["sampleDate"] as Date | null) ?? null,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
				db.samples.set(id, row);
				return row;
			},
		},
		soilTest: {
			findUnique: async (args: { where: Record<string, unknown> }) => {
				const id = args.where["id"];
				if (typeof id !== "string") return null;
				const row = db.tests.get(id);
				if (!row) return null;
				const sample = db.samples.get(row.sampleId);
				if (!sample) return null;
				const project = db.projects.get(sample.projectId) ?? null;
				return { ...row, sample: { ...sample, project } };
			},
		},
		soilReport: {
			findUnique: async (args: { where: Record<string, unknown> }) => {
				const id = args.where["id"];
				if (typeof id !== "string") return null;
				const row = db.reports.get(id);
				if (!row) return null;
				const test = db.tests.get(row.soilTestId);
				if (!test) return null;
				const sample = db.samples.get(test.sampleId);
				if (!sample) return null;
				const project = db.projects.get(sample.projectId) ?? null;
				return {
					...row,
					soilTest: { ...test, sample: { ...sample, project } },
				};
			},
		},
		auditLog: {
			create: async (args: { data: Record<string, unknown> }) => {
				db.auditLogs.push(args.data);
				return { id: nextId("audit"), ...args.data };
			},
		},
	};

	return stub as unknown as PrismaClientLike;
}
