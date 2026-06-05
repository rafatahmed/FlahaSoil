/**
 * FlahaSOIL v2 API — soil-sample HTTP controllers (Phase 9A-D.5).
 *
 * Express handlers stay thin: parse + validate the request, delegate to
 * the service layer, and emit the typed response. All errors flow
 * through `asyncHandler` to the central error middleware.
 *
 * Tenancy: `requireOrgRole` (POST) and `requireSampleAccess` (GET) on
 * the route table guarantee an authenticated org-scoped session and
 * enforce cross-tenant isolation. Controllers pull the authoritative
 * `userId`/`organizationId` from `req.authSession` and never accept
 * them from the request body.
 */

import type { Request, Response } from "express";

import { getAuthSession } from "../auth/guards";
import {
	createSoilSample,
	getSoilSampleById,
} from "../services/soilSamples.service";
import { ApiError } from "../utils/apiError";
import { createSoilSampleSchema } from "../validation/schemas";

function requireActor(req: Request): { userId: string; organizationId: string } {
	const session = getAuthSession(req);
	if (!session.organizationId) {
		throw ApiError.forbidden("No active organization for this session.");
	}
	return { userId: session.userId, organizationId: session.organizationId };
}

export async function postSoilSample(
	req: Request,
	res: Response
): Promise<void> {
	const actor = requireActor(req);
	const parsed = createSoilSampleSchema.parse(req.body);
	const result = await createSoilSample(actor, parsed);
	res.status(201).json(result);
}

export async function getSoilSample(
	req: Request,
	res: Response
): Promise<void> {
	// Route-level `requireSampleAccess` already asserted tenancy on the
	// sampleId path parameter, so the service-level read can proceed
	// without re-checking ownership here.
	const sampleId = req.params["sampleId"];
	if (!sampleId) {
		throw ApiError.validation("sampleId path parameter is required");
	}
	const result = await getSoilSampleById(sampleId);
	res.status(200).json(result);
}
