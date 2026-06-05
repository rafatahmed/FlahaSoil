/**
 * @flaha/soil-interpretation — Phase 8D extended classifier tests.
 *
 * Covers the additions made for the Reports v1 milestone: FAO-29
 * salinity / sodicity severities, organic-matter / infiltration /
 * drainage-from-Ksat / compaction classifiers, and the texture
 * suitability matrix. The legacy categories continue to be exercised
 * in `interpretation.test.ts`.
 */

import { describe, expect, it } from "vitest";

import { interpretSoil } from "../interpretSoil";
import {
	classifyCompactionRisk,
	classifyDrainageFromKsat,
	classifyInfiltration,
	classifyOrganicMatter,
	classifySalinitySeverity,
	classifySodicitySeverity,
	classifyTextureSuitability,
} from "../rules";

describe("classifySalinitySeverity (FAO-29)", () => {
	it("buckets EC across the 5 standard classes", () => {
		expect(classifySalinitySeverity(1)).toBe("None");
		expect(classifySalinitySeverity(3)).toBe("Slight");
		expect(classifySalinitySeverity(6)).toBe("Moderate");
		expect(classifySalinitySeverity(12)).toBe("Strong");
		expect(classifySalinitySeverity(20)).toBe("Severe");
	});
});

describe("classifySodicitySeverity", () => {
	it("prefers ESP when supplied", () => {
		expect(classifySodicitySeverity({ esp: 4, sar: 14 })).toBe("None");
		expect(classifySodicitySeverity({ esp: 12 })).toBe("Moderate");
		expect(classifySodicitySeverity({ esp: 22 })).toBe("Severe");
	});
	it("falls back to SAR when ESP missing", () => {
		expect(classifySodicitySeverity({ sar: 2 })).toBe("None");
		expect(classifySodicitySeverity({ sar: 7 })).toBe("Moderate");
		expect(classifySodicitySeverity({ sar: 14 })).toBe("Severe");
	});
	it("returns None when neither is supplied", () => {
		expect(classifySodicitySeverity({})).toBe("None");
	});
});

describe("classifyOrganicMatter", () => {
	it("classifies the four bands", () => {
		expect(classifyOrganicMatter(0.5)).toBe("Very Low");
		expect(classifyOrganicMatter(1.5)).toBe("Low");
		expect(classifyOrganicMatter(3)).toBe("Adequate");
		expect(classifyOrganicMatter(6)).toBe("High");
	});
});

describe("classifyDrainageFromKsat", () => {
	it("buckets Ksat (mm/h) across the 5 drainage classes", () => {
		expect(classifyDrainageFromKsat(0.05)).toBe("Very Poor");
		expect(classifyDrainageFromKsat(1)).toBe("Poor");
		expect(classifyDrainageFromKsat(3)).toBe("Moderate");
		expect(classifyDrainageFromKsat(20)).toBe("Good");
		expect(classifyDrainageFromKsat(80)).toBe("Excessive");
	});
});

describe("classifyInfiltration", () => {
	it("buckets Ksat (mm/h) across the 5 infiltration classes", () => {
		expect(classifyInfiltration(0.5)).toBe("Very Slow");
		expect(classifyInfiltration(3)).toBe("Slow");
		expect(classifyInfiltration(15)).toBe("Moderate");
		expect(classifyInfiltration(40)).toBe("Rapid");
		expect(classifyInfiltration(70)).toBe("Very Rapid");
	});
});

describe("classifyCompactionRisk", () => {
	it("uses sandy thresholds for sandy soils", () => {
		expect(
			classifyCompactionRisk({ bulkDensity: 1.7, textureClass: "Sand" })
		).toBe("Moderate");
		expect(
			classifyCompactionRisk({ bulkDensity: 1.85, textureClass: "Loamy Sand" })
		).toBe("High");
	});
	it("uses clay thresholds for clays", () => {
		expect(
			classifyCompactionRisk({ bulkDensity: 1.4, textureClass: "Clay" })
		).toBe("Moderate");
		expect(
			classifyCompactionRisk({ bulkDensity: 1.5, textureClass: "Silty Clay" })
		).toBe("High");
	});
	it("uses loam thresholds for loams", () => {
		expect(
			classifyCompactionRisk({ bulkDensity: 1.55, textureClass: "Loam" })
		).toBe("Moderate");
	});
});

describe("classifyTextureSuitability", () => {
	it("returns the base lookup verdict for a loam", () => {
		const m = classifyTextureSuitability({ textureClass: "Loam" });
		expect(m.agriculture.verdict).toBe("Suitable");
		expect(m.turfgrass.verdict).toBe("Suitable");
		expect(m.landscape.verdict).toBe("Suitable");
		expect(m.irrigation.verdict).toBe("Suitable");
	});
	it("downgrades agriculture under Severe salinity", () => {
		const m = classifyTextureSuitability({
			textureClass: "Loam",
			salinitySeverity: "Severe",
		});
		expect(m.agriculture.verdict).toBe("Unsuitable");
		expect(m.agriculture.reasons.some((r) => /salinity/i.test(r))).toBe(true);
	});
	it("downgrades irrigation under Strong sodicity", () => {
		const m = classifyTextureSuitability({
			textureClass: "Loam",
			sodicitySeverity: "Strong",
		});
		expect(m.irrigation.verdict).toBe("Unsuitable");
	});
	it("falls back to Marginal for an unknown texture class", () => {
		const m = classifyTextureSuitability({ textureClass: "Made-up Class" });
		expect(m.agriculture.verdict).toBe("Marginal");
	});
});

describe("interpretSoil — Phase 8D outputs", () => {
	it("emits all extended fields when full physics+chemistry supplied", () => {
		const result = interpretSoil({
			physics: {
				bulkDensity: 1.55,
				textureClass: "Loam",
				saturatedConductivity: 12,
				drainageClass: "Good",
				plantAvailableWater: "120",
			},
			chemistry: {
				ph: 7.4,
				ec: 5.5,
				cec: 18,
				esp: 12,
				sar: 9,
				organicMatter: 2.5,
				caPercent: 60,
				mgPercent: 15,
				kPercent: 3,
				baseSaturation: 70,
			},
		});
		expect(result.salinitySeverity).toBe("Moderate");
		expect(result.sodicitySeverity).toBe("Moderate");
		expect(result.organicMatterCategory).toBe("Adequate");
		expect(result.compactionRisk).toBe("Moderate");
		expect(result.infiltrationClass).toBe("Moderate");
		expect(result.textureSuitability?.agriculture.verdict).toBe("Marginal");
	});

	it("omits extended fields when their inputs are absent", () => {
		const result = interpretSoil({ chemistry: { ph: 7.0 } });
		expect(result.salinitySeverity).toBeUndefined();
		expect(result.sodicitySeverity).toBeUndefined();
		expect(result.compactionRisk).toBeUndefined();
		expect(result.textureSuitability).toBeUndefined();
	});
});
