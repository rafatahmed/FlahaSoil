/**
 * FlahaSOIL v2 — Phase 10C-C Scientific Validation Dataset (inputs).
 *
 * A formal benchmark dataset of soils used to validate that, under the
 * FLAHA_DEFAULT control profile, FlahaSOIL returns scientifically
 * consistent texture, physics, chemistry, and interpretation outputs.
 *
 * SCOPE: this file defines benchmark INPUTS + metadata only. Expected
 * outputs live in `scientificValidationExpectations.ts`; the harness that
 * runs the production pipeline lives in `runScientificValidation.ts`.
 *
 * HONESTY: every benchmark here is a SYNTHETIC_BENCHMARK. These cases
 * validate internal consistency and expected scientific RANGES under
 * FLAHA_DEFAULT. They are NOT measured laboratory calibration datasets
 * and do not prove universal field accuracy. Measured/regional datasets
 * are reserved for a later phase (see the LAB_MEASURED / REGIONAL_DATASET
 * source slots, intentionally unused in Phase 10C-C).
 *
 * The structure is deliberately self-contained so it can later be
 * extracted into `packages/scientific-validation/` without change.
 */
import { SoilTestLevel } from "@flaha/shared-types";

/** Provenance of a benchmark soil. */
export type BenchmarkSourceType =
	| "SYNTHETIC_BENCHMARK"
	| "LITERATURE_REFERENCE"
	| "LAB_MEASURED"
	| "REGIONAL_DATASET";

/** Thematic group a benchmark exercises. */
export type BenchmarkCategory =
	| "TEXTURE_PHYSICS"
	| "CHEMISTRY"
	| "SALINITY_SODICITY"
	| "EVIDENCE_COMPLETENESS"
	| "EDGE_ROBUSTNESS";

/** Texture + physics inputs for a benchmark soil. */
export interface BenchmarkTextureInput {
	sandPercent: number;
	siltPercent: number;
	clayPercent: number;
	organicMatterPercent: number;
	bulkDensity?: number;
	gravelContent?: number;
}

/** Chemistry inputs for a benchmark soil (all optional). */
export interface BenchmarkChemistryInput {
	pH?: number;
	ecDsM?: number;
	cec?: number;
	ca?: number;
	mg?: number;
	k?: number;
	na?: number;
	n?: number;
	p?: number;
	kMgKg?: number;
	cl?: number;
	fe?: number;
	mn?: number;
	zn?: number;
	cu?: number;
	b?: number;
	carbonate?: number;
	bicarbonate?: number;
	sar?: number;
	esp?: number;
}

/** A single benchmark soil case (inputs + provenance metadata). */
export interface BenchmarkSoil {
	id: string;
	name: string;
	purpose: string;
	category: BenchmarkCategory;
	level: SoilTestLevel;
	sourceType: BenchmarkSourceType;
	texture: BenchmarkTextureInput;
	chemistry: BenchmarkChemistryInput | null;
	source: string;
	limitations: string;
}

const SYNTH: BenchmarkSourceType = "SYNTHETIC_BENCHMARK";

/** Standard low-salinity neutral chemistry used by texture/physics cases. */
const NEUTRAL_CHEM: BenchmarkChemistryInput = { pH: 7.0, ecDsM: 0.5 };

// ---------------------------------------------------------------------------
// Category A — Texture / Physics benchmarks (all 12 USDA classes)
// ---------------------------------------------------------------------------

function texturePhysics(
	id: string,
	name: string,
	texture: BenchmarkTextureInput
): BenchmarkSoil {
	return {
		id,
		name,
		purpose: `Validate USDA classification + Saxton-Rawls physics for ${name}.`,
		category: "TEXTURE_PHYSICS",
		level: SoilTestLevel.PRELIMINARY,
		sourceType: SYNTH,
		texture,
		chemistry: { ...NEUTRAL_CHEM },
		source:
			"Synthetic center-of-class composition consistent with the USDA " +
			"textural triangle (Soil Survey Manual, Handbook 18).",
		limitations:
			"Synthetic; validates internal consistency and Saxton-Rawls ranges, " +
			"not measured pressure-plate retention.",
	};
}

export const BENCHMARK_TEXTURE_PHYSICS: BenchmarkSoil[] = [
	texturePhysics("BENCH_SAND_01", "Sand", {
		sandPercent: 92, siltPercent: 5, clayPercent: 3, organicMatterPercent: 0.5,
	}),
	texturePhysics("BENCH_LOAMY_SAND_01", "Loamy Sand", {
		sandPercent: 82, siltPercent: 12, clayPercent: 6, organicMatterPercent: 1.0,
	}),
	texturePhysics("BENCH_SANDY_LOAM_01", "Sandy Loam", {
		sandPercent: 65, siltPercent: 25, clayPercent: 10, organicMatterPercent: 1.5,
	}),
	texturePhysics("BENCH_LOAM_01", "Loam", {
		sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0,
	}),
	texturePhysics("BENCH_SILT_LOAM_01", "Silt Loam", {
		sandPercent: 20, siltPercent: 65, clayPercent: 15, organicMatterPercent: 2.0,
	}),
	texturePhysics("BENCH_SILT_01", "Silt", {
		sandPercent: 6, siltPercent: 88, clayPercent: 6, organicMatterPercent: 1.8,
	}),
	texturePhysics("BENCH_SANDY_CLAY_LOAM_01", "Sandy Clay Loam", {
		sandPercent: 60, siltPercent: 15, clayPercent: 25, organicMatterPercent: 1.5,
	}),
	texturePhysics("BENCH_CLAY_LOAM_01", "Clay Loam", {
		sandPercent: 32, siltPercent: 34, clayPercent: 34, organicMatterPercent: 2.0,
	}),
	texturePhysics("BENCH_SILTY_CLAY_LOAM_01", "Silty Clay Loam", {
		sandPercent: 10, siltPercent: 56, clayPercent: 34, organicMatterPercent: 2.2,
	}),
	texturePhysics("BENCH_SANDY_CLAY_01", "Sandy Clay", {
		sandPercent: 52, siltPercent: 8, clayPercent: 40, organicMatterPercent: 1.5,
	}),
	texturePhysics("BENCH_SILTY_CLAY_01", "Silty Clay", {
		sandPercent: 5, siltPercent: 47, clayPercent: 48, organicMatterPercent: 2.0,
	}),
	texturePhysics("BENCH_CLAY_01", "Clay", {
		sandPercent: 20, siltPercent: 20, clayPercent: 60, organicMatterPercent: 1.5,
	}),
];

// ---------------------------------------------------------------------------
// Category B — Chemistry benchmarks (low / moderate / high CEC)
// ---------------------------------------------------------------------------

export const BENCHMARK_CHEMISTRY: BenchmarkSoil[] = [
	{
		id: "BENCH_CHEM_LOWCEC_SAND_01",
		name: "Low-CEC sandy soil",
		purpose: "Validate LAB-mode chemistry on a low-CEC sandy soil.",
		category: "CHEMISTRY",
		level: SoilTestLevel.MODERATE,
		sourceType: SYNTH,
		texture: {
			sandPercent: 85, siltPercent: 10, clayPercent: 5, organicMatterPercent: 0.8,
		},
		chemistry: { pH: 6.2, ecDsM: 0.4, cec: 5, ca: 2.5, mg: 0.8, k: 0.2, na: 0.1 },
		source: "Synthetic low-buffering coarse soil.",
		limitations: "Synthetic; validates cation/CEC consistency, not field fertility.",
	},
	{
		id: "BENCH_CHEM_MODCEC_LOAM_01",
		name: "Moderate-CEC loam",
		purpose: "Validate LAB-mode chemistry + cation balance on a balanced loam.",
		category: "CHEMISTRY",
		level: SoilTestLevel.MODERATE,
		sourceType: SYNTH,
		texture: {
			sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.5,
		},
		chemistry: { pH: 6.8, ecDsM: 0.9, cec: 18, ca: 11, mg: 3, k: 0.6, na: 0.3 },
		source: "Synthetic balanced agricultural loam.",
		limitations: "Synthetic; validates internal consistency only.",
	},
	{
		id: "BENCH_CHEM_HIGHCEC_CLAY_01",
		name: "High-CEC clay",
		purpose: "Validate LAB-mode chemistry on a high-CEC heavy clay.",
		category: "CHEMISTRY",
		level: SoilTestLevel.ADVANCED,
		sourceType: SYNTH,
		texture: {
			sandPercent: 15, siltPercent: 25, clayPercent: 60, organicMatterPercent: 3.0,
		},
		chemistry: {
			pH: 7.4, ecDsM: 1.2, cec: 35, ca: 22, mg: 7, k: 1.2, na: 0.6,
		},
		source: "Synthetic high-activity clay.",
		limitations: "Synthetic; validates internal consistency only.",
	},
];

// ---------------------------------------------------------------------------
// Category C — Salinity / Sodicity diagnostic benchmarks
// ---------------------------------------------------------------------------

const SALSOD_TEXTURE: BenchmarkTextureInput = {
	sandPercent: 60, siltPercent: 25, clayPercent: 15, organicMatterPercent: 2.0,
};

export const BENCHMARK_SALINITY_SODICITY: BenchmarkSoil[] = [
	{
		id: "BENCH_SAL_NORMAL_01",
		name: "Normal (non-saline, non-sodic) soil",
		purpose: "Control case: neither salinity nor sodicity flagged.",
		category: "SALINITY_SODICITY",
		level: SoilTestLevel.ADVANCED,
		sourceType: SYNTH,
		texture: { ...SALSOD_TEXTURE },
		chemistry: { pH: 7.2, ecDsM: 0.8, cec: 15, ca: 9, mg: 3, k: 0.5, na: 0.2 },
		source: "Synthetic FAO-29 style control.",
		limitations: "Synthetic diagnostic; validates label logic, not field salinity.",
	},
	{
		id: "BENCH_SAL_SALINE_01",
		name: "Saline (non-sodic) soil",
		purpose: "High EC, low Na: salinity flagged, sodicity not.",
		category: "SALINITY_SODICITY",
		level: SoilTestLevel.ADVANCED,
		sourceType: SYNTH,
		texture: { ...SALSOD_TEXTURE },
		chemistry: { pH: 8.0, ecDsM: 9.0, cec: 15, ca: 8, mg: 4, k: 0.5, na: 0.2 },
		source: "Synthetic FAO-29 style saline case.",
		limitations: "Synthetic diagnostic; validates label logic only.",
	},
	{
		id: "BENCH_SAL_SODIC_01",
		name: "Sodic (non-saline) soil",
		purpose: "Low EC, high Na: sodicity flagged, salinity not.",
		category: "SALINITY_SODICITY",
		level: SoilTestLevel.ADVANCED,
		sourceType: SYNTH,
		texture: { ...SALSOD_TEXTURE },
		chemistry: { pH: 8.8, ecDsM: 0.8, cec: 15, ca: 5, mg: 2, k: 0.5, na: 6.0 },
		source: "Synthetic FAO-29 style sodic case.",
		limitations: "Synthetic diagnostic; validates label logic only.",
	},
	{
		id: "BENCH_SAL_SALINE_SODIC_01",
		name: "Saline-sodic soil",
		purpose: "High EC and high Na: both salinity and sodicity flagged.",
		category: "SALINITY_SODICITY",
		level: SoilTestLevel.ADVANCED,
		sourceType: SYNTH,
		texture: { ...SALSOD_TEXTURE },
		chemistry: { pH: 8.4, ecDsM: 12.0, cec: 15, ca: 5, mg: 2, k: 0.5, na: 7.0 },
		source: "Synthetic FAO-29 style saline-sodic case.",
		limitations: "Synthetic diagnostic; validates label logic only.",
	},
];

// ---------------------------------------------------------------------------
// Category D — Evidence-completeness benchmarks
// ---------------------------------------------------------------------------

const EVIDENCE_TEXTURE: BenchmarkTextureInput = {
	sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0,
};

export const BENCHMARK_EVIDENCE: BenchmarkSoil[] = [
	{
		id: "BENCH_EV_PRELIM_01",
		name: "PRELIMINARY-level data",
		purpose: "Texture + pH/EC only: moderate/advanced modules NotRequired.",
		category: "EVIDENCE_COMPLETENESS",
		level: SoilTestLevel.PRELIMINARY,
		sourceType: SYNTH,
		texture: { ...EVIDENCE_TEXTURE },
		chemistry: { pH: 7.0, ecDsM: 1.0 },
		source: "Synthetic minimal-evidence case.",
		limitations: "Synthetic; validates coverage roll-up only.",
	},
	{
		id: "BENCH_EV_MODERATE_FULL_01",
		name: "MODERATE-level complete data",
		purpose: "Texture + pH/EC + full cation panel: required modules Met.",
		category: "EVIDENCE_COMPLETENESS",
		level: SoilTestLevel.MODERATE,
		sourceType: SYNTH,
		texture: { ...EVIDENCE_TEXTURE },
		chemistry: { pH: 7.0, ecDsM: 1.0, cec: 18, ca: 11, mg: 3, k: 0.6, na: 0.3, n: 25, p: 18 },
		source: "Synthetic complete-moderate case.",
		limitations: "Synthetic; validates coverage roll-up only.",
	},
	{
		id: "BENCH_EV_ADVANCED_FULL_01",
		name: "ADVANCED-level complete data",
		purpose: "Full lab panel incl. micros/carbonates: required modules Met.",
		category: "EVIDENCE_COMPLETENESS",
		level: SoilTestLevel.ADVANCED,
		sourceType: SYNTH,
		texture: { ...EVIDENCE_TEXTURE },
		chemistry: {
			pH: 7.2, ecDsM: 1.0, cec: 18, ca: 11, mg: 3, k: 0.6, na: 0.4,
			n: 25, p: 18, cl: 12, fe: 4.5, mn: 1.1, zn: 0.8, cu: 0.3, b: 0.7,
			carbonate: 0, bicarbonate: 4.2, sar: 0.6, esp: 2.0,
		},
		source: "Synthetic complete-advanced case.",
		limitations: "Synthetic; validates coverage roll-up only.",
	},
	{
		id: "BENCH_EV_MODERATE_MISSING_CATIONS_01",
		name: "MODERATE with missing cation panel",
		purpose: "Declared MODERATE but no cations: cations module Missing/Partial.",
		category: "EVIDENCE_COMPLETENESS",
		level: SoilTestLevel.MODERATE,
		sourceType: SYNTH,
		texture: { ...EVIDENCE_TEXTURE },
		chemistry: { pH: 7.2, ecDsM: 1.0, cl: 15 },
		source: "Synthetic partial-evidence case.",
		limitations: "Synthetic; validates honest missing-data reporting.",
	},
	{
		id: "BENCH_EV_ADVANCED_MISSING_MICROS_01",
		name: "ADVANCED with missing micronutrients",
		purpose: "Declared ADVANCED but no micros: micronutrient module Missing/Partial.",
		category: "EVIDENCE_COMPLETENESS",
		level: SoilTestLevel.ADVANCED,
		sourceType: SYNTH,
		texture: { ...EVIDENCE_TEXTURE },
		chemistry: { pH: 8.3, ecDsM: 4.5, cec: 20, ca: 12, mg: 4, k: 0.8, na: 1.2 },
		source: "Synthetic partial-evidence case.",
		limitations: "Synthetic; validates honest missing-data reporting.",
	},
	{
		id: "BENCH_EV_MISSING_PH_01",
		name: "Missing pH",
		purpose: "Full cations but pH omitted: no pH category fabricated.",
		category: "EVIDENCE_COMPLETENESS",
		level: SoilTestLevel.MODERATE,
		sourceType: SYNTH,
		texture: { ...EVIDENCE_TEXTURE },
		chemistry: { ecDsM: 1.0, cec: 15, ca: 9, mg: 3, k: 0.5, na: 0.3 },
		source: "Synthetic missing-pH case.",
		limitations: "Synthetic; validates no-fabrication contract.",
	},
];

// ---------------------------------------------------------------------------
// Category E — Edge / robustness benchmarks
// ---------------------------------------------------------------------------

export const BENCHMARK_EDGE: BenchmarkSoil[] = [
	{
		id: "BENCH_EDGE_EXTREME_SAND_01",
		name: "Extreme sand (99/1/0)",
		purpose: "Robustness at the sand apex: finite physics, no NaN.",
		category: "EDGE_ROBUSTNESS",
		level: SoilTestLevel.PRELIMINARY,
		sourceType: SYNTH,
		texture: { sandPercent: 99, siltPercent: 1, clayPercent: 0, organicMatterPercent: 0.2 },
		chemistry: { ...NEUTRAL_CHEM },
		source: "Synthetic apex case.",
		limitations: "Synthetic; robustness probe only.",
	},
	{
		id: "BENCH_EDGE_EXTREME_CLAY_01",
		name: "Extreme clay (5/5/90)",
		purpose: "Robustness at the clay apex: finite physics, no NaN.",
		category: "EDGE_ROBUSTNESS",
		level: SoilTestLevel.PRELIMINARY,
		sourceType: SYNTH,
		texture: { sandPercent: 5, siltPercent: 5, clayPercent: 90, organicMatterPercent: 1.0 },
		chemistry: { ...NEUTRAL_CHEM },
		source: "Synthetic apex case.",
		limitations: "Synthetic; robustness probe only.",
	},
	{
		id: "BENCH_EDGE_HIGH_OM_01",
		name: "High organic matter loam",
		purpose: "High OM (8%): finite physics, elevated water retention.",
		category: "EDGE_ROBUSTNESS",
		level: SoilTestLevel.PRELIMINARY,
		sourceType: SYNTH,
		texture: { sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 8.0 },
		chemistry: { ...NEUTRAL_CHEM },
		source: "Synthetic high-OM case.",
		limitations: "Synthetic; robustness probe only.",
	},
	{
		id: "BENCH_EDGE_LOW_OM_01",
		name: "Low organic matter loam",
		purpose: "Near-zero OM (0.1%): finite physics, no NaN.",
		category: "EDGE_ROBUSTNESS",
		level: SoilTestLevel.PRELIMINARY,
		sourceType: SYNTH,
		texture: { sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 0.1 },
		chemistry: { ...NEUTRAL_CHEM },
		source: "Synthetic low-OM case.",
		limitations: "Synthetic; robustness probe only.",
	},
	{
		id: "BENCH_EDGE_HIGH_BD_01",
		name: "High bulk density clay loam",
		purpose: "User BD 1.65 g/cm³ on clay loam: Ksat stays finite (BUG-10B-01 guard).",
		category: "EDGE_ROBUSTNESS",
		level: SoilTestLevel.ADVANCED,
		sourceType: SYNTH,
		texture: {
			sandPercent: 32, siltPercent: 34, clayPercent: 34,
			organicMatterPercent: 1.2, bulkDensity: 1.65,
		},
		chemistry: { pH: 7.8, ecDsM: 1.0, cec: 20, ca: 12, mg: 4, k: 0.7, na: 0.4 },
		source: "Synthetic compaction probe (Phase 10B regression).",
		limitations: "Synthetic; robustness probe only.",
	},
	{
		id: "BENCH_EDGE_ZERO_CATIONS_01",
		name: "Absent cations at MODERATE",
		purpose: "No cations supplied: CEC handled safely, no NaN base saturation.",
		category: "EDGE_ROBUSTNESS",
		level: SoilTestLevel.MODERATE,
		sourceType: SYNTH,
		texture: { sandPercent: 50, siltPercent: 30, clayPercent: 20, organicMatterPercent: 1.5 },
		chemistry: { pH: 6.5, ecDsM: 0.6 },
		source: "Synthetic missing-cation probe.",
		limitations: "Synthetic; robustness probe only.",
	},
];

/** The complete benchmark dataset, in stable category order. */
export const ALL_BENCHMARKS: BenchmarkSoil[] = [
	...BENCHMARK_TEXTURE_PHYSICS,
	...BENCHMARK_CHEMISTRY,
	...BENCHMARK_SALINITY_SODICITY,
	...BENCHMARK_EVIDENCE,
	...BENCHMARK_EDGE,
];
