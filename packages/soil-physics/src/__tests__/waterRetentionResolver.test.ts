/**
 * Phase 10C-B — Water-retention resolver + dispatch tests.
 *
 * Verifies model resolution (default fallback, unknown → safe error),
 * availability reporting, SR2006 computation parity with the production
 * engine, and that FUTURE models never compute.
 */

import { describe, expect, it } from "vitest";
import {
	resolveWaterRetentionModel,
	getWaterRetentionModelAvailability,
	isWaterRetentionModelComputable,
	computeWaterRetentionModel,
} from "../waterRetention";
import { buildWaterRetentionCurve } from "../waterRetentionCurve";

describe("resolveWaterRetentionModel", () => {
	it("falls back to SAXTON_RAWLS_2006 when modelId is omitted", () => {
		expect(resolveWaterRetentionModel().id).toBe("SAXTON_RAWLS_2006");
		expect(resolveWaterRetentionModel(undefined).id).toBe("SAXTON_RAWLS_2006");
		expect(resolveWaterRetentionModel("").id).toBe("SAXTON_RAWLS_2006");
	});

	it("resolves a known model id to its metadata", () => {
		expect(resolveWaterRetentionModel("VAN_GENUCHTEN").id).toBe("VAN_GENUCHTEN");
	});

	it("throws a safe error for an unknown model id", () => {
		expect(() => resolveWaterRetentionModel("NOPE")).toThrowError(
			/Unknown water-retention model id/
		);
	});
});

describe("availability", () => {
	it("SAXTON_RAWLS_2006 is computable with sand+clay", () => {
		const a = getWaterRetentionModelAvailability("SAXTON_RAWLS_2006", { sand: 40, clay: 20 });
		expect(a.computableNow).toBe(true);
		expect(a.missingParameters).toEqual([]);
	});

	it("SAXTON_RAWLS_2006 reports missing sand/clay", () => {
		const a = getWaterRetentionModelAvailability("SAXTON_RAWLS_2006", {});
		expect(a.computableNow).toBe(false);
		expect(a.missingParameters).toContain("sand");
		expect(a.missingParameters).toContain("clay");
	});

	it("VAN_GENUCHTEN is not computable without parameters", () => {
		expect(isWaterRetentionModelComputable("VAN_GENUCHTEN", {})).toBe(false);
	});

	it("FUTURE models are never computable", () => {
		expect(isWaterRetentionModelComputable("ROSETTA_HYPRES_FUTURE", {})).toBe(false);
		expect(isWaterRetentionModelComputable("CUSTOM_ORGANIZATION_MODEL", {})).toBe(false);
	});
});

describe("computeWaterRetentionModel — SAXTON_RAWLS_2006", () => {
	it("computes finite FC/WP/PAW/saturation matching the production engine", () => {
		const input = { sand: 40, clay: 20, organicMatter: 2.5 };
		const result = computeWaterRetentionModel("SAXTON_RAWLS_2006", input);
		expect(result.status).toBe("COMPUTED");
		const o = result.outputs;
		expect(o).toBeDefined();
		const curve = buildWaterRetentionCurve(input);
		// Parity with the unchanged production engine (fraction = percent/100).
		expect(o?.fieldCapacity).toBeCloseTo(curve.fieldCapacity.waterContentVolPercent / 100, 10);
		expect(o?.wiltingPoint).toBeCloseTo(curve.wiltingPoint.waterContentVolPercent / 100, 10);
		expect(o?.saturation).toBeCloseTo(curve.saturation.waterContentVolPercent / 100, 10);
	});

	it("returns MISSING_PARAMETERS when texture is absent", () => {
		const result = computeWaterRetentionModel("SAXTON_RAWLS_2006", {});
		expect(result.status).toBe("MISSING_PARAMETERS");
		expect(result.missingParameters).toContain("sand");
	});

	it("produces only finite curve points", () => {
		const result = computeWaterRetentionModel("SAXTON_RAWLS_2006", { sand: 40, clay: 20 });
		for (const pt of result.curvePoints ?? []) {
			expect(Number.isFinite(pt.matricPotentialKpa)).toBe(true);
			expect(Number.isFinite(pt.waterContentFraction)).toBe(true);
		}
	});
});

describe("computeWaterRetentionModel — FUTURE models", () => {
	it("ROSETTA_HYPRES_FUTURE returns NOT_AVAILABLE", () => {
		const result = computeWaterRetentionModel("ROSETTA_HYPRES_FUTURE", { sand: 40, clay: 20 });
		expect(result.status).toBe("NOT_AVAILABLE");
		expect(result.outputs).toBeUndefined();
		expect(result.curvePoints).toBeUndefined();
	});

	it("CUSTOM_ORGANIZATION_MODEL returns NOT_AVAILABLE", () => {
		expect(computeWaterRetentionModel("CUSTOM_ORGANIZATION_MODEL", {}).status).toBe(
			"NOT_AVAILABLE"
		);
	});
});
