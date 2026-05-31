/**
 * FlahaSOIL v2 API — validation schema tests.
 *
 * Mirrors the request-shape rules from `docs/v2-api-contracts.md` §4
 * (texture sum tolerance, test-level required fields). No database is
 * touched; the schemas are pure functions over JSON.
 */

import { SoilTestLevel, SoilValueSource } from "@flaha/shared-types";
import { describe, expect, it } from "vitest";

import {
	createSoilSampleSchema,
	createSoilTestSchema,
} from "../schemas";

describe("createSoilSampleSchema", () => {
	// Phase 8B: `userId` is no longer part of the request body — the
	// owning user is resolved server-side from the dev-session
	// middleware. The schema only validates the client-supplied fields.
	it("accepts a minimal valid payload", () => {
		const result = createSoilSampleSchema.safeParse({
			projectId: "p_1",
		});
		expect(result.success).toBe(true);
	});

	it("rejects a missing projectId (Phase 8A — required)", () => {
		const result = createSoilSampleSchema.safeParse({});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issue = result.error.issues.find(
				(i) => i.path.join(".") === "projectId"
			);
			expect(issue).toBeDefined();
		}
	});

	it("rejects depthToCm < depthFromCm", () => {
		const result = createSoilSampleSchema.safeParse({
			projectId: "p_1",
			depthFromCm: 30,
			depthToCm: 10,
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const issue = result.error.issues.find(
				(i) => i.path.join(".") === "depthToCm"
			);
			expect(issue).toBeDefined();
		}
	});

	it("rejects an out-of-range latitude", () => {
		const result = createSoilSampleSchema.safeParse({
			projectId: "p_1",
			latitude: 95,
		});
		expect(result.success).toBe(false);
	});
});

describe("createSoilTestSchema — texture sum rule", () => {
	const validPreliminary = {
		sampleId: "s_1",
		testLevel: SoilTestLevel.PRELIMINARY,
		textureInput: {
			sandPercent: 40,
			siltPercent: 40,
			clayPercent: 20,
			organicMatterPercent: 2.5,
			source: SoilValueSource.LAB,
		},
		chemistryInput: {
			pH: 6.8,
			source: SoilValueSource.LAB,
		},
	};

	it("accepts sand+silt+clay = 100 exactly", () => {
		const result = createSoilTestSchema.safeParse(validPreliminary);
		expect(result.success).toBe(true);
	});

	it("accepts sand+silt+clay within ±0.5 tolerance", () => {
		const payload = {
			...validPreliminary,
			textureInput: {
				...validPreliminary.textureInput,
				sandPercent: 40.3,
				siltPercent: 40.0,
				clayPercent: 20.0, // sum = 100.3 → within 0.5
			},
		};
		expect(createSoilTestSchema.safeParse(payload).success).toBe(true);
	});

	it("rejects sand+silt+clay outside ±0.5 tolerance", () => {
		const payload = {
			...validPreliminary,
			textureInput: {
				...validPreliminary.textureInput,
				sandPercent: 50,
				siltPercent: 40,
				clayPercent: 20, // sum = 110
			},
		};
		const result = createSoilTestSchema.safeParse(payload);
		expect(result.success).toBe(false);
		if (!result.success) {
			expect(
				result.error.issues.some((i) =>
					i.message.includes("sand + silt + clay must equal 100")
				)
			).toBe(true);
		}
	});
});

describe("createSoilTestSchema — test-level requirements", () => {
	const baseTexture = {
		sandPercent: 40,
		siltPercent: 40,
		clayPercent: 20,
		organicMatterPercent: 2.5,
		source: SoilValueSource.LAB,
	};

	it("PRELIMINARY rejects missing chemistry pH/EC/TDS", () => {
		const result = createSoilTestSchema.safeParse({
			sampleId: "s_1",
			testLevel: SoilTestLevel.PRELIMINARY,
			textureInput: baseTexture,
		});
		expect(result.success).toBe(false);
	});

	it("MODERATE rejects missing required cation/N/P fields", () => {
		const result = createSoilTestSchema.safeParse({
			sampleId: "s_1",
			testLevel: SoilTestLevel.MODERATE,
			textureInput: baseTexture,
			chemistryInput: {
				pH: 6.8,
				source: SoilValueSource.LAB,
			},
		});
		expect(result.success).toBe(false);
		if (!result.success) {
			const missingFields = result.error.issues
				.filter((i) => i.path[0] === "chemistryInput")
				.map((i) => i.path[1]);
			for (const f of ["ca", "mg", "k", "na", "n", "p"]) {
				expect(missingFields).toContain(f);
			}
		}
	});

	it("MODERATE accepts a payload with the full cation + N/P panel", () => {
		const result = createSoilTestSchema.safeParse({
			sampleId: "s_1",
			testLevel: SoilTestLevel.MODERATE,
			textureInput: baseTexture,
			chemistryInput: {
				pH: 7.2,
				ecDsM: 1.0,
				cec: 18,
				ca: 11,
				mg: 3,
				k: 0.6,
				na: 0.4,
				n: 25,
				p: 18,
				source: SoilValueSource.LAB,
			},
		});
		expect(result.success).toBe(true);
	});
});
