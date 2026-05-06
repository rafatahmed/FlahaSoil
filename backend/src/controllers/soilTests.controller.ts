/**
 * FlahaSOIL v2 API — soil-test HTTP controllers.
 *
 * Covers routes 3, 4, 5, 6, 7, and 8 from `docs/v2-api-contracts.md`:
 *   - POST   /soil-tests
 *   - GET    /soil-tests/:soilTestId
 *   - POST   /soil-tests/:soilTestId/calculate
 *   - GET    /soil-tests/:soilTestId/interpretation
 *   - POST   /soil-tests/:soilTestId/reports
 *   - GET    /soil-tests/:soilTestId/flahacalc-export
 */

import type { Request, Response } from "express";

import { calculateSoilTest } from "../services/calculation.service";
import { getFlahaCalcExport } from "../services/flahaCalcExport.service";
import {
	buildSoilTestReport,
	buildSoilTestReportSummary,
} from "../services/report.service";
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

export async function postSoilTest(
	req: Request,
	res: Response
): Promise<void> {
	const parsed = createSoilTestSchema.parse(req.body);
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
