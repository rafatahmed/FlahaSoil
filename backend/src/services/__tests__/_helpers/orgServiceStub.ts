/**
 * FlahaSOIL v2 API — focused Prisma stub for OrganizationService tests.
 *
 * Models only the queries reached by `services/organization.service.ts`:
 * Users (findUnique, update), Organizations (findUnique, update),
 * OrganizationMemberships (findFirst/findMany/create/update),
 * OrganizationInvitations (full CRUD incl. updateMany + delete),
 * AuditLog (create). Anything else throws so the test surface stays
 * intentionally narrow.
 */

import {
	MembershipStatus,
	type OrganizationRole,
	OrganizationStatus,
	OrganizationType,
} from "@flaha/shared-types";

import type { PrismaClientLike } from "../../../prisma/client";

export interface StubUser {
	id: string;
	email: string;
	displayName: string;
	activeOrganizationId: string | null;
}
export interface StubOrg {
	id: string;
	name: string;
	slug: string;
	type: OrganizationType;
	status: OrganizationStatus;
	createdAt: Date;
	updatedAt: Date;
}
export interface StubMembership {
	id: string;
	userId: string;
	organizationId: string;
	role: OrganizationRole;
	status: MembershipStatus | "REMOVED" | "ACTIVE";
	invitedById: string | null;
	invitedAt: Date | null;
	acceptedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}
export interface StubInvitation {
	id: string;
	organizationId: string;
	email: string;
	role: OrganizationRole;
	status: "PENDING" | "ACCEPTED" | "EXPIRED" | "REVOKED";
	tokenHash: string;
	invitedByUserId: string;
	expiresAt: Date;
	acceptedAt: Date | null;
	revokedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface OrgServiceDb {
	users: Map<string, StubUser>;
	orgs: Map<string, StubOrg>;
	memberships: StubMembership[];
	invitations: StubInvitation[];
	auditLogs: Array<Record<string, unknown>>;
	/** Captured raw invitation tokens, in insertion order. */
	tokens: string[];
	seedOrg(opts: Partial<StubOrg> & { id: string; name: string }): StubOrg;
	seedUser(opts: Partial<StubUser> & { id: string; email: string }): StubUser;
	seedMembership(
		opts: Partial<StubMembership> & {
			userId: string;
			organizationId: string;
			role: OrganizationRole;
		}
	): StubMembership;
	pushToken(raw: string): void;
}

export interface OrgServiceStub {
	prisma: PrismaClientLike;
	db: OrgServiceDb;
}

function matches(row: Record<string, unknown>, where: Record<string, unknown>): boolean {
	for (const [k, v] of Object.entries(where)) {
		if (v && typeof v === "object" && "not" in (v as Record<string, unknown>)) {
			if (row[k] === (v as { not: unknown }).not) return false;
			continue;
		}
		if (v && typeof v === "object" && "lt" in (v as Record<string, unknown>)) {
			const cmp = (v as { lt: unknown }).lt;
			if (!(row[k] instanceof Date) || !(cmp instanceof Date)) return false;
			if (!((row[k] as Date) < (cmp as Date))) return false;
			continue;
		}
		if (row[k] !== v) return false;
	}
	return true;
}

export function makeOrgServiceStub(): OrgServiceStub {
	const now = (): Date => new Date();
	let counter = 0;
	const nextId = (p: string): string => `${p}_gen_${++counter}`;
	const db: OrgServiceDb = {
		users: new Map(),
		orgs: new Map(),
		memberships: [],
		invitations: [],
		auditLogs: [],
		tokens: [],
		seedOrg(opts) {
			const row: StubOrg = {
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
			const row: StubUser = {
				displayName: opts.displayName ?? opts.email,
				activeOrganizationId: opts.activeOrganizationId ?? null,
				id: opts.id,
				email: opts.email,
			};
			db.users.set(row.id, row);
			return row;
		},
		seedMembership(opts) {
			const row: StubMembership = {
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
		pushToken: (raw) => {
			db.tokens.push(raw);
		},
	};
	return { prisma: buildStubClient(db, nextId), db };
}

function buildStubClient(
	db: OrgServiceDb,
	nextId: (p: string) => string
): PrismaClientLike {
	const stub: Record<string, unknown> = {
		$connect: async () => undefined,
		$disconnect: async () => undefined,
		$transaction: async <R>(fn: (tx: PrismaClientLike) => Promise<R>) =>
			fn(stub as unknown as PrismaClientLike),
		user: {
			findUnique: async (args: { where: Record<string, unknown> }) => {
				const id = args.where["id"];
				if (typeof id === "string") return db.users.get(id) ?? null;
				const email = args.where["email"];
				if (typeof email === "string") {
					for (const u of db.users.values()) {
						if (u.email.toLowerCase() === email.toLowerCase()) return u;
					}
				}
				return null;
			},
			update: async (args: {
				where: Record<string, unknown>;
				data: Record<string, unknown>;
			}) => {
				const id = args.where["id"] as string;
				const row = db.users.get(id);
				if (!row) throw new Error("user not found");
				Object.assign(row, args.data);
				return row;
			},
		},
		organization: {
			findUnique: async (args: { where: Record<string, unknown> }) => {
				const id = args.where["id"];
				return typeof id === "string" ? (db.orgs.get(id) ?? null) : null;
			},
			update: async (args: {
				where: Record<string, unknown>;
				data: Record<string, unknown>;
			}) => {
				const id = args.where["id"] as string;
				const row = db.orgs.get(id);
				if (!row) throw new Error("org not found");
				Object.assign(row, args.data, { updatedAt: new Date() });
				return row;
			},
		},
		organizationMembership: {
			findFirst: async (args: {
				where: Record<string, unknown>;
				include?: { user?: boolean; organization?: boolean };
			}) => {
				const row = db.memberships.find((m) =>
					matches(m as unknown as Record<string, unknown>, args.where)
				);
				if (!row) return null;
				return hydrateMembership(db, row, args.include);
			},
			findMany: async (args: {
				where?: Record<string, unknown>;
				include?: { user?: boolean; organization?: boolean };
			}) => {
				const where = args.where ?? {};
				const rows = db.memberships.filter((m) =>
					matches(m as unknown as Record<string, unknown>, where)
				);
				return rows.map((m) => hydrateMembership(db, m, args.include));
			},
			create: async (args: {
				data: Record<string, unknown>;
				include?: { user?: boolean; organization?: boolean };
			}) => {
				const row: StubMembership = {
					id: nextId("mbr"),
					userId: args.data["userId"] as string,
					organizationId: args.data["organizationId"] as string,
					role: args.data["role"] as OrganizationRole,
					status: (args.data["status"] as StubMembership["status"]) ?? "ACTIVE",
					invitedById: (args.data["invitedById"] as string | null) ?? null,
					invitedAt: (args.data["invitedAt"] as Date | null) ?? null,
					acceptedAt: (args.data["acceptedAt"] as Date | null) ?? null,
					createdAt: new Date(),
					updatedAt: new Date(),
				};
				db.memberships.push(row);
				return hydrateMembership(db, row, args.include);
			},
			update: async (args: {
				where: Record<string, unknown>;
				data: Record<string, unknown>;
				include?: { user?: boolean; organization?: boolean };
			}) => {
				const id = args.where["id"] as string;
				const row = db.memberships.find((m) => m.id === id);
				if (!row) throw new Error("membership not found");
				Object.assign(row, args.data, { updatedAt: new Date() });
				return hydrateMembership(db, row, args.include);
			},
		},
		organizationInvitation: invitationDelegate(db, nextId),
		auditLog: {
			create: async (args: { data: Record<string, unknown> }) => {
				db.auditLogs.push(args.data);
				return { id: nextId("audit"), ...args.data };
			},
		},
	};
	return stub as unknown as PrismaClientLike;
}

function hydrateMembership(
	db: OrgServiceDb,
	row: StubMembership,
	include?: { user?: boolean; organization?: boolean }
): Record<string, unknown> {
	const out: Record<string, unknown> = { ...row };
	if (include?.user) out["user"] = db.users.get(row.userId) ?? null;
	if (include?.organization) out["organization"] = db.orgs.get(row.organizationId) ?? null;
	return out;
}

function invitationDelegate(
	db: OrgServiceDb,
	nextId: (p: string) => string
): Record<string, unknown> {
	return {
		findUnique: async (args: { where: Record<string, unknown> }) => {
			const id = args.where["id"];
			if (typeof id === "string") return db.invitations.find((i) => i.id === id) ?? null;
			const tokenHash = args.where["tokenHash"];
			if (typeof tokenHash === "string") {
				return db.invitations.find((i) => i.tokenHash === tokenHash) ?? null;
			}
			return null;
		},
		findFirst: async (args: { where: Record<string, unknown> }) =>
			db.invitations.find((i) =>
				matches(i as unknown as Record<string, unknown>, args.where)
			) ?? null,
		findMany: async (args: { where?: Record<string, unknown> } = {}) =>
			args.where
				? db.invitations.filter((i) =>
						matches(i as unknown as Record<string, unknown>, args.where ?? {})
					)
				: [...db.invitations],
		create: async (args: { data: Record<string, unknown> }) => {
			const row: StubInvitation = {
				id: nextId("inv"),
				organizationId: args.data["organizationId"] as string,
				email: args.data["email"] as string,
				role: args.data["role"] as OrganizationRole,
				status: (args.data["status"] as StubInvitation["status"]) ?? "PENDING",
				tokenHash: args.data["tokenHash"] as string,
				invitedByUserId: args.data["invitedByUserId"] as string,
				expiresAt: args.data["expiresAt"] as Date,
				acceptedAt: null,
				revokedAt: null,
				createdAt: new Date(),
				updatedAt: new Date(),
			};
			db.invitations.push(row);
			return row;
		},
		update: async (args: {
			where: Record<string, unknown>;
			data: Record<string, unknown>;
		}) => {
			const id = args.where["id"] as string;
			const row = db.invitations.find((i) => i.id === id);
			if (!row) throw new Error("invitation not found");
			Object.assign(row, args.data, { updatedAt: new Date() });
			return row;
		},
		updateMany: async (args: {
			where: Record<string, unknown>;
			data: Record<string, unknown>;
		}) => {
			let count = 0;
			for (const row of db.invitations) {
				if (matches(row as unknown as Record<string, unknown>, args.where)) {
					Object.assign(row, args.data, { updatedAt: new Date() });
					count += 1;
				}
			}
			return { count };
		},
		delete: async (args: { where: Record<string, unknown> }) => {
			const id = args.where["id"] as string;
			const idx = db.invitations.findIndex((i) => i.id === id);
			if (idx === -1) throw new Error("invitation not found");
			const [removed] = db.invitations.splice(idx, 1);
			return removed as unknown as Record<string, unknown>;
		},
	};
}
