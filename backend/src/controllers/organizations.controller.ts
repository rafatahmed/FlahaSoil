/**
 * FlahaSOIL v2 API — Organization administration controllers (Phase 9B-B).
 *
 * Thin HTTP adapters over `services/organization.service.ts`. The route
 * table (in `routes/v2.routes.ts`) gates each handler with
 * `requireOrganizationAdmin(...)` for write paths and
 * `requireOrganizationMember(...)` for read paths so a non-member never
 * reaches the controller (cross-tenant access returns 404, not 403).
 */

import type { Request, Response } from "express";

import type {
	AcceptInvitationResponse,
	CreateInvitationResponse,
	GetOrganizationResponse,
	ListInvitationsResponse,
	ListOrganizationMembersResponse,
	PatchMembershipResponse,
	PatchOrganizationResponse,
	RemoveMembershipResponse,
	RevokeInvitationResponse,
} from "@flaha/shared-types";

import { getAuthSession } from "../auth/guards";
import {
	acceptInvitation,
	createInvitation,
	getOrganization,
	listInvitations,
	listMembers,
	removeMember,
	revokeInvitation,
	updateMemberRole,
	updateOrganization,
	type ActorContext,
} from "../services/organization.service";
import { ApiError } from "../utils/apiError";
import {
	acceptInvitationSchema,
	createInvitationSchema,
	patchMembershipSchema,
	patchOrganizationSchema,
} from "../validation/schemas";

function actorFromRequest(req: Request): ActorContext {
	const session = getAuthSession(req);
	const ua = req.headers["user-agent"];
	const ipRaw = req.ip ?? req.socket.remoteAddress ?? undefined;
	const reqId = req.headers["x-request-id"];
	const ctx: ActorContext = { userId: session.userId };
	if (typeof ua === "string") ctx.userAgent = ua.slice(0, 256);
	if (ipRaw) ctx.ipAddress = ipRaw;
	if (typeof reqId === "string" && reqId.length > 0) ctx.requestId = reqId;
	return ctx;
}

function readOrgIdParam(req: Request): string {
	const id = req.params["organizationId"];
	if (typeof id !== "string" || id.length === 0) {
		throw ApiError.validation("organizationId path parameter is required.");
	}
	return id;
}

function readUserIdParam(req: Request): string {
	const id = req.params["userId"];
	if (typeof id !== "string" || id.length === 0) {
		throw ApiError.validation("userId path parameter is required.");
	}
	return id;
}

function readInvitationIdParam(req: Request): string {
	const id = req.params["invitationId"];
	if (typeof id !== "string" || id.length === 0) {
		throw ApiError.validation("invitationId path parameter is required.");
	}
	return id;
}

// ---------------------------------------------------------------------------
// Organization read / update
// ---------------------------------------------------------------------------

export async function getOrganizationHandler(
	req: Request,
	res: Response
): Promise<void> {
	const organizationId = readOrgIdParam(req);
	const organization = await getOrganization(organizationId);
	const payload: GetOrganizationResponse = { organization };
	res.status(200).json(payload);
}

export async function patchOrganizationHandler(
	req: Request,
	res: Response
): Promise<void> {
	const organizationId = readOrgIdParam(req);
	const parsed = patchOrganizationSchema.parse(req.body);
	const actor = actorFromRequest(req);
	const organization = await updateOrganization(actor, organizationId, parsed);
	const payload: PatchOrganizationResponse = { organization };
	res.status(200).json(payload);
}

// ---------------------------------------------------------------------------
// Members
// ---------------------------------------------------------------------------

export async function listMembersHandler(
	req: Request,
	res: Response
): Promise<void> {
	const organizationId = readOrgIdParam(req);
	const members = await listMembers(organizationId);
	const payload: ListOrganizationMembersResponse = { members };
	res.status(200).json(payload);
}

export async function patchMembershipHandler(
	req: Request,
	res: Response
): Promise<void> {
	const organizationId = readOrgIdParam(req);
	const targetUserId = readUserIdParam(req);
	const parsed = patchMembershipSchema.parse(req.body);
	const actor = actorFromRequest(req);
	const actorRole = getCallerRole(req, organizationId);
	const member = await updateMemberRole(
		actor,
		actorRole,
		organizationId,
		targetUserId,
		parsed.role
	);
	const payload: PatchMembershipResponse = { member };
	res.status(200).json(payload);
}

export async function removeMembershipHandler(
	req: Request,
	res: Response
): Promise<void> {
	const organizationId = readOrgIdParam(req);
	const targetUserId = readUserIdParam(req);
	const actor = actorFromRequest(req);
	const actorRole = getCallerRole(req, organizationId);
	await removeMember(actor, actorRole, organizationId, targetUserId);
	const payload: RemoveMembershipResponse = { ok: true };
	res.status(200).json(payload);
}

// ---------------------------------------------------------------------------
// Invitations
// ---------------------------------------------------------------------------

export async function listInvitationsHandler(
	req: Request,
	res: Response
): Promise<void> {
	const organizationId = readOrgIdParam(req);
	const invitations = await listInvitations(organizationId);
	const payload: ListInvitationsResponse = { invitations };
	res.status(200).json(payload);
}

export async function postInvitationHandler(
	req: Request,
	res: Response
): Promise<void> {
	const organizationId = readOrgIdParam(req);
	const parsed = createInvitationSchema.parse(req.body);
	const actor = actorFromRequest(req);
	const actorRole = getCallerRole(req, organizationId);
	const invitation = await createInvitation(actor, actorRole, organizationId, {
		email: parsed.email,
		role: parsed.role,
	});
	const payload: CreateInvitationResponse = { invitation };
	res.status(201).json(payload);
}

export async function deleteInvitationHandler(
	req: Request,
	res: Response
): Promise<void> {
	const organizationId = readOrgIdParam(req);
	const invitationId = readInvitationIdParam(req);
	const actor = actorFromRequest(req);
	const invitation = await revokeInvitation(actor, organizationId, invitationId);
	const payload: RevokeInvitationResponse = { invitation };
	res.status(200).json(payload);
}

export async function postAcceptInvitationHandler(
	req: Request,
	res: Response
): Promise<void> {
	const parsed = acceptInvitationSchema.parse(req.body);
	const session = getAuthSession(req);
	const actor = actorFromRequest(req);
	const result = await acceptInvitation(actor, parsed.token, session.user.email);
	const payload: AcceptInvitationResponse = {
		membership: result.membership,
		organization: result.organization,
	};
	res.status(200).json(payload);
}

/**
 * Resolves the caller's role inside the path-target organization. The
 * route guard (`requireOrganizationAdmin`) attaches the resolved role
 * to `req` so the service layer never has to re-query. Falls back to
 * the active-session role only when both orgs match — defence-in-depth.
 */
function getCallerRole(
	req: Request,
	organizationId: string
): import("@flaha/shared-types").OrganizationRole {
	const attached = req.callerOrgRole;
	if (attached) return attached;
	const session = getAuthSession(req);
	if (session.organizationId === organizationId && session.role) {
		return session.role;
	}
	throw ApiError.forbidden("Caller role could not be resolved for this organization.");
}
