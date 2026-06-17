/**
 * FlahaSOIL v2 API — scientific-analysis composition service (Phase 10A).
 *
 * Bundles the three Phase-10 visual-analytics engines (texture
 * triangle, water-retention curve, cation/structure triangle) into the
 * single payload consumed by `GET /api/v2/soil-tests/:id/scientific-
 * analysis`. The service performs **no scientific computation** — it
 * only orchestrates calls into the `@flaha/soil-*` packages and emits
 * partial-data warnings when an input block is missing.
 *
 * Tenancy: the controller wraps this in `requireSoilTestAccess`; this
 * service trusts its `soilTestId` and never re-checks cross-tenant.
 */

import {
	computeScientificCoverage,
	SoilTestLevel,
	type ScientificAnalysisResponse,
	type StructureAnalysisBlock,
	type TextureAnalysisBlock,
	type WaterRetentionAnalysisBlock,
} from "@flaha/shared-types";
import {
	classifyCationStructure,
	STRUCTURE_TRIANGLE_DISCLAIMER,
} from "@flaha/soil-chemistry";
import {
	barycentricToCartesian,
	buildWaterRetentionCurve,
	classifyTexture,
	normalizeTextureFractions,
} from "@flaha/soil-physics";

import { getPrismaClient } from "../prisma/client";
import { ApiError } from "../utils/apiError";

interface TextureRow {
	sandPercent: number | null;
	siltPercent: number | null;
	clayPercent: number | null;
	organicMatterPercent: number | null;
	bulkDensity: number | null;
}

interface ChemistryRow {
	ca: number | null;
	mg: number | null;
	k: number | null;
	na: number | null;
	cec: number | null;
}

function readNumber(value: unknown): number | null {
	if (value === null || value === undefined) return null;
	const n = typeof value === "number" ? value : Number(value);
	return Number.isFinite(n) ? n : null;
}

function buildTextureBlock(t: TextureRow): TextureAnalysisBlock {
	const normalized = normalizeTextureFractions(
		t.sandPercent ?? undefined,
		t.siltPercent ?? undefined,
		t.clayPercent ?? undefined
	);
	const classification = classifyTexture(
		normalized.sand,
		normalized.silt,
		normalized.clay
	);
	const point = barycentricToCartesian({
		sand: normalized.sand,
		silt: normalized.silt,
		clay: normalized.clay,
	});
	return {
		sand: normalized.sand,
		silt: normalized.silt,
		clay: normalized.clay,
		derived: normalized.derived,
		sumOk: normalized.sumOk,
		sumDelta: normalized.sumDelta,
		normalized: {
			sand: normalized.sand,
			silt: normalized.silt,
			clay: normalized.clay,
		},
		point,
		classification: classification.className,
		matched: classification.matched,
	};
}

function buildRetentionBlock(t: TextureRow): WaterRetentionAnalysisBlock | null {
	if (t.sandPercent === null || t.clayPercent === null) return null;
	const curve = buildWaterRetentionCurve({
		sand: t.sandPercent,
		clay: t.clayPercent,
		...(t.organicMatterPercent !== null
			? { organicMatter: t.organicMatterPercent }
			: {}),
		...(t.bulkDensity !== null ? { densityFactor: t.bulkDensity } : {}),
	});
	return {
		method: curve.method,
		textureClass: curve.textureClass,
		points: curve.points,
		saturation: curve.saturation,
		fieldCapacity: curve.fieldCapacity,
		wiltingPoint: curve.wiltingPoint,
		irrigationThreshold: curve.irrigationThreshold,
		plantAvailableWater: curve.plantAvailableWater,
		madFraction: curve.madFraction,
		airEntryTensionKpa: curve.airEntryTensionKpa,
		parameterA: curve.parameterA,
		parameterB: curve.parameterB,
		// Phase 10A.7 (WS1) — explicit unit anchors.
		units: {
			waterContent: "% v/v",
			tension: "kPa",
			plantAvailableWater: "% v/v",
		},
		// Phase 10A.7 (WS2 — R2) — bulk-density traceability echo.
		bulkDensity: {
			predicted: curve.bulkDensity.predicted,
			used: curve.bulkDensity.used,
			source: curve.bulkDensity.source,
			unit: "g/cm³",
		},
	};
}

function buildStructureBlock(c: ChemistryRow): StructureAnalysisBlock | null {
	const ca = c.ca ?? 0;
	const mg = c.mg ?? 0;
	const k = c.k ?? 0;
	// If none of the three cations are present we cannot build the
	// triangle (every coordinate would be zero). Treat this as a
	// missing-input case.
	if (c.ca === null && c.mg === null && c.k === null) return null;
	const s = classifyCationStructure({
		ca,
		mg,
		k,
		...(c.na !== null ? { na: c.na } : {}),
		...(c.cec !== null ? { cec: c.cec } : {}),
	});
	return {
		ca,
		mg,
		k,
		na: c.na,
		cec: c.cec,
		normalized: s.normalized,
		point: s.point,
		classification: s.classification,
		matched: s.matched,
		caMgRatio: s.caMgRatio,
		caKRatio: s.caKRatio,
		mgKRatio: s.mgKRatio,
		basesTotal: s.basesTotal,
		// Phase 10A.7 (WS5 — R3) — explicit unit + mandatory Bear/Albrecht caveat.
		unit: "cmol(+)/kg",
		disclaimer: STRUCTURE_TRIANGLE_DISCLAIMER,
	};
}

export async function getScientificAnalysis(
	soilTestId: string
): Promise<ScientificAnalysisResponse> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilTest.findUnique({
		where: { id: soilTestId },
		include: { textureInput: true, chemistryInput: true },
	})) as Record<string, unknown> | null;

	if (!row) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}

	const warnings: string[] = [];
	let texture: TextureAnalysisBlock | null = null;
	let waterRetention: WaterRetentionAnalysisBlock | null = null;
	let structure: StructureAnalysisBlock | null = null;

	const textureRow = row["textureInput"] as Record<string, unknown> | null;
	if (textureRow) {
		const t: TextureRow = {
			sandPercent: readNumber(textureRow["sandPercent"]),
			siltPercent: readNumber(textureRow["siltPercent"]),
			clayPercent: readNumber(textureRow["clayPercent"]),
			organicMatterPercent: readNumber(textureRow["organicMatterPercent"]),
			bulkDensity: readNumber(textureRow["bulkDensity"]),
		};
		const present = [t.sandPercent, t.siltPercent, t.clayPercent].filter(
			(v) => v !== null
		).length;
		if (present >= 2) {
			texture = buildTextureBlock(t);
			if (!texture.sumOk) {
				warnings.push(
					`Texture fractions sum to ${(100 + texture.sumDelta).toFixed(1)} % — engine normalised before plotting.`
				);
			}
			waterRetention = buildRetentionBlock(t);
		} else {
			warnings.push(
				"Texture inputs incomplete (≥ 2 of sand/silt/clay required) — texture triangle unavailable."
			);
		}
	} else {
		warnings.push("Texture inputs missing — texture triangle unavailable.");
	}

	const chemistryRow = row["chemistryInput"] as Record<string, unknown> | null;
	if (chemistryRow) {
		const c: ChemistryRow = {
			ca: readNumber(chemistryRow["ca"]),
			mg: readNumber(chemistryRow["mg"]),
			k: readNumber(chemistryRow["k"]),
			na: readNumber(chemistryRow["na"]),
			cec: readNumber(chemistryRow["cec"]),
		};
		structure = buildStructureBlock(c);
		if (!structure) {
			warnings.push(
				"Chemistry inputs present but Ca/Mg/K all missing — structure triangle unavailable."
			);
		}
	} else {
		warnings.push("Chemistry inputs missing — structure triangle unavailable.");
	}

	const declaredLevel = readLevel(row["testLevel"]);
	const coverage = computeScientificCoverage(declaredLevel, {
		texture: textureRow,
		chemistry: chemistryRow,
	});

	return {
		soilTestId,
		texture,
		waterRetention,
		structure,
		warnings,
		coverage,
	};
}

function readLevel(value: unknown): SoilTestLevel {
	if (value === SoilTestLevel.ADVANCED || value === SoilTestLevel.MODERATE) {
		return value;
	}
	return SoilTestLevel.PRELIMINARY;
}
