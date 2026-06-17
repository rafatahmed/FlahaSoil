/**
 * FlahaSOIL v2 API — Phase 10A.8 canonical golden inputs.
 *
 * Three frozen raw soil-test inputs (PRELIMINARY / MODERATE / ADVANCED)
 * that drive the full regression pipeline:
 *
 *   calculateSoilTest (engines + persistence)
 *     → buildSoilTestReport (envelope)
 *       → composeProfessionalReport (ProfessionalReportDTO)
 *         → DefaultReportRenderer (HTML)
 *
 * Every input here is a STATIC SOURCE FIXTURE — never generated. The
 * three textures are DISTINCT and mirror the Phase 10A.7 canonical
 * integration runner (`scripts/canon_tests_10a7.ps1`) verbatim, so the
 * regression locks genuinely different soil regimes rather than one
 * shared sample:
 *
 *   - Test A PRELIMINARY  65 / 15 / 20, OM 1.5, pH 8.1, EC 6.0
 *   - Test B MODERATE     60 / 25 / 15, OM 2.5, pH 7.2, EC 1.0 (ref #001)
 *   - Test C ADVANCED     35 / 35 / 30, OM 1.8, BD 1.42, pH 8.3, EC 4.5
 *
 * Bulk density is supplied ONLY on the ADVANCED test so the
 * `bulkDensityTrace` contract is exercised across both the DEFAULT
 * (PRELIMINARY/MODERATE) and USER_INPUT (ADVANCED) paths.
 */
import { SoilTestLevel } from "@flaha/shared-types";

/** Single deterministic timestamp used for every row + cover field. */
export const GOLDEN_TS = "2026-06-03T00:00:00.000Z";

export interface GoldenSoilTest {
	id: string;
	level: SoilTestLevel;
	base: Record<string, unknown>;
	sample: Record<string, unknown>;
	project: Record<string, unknown>;
	user: Record<string, unknown>;
	textureInput: Record<string, unknown>;
	chemistryInput: Record<string, unknown> | null;
	meta: { reportNumber: string; reportTitle: string; reportDate: string };
}

// Shared cover rows — identical consultant/client/location across the
// three levels so the only varying axis is the lab panel + declared level.
const USER_ROW = {
	id: "u_1",
	email: "consultant@flahademo.test",
	displayName: "Dr. R. Khashan",
	role: "Soil scientist",
	createdAt: GOLDEN_TS,
	updatedAt: GOLDEN_TS,
};

function sampleRow(id: string): Record<string, unknown> {
	return {
		id,
		userId: "u_1",
		projectId: "p_1",
		locationName: "North paddock",
		latitude: 25.5,
		longitude: 51.5,
		depthFromCm: 0,
		depthToCm: 30,
		sampleCode: "S-001",
		sampleDate: GOLDEN_TS,
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	};
}

const PROJECT_ROW = {
	id: "p_1",
	userId: "u_1",
	name: "Doha Pilot",
	code: "DOHA",
	clientName: "Al Wakra Farms",
	status: "ACTIVE",
	createdAt: GOLDEN_TS,
	updatedAt: GOLDEN_TS,
};

function baseTest(
	id: string,
	level: SoilTestLevel,
	sampleId: string
): Record<string, unknown> {
	return {
		id,
		sampleId,
		testLevel: level,
		labName: "Doha Soil Lab",
		labReference: "DSL-001",
		testDate: GOLDEN_TS,
		notes: null,
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	};
}

// Each level supplies its OWN distinct texture (see canon_tests_10a7.ps1).
// `source` + `gravelPercent` default to LAB / 0 and may be overridden per
// test (the ADVANCED test carries gravel 5 and a USER_INPUT bulk density).
function textureInput(
	soilTestId: string,
	fields: Record<string, unknown>
): Record<string, unknown> {
	return {
		id: `tex_${soilTestId}`,
		soilTestId,
		gravelPercent: 0,
		source: "LAB",
		...fields,
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	};
}

function chemistryInput(
	soilTestId: string,
	fields: Record<string, unknown>
): Record<string, unknown> {
	return {
		id: `che_${soilTestId}`,
		soilTestId,
		source: "LAB",
		...fields,
		createdAt: GOLDEN_TS,
		updatedAt: GOLDEN_TS,
	};
}

// --- Test A — PRELIMINARY: 65/15/20 texture + saline pH/EC only -----------
// (chemistry engine skips — no CEC/cation panel). Mirrors canon Test A.
export const GOLDEN_PRELIMINARY: GoldenSoilTest = {
	id: "gst_preliminary",
	level: SoilTestLevel.PRELIMINARY,
	base: baseTest("gst_preliminary", SoilTestLevel.PRELIMINARY, "smp_pre"),
	sample: sampleRow("smp_pre"),
	project: PROJECT_ROW,
	user: USER_ROW,
	textureInput: textureInput("gst_preliminary", {
		sandPercent: 65,
		siltPercent: 15,
		clayPercent: 20,
		organicMatterPercent: 1.5,
	}),
	chemistryInput: chemistryInput("gst_preliminary", {
		pH: 8.1,
		ecDsM: 6.0,
		tdsMgL: 3840,
	}),
	meta: {
		reportNumber: "FLH-2026-A",
		reportTitle: "North paddock — PRELIMINARY report",
		reportDate: GOLDEN_TS,
	},
};

// --- Test B — MODERATE: 60/25/15 reference sample #001 + full cation panel -
// Canonical audit reference (Sand 60, Silt 25, Clay 15, OM 2.5, CEC 18).
export const GOLDEN_MODERATE: GoldenSoilTest = {
	id: "gst_moderate",
	level: SoilTestLevel.MODERATE,
	base: baseTest("gst_moderate", SoilTestLevel.MODERATE, "smp_mod"),
	sample: sampleRow("smp_mod"),
	project: PROJECT_ROW,
	user: USER_ROW,
	textureInput: textureInput("gst_moderate", {
		sandPercent: 60,
		siltPercent: 25,
		clayPercent: 15,
		organicMatterPercent: 2.5,
	}),
	chemistryInput: chemistryInput("gst_moderate", {
		pH: 7.2,
		ecDsM: 1.0,
		cec: 18,
		ca: 11,
		mg: 3,
		k: 0.6,
		na: 0.4,
		n: 30,
		p: 15,
		cl: 12,
	}),
	meta: {
		reportNumber: "FLH-2026-B",
		reportTitle: "North paddock — MODERATE report",
		reportDate: GOLDEN_TS,
	},
};

// --- Test C — ADVANCED: 35/35/30 full panel incl. micros, carbonates, ------
// SAR/ESP, gravel 5, plus a USER_INPUT bulk density (1.42) to lock the
// trace USER_INPUT path. Mirrors canon Test C.
export const GOLDEN_ADVANCED: GoldenSoilTest = {
	id: "gst_advanced",
	level: SoilTestLevel.ADVANCED,
	base: baseTest("gst_advanced", SoilTestLevel.ADVANCED, "smp_adv"),
	sample: sampleRow("smp_adv"),
	project: PROJECT_ROW,
	user: USER_ROW,
	textureInput: textureInput("gst_advanced", {
		sandPercent: 35,
		siltPercent: 35,
		clayPercent: 30,
		organicMatterPercent: 1.8,
		bulkDensity: 1.42,
		gravelPercent: 5,
	}),
	chemistryInput: chemistryInput("gst_advanced", {
		pH: 8.3,
		ecDsM: 4.5,
		tdsMgL: 2880,
		cec: 22,
		ca: 13,
		mg: 4,
		k: 0.7,
		na: 2.0,
		n: 20,
		p: 16,
		cl: 180,
		s: 15,
		fe: 6.5,
		mn: 3.2,
		zn: 0.8,
		cu: 0.6,
		b: 0.5,
		mo: 0.08,
		carbonate: 8,
		bicarbonate: 220,
		sar: 4.0,
		esp: 9.1,
	}),
	meta: {
		reportNumber: "FLH-2026-C",
		reportTitle: "North paddock — ADVANCED report",
		reportDate: GOLDEN_TS,
	},
};

/** The three canonical golden tests, in level order. */
export const GOLDEN_SOIL_TESTS: GoldenSoilTest[] = [
	GOLDEN_PRELIMINARY,
	GOLDEN_MODERATE,
	GOLDEN_ADVANCED,
];
