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
import { GOLDEN_SOIL_TESTS, GOLDEN_TS, type GoldenSoilTest } from "./goldenSoilTests";
import { SCIENTIFIC_MATRIX_TESTS, type MatrixSoilTest } from "./scientificMatrixSoilTests";

export interface GoldenPipelineResult {
	envelope: SoilReportEnvelope;
	dto: ProfessionalReportDTO;
	html: string;
}

/** Standard fallback rows for matrix tests. */
const MATRIX_CONTEXT = {
	user: {
		id: "u_mx",
		email: "matrix@flahasoil.test",
		displayName: "Matrix Auditor",
		role: "Auditor",
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	},
	project: {
		id: "p_mx",
		userId: "u_mx",
		name: "Scientific Matrix Audit",
		code: "MATRIX",
		clientName: "FlahaSOIL Labs",
		status: "ACTIVE",
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	},
	sample: {
		id: "s_mx",
		userId: "u_mx",
		projectId: "p_mx",
		locationName: "Matrix Paddock",
		depthFromCm: 0,
		depthToCm: 30,
		sampleDate: GOLDEN_TS,
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	},
};

/** Converts a MatrixSoilTest into a GoldenSoilTest for the pipeline. */
function matrixToGolden(m: MatrixSoilTest): GoldenSoilTest {
	const base = {
		id: m.id,
		sampleId: "s_mx",
		testLevel: m.level,
		labName: "Matrix Lab",
		labReference: `MX-${m.id}`,
		testDate: GOLDEN_TS,
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	};
	return {
		id: m.id,
		level: m.level,
		base,
		sample: MATRIX_CONTEXT.sample,
		project: MATRIX_CONTEXT.project,
		user: MATRIX_CONTEXT.user,
		textureInput: { id: `tex_${m.id}`, soilTestId: m.id, source: "LAB", ...m.texture, createdAt: GOLDEN_TS, updatedAt: GOLDEN_TS },
		chemistryInput: m.chemistry ? { id: `che_${m.id}`, soilTestId: m.id, source: "LAB", ...m.chemistry, createdAt: GOLDEN_TS, updatedAt: GOLDEN_TS } : null,
		meta: {
			reportNumber: `MX-${m.id}`,
			reportTitle: m.label,
			reportDate: GOLDEN_TS,
		},
	};
}

/**
 * Shared runner wiring the full production pipeline.
 */
export async function runGoldenPipeline(
	test: GoldenSoilTest | MatrixSoilTest
): Promise<GoldenPipelineResult> {
	// Seed the store with both golden and matrix tests.
	const allTests = [
		...GOLDEN_SOIL_TESTS,
		...SCIENTIFIC_MATRIX_TESTS.map(matrixToGolden),
	];

	setPrismaClientForTesting(createGoldenStore(allTests));

	const testId = test.id;

	// If it's a matrix test, convert it to the full shape for the DTO composer.
	const fullTest = "texture" in test ? matrixToGolden(test) : test;

	try {
		await calculateSoilTest(testId, {
			runPhysics: true,
			runChemistry: true,
			runInterpretation: true,
			calculationMode: "LAB",
			includeTrace: true,
		});
		const envelope = await buildSoilTestReport(testId);
		const dto = composeProfessionalReport({
			envelope,
			sampleRow: fullTest.sample,
			projectRow: fullTest.project,
			userRow: fullTest.user,
			chemistryInputRow: fullTest.chemistryInput,
			textureInputRow: fullTest.textureInput,
			meta: fullTest.meta,
		});
		const { html } = new DefaultReportRenderer().render(dto);
		return { envelope, dto, html };
	} finally {
		setPrismaClientForTesting(null);
	}
}
