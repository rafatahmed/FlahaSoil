/**
 * FlahaSOIL v2 API — salinity input normalization tests.
 *
 * Pure unit tests for `normalizeSalinity`. Verify the four input
 * shapes documented on the helper plus the >20 % EC/TDS consistency
 * warning. No Prisma, no engine imports.
 */
import { describe, expect, it } from "vitest";

import {
	SALINITY_INCONSISTENCY_WARNING,
	TDS_PER_DSM,
	normalizeSalinity,
} from "../salinityNormalization";

describe("normalizeSalinity — EC only", () => {
	it("uses the supplied ecDsM verbatim and emits no warnings", () => {
		const result = normalizeSalinity({ ecDsM: 1.5 });
		expect(result.ecDsM).toBe(1.5);
		expect(result.tdsMgL).toBeUndefined();
		expect(result.derivedFromTds).toBe(false);
		expect(result.warnings).toEqual([]);
	});

	it("accepts ecDsM=0 as a valid (non-saline) measurement", () => {
		const result = normalizeSalinity({ ecDsM: 0 });
		expect(result.ecDsM).toBe(0);
		expect(result.derivedFromTds).toBe(false);
		expect(result.warnings).toEqual([]);
	});
});

describe("normalizeSalinity — TDS only", () => {
	it("derives ecDsM = tdsMgL / 640 and flags derivation", () => {
		const result = normalizeSalinity({ tdsMgL: 1280 });
		expect(result.ecDsM).toBeCloseTo(2.0, 10);
		expect(result.tdsMgL).toBe(1280);
		expect(result.derivedFromTds).toBe(true);
		expect(result.warnings).toEqual([]);
	});

	it("uses the documented TDS_PER_DSM = 640 conversion factor", () => {
		const result = normalizeSalinity({ tdsMgL: TDS_PER_DSM });
		expect(result.ecDsM).toBe(1);
	});
});

describe("normalizeSalinity — EC + inconsistent TDS", () => {
	it("warns when supplied TDS is more than 20 % off the EC-predicted TDS", () => {
		// EC=1.0 → expectedTDS=640. Supply 1000 mg/L → relative diff
		// against max(1000, 640) = 1000 is 360/1000 = 36 %, > 20 %.
		const result = normalizeSalinity({ ecDsM: 1.0, tdsMgL: 1000 });
		expect(result.ecDsM).toBe(1.0);
		expect(result.tdsMgL).toBe(1000);
		expect(result.derivedFromTds).toBe(false);
		expect(result.warnings).toContain(SALINITY_INCONSISTENCY_WARNING);
	});

	it("does not warn when supplied TDS is within the 20 % tolerance", () => {
		// EC=1.0 → expectedTDS=640. Supply 700 mg/L → diff against
		// max(700, 640) = 700 is 60/700 ≈ 8.6 %, well under 20 %.
		const result = normalizeSalinity({ ecDsM: 1.0, tdsMgL: 700 });
		expect(result.warnings).toEqual([]);
	});

	it("treats EC=0 with TDS>0 as inconsistent (well above tolerance)", () => {
		const result = normalizeSalinity({ ecDsM: 0, tdsMgL: 500 });
		expect(result.ecDsM).toBe(0);
		expect(result.warnings).toContain(SALINITY_INCONSISTENCY_WARNING);
	});
});

describe("normalizeSalinity — empty / malformed input", () => {
	it("returns no EC and no warnings when both fields are absent", () => {
		const result = normalizeSalinity({});
		expect(result.ecDsM).toBeUndefined();
		expect(result.tdsMgL).toBeUndefined();
		expect(result.derivedFromTds).toBe(false);
		expect(result.warnings).toEqual([]);
	});

	it("ignores null / undefined / non-finite / negative values", () => {
		const result = normalizeSalinity({
			ecDsM: Number.NaN,
			tdsMgL: -10,
		});
		expect(result.ecDsM).toBeUndefined();
		expect(result.tdsMgL).toBeUndefined();
		expect(result.warnings).toEqual([]);
	});

	it("returns the empty shape when input itself is null/undefined", () => {
		expect(normalizeSalinity(null).ecDsM).toBeUndefined();
		expect(normalizeSalinity(undefined).warnings).toEqual([]);
	});
});
