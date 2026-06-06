/**
 * FlahaSOIL v2 API — soil-test HTTP controllers (Phase 9A-D.5).
 *
 * Covers routes 3, 4, 5, 6, 7, and 8 from `docs/v2-api-contracts.md`:
 *   - POST   /soil-tests
 *   - GET    /soil-tests/:soilTestId
 *   - POST   /soil-tests/:soilTestId/calculate
 *   - GET    /soil-tests/:soilTestId/interpretation
 *   - POST   /soil-tests/:soilTestId/reports
 *   - GET    /soil-tests/:soilTestId/flahacalc-export
 *
 * Tenancy: all routes carrying `:soilTestId` are gated by
 * `requireSoilTestAccess` which calls `assertSoilTestTenancy` before
 * the controller runs. `POST /soil-tests` receives the parent sample
 * id in the request body, so this controller still calls
 * `assertSampleTenancy` to keep cross-tenant samples from being used
 * as a write target.
 */

import type { Request, Response } from "express";

import { getAuthSession } from "../auth/guards";
import { assertSampleTenancy } from "../auth/ownership";
import { calculateSoilTest } from "../services/calculation.service";
import { getFlahaCalcExport } from "../services/flahaCalcExport.service";
import {
	buildSoilTestReport,
	buildSoilTestReportSummary,
} from "../services/report.service";
import { getScientificAnalysis } from "../services/scientificAnalysis.service";
import {
	createSoilReportRequest,
	createSoilTest,
	getInterpretationBySoilTestId,
	getSoilTestById,
} from "../services/soilTests.service";
import { ApiError } from "../utils/apiError";
import {
	calculateSoilTestSchema,
	createSoilReportSchema,
	createSoilTestSchema,
} from "../validation/schemas";

function readSoilTestId(req: Request): string {
	const id = req.params["soilTestId"];
	if (!id) {
		throw ApiError.validation("soilTestId path parameter is required");
	}
	return id;
}

function requireOrganizationId(req: Request): string {
	const session = getAuthSession(req);
	if (!session.organizationId) {
		throw ApiError.forbidden("No active organization for this session.");
	}
	return session.organizationId;
}

export async function postSoilTest(
	req: Request,
	res: Response
): Promise<void> {
	const organizationId = requireOrganizationId(req);
	const parsed = createSoilTestSchema.parse(req.body);
	// Sample id comes from the request body (not the URL) so route-level
	// guards cannot validate it. Assert tenancy here — cross-tenant ids
	// return 404 so we don't leak the existence of other tenants' rows.
	await assertSampleTenancy(parsed.sampleId, organizationId);
	const result = await createSoilTest(parsed);
	res.status(201).json(result);
}

export async function getSoilTest(
	req: Request,
	res: Response
): Promise<void> {
	const soilTestId = readSoilTestId(req);
	const result = await getSoilTestById(soilTestId);
	res.status(200).json(result);
}

export async function postCalculateSoilTest(
	req: Request,
	res: Response
): Promise<void> {
	const soilTestId = readSoilTestId(req);
	const parsed = calculateSoilTestSchema.parse(req.body);
	const result = await calculateSoilTest(soilTestId, parsed);
	res.status(200).json(result);
}

export async function getSoilInterpretation(
	req: Request,
	res: Response
): Promise<void> {
	const soilTestId = readSoilTestId(req);
	const result = await getInterpretationBySoilTestId(soilTestId);
	res.status(200).json(result);
}

export async function postSoilReport(
	req: Request,
	res: Response
): Promise<void> {
	const soilTestId = readSoilTestId(req);
	const parsed = createSoilReportSchema.parse(req.body);
	const result = await createSoilReportRequest(soilTestId, parsed);
	res.status(201).json(result);
}

export async function getFlahaCalcExportHandler(
	req: Request,
	res: Response
): Promise<void> {
	const soilTestId = readSoilTestId(req);
	const result = await getFlahaCalcExport(soilTestId);
	res.status(200).json(result);
}

export async function getScientificAnalysisHandler(
	req: Request,
	res: Response
): Promise<void> {
	const soilTestId = readSoilTestId(req);
	const result = await getScientificAnalysis(soilTestId);
	res.status(200).json(result);
}

export async function getSoilTestReport(
	req: Request,
	res: Response
): Promise<void> {
	const soilTestId = readSoilTestId(req);
	const format = String(req.query["format"] ?? "full").toLowerCase();
	if (format !== "full" && format !== "summary") {
		throw ApiError.validation(
			`format query parameter must be 'full' or 'summary' (got '${format}')`
		);
	}
	const result =
		format === "summary"
			? await buildSoilTestReportSummary(soilTestId)
			: await buildSoilTestReport(soilTestId);
	res.status(200).json(result);
}
