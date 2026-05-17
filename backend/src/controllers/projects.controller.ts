/**
 * FlahaSOIL v2 API — Project HTTP controllers (Phase 8A).
 *
 * Thin Express handlers: parse + validate the request, delegate to the
 * service layer, emit the typed response. Errors bubble through
 * `asyncHandler` to the central error middleware.
 */

import type { Request, Response } from "express";

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
	const parsed = createProjectSchema.parse(req.body);
	const result = await createProject(parsed);
	res.status(201).json(result);
}

export async function getProjects(
	req: Request,
	res: Response
): Promise<void> {
	const parsed = listProjectsQuerySchema.parse(req.query);
	const result = await listProjects(parsed);
	res.status(200).json(result);
}

export async function getProject(
	req: Request,
	res: Response
): Promise<void> {
	const projectId = req.params["projectId"];
	if (!projectId) {
		throw ApiError.validation("projectId path parameter is required");
	}
	// userId scoping is mandatory until the v2 auth layer lands.
	const userId = typeof req.query["userId"] === "string"
		? req.query["userId"]
		: "";
	if (!userId) {
		throw ApiError.validation("userId query parameter is required");
	}
	const result = await getProjectById(projectId, userId);
	res.status(200).json(result);
}
