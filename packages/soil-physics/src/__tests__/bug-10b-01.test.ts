import { describe, expect, it } from "vitest";
import { calculateSoilPhysics } from "../calculateSoilPhysics";

describe("BUG-10B-01 reproduction \u2014 Ksat NaN for heavy clay + high bulk density", () => {
	it("heavy clay + high bulk density returns finite Ksat (not NaN)", () => {
		// Fixture A5: heavy clay + extreme user BD
		const result = calculateSoilPhysics({
			sand: 10,
			clay: 60,
			organicMatter: 1.0,
			densityFactor: 1.6,
			userPlan: "PROFESSIONAL",
		});

		const ksat = parseFloat(result.saturatedConductivity);
		
		expect(Number.isFinite(ksat)).toBe(true);
		expect(ksat).not.toBeNaN();
		expect(result.saturatedConductivity).not.toBe("NaN");
		
		// Infiltration/drainage classification should proceed
		expect(result.drainageClass).toBeDefined();
		expect(result.drainageClass).not.toBeNull();
		// For high compaction, it should be very low
		expect(result.drainageClass).toBe("Very Poor");
	});
});
