/**
 * Phase 10C-B — Water-retention model registry tests.
 *
 * Verifies registry integrity: unique IDs, a single active default, complete
 * metadata, and correct computable/future separation. No production behaviour
 * is exercised here (see waterRetentionResolver / waterRetentionValidation
 * tests for computation).
 */

import { describe, expect, it } from "vitest";
import {
	WATER_RETENTION_MODELS,
	listWaterRetentionModels,
	getDefaultWaterRetentionModel,
	DEFAULT_WATER_RETENTION_MODEL_ID,
} from "../waterRetention";
import type { WaterRetentionModelMetadata } from "../waterRetention";

const ALL = listWaterRetentionModels();

describe("water-retention registry — integrity", () => {
	it("registers all seven model IDs", () => {
		expect(ALL).toHaveLength(7);
		expect(Object.keys(WATER_RETENTION_MODELS).sort()).toEqual(
			[
				"BROOKS_COREY",
				"CAMPBELL",
				"CUSTOM_ORGANIZATION_MODEL",
				"LAB_MEASURED_CURVE",
				"ROSETTA_HYPRES_FUTURE",
				"SAXTON_RAWLS_2006",
				"VAN_GENUCHTEN",
			].sort()
		);
	});

	it("all model IDs are unique", () => {
		const ids = ALL.map((m) => m.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it("the registry key matches each model's own id", () => {
		for (const [key, meta] of Object.entries(WATER_RETENTION_MODELS)) {
			expect(meta.id).toBe(key);
		}
	});
});

describe("water-retention registry — default model", () => {
	it("SAXTON_RAWLS_2006 is the default id", () => {
		expect(DEFAULT_WATER_RETENTION_MODEL_ID).toBe("SAXTON_RAWLS_2006");
		expect(getDefaultWaterRetentionModel().id).toBe("SAXTON_RAWLS_2006");
	});

	it("exactly one model is ACTIVE_DEFAULT and it is SAXTON_RAWLS_2006", () => {
		const active = ALL.filter((m) => m.status === "ACTIVE_DEFAULT");
		expect(active).toHaveLength(1);
		expect(active[0]?.id).toBe("SAXTON_RAWLS_2006");
	});

	it("exactly one model has productionDefault === true", () => {
		const prod = ALL.filter((m) => m.productionDefault);
		expect(prod).toHaveLength(1);
		expect(prod[0]?.id).toBe("SAXTON_RAWLS_2006");
	});

	it("no alternative model is ACTIVE_DEFAULT or production default", () => {
		for (const m of ALL) {
			if (m.id === "SAXTON_RAWLS_2006") continue;
			expect(m.status).not.toBe("ACTIVE_DEFAULT");
			expect(m.productionDefault).toBe(false);
		}
	});
});

describe("water-retention registry — metadata completeness", () => {
	const requireNonEmpty = (m: WaterRetentionModelMetadata) => {
		expect(m.name.length).toBeGreaterThan(0);
		expect(m.reference.length).toBeGreaterThan(0);
		expect(Array.isArray(m.parameters)).toBe(true);
		expect(Array.isArray(m.outputs)).toBe(true);
		expect(Array.isArray(m.limitations)).toBe(true);
		expect(m.limitations.length).toBeGreaterThan(0);
	};

	it("every model has complete metadata", () => {
		for (const m of ALL) requireNonEmpty(m);
	});

	it("FUTURE models are not computable and declare no outputs", () => {
		for (const m of ALL) {
			if (m.status !== "FUTURE") continue;
			expect(m.computable).toBe(false);
			expect(m.outputs).toHaveLength(0);
		}
	});

	it("PARAMETER_REQUIRED models declare at least one required parameter", () => {
		for (const m of ALL) {
			if (m.status !== "PARAMETER_REQUIRED") continue;
			expect(m.parameters.some((p) => p.required)).toBe(true);
		}
	});

	it("ROSETTA_HYPRES_FUTURE and CUSTOM_ORGANIZATION_MODEL are FUTURE", () => {
		expect(WATER_RETENTION_MODELS.ROSETTA_HYPRES_FUTURE.status).toBe("FUTURE");
		expect(WATER_RETENTION_MODELS.CUSTOM_ORGANIZATION_MODEL.status).toBe("FUTURE");
	});
});
