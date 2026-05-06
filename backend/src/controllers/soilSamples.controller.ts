/**
 * FlahaSOIL v2 API — soil-sample HTTP controllers.
 *
 * Express handlers stay thin: parse + validate the request, delegate to
 * the service layer, and emit the typed response. All errors flow
 * through `asyncHandler` to the central error middleware.
 */

import type { Request, Response } from "express";

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
	const parsed = createSoilSampleSchema.parse(req.body);
	const result = await createSoilSample(parsed);
	res.status(201).json(result);
}

export async function getSoilSample(
	req: Request,
	res: Response
): Promise<void> {
	const sampleId = req.params["sampleId"];
	if (!sampleId) {
		throw ApiError.validation("sampleId path parameter is required");
	}
	const result = await getSoilSampleById(sampleId);
	res.status(200).json(result);
}
