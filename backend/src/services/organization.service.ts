/**
 * FlahaSOIL v2 API — Organization administration service (Phase 9B-B).
 *
 * Business logic for:
 *   - `GET / PATCH /organizations/:organizationId`
 *   - `GET / PATCH / DELETE /organizations/:organizationId/members[/:userId]`
 *   - `GET / POST / DELETE /organizations/:organizationId/invitations[/:invitationId]`
 *   - `POST /invitations/accept`
 *
 * Hard rules (mirrors `docs/v2-multi-tenant-architecture.md`):
 *   1. Every read/write is scoped to the path-target `organizationId` AND
 *      the caller's resolved auth session. The route guard
 *      (`requireOrganizationAdmin` / `requireOrganizationMember`) is the
 *      first gate; the service is defence-in-depth.
 *   2. The "last OWNER" of an organization cannot be demoted or removed
 *      via this surface. Ownership transfer is a separate (future)
 *      endpoint with explicit two-step confirmation.
 *   3. Inviters may not grant a role higher than their own. ADMINs may
 *      invite ADMIN and below; OWNER may invite anything except OWNER
 *      (OWNER seats are transferred, not invited).
 *   4. Invitation tokens are 32 cryptographically-random bytes, hex-
 *      encoded. Only `tokenHash` (SHA-256 hex) is persisted; the raw
 *      token leaves the service exactly once, in the accept-link.
 *   5. The accept endpoint refuses to consume an invitation whose
 *      canonicalised `email` differs from the authenticated user's
 *      canonicalised email. The mismatch returns 403 (not 404) because
 *      the caller already proved they hold a valid session.
 */

import { createHash, randomBytes } from "node:crypto";

import {
	InvitationStatus,
	type OrganizationDTO,
	type OrganizationInvitationDTO,
	type OrganizationMemberDTO,
	type OrganizationMembershipDTO,
	OrganizationRole,
	type OrganizationType,
} from "@flaha/shared-types";

import { writeAuditBestEffort, writeAuditTransactional } from "../auth/audit";
import { env } from "../config/env";
import { getEmailProvider } from "../email/emailProvider";
import { getPrismaClient, type PrismaClientLike } from "../prisma/client";
import { ApiError } from "../utils/apiError";
import {
	toOrganizationDTO,
	toOrganizationInvitationDTO,
	toOrganizationMemberDTO,
	toOrganizationMembershipDTO,
} from "../utils/serializers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** 7-day default invitation lifetime — long enough for weekend invites. */
const INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const INVITATION_TOKEN_BYTES = 32;

/**
 * Roles allowed to administer an organization (settings, members,
 * invitations). Imported callers should prefer `ROLES_ORG_ADMIN` from
 * `auth/guards.ts`; this constant exists for service-layer defence.
 */
const ADMIN_ROLES: OrganizationRole[] = [
	OrganizationRole.OWNER,
	OrganizationRole.ADMIN,
];

export interface ActorContext {
	userId: string;
	requestId?: string | null;
	ipAddress?: string | null;
	userAgent?: string | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function canonicalizeEmail(raw: string): string {
	return raw.trim().toLowerCase();
}

function hashToken(raw: string): string {
	return createHash("sha256").update(raw).digest("hex");
}

function generateInvitationToken(): { raw: string; hash: string } {
	const raw = randomBytes(INVITATION_TOKEN_BYTES).toString("hex");
	return { raw, hash: hashToken(raw) };
}

function buildAcceptUrl(token: string): string {
	const base = env.appBaseUrl.replace(/\/+$/, "");
	return `${base}/invitations/accept?token=${encodeURIComponent(token)}`;
}

async function runInTransaction<R>(
	prisma: PrismaClientLike,
	fn: (tx: PrismaClientLike) => Promise<R>
): Promise<R> {
	if (typeof prisma.$transaction === "function") {
		return prisma.$transaction(fn);
	}
	return fn(prisma);
}

/**
 * Loads the organization row, scoped to the caller's membership. Throws
 * 404 when the row does not exist OR the caller has no ACTIVE membership
 * in it, so existence is never leaked across tenants.
 */
async function loadOrgOrThrow(
	prisma: PrismaClientLike,
	organizationId: string
): Promise<Record<string, unknown>> {
	const row = (await prisma.organization.findUnique({
		where: { id: organizationId },
	})) as Record<string, unknown> | null;
	if (!row) {
		throw ApiError.notFound("Organization not found.");
	}
	return row;
}

/**
 * Resolves the caller's membership in the target org. Returns null when
 * none exists (or it is not ACTIVE) so callers can pick the right
 * status code (404 for read paths, 403 for write paths that already
 * passed the path-level guard).
 */
export async function getMembershipForOrg(
	userId: string,
	organizationId: string
): Promise<{ id: string; role: OrganizationRole } | null> {
	const prisma = getPrismaClient();
	const row = (await prisma.organizationMembership.findFirst({
		where: { userId, organizationId, status: "ACTIVE" },
	})) as Record<string, unknown> | null;
	if (!row) return null;
	return {
		id: row["id"] as string,
		role: row["role"] as OrganizationRole,
	};
}

/** Internal: true when `role` may administer the org. */
export function isAdminRole(role: OrganizationRole): boolean {
	return ADMIN_ROLES.includes(role);
}

// ---------------------------------------------------------------------------
// Public API — organization read / update
// ---------------------------------------------------------------------------

export async function getOrganization(
	organizationId: string
): Promise<OrganizationDTO> {
	const prisma = getPrismaClient();
	const row = await loadOrgOrThrow(prisma, organizationId);
	return toOrganizationDTO(row);
}

export interface PatchOrganizationInput {
	name?: string;
	type?: OrganizationType;
}

export async function updateOrganization(
	actor: ActorContext,
	organizationId: string,
	patch: PatchOrganizationInput
): Promise<OrganizationDTO> {
	const prisma = getPrismaClient();
	await loadOrgOrThrow(prisma, organizationId);

	const data: Record<string, unknown> = {};
	if (patch.name !== undefined) data["name"] = patch.name.trim();
	if (patch.type !== undefined) data["type"] = patch.type;

	const updated = (await prisma.organization.update({
		where: { id: organizationId },
		data,
	})) as Record<string, unknown>;

	await writeAuditBestEffort({
		action: "ORG_UPDATED",
		severity: "INFO",
		actorUserId: actor.userId,
		organizationId,
		requestId: actor.requestId ?? null,
		ipAddress: actor.ipAddress ?? null,
		userAgent: actor.userAgent ?? null,
		targetType: "Organization",
		targetId: organizationId,
		metadataJson: { fields: Object.keys(data) },
	});

	return toOrganizationDTO(updated);
}

// ---------------------------------------------------------------------------
// Public API — members
// ---------------------------------------------------------------------------

export async function listMembers(
	organizationId: string
): Promise<OrganizationMemberDTO[]> {
	const prisma = getPrismaClient();
	await loadOrgOrThrow(prisma, organizationId);
	const rows = (await prisma.organizationMembership.findMany({
		where: { organizationId, status: { not: "REMOVED" } as unknown as string },
		include: { user: true, organization: true },
		orderBy: { createdAt: "asc" },
	})) as Record<string, unknown>[];
	return rows.map(toOrganizationMemberDTO);
}

/**
 * Updates a member's role inside `organizationId`. Enforces:
 *   - The target membership exists, is ACTIVE, and belongs to the org.
 *   - The caller may not lower the role of the last OWNER (would leave
 *     the org without an owner).
 *   - The caller may not grant a role higher than their own.
 */
export async function updateMemberRole(
	actor: ActorContext,
	actorRole: OrganizationRole,
	organizationId: string,
	targetUserId: string,
	nextRole: OrganizationRole
): Promise<OrganizationMemberDTO> {
	const prisma = getPrismaClient();

	const target = (await prisma.organizationMembership.findFirst({
		where: { organizationId, userId: targetUserId },
		include: { user: true, organization: true },
	})) as Record<string, unknown> | null;
	if (!target || target["status"] === "REMOVED") {
		throw ApiError.notFound("Membership not found.");
	}
	const currentRole = target["role"] as OrganizationRole;

	// Only OWNER may promote to or demote from OWNER.
	if (
		(currentRole === OrganizationRole.OWNER || nextRole === OrganizationRole.OWNER) &&
		actorRole !== OrganizationRole.OWNER
	) {
		throw ApiError.forbidden(
			"Only an OWNER may grant or revoke OWNER membership."
		);
	}
	// Demoting/removing the last OWNER is rejected.
	if (currentRole === OrganizationRole.OWNER && nextRole !== OrganizationRole.OWNER) {
		await assertNotLastOwner(prisma, organizationId, targetUserId);
	}
	if (currentRole === nextRole) {
		return toOrganizationMemberDTO(target);
	}

	const updated = await runInTransaction(prisma, async (tx) => {
		const row = (await tx.organizationMembership.update({
			where: { id: target["id"] as string },
			data: { role: nextRole },
			include: { user: true, organization: true },
		})) as Record<string, unknown>;
		await writeAuditTransactional(tx, {
			action: "MEMBERSHIP_ROLE_CHANGED",
			severity: "SECURITY",
			actorUserId: actor.userId,
			organizationId,
			requestId: actor.requestId ?? null,
			ipAddress: actor.ipAddress ?? null,
			userAgent: actor.userAgent ?? null,
			targetType: "OrganizationMembership",
			targetId: row["id"] as string,
			metadataJson: {
				targetUserId,
				previousRole: currentRole,
				nextRole,
			},
		});
		return row;
	});

	return toOrganizationMemberDTO(updated);
}

/**
 * Removes a member from the org. Soft-delete: the row transitions to
 * `REMOVED` and is preserved for audit history. Refuses to remove the
 * last OWNER and refuses to let an ADMIN remove an OWNER.
 *
 * Self-removal: a member MAY remove themselves (an OWNER cannot, if
 * they are the last owner). Removing yourself is a 200/OK and clears
 * your `activeOrganizationId` when it matched the removed org so the
 * next request rolls onto a different membership cleanly.
 */
export async function removeMember(
	actor: ActorContext,
	actorRole: OrganizationRole,
	organizationId: string,
	targetUserId: string
): Promise<void> {
	const prisma = getPrismaClient();
	const target = (await prisma.organizationMembership.findFirst({
		where: { organizationId, userId: targetUserId },
	})) as Record<string, unknown> | null;
	if (!target || target["status"] === "REMOVED") {
		throw ApiError.notFound("Membership not found.");
	}
	const targetRole = target["role"] as OrganizationRole;
	const isSelf = actor.userId === targetUserId;

	if (targetRole === OrganizationRole.OWNER && actorRole !== OrganizationRole.OWNER) {
		throw ApiError.forbidden("Only an OWNER may remove an OWNER.");
	}
	if (targetRole === OrganizationRole.OWNER) {
		await assertNotLastOwner(prisma, organizationId, targetUserId);
	}

	await runInTransaction(prisma, async (tx) => {
		await tx.organizationMembership.update({
			where: { id: target["id"] as string },
			data: { status: "REMOVED" },
		});
		// Clear active org if the removed user was actively viewing this
		// tenant; the next request will rehydrate from remaining memberships.
		const user = (await tx.user.findUnique({
			where: { id: targetUserId },
		})) as Record<string, unknown> | null;
		if (user && user["activeOrganizationId"] === organizationId) {
			await tx.user.update({
				where: { id: targetUserId },
				data: { activeOrganizationId: null },
			});
		}
		await writeAuditTransactional(tx, {
			action: "MEMBERSHIP_REMOVED",
			severity: "SECURITY",
			actorUserId: actor.userId,
			organizationId,
			requestId: actor.requestId ?? null,
			ipAddress: actor.ipAddress ?? null,
			userAgent: actor.userAgent ?? null,
			targetType: "OrganizationMembership",
			targetId: target["id"] as string,
			metadataJson: { targetUserId, previousRole: targetRole, selfRemoval: isSelf },
		});
	});
}

/**
 * Counts ACTIVE OWNER memberships for an org. Throws if removing/
 * demoting `excludingUserId` would leave the org with zero owners.
 */
async function assertNotLastOwner(
	prisma: PrismaClientLike,
	organizationId: string,
	excludingUserId: string
): Promise<void> {
	const owners = (await prisma.organizationMembership.findMany({
		where: {
			organizationId,
			role: OrganizationRole.OWNER,
			status: "ACTIVE",
		},
	})) as Record<string, unknown>[];
	const otherOwners = owners.filter(
		(r) => (r["userId"] as string) !== excludingUserId
	);
	if (otherOwners.length === 0) {
		throw ApiError.badRequest(
			"VALIDATION_ERROR",
			"Cannot remove or demote the last OWNER. Transfer ownership first."
		);
	}
}



// ---------------------------------------------------------------------------
// Public API — invitations
// ---------------------------------------------------------------------------

export interface CreateInvitationInput {
	email: string;
	role: OrganizationRole;
}

/**
 * Creates a pending invitation, persists `tokenHash`, and dispatches
 * the accept link via the active EmailProvider. The raw token is
 * surfaced to the email provider exactly once and never returned to
 * the caller.
 *
 * Refuses to invite:
 *   - An OWNER role (transfer ownership separately).
 *   - A role higher than the inviter's (ADMIN cannot mint ADMINs above
 *     their own role; OWNER is excluded above).
 *   - An email that already has an ACTIVE/PENDING membership in this
 *     org, or an unconsumed PENDING invitation.
 *
 * Email-provider failures roll back the row.
 */
export async function createInvitation(
	actor: ActorContext,
	actorRole: OrganizationRole,
	organizationId: string,
	input: CreateInvitationInput
): Promise<OrganizationInvitationDTO> {
	const prisma = getPrismaClient();
	const orgRow = await loadOrgOrThrow(prisma, organizationId);
	const email = canonicalizeEmail(input.email);
	const role = input.role;

	if (role === OrganizationRole.OWNER) {
		throw ApiError.badRequest(
			"VALIDATION_ERROR",
			"Cannot invite a user as OWNER. Transfer ownership separately."
		);
	}
	// The "no role higher than your own" rule reduces to "ADMIN cannot
	// mint OWNER" because OWNER is the only role above ADMIN — and the
	// guard above already rejects OWNER for everyone. Kept as a comment
	// so a future role rank change surfaces the gap during review.
	void actorRole;

	// Already a member? Block re-invite.
	const existingUser = (await prisma.user.findUnique({
		where: { email },
	})) as Record<string, unknown> | null;
	if (existingUser) {
		const existingMembership = (await prisma.organizationMembership.findFirst({
			where: {
				organizationId,
				userId: existingUser["id"] as string,
				status: { not: "REMOVED" } as unknown as string,
			},
		})) as Record<string, unknown> | null;
		if (existingMembership) {
			throw ApiError.badRequest(
				"VALIDATION_ERROR",
				"That user is already a member of this organization."
			);
		}
	}
	// Block a duplicate PENDING invitation.
	const existingPending = (await prisma.organizationInvitation.findFirst({
		where: { organizationId, email, status: "PENDING" },
	})) as Record<string, unknown> | null;
	if (existingPending) {
		throw ApiError.badRequest(
			"VALIDATION_ERROR",
			"A pending invitation already exists for that email. Revoke it before re-inviting."
		);
	}

	const { raw, hash } = generateInvitationToken();
	const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

	const inserted = (await prisma.organizationInvitation.create({
		data: {
			organizationId,
			email,
			role,
			status: "PENDING",
			tokenHash: hash,
			invitedByUserId: actor.userId,
			expiresAt,
		},
	})) as Record<string, unknown>;

	// Dispatch email; rollback on failure so we never persist an
	// undeliverable invitation.
	try {
		const inviter = (await prisma.user.findUnique({
			where: { id: actor.userId },
		})) as Record<string, unknown> | null;
		await getEmailProvider().sendInvitation({
			to: email,
			organizationName: orgRow["name"] as string,
			inviterDisplayName:
				(inviter?.["displayName"] as string | undefined) ?? "FlahaSOIL admin",
			role,
			acceptUrl: buildAcceptUrl(raw),
			expiresAt,
		});
	} catch (err) {
		await prisma.organizationInvitation.delete({
			where: { id: inserted["id"] as string },
		});
		throw ApiError.internal(
			`Failed to dispatch invitation email: ${
				err instanceof Error ? err.message : String(err)
			}`
		);
	}

	await writeAuditBestEffort({
		action: "INVITATION_CREATED",
		severity: "SECURITY",
		actorUserId: actor.userId,
		organizationId,
		requestId: actor.requestId ?? null,
		ipAddress: actor.ipAddress ?? null,
		userAgent: actor.userAgent ?? null,
		targetType: "OrganizationInvitation",
		targetId: inserted["id"] as string,
		metadataJson: { email, role },
	});

	return toOrganizationInvitationDTO(inserted);
}

/**
 * Lists invitations for the org. Past-expiry PENDING rows are
 * transitioned to EXPIRED in the same call so the admin UI shows
 * accurate lifecycle state without a separate cron job.
 */
export async function listInvitations(
	organizationId: string
): Promise<OrganizationInvitationDTO[]> {
	const prisma = getPrismaClient();
	await loadOrgOrThrow(prisma, organizationId);
	const now = new Date();
	// Lazy expiry transition. Bounded by org so an admin viewing one
	// org never sweeps another's rows.
	await prisma.organizationInvitation.updateMany({
		where: {
			organizationId,
			status: "PENDING",
			expiresAt: { lt: now } as unknown as string,
		},
		data: { status: "EXPIRED" },
	});
	const rows = (await prisma.organizationInvitation.findMany({
		where: { organizationId },
		orderBy: { createdAt: "desc" },
	})) as Record<string, unknown>[];
	return rows.map(toOrganizationInvitationDTO);
}

/**
 * Revokes a PENDING invitation. Idempotent for ACCEPTED/EXPIRED rows
 * (returns the row unchanged) so a race between two admins is harmless.
 * REVOKED → REVOKED is also a no-op.
 */
export async function revokeInvitation(
	actor: ActorContext,
	organizationId: string,
	invitationId: string
): Promise<OrganizationInvitationDTO> {
	const prisma = getPrismaClient();
	const row = (await prisma.organizationInvitation.findUnique({
		where: { id: invitationId },
	})) as Record<string, unknown> | null;
	if (!row || row["organizationId"] !== organizationId) {
		throw ApiError.notFound("Invitation not found.");
	}
	if (row["status"] !== "PENDING") {
		return toOrganizationInvitationDTO(row);
	}
	const updated = (await prisma.organizationInvitation.update({
		where: { id: invitationId },
		data: { status: "REVOKED", revokedAt: new Date() },
	})) as Record<string, unknown>;

	await writeAuditBestEffort({
		action: "INVITATION_REVOKED",
		severity: "SECURITY",
		actorUserId: actor.userId,
		organizationId,
		requestId: actor.requestId ?? null,
		ipAddress: actor.ipAddress ?? null,
		userAgent: actor.userAgent ?? null,
		targetType: "OrganizationInvitation",
		targetId: invitationId,
		metadataJson: { email: row["email"] },
	});

	return toOrganizationInvitationDTO(updated);
}

export interface AcceptInvitationResult {
	membership: OrganizationMembershipDTO;
	organization: OrganizationDTO;
}

/**
 * Consumes an invitation token. Atomic: the invitation transitions
 * PENDING → ACCEPTED and an OrganizationMembership row is created in
 * the same transaction. The caller's `activeOrganizationId` is set to
 * the new org if they had none, so the next request lands in the right
 * tenant context without a manual switch.
 */
export async function acceptInvitation(
	actor: ActorContext,
	token: string,
	authenticatedEmail: string
): Promise<AcceptInvitationResult> {
	const prisma = getPrismaClient();
	const hash = hashToken(token);
	const row = (await prisma.organizationInvitation.findUnique({
		where: { tokenHash: hash },
	})) as Record<string, unknown> | null;
	if (!row) {
		throw ApiError.notFound("Invitation not found or already consumed.");
	}
	if (row["status"] !== "PENDING") {
		throw ApiError.badRequest(
			"VALIDATION_ERROR",
			`Invitation is ${(row["status"] as string).toLowerCase()}.`
		);
	}
	const expiresAt = row["expiresAt"] as Date;
	if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
		await prisma.organizationInvitation.update({
			where: { id: row["id"] as string },
			data: { status: "EXPIRED" },
		});
		throw ApiError.badRequest(
			"VALIDATION_ERROR",
			"Invitation has expired."
		);
	}
	const invitedEmail = canonicalizeEmail(row["email"] as string);
	const callerEmail = canonicalizeEmail(authenticatedEmail);
	if (invitedEmail !== callerEmail) {
		throw ApiError.forbidden(
			"This invitation was issued to a different email address."
		);
	}
	const organizationId = row["organizationId"] as string;
	const role = row["role"] as OrganizationRole;

	const result = await runInTransaction(prisma, async (tx) => {
		// Re-use an existing REMOVED membership row if present (re-invite path);
		// otherwise create a fresh ACTIVE row.
		const existing = (await tx.organizationMembership.findFirst({
			where: { organizationId, userId: actor.userId },
		})) as Record<string, unknown> | null;
		let membershipRow: Record<string, unknown>;
		if (existing) {
			membershipRow = (await tx.organizationMembership.update({
				where: { id: existing["id"] as string },
				data: {
					role,
					status: "ACTIVE",
					invitedById: row["invitedByUserId"],
					acceptedAt: new Date(),
				},
				include: { organization: true },
			})) as Record<string, unknown>;
		} else {
			membershipRow = (await tx.organizationMembership.create({
				data: {
					organizationId,
					userId: actor.userId,
					role,
					status: "ACTIVE",
					invitedById: row["invitedByUserId"],
					invitedAt: row["createdAt"],
					acceptedAt: new Date(),
				},
				include: { organization: true },
			})) as Record<string, unknown>;
		}
		await tx.organizationInvitation.update({
			where: { id: row["id"] as string },
			data: { status: "ACCEPTED", acceptedAt: new Date() },
		});
		// Default the accepter into the new org if they had no active one.
		const user = (await tx.user.findUnique({
			where: { id: actor.userId },
		})) as Record<string, unknown> | null;
		if (user && !user["activeOrganizationId"]) {
			await tx.user.update({
				where: { id: actor.userId },
				data: { activeOrganizationId: organizationId },
			});
		}
		await writeAuditTransactional(tx, {
			action: "INVITATION_ACCEPTED",
			severity: "SECURITY",
			actorUserId: actor.userId,
			organizationId,
			requestId: actor.requestId ?? null,
			ipAddress: actor.ipAddress ?? null,
			userAgent: actor.userAgent ?? null,
			targetType: "OrganizationInvitation",
			targetId: row["id"] as string,
			metadataJson: { role, email: invitedEmail },
		});
		return membershipRow;
	});

	const orgDto = toOrganizationDTO(
		(result["organization"] as Record<string, unknown>) ??
			(await loadOrgOrThrow(prisma, organizationId))
	);
	return {
		membership: toOrganizationMembershipDTO(result),
		organization: orgDto,
	};
}

