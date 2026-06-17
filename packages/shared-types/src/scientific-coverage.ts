/**
 * @flaha/shared-types — Phase 10A.7 (Correction) evidence-coverage engine.
 *
 * Restores `SoilTestLevel` as the primary evidence contract: the
 * declared test level decides which modules are *expected*; the lab
 * inputs decide what was *submitted*. The function reports actual vs
 * expected without ever hard-blocking extra data — extras count as
 * supplementary, never as failures.
 *
 * Pure, side-effect-free, and dependency-free so the same function
 * powers the backend service, the report composer, and any frontend
 * preview. The constants in `SOIL_TEST_LEVEL_EXPECTATIONS` are the
 * single source of truth for "what does each level cover?".
 */

import {
	type CoverageModule,
	type CoverageStatus,
	type LevelCompleteness,
	type ScientificCoverage,
} from "./scientific-analysis";
import { SoilTestLevel } from "./soil-domain";

export interface ModuleSpec {
	id: string;
	label: string;
	requiredFrom: SoilTestLevel | null;
	fields: Array<{ key: string; source: "texture" | "chemistry"; path: string }>;
	/** Alternate groups: any one key present satisfies the whole group. */
	alternates?: Array<{ id: string; keys: string[] }>;
}

const LEVEL_RANK: Record<SoilTestLevel, number> = {
	[SoilTestLevel.PRELIMINARY]: 0,
	[SoilTestLevel.MODERATE]: 1,
	[SoilTestLevel.ADVANCED]: 2,
};

export const SOIL_TEST_LEVEL_EXPECTATIONS: ModuleSpec[] = [
	{
		id: "texture", label: "Soil texture", requiredFrom: SoilTestLevel.PRELIMINARY,
		fields: [
			{ key: "sandPercent",          source: "texture", path: "sandPercent" },
			{ key: "siltPercent",          source: "texture", path: "siltPercent" },
			{ key: "clayPercent",          source: "texture", path: "clayPercent" },
			{ key: "organicMatterPercent", source: "texture", path: "organicMatterPercent" },
		],
	},
	{
		id: "basicChemistry", label: "pH / salinity", requiredFrom: SoilTestLevel.PRELIMINARY,
		fields: [
			{ key: "pH",  source: "chemistry", path: "pH" },
			{ key: "EC",  source: "chemistry", path: "ecDsM" },
			{ key: "TDS", source: "chemistry", path: "tdsMgL" },
		],
		alternates: [{ id: "salinity", keys: ["EC", "TDS"] }],
	},
	{
		id: "cations", label: "Cation panel", requiredFrom: SoilTestLevel.MODERATE,
		fields: [
			{ key: "Ca",  source: "chemistry", path: "ca"  },
			{ key: "Mg",  source: "chemistry", path: "mg"  },
			{ key: "K",   source: "chemistry", path: "k"   },
			{ key: "Na",  source: "chemistry", path: "na"  },
			{ key: "CEC", source: "chemistry", path: "cec" },
		],
	},
	{
		id: "macroNutrients", label: "Macro-nutrients (N / P / Cl)", requiredFrom: SoilTestLevel.MODERATE,
		fields: [
			{ key: "N",  source: "chemistry", path: "n"  },
			{ key: "P",  source: "chemistry", path: "p"  },
			{ key: "Cl", source: "chemistry", path: "cl" },
		],
	},
	{
		id: "micronutrients", label: "Micro-nutrients", requiredFrom: SoilTestLevel.ADVANCED,
		fields: [
			{ key: "Fe", source: "chemistry", path: "fe" },
			{ key: "Mn", source: "chemistry", path: "mn" },
			{ key: "Zn", source: "chemistry", path: "zn" },
			{ key: "Cu", source: "chemistry", path: "cu" },
			{ key: "B",  source: "chemistry", path: "b"  },
		],
	},
	{
		id: "carbonates", label: "Carbonates / bicarbonates", requiredFrom: SoilTestLevel.ADVANCED,
		fields: [
			{ key: "CO3",  source: "chemistry", path: "carbonate"   },
			{ key: "HCO3", source: "chemistry", path: "bicarbonate" },
		],
	},
	{
		id: "sodicity", label: "Sodicity indicators (SAR / ESP)", requiredFrom: SoilTestLevel.ADVANCED,
		fields: [
			{ key: "SAR", source: "chemistry", path: "sar" },
			{ key: "ESP", source: "chemistry", path: "esp" },
		],
	},
	{
		id: "physics", label: "Bulk density / gravel", requiredFrom: null,
		fields: [
			{ key: "BulkDensity",   source: "texture", path: "bulkDensity"   },
			{ key: "GravelPercent", source: "texture", path: "gravelPercent" },
		],
	},
];

export interface CoverageInputs {
	texture?: Record<string, unknown> | null;
	chemistry?: Record<string, unknown> | null;
}

function isPresent(value: unknown): boolean {
	if (value === null || value === undefined) return false;
	if (typeof value === "number") return Number.isFinite(value);
	if (typeof value === "string") {
		if (value.trim() === "") return false;
		const n = parseFloat(value);
		return Number.isFinite(n);
	}
	return false;
}

function pickPresent(spec: ModuleSpec, inputs: CoverageInputs): Set<string> {
	const present = new Set<string>();
	const rows = {
		texture: (inputs.texture ?? {}) as Record<string, unknown>,
		chemistry: (inputs.chemistry ?? {}) as Record<string, unknown>,
	};
	for (const f of spec.fields) {
		if (isPresent(rows[f.source][f.path])) present.add(f.key);
	}
	return present;
}

function moduleIsRequired(spec: ModuleSpec, declared: SoilTestLevel): boolean {
	if (spec.requiredFrom === null) return false;
	return LEVEL_RANK[declared] >= LEVEL_RANK[spec.requiredFrom];
}


/**
 * Score one module against the declared level.
 *
 * Counting rules:
 *   - Each field is one expected slot.
 *   - Each alternate group collapses its member keys into a single
 *     extra slot satisfied if *any* member key is present (so labs are
 *     not penalised for measuring EC instead of TDS, or vice versa).
 *   - `extraSubmittedFields` are submitted-but-not-expected keys; they
 *     do not affect status (we never block extra data), they only
 *     credit the lab for going further than the declared level.
 */
function scoreModule(
	spec: ModuleSpec,
	declared: SoilTestLevel,
	inputs: CoverageInputs
): { module: CoverageModule; expectedSlots: number; satisfiedSlots: number } {
	const required = moduleIsRequired(spec, declared);
	const present = pickPresent(spec, inputs);
	const expectedFields = spec.fields.map((f) => f.key);
	const submittedFields = expectedFields.filter((k) => present.has(k));

	let expectedSlots = 0;
	let satisfiedSlots = 0;
	const missingExpectedFields: string[] = [];
	const consumed = new Set<string>();
	for (const grp of spec.alternates ?? []) {
		expectedSlots += 1;
		const anyPresent = grp.keys.some((k) => present.has(k));
		if (anyPresent) satisfiedSlots += 1;
		else missingExpectedFields.push(grp.id);
		for (const k of grp.keys) consumed.add(k);
	}
	for (const f of spec.fields) {
		if (consumed.has(f.key)) continue;
		expectedSlots += 1;
		if (present.has(f.key)) satisfiedSlots += 1;
		else missingExpectedFields.push(f.key);
	}

	let status: CoverageStatus;
	if (!required) {
		status = "NotRequired";
	} else if (satisfiedSlots === expectedSlots) {
		status = "Met";
	} else if (satisfiedSlots === 0) {
		status = "Missing";
	} else {
		status = "Partial";
	}

	const module: CoverageModule = {
		id: spec.id,
		label: spec.label,
		requiredFrom: spec.requiredFrom,
		required,
		expectedFields,
		submittedFields,
		missingExpectedFields: required ? missingExpectedFields : [],
		extraSubmittedFields: required ? [] : submittedFields,
		status,
	};

	return {
		module,
		expectedSlots: required ? expectedSlots : 0,
		satisfiedSlots: required ? satisfiedSlots : 0,
	};
}

function buildLevelStatement(
	declared: SoilTestLevel,
	satisfied: number,
	expected: number,
	status: CoverageStatus
): string {
	if (expected === 0) {
		return `${declared} test level — no expected modules at this level.`;
	}
	if (status === "Met") {
		return `${declared} test level — Complete evidence: all ${expected} expected field(s) submitted.`;
	}
	if (status === "Missing") {
		return `${declared} test level — Incomplete: 0 of ${expected} expected field(s) submitted.`;
	}
	return `${declared} test level — Partial evidence: ${satisfied} of ${expected} expected field(s) submitted.`;
}

export function computeScientificCoverage(
	declaredLevel: SoilTestLevel,
	inputs: CoverageInputs
): ScientificCoverage {
	const modules: CoverageModule[] = [];
	let totalExpected = 0;
	let totalSatisfied = 0;
	for (const spec of SOIL_TEST_LEVEL_EXPECTATIONS) {
		const scored = scoreModule(spec, declaredLevel, inputs);
		modules.push(scored.module);
		totalExpected += scored.expectedSlots;
		totalSatisfied += scored.satisfiedSlots;
	}

	const requiredModules = modules.filter((m) => m.required);
	let levelStatus: CoverageStatus;
	if (requiredModules.length === 0) {
		levelStatus = "NotRequired";
	} else if (requiredModules.every((m) => m.status === "Met")) {
		levelStatus = "Met";
	} else if (requiredModules.every((m) => m.status === "Missing")) {
		levelStatus = "Missing";
	} else {
		levelStatus = "Partial";
	}

	const coveragePercent =
		totalExpected === 0
			? 100
			: Math.round((totalSatisfied / totalExpected) * 1000) / 10;

	const level: LevelCompleteness = {
		declaredLevel,
		status: levelStatus,
		coveragePercent,
		statement: buildLevelStatement(
			declaredLevel,
			totalSatisfied,
			totalExpected,
			levelStatus
		),
		metModules: requiredModules.filter((m) => m.status === "Met").map((m) => m.id),
		partialModules: requiredModules
			.filter((m) => m.status === "Partial")
			.map((m) => m.id),
		missingModules: requiredModules
			.filter((m) => m.status === "Missing")
			.map((m) => m.id),
	};

	return { level, modules };
}
