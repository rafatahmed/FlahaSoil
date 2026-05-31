/**
 * FlahaSOIL v2 API — soil-sample HTTP controllers.
 *
 * Express handlers stay thin: parse + validate the request, delegate to
 * the service layer, and emit the typed response. All errors flow
 * through `asyncHandler` to the central error middleware.
 */

import type { Request, Response } from "express";

import {
	assertSampleOwnership,
	requireCurrentUser,
} from "../auth/ownership";
import {
	createSoilSample,
	getSoilSampleById,
} from "../services/soilSamples.service";
import { ApiError } from "../utils/apiError";
import { createSoilSampleSchema } from "../validation/schemas";

export async function postSoilSample(
	req: Request,
	res: Response
): Promise<void> {
	const session = requireCurrentUser(req);
	const parsed = createSoilSampleSchema.parse(req.body);
	const result = await createSoilSample(session.user.id, parsed);
	res.status(201).json(result);
}

export async function getSoilSample(
	req: Request,
	res: Response
): Promise<void> {
	const session = requireCurrentUser(req);
	const sampleId = req.params["sampleId"];
	if (!sampleId) {
		throw ApiError.validation("sampleId path parameter is required");
	}
	// Phase 8B: enforce per-user scoping before reading. Cross-user
	// access returns 404 so the API never leaks the existence of a
	// sample owned by another user.
	await assertSampleOwnership(sampleId, session.user.id);
	const result = await getSoilSampleById(sampleId);
	res.status(200).json(result);
}
