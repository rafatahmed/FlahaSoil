/**
 * @flaha/soil-physics — Phase 10A.7 (WS7) locked regression fixture.
 *
 * Pins the canonical audit reference sample so that the unit, bulk-
 * density and water-retention fixes from the Scientific Audit
 * Corrections phase cannot silently regress.
 *
 *   Sand 60 %, Silt 25 %, Clay 15 %, OM 2.5 %, default ρDF (= 1.30 g/cm³)
 *
 * Outputs are captured from `scripts/audit-reference-sample.mts` at the
 * Phase 10A.7 freeze and asserted to 0.1 % v/v / 0.01 g·cm⁻³ precision.
 * Any drift indicates either a deliberate engine change (in which case
 * the fixture must be updated AND `docs/v2-phase10a7-scientific-audit-
 * corrections.md` revised) or an accidental regression of an audit fix.
 */

import { describe, expect, it } from "vitest";

import { calculateSoilPhysics } from "../calculateSoilPhysics";
import { buildWaterRetentionCurve } from "../waterRetentionCurve";

const SAMPLE = {
	sand: 60,
	clay: 15,
	organicMatter: 2.5,
	electricalConductivity: 1.0,
} as const;

const num = (v: string | number): number =>
	typeof v === "number" ? v : parseFloat(v);

describe("soil-physics — Phase 10A.7 reference sample (60/25/15)", () => {
	it("classifies as Sandy Loam and produces audited FC/WP/PAW", () => {
		const r = calculateSoilPhysics({
			...SAMPLE,
			userPlan: "PROFESSIONAL",
		});

		// Texture identity (USDA + verbatim engine string).
		expect(r.textureClass).toBe("Sandy Loam");

		// Saxton-Rawls 2006 outputs frozen at audit time. % v/v.
		expect(num(r.fieldCapacity)).toBeCloseTo(18.3, 1);
		expect(num(r.wiltingPoint)).toBeCloseTo(8.9, 1);
		expect(num(r.plantAvailableWater)).toBeCloseTo(9.4, 1);
		expect(num(r.saturation)).toBeCloseTo(50.9, 1);

		// Ksat (mm/h).
		expect(num(r.saturatedConductivity)).toBeCloseTo(82.8, 1);
	});

	it("emits the WS2 bulk-density trace (predicted vs used vs source)", () => {
		const r = calculateSoilPhysics({
			...SAMPLE,
			userPlan: "PROFESSIONAL",
		});

		// ρN (Eq 6) — texture-predicted bulk density.
		expect(num(r.predictedBulkDensity)).toBeCloseTo(1.588, 2);

		// ρDF — actually used in the density-adjusted equations.
		// Defaults to 1.30 g/cm³ because no `densityFactor` was supplied.
		expect(num(r.bulkDensityUsed)).toBeCloseTo(1.3, 2);
		expect(r.bulkDensitySource).toBe("DEFAULT");

		// Legacy `bulkDensity` / `inputBulkDensity` fields must still
		// surface both quantities so the report can show both.
		expect(num(r.bulkDensity)).toBeCloseTo(1.59, 2); // ρN rounded
		expect(r.inputBulkDensity).toBeCloseTo(1.3, 2);
	});

	it("records USER_INPUT source when the caller supplies densityFactor", () => {
		const r = calculateSoilPhysics({
			...SAMPLE,
			densityFactor: 1.45,
			userPlan: "PROFESSIONAL",
		});
		expect(r.bulkDensitySource).toBe("USER_INPUT");
		expect(num(r.bulkDensityUsed)).toBeCloseTo(1.45, 2);
		// Predicted is unchanged — driven by texture, not by the input.
		expect(num(r.predictedBulkDensity)).toBeCloseTo(1.588, 2);
	});
});

describe("water-retention curve — Phase 10A.7 reference sample (60/25/15)", () => {
	it("matches the audited anchor points and exposes the BD trace", () => {
		const curve = buildWaterRetentionCurve({
			sand: SAMPLE.sand,
			clay: SAMPLE.clay,
			organicMatter: SAMPLE.organicMatter,
		});

		expect(curve.method).toBe("saxton-rawls-2006");
		expect(curve.textureClass).toBe("Sandy Loam");

		// % v/v anchors — audit-frozen.
		expect(curve.saturation.waterContentVolPercent).toBeCloseTo(50.94, 1);
		expect(curve.fieldCapacity.waterContentVolPercent).toBeCloseTo(18.31, 1);
		expect(curve.wiltingPoint.waterContentVolPercent).toBeCloseTo(8.94, 1);
		expect(curve.plantAvailableWater).toBeCloseTo(9.38, 1);

		// Tensions / Saxton-Rawls coefficients.
		expect(curve.airEntryTensionKpa).toBeCloseTo(9.53, 1);
		expect(curve.fieldCapacity.tensionKpa).toBe(33);
		expect(curve.wiltingPoint.tensionKpa).toBe(1500);
		expect(curve.irrigationThreshold.tensionKpa).toBeCloseTo(159.1, 0);

		// WS2 — bulk-density trace exposed alongside the curve.
		expect(curve.bulkDensity.predicted).toBeCloseTo(1.588, 2);
		expect(curve.bulkDensity.used).toBeCloseTo(1.3, 2);
		expect(curve.bulkDensity.source).toBe("DEFAULT");
	});

	it("monotonically decreases θ as tension grows past the air-entry point", () => {
		const curve = buildWaterRetentionCurve({
			sand: SAMPLE.sand,
			clay: SAMPLE.clay,
			organicMatter: SAMPLE.organicMatter,
		});
		const past = curve.points.filter(
			(p) => p.tensionKpa >= curve.airEntryTensionKpa
		);
		for (let i = 1; i < past.length; i += 1) {
			const prev = past[i - 1];
			const curr = past[i];
			expect(curr).toBeDefined();
			expect(prev).toBeDefined();
			expect(curr!.waterContentVolPercent).toBeLessThanOrEqual(
				prev!.waterContentVolPercent + 1e-6
			);
		}
	});
});
