/**
 * Phase 10C-B — Water-retention validation tests.
 *
 * Covers:
 *   - validateVanGenuchten  (MISSING_PARAMETERS / INVALID_INPUT / OK)
 *   - validateBrooksCorey   (MISSING_PARAMETERS / INVALID_INPUT / OK)
 *   - validateCampbell      (MISSING_PARAMETERS / INVALID_INPUT / OK)
 *   - validateLabMeasuredCurve (MISSING_PARAMETERS / INVALID_INPUT / OK)
 *   - computeWaterRetentionModel  (parameterized models end-to-end)
 */

import { describe, expect, it } from "vitest";
import { computeWaterRetentionModel } from "../waterRetention";

// ─── Van Genuchten ─────────────────────────────────────────────────────────

describe("computeWaterRetentionModel — VAN_GENUCHTEN", () => {
	it("returns MISSING_PARAMETERS when all params absent", () => {
		const r = computeWaterRetentionModel("VAN_GENUCHTEN", {});
		expect(r.status).toBe("MISSING_PARAMETERS");
		expect(r.missingParameters).toContain("thetaR");
		expect(r.missingParameters).toContain("thetaS");
		expect(r.missingParameters).toContain("alpha");
		expect(r.missingParameters).toContain("n");
	});

	it("returns MISSING_PARAMETERS for partial params", () => {
		const r = computeWaterRetentionModel("VAN_GENUCHTEN", {
			parameters: { thetaR: 0.05, thetaS: 0.45 },
		});
		expect(r.status).toBe("MISSING_PARAMETERS");
		expect(r.missingParameters).toContain("alpha");
	});

	it("returns INVALID_INPUT when thetaS <= thetaR", () => {
		const r = computeWaterRetentionModel("VAN_GENUCHTEN", {
			parameters: { thetaR: 0.45, thetaS: 0.30, alpha: 0.036, n: 1.56 },
		});
		expect(r.status).toBe("INVALID_INPUT");
	});

	it("returns INVALID_INPUT when n <= 1", () => {
		const r = computeWaterRetentionModel("VAN_GENUCHTEN", {
			parameters: { thetaR: 0.05, thetaS: 0.45, alpha: 0.036, n: 0.9 },
		});
		expect(r.status).toBe("INVALID_INPUT");
	});

	it("returns COMPUTED with finite curve points for valid params", () => {
		const r = computeWaterRetentionModel("VAN_GENUCHTEN", {
			parameters: { thetaR: 0.05, thetaS: 0.45, alpha: 0.036, n: 1.56 },
		});
		expect(r.status).toBe("COMPUTED");
		expect(r.curvePoints).toBeDefined();
		expect(r.curvePoints!.length).toBeGreaterThan(0);
		for (const pt of r.curvePoints!) {
			expect(Number.isFinite(pt.matricPotentialKpa)).toBe(true);
			expect(Number.isFinite(pt.waterContentFraction)).toBe(true);
			expect(pt.waterContentFraction).toBeGreaterThanOrEqual(0);
			expect(pt.waterContentFraction).toBeLessThanOrEqual(1);
		}
	});
});

// ─── Brooks-Corey ──────────────────────────────────────────────────────────

describe("computeWaterRetentionModel — BROOKS_COREY", () => {
	it("returns MISSING_PARAMETERS when params absent", () => {
		const r = computeWaterRetentionModel("BROOKS_COREY", {});
		expect(r.status).toBe("MISSING_PARAMETERS");
		expect(r.missingParameters).toContain("thetaR");
		expect(r.missingParameters).toContain("airEntryPressure");
		expect(r.missingParameters).toContain("lambda");
	});

	it("returns INVALID_INPUT when lambda <= 0", () => {
		const r = computeWaterRetentionModel("BROOKS_COREY", {
			parameters: { thetaR: 0.05, thetaS: 0.45, airEntryPressure: 3.5, lambda: -0.1 },
		});
		expect(r.status).toBe("INVALID_INPUT");
	});

	it("returns COMPUTED with finite curve points for valid params", () => {
		const r = computeWaterRetentionModel("BROOKS_COREY", {
			parameters: { thetaR: 0.05, thetaS: 0.45, airEntryPressure: 3.5, lambda: 0.38 },
		});
		expect(r.status).toBe("COMPUTED");
		expect(r.curvePoints!.length).toBeGreaterThan(0);
	});
});

// ─── Campbell ──────────────────────────────────────────────────────────────

describe("computeWaterRetentionModel — CAMPBELL", () => {
	it("returns MISSING_PARAMETERS when params absent", () => {
		const r = computeWaterRetentionModel("CAMPBELL", {});
		expect(r.status).toBe("MISSING_PARAMETERS");
		expect(r.missingParameters).toContain("thetaS");
		expect(r.missingParameters).toContain("airEntryPotential");
		expect(r.missingParameters).toContain("b");
	});

	it("returns INVALID_INPUT when b <= 0", () => {
		const r = computeWaterRetentionModel("CAMPBELL", {
			parameters: { thetaS: 0.45, airEntryPotential: 1.5, b: -2 },
		});
		expect(r.status).toBe("INVALID_INPUT");
	});

	it("returns COMPUTED with finite curve points for valid params", () => {
		// airEntryPotential uses positive-suction convention (kPa) as required by validator.
		const r = computeWaterRetentionModel("CAMPBELL", {
			parameters: { thetaS: 0.45, airEntryPotential: 1.5, b: 5.9 },
		});
		expect(r.status).toBe("COMPUTED");
		expect(r.curvePoints!.length).toBeGreaterThan(0);
	});
});

// ─── Lab-measured curve ────────────────────────────────────────────────────

describe("computeWaterRetentionModel — LAB_MEASURED_CURVE", () => {
	it("returns MISSING_PARAMETERS when no curve supplied", () => {
		const r = computeWaterRetentionModel("LAB_MEASURED_CURVE", {});
		expect(r.status).toBe("MISSING_PARAMETERS");
	});

	it("returns INVALID_INPUT for a malformed curve point", () => {
		const r = computeWaterRetentionModel("LAB_MEASURED_CURVE", {
			measuredCurve: [{ matricPotentialKpa: -1, waterContentFraction: 0.3 }],
		});
		expect(r.status).toBe("INVALID_INPUT");
	});

	it("returns COMPUTED echoing back sorted curve points", () => {
		const pts = [
			{ matricPotentialKpa: 1500, waterContentFraction: 0.12 },
			{ matricPotentialKpa: 33, waterContentFraction: 0.28 },
			{ matricPotentialKpa: 10, waterContentFraction: 0.35 },
		];
		const r = computeWaterRetentionModel("LAB_MEASURED_CURVE", { measuredCurve: pts });
		expect(r.status).toBe("COMPUTED");
		expect(r.curvePoints).toHaveLength(3);
		// sorted ascending by tension
		expect(r.curvePoints![0]!.matricPotentialKpa).toBe(10);
		expect(r.curvePoints![2]!.matricPotentialKpa).toBe(1500);
	});
});
