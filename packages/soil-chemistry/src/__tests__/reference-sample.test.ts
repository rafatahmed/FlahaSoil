/**
 * @flaha/soil-chemistry — Phase 10A.7 (WS7) locked regression fixture.
 *
 * Pins the audit reference sample so the chemistry engine and the
 * cation-structure triangle stay in lock-step with the corrected
 * unit-anchor and BCSR-disclaimer behaviour from the Scientific Audit
 * Corrections phase.
 *
 *   CEC 18, Ca 11, Mg 3, K 0.6, Na 0.4, pH 7.2, EC 1.0
 *   All cations in cmol(+)/kg.
 */

import { describe, expect, it } from "vitest";

import { calculateSoilChemistry } from "../calculateSoilChemistry";
import {
	classifyCationStructure,
	STRUCTURE_TRIANGLE_DISCLAIMER,
} from "../structureTriangle";

const SAMPLE = {
	cec: 18,
	ca: 11,
	mg: 3,
	k: 0.6,
	na: 0.4,
	ph: 7.2,
	ec: 1.0,
} as const;

describe("soil-chemistry — Phase 10A.7 reference sample", () => {
	it("matches the audited LAB cation percentages and SAR", () => {
		const r = calculateSoilChemistry({
			mode: "LAB",
			cec: SAMPLE.cec,
			ca: SAMPLE.ca,
			mg: SAMPLE.mg,
			k: SAMPLE.k,
			na: SAMPLE.na,
			ph: SAMPLE.ph,
			ec: SAMPLE.ec,
		});

		expect(r.calculationMode).toBe("LAB");
		expect(r.cec).toBeCloseTo(18, 2);

		// Cation saturations (% of CEC, not % of bases).
		expect(r.caPercent).toBeCloseTo(61.11, 1);
		expect(r.mgPercent).toBeCloseTo(16.67, 1);
		expect(r.kPercent).toBeCloseTo(3.33, 1);
		expect(r.naPercent).toBeCloseTo(2.22, 1);

		expect(r.baseSaturation).toBeCloseTo(83.33, 1);
		expect(r.esp).toBeCloseTo(2.22, 1);

		// SAR — only emitted because both Ca and Mg are supplied.
		expect(r.sar).toBeDefined();
		expect(r.sar as number).toBeCloseTo(0.15, 2);

		// Passthrough echoes.
		expect(r.ph).toBeCloseTo(7.2, 2);
		expect(r.ec).toBeCloseTo(1.0, 2);
	});

	it("ESTIMATED mode falls back to clay + OM coefficients (Brady & Weil)", () => {
		// 15 × 0.5 + 2.5 × 2 = 7.5 + 5.0 = 12.5 cmol(+)/kg
		const est = calculateSoilChemistry({
			mode: "ESTIMATED",
			clay: 15,
			organicMatter: 2.5,
		});
		expect(est.cec).toBeCloseTo(12.5, 2);
		expect(est.calculationMode).toBe("ESTIMATED");
	});
});

describe("structure triangle — Phase 10A.7 reference sample", () => {
	it("classifies the reference sample as Balanced with audit-frozen normals", () => {
		const s = classifyCationStructure({
			ca: SAMPLE.ca,
			mg: SAMPLE.mg,
			k: SAMPLE.k,
			na: SAMPLE.na,
			cec: SAMPLE.cec,
		});

		expect(s.classification).toBe("Balanced");
		expect(s.matched).toBe(true);

		// Normalised against (Ca + Mg + K) = 14.6 cmol(+)/kg.
		expect(s.normalized.ca).toBeCloseTo(75.34, 1);
		expect(s.normalized.mg).toBeCloseTo(20.55, 1);
		expect(s.normalized.k).toBeCloseTo(4.11, 1);

		expect(s.basesTotal).toBeCloseTo(14.6, 2);
		expect(s.caMgRatio).toBeCloseTo(3.67, 2);
		expect(s.caKRatio).toBeCloseTo(18.33, 2);
		expect(s.mgKRatio).toBeCloseTo(5.0, 2);
	});

	it("exposes the WS5 Kopittke & Menzies disclaimer constant", () => {
		// Pin both presence and the citation so the UI/PDF cannot drop it.
		expect(typeof STRUCTURE_TRIANGLE_DISCLAIMER).toBe("string");
		expect(STRUCTURE_TRIANGLE_DISCLAIMER).toContain("Kopittke");
		expect(STRUCTURE_TRIANGLE_DISCLAIMER).toContain("Menzies");
		expect(STRUCTURE_TRIANGLE_DISCLAIMER).toMatch(/BCSR|basic cation/i);
	});
});
