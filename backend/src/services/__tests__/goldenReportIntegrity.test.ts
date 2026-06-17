/**
 * FlahaSOIL v2 API — Phase 10A.8 golden DTO integrity lock.
 *
 * Locks the ProfessionalReportDTO contract for all three canonical golden
 * tests (PRELIMINARY / MODERATE / ADVANCED). Golden values were captured
 * by running goldenDiscovery.tmp.test.ts on 2026-06-17 against the
 * Phase 10A.7 pipeline and are now frozen here.
 *
 * Canonical inputs (mirroring scripts/canon_tests_10a7.ps1):
 *   A PRELIMINARY  65/15/20 OM 1.5  pH 8.1  EC 6.0
 *   B MODERATE     60/25/15 OM 2.5  pH 7.2  EC 1.0  (audit ref #001)
 *   C ADVANCED     35/35/30 OM 1.8  BD 1.42 pH 8.3  EC 4.5
 *
 * DO NOT update these values unless a deliberate scientific change is
 * merged and reviewed. A failing assertion here means the Phase 10A.7
 * scientific behaviour has drifted.
 */
import { describe, expect, it } from "vitest";

import {
	GOLDEN_ADVANCED,
	GOLDEN_MODERATE,
	GOLDEN_PRELIMINARY,
} from "./fixtures/goldenSoilTests";
import { runGoldenPipeline } from "./fixtures/runGoldenPipeline";

describe("golden DTO integrity — PRELIMINARY", () => {
	it("cover fields", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_PRELIMINARY);
		expect(dto.cover).toMatchObject({
			testLevel: "PRELIMINARY",
			reportNumber: "FLH-2026-A",
			projectName: "Doha Pilot",
			clientName: "Al Wakra Farms",
			consultantName: "Dr. R. Khashan",
			location: "North paddock",
		});
	});

	it("executive summary — saline sandy-loam Poor rating", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_PRELIMINARY);
		// 65/15/20 Loam at EC 6.0 → Moderate salinity → Poor overall
		expect(dto.executiveSummary.overallRating).toBe("Poor");
		expect(dto.executiveSummary.actionItemCount).toBe(0);
		expect(dto.executiveSummary.headlineFindings).toHaveLength(4);
	});

	it("physics — Loam 65/15/20 OM 1.5, DEFAULT bulkDensityTrace", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_PRELIMINARY);
		// Saxton-Rawls for 65/15/20 OM 1.5 (distinct from MODERATE 60/25/15)
		expect(dto.physics.fieldCapacity).toBe(20.1);
		expect(dto.physics.wiltingPoint).toBe(11.9);
		expect(dto.physics.plantAvailableWater).toBe(8.3);
		expect(dto.physics.porosity).toBe(50.9);
		expect(dto.physics.saturatedConductivity).toBe(66.4);
		expect(dto.physics.bulkDensityTrace).toMatchObject({
			source: "DEFAULT",
			used: 1.3,
		});
		expect(dto.physics.bulkDensityTrace.predicted).toBeCloseTo(1.581, 2);
	});

	it("chemistry — PRELIMINARY panel (cecSource MISSING)", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_PRELIMINARY);
		expect(dto.chemistry.pH).toBe(8.1);
		expect(dto.chemistry.ece).toBe(6);
		expect(dto.chemistry.cec).toBeNull();
		expect(dto.chemistry.cecSource).toBe("MISSING");
		expect(dto.chemistry.calculationMode).toBeNull();
		expect(dto.chemistry.exchangeableCations.ca).toBeNull();
	});

	it("salinity — Moderate severity (EC 6.0) + sodicity not assessed", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_PRELIMINARY);
		expect(dto.salinity.severity).toBe("Moderate");
		expect(dto.salinity.riskLabel).toBe("High");
		expect(dto.sodicity.severity).toBe("None");
		expect(dto.sodicity.riskLabel).toBe("Not assessed");
		expect(dto.sodicity.sar).toBeNull();
		expect(dto.sodicity.esp).toBeNull();
	});

	it("completeness — 100 % Met (PRELIMINARY modules)", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_PRELIMINARY);
		expect(dto.completeness.level.status).toBe("Met");
		expect(dto.completeness.level.coveragePercent).toBe(100);
		expect(dto.completeness.level.declaredLevel).toBe("PRELIMINARY");
	});

	it("notes — chemistry skipped warning present", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_PRELIMINARY);
		expect(dto.notes.missingValues).toContain("Chemistry engine output");
		const codes = dto.notes.calculationWarnings.map((w) => w.code);
		expect(codes).toContain("CHEMISTRY_SKIPPED_PRELIMINARY");
	});
});

describe("golden DTO integrity — MODERATE", () => {
	it("physics — Sandy Loam 60/25/15 OM 2.5, DEFAULT bulkDensityTrace", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_MODERATE);
		// Saxton-Rawls for 60/25/15 OM 2.5 (audit reference sample #001)
		expect(dto.physics.fieldCapacity).toBe(18.3);
		expect(dto.physics.wiltingPoint).toBe(8.9);
		expect(dto.physics.plantAvailableWater).toBe(9.4);
		expect(dto.physics.porosity).toBe(50.9);
		expect(dto.physics.saturatedConductivity).toBe(82.8);
		expect(dto.physics.bulkDensityTrace.source).toBe("DEFAULT");
		expect(dto.physics.bulkDensityTrace.used).toBe(1.3);
		expect(dto.physics.bulkDensityTrace.predicted).toBeCloseTo(1.588, 2);
	});

	it("chemistry — LAB cations + structureDisclaimer", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_MODERATE);
		expect(dto.chemistry.cec).toBe(18);
		expect(dto.chemistry.cecSource).toBe("LAB");
		expect(dto.chemistry.calculationMode).toBe("LAB");
		expect(dto.chemistry.exchangeableCations).toMatchObject({
			ca: 11, mg: 3, k: 0.6, na: 0.4, unit: "cmol(+)/kg",
		});
		expect(typeof dto.chemistry.structureDisclaimer).toBe("string");
		expect(dto.chemistry.structureDisclaimer!.length).toBeGreaterThan(50);
	});

	it("sodicity computed values", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_MODERATE);
		expect(dto.sodicity.severity).toBe("None");
		expect(dto.sodicity.riskLabel).toBe("Low");
		expect(dto.sodicity.sar).toBeCloseTo(0.1512, 3);
		expect(dto.sodicity.esp).toBeCloseTo(2.222, 2);
	});

	it("completeness — 100 % Met, 0 warnings", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_MODERATE);
		expect(dto.completeness.level.status).toBe("Met");
		expect(dto.completeness.level.coveragePercent).toBe(100);
		expect(dto.notes.calculationWarnings).toHaveLength(0);
	});
});

describe("golden DTO integrity — ADVANCED", () => {
	it("physics — Clay Loam 35/35/30 OM 1.8, USER_INPUT bulkDensityTrace (ρDF=1.42)", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_ADVANCED);
		expect(dto.physics.bulkDensityTrace).toMatchObject({
			source: "USER_INPUT",
			used: 1.42,
		});
		// predicted BD for 35/35/30 OM 1.8 (Saxton-Rawls Eq.6) ≈ 1.456
		expect(dto.physics.bulkDensityTrace.predicted).toBeCloseTo(1.456, 2);
		expect(dto.physics.porosity).toBe(46.4);
		// Ksat is much lower than MODERATE due to clay loam texture + USER_INPUT density
		expect(dto.physics.saturatedConductivity).toBe(8.8);
	});

	it("chemistry — full panel: LAB cations, micronutrients, structure disclaimer", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_ADVANCED);
		expect(dto.chemistry.cec).toBe(22);
		expect(dto.chemistry.cecSource).toBe("LAB");
		expect(dto.chemistry.exchangeableCations).toMatchObject({
			ca: 13, mg: 4, k: 0.7, na: 2, unit: "cmol(+)/kg",
		});
		expect(dto.chemistry.micronutrients).toMatchObject({
			fe: 6.5, mn: 3.2, zn: 0.8, cu: 0.6, b: 0.5,
		});
		expect(typeof dto.chemistry.structureDisclaimer).toBe("string");
	});

	it("sodicity — Slight severity (Na=2 on CEC 22)", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_ADVANCED);
		expect(dto.sodicity.severity).toBe("Slight");
		expect(dto.sodicity.riskLabel).toBe("Moderate");
		expect(dto.sodicity.sar).toBeCloseTo(0.686, 2);
		expect(dto.sodicity.esp).toBeCloseTo(9.09, 1);
	});

	it("completeness — 100 % Met, all 7 modules", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_ADVANCED);
		expect(dto.completeness.level.status).toBe("Met");
		expect(dto.completeness.level.coveragePercent).toBe(100);
		expect(dto.completeness.level.metModules).toHaveLength(7);
	});

	it("irrigation — Moderate class (clay loam + USER_INPUT density)", async () => {
		const { dto } = await runGoldenPipeline(GOLDEN_ADVANCED);
		// Clay Loam 35/35/30 with BD 1.42 and Ksat 8.8 → Moderate infiltration
		expect(dto.irrigation.infiltrationClass).toBe("Moderate");
	});
});
