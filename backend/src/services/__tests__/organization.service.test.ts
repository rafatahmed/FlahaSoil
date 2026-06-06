/**
 * FlahaSOIL v2 API — OrganizationService unit tests (Phase 9B-G).
 *
 * Exercises the business rules documented in
 * `services/organization.service.ts` against an in-memory Prisma stub:
 *   - Member role transitions (last-OWNER protection, OWNER-only writes)
 *   - Member removal (soft-delete, last-OWNER protection, clears
 *     activeOrganizationId)
 *   - Invitation lifecycle (create, dup-block, expire, revoke, accept)
 *   - Audit emission alongside each privileged write
 *
 * Route-level guards (`requireOrganizationAdmin/Member`) are covered by
 * the HTTP-level suite in `__tests__/organizationAdmin.routes.test.ts`.
 */
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { OrganizationRole } from "@flaha/shared-types";

import {
	setEmailProvider,
	_resetEmailProviderForTesting,
	type EmailProvider,
	type InvitationEmailPayload,
} from "../../email/emailProvider";
import { setPrismaClientForTesting } from "../../prisma/client";
import { ApiError } from "../../utils/apiError";
import {
	acceptInvitation,
	createInvitation,
	listInvitations,
	removeMember,
	revokeInvitation,
	updateMemberRole,
	updateOrganization,
	type ActorContext,
} from "../organization.service";
import { makeOrgServiceStub, type OrgServiceDb } from "./_helpers/orgServiceStub";

const ACTOR_OWNER: ActorContext = { userId: "usr_owner" };
const ACTOR_ADMIN: ActorContext = { userId: "usr_admin" };

function tokenFromUrl(url: string): string {
	const q = url.split("?")[1] ?? "";
	for (const part of q.split("&")) {
		const [k, v] = part.split("=");
		if (k === "token" && v) return decodeURIComponent(v);
	}
	throw new Error(`no token= in url: ${url}`);
}

let dbA: OrgServiceDb;
let dispatched: InvitationEmailPayload[];
let captureProvider: EmailProvider;

beforeEach(() => {
	const { prisma, db } = makeOrgServiceStub();
	setPrismaClientForTesting(prisma);
	dbA = db;
	dispatched = [];
	captureProvider = {
		sendInvitation: async (p) => {
			dispatched.push(p);
		},
	};
	setEmailProvider(captureProvider);

	db.seedOrg({ id: "org_a", name: "Org A" });
	db.seedUser({ id: "usr_owner", email: "owner@example.com" });
	db.seedUser({ id: "usr_admin", email: "admin@example.com" });
	db.seedUser({ id: "usr_agro", email: "agro@example.com" });
	db.seedMembership({
		id: "mbr_owner",
		userId: "usr_owner",
		organizationId: "org_a",
		role: OrganizationRole.OWNER,
	});
	db.seedMembership({
		id: "mbr_admin",
		userId: "usr_admin",
		organizationId: "org_a",
		role: OrganizationRole.ADMIN,
	});
	db.seedMembership({
		id: "mbr_agro",
		userId: "usr_agro",
		organizationId: "org_a",
		role: OrganizationRole.AGRONOMIST,
	});
});

afterEach(() => {
	setPrismaClientForTesting(null);
	_resetEmailProviderForTesting();
});

describe("updateOrganization", () => {
	it("patches the name + emits an ORG_UPDATED audit row", async () => {
		const org = await updateOrganization(ACTOR_OWNER, "org_a", {
			name: "Org A v2",
		});
		expect(org.name).toBe("Org A v2");
		const events = dbA.auditLogs.map((r) => r["action"]);
		expect(events).toContain("ORG_UPDATED");
	});

	it("404s on an unknown organization id", async () => {
		await expect(
			updateOrganization(ACTOR_OWNER, "org_missing", { name: "X" })
		).rejects.toMatchObject({ statusCode: 404 });
	});
});

describe("updateMemberRole — last-OWNER + role hierarchy", () => {
	it("refuses to demote the last OWNER", async () => {
		await expect(
			updateMemberRole(
				ACTOR_OWNER,
				OrganizationRole.OWNER,
				"org_a",
				"usr_owner",
				OrganizationRole.ADMIN
			)
		).rejects.toBeInstanceOf(ApiError);
	});

	it("refuses an ADMIN promoting someone to OWNER", async () => {
		await expect(
			updateMemberRole(
				ACTOR_ADMIN,
				OrganizationRole.ADMIN,
				"org_a",
				"usr_agro",
				OrganizationRole.OWNER
			)
		).rejects.toMatchObject({ statusCode: 403 });
	});

	it("lets an OWNER promote AGRONOMIST → ADMIN and audits it", async () => {
		const m = await updateMemberRole(
			ACTOR_OWNER,
			OrganizationRole.OWNER,
			"org_a",
			"usr_agro",
			OrganizationRole.ADMIN
		);
		expect(m.role).toBe(OrganizationRole.ADMIN);
		const events = dbA.auditLogs.map((r) => r["action"]);
		expect(events).toContain("MEMBERSHIP_ROLE_CHANGED");
	});

	it("is a no-op when current role equals next role", async () => {
		const m = await updateMemberRole(
			ACTOR_OWNER,
			OrganizationRole.OWNER,
			"org_a",
			"usr_agro",
			OrganizationRole.AGRONOMIST
		);
		expect(m.role).toBe(OrganizationRole.AGRONOMIST);
		expect(dbA.auditLogs).toHaveLength(0);
	});
});

describe("removeMember", () => {
	it("refuses to remove the last OWNER", async () => {
		await expect(
			removeMember(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", "usr_owner")
		).rejects.toBeInstanceOf(ApiError);
	});

	it("refuses ADMIN removing an OWNER", async () => {
		await expect(
			removeMember(ACTOR_ADMIN, OrganizationRole.ADMIN, "org_a", "usr_owner")
		).rejects.toMatchObject({ statusCode: 403 });
	});

	it("soft-deletes an AGRONOMIST and clears their activeOrganizationId", async () => {
		dbA.users.get("usr_agro")!.activeOrganizationId = "org_a";
		await removeMember(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", "usr_agro");
		const m = dbA.memberships.find((r) => r.userId === "usr_agro");
		expect(m?.status).toBe("REMOVED");
		expect(dbA.users.get("usr_agro")?.activeOrganizationId).toBeNull();
		expect(dbA.auditLogs.map((r) => r["action"])).toContain("MEMBERSHIP_REMOVED");
	});

	it("404s on a non-existent membership", async () => {
		await expect(
			removeMember(
				ACTOR_OWNER,
				OrganizationRole.OWNER,
				"org_a",
				"usr_ghost"
			)
		).rejects.toMatchObject({ statusCode: 404 });
	});
});

describe("invitation lifecycle", () => {
	it("creates a PENDING invitation, dispatches email, and audits", async () => {
		const inv = await createInvitation(
			ACTOR_OWNER,
			OrganizationRole.OWNER,
			"org_a",
			{ email: "Newbie@Example.com ", role: OrganizationRole.AGRONOMIST }
		);
		expect(inv.email).toBe("newbie@example.com");
		expect(inv.status).toBe("PENDING");
		expect(dispatched).toHaveLength(1);
		expect(dispatched[0]?.acceptUrl).toContain("token=");
		expect(dbA.auditLogs.map((r) => r["action"])).toContain("INVITATION_CREATED");
	});

	it("refuses to invite as OWNER", async () => {
		await expect(
			createInvitation(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", {
				email: "x@example.com",
				role: OrganizationRole.OWNER,
			})
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("rolls back the row when the email provider throws", async () => {
		setEmailProvider({
			sendInvitation: async () => {
				throw new Error("smtp boom");
			},
		});
		await expect(
			createInvitation(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", {
				email: "boom@example.com",
				role: OrganizationRole.AGRONOMIST,
			})
		).rejects.toMatchObject({ statusCode: 500 });
		expect(dbA.invitations).toHaveLength(0);
	});

	it("blocks a duplicate PENDING invitation to the same email", async () => {
		await createInvitation(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", {
			email: "dup@example.com",
			role: OrganizationRole.AGRONOMIST,
		});
		await expect(
			createInvitation(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", {
				email: "dup@example.com",
				role: OrganizationRole.AGRONOMIST,
			})
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("blocks inviting someone who is already a member", async () => {
		await expect(
			createInvitation(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", {
				email: "agro@example.com",
				role: OrganizationRole.AGRONOMIST,
			})
		).rejects.toMatchObject({ statusCode: 400 });
	});

	it("revokes a PENDING invitation idempotently", async () => {
		await createInvitation(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", {
			email: "rv@example.com",
			role: OrganizationRole.AGRONOMIST,
		});
		const id = dbA.invitations[0]!.id;
		const r1 = await revokeInvitation(ACTOR_OWNER, "org_a", id);
		expect(r1.status).toBe("REVOKED");
		const r2 = await revokeInvitation(ACTOR_OWNER, "org_a", id);
		expect(r2.status).toBe("REVOKED");
	});

	it("transitions past-expiry PENDING rows to EXPIRED on list", async () => {
		await createInvitation(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", {
			email: "exp@example.com",
			role: OrganizationRole.AGRONOMIST,
		});
		dbA.invitations[0]!.expiresAt = new Date(Date.now() - 1000);
		const list = await listInvitations("org_a");
		expect(list[0]?.status).toBe("EXPIRED");
	});

	it("accept: rejects when caller email does not match invitee", async () => {
		await createInvitation(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", {
			email: "victim@example.com",
			role: OrganizationRole.AGRONOMIST,
		});
		const raw = tokenFromUrl(dispatched[0]!.acceptUrl);
		await expect(
			acceptInvitation({ userId: "usr_agro" }, raw, "attacker@example.com")
		).rejects.toMatchObject({ statusCode: 403 });
	});

	it("accept: consumes a valid invitation and creates an ACTIVE membership", async () => {
		dbA.seedUser({ id: "usr_new", email: "newbie2@example.com" });
		await createInvitation(ACTOR_OWNER, OrganizationRole.OWNER, "org_a", {
			email: "newbie2@example.com",
			role: OrganizationRole.AGRONOMIST,
		});
		const raw = tokenFromUrl(dispatched[0]!.acceptUrl);
		const res = await acceptInvitation(
			{ userId: "usr_new" },
			raw,
			"newbie2@example.com"
		);
		expect(res.membership.role).toBe(OrganizationRole.AGRONOMIST);
		expect(res.membership.status).toBe("ACTIVE");
		expect(dbA.invitations[0]?.status).toBe("ACCEPTED");
		expect(dbA.users.get("usr_new")?.activeOrganizationId).toBe("org_a");
		expect(dbA.auditLogs.map((r) => r["action"])).toContain("INVITATION_ACCEPTED");
	});
});
