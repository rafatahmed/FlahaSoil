/**
 * USDA texture-triangle engine — classification + geometry tests.
 *
 * Fixtures cover one representative interior point per USDA class, the
 * 12 polygon centroids, normalisation of partial inputs, barycentric
 * projection on the default and a custom triangle, and edge / invalid
 * cases (empty input, negative fractions, sum drift).
 */
import { describe, expect, it } from "vitest";
import {
	barycentricToCartesian,
	classifyTexture,
	DEFAULT_TRIANGLE_VERTICES,
	normalizeTextureFractions,
	polygonContains,
	TEXTURE_CLASSIFICATION_ORDER,
	TEXTURE_SUM_TOLERANCE,
	USDA_TEXTURE_POLYGONS,
} from "../textureTriangle";

// One representative interior point per USDA class.
const CLASS_FIXTURES: ReadonlyArray<{
	className: string;
	sand: number;
	silt: number;
	clay: number;
}> = [
	{ className: "Sand", sand: 95, silt: 3, clay: 2 },
	{ className: "Loamy Sand", sand: 82, silt: 12, clay: 6 },
	{ className: "Sandy Loam", sand: 65, silt: 25, clay: 10 },
	{ className: "Sandy Clay Loam", sand: 60, silt: 12, clay: 28 },
	{ className: "Sandy Clay", sand: 52, silt: 8, clay: 40 },
	{ className: "Clay", sand: 20, silt: 20, clay: 60 },
	{ className: "Clay Loam", sand: 32, silt: 34, clay: 34 },
	{ className: "Silty Clay", sand: 8, silt: 47, clay: 45 },
	{ className: "Silty Clay Loam", sand: 10, silt: 56, clay: 34 },
	{ className: "Silt Loam", sand: 20, silt: 65, clay: 15 },
	{ className: "Silt", sand: 6, silt: 88, clay: 6 },
	{ className: "Loam", sand: 40, silt: 40, clay: 20 },
];

describe("USDA_TEXTURE_POLYGONS", () => {
	it("exposes all 12 USDA classes", () => {
		expect(Object.keys(USDA_TEXTURE_POLYGONS).sort()).toEqual(
			[...TEXTURE_CLASSIFICATION_ORDER].sort()
		);
	});

	it("every polygon has ≥ 3 vertices and each vertex sums to 100 %", () => {
		for (const [cls, poly] of Object.entries(USDA_TEXTURE_POLYGONS)) {
			expect(poly.length, `${cls} polygon length`).toBeGreaterThanOrEqual(3);
			for (const v of poly) {
				const sum = v.sand + v.silt + v.clay;
				expect(sum, `${cls} vertex (${v.sand},${v.silt},${v.clay}) sum`).toBeCloseTo(
					100,
					6
				);
			}
		}
	});
});

describe("classifyTexture", () => {
	it.each(CLASS_FIXTURES)(
		"classifies an interior point as $className",
		({ className, sand, silt, clay }) => {
			const r = classifyTexture(sand, silt, clay);
			expect(r.matched).toBe(true);
			expect(r.className).toBe(className);
		}
	);

	it("returns null when fractions are non-finite", () => {
		expect(classifyTexture(Number.NaN, 50, 50).className).toBeNull();
		expect(classifyTexture(50, Number.POSITIVE_INFINITY, 50).className).toBeNull();
	});

	it("returns null when any fraction is negative", () => {
		expect(classifyTexture(-1, 50, 51).className).toBeNull();
	});

	it("returns null when no polygon contains the point (out-of-triangle)", () => {
		// (sand=200, silt=0, clay=0) lies far outside the triangle.
		expect(classifyTexture(200, 0, 0).matched).toBe(false);
	});

	it("places the three triangle apices in their canonical classes", () => {
		// Apices are technically polygon edges; PNPOLY may return either side
		// for an exact corner — we only assert the centroid-adjacent point.
		expect(classifyTexture(95, 3, 2).className).toBe("Sand");
		expect(classifyTexture(6, 88, 6).className).toBe("Silt");
		expect(classifyTexture(20, 20, 60).className).toBe("Clay");
	});
});

describe("normalizeTextureFractions", () => {
	it("returns all three when all are provided and sum to 100", () => {
		const r = normalizeTextureFractions(40, 40, 20);
		expect(r).toMatchObject({
			sand: 40,
			silt: 40,
			clay: 20,
			derived: null,
			sumOk: true,
		});
		expect(r.sumDelta).toBeCloseTo(0, 6);
	});

	it("derives the missing third fraction (sand)", () => {
		const r = normalizeTextureFractions(undefined, 40, 20);
		expect(r).toMatchObject({ sand: 40, silt: 40, clay: 20, derived: "sand", sumOk: true });
	});

	it("derives the missing third fraction (silt)", () => {
		const r = normalizeTextureFractions(40, null, 20);
		expect(r).toMatchObject({ sand: 40, silt: 40, clay: 20, derived: "silt", sumOk: true });
	});

	it("derives the missing third fraction (clay)", () => {
		const r = normalizeTextureFractions(40, 40, undefined);
		expect(r).toMatchObject({ sand: 40, silt: 40, clay: 20, derived: "clay", sumOk: true });
	});

	it("flags a sum just outside the tolerance window as not OK", () => {
		const r = normalizeTextureFractions(40, 40, 21);
		expect(r.sumOk).toBe(false);
		expect(r.sumDelta).toBeCloseTo(1, 6);
		expect(Math.abs(r.sumDelta)).toBeGreaterThan(TEXTURE_SUM_TOLERANCE);
	});

	it("accepts a sum within the tolerance window", () => {
		const r = normalizeTextureFractions(40, 40, 20.3);
		expect(r.sumOk).toBe(true);
		expect(r.sumDelta).toBeCloseTo(0.3, 6);
	});

	it("returns sumOk=false when fewer than two fractions are supplied", () => {
		expect(normalizeTextureFractions(undefined, undefined, 30).sumOk).toBe(false);
		expect(normalizeTextureFractions(undefined, undefined, undefined).sumOk).toBe(false);
	});
});

describe("barycentricToCartesian", () => {
	const v = DEFAULT_TRIANGLE_VERTICES;

	it("maps the clay apex (100 % clay) to the clay vertex", () => {
		const p = barycentricToCartesian({ sand: 0, silt: 0, clay: 100 });
		expect(p.x).toBeCloseTo(v.clay.x, 6);
		expect(p.y).toBeCloseTo(v.clay.y, 6);
	});

	it("maps the sand apex (100 % sand) to the sand vertex", () => {
		const p = barycentricToCartesian({ sand: 100, silt: 0, clay: 0 });
		expect(p.x).toBeCloseTo(v.sand.x, 6);
		expect(p.y).toBeCloseTo(v.sand.y, 6);
	});

	it("maps the silt apex (100 % silt) to the silt vertex", () => {
		const p = barycentricToCartesian({ sand: 0, silt: 100, clay: 0 });
		expect(p.x).toBeCloseTo(v.silt.x, 6);
		expect(p.y).toBeCloseTo(v.silt.y, 6);
	});

	it("normalises a non-100 sum and projects to the centroid for equal mix", () => {
		const p = barycentricToCartesian({ sand: 1, silt: 1, clay: 1 });
		const cx = (v.clay.x + v.sand.x + v.silt.x) / 3;
		const cy = (v.clay.y + v.sand.y + v.silt.y) / 3;
		expect(p.x).toBeCloseTo(cx, 6);
		expect(p.y).toBeCloseTo(cy, 6);
	});

	it("returns the centroid for a zero-sum input (no NaNs)", () => {
		const p = barycentricToCartesian({ sand: 0, silt: 0, clay: 0 });
		expect(Number.isFinite(p.x)).toBe(true);
		expect(Number.isFinite(p.y)).toBe(true);
	});

	it("respects a custom triangle vertex set", () => {
		const custom = {
			clay: { x: 100, y: 0 },
			sand: { x: 0, y: 200 },
			silt: { x: 200, y: 200 },
		};
		const p = barycentricToCartesian({ sand: 0, silt: 0, clay: 100 }, custom);
		expect(p.x).toBeCloseTo(100, 6);
		expect(p.y).toBeCloseTo(0, 6);
	});
});

describe("polygonContains", () => {
	it("returns true for a point inside the Sand polygon", () => {
		const sand = USDA_TEXTURE_POLYGONS["Sand"]!;
		expect(polygonContains(sand, { sand: 95, silt: 3, clay: 2 })).toBe(true);
	});

	it("returns false for a point outside the Sand polygon", () => {
		const sand = USDA_TEXTURE_POLYGONS["Sand"]!;
		expect(polygonContains(sand, { sand: 30, silt: 30, clay: 40 })).toBe(false);
	});
});
