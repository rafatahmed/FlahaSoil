/**
 * FlahaSOIL v2 API — soil-test report builder.
 *
 * Read-only assembly of a `SoilReportEnvelope` from already-persisted
 * rows. Never re-runs the scientific engines and never mutates state.
 *
 * The audit trace is reconstructed from persisted inputs:
 *   - `physicsTrace` is read verbatim from `SoilPhysicsResult.calculationTraceJson`.
 *   - `normalizedInputs.salinity` is re-derived by replaying
 *     `normalizeSalinity()` over the stored `SoilChemistryInput`. This
 *     is safe because `normalizeSalinity` is a pure function with no
 *     side effects — same input, same output.
 *   - `skippedModules` is inferred: if chemistry input exists but no
 *     `SoilChemistryResult` row was persisted, chemistry was skipped.
 */
import type {
	SoilReportEnvelope,
	SoilReportSummary,
} from "@flaha/shared-types";

import { getPrismaClient } from "../prisma/client";
import { ApiError } from "../utils/apiError";
import {
	toSoilChemistryResultDTO,
	toSoilInterpretationDTO,
	toSoilPhysicsResultDTO,
	toSoilSampleDTO,
	toSoilTestDTO,
} from "../utils/serializers";
import { buildAuditTrace, deriveWarningDetails } from "./reportAssembler";

async function loadFullTest(
	soilTestId: string
): Promise<Record<string, unknown>> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilTest.findUnique({
		where: { id: soilTestId },
		include: {
			sample: true,
			textureInput: true,
			chemistryInput: true,
			physicsResult: true,
			chemistryResult: true,
			interpretation: true,
		},
	})) as Record<string, unknown> | null;
	if (!row) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}
	return row;
}

export async function buildSoilTestReport(
	soilTestId: string
): Promise<SoilReportEnvelope> {
	const row = await loadFullTest(soilTestId);

	const sample = row["sample"] as Record<string, unknown> | null;
	if (!sample) {
		throw ApiError.notFound(
			`SoilSample for SoilTest ${soilTestId} is missing`
		);
	}

	const physicsRow = row["physicsResult"] as Record<string, unknown> | null;
	const chemistryRow = row["chemistryResult"] as Record<string, unknown> | null;
	const interpRow = row["interpretation"] as Record<string, unknown> | null;
	const chemistryInputRow = row["chemistryInput"] as Record<string, unknown> | null;
	const textureInputRow = row["textureInput"] as Record<string, unknown> | null;

	const auditTrace = buildAuditTrace({
		chemistryInput: chemistryInputRow,
		textureInput: textureInputRow,
		physicsRow,
		chemistryRow,
	});
	const warningDetails = deriveWarningDetails({
		auditTrace,
		interpretationWarnings: extractInterpretationWarnings(interpRow),
	});

	return {
		sample: toSoilSampleDTO(sample),
		test: toSoilTestDTO(row),
		physics: physicsRow ? toSoilPhysicsResultDTO(physicsRow) : null,
		chemistry: chemistryRow ? toSoilChemistryResultDTO(chemistryRow) : null,
		interpretation: interpRow ? toSoilInterpretationDTO(interpRow) : null,
		warnings: warningDetails.map((w) => w.message),
		warningDetails,
		auditTrace,
		metadata: {
			generatedAt: new Date().toISOString(),
			version:
				(physicsRow?.["calculationVersion"] as string | undefined) ?? "v2.0.0",
			calculationMode:
				(chemistryRow?.["calculationMode"] as
					| "LAB"
					| "ESTIMATED"
					| undefined) ?? null,
			testLevel: row["testLevel"] as string,
		},
	};
}

export async function buildSoilTestReportSummary(
	soilTestId: string
): Promise<SoilReportSummary> {
	const full = await buildSoilTestReport(soilTestId);
	return {
		soilTestId: full.test.id,
		sampleId: full.sample.id,
		testLevel: full.test.testLevel,
		labName: full.test.labName ?? null,
		textureClass: full.physics?.textureClass ?? null,
		overallSoilRating: full.interpretation?.overallSoilRating ?? null,
		phCategory: full.interpretation?.phCategory ?? null,
		salinityRisk: full.interpretation?.salinityRisk ?? null,
		hasChemistry: full.chemistry !== null,
		hasInterpretation: full.interpretation !== null,
		warningCount: full.warningDetails.length,
		generatedAt: full.metadata.generatedAt,
	};
}

function extractInterpretationWarnings(
	interpRow: Record<string, unknown> | null
): string[] {
	if (!interpRow) return [];
	const w = interpRow["warningsJson"];
	return Array.isArray(w) ? (w as string[]) : [];
}
