/**
 * FlahaSOIL v2 API — soil-test service.
 *
 * Owns the read/write surface for `SoilTest` and its first-class
 * children (`SoilTextureInput`, `SoilChemistryInput`, `SoilLabValue`)
 * plus the read paths for the engine result tables.
 */

import type {
	CreateSoilReportResponse,
	CreateSoilTestResponse,
	GetSoilInterpretationResponse,
	GetSoilTestResponse,
} from "@flaha/shared-types";
import { SoilReportStatus } from "@flaha/shared-types";

import { getPrismaClient } from "../prisma/client";
import { ApiError } from "../utils/apiError";
import {
	toSoilChemistryInputDTO,
	toSoilChemistryResultDTO,
	toSoilInterpretationDTO,
	toSoilLabValueDTO,
	toSoilPhysicsResultDTO,
	toSoilReportDTO,
	toSoilTestDTO,
	toSoilTextureInputDTO,
} from "../utils/serializers";
import type {
	CreateSoilReportParsed,
	CreateSoilTestParsed,
} from "../validation/schemas";

function buildOptionalScalar(
	source: Record<string, unknown>,
	keys: readonly string[]
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	for (const k of keys) {
		const v = source[k];
		if (v !== undefined) out[k] = v;
	}
	return out;
}

const TEXTURE_FIELDS = [
	"sandPercent",
	"siltPercent",
	"clayPercent",
	"organicMatterPercent",
	"bulkDensity",
	"gravelPercent",
] as const;

const CHEMISTRY_FIELDS = [
	"pH", "ecDsM", "tdsMgL",
	"cec", "ca", "mg", "k", "na", "cl", "n", "p",
	"fe", "mn", "zn", "cu", "b", "mo", "s",
	"carbonate", "bicarbonate", "sar", "esp",
	"heavyMetalsJson", "fullNutrientPanelJson",
] as const;

export async function createSoilTest(
	input: CreateSoilTestParsed
): Promise<CreateSoilTestResponse> {
	const prisma = getPrismaClient();

	const sample = await prisma.soilSample.findUnique({
		where: { id: input.sampleId },
	});
	if (!sample) {
		throw ApiError.notFound(`SoilSample not found: ${input.sampleId}`);
	}

	const data: Record<string, unknown> = {
		sampleId: input.sampleId,
		testLevel: input.testLevel,
	};
	if (input.labName !== undefined) data["labName"] = input.labName;
	if (input.labReference !== undefined) data["labReference"] = input.labReference;
	if (input.testDate !== undefined) {
		data["testDate"] = input.testDate ? new Date(input.testDate) : null;
	}
	if (input.notes !== undefined) data["notes"] = input.notes;

	if (input.textureInput) {
		data["textureInput"] = {
			create: {
				...buildOptionalScalar(
					input.textureInput as unknown as Record<string, unknown>,
					TEXTURE_FIELDS
				),
				source: input.textureInput.source,
			},
		};
	}
	if (input.chemistryInput) {
		data["chemistryInput"] = {
			create: {
				...buildOptionalScalar(
					input.chemistryInput as unknown as Record<string, unknown>,
					CHEMISTRY_FIELDS
				),
				source: input.chemistryInput.source,
			},
		};
	}
	if (input.labValues && input.labValues.length > 0) {
		data["rawLabValues"] = {
			create: input.labValues.map((lv) => {
				const row: Record<string, unknown> = {
					fieldKey: lv.fieldKey,
					rawLabValue: lv.rawLabValue,
					rawUnit: lv.rawUnit,
				};
				if (lv.convertedStandardValue !== undefined)
					row["convertedStandardValue"] = lv.convertedStandardValue;
				if (lv.standardUnit !== undefined) row["standardUnit"] = lv.standardUnit;
				if (lv.method !== undefined) row["method"] = lv.method;
				if (lv.notes !== undefined) row["notes"] = lv.notes;
				if (lv.measuredAt !== undefined)
					row["measuredAt"] = lv.measuredAt ? new Date(lv.measuredAt) : null;
				return row;
			}),
		};
	}

	const row = (await prisma.soilTest.create({
		data,
		include: {
			textureInput: true,
			chemistryInput: true,
			rawLabValues: true,
		},
	})) as Record<string, unknown>;

	const response: CreateSoilTestResponse = { soilTest: toSoilTestDTO(row) };
	if (row["textureInput"]) {
		response.textureInput = toSoilTextureInputDTO(
			row["textureInput"] as Record<string, unknown>
		);
	}
	if (row["chemistryInput"]) {
		response.chemistryInput = toSoilChemistryInputDTO(
			row["chemistryInput"] as Record<string, unknown>
		);
	}
	if (Array.isArray(row["rawLabValues"]) && row["rawLabValues"].length > 0) {
		response.labValues = (row["rawLabValues"] as Record<string, unknown>[]).map(
			toSoilLabValueDTO
		);
	}
	return response;
}


export async function getSoilTestById(
	soilTestId: string
): Promise<GetSoilTestResponse> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilTest.findUnique({
		where: { id: soilTestId },
		include: {
			textureInput: true,
			chemistryInput: true,
			physicsResult: true,
			chemistryResult: true,
			interpretation: true,
			reports: { orderBy: { createdAt: "desc" } },
			rawLabValues: true,
		},
	})) as Record<string, unknown> | null;

	if (!row) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}

	const response: GetSoilTestResponse = {
		soilTest: toSoilTestDTO(row),
		reports: ((row["reports"] as Record<string, unknown>[]) ?? []).map(
			toSoilReportDTO
		),
	};
	if (row["textureInput"]) {
		response.textureInput = toSoilTextureInputDTO(
			row["textureInput"] as Record<string, unknown>
		);
	}
	if (row["chemistryInput"]) {
		response.chemistryInput = toSoilChemistryInputDTO(
			row["chemistryInput"] as Record<string, unknown>
		);
	}
	if (row["physicsResult"]) {
		response.physicsResult = toSoilPhysicsResultDTO(
			row["physicsResult"] as Record<string, unknown>
		);
	}
	if (row["chemistryResult"]) {
		response.chemistryResult = toSoilChemistryResultDTO(
			row["chemistryResult"] as Record<string, unknown>
		);
	}
	if (row["interpretation"]) {
		response.interpretation = toSoilInterpretationDTO(
			row["interpretation"] as Record<string, unknown>
		);
	}
	if (Array.isArray(row["rawLabValues"]) && row["rawLabValues"].length > 0) {
		response.labValues = (row["rawLabValues"] as Record<string, unknown>[]).map(
			toSoilLabValueDTO
		);
	}
	return response;
}

export async function getInterpretationBySoilTestId(
	soilTestId: string
): Promise<GetSoilInterpretationResponse> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilInterpretation.findUnique({
		where: { soilTestId },
	})) as Record<string, unknown> | null;
	if (!row) {
		throw ApiError.notFound(
			`SoilInterpretation not found for soilTestId: ${soilTestId}`
		);
	}
	return { interpretation: toSoilInterpretationDTO(row) };
}

export async function createSoilReportRequest(
	soilTestId: string,
	input: CreateSoilReportParsed
): Promise<CreateSoilReportResponse> {
	const prisma = getPrismaClient();

	const test = await prisma.soilTest.findUnique({ where: { id: soilTestId } });
	if (!test) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}

	// Phase 6 intentionally does NOT generate a real PDF/CSV. The row is
	// persisted as DRAFT; a future phase will flip status to GENERATED
	// after the rendering pipeline produces an artefact at `fileUrl`.
	const row = (await prisma.soilReport.create({
		data: {
			soilTestId,
			status: SoilReportStatus.DRAFT,
			reportType: input.reportType,
		},
	})) as Record<string, unknown>;

	return { report: toSoilReportDTO(row) };
}
