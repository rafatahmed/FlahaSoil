/**
 * FlahaSOIL v2 API — Project HTTP controllers (Phase 8A → 9A-D.5).
 *
 * Thin Express handlers: parse + validate the request, delegate to the
 * service layer, emit the typed response. Errors bubble through
 * `asyncHandler` to the central error middleware.
 *
 * Tenancy: the authoritative `organizationId` (and creator `userId`)
 * come from `req.authSession`, populated by `resolveAuthSession` and
 * guarded by `requireOrgRole` / `requireProjectAccess` at the route
 * level. Controllers never accept tenant ids from the request body.
 */

import type { Request, Response } from "express";

import { getAuthSession } from "../auth/guards";
import {
	createProject,
	getProjectById,
	listProjects,
} from "../services/projects.service";
import { ApiError } from "../utils/apiError";
import {
	createProjectSchema,
	listProjectsQuerySchema,
} from "../validation/schemas";

function requireActor(req: Request): { userId: string; organizationId: string } {
	const session = getAuthSession(req);
	if (!session.organizationId) {
		// requireOrgRole / requireOrganization should have intercepted this
		// already; this is defence-in-depth so the service layer never
		// runs without a tenant.
		throw ApiError.forbidden("No active organization for this session.");
	}
	return { userId: session.userId, organizationId: session.organizationId };
}

export async function postProject(
	req: Request,
	res: Response
): Promise<void> {
	const actor = requireActor(req);
	const parsed = createProjectSchema.parse(req.body);
	const result = await createProject(actor, parsed);
	res.status(201).json(result);
}

export async function getProjects(
	req: Request,
	res: Response
): Promise<void> {
	const actor = requireActor(req);
	const parsed = listProjectsQuerySchema.parse(req.query);
	const result = await listProjects(actor.organizationId, parsed);
	res.status(200).json(result);
}

export async function getProject(
	req: Request,
	res: Response
): Promise<void> {
	const actor = requireActor(req);
	const projectId = req.params["projectId"];
	if (!projectId) {
		throw ApiError.validation("projectId path parameter is required");
	}
	// Route-level `requireProjectAccess` already asserted tenancy via
	// `assertProjectTenancy`; the service call below filters by
	// organizationId again as defence-in-depth.
	const result = await getProjectById(projectId, actor.organizationId);
	res.status(200).json(result);
}
