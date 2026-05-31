/**
 * FlahaSOIL v2 API — Project HTTP controllers (Phase 8A).
 *
 * Thin Express handlers: parse + validate the request, delegate to the
 * service layer, emit the typed response. Errors bubble through
 * `asyncHandler` to the central error middleware.
 */

import type { Request, Response } from "express";

import { requireCurrentUser } from "../auth/ownership";
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

export async function postProject(
	req: Request,
	res: Response
): Promise<void> {
	const session = requireCurrentUser(req);
	const parsed = createProjectSchema.parse(req.body);
	const result = await createProject(session.user.id, parsed);
	res.status(201).json(result);
}

export async function getProjects(
	req: Request,
	res: Response
): Promise<void> {
	const session = requireCurrentUser(req);
	const parsed = listProjectsQuerySchema.parse(req.query);
	const result = await listProjects(session.user.id, parsed);
	res.status(200).json(result);
}

export async function getProject(
	req: Request,
	res: Response
): Promise<void> {
	const session = requireCurrentUser(req);
	const projectId = req.params["projectId"];
	if (!projectId) {
		throw ApiError.validation("projectId path parameter is required");
	}
	const result = await getProjectById(projectId, session.user.id);
	res.status(200).json(result);
}
