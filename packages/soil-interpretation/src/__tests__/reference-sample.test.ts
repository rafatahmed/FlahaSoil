/**
 * @flaha/soil-interpretation — Phase 10A.7 (WS7) locked regression fixture.
 *
 * Pins the audit reference sample's interpretation outcome so the
 * WS3 rating-trace and the corrected PAW unit anchor cannot regress.
 *
 *   Physics: Sand 60 %, Silt 25 %, Clay 15 %, OM 2.5 %, ρDF 1.30 g/cm³
 *     → FC = 18.3 %v/v, WP = 8.9 %v/v, PAW = 9.4 %v/v, Ksat = 82.8 mm/h,
 *       drainage = "Good", textureClass = "Sandy Loam".
 *   Chemistry: CEC 18, Ca 11, Mg 3, K 0.6, Na 0.4, pH 7.2, EC 1.0.
 *
 * Expected verdict (per the Phase 10S-4 audit + corrections):
 *   - PAW = 9.4 %v/v  →  waterHoldingClass = "Low" (the *only* negative).
 *   - All other categories land in the positive bucket.
 *   - No "Severe" / "High" risks → overallSoilRating = "Fair" (the trace
 *     shows exactly one moderateNegative entry and six positives).
 *
 * Before the WS3 fix this same sample was reported as "Poor" because PAW
 * was incorrectly compared against mm/m thresholds (50 / 150) instead of
 * the % v/v thresholds (10 / 15). The fixture below is the regression
 * guard for that bug.
 */

import { describe, expect, it } from "vitest";

import { interpretSoil } from "../interpretSoil";

const PHYSICS = {
	textureClass: "Sandy Loam",
	fieldCapacity: "18.3",
	wiltingPoint: "8.9",
	plantAvailableWater: "9.4",
	saturation: "50.9",
	saturatedConductivity: "82.8",
	drainageClass: "Good",
	bulkDensity: 1.59,
	organicMatter: 2.5,
} as const;

const CHEMISTRY = {
	cec: 18,
	baseSaturation: 83.33,
	caPercent: 61.11,
	mgPercent: 16.67,
	kPercent: 3.33,
	naPercent: 2.22,
	esp: 2.22,
	sar: 0.15,
	ph: 7.2,
	ec: 1.0,
	calculationMode: "LAB",
} as const;

describe("interpretSoil — Phase 10A.7 reference sample", () => {
	const result = interpretSoil({
		physics: PHYSICS as unknown as Record<string, unknown>,
		chemistry: CHEMISTRY as unknown as Record<string, unknown>,
	});

	it("classifies each category against the audited thresholds", () => {
		expect(result.phCategory).toBe("Neutral");
		expect(result.salinityRisk).toBe("Low");
		expect(result.cecLevel).toBe("Moderate");
		expect(result.baseSaturationCategory).toBe("High");
		expect(result.sodiumRisk).toBe("Low");
		expect(result.cationBalance).toBe("Balanced");
		expect(result.drainageClass).toBe("Good");

		// PAW = 9.4 %v/v → < 10 → "Low" (post-WS3 thresholds).
		expect(result.waterHoldingClass).toBe("Low");

		// Phase 8D extended classifiers.
		expect(result.salinitySeverity).toBe("None");
		expect(result.sodicitySeverity).toBe("None");
		expect(result.organicMatterCategory).toBe("Adequate");
		expect(result.compactionRisk).toBe("Low");
		expect(result.infiltrationClass).toBe("Very Rapid");
	});

	it("emits an empty warnings array (no Severe/High risk present)", () => {
		expect(result.warnings).toEqual([]);
	});

	it("rates the sample 'Fair' with one moderateNegative and six positives", () => {
		expect(result.overallSoilRating).toBe("Fair");

		const trace = result.ratingTrace;
		expect(trace.decision).toBe("Fair");
		expect(trace.severe).toEqual([]);

		// Exactly one moderateNegative — the corrected PAW classification.
		expect(trace.moderateNegative).toHaveLength(1);
		expect(trace.moderateNegative[0]).toMatchObject({
			category: "waterHoldingClass",
			value: "Low",
		});
		expect(trace.moderateNegative[0]?.note).toMatch(/PAW < 10/);

		// Positive contributors — pH, EC, ESP, CEC, BS, cation balance.
		const positiveCategories = trace.positive.map((p) => p.category).sort();
		expect(positiveCategories).toEqual(
			[
				"baseSaturationCategory",
				"cationBalance",
				"cecLevel",
				"phCategory",
				"salinityRisk",
				"sodiumRisk",
			].sort()
		);
	});

	it("regression guard — PAW 9.4 % must NOT downgrade rating to Poor", () => {
		// Phase 10A.7 R1: the pre-fix engine compared PAW (%v/v) against
		// the mm/m thresholds (50 / 150), pushing every realistic mineral
		// soil into "Very Low" and forcing overallSoilRating to "Poor".
		// This guard pins the post-fix behaviour explicitly.
		expect(result.ratingTrace.severe).toHaveLength(0);
		expect(result.overallSoilRating).not.toBe("Poor");
	});
});
