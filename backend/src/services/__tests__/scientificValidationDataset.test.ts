/**
 * FlahaSOIL v2 — Phase 10C-C Scientific Validation Dataset tests.
 *
 * These tests validate that the FLAHA_DEFAULT control profile produces
 * internally consistent, scientifically defensible outputs for every
 * synthetic benchmark defined in the Scientific Validation Dataset.
 *
 * They do NOT replace measured lab calibration; they verify:
 *   1. Dataset integrity (unique IDs, texture sums, correct counts).
 *   2. USDA texture classification matches FLAHA_DEFAULT control outputs.
 *   3. Physics values (FC, WP, Ksat) follow coarse-to-fine trends.
 *   4. Salinity/sodicity severity labels are logically consistent.
 *   5. Evidence-completeness coverage tracks declared lab level.
 *   6. Edge-robustness cases complete without throwing.
 *
 * Control outputs were captured via the discovery run on 2026-06-17
 * (_discovery.test.ts was deleted before commit).
 */
import { beforeAll, describe, expect, it } from "vitest";

import {
	ALL_BENCHMARKS,
	BENCHMARK_CHEMISTRY,
	BENCHMARK_EDGE,
	BENCHMARK_EVIDENCE,
	BENCHMARK_SALINITY_SODICITY,
	BENCHMARK_TEXTURE_PHYSICS,
} from "./fixtures/scientificValidationDataset";
import {
	runBenchmarkSoilCase,
	type BenchmarkRunResult,
} from "./fixtures/runScientificValidation";

// ─── One-time pipeline run for all 31 benchmarks ─────────────────────────────

const results = new Map<string, BenchmarkRunResult>();

beforeAll(async () => {
	for (const b of ALL_BENCHMARKS) {
		results.set(b.id, await runBenchmarkSoilCase(b));
	}
}, 180_000);

const dto = (id: string) => results.get(id)!.dto;

// ─── 1. Dataset integrity ─────────────────────────────────────────────────────

describe("1 · Dataset integrity", () => {
	it("31 total benchmarks", () => expect(ALL_BENCHMARKS.length).toBe(31));

	it("all IDs are unique", () => {
		const ids = ALL_BENCHMARKS.map((b) => b.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("texture percentages sum to 100 for every benchmark", () => {
		for (const b of ALL_BENCHMARKS) {
			const sum =
				b.texture.sandPercent + b.texture.siltPercent + b.texture.clayPercent;
			expect(sum, `${b.id}: sand+silt+clay`).toBe(100);
		}
	});

	it("every benchmark has sourceType SYNTHETIC_BENCHMARK", () => {
		for (const b of ALL_BENCHMARKS)
			expect(b.sourceType, b.id).toBe("SYNTHETIC_BENCHMARK");
	});

	it("category counts are correct", () => {
		expect(BENCHMARK_TEXTURE_PHYSICS.length).toBe(12);
		expect(BENCHMARK_CHEMISTRY.length).toBe(3);
		expect(BENCHMARK_SALINITY_SODICITY.length).toBe(4);
		expect(BENCHMARK_EVIDENCE.length).toBe(6);
		expect(BENCHMARK_EDGE.length).toBe(6);
	});
});

// ─── 2. Category A — Texture / Physics ───────────────────────────────────────

describe("2 · Category A — Texture/Physics", () => {
	// Exact USDA classes after BUG-10C-C-01 fix to determineSoilTextureClass.
	// Discovery (2026-06-17) captured "Loam" for BENCH_SANDY_CLAY_LOAM_01 — that
	// was the bug. The corrected expectation is "Sandy Clay Loam".
	const USDA_EXPECTED: [string, string][] = [
		["BENCH_SAND_01",            "Sand"],
		["BENCH_LOAMY_SAND_01",      "Loamy Sand"],
		["BENCH_SANDY_LOAM_01",      "Sandy Loam"],
		["BENCH_LOAM_01",            "Loam"],
		["BENCH_SILT_LOAM_01",       "Silt Loam"],
		["BENCH_SILT_01",            "Silt"],
		["BENCH_SANDY_CLAY_LOAM_01", "Sandy Clay Loam"], // BUG-10C-C-01 fixed
		["BENCH_CLAY_LOAM_01",       "Clay Loam"],
		["BENCH_SILTY_CLAY_LOAM_01", "Silty Clay Loam"],
		["BENCH_SANDY_CLAY_01",      "Sandy Clay"],
		["BENCH_SILTY_CLAY_01",      "Silty Clay"],
		["BENCH_CLAY_01",            "Clay"],
	];

	it.each(USDA_EXPECTED)("%s → USDA class %s", (id, expected) => {
		expect(dto(id).texture.usdaClass).toBe(expected);
	});

	it("Ksat decreases coarse → fine (Sand > Sandy Loam > Clay Loam > Clay)", () => {
		const ksats = [
			dto("BENCH_SAND_01").physics.saturatedConductivity!,
			dto("BENCH_SANDY_LOAM_01").physics.saturatedConductivity!,
			dto("BENCH_CLAY_LOAM_01").physics.saturatedConductivity!,
			dto("BENCH_CLAY_01").physics.saturatedConductivity!,
		];
		for (let i = 1; i < ksats.length; i++)
			expect(ksats[i], `ksat[${i}] < ksat[${i - 1}]`).toBeLessThan(ksats[i - 1]);
	});

	it("field capacity increases coarse → fine", () => {
		const fc = [
			dto("BENCH_SAND_01").physics.fieldCapacity,
			dto("BENCH_SANDY_LOAM_01").physics.fieldCapacity,
			dto("BENCH_LOAM_01").physics.fieldCapacity,
			dto("BENCH_CLAY_LOAM_01").physics.fieldCapacity,
			dto("BENCH_CLAY_01").physics.fieldCapacity,
		];
		for (let i = 1; i < fc.length; i++)
			expect(fc[i], `fc[${i}] > fc[${i - 1}]`).toBeGreaterThan(fc[i - 1]);
	});

	it("bulk density source is DEFAULT for all Category A", () => {
		for (const b of BENCHMARK_TEXTURE_PHYSICS)
			expect(dto(b.id).physics.bulkDensityTrace?.source, b.id).toBe("DEFAULT");
	});

	it("physics values (FC, WP, sat, por, Ksat) are finite for all Category A", () => {
		for (const b of BENCHMARK_TEXTURE_PHYSICS) {
			const p = dto(b.id).physics;
			expect(Number.isFinite(p.fieldCapacity), `${b.id} fc`).toBe(true);
			expect(Number.isFinite(p.wiltingPoint), `${b.id} wp`).toBe(true);
			expect(Number.isFinite(p.saturation), `${b.id} sat`).toBe(true);
			expect(Number.isFinite(p.porosity), `${b.id} por`).toBe(true);
			expect(Number.isFinite(p.saturatedConductivity), `${b.id} ksat`).toBe(true);
		}
	});
});

// ─── 3. Category B — Chemistry ───────────────────────────────────────────────

describe("3 · Category B — Chemistry", () => {
	it("CEC source is LAB when cec is provided", () => {
		for (const b of BENCHMARK_CHEMISTRY)
			expect(dto(b.id).chemistry.cecSource, b.id).toBe("LAB");
	});

	it("calculation mode is LAB for all Chemistry benchmarks", () => {
		for (const b of BENCHMARK_CHEMISTRY)
			expect(dto(b.id).chemistry.calculationMode, b.id).toBe("LAB");
	});

	it("CEC magnitude follows low < moderate < high", () => {
		const low  = dto("BENCH_CHEM_LOWCEC_SAND_01").chemistry.cec!;
		const mid  = dto("BENCH_CHEM_MODCEC_LOAM_01").chemistry.cec!;
		const high = dto("BENCH_CHEM_HIGHCEC_CLAY_01").chemistry.cec!;
		expect(low).toBeLessThan(mid);
		expect(mid).toBeLessThan(high);
	});

	it("salinity severity is None for all Chemistry benchmarks (EC < 2 dS/m)", () => {
		for (const b of BENCHMARK_CHEMISTRY)
			expect(dto(b.id).salinity.severity, b.id).toBe("None");
	});
});

// ─── 4. Category C — Salinity / Sodicity ─────────────────────────────────────

describe("4 · Category C — Salinity/Sodicity", () => {
	it("BENCH_SAL_NORMAL_01: salinity=None, sodicity=None", () => {
		const d = dto("BENCH_SAL_NORMAL_01");
		expect(d.salinity.severity).toBe("None");
		expect(d.sodicity.severity).toBe("None");
	});

	it("BENCH_SAL_SALINE_01: salinity flagged, sodicity=None", () => {
		const d = dto("BENCH_SAL_SALINE_01");
		expect(d.salinity.severity).not.toBe("None");
		expect(d.sodicity.severity).toBe("None");
	});

	it("BENCH_SAL_SODIC_01: salinity=None, sodicity flagged, ESP ≥ 15", () => {
		const d = dto("BENCH_SAL_SODIC_01");
		expect(d.salinity.severity).toBe("None");
		expect(d.sodicity.severity).not.toBe("None");
		expect(d.sodicity.esp).toBeGreaterThanOrEqual(15); // FAO sodic threshold
	});

	it("BENCH_SAL_SALINE_SODIC_01: both salinity and sodicity flagged", () => {
		const d = dto("BENCH_SAL_SALINE_SODIC_01");
		expect(d.salinity.severity).not.toBe("None");
		expect(d.sodicity.severity).not.toBe("None");
	});
});

// ─── 5. Category D — Evidence Completeness ───────────────────────────────────

describe("5 · Category D — Evidence Completeness", () => {
	it("BENCH_EV_PRELIM_01: Met at 100%, no missing modules", () => {
		const d = dto("BENCH_EV_PRELIM_01");
		expect(d.completeness?.level.status).toBe("Met");
		expect(d.completeness?.level.coveragePercent).toBe(100);
		expect(d.completeness?.level.missingModules).toEqual([]);
	});

	it("BENCH_EV_ADVANCED_FULL_01: Met at 100%, all 7 modules present", () => {
		const d = dto("BENCH_EV_ADVANCED_FULL_01");
		expect(d.completeness?.level.status).toBe("Met");
		expect(d.completeness?.level.coveragePercent).toBe(100);
		expect(d.completeness?.level.missingModules).toEqual([]);
		expect(d.completeness?.level.metModules.length).toBeGreaterThanOrEqual(7);
	});

	it("BENCH_EV_MODERATE_MISSING_CATIONS_01: cations listed as missing", () => {
		const d = dto("BENCH_EV_MODERATE_MISSING_CATIONS_01");
		expect(d.completeness?.level.missingModules).toContain("cations");
	});

	it("BENCH_EV_MISSING_PH_01: basicChemistry is partial; no pH category emitted", () => {
		const d = dto("BENCH_EV_MISSING_PH_01");
		expect(d.completeness?.level.partialModules).toContain("basicChemistry");
		const labels = d.agronomic.categories.map((c) => c.label);
		expect(labels).not.toContain("pH");
	});

	it("BENCH_EV_ADVANCED_MISSING_MICROS_01: micronutrients listed as missing", () => {
		const d = dto("BENCH_EV_ADVANCED_MISSING_MICROS_01");
		expect(d.completeness?.level.missingModules).toContain("micronutrients");
	});
});

// ─── 6. Category E — Edge / Robustness ───────────────────────────────────────

describe("6 · Category E — Edge/Robustness", () => {
	it("all edge benchmarks complete without throwing", () => {
		for (const b of BENCHMARK_EDGE)
			expect(results.has(b.id), `${b.id} has result`).toBe(true);
	});

	it("BENCH_EDGE_HIGH_BD_01: BD source is USER_INPUT; saturation differs from default", () => {
		const d = dto("BENCH_EDGE_HIGH_BD_01");
		expect(d.physics.bulkDensityTrace?.source).toBe("USER_INPUT");
		// User BD 1.65 → sat ≈ 37.7, not the default 50.9
		expect(d.physics.saturation).not.toBeCloseTo(50.9, 0);
	});

	it("BENCH_EDGE_HIGH_OM_01 and LOW_OM_01: Ksat is finite", () => {
		expect(Number.isFinite(dto("BENCH_EDGE_HIGH_OM_01").physics.saturatedConductivity)).toBe(true);
		expect(Number.isFinite(dto("BENCH_EDGE_LOW_OM_01").physics.saturatedConductivity)).toBe(true);
	});

	it("BENCH_EDGE_ZERO_CATIONS_01: CEC is null (no fabrication) and FC is finite", () => {
		const d = dto("BENCH_EDGE_ZERO_CATIONS_01");
		expect(d.chemistry.cec).toBeNull();
		expect(Number.isFinite(d.physics.fieldCapacity)).toBe(true);
	});

	// At the clay apex (5/5/90) Saxton-Rawls breaks down: wp may exceed fc.
	// The pipeline must not throw; the breakdown is documented.
	it("BENCH_EDGE_EXTREME_CLAY_01: pipeline completes (Saxton-Rawls breakdown documented)", () => {
		const d = dto("BENCH_EDGE_EXTREME_CLAY_01");
		expect(d.texture.usdaClass).toBe("Clay");
		// FC may be null or a finite number — either is acceptable at apex.
		const fc = d.physics.fieldCapacity;
		expect(fc === null || Number.isFinite(fc)).toBe(true);
	});

	// BUG-10C-C-02 (fixed): at the sand apex (99/1/0) Saxton-Rawls Eq-1
	// produced a negative theta1500DF, causing Math.log(negative) → NaN that
	// propagated to lambda and KS.  After adding CLAMPS.theta1500DFMin=0.001
	// in calculateDensityEffects, the engine now returns a finite Ksat.
	it("BENCH_EDGE_EXTREME_SAND_01: pipeline completes with finite Ksat (BUG-10C-C-02 fixed)", () => {
		const d = dto("BENCH_EDGE_EXTREME_SAND_01");
		expect(d.texture.usdaClass).toBe("Sand");
		expect(
			Number.isFinite(d.physics.saturatedConductivity),
			"Ksat must be finite after BUG-10C-C-02 fix"
		).toBe(true);
		expect(d.physics.saturatedConductivity).toBeGreaterThan(0);
	});
});
