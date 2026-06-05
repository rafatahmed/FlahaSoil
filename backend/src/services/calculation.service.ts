/**
 * FlahaSOIL v2 API — engine orchestration.
 *
 * Composes the three scientific engines (`@flaha/soil-physics`,
 * `@flaha/soil-chemistry`, `@flaha/soil-interpretation`) in response to
 * a `POST /soil-tests/:soilTestId/calculate` request and persists each
 * engine's output to its own table via Prisma upsert.
 *
 * Hard rules:
 *   - This module only orchestrates. No scientific computation lives here.
 *   - Engine outputs are persisted as-is (string→number `parseFloat`
 *     round-trip happens at the persistence boundary, per
 *     `prisma/v2-schema.prisma` MODEL 5 comment).
 *   - On a missing/invalid input, raise the documented `ApiError` codes
 *     (`MISSING_REQUIRED_INPUT`, `CALCULATION_ERROR`); never leak the raw
 *     engine `Error.message` shape to the client.
 */

import type {
	CalculateSoilTestResponse,
	SoilChemistryResultDTO,
	SoilInterpretationDTO,
	SoilPhysicsResultDTO,
	SystemWarning,
} from "@flaha/shared-types";
import { calculateSoilChemistry } from "@flaha/soil-chemistry";
import type { SoilChemistryResult } from "@flaha/soil-chemistry";
import { interpretSoil } from "@flaha/soil-interpretation";
import type { SoilInterpretationResult } from "@flaha/soil-interpretation";
import { calculateSoilPhysics } from "@flaha/soil-physics";
import type { SoilPhysicsResult } from "@flaha/soil-physics";

import { getPrismaClient } from "../prisma/client";
import { ApiError } from "../utils/apiError";
import {
	toRatingEnum,
	toSoilChemistryResultDTO,
	toSoilInterpretationDTO,
	toSoilPhysicsResultDTO,
} from "../utils/serializers";
import type { CalculateSoilTestParsed } from "../validation/schemas";
import {
	normalizeSalinity,
	SALINITY_INCONSISTENCY_WARNING,
	TDS_PER_DSM,
	type NormalizedSalinity,
} from "./salinityNormalization";
import { warnings as warn } from "./warningCatalog";

const CALC_VERSION = "v2.0.0";

interface LoadedTest {
	id: string;
	texture: Record<string, unknown> | null;
	chemistry: Record<string, unknown> | null;
	physicsResult: Record<string, unknown> | null;
	chemistryResult: Record<string, unknown> | null;
}

interface NormalizedTest extends LoadedTest {
	/** Structured warnings emitted while normalizing chemistry inputs. */
	warningDetails: SystemWarning[];
	/** Full normalization result (echoed into the audit trace). */
	salinity: NormalizedSalinity;
}

async function loadTest(soilTestId: string): Promise<LoadedTest> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilTest.findUnique({
		where: { id: soilTestId },
		include: {
			textureInput: true,
			chemistryInput: true,
			physicsResult: true,
			chemistryResult: true,
		},
	})) as Record<string, unknown> | null;
	if (!row) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}
	return {
		id: row["id"] as string,
		texture: (row["textureInput"] as Record<string, unknown> | null) ?? null,
		chemistry:
			(row["chemistryInput"] as Record<string, unknown> | null) ?? null,
		physicsResult:
			(row["physicsResult"] as Record<string, unknown> | null) ?? null,
		chemistryResult:
			(row["chemistryResult"] as Record<string, unknown> | null) ?? null,
	};
}

/**
 * Reduces `chemistry.{ecDsM, tdsMgL}` to a single canonical EC and
 * surfaces any consistency warnings. EC always wins as the
 * authoritative salinity value (per Phase 7C requirements):
 *
 *   - `ecDsM` present       → used verbatim.
 *   - only `tdsMgL`         → derive `ecDsM = tdsMgL / 640`.
 *   - both, but disagree    → keep `ecDsM`; warn.
 *
 * The original `LoadedTest.chemistry` is not mutated; a shallow copy
 * with the canonical `ecDsM` patched in is returned. Safe for
 * PRELIMINARY tests (no CEC / cation dependency).
 */
function applySalinityNormalization(test: LoadedTest): NormalizedTest {
	const chem = test.chemistry;
	const empty: NormalizedSalinity = { derivedFromTds: false, warnings: [] };
	if (!chem) {
		return { ...test, warningDetails: [], salinity: empty };
	}
	const suppliedEc = num(chem["ecDsM"]);
	const suppliedTds = num(chem["tdsMgL"]);
	const normalized = normalizeSalinity({
		ecDsM: suppliedEc,
		tdsMgL: suppliedTds,
	});
	const patched: Record<string, unknown> = { ...chem };
	if (normalized.ecDsM !== undefined) {
		patched["ecDsM"] = normalized.ecDsM;
	}
	const warningDetails: SystemWarning[] = [];
	if (normalized.derivedFromTds && normalized.ecDsM !== undefined && normalized.tdsMgL !== undefined) {
		warningDetails.push(
			warn.ecDerivedFromTds({
				ecDsM: normalized.ecDsM,
				tdsMgL: normalized.tdsMgL,
			})
		);
	}
	if (normalized.warnings.includes(SALINITY_INCONSISTENCY_WARNING) && normalized.ecDsM !== undefined && suppliedTds !== undefined) {
		warningDetails.push(
			warn.tdsInconsistentWithEc({
				ecDsM: normalized.ecDsM,
				suppliedTdsMgL: suppliedTds,
				expectedTdsMgL: normalized.ecDsM * TDS_PER_DSM,
			})
		);
	}
	return {
		...test,
		chemistry: patched,
		warningDetails,
		salinity: normalized,
	};
}

function num(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const n = parseFloat(value);
		return Number.isFinite(n) ? n : undefined;
	}
	return undefined;
}

function requireNum(
	value: unknown,
	field: string,
	context: "physics" | "chemistry"
): number {
	const n = num(value);
	if (n === undefined) {
		throw ApiError.missingRequiredInput(
			`${context} engine requires ${field} to be a finite number`
		);
	}
	return n;
}

export async function calculateSoilTest(
	soilTestId: string,
	input: CalculateSoilTestParsed
): Promise<CalculateSoilTestResponse> {
	const loaded = await loadTest(soilTestId);
	const test = applySalinityNormalization(loaded);
	const warningDetails: SystemWarning[] = [...test.warningDetails];
	// Phase 8: physics trace is now always persisted (the column is
	// only populated when the engine ran this request, otherwise it
	// stays at whatever the previous calculation produced).
	const includeTrace = input.includeTrace !== false;

	let physicsRaw: SoilPhysicsResult | null = null;
	let chemistryRaw: SoilChemistryResult | null = null;

	const response: CalculateSoilTestResponse = {
		warnings: [],
		warningDetails: [],
	};

	if (input.runPhysics) {
		physicsRaw = runPhysicsEngine(test);
		response.physicsResult = await persistPhysics(
			test.id,
			physicsRaw,
			includeTrace
		);
	}

	if (input.runChemistry) {
		const mode = input.calculationMode ?? "LAB";
		const skip = chemistrySkipReason(test, mode);
		if (skip !== null) {
			// PRELIMINARY-style inputs (pH/EC only) and other partial-data
			// cases are valid: we record a warning and skip both engine
			// invocation and SoilChemistryResult persistence rather than
			// surfacing a 422. Interpretation will still consume pH/EC
			// from the raw chemistry input below.
			warningDetails.push(skip);
		} else {
			chemistryRaw = runChemistryEngine(test, mode);
			response.chemistryResult = await persistChemistry(
				test.id,
				chemistryRaw
			);
		}
	}

	if (input.runInterpretation) {
		const physicsForInterp =
			physicsRaw ??
			(test.physicsResult as Record<string, unknown> | null) ??
			null;
		const chemistryForInterp = resolveChemistryForInterpretation(
			chemistryRaw,
			test
		);
		const interpretationRaw = interpretSoil({
			physics: physicsForInterp as Record<string, unknown> | null,
			chemistry: chemistryForInterp,
		});
		response.interpretation = await persistInterpretation(
			test.id,
			interpretationRaw
		);
		for (const w of interpretationRaw.warnings) {
			warningDetails.push(warn.interpretation(w));
		}
	}

	response.warningDetails = warningDetails;
	response.warnings = warningDetails.map((w) => w.message);
	return response;
}

/**
 * Decides whether the chemistry engine has enough data to run.
 *
 * Returns `null` when it is safe to invoke the engine; returns a
 * human-readable reason string when chemistry must be skipped (the
 * caller surfaces it via the response `warnings` array).
 *
 * LAB mode requires either an explicit `cec` or at least one of
 * `ca`/`mg`/`k`/`na` so that `resolveCecAndCations` in the engine
 * produces a non-zero CEC. ESTIMATED mode requires positive
 * `clay` + `organicMatter` from the texture input.
 */
function chemistrySkipReason(
	test: LoadedTest,
	mode: "LAB" | "ESTIMATED"
): SystemWarning | null {
	if (mode === "LAB") {
		const chem = test.chemistry;
		if (!chem) {
			return warn.chemistrySkippedNoInput(
				"Chemistry calculation skipped: no chemistry input on this " +
					"soil test."
			);
		}
		const cec = num(chem["cec"]);
		const ca = num(chem["ca"]);
		const mg = num(chem["mg"]);
		const k = num(chem["k"]);
		const na = num(chem["na"]);
		const cationSum =
			(ca ?? 0) + (mg ?? 0) + (k ?? 0) + (na ?? 0);
		const hasCec = cec !== undefined && cec > 0;
		const hasCations =
			ca !== undefined ||
			mg !== undefined ||
			k !== undefined ||
			na !== undefined;
		if (!hasCec && (!hasCations || cationSum <= 0)) {
			return warn.chemistrySkippedPreliminary(
				"Chemistry calculation skipped: PRELIMINARY-style input " +
					"(pH/EC only); CEC and cation data (Ca, Mg, K, Na) are " +
					"required for the chemistry engine."
			);
		}
		return null;
	}

	// ESTIMATED
	const tex = test.texture;
	if (!tex) {
		return warn.chemistrySkippedInsufficientTexture(
			"Chemistry calculation skipped: ESTIMATED mode requires a " +
				"texture input with clay and organic matter."
		);
	}
	const clay = num(tex["clayPercent"]);
	const om = num(tex["organicMatterPercent"]);
	if (
		clay === undefined ||
		om === undefined ||
		clay <= 0 ||
		om <= 0
	) {
		return warn.chemistrySkippedInsufficientTexture(
			"Chemistry calculation skipped: ESTIMATED mode requires positive " +
				"clay and organic-matter percentages."
		);
	}
	return null;
}

/**
 * Builds the `chemistry` argument passed to the interpretation engine.
 *
 * Preference order:
 *   1. Fresh `SoilChemistryResult` produced this request.
 *   2. Previously persisted `SoilChemistryResult`.
 *   3. A minimal projection of the raw `SoilChemistryInput` exposing
 *      `pH`/`ecDsM` so the interpretation can still classify pH and
 *      salinity even when full chemistry was skipped.
 */
function resolveChemistryForInterpretation(
	chemistryRaw: SoilChemistryResult | null,
	test: LoadedTest
): Record<string, unknown> | null {
	if (chemistryRaw) {
		return chemistryRaw as unknown as Record<string, unknown>;
	}
	if (test.chemistryResult) {
		return test.chemistryResult as Record<string, unknown>;
	}
	const chem = test.chemistry;
	if (!chem) return null;
	const ph = num(chem["pH"]);
	const ec = num(chem["ecDsM"]);
	if (ph === undefined && ec === undefined) return null;
	const projection: Record<string, unknown> = {};
	if (ph !== undefined) projection["ph"] = ph;
	if (ec !== undefined) projection["ec"] = ec;
	return projection;
}

function runPhysicsEngine(test: LoadedTest): SoilPhysicsResult {
	if (!test.texture) {
		throw ApiError.missingRequiredInput(
			"Physics engine requires SoilTextureInput; create the test with a textureInput payload."
		);
	}
	const sand = requireNum(test.texture["sandPercent"], "sandPercent", "physics");
	const clay = requireNum(test.texture["clayPercent"], "clayPercent", "physics");
	const om = num(test.texture["organicMatterPercent"]);
	const gravel = num(test.texture["gravelPercent"]);
	const ec = test.chemistry ? num(test.chemistry["ecDsM"]) : undefined;

	try {
		return calculateSoilPhysics({
			sand,
			clay,
			...(om !== undefined ? { organicMatter: om } : {}),
			...(gravel !== undefined ? { gravelContent: gravel } : {}),
			...(ec !== undefined ? { electricalConductivity: ec } : {}),
			userPlan: "PROFESSIONAL",
		});
	} catch (err) {
		throw ApiError.calculation(
			`Physics engine failed: ${err instanceof Error ? err.message : String(err)}`
		);
	}
}

function runChemistryEngine(
	test: LoadedTest,
	mode: "LAB" | "ESTIMATED"
): SoilChemistryResult {
	const chem = test.chemistry;
	const tex = test.texture;

	if (mode === "LAB" && !chem) {
		throw ApiError.missingRequiredInput(
			"Chemistry engine (LAB) requires SoilChemistryInput."
		);
	}
	if (mode === "ESTIMATED" && !tex) {
		throw ApiError.missingRequiredInput(
			"Chemistry engine (ESTIMATED) requires SoilTextureInput."
		);
	}

	const input: Record<string, unknown> = { mode };
	if (chem) {
		const keys = ["cec", "ca", "mg", "k", "na"] as const;
		for (const k of keys) {
			const v = num(chem[k]);
			if (v !== undefined) input[k] = v;
		}
		const ph = num(chem["pH"]);
		if (ph !== undefined) input["ph"] = ph;
		const ec = num(chem["ecDsM"]);
		if (ec !== undefined) input["ec"] = ec;
	}
	if (tex) {
		const sand = num(tex["sandPercent"]);
		const clay = num(tex["clayPercent"]);
		const om = num(tex["organicMatterPercent"]);
		if (sand !== undefined) input["sand"] = sand;
		if (clay !== undefined) input["clay"] = clay;
		if (om !== undefined) input["organicMatter"] = om;
	}

	try {
		return calculateSoilChemistry(
			input as unknown as Parameters<typeof calculateSoilChemistry>[0]
		);
	} catch (err) {
		throw ApiError.calculation(
			`Chemistry engine failed: ${err instanceof Error ? err.message : String(err)}`
		);
	}
}

async function persistPhysics(
	soilTestId: string,
	raw: SoilPhysicsResult,
	includeTrace: boolean
): Promise<SoilPhysicsResultDTO> {
	const prisma = getPrismaClient();
	const data: Record<string, unknown> = {
		soilTestId,
		fieldCapacity: parseFloat(raw.fieldCapacity),
		wiltingPoint: parseFloat(raw.wiltingPoint),
		plantAvailableWater: parseFloat(raw.plantAvailableWater),
		saturation: parseFloat(raw.saturation),
		saturatedConductivity: parseFloat(raw.saturatedConductivity),
		textureClass: raw.textureClass,
		bulkDensity: parseFloat(raw.bulkDensity),
		porosity: parseFloat(raw.porosity),
		voidRatio: parseFloat(raw.voidRatio),
		particleDensity: parseFloat(raw.particleDensity),
		soilQualityIndex: parseFloat(raw.soilQualityIndex),
		drainageClass: raw.drainageClass,
		compactionRisk: raw.compactionRisk,
		erosionRisk: raw.erosionRisk,
		calculationVersion: CALC_VERSION,
	};
	if (includeTrace) {
		data["calculationTraceJson"] = raw as unknown as Record<string, unknown>;
	}
	const row = (await prisma.soilPhysicsResult.upsert({
		where: { soilTestId },
		create: data,
		update: data,
	})) as Record<string, unknown>;
	return toSoilPhysicsResultDTO(row);
}

async function persistChemistry(
	soilTestId: string,
	raw: SoilChemistryResult
): Promise<SoilChemistryResultDTO> {
	const prisma = getPrismaClient();
	const data: Record<string, unknown> = {
		soilTestId,
		cec: raw.cec,
		baseSaturation: raw.baseSaturation,
		caPercent: raw.caPercent,
		mgPercent: raw.mgPercent,
		kPercent: raw.kPercent,
		naPercent: raw.naPercent,
		esp: raw.esp,
		sar: raw.sar ?? null,
		cationBalanceOther: raw.cationBalanceOther,
		calculationMode: raw.calculationMode,
	};
	const row = (await prisma.soilChemistryResult.upsert({
		where: { soilTestId },
		create: data,
		update: data,
	})) as Record<string, unknown>;
	return toSoilChemistryResultDTO(row);
}

async function persistInterpretation(
	soilTestId: string,
	raw: SoilInterpretationResult
): Promise<SoilInterpretationDTO> {
	const prisma = getPrismaClient();
	const data: Record<string, unknown> = {
		soilTestId,
		phCategory: raw.phCategory ?? null,
		salinityRisk: raw.salinityRisk ?? null,
		cecLevel: raw.cecLevel ?? null,
		baseSaturationCategory: raw.baseSaturationCategory ?? null,
		cationBalance: raw.cationBalance ?? null,
		sodiumRisk: raw.sodiumRisk ?? null,
		waterHoldingClass: raw.waterHoldingClass ?? null,
		drainageClass: raw.drainageClass ?? null,
		overallSoilRating: toRatingEnum(raw.overallSoilRating),
		warningsJson: raw.warnings,
		// Phase 8D — extended classifications. Each field is independently
		// nullable; the engine omits keys whose inputs are missing.
		salinitySeverity: raw.salinitySeverity ?? null,
		sodicitySeverity: raw.sodicitySeverity ?? null,
		organicMatterCategory: raw.organicMatterCategory ?? null,
		infiltrationClass: raw.infiltrationClass ?? null,
		compactionRisk: raw.compactionRisk ?? null,
		textureSuitabilityJson: raw.textureSuitability ?? null,
	};
	const row = (await prisma.soilInterpretation.upsert({
		where: { soilTestId },
		create: data,
		update: data,
	})) as Record<string, unknown>;
	return toSoilInterpretationDTO(row);
}
