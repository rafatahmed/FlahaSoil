/**
 * FlahaSOIL v2 API — Phase 10A.8 golden pipeline runner.
 *
 * Executes the full production scientific + reporting pipeline for one
 * canonical golden test against the in-memory Prisma store:
 *
 *   calculateSoilTest → buildSoilTestReport → composeProfessionalReport
 *     → DefaultReportRenderer
 *
 * The compose step mirrors `reports.service.generateReport` 1:1 (same
 * row inputs, same meta shape) so the DTO/HTML the golden tests lock are
 * the exact artefacts the live `/reports` endpoint produces. No new
 * scientific logic lives here — it only wires existing services.
 */
import type { ProfessionalReportDTO, SoilReportEnvelope } from "@flaha/shared-types";

import { setPrismaClientForTesting } from "../../../prisma/client";
import { calculateSoilTest } from "../../calculation.service";
import { buildSoilTestReport } from "../../report.service";
import { composeProfessionalReport } from "../../report/composeProfessionalReport";
import { DefaultReportRenderer } from "../../report/renderer";

import { createGoldenStore } from "./goldenPrismaStore";
import { GOLDEN_SOIL_TESTS, type GoldenSoilTest } from "./goldenSoilTests";

export interface GoldenPipelineResult {
	envelope: SoilReportEnvelope;
	dto: ProfessionalReportDTO;
	html: string;
}

export async function runGoldenPipeline(
	test: GoldenSoilTest
): Promise<GoldenPipelineResult> {
	setPrismaClientForTesting(createGoldenStore(GOLDEN_SOIL_TESTS));
	try {
		await calculateSoilTest(test.id, {
			runPhysics: true,
			runChemistry: true,
			runInterpretation: true,
			calculationMode: "LAB",
			includeTrace: true,
		});
		const envelope = await buildSoilTestReport(test.id);
		const dto = composeProfessionalReport({
			envelope,
			sampleRow: test.sample,
			projectRow: test.project,
			userRow: test.user,
			chemistryInputRow: test.chemistryInput,
			textureInputRow: test.textureInput,
			meta: test.meta,
		});
		const { html } = new DefaultReportRenderer().render(dto);
		return { envelope, dto, html };
	} finally {
		setPrismaClientForTesting(null);
	}
}
