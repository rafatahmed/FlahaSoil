/**
 * FlahaSOIL v2 — coverage engine unit tests (Phase 10A.7 Correction).
 *
 * Exercises `computeScientificCoverage` against the three canonical
 * test-level scenarios required by the audit correction brief:
 *
 *   Category A — PRELIMINARY:   texture + pH/EC submitted.
 *   Category B — MODERATE:      texture + pH/EC + partial cation panel.
 *   Category C — ADVANCED:      full lab panel incl. micros, carbonates, SAR/ESP.
 *
 * Asserts the level-status roll-up, per-module status (Met / Partial /
 * Missing / NotRequired), alternate-group satisfaction (EC OR TDS), and
 * the `extraSubmittedFields` channel that surfaces over-collection.
 */
import { describe, expect, it } from "vitest";

import {
	computeScientificCoverage,
	SoilTestLevel,
} from "@flaha/shared-types";

const PRELIM_TEXTURE = {
	sandPercent: 60,
	siltPercent: 25,
	clayPercent: 15,
	organicMatterPercent: 2.5,
};

const PRELIM_CHEMISTRY = { pH: 7.2, ecDsM: 1.0 };

const MODERATE_CHEMISTRY = {
	...PRELIM_CHEMISTRY,
	ca: 11,
	mg: 3,
	k: 0.6,
	na: 0.4,
	cec: 18,
	n: 25,
	p: 18,
};

const ADVANCED_CHEMISTRY = {
	...MODERATE_CHEMISTRY,
	cl: 12,
	fe: 4.5,
	mn: 1.1,
	zn: 0.8,
	cu: 0.3,
	b: 0.7,
	carbonate: 0,
	bicarbonate: 4.2,
	sar: 0.6,
	esp: 2.0,
};

describe("computeScientificCoverage — Category A (PRELIMINARY)", () => {
	it("reports Met for texture + pH/EC and NotRequired for moderate/advanced modules", () => {
		const coverage = computeScientificCoverage(SoilTestLevel.PRELIMINARY, {
			texture: PRELIM_TEXTURE,
			chemistry: PRELIM_CHEMISTRY,
		});

		expect(coverage.level.declaredLevel).toBe(SoilTestLevel.PRELIMINARY);
		expect(coverage.level.status).toBe("Met");
		expect(coverage.level.coveragePercent).toBe(100);
		expect(coverage.level.statement).toMatch(/PRELIMINARY/);

		const byId = Object.fromEntries(coverage.modules.map((m) => [m.id, m]));
		expect(byId["texture"]!.status).toBe("Met");
		expect(byId["basicChemistry"]!.status).toBe("Met");
		expect(byId["cations"]!.status).toBe("NotRequired");
		expect(byId["macroNutrients"]!.status).toBe("NotRequired");
		expect(byId["micronutrients"]!.status).toBe("NotRequired");
	});

	it("treats TDS alone as satisfying the EC/TDS alternate group", () => {
		const coverage = computeScientificCoverage(SoilTestLevel.PRELIMINARY, {
			texture: PRELIM_TEXTURE,
			chemistry: { pH: 7.2, tdsMgL: 640 },
		});
		const basic = coverage.modules.find((m) => m.id === "basicChemistry")!;
		expect(basic.status).toBe("Met");
		expect(basic.missingExpectedFields).toEqual([]);
	});

	it("marks Missing when no chemistry inputs are submitted", () => {
		const coverage = computeScientificCoverage(SoilTestLevel.PRELIMINARY, {
			texture: PRELIM_TEXTURE,
			chemistry: null,
		});
		const basic = coverage.modules.find((m) => m.id === "basicChemistry")!;
		expect(basic.status).toBe("Missing");
		expect(basic.missingExpectedFields).toContain("pH");
		expect(basic.missingExpectedFields).toContain("salinity");
		expect(coverage.level.status).toBe("Partial");
	});

	it("credits extras when an ADVANCED panel arrives on a PRELIMINARY contract", () => {
		const coverage = computeScientificCoverage(SoilTestLevel.PRELIMINARY, {
			texture: PRELIM_TEXTURE,
			chemistry: ADVANCED_CHEMISTRY,
		});
		expect(coverage.level.status).toBe("Met");
		const cations = coverage.modules.find((m) => m.id === "cations")!;
		expect(cations.status).toBe("NotRequired");
		expect(cations.extraSubmittedFields).toEqual(
			expect.arrayContaining(["Ca", "Mg", "K", "Na", "CEC"])
		);
		expect(cations.missingExpectedFields).toEqual([]);
	});
});

describe("computeScientificCoverage — Category B (MODERATE)", () => {
	it("reports Met for full PRELIM+MODERATE panel and NotRequired for ADVANCED modules", () => {
		const coverage = computeScientificCoverage(SoilTestLevel.MODERATE, {
			texture: PRELIM_TEXTURE,
			chemistry: { ...MODERATE_CHEMISTRY, cl: 12 },
		});
		expect(coverage.level.status).toBe("Met");
		expect(coverage.level.coveragePercent).toBe(100);
		const byId = Object.fromEntries(coverage.modules.map((m) => [m.id, m]));
		expect(byId["cations"]!.status).toBe("Met");
		expect(byId["macroNutrients"]!.status).toBe("Met");
		expect(byId["micronutrients"]!.status).toBe("NotRequired");
		expect(byId["sodicity"]!.status).toBe("NotRequired");
	});

	it("reports Partial when the cation panel is incomplete", () => {
		const coverage = computeScientificCoverage(SoilTestLevel.MODERATE, {
			texture: PRELIM_TEXTURE,
			chemistry: { ...PRELIM_CHEMISTRY, ca: 11, mg: 3, k: 0.6 },
		});
		expect(coverage.level.status).toBe("Partial");
		const cations = coverage.modules.find((m) => m.id === "cations")!;
		expect(cations.status).toBe("Partial");
		expect(cations.submittedFields).toEqual(
			expect.arrayContaining(["Ca", "Mg", "K"])
		);
		expect(cations.missingExpectedFields).toEqual(
			expect.arrayContaining(["Na", "CEC"])
		);
		expect(coverage.level.partialModules).toContain("cations");
	});
});

describe("computeScientificCoverage — Category C (ADVANCED)", () => {
	it("reports Met across every required module when the full ADVANCED panel is present", () => {
		const coverage = computeScientificCoverage(SoilTestLevel.ADVANCED, {
			texture: { ...PRELIM_TEXTURE, bulkDensity: 1.4, gravelPercent: 0 },
			chemistry: ADVANCED_CHEMISTRY,
		});
		expect(coverage.level.status).toBe("Met");
		expect(coverage.level.coveragePercent).toBe(100);
		const byId = Object.fromEntries(coverage.modules.map((m) => [m.id, m]));
		expect(byId["micronutrients"]!.status).toBe("Met");
		expect(byId["carbonates"]!.status).toBe("Met");
		expect(byId["sodicity"]!.status).toBe("Met");
		expect(coverage.level.missingModules).toEqual([]);
	});

	it("flags Partial when sodicity indicators are missing on ADVANCED", () => {
		const coverage = computeScientificCoverage(SoilTestLevel.ADVANCED, {
			texture: PRELIM_TEXTURE,
			chemistry: { ...ADVANCED_CHEMISTRY, sar: null, esp: null },
		});
		expect(coverage.level.status).toBe("Partial");
		const sodicity = coverage.modules.find((m) => m.id === "sodicity")!;
		expect(sodicity.status).toBe("Missing");
		expect(sodicity.missingExpectedFields).toEqual(
			expect.arrayContaining(["SAR", "ESP"])
		);
	});
});
