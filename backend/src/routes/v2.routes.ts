/**
 * FlahaSOIL v2 API — route table.
 *
 * Mounts the eight `/api/v2` routes from `docs/v2-api-contracts.md` §2
 * onto a single Express router. Order matches the spec's route table
 * for ease of cross-reference. Every handler is wrapped with
 * `asyncHandler` so the central error middleware sees promise
 * rejections.
 */

import { Router } from "express";

import {
	getSoilSample,
	postSoilSample,
} from "../controllers/soilSamples.controller";
import {
	getFlahaCalcExportHandler,
	getSoilInterpretation,
	getSoilTest,
	getSoilTestReport,
	postCalculateSoilTest,
	postSoilReport,
	postSoilTest,
} from "../controllers/soilTests.controller";
import { asyncHandler } from "../utils/asyncHandler";

export function createV2Router(): Router {
	const router = Router();

	// 1. POST /soil-samples
	router.post("/soil-samples", asyncHandler(postSoilSample));

	// 2. GET /soil-samples/:sampleId
	router.get("/soil-samples/:sampleId", asyncHandler(getSoilSample));

	// 3. POST /soil-tests
	router.post("/soil-tests", asyncHandler(postSoilTest));

	// 4. GET /soil-tests/:soilTestId
	router.get("/soil-tests/:soilTestId", asyncHandler(getSoilTest));

	// 5. POST /soil-tests/:soilTestId/calculate
	router.post(
		"/soil-tests/:soilTestId/calculate",
		asyncHandler(postCalculateSoilTest)
	);

	// 6. GET /soil-tests/:soilTestId/interpretation
	router.get(
		"/soil-tests/:soilTestId/interpretation",
		asyncHandler(getSoilInterpretation)
	);

	// 7. POST /soil-tests/:soilTestId/reports
	router.post(
		"/soil-tests/:soilTestId/reports",
		asyncHandler(postSoilReport)
	);

	// 8. GET /soil-tests/:soilTestId/report (Phase 8 — full + summary)
	router.get(
		"/soil-tests/:soilTestId/report",
		asyncHandler(getSoilTestReport)
	);

	// 9. GET /soil-tests/:soilTestId/flahacalc-export
	router.get(
		"/soil-tests/:soilTestId/flahacalc-export",
		asyncHandler(getFlahaCalcExportHandler)
	);

	return router;
}
