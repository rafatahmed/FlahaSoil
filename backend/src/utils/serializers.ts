/**
 * FlahaSOIL v2 API — Prisma → DTO serialisers.
 *
 * Centralises the conversion between Prisma row shapes (which carry
 * `Date`, `Decimal`, and Prisma enums) and the wire-format DTOs from
 * `@flaha/shared-types` (which carry ISO strings, decimal strings, and
 * plain TypeScript enums). No business logic lives here.
 */

import {
	type IsoDateString,
	type ProjectDTO,
	type ProjectSummaryDTO,
	ProjectStatus,
	type SoilChemistryInputDTO,
	type SoilChemistryResultDTO,
	type SoilInterpretationDTO,
	SoilInterpretationRating,
	type SoilLabValueDTO,
	type SoilPhysicsResultDTO,
	type SoilReportDTO,
	SoilReportStatus,
	type SoilSampleDTO,
	type SoilTestDTO,
	SoilTestLevel,
	type SoilTextureInputDTO,
	SoilValueSource,
	type UserDTO,
	UserRole,
} from "@flaha/shared-types";

/** Date | string | null → ISO string | null. Throws on invalid Date. */
export function toIso(value: Date | string | null | undefined): IsoDateString {
	if (value === null || value === undefined) return "";
	if (typeof value === "string") return value;
	return value.toISOString();
}

function toIsoNullable(
	value: Date | string | null | undefined
): IsoDateString | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "string") return value;
	return value.toISOString();
}

/** Prisma `Decimal` (or string/number) → string DTO. */
export function decimalToString(value: unknown): string {
	if (value === null || value === undefined) return "";
	if (typeof value === "string") return value;
	if (typeof value === "number") return String(value);
	if (typeof (value as { toString?: unknown }).toString === "function") {
		return (value as { toString: () => string }).toString();
	}
	return String(value);
}

function asNullable<T>(value: T | null | undefined): T | null {
	return value === undefined ? null : value;
}

function num(value: unknown): number {
	if (typeof value === "number") return value;
	if (typeof value === "string") {
		const n = parseFloat(value);
		return Number.isFinite(n) ? n : 0;
	}
	return 0;
}

function numNullable(value: unknown): number | null {
	if (value === null || value === undefined) return null;
	if (typeof value === "number") return Number.isFinite(value) ? value : null;
	if (typeof value === "string") {
		const n = parseFloat(value);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

// ---------------------------------------------------------------------------
// Row → DTO converters
// ---------------------------------------------------------------------------

export function toUserDTO(row: Record<string, unknown>): UserDTO {
	return {
		id: row["id"] as string,
		email: row["email"] as string,
		displayName: row["displayName"] as string,
		role: row["role"] as UserRole,
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
		archivedAt: toIsoNullable(row["archivedAt"] as Date | null | undefined),
	};
}

export function toProjectDTO(row: Record<string, unknown>): ProjectDTO {
	return {
		id: row["id"] as string,
		userId: row["userId"] as string,
		name: row["name"] as string,
		code: asNullable(row["code"] as string | null | undefined),
		description: asNullable(row["description"] as string | null | undefined),
		locationName: asNullable(row["locationName"] as string | null | undefined),
		status: row["status"] as ProjectStatus,
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toProjectSummaryDTO(
	row: Record<string, unknown>,
	sampleCount: number
): ProjectSummaryDTO {
	return {
		id: row["id"] as string,
		name: row["name"] as string,
		code: asNullable(row["code"] as string | null | undefined),
		status: row["status"] as ProjectStatus,
		sampleCount,
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toSoilSampleDTO(row: Record<string, unknown>): SoilSampleDTO {
	return {
		id: row["id"] as string,
		userId: row["userId"] as string,
		projectId: asNullable(row["projectId"] as string | null | undefined),
		locationName: asNullable(row["locationName"] as string | null | undefined),
		latitude: numNullable(row["latitude"]),
		longitude: numNullable(row["longitude"]),
		depthFromCm: numNullable(row["depthFromCm"]),
		depthToCm: numNullable(row["depthToCm"]),
		sampleDate: toIsoNullable(row["sampleDate"] as Date | null | undefined),
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toSoilTestDTO(row: Record<string, unknown>): SoilTestDTO {
	return {
		id: row["id"] as string,
		sampleId: row["sampleId"] as string,
		testLevel: row["testLevel"] as SoilTestLevel,
		labName: asNullable(row["labName"] as string | null | undefined),
		labReference: asNullable(row["labReference"] as string | null | undefined),
		testDate: toIsoNullable(row["testDate"] as Date | null | undefined),
		notes: asNullable(row["notes"] as string | null | undefined),
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toSoilTextureInputDTO(
	row: Record<string, unknown>
): SoilTextureInputDTO {
	return {
		id: row["id"] as string,
		soilTestId: row["soilTestId"] as string,
		sandPercent: numNullable(row["sandPercent"]),
		siltPercent: numNullable(row["siltPercent"]),
		clayPercent: numNullable(row["clayPercent"]),
		organicMatterPercent: numNullable(row["organicMatterPercent"]),
		bulkDensity: numNullable(row["bulkDensity"]),
		gravelPercent: numNullable(row["gravelPercent"]),
		source: row["source"] as SoilValueSource,
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toSoilChemistryInputDTO(
	row: Record<string, unknown>
): SoilChemistryInputDTO {
	const r = row as Record<string, unknown>;
	const fields: Array<keyof SoilChemistryInputDTO> = [
		"pH", "ecDsM", "tdsMgL", "cec", "ca", "mg", "k", "na", "cl", "n", "p",
		"fe", "mn", "zn", "cu", "b", "mo", "s",
		"carbonate", "bicarbonate", "sar", "esp",
	];
	const out: Record<string, unknown> = {
		id: r["id"],
		soilTestId: r["soilTestId"],
		source: r["source"],
		heavyMetalsJson: (r["heavyMetalsJson"] ?? null) as
			| Record<string, unknown>
			| null,
		fullNutrientPanelJson: (r["fullNutrientPanelJson"] ?? null) as
			| Record<string, unknown>
			| null,
		createdAt: toIso(r["createdAt"] as Date),
		updatedAt: toIso(r["updatedAt"] as Date),
	};
	for (const f of fields) out[f] = numNullable(r[f as string]);
	return out as unknown as SoilChemistryInputDTO;
}

export function toSoilPhysicsResultDTO(
	row: Record<string, unknown>
): SoilPhysicsResultDTO {
	return {
		id: row["id"] as string,
		soilTestId: row["soilTestId"] as string,
		fieldCapacity: num(row["fieldCapacity"]),
		wiltingPoint: num(row["wiltingPoint"]),
		plantAvailableWater: num(row["plantAvailableWater"]),
		saturation: num(row["saturation"]),
		saturatedConductivity: num(row["saturatedConductivity"]),
		textureClass: row["textureClass"] as string,
		bulkDensity: numNullable(row["bulkDensity"]),
		porosity: numNullable(row["porosity"]),
		voidRatio: numNullable(row["voidRatio"]),
		particleDensity: numNullable(row["particleDensity"]),
		soilQualityIndex: numNullable(row["soilQualityIndex"]),
		drainageClass: asNullable(row["drainageClass"] as string | null | undefined),
		compactionRisk: asNullable(row["compactionRisk"] as string | null | undefined),
		erosionRisk: asNullable(row["erosionRisk"] as string | null | undefined),
		calculationVersion: asNullable(
			row["calculationVersion"] as string | null | undefined
		),
		calculationTraceJson:
			(row["calculationTraceJson"] as Record<string, unknown> | null) ?? null,
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toSoilChemistryResultDTO(
	row: Record<string, unknown>
): SoilChemistryResultDTO {
	return {
		id: row["id"] as string,
		soilTestId: row["soilTestId"] as string,
		cec: num(row["cec"]),
		baseSaturation: num(row["baseSaturation"]),
		caPercent: num(row["caPercent"]),
		mgPercent: num(row["mgPercent"]),
		kPercent: num(row["kPercent"]),
		naPercent: num(row["naPercent"]),
		esp: num(row["esp"]),
		sar: numNullable(row["sar"]),
		cationBalanceOther: num(row["cationBalanceOther"]),
		calculationMode: row["calculationMode"] as string,
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toSoilInterpretationDTO(
	row: Record<string, unknown>
): SoilInterpretationDTO {
	const warnings = row["warningsJson"];
	return {
		id: row["id"] as string,
		soilTestId: row["soilTestId"] as string,
		phCategory: asNullable(row["phCategory"] as string | null | undefined),
		salinityRisk: asNullable(row["salinityRisk"] as string | null | undefined),
		cecLevel: asNullable(row["cecLevel"] as string | null | undefined),
		baseSaturationCategory: asNullable(
			row["baseSaturationCategory"] as string | null | undefined
		),
		cationBalance: asNullable(row["cationBalance"] as string | null | undefined),
		sodiumRisk: asNullable(row["sodiumRisk"] as string | null | undefined),
		waterHoldingClass: asNullable(
			row["waterHoldingClass"] as string | null | undefined
		),
		drainageClass: asNullable(row["drainageClass"] as string | null | undefined),
		overallSoilRating: row["overallSoilRating"] as SoilInterpretationRating,
		warningsJson: Array.isArray(warnings) ? (warnings as string[]) : [],
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toSoilReportDTO(row: Record<string, unknown>): SoilReportDTO {
	return {
		id: row["id"] as string,
		soilTestId: row["soilTestId"] as string,
		status: row["status"] as SoilReportStatus,
		reportType: asNullable(row["reportType"] as string | null | undefined),
		fileUrl: asNullable(row["fileUrl"] as string | null | undefined),
		generatedAt: toIsoNullable(row["generatedAt"] as Date | null | undefined),
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toSoilLabValueDTO(
	row: Record<string, unknown>
): SoilLabValueDTO {
	return {
		id: row["id"] as string,
		soilTestId: row["soilTestId"] as string,
		fieldKey: row["fieldKey"] as string,
		rawLabValue: decimalToString(row["rawLabValue"]),
		rawUnit: row["rawUnit"] as string,
		convertedStandardValue: numNullable(row["convertedStandardValue"]),
		standardUnit: asNullable(row["standardUnit"] as string | null | undefined),
		method: asNullable(row["method"] as string | null | undefined),
		notes: asNullable(row["notes"] as string | null | undefined),
		measuredAt: toIsoNullable(row["measuredAt"] as Date | null | undefined),
		createdAt: toIso(row["createdAt"] as Date),
	};
}

/** Maps the engine's free-form rating string to the DTO enum. */
export function toRatingEnum(rating: string): SoilInterpretationRating {
	const upper = rating.toUpperCase();
	if (upper === "GOOD") return SoilInterpretationRating.GOOD;
	if (upper === "POOR") return SoilInterpretationRating.POOR;
	return SoilInterpretationRating.FAIR;
}

