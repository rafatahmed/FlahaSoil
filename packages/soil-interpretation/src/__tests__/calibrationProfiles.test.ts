/**
 * @flaha/soil-interpretation — calibration registry guard (Phase 10C-A).
 *
 * Protects the registry invariants: FLAHA_DEFAULT is the single ACTIVE
 * profile and is a complete metadata-only mirror of the live pipeline;
 * every alternative profile is metadata-only; ids and dates are sane.
 */

import { describe, expect, it } from "vitest";

import {
	CALIBRATION_PROFILE_IDS,
	CALIBRATION_PROFILES,
	FLAHA_DEFAULT,
	FLAHA_DEFAULT_METHODS,
} from "../calibration";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

describe("calibration registry — Phase 10C-A", () => {
	it("registers exactly the known profile ids", () => {
		expect(Object.keys(CALIBRATION_PROFILES).sort()).toEqual(
			[...CALIBRATION_PROFILE_IDS].sort()
		);
	});

	it("keys each profile by its own id", () => {
		for (const [key, profile] of Object.entries(CALIBRATION_PROFILES)) {
			expect(profile.id).toBe(key);
		}
	});

	it("has FLAHA_DEFAULT as the only ACTIVE profile", () => {
		const active = Object.values(CALIBRATION_PROFILES).filter(
			(p) => p.status === "ACTIVE"
		);
		expect(active).toHaveLength(1);
		expect(active[0]?.id).toBe("FLAHA_DEFAULT");
	});

	it("makes FLAHA_DEFAULT a FULL-scope baseline backed by the method audit", () => {
		expect(FLAHA_DEFAULT.status).toBe("ACTIVE");
		expect(FLAHA_DEFAULT.scope).toBe("FULL");
		expect(FLAHA_DEFAULT.methods).toBe(FLAHA_DEFAULT_METHODS);
		expect(FLAHA_DEFAULT.methods.length).toBeGreaterThan(0);
	});

	it("documents both calculation engines and the interpretation thresholds", () => {
		const keys = FLAHA_DEFAULT_METHODS.map((m) => m.key);
		// Calculation engines.
		expect(keys).toContain("soil_water_physics");
		expect(keys).toContain("soil_chemistry");
		// A representative spread of interpretation thresholds.
		expect(keys).toContain("ph_classification");
		expect(keys).toContain("salinity_severity");
		expect(keys).toContain("water_holding");
		expect(keys).toContain("texture_suitability");
	});

	it("uses unique method keys and a valid domain for every method", () => {
		const keys = FLAHA_DEFAULT_METHODS.map((m) => m.key);
		expect(new Set(keys).size).toBe(keys.length);
		const domains = new Set(["PHYSICS", "CHEMISTRY", "INTERPRETATION", "FULL"]);
		for (const method of FLAHA_DEFAULT_METHODS) {
			expect(domains.has(method.domain)).toBe(true);
			expect(method.source.length).toBeGreaterThan(0);
			expect(typeof method.peerReviewed).toBe("boolean");
		}
	});

	it("marks the FAO-29 severity methods as peer-reviewed", () => {
		const byKey = Object.fromEntries(
			FLAHA_DEFAULT_METHODS.map((m) => [m.key, m])
		);
		expect(byKey.salinity_severity?.peerReviewed).toBe(true);
		expect(byKey.sodicity_severity?.peerReviewed).toBe(true);
		expect(byKey.soil_water_physics?.peerReviewed).toBe(true);
		// House conventions remain flagged as not yet peer-reviewed.
		expect(byKey.ph_classification?.peerReviewed).toBe(false);
	});

	it("registers the full roadmap profile set", () => {
		expect(Object.keys(CALIBRATION_PROFILES).sort()).toEqual(
			[
				"ALBRECHT_BEAR",
				"CUSTOM_ORGANIZATION",
				"EUROFINS_STYLE",
				"FLAHA_DEFAULT",
				"MENA_ARID_REGION",
				"USDA_EXTENSION",
			].sort()
		);
	});

	it("keeps every alternative profile metadata-only (never ACTIVE)", () => {
		const alternatives = Object.values(CALIBRATION_PROFILES).filter(
			(p) => p.id !== "FLAHA_DEFAULT"
		);
		expect(alternatives.length).toBeGreaterThan(0);
		for (const profile of alternatives) {
			expect(profile.status).not.toBe("ACTIVE");
			expect(["REFERENCE_ONLY", "PROVISIONAL", "FUTURE", "DEPRECATED"]).toContain(
				profile.status
			);
		}
	});

	it("assigns the expected roadmap status to each alternative", () => {
		expect(CALIBRATION_PROFILES.USDA_EXTENSION.status).toBe("REFERENCE_ONLY");
		expect(CALIBRATION_PROFILES.ALBRECHT_BEAR.status).toBe("REFERENCE_ONLY");
		expect(CALIBRATION_PROFILES.EUROFINS_STYLE.status).toBe("REFERENCE_ONLY");
		expect(CALIBRATION_PROFILES.MENA_ARID_REGION.status).toBe("PROVISIONAL");
		expect(CALIBRATION_PROFILES.CUSTOM_ORGANIZATION.status).toBe("FUTURE");
	});

	it("includes at least one REFERENCE_ONLY, one PROVISIONAL and one FUTURE profile", () => {
		const statuses = Object.values(CALIBRATION_PROFILES).map((p) => p.status);
		expect(statuses).toContain("REFERENCE_ONLY");
		expect(statuses).toContain("PROVISIONAL");
		expect(statuses).toContain("FUTURE");
	});

	it("gives every profile a non-empty description and ISO dates", () => {
		for (const profile of Object.values(CALIBRATION_PROFILES)) {
			expect(profile.displayName.length).toBeGreaterThan(0);
			expect(profile.description.length).toBeGreaterThan(0);
			expect(profile.introducedDate).toMatch(ISO_DATE);
			expect(profile.lastReviewedDate).toMatch(ISO_DATE);
		}
	});
});
