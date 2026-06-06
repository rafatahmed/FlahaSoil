/**
 * Cation / structure triangle tests — classification thresholds,
 * normalisation, ternary projection geometry, and ratio diagnostics.
 */
import { describe, expect, it } from "vitest";
import {
	cationToCartesian,
	classifyCationStructure,
	DEFAULT_STRUCTURE_VERTICES,
	normalizeCationFractions,
	STRUCTURE_CLASSIFICATION_ORDER,
	STRUCTURE_THRESHOLDS,
	summariseCationStructure,
} from "../structureTriangle";

describe("normalizeCationFractions", () => {
	it("sums to 100 for any positive input", () => {
		const n = normalizeCationFractions(10, 2, 0.5);
		expect(n.ca + n.mg + n.k).toBeCloseTo(100, 6);
	});

	it("returns zero vertex when all inputs are zero", () => {
		expect(normalizeCationFractions(0, 0, 0)).toEqual({ ca: 0, mg: 0, k: 0 });
	});

	it("ignores Na (not in the triangle)", () => {
		const n = normalizeCationFractions(10, 2, 0.5);
		const total = 10 + 2 + 0.5;
		expect(n.ca).toBeCloseTo((10 / total) * 100, 6);
	});
});

describe("classifyCationStructure — threshold zones", () => {
	// Fixtures are chosen so exactly one diagnosis fires under the
	// priority order in STRUCTURE_CLASSIFICATION_ORDER.
	const balanced = { ca: 12, mg: 3, k: 0.6 }; // ~77 / 19 / 4 %
	const caExcess = { ca: 16.8, mg: 2.2, k: 1 }; // 84 / 11 / 5
	const mgExcess = { ca: 13, mg: 6, k: 1 }; // 65 / 30 / 5
	const kExcess = { ca: 13, mg: 4, k: 3 }; // 65 / 20 / 15
	const caDef = { ca: 4, mg: 4.5, k: 1.5 }; // 40 / 45 / 15
	const mgDef = { ca: 18, mg: 1, k: 1 }; // 90 / 5 / 5  → Mg < 8
	const kDef = { ca: 16, mg: 3.9, k: 0.1 }; // 80 / 19.5 / 0.5 → K < 1

	it.each([
		["Balanced", balanced],
		["Calcium Excess", caExcess],
		["Magnesium Excess", mgExcess],
		["Potassium Excess", kExcess],
		["Calcium Deficient", caDef],
		["Magnesium Deficient", mgDef],
		["Potassium Deficient", kDef],
	])("classifies as %s", (label, input) => {
		const r = classifyCationStructure(input);
		expect(r.classification).toBe(label);
		expect(r.matched).toBe(true);
	});

	it("uses the documented threshold values", () => {
		expect(STRUCTURE_THRESHOLDS.caExcess).toBe(80);
		expect(STRUCTURE_THRESHOLDS.mgExcess).toBe(25);
		expect(STRUCTURE_THRESHOLDS.kExcess).toBe(10);
	});

	it("returns null + matched=false for an all-zero input", () => {
		const r = classifyCationStructure({ ca: 0, mg: 0, k: 0 });
		expect(r.classification).toBeNull();
		expect(r.matched).toBe(false);
		expect(r.basesTotal).toBe(0);
	});

	it("clamps negative inputs to zero before normalisation", () => {
		const r = classifyCationStructure({ ca: -5, mg: 3, k: 1 });
		expect(r.normalized.ca).toBe(0);
		expect(r.normalized.mg + r.normalized.k).toBeCloseTo(100, 6);
	});

	it("exposes Ca:Mg, Ca:K, Mg:K ratios", () => {
		const r = classifyCationStructure({ ca: 12, mg: 3, k: 0.6 });
		expect(r.caMgRatio).toBeCloseTo(4, 6);
		expect(r.caKRatio).toBeCloseTo(20, 6);
		expect(r.mgKRatio).toBeCloseTo(5, 6);
	});

	it("returns zero ratios when denominator is zero", () => {
		const r = classifyCationStructure({ ca: 5, mg: 0, k: 0 });
		expect(r.caMgRatio).toBe(0);
		expect(r.caKRatio).toBe(0);
		expect(r.mgKRatio).toBe(0);
	});
});

describe("cationToCartesian", () => {
	const v = DEFAULT_STRUCTURE_VERTICES;

	it("maps 100 % Ca to the Ca apex", () => {
		const p = cationToCartesian({ ca: 100, mg: 0, k: 0 });
		expect(p.x).toBeCloseTo(v.ca.x, 6);
		expect(p.y).toBeCloseTo(v.ca.y, 6);
	});

	it("maps 100 % Mg to the Mg apex", () => {
		const p = cationToCartesian({ ca: 0, mg: 100, k: 0 });
		expect(p.x).toBeCloseTo(v.mg.x, 6);
		expect(p.y).toBeCloseTo(v.mg.y, 6);
	});

	it("maps 100 % K to the K apex", () => {
		const p = cationToCartesian({ ca: 0, mg: 0, k: 100 });
		expect(p.x).toBeCloseTo(v.k.x, 6);
		expect(p.y).toBeCloseTo(v.k.y, 6);
	});

	it("returns the centroid for a zero-sum input", () => {
		const p = cationToCartesian({ ca: 0, mg: 0, k: 0 });
		const cx = (v.ca.x + v.mg.x + v.k.x) / 3;
		const cy = (v.ca.y + v.mg.y + v.k.y) / 3;
		expect(p.x).toBeCloseTo(cx, 6);
		expect(p.y).toBeCloseTo(cy, 6);
	});

	it("normalises an arbitrary-sum input before projection", () => {
		const p1 = cationToCartesian({ ca: 1, mg: 1, k: 1 });
		const p2 = cationToCartesian({ ca: 33.3, mg: 33.3, k: 33.3 });
		expect(p1.x).toBeCloseTo(p2.x, 4);
		expect(p1.y).toBeCloseTo(p2.y, 4);
	});
});

describe("summariseCationStructure", () => {
	it("echoes optional Na and CEC", () => {
		const s = summariseCationStructure({ ca: 12, mg: 3, k: 0.6, na: 0.2, cec: 20 });
		expect(s.na).toBe(0.2);
		expect(s.cec).toBe(20);
		expect(s.classification).toBe("Balanced");
	});

	it("returns null Na/CEC when omitted", () => {
		const s = summariseCationStructure({ ca: 12, mg: 3, k: 0.6 });
		expect(s.na).toBeNull();
		expect(s.cec).toBeNull();
	});
});

describe("STRUCTURE_CLASSIFICATION_ORDER", () => {
	it("lists exactly seven classes with deficiencies first", () => {
		expect(STRUCTURE_CLASSIFICATION_ORDER).toHaveLength(7);
		expect(STRUCTURE_CLASSIFICATION_ORDER[0]).toBe("Magnesium Deficient");
		expect(STRUCTURE_CLASSIFICATION_ORDER[6]).toBe("Balanced");
	});
});
