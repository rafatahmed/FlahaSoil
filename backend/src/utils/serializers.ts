/**
 * FlahaSOIL v2 API — Prisma → DTO serialisers.
 *
 * Centralises the conversion between Prisma row shapes (which carry
 * `Date`, `Decimal`, and Prisma enums) and the wire-format DTOs from
 * `@flaha/shared-types` (which carry ISO strings, decimal strings, and
 * plain TypeScript enums). No business logic lives here.
 */

import {
	type InvitationStatus,
	type IsoDateString,
	type MembershipStatus,
	type OrganizationDTO,
	type OrganizationInvitationDTO,
	type OrganizationMemberDTO,
	type OrganizationMembershipDTO,
	type OrganizationRole,
	type OrganizationStatus,
	type OrganizationType,
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

// Phase 9A — Organization + Membership serialisers.
export function toOrganizationDTO(
	row: Record<string, unknown>
): OrganizationDTO {
	return {
		id: row["id"] as string,
		name: row["name"] as string,
		slug: row["slug"] as string,
		type: row["type"] as OrganizationType,
		status: row["status"] as OrganizationStatus,
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toOrganizationMembershipDTO(
	row: Record<string, unknown>
): OrganizationMembershipDTO {
	const dto: OrganizationMembershipDTO = {
		id: row["id"] as string,
		organizationId: row["organizationId"] as string,
		userId: row["userId"] as string,
		role: row["role"] as OrganizationRole,
		status: row["status"] as MembershipStatus,
		invitedById: asNullable(row["invitedById"] as string | null | undefined),
		invitedAt: toIsoNullable(row["invitedAt"] as Date | null | undefined),
		acceptedAt: toIsoNullable(row["acceptedAt"] as Date | null | undefined),
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
	const org = row["organization"] as Record<string, unknown> | undefined;
	if (org) dto.organization = toOrganizationDTO(org);
	return dto;
}

// Phase 9B — `OrganizationMemberDTO` is `OrganizationMembershipDTO`
// hydrated with the joined user's `email` / `displayName`. Sensitive
// user columns (passwordHash, refresh tokens, audit rows, archivedAt)
// are intentionally not exposed by this projection.
export function toOrganizationMemberDTO(
	row: Record<string, unknown>
): OrganizationMemberDTO {
	const base = toOrganizationMembershipDTO(row);
	const user = row["user"] as Record<string, unknown> | undefined;
	return {
		...base,
		userEmail: (user?.["email"] as string | undefined) ?? "",
		userDisplayName: (user?.["displayName"] as string | undefined) ?? "",
	};
}

export function toOrganizationInvitationDTO(
	row: Record<string, unknown>
): OrganizationInvitationDTO {
	return {
		id: row["id"] as string,
		organizationId: row["organizationId"] as string,
		email: row["email"] as string,
		role: row["role"] as OrganizationRole,
		status: row["status"] as InvitationStatus,
		invitedByUserId: row["invitedByUserId"] as string,
		expiresAt: toIso(row["expiresAt"] as Date),
		acceptedAt: toIsoNullable(row["acceptedAt"] as Date | null | undefined),
		revokedAt: toIsoNullable(row["revokedAt"] as Date | null | undefined),
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
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
	const matrix = row["textureSuitabilityJson"];
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
		salinitySeverity: asNullable(
			row["salinitySeverity"] as
				| SoilInterpretationDTO["salinitySeverity"]
				| undefined
		),
		sodicitySeverity: asNullable(
			row["sodicitySeverity"] as
				| SoilInterpretationDTO["sodicitySeverity"]
				| undefined
		),
		organicMatterCategory: asNullable(
			row["organicMatterCategory"] as string | null | undefined
		),
		infiltrationClass: asNullable(
			row["infiltrationClass"] as string | null | undefined
		),
		compactionRisk: asNullable(
			row["compactionRisk"] as
				| SoilInterpretationDTO["compactionRisk"]
				| undefined
		),
		textureSuitabilityJson:
			matrix && typeof matrix === "object"
				? (matrix as SoilInterpretationDTO["textureSuitabilityJson"])
				: null,
		createdAt: toIso(row["createdAt"] as Date),
		updatedAt: toIso(row["updatedAt"] as Date),
	};
}

export function toSoilReportDTO(row: Record<string, unknown>): SoilReportDTO {
	const currentVersion = row["currentVersion"] as
		| Record<string, unknown>
		| null
		| undefined;
	const latestVersionNumber =
		typeof currentVersion?.["versionNumber"] === "number"
			? (currentVersion["versionNumber"] as number)
			: 0;
	return {
		id: row["id"] as string,
		soilTestId: row["soilTestId"] as string,
		status: row["status"] as SoilReportStatus,
		title: asNullable(row["title"] as string | null | undefined),
		reportNumber: asNullable(row["reportNumber"] as string | null | undefined),
		archived: Boolean(row["archived"] ?? false),
		currentVersionId: asNullable(
			row["currentVersionId"] as string | null | undefined
		),
		latestVersionNumber,
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

