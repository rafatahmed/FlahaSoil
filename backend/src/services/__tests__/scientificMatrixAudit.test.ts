/**
 * FlahaSOIL v2 API — Phase 10B Full Scientific Matrix Audit.
 *
 * Parametrized tests covering texture/physics extremes, salinity/sodicity
 * combinations, CEC source modes, and missing-data edges.
 */
import { describe, expect, it } from "vitest";

import {
	MATRIX_CEC_CATIONS,
	MATRIX_EVIDENCE,
	MATRIX_NUTRIENTS,
	MATRIX_PH_PROPAGATION,
	MATRIX_PHYSICS,
	MATRIX_SALINITY_SODICITY,
} from "./fixtures/scientificMatrixSoilTests";
import { runGoldenPipeline } from "./fixtures/runGoldenPipeline";

describe("scientific matrix audit — Category A: Texture / Physics", () => {
	it("A1: Very sandy (92/5/3) — rapid infiltration, low PAW", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_PHYSICS.A1_VERY_SANDY);
		expect(dto.texture.usdaClass).toBe("Sand");
		expect(dto.physics.saturatedConductivity).toBeGreaterThan(100);
		expect(dto.physics.plantAvailableWater).toBeLessThan(5);
		expect(dto.irrigation.infiltrationClass).toBe("Very Rapid");
	});

	it("A4: Clay loam with user bulk density — slow infiltration, moderate PAW", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_PHYSICS.A4_CLAY_LOAM_USER_BD);
		expect(dto.texture.usdaClass).toBe("Clay Loam");
		expect(dto.physics.saturatedConductivity).not.toBeNull();
		expect(dto.physics.saturatedConductivity!).toBeLessThan(10);
		expect(dto.irrigation.infiltrationClass).toBe("Slow");
	});

	it("A5: Heavy clay + extreme user BD \u2014 BUG-10B-01 FOUND AND FIXED", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_PHYSICS.A5_HEAVY_CLAY);
		// BUG-10B-01 FIXED: extreme user bulk density on heavy clay reached an
		// invalid mathematical domain (thetaSDF < theta33DF). The real physics
		// engine was hardened to use the clamped moisture difference (thetaS33DF)
		// ensuring Ksat never becomes NaN.
		expect(dto.texture.usdaClass).toBe("Clay");
		expect(Number.isFinite(dto.physics.saturatedConductivity)).toBe(true);
		expect(dto.physics.saturatedConductivity).not.toBeNaN();
		expect(dto.physics.saturatedConductivity).not.toBeNull();
		// Infiltration/drainage classification now proceeds.
		expect(dto.irrigation.infiltrationClass).toBe("Very Slow");
		expect(dto.irrigation.drainageClass).toBe("Very Poor");
	});
});

describe("scientific matrix audit — Category B: Salinity / Sodicity", () => {
	it("B2: Saline (EC 8.5) but non-sodic", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_SALINITY_SODICITY.B2_SALINE_NOT_SODIC);
		// FAO-29 severity: EC 8.5 dS/m classifies as Strong (Severe is reserved
		// for the highest band; the risk label is "Severe").
		expect(dto.salinity.severity).toBe("Strong");
		expect(dto.salinity.riskLabel).toBe("Severe");
		expect(dto.sodicity.severity).toBe("None");
		expect(dto.sodicity.esp!).toBeLessThan(5);
	});

	it("B3: Highly sodic (Na=6 on CEC 15) but non-saline", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_SALINITY_SODICITY.B3_SODIC_NOT_SALINE);
		expect(dto.salinity.severity).toBe("None");
		// ESP = 6 / 15 * 100 = 40 % -> Severe sodicity.
		expect(dto.sodicity.severity).toBe("Severe");
		expect(dto.sodicity.esp).toBe(40);
		expect(
			dto.executiveSummary.headlineFindings.some((f) =>
				f.includes("Sodicity severity: Severe")
			)
		).toBe(true);
	});

	it("B4: Saline (EC 12) and sodic (Na=7) — both flagged", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_SALINITY_SODICITY.B4_SALINE_SODIC);
		expect(dto.salinity.severity).toBe("Strong");
		expect(dto.sodicity.severity).toBe("Severe");
		// ESP = 7 / 15 * 100 ≈ 46.7 %.
		expect(dto.sodicity.esp!).toBeGreaterThan(45);
	});
});

describe("scientific matrix audit — Category C: CEC / Cations", () => {
	it("C2: Derived CEC from cation sum", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_CEC_CATIONS.C2_DERIVED_CEC);
		expect(dto.chemistry.cecSource).toBe("DERIVED_CATION_SUM");
		// Sum = 10 + 4 + 1 + 0.5 = 15.5 cmol(+)/kg.
		expect(dto.chemistry.cec).toBe(15.5);
	});

	it("C3: pH/EC-only input in LAB mode → chemistry skipped → cecSource MISSING", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_CEC_CATIONS.C3_ESTIMATED_CEC);
		// runGoldenPipeline always invokes LAB mode. The C3 fixture supplies only
		// pH and EC (no cations, no CEC). chemistrySkipReason returns a skip warning
		// so the chemistry engine is bypassed entirely.
		// Contract: cecSource = "MISSING", cec = null, calculationMode = null.
		// pH and EC are still echoed through to the DTO from the raw input row.
		expect(dto.chemistry.cecSource).toBe("MISSING");
		expect(dto.chemistry.cec).toBeNull();
		expect(dto.chemistry.calculationMode).toBeNull();
		expect(dto.chemistry.pH).toBe(7.5);
	});

	it("C6: Missing CEC / Preliminary only (pH/EC only)", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_CEC_CATIONS.C6_MISSING_CEC);
		expect(dto.chemistry.cecSource).toBe("MISSING");
		expect(dto.chemistry.cec).toBeNull();
		// pH and EC should still be present in DTO.
		expect(dto.chemistry.pH).toBe(6.5);
		expect(dto.salinity.severity).toBe("None");
	});

	it("C5: Cation surplus (Sum > CEC) handled safely", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_CEC_CATIONS.C5_CATION_SURPLUS);
		expect(dto.chemistry.cec).toBe(12);
		expect(dto.chemistry.cecSource).toBe("LAB");
		// Base saturation lives on the agronomic category strip, not chemistry.
		// Cations (18) exceed CEC (12); the engine must still classify without
		// crashing and flag the imbalance.
		const byLabel = Object.fromEntries(
			dto.agronomic.categories.map((c) => [c.label, c.value])
		);
		expect(byLabel["Base saturation"]).toBe("High");
		expect(byLabel["Cation balance"]).toBe("Imbalanced");
	});
});

describe("scientific matrix audit — Category D: pH Propagation", () => {
	// Direct end-to-end proof that a supplied pH propagates through every
	// stage: chemistry input → chemistry engine (LAB) → interpretation
	// (phCategory) → DTO (chemistry.pH + agronomic "pH" category) → HTML
	// (chemistry table cell + agronomic row). If these pass there is no pH
	// propagation defect.

	it("D1: pH 5.2 propagates input → engine → interpretation → DTO → HTML", async () => {
		const { dto, html } = await runGoldenPipeline(MATRIX_PH_PROPAGATION.D1_ACIDIC_PH);

		// 1. Chemistry engine ran in LAB mode against the supplied CEC/cations.
		expect(dto.chemistry.calculationMode).toBe("LAB");
		expect(dto.chemistry.cecSource).toBe("LAB");
		expect(dto.chemistry.cec).toBe(12);

		// 2. The interpretation received pH and classified it.
		const byLabel = Object.fromEntries(
			dto.agronomic.categories.map((c) => [c.label, c.value])
		);
		expect(byLabel["pH"]).toBe("Strongly Acidic");

		// 3. The chemistry DTO carries the supplied pH verbatim.
		expect(dto.chemistry.pH).toBe(5.2);

		// 4. The HTML chemistry table renders the pH value (2-dp precision).
		expect(html).toContain('id="chemistry"');
		expect(html).toContain("5.20");

		// 5. The HTML agronomic section renders the pH category.
		expect(html).toContain('id="agronomic"');
		expect(html).toContain("Strongly Acidic");
	});

	it("D2: pH 7.0 classifies as Neutral and renders", async () => {
		const { dto, html } = await runGoldenPipeline(MATRIX_PH_PROPAGATION.D2_NEUTRAL_PH);
		const byLabel = Object.fromEntries(
			dto.agronomic.categories.map((c) => [c.label, c.value])
		);
		expect(dto.chemistry.calculationMode).toBe("LAB");
		expect(dto.chemistry.pH).toBe(7.0);
		expect(byLabel["pH"]).toBe("Neutral");
		expect(html).toContain("7.00");
		expect(html).toContain("Neutral");
	});

	it("D3: pH 8.3 classifies as Alkaline and renders", async () => {
		const { dto, html } = await runGoldenPipeline(MATRIX_PH_PROPAGATION.D3_ALKALINE_PH);
		const byLabel = Object.fromEntries(
			dto.agronomic.categories.map((c) => [c.label, c.value])
		);
		expect(dto.chemistry.calculationMode).toBe("LAB");
		expect(dto.chemistry.pH).toBe(8.3);
		expect(byLabel["pH"]).toBe("Alkaline");
		expect(html).toContain("8.30");
		expect(html).toContain("Alkaline");
	});

	it("D4: missing pH yields no pH category and a missing chemistry cell", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_PH_PROPAGATION.D4_MISSING_PH);
		// Engine still runs on the cation panel; only pH is absent.
		expect(dto.chemistry.calculationMode).toBe("LAB");
		expect(dto.chemistry.cecSource).toBe("LAB");
		expect(dto.chemistry.pH).toBeNull();
		// No pH means no pH agronomic category (inverse propagation proof).
		const labels = dto.agronomic.categories.map((c) => c.label);
		expect(labels).not.toContain("pH");
	});

	it("D5: Highly Alkaline (9.2) + Carbonates flows correctly", async () => {
		const { dto, html } = await runGoldenPipeline(MATRIX_PH_PROPAGATION.D5_VERY_ALKALINE_CARB);
		expect(dto.chemistry.pH).toBe(9.2);
		const byLabel = Object.fromEntries(
			dto.agronomic.categories.map((c) => [c.label, c.value])
		);
		expect(byLabel["pH"]).toBe("Highly Alkaline");

		// Carbonates module should be Met for ADVANCED level
		expect(dto.completeness?.level.metModules).toContain("carbonates");

		expect(html).toContain("9.20");
		expect(html).toContain("Highly Alkaline");
	});
});

describe("scientific matrix audit \u2014 Category E: Nutrients / Micronutrients", () => {
	it("E1: N/P/Cl macro-nutrients map correctly", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_NUTRIENTS.E1_COMPLETE_MACROS);
		// DTO fields: macroNutrients.n (nitrogen), .p (phosphorus), .k (kMgKg only)
		// Cl (chloride) is tracked by the coverage engine but not echoed to macroNutrients.
		expect(dto.chemistry.macroNutrients.n).toBe(25);
		expect(dto.chemistry.macroNutrients.p).toBe(45);
		// Coverage engine sees cl field → macroNutrients module Met
		expect(dto.completeness?.level.metModules).toContain("macroNutrients");
	});

	it("E3: Full micronutrient panel maps correctly", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_NUTRIENTS.E3_FULL_MICROS);
		// DTO field is micronutrients (lowercase); keys are short symbols: zn, cu, fe, mn, b.
		const m = dto.chemistry.micronutrients;
		expect(m.zn).toBe(2.5);
		expect(m.cu).toBe(1.2);
		expect(m.fe).toBe(15);
		expect(m.mn).toBe(8);
		expect(m.b).toBe(0.5);
		expect(dto.completeness?.level.metModules).toContain("micronutrients");
	});

	it("E5: Available K (mg/kg) vs Exchangeable K (cmol/kg)", async () => {
		const { dto, html } = await runGoldenPipeline(MATRIX_NUTRIENTS.E5_AVAILABLE_K);
		// Exchangeable K (chemistry engine result)
		expect(dto.chemistry.exchangeableCations.k).toBe(0.6);
		// Plant-available K (kMgKg field) maps to macroNutrients.k in DTO
		expect(dto.chemistry.macroNutrients.k).toBe(250);

		expect(html).toContain("0.60"); // exchangeable table
		expect(html).toContain(">250<"); // nutrients table (integer K rendered without decimal)
	});

	it("E7: Heavy metals are preserved in appendix", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_NUTRIENTS.E7_HEAVY_METALS);
		// Currently not in main chemistry DTO, but preserved in inputs appendix
		const inputs = dto.appendix.inputs.chemistry as any;
		expect(inputs.heavyMetalsJson).toEqual({ arsenic: 2, lead: 10, cadmium: 0.1 });
	});
});

describe("scientific matrix audit \u2014 Category F: Evidence / Missing Data", () => {
	it("F4: MODERATE with missing cation panel reports Partial", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_EVIDENCE.F4_MODERATE_MISSING_CATIONS);
		expect(dto.completeness?.level.status).toBe("Partial");
		expect(dto.completeness?.level.missingModules).toContain("cations");
		expect(dto.completeness?.level.partialModules).toContain("macroNutrients");
	});

	it("F5: ADVANCED with missing micronutrients reports Partial", async () => {
		const { dto } = await runGoldenPipeline(MATRIX_EVIDENCE.F5_ADVANCED_MISSING_MICROS);
		expect(dto.completeness?.level.status).toBe("Partial");
		expect(dto.completeness?.level.missingModules).toContain("micronutrients");
		expect(dto.completeness?.level.missingModules).toContain("macroNutrients");
	});
});
