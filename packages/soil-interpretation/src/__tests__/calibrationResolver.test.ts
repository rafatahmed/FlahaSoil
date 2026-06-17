/**
 * @flaha/soil-interpretation — calibration resolver guard (Phase 10C-A).
 *
 * Pins the resolver safety contract:
 *   - missing selection → FLAHA_DEFAULT
 *   - ACTIVE selection  → that profile
 *   - non-ACTIVE (metadata-only) selection → rejected
 *   - unknown selection → rejected
 */

import { describe, expect, it } from "vitest";

import {
	FLAHA_DEFAULT,
	getActiveCalibrationProfile,
	getCalibrationProfileMetadata,
	isCalibrationProfileActive,
	listCalibrationProfiles,
	resolveCalibrationProfile,
} from "../calibration";

describe("resolveCalibrationProfile — Phase 10C-A safety contract", () => {
	it("returns FLAHA_DEFAULT when no profile is selected", () => {
		expect(resolveCalibrationProfile()).toBe(FLAHA_DEFAULT);
		expect(resolveCalibrationProfile(undefined)).toBe(FLAHA_DEFAULT);
		expect(resolveCalibrationProfile(null)).toBe(FLAHA_DEFAULT);
		expect(resolveCalibrationProfile("")).toBe(FLAHA_DEFAULT);
	});

	it("resolves FLAHA_DEFAULT explicitly", () => {
		const profile = resolveCalibrationProfile("FLAHA_DEFAULT");
		expect(profile).toBe(FLAHA_DEFAULT);
		expect(profile.status).toBe("ACTIVE");
	});

	it("rejects a REFERENCE_ONLY (metadata-only) profile for engine use", () => {
		expect(() => resolveCalibrationProfile("USDA_EXTENSION")).toThrow(
			/metadata-only/
		);
		expect(() => resolveCalibrationProfile("ALBRECHT_BEAR")).toThrow(
			/metadata-only/
		);
		expect(() => resolveCalibrationProfile("EUROFINS_STYLE")).toThrow(
			/metadata-only/
		);
	});

	it("rejects a PROVISIONAL profile for engine use", () => {
		expect(() => resolveCalibrationProfile("MENA_ARID_REGION")).toThrow(
			/metadata-only/
		);
	});

	it("rejects a FUTURE profile for engine use", () => {
		expect(() => resolveCalibrationProfile("CUSTOM_ORGANIZATION")).toThrow(
			/metadata-only/
		);
	});

	it("rejects an unknown profile id", () => {
		expect(() => resolveCalibrationProfile("NONSENSE")).toThrow(
			/Unknown calibration profile/
		);
	});
});

describe("calibration resolver helpers", () => {
	it("getActiveCalibrationProfile always returns FLAHA_DEFAULT", () => {
		expect(getActiveCalibrationProfile()).toBe(FLAHA_DEFAULT);
	});

	it("isCalibrationProfileActive is true only for FLAHA_DEFAULT", () => {
		expect(isCalibrationProfileActive("FLAHA_DEFAULT")).toBe(true);
		expect(isCalibrationProfileActive("USDA_EXTENSION")).toBe(false);
		expect(isCalibrationProfileActive("MENA_ARID_REGION")).toBe(false);
		expect(isCalibrationProfileActive("CUSTOM_ORGANIZATION")).toBe(false);
		expect(isCalibrationProfileActive("NONSENSE")).toBe(false);
	});

	it("getCalibrationProfileMetadata reads any known profile regardless of status", () => {
		expect(getCalibrationProfileMetadata("USDA_EXTENSION").status).toBe(
			"REFERENCE_ONLY"
		);
		expect(getCalibrationProfileMetadata("MENA_ARID_REGION").status).toBe(
			"PROVISIONAL"
		);
		expect(getCalibrationProfileMetadata("CUSTOM_ORGANIZATION").status).toBe(
			"FUTURE"
		);
		expect(getCalibrationProfileMetadata("FLAHA_DEFAULT")).toBe(FLAHA_DEFAULT);
	});

	it("getCalibrationProfileMetadata throws on an unknown id", () => {
		expect(() => getCalibrationProfileMetadata("NONSENSE")).toThrow(
			/Unknown calibration profile/
		);
	});

	it("listCalibrationProfiles returns the full registry", () => {
		const all = listCalibrationProfiles();
		expect(all.length).toBeGreaterThanOrEqual(6);
		expect(all).toContain(FLAHA_DEFAULT);
	});
});
