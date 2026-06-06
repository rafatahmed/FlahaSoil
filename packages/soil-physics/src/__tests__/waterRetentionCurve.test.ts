/**
 * Soil-water retention curve — Saxton-Rawls (2006) engine tests.
 *
 * Verifies monotonicity (θ decreases as ψ increases), anchor consistency
 * with the parent physics engine, pF/kPa conversion correctness, and
 * the MAD-based irrigation trigger.
 */
import { describe, expect, it } from "vitest";
import { calculateSoilPhysics } from "../calculateSoilPhysics";
import {
	buildWaterRetentionCurve,
	DEFAULT_MAD_FRACTION,
	KPA_TO_CM_H2O,
	pfToKpa,
	PF_SAMPLES,
	tensionKpaToPf,
	TENSION_FIELD_CAPACITY_KPA,
	TENSION_WILTING_POINT_KPA,
} from "../waterRetentionCurve";

const LOAM = { sand: 40, clay: 20, organicMatter: 2.5, densityFactor: 1.3 };
const SAND = { sand: 90, clay: 5, organicMatter: 1.5, densityFactor: 1.5 };
const CLAY = { sand: 15, clay: 55, organicMatter: 3.5, densityFactor: 1.2 };

describe("kpa <-> pF conversions", () => {
	it("round-trips pF values from PF_SAMPLES", () => {
		for (const pF of PF_SAMPLES) {
			if (pF === 0) continue; // 0 kPa maps to pF 0 by convention
			const kpa = pfToKpa(pF);
			expect(tensionKpaToPf(kpa)).toBeCloseTo(pF, 6);
		}
	});

	it("maps 33 kPa to pF ≈ 2.526 (field capacity)", () => {
		expect(tensionKpaToPf(33)).toBeCloseTo(Math.log10(33 * KPA_TO_CM_H2O), 6);
	});

	it("maps 1500 kPa to pF ≈ 4.184 (permanent wilting point)", () => {
		expect(tensionKpaToPf(1500)).toBeCloseTo(Math.log10(1500 * KPA_TO_CM_H2O), 6);
	});

	it("returns pF 0 for non-positive tension", () => {
		expect(tensionKpaToPf(0)).toBe(0);
		expect(tensionKpaToPf(-5)).toBe(0);
	});
});

describe("buildWaterRetentionCurve — anchor parity with calculateSoilPhysics", () => {
	it.each([
		{ name: "Loam", input: LOAM },
		{ name: "Sand", input: SAND },
		{ name: "Clay", input: CLAY },
	])("FC and WP match the parent engine for $name", ({ input }) => {
		const curve = buildWaterRetentionCurve(input);
		const physics = calculateSoilPhysics({
			sand: input.sand,
			clay: input.clay,
			organicMatter: input.organicMatter,
			densityFactor: input.densityFactor,
			userPlan: "PROFESSIONAL",
		});

		expect(curve.fieldCapacity.waterContentVolPercent).toBeCloseTo(
			parseFloat(physics.fieldCapacity),
			1
		);
		expect(curve.wiltingPoint.waterContentVolPercent).toBeCloseTo(
			parseFloat(physics.wiltingPoint),
			1
		);
		expect(curve.saturation.waterContentVolPercent).toBeCloseTo(
			parseFloat(physics.saturation),
			1
		);
	});
});

describe("buildWaterRetentionCurve — curve shape", () => {
	it("is monotonically non-increasing in θ as pF increases", () => {
		const curve = buildWaterRetentionCurve(LOAM);
		for (let i = 1; i < curve.points.length; i += 1) {
			const prev = curve.points[i - 1]!;
			const cur = curve.points[i]!;
			expect(cur.waterContentVolPercent).toBeLessThanOrEqual(
				prev.waterContentVolPercent + 1e-6
			);
		}
	});

	it("samples exactly PF_SAMPLES.length pF points", () => {
		const curve = buildWaterRetentionCurve(LOAM);
		expect(curve.points).toHaveLength(PF_SAMPLES.length);
		expect(curve.points.map((p) => p.pF)).toEqual([...PF_SAMPLES]);
	});

	it("water-content values are within [0, 100] for all soils", () => {
		for (const input of [LOAM, SAND, CLAY]) {
			const curve = buildWaterRetentionCurve(input);
			for (const p of curve.points) {
				expect(p.waterContentVolPercent).toBeGreaterThanOrEqual(0);
				expect(p.waterContentVolPercent).toBeLessThanOrEqual(100);
			}
		}
	});
});

describe("buildWaterRetentionCurve — PAW and MAD trigger", () => {
	it("PAW equals FC − WP", () => {
		const curve = buildWaterRetentionCurve(LOAM);
		expect(curve.plantAvailableWater).toBeCloseTo(
			curve.fieldCapacity.waterContentVolPercent -
				curve.wiltingPoint.waterContentVolPercent,
			3
		);
	});

	it("irrigation trigger sits between WP and FC at MAD fraction", () => {
		const curve = buildWaterRetentionCurve(LOAM);
		const wp = curve.wiltingPoint.waterContentVolPercent;
		const fc = curve.fieldCapacity.waterContentVolPercent;
		expect(curve.irrigationThreshold.waterContentVolPercent).toBeGreaterThan(wp);
		expect(curve.irrigationThreshold.waterContentVolPercent).toBeLessThan(fc);
		// θtrigger = θFC − MAD · (θFC − θWP)
		const expected = fc - DEFAULT_MAD_FRACTION * (fc - wp);
		expect(curve.irrigationThreshold.waterContentVolPercent).toBeCloseTo(expected, 3);
	});

	it("trigger tension is between FC tension and WP tension", () => {
		const curve = buildWaterRetentionCurve(LOAM);
		expect(curve.irrigationThreshold.tensionKpa).toBeGreaterThan(
			TENSION_FIELD_CAPACITY_KPA
		);
		expect(curve.irrigationThreshold.tensionKpa).toBeLessThan(TENSION_WILTING_POINT_KPA);
	});
});

describe("buildWaterRetentionCurve — validation", () => {
	it("throws on out-of-range sand", () => {
		expect(() => buildWaterRetentionCurve({ sand: -1, clay: 30 })).toThrow();
		expect(() => buildWaterRetentionCurve({ sand: 101, clay: 0 })).toThrow();
	});

	it("throws on out-of-range clay", () => {
		expect(() => buildWaterRetentionCurve({ sand: 30, clay: -1 })).toThrow();
	});

	it("throws when sand + clay exceeds 100", () => {
		expect(() => buildWaterRetentionCurve({ sand: 70, clay: 40 })).toThrow();
	});

	it("throws on organic-matter outside [0, 8]", () => {
		expect(() =>
			buildWaterRetentionCurve({ sand: 40, clay: 20, organicMatter: 9 })
		).toThrow();
	});
});
