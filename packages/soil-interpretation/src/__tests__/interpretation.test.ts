/**
 * @flaha/soil-interpretation — interpretation engine tests.
 *
 * Pure-function tests. Each scenario hand-builds a physics/chemistry
 * fixture matching the public output shapes of the calculation packages,
 * then asserts the qualitative classifications and warnings produced by
 * `interpretSoil`.
 */

import { describe, expect, it } from "vitest";
import { interpretSoil } from "../interpretSoil";

describe("interpretSoil — ideal soil", () => {
	it("classifies a balanced loam as Good with no warnings", () => {
		const result = interpretSoil({
			physics: {
				plantAvailableWater: "120", // moderate
				drainageClass: "Good",
				electricalConductivity: "1.0",
			},
			chemistry: {
				cec: 20,
				baseSaturation: 75,
				caPercent: 65,
				mgPercent: 15,
				kPercent: 4,
				naPercent: 2,
				esp: 2,
				cationBalanceOther: 16,
				ph: 6.8,
				ec: 1.0,
				calculationMode: "LAB",
			},
		});

		expect(result.phCategory).toBe("Neutral");
		expect(result.salinityRisk).toBe("Low");
		expect(result.cecLevel).toBe("Moderate");
		expect(result.baseSaturationCategory).toBe("Moderate");
		expect(result.sodiumRisk).toBe("Low");
		expect(result.cationBalance).toBe("Balanced");
		expect(result.waterHoldingClass).toBe("Moderate");
		expect(result.drainageClass).toBe("Good");
		expect(result.warnings).toEqual([]);
		expect(result.overallSoilRating).toBe("Good");
	});
});

describe("interpretSoil — high salinity", () => {
	it("flags Severe salinity and downgrades rating to Poor", () => {
		const result = interpretSoil({
			physics: { drainageClass: "Moderate" },
			chemistry: {
				cec: 18,
				baseSaturation: 70,
				caPercent: 65,
				mgPercent: 15,
				kPercent: 3,
				naPercent: 5,
				esp: 5,
				ec: 9.2, // > 8 → Severe
				ph: 7.4,
			},
		});

		expect(result.salinityRisk).toBe("Severe");
		expect(result.warnings).toContain(
			"Severe salinity — most crops will be impaired; leaching and salt-tolerant species recommended."
		);
		expect(result.overallSoilRating).toBe("Poor");
	});

	it("flags High salinity (4 ≤ EC < 8) with the High-tier message", () => {
		const result = interpretSoil({
			chemistry: { cec: 18, ec: 5.5, esp: 4 },
		});

		expect(result.salinityRisk).toBe("High");
		expect(result.warnings).toContain(
			"High salinity — yields of salt-sensitive crops will be reduced."
		);
		expect(result.overallSoilRating).toBe("Poor");
	});
});

describe("interpretSoil — high sodium", () => {
	it("flags High sodium risk when ESP > 15", () => {
		const result = interpretSoil({
			chemistry: {
				cec: 20,
				baseSaturation: 90,
				caPercent: 50,
				mgPercent: 14,
				kPercent: 3,
				naPercent: 23,
				esp: 23,
			},
		});

		expect(result.sodiumRisk).toBe("High");
		expect(result.warnings).toContain(
			"High exchangeable sodium (ESP > 15) — sodic soil; structural degradation likely without amendment."
		);
		expect(result.overallSoilRating).toBe("Poor");
	});
});

describe("interpretSoil — low CEC", () => {
	it("classifies CEC < 5 as Very Low and warns", () => {
		const result = interpretSoil({
			chemistry: { cec: 3.2, baseSaturation: 60, esp: 1 },
		});

		expect(result.cecLevel).toBe("Very Low");
		expect(result.warnings).toContain(
			"Very low CEC (< 5) — minimal nutrient buffering; split fertiliser applications advised."
		);
		expect(result.overallSoilRating).toBe("Poor");
	});

	it("classifies CEC 5 ≤ x < 15 as Low without warning", () => {
		const result = interpretSoil({ chemistry: { cec: 9 } });
		expect(result.cecLevel).toBe("Low");
		expect(result.warnings).toEqual([]);
	});
});

describe("interpretSoil — missing chemistry", () => {
	it("does not crash when chemistry is omitted; emits physics fields only", () => {
		const result = interpretSoil({
			physics: {
				plantAvailableWater: "180",
				drainageClass: "Excellent",
			},
		});

		expect(result.waterHoldingClass).toBe("High");
		expect(result.drainageClass).toBe("Excellent");
		expect(result.phCategory).toBeUndefined();
		expect(result.salinityRisk).toBeUndefined();
		expect(result.cecLevel).toBeUndefined();
		expect(result.warnings).toEqual([]);
	});

	it("does not crash when both inputs are omitted", () => {
		const result = interpretSoil({});
		expect(result.warnings).toEqual([]);
		expect(result.overallSoilRating).toBe("Fair");
	});

	it("does not crash on null inputs", () => {
		const result = interpretSoil({ physics: null, chemistry: null });
		expect(result.warnings).toEqual([]);
		expect(result.overallSoilRating).toBe("Fair");
	});
});

describe("interpretSoil — pH boundaries and warnings", () => {
	it("Strongly Acidic triggers a warning", () => {
		const result = interpretSoil({ chemistry: { ph: 4.8 } });
		expect(result.phCategory).toBe("Strongly Acidic");
		expect(result.warnings.length).toBeGreaterThan(0);
		expect(result.overallSoilRating).toBe("Poor");
	});

	it("Highly Alkaline triggers a warning", () => {
		const result = interpretSoil({ chemistry: { ph: 9.0 } });
		expect(result.phCategory).toBe("Highly Alkaline");
		expect(result.warnings.length).toBeGreaterThan(0);
	});

	it("classifies the four interior pH bands deterministically", () => {
		expect(interpretSoil({ chemistry: { ph: 6.0 } }).phCategory).toBe(
			"Slightly Acidic"
		);
		expect(interpretSoil({ chemistry: { ph: 7.0 } }).phCategory).toBe(
			"Neutral"
		);
		expect(interpretSoil({ chemistry: { ph: 8.0 } }).phCategory).toBe(
			"Alkaline"
		);
	});
});

describe("interpretSoil — cation balance", () => {
	it("flags Imbalanced when Ca exceeds the 60–75 % window", () => {
		const result = interpretSoil({
			chemistry: { caPercent: 85, mgPercent: 12, kPercent: 3 },
		});
		expect(result.cationBalance).toBe("Imbalanced");
	});

	it("classifies Balanced when all supplied cations are inside their windows", () => {
		const result = interpretSoil({
			chemistry: { caPercent: 65, mgPercent: 15, kPercent: 4 },
		});
		expect(result.cationBalance).toBe("Balanced");
	});

	it("ignores missing cations when judging balance", () => {
		// Only Ca supplied, in window — must remain Balanced.
		const result = interpretSoil({ chemistry: { caPercent: 70 } });
		expect(result.cationBalance).toBe("Balanced");
	});
});

describe("interpretSoil — physics passthrough", () => {
	it("maps drainage class straight through from physics", () => {
		const result = interpretSoil({
			physics: { drainageClass: "Very Poor" },
		});
		expect(result.drainageClass).toBe("Very Poor");
	});

	it("falls back to physics.electricalConductivity when chemistry.ec is absent", () => {
		const result = interpretSoil({
			physics: { electricalConductivity: "3.1" },
		});
		expect(result.salinityRisk).toBe("Moderate");
	});
});
