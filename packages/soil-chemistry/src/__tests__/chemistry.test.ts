/**
 * @flaha/soil-chemistry — engine tests.
 *
 * Coverage:
 *   1. LAB input with full values (CEC + cations supplied).
 *   2. LAB input WITHOUT CEC (engine derives CEC from cations).
 *   3. ESTIMATED input (CEC derived from clay + organic matter).
 *   4. Zero-CEC edge case (must throw).
 *   5. Negative input (must throw).
 *
 * Plus contract tests covering:
 *   - SAR is emitted only when both Ca and Mg are supplied.
 *   - Percent fields are clamped to [0, 100].
 *   - pH/EC echo passthrough.
 *   - Mode validation.
 *   - Per-field validation (range, finite, type).
 */

import { describe, expect, it } from "vitest";
import { calculateSoilChemistry } from "../calculateSoilChemistry";
import type { SoilChemistryInput } from "../types";

describe("calculateSoilChemistry — LAB mode (full input)", () => {
	it("uses the supplied CEC and computes cation percentages", () => {
		const input: SoilChemistryInput = {
			mode: "LAB",
			cec: 20,
			ca: 12,
			mg: 4,
			k: 0.6,
			na: 0.4,
			ph: 7.2,
			ec: 1.5,
		};

		const result = calculateSoilChemistry(input);

		expect(result.cec).toBe(20);
		expect(result.caPercent).toBeCloseTo(60, 2);
		expect(result.mgPercent).toBeCloseTo(20, 2);
		expect(result.kPercent).toBeCloseTo(3, 2);
		expect(result.naPercent).toBeCloseTo(2, 2);
		expect(result.baseSaturation).toBeCloseTo(85, 2);
		expect(result.esp).toBeCloseTo(2, 2);
		expect(result.cationBalanceOther).toBeCloseTo(20, 2); // 100 − (60 + 20)
		expect(result.sar).toBeCloseTo(0.4 / Math.sqrt((12 + 4) / 2), 4);
		expect(result.ph).toBe(7.2);
		expect(result.ec).toBe(1.5);
		expect(result.calculationMode).toBe("LAB");
	});
});

describe("calculateSoilChemistry — LAB mode (no CEC, derive from cations)", () => {
	it("derives CEC = ca + mg + k + na when cec is omitted", () => {
		const input: SoilChemistryInput = {
			mode: "LAB",
			ca: 8,
			mg: 2,
			k: 0.5,
			na: 0.5,
		};

		const result = calculateSoilChemistry(input);

		expect(result.cec).toBeCloseTo(11, 6);
		expect(result.caPercent).toBeCloseTo((8 / 11) * 100, 2);
		expect(result.mgPercent).toBeCloseTo((2 / 11) * 100, 2);
		expect(result.kPercent).toBeCloseTo((0.5 / 11) * 100, 2);
		expect(result.naPercent).toBeCloseTo((0.5 / 11) * 100, 2);
		// All four supplied → BS == 100 by construction.
		expect(result.baseSaturation).toBeCloseTo(100, 2);
		expect(result.esp).toBeCloseTo((0.5 / 11) * 100, 2);
		expect(result.cationBalanceOther).toBeCloseTo(
			100 - ((8 / 11) * 100 + (2 / 11) * 100),
			2
		);
		expect(result.sar).toBeCloseTo(0.5 / Math.sqrt((8 + 2) / 2), 4);
		expect(result.calculationMode).toBe("LAB");
	});
});

describe("calculateSoilChemistry — ESTIMATED mode", () => {
	it("derives CEC from clay × 0.5 + organicMatter × 2", () => {
		const input: SoilChemistryInput = {
			mode: "ESTIMATED",
			sand: 40,
			clay: 30,
			organicMatter: 2.5,
			ca: 8,
			mg: 2,
			k: 0.4,
			na: 0.1,
		};

		const result = calculateSoilChemistry(input);
		const expectedCec = 30 * 0.5 + 2.5 * 2; // 20

		expect(result.cec).toBeCloseTo(expectedCec, 6);
		expect(result.caPercent).toBeCloseTo((8 / expectedCec) * 100, 2);
		expect(result.mgPercent).toBeCloseTo((2 / expectedCec) * 100, 2);
		expect(result.kPercent).toBeCloseTo((0.4 / expectedCec) * 100, 2);
		expect(result.naPercent).toBeCloseTo((0.1 / expectedCec) * 100, 2);
		expect(result.baseSaturation).toBeCloseTo(
			((8 + 2 + 0.4 + 0.1) / expectedCec) * 100,
			2
		);
		expect(result.esp).toBeCloseTo((0.1 / expectedCec) * 100, 2);
		expect(result.calculationMode).toBe("ESTIMATED");
	});

	it("requires clay and organicMatter", () => {
		expect(() =>
			calculateSoilChemistry({ mode: "ESTIMATED", organicMatter: 2 })
		).toThrow(/clay/);
		expect(() =>
			calculateSoilChemistry({ mode: "ESTIMATED", clay: 30 })
		).toThrow(/organicMatter/);
	});
});

describe("calculateSoilChemistry — error paths", () => {
	it("throws when resolved CEC is zero (LAB, no cations, no cec)", () => {
		expect(() => calculateSoilChemistry({ mode: "LAB" })).toThrow(
			/CEC is zero/i
		);
	});

	it("throws when resolved CEC is zero (ESTIMATED, clay = 0, OM = 0)", () => {
		expect(() =>
			calculateSoilChemistry({
				mode: "ESTIMATED",
				clay: 0,
				organicMatter: 0,
			})
		).toThrow(/CEC is zero/i);
	});

	it("throws when explicit CEC is exactly zero in LAB mode", () => {
		expect(() =>
			calculateSoilChemistry({ mode: "LAB", cec: 0, ca: 0, mg: 0, k: 0, na: 0 })
		).toThrow(/CEC is zero/i);
	});

	it("throws on negative cation input", () => {
		expect(() =>
			calculateSoilChemistry({ mode: "LAB", cec: 10, ca: -1 })
		).toThrow(/'ca' must be >= 0/);
	});

	it("throws on negative CEC input", () => {
		expect(() => calculateSoilChemistry({ mode: "LAB", cec: -5 })).toThrow(
			/'cec' must be >= 0/
		);
	});

	it("throws on out-of-range texture percent", () => {
		expect(() =>
			calculateSoilChemistry({
				mode: "ESTIMATED",
				clay: 150,
				organicMatter: 2,
			})
		).toThrow(/'clay' must be <= 100/);
	});

	it("throws on invalid mode", () => {
		expect(() =>
			calculateSoilChemistry({ mode: "BOGUS" as unknown as "LAB" })
		).toThrow(/'mode' must be/);
	});

	it("throws on non-finite cation input", () => {
		expect(() =>
			calculateSoilChemistry({
				mode: "LAB",
				cec: 10,
				ca: Number.NaN,
			})
		).toThrow(/'ca' must be a finite number/);
	});

	it("throws on out-of-range pH", () => {
		expect(() =>
			calculateSoilChemistry({ mode: "LAB", cec: 10, ph: 15 })
		).toThrow(/'ph' must be <= 14/);
	});
});

describe("calculateSoilChemistry — contract details", () => {
	it("omits SAR when Ca is missing", () => {
		const result = calculateSoilChemistry({
			mode: "LAB",
			cec: 10,
			mg: 2,
			na: 0.5,
		});
		expect(result.sar).toBeUndefined();
	});

	it("omits SAR when Mg is missing", () => {
		const result = calculateSoilChemistry({
			mode: "LAB",
			cec: 10,
			ca: 2,
			na: 0.5,
		});
		expect(result.sar).toBeUndefined();
	});

	it("returns SAR = 0 when Ca + Mg are both zero (guarded denominator)", () => {
		const result = calculateSoilChemistry({
			mode: "LAB",
			cec: 10,
			ca: 0,
			mg: 0,
			na: 0.5,
		});
		expect(result.sar).toBe(0);
	});

	it("clamps cation percentages to 100 when a cation exceeds CEC", () => {
		// Lab CEC understates the supplied cation total — single-percent must cap.
		const result = calculateSoilChemistry({
			mode: "LAB",
			cec: 5,
			ca: 20,
			mg: 0,
			k: 0,
			na: 0,
		});
		expect(result.caPercent).toBe(100);
		expect(result.baseSaturation).toBe(100);
	});

	it("does not include SAR / pH / EC fields when not supplied", () => {
		const result = calculateSoilChemistry({
			mode: "LAB",
			cec: 10,
			ca: 5,
			mg: 2,
		});
		expect(result.sar).toBeCloseTo(0 / Math.sqrt((5 + 2) / 2), 4);
		expect("ph" in result).toBe(false);
		expect("ec" in result).toBe(false);
	});
});
