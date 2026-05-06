/**
 * Regression tests for @flaha/soil-physics.
 *
 * Fixtures are taken verbatim from `docs/legacy-calculation-samples.md`,
 * which captures the output of the legacy
 * `SoilCalculationService.calculateWaterCharacteristics(...)` for five
 * canonical soils across FREE / PROFESSIONAL / ENTERPRISE plans.
 *
 * Output parity rules:
 *   - Numeric fields emitted as strings via `toFixed(n)` are compared as
 *     numbers (parsed) using `toBeCloseTo(value, 2)`.
 *   - Class/string fields (`textureClass`, `drainageClass`, etc.) are
 *     compared with strict equality.
 *   - Plan-tier-specific fields are asserted only on the appropriate tier.
 */

import { describe, expect, it } from "vitest";
import { calculateSoilPhysics } from "../calculateSoilPhysics";
import type { SoilPhysicsInput, UserPlan } from "../types";

interface BaselineCore {
	textureClass: string;
	fieldCapacity: number;
	wiltingPoint: number;
	plantAvailableWater: number;
	saturation: number;
	saturatedConductivity: number;
	bulkDensityFree: number; // 3 decimals
	bulkDensityPro: number; // 2 decimals
	porosity: number;
	voidRatio: number;
	soilQualityIndex: number;
	drainageClass: string;
	compactionRisk: string;
	erosionRisk: string;
}

interface BaselineProfessional {
	airEntryTension: number;
	lambda: number;
}

interface BaselineEnterprise {
	osmoticPotential: number;
	osmoticPotentialFC: number;
	parameterA: number;
	parameterB: number;
	relativeK: number;
	conductivityExponent: number;
}

interface SampleFixture {
	name: string;
	input: Omit<SoilPhysicsInput, "userPlan">;
	core: BaselineCore;
	pro: BaselineProfessional;
	enterprise: BaselineEnterprise;
}

const SAMPLES: SampleFixture[] = [
	{
		name: "Sample 1 — Sandy",
		input: {
			sand: 85,
			clay: 5,
			organicMatter: 1.0,
			densityFactor: 1.5,
			electricalConductivity: 0.5,
			gravelContent: 0,
		},
		core: {
			textureClass: "Sand",
			fieldCapacity: 7.4,
			wiltingPoint: 2.3,
			plantAvailableWater: 5.0,
			saturation: 43.4,
			saturatedConductivity: 122.9,
			bulkDensityFree: 1.679,
			bulkDensityPro: 1.68,
			porosity: 43.4,
			voidRatio: 0.767,
			soilQualityIndex: 6.0,
			drainageClass: "Excellent",
			compactionRisk: "Low",
			erosionRisk: "High",
		},
		pro: { airEntryTension: 7.8, lambda: 0.3 },
		enterprise: {
			osmoticPotential: -0.2,
			osmoticPotentialFC: -0.4,
			parameterA: 332.935,
			parameterB: 3.307,
			relativeK: 0.0,
			conductivityExponent: 9.61,
		},
	},
	{
		name: "Sample 2 — Loam",
		input: {
			sand: 40,
			clay: 20,
			organicMatter: 2.5,
			densityFactor: 1.3,
			electricalConductivity: 0.8,
			gravelContent: 0,
		},
		core: {
			textureClass: "Loam",
			fieldCapacity: 25.3,
			wiltingPoint: 12.2,
			plantAvailableWater: 13.1,
			saturation: 50.9,
			saturatedConductivity: 42.3,
			bulkDensityFree: 1.517,
			bulkDensityPro: 1.52,
			porosity: 50.9,
			voidRatio: 1.038,
			soilQualityIndex: 8.0,
			drainageClass: "Moderate",
			compactionRisk: "Low",
			erosionRisk: "Low",
		},
		pro: { airEntryTension: 9.6, lambda: 0.19 },
		enterprise: {
			osmoticPotential: -0.3,
			osmoticPotentialFC: -0.6,
			parameterA: 213.884,
			parameterB: 5.226,
			relativeK: 0.0,
			conductivityExponent: 13.45,
		},
	},
	{
		name: "Sample 3 — Clay",
		input: {
			sand: 20,
			clay: 50,
			organicMatter: 2.0,
			densityFactor: 1.25,
			electricalConductivity: 1.2,
			gravelContent: 0,
		},
		core: {
			textureClass: "Clay",
			fieldCapacity: 42.7,
			wiltingPoint: 29.5,
			plantAvailableWater: 13.1,
			saturation: 52.8,
			saturatedConductivity: 2.5,
			bulkDensityFree: 1.305,
			bulkDensityPro: 1.31,
			porosity: 52.8,
			voidRatio: 1.12,
			soilQualityIndex: 6.0,
			drainageClass: "Poor",
			compactionRisk: "Low",
			erosionRisk: "Low",
		},
		pro: { airEntryTension: 1.8, lambda: 0.1 },
		enterprise: {
			osmoticPotential: -0.4,
			osmoticPotentialFC: -0.9,
			parameterA: 133.963,
			parameterB: 10.0,
			relativeK: 0.007,
			conductivityExponent: 23.0,
		},
	},
];

SAMPLES.push(
	{
		name: "Sample 4 — High Organic Matter",
		input: {
			sand: 35,
			clay: 30,
			organicMatter: 6.0,
			densityFactor: 1.1,
			electricalConductivity: 0.6,
			gravelContent: 0,
		},
		core: {
			textureClass: "Clay Loam",
			fieldCapacity: 31.3,
			wiltingPoint: 18.1,
			plantAvailableWater: 13.2,
			saturation: 58.5,
			saturatedConductivity: 46.8,
			bulkDensityFree: 1.455,
			bulkDensityPro: 1.45,
			porosity: 58.5,
			voidRatio: 1.409,
			soilQualityIndex: 8.0,
			drainageClass: "Moderate",
			compactionRisk: "Low",
			erosionRisk: "Low",
		},
		pro: { airEntryTension: 6.5, lambda: 0.14 },
		enterprise: {
			osmoticPotential: -0.2,
			osmoticPotentialFC: -0.4,
			parameterA: 251.833,
			parameterB: 6.951,
			relativeK: 0.0,
			conductivityExponent: 16.9,
		},
	},
	{
		name: "Sample 5 — Saline",
		input: {
			sand: 45,
			clay: 25,
			organicMatter: 2.0,
			densityFactor: 1.3,
			electricalConductivity: 6.0,
			gravelContent: 0,
		},
		core: {
			textureClass: "Loam",
			fieldCapacity: 26.9,
			wiltingPoint: 15.1,
			plantAvailableWater: 11.8,
			saturation: 50.9,
			saturatedConductivity: 33.4,
			bulkDensityFree: 1.507,
			bulkDensityPro: 1.51,
			porosity: 50.9,
			voidRatio: 1.038,
			soilQualityIndex: 8.0,
			drainageClass: "Moderate",
			compactionRisk: "Low",
			erosionRisk: "Low",
		},
		pro: { airEntryTension: 7.5, lambda: 0.15 },
		enterprise: {
			osmoticPotential: -2.2,
			osmoticPotentialFC: -4.3,
			parameterA: 244.859,
			parameterB: 6.597,
			relativeK: 0.0,
			conductivityExponent: 16.19,
		},
	}
);

const num = (s: string | number | undefined): number =>
	typeof s === "number" ? s : parseFloat(s as string);

function assertCore(result: ReturnType<typeof calculateSoilPhysics>, c: BaselineCore, isFree: boolean) {
	expect(result.textureClass).toBe(c.textureClass);
	expect(num(result.fieldCapacity)).toBeCloseTo(c.fieldCapacity, 1);
	expect(num(result.wiltingPoint)).toBeCloseTo(c.wiltingPoint, 1);
	expect(num(result.plantAvailableWater)).toBeCloseTo(c.plantAvailableWater, 1);
	expect(num(result.saturation)).toBeCloseTo(c.saturation, 1);
	expect(num(result.saturatedConductivity)).toBeCloseTo(c.saturatedConductivity, 1);
	expect(num(result.porosity)).toBeCloseTo(c.porosity, 1);
	expect(num(result.voidRatio)).toBeCloseTo(c.voidRatio, 3);
	expect(num(result.soilQualityIndex)).toBeCloseTo(c.soilQualityIndex, 1);
	expect(result.drainageClass).toBe(c.drainageClass);
	expect(result.compactionRisk).toBe(c.compactionRisk);
	expect(result.erosionRisk).toBe(c.erosionRisk);
	if (isFree) {
		// FREE tier renders 3-decimal bulkDensity
		expect(result.bulkDensity).toBe(c.bulkDensityFree.toFixed(3));
	} else {
		// PROFESSIONAL/ENTERPRISE renders 2-decimal bulkDensity
		expect(result.bulkDensity).toBe(c.bulkDensityPro.toFixed(2));
	}
}

describe("calculateSoilPhysics — legacy baseline regression", () => {
	for (const sample of SAMPLES) {
		describe(sample.name, () => {
			(["FREE", "PROFESSIONAL", "ENTERPRISE"] as UserPlan[]).forEach((plan) => {
				it(`matches baseline for ${plan}`, () => {
					const result = calculateSoilPhysics({ ...sample.input, userPlan: plan });
					assertCore(result, sample.core, plan === "FREE");

					if (plan === "PROFESSIONAL" || plan === "ENTERPRISE") {
						expect(num(result.airEntryTension)).toBeCloseTo(sample.pro.airEntryTension, 1);
						expect(num(result.lambda)).toBeCloseTo(sample.pro.lambda, 2);
						expect(result.unsaturatedConductivity).toBe("0.0");
						expect(result.confidenceIntervals).toEqual({
							wiltingPoint: 0.02,
							fieldCapacity: 0.05,
							saturation: 0.04,
							airEntryTension: 2.9,
							saturatedConductivity: 0.3,
						});
						expect(result.rSquaredValues).toEqual({
							wiltingPoint: 0.86,
							fieldCapacity: 0.63,
							saturation: 0.29,
							airEntryTension: 0.78,
							saturatedConductivity: 0.45,
						});
					}

					if (plan === "ENTERPRISE") {
						expect(num(result.osmoticPotential)).toBeCloseTo(sample.enterprise.osmoticPotential, 1);
						expect(num(result.osmoticPotentialFC)).toBeCloseTo(sample.enterprise.osmoticPotentialFC, 1);
						expect(num(result.parameterA)).toBeCloseTo(sample.enterprise.parameterA, 2);
						expect(num(result.parameterB)).toBeCloseTo(sample.enterprise.parameterB, 2);
						expect(num(result.relativeK)).toBeCloseTo(sample.enterprise.relativeK, 3);
						expect(num(result.conductivityExponent)).toBeCloseTo(sample.enterprise.conductivityExponent, 2);
					}
				});
			});
		});
	}
});
