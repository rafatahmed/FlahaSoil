/**
 * FlahaSOIL v2 API — Phase 10B Scientific Matrix Fixtures.
 *
 * Provides a comprehensive set of soil-test inputs covering physics extremes,
 * salinity/sodicity combinations, CEC source modes, and missing-data edges.
 *
 * These are used by scientificMatrixAudit.test.ts to verify that the
 * Phase 10A.7 engines and reporting contracts are stable across the full
 * scientific matrix.
 */
import { SoilTestLevel } from "@flaha/shared-types";

export interface MatrixSoilTest {
	id: string;
	level: SoilTestLevel;
	texture: Record<string, unknown>;
	chemistry: Record<string, unknown> | null;
	label: string;
}

/** Helper to wrap matrix inputs into the full DTO/Row shape expected by runGoldenPipeline. */
export function createMatrixTest(
	id: string,
	level: SoilTestLevel,
	texture: Record<string, unknown>,
	chemistry: Record<string, unknown> | null,
	label: string
): MatrixSoilTest {
	return { id, level, texture, chemistry, label };
}

// --- Category A: Texture / Physics -------------------------------------------

export const MATRIX_PHYSICS = {
	A1_VERY_SANDY: createMatrixTest(
		"mx_a1",
		SoilTestLevel.MODERATE,
		{ sandPercent: 92, siltPercent: 5, clayPercent: 3, organicMatterPercent: 0.5 },
		{ pH: 7.0, ecDsM: 0.2 },
		"Very sandy / Low OM"
	),
	A4_CLAY_LOAM_USER_BD: createMatrixTest(
		"mx_a4",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 35, siltPercent: 35, clayPercent: 30, organicMatterPercent: 1.2, bulkDensity: 1.55 },
		{ pH: 8.0, ecDsM: 1.2 },
		"Clay loam / High User BD"
	),
	A5_HEAVY_CLAY: createMatrixTest(
		"mx_a5",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 10, siltPercent: 20, clayPercent: 70, organicMatterPercent: 1.0, bulkDensity: 1.60 },
		{ pH: 8.2, ecDsM: 2.5 },
		"Heavy Clay / Extreme BD"
	),
};

// --- Category B: Salinity / Sodicity -----------------------------------------

export const MATRIX_SALINITY_SODICITY = {
	B2_SALINE_NOT_SODIC: createMatrixTest(
		"mx_b2",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 60, siltPercent: 25, clayPercent: 15, organicMatterPercent: 2.0 },
		{ pH: 8.1, ecDsM: 8.5, cec: 15, ca: 8, mg: 4, k: 0.5, na: 0.2 },
		"Saline (8.5) / Non-sodic"
	),
	B3_SODIC_NOT_SALINE: createMatrixTest(
		"mx_b3",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 60, siltPercent: 25, clayPercent: 15, organicMatterPercent: 2.0 },
		{ pH: 8.8, ecDsM: 0.8, cec: 15, ca: 6, mg: 2, k: 0.5, na: 6.0 },
		"Non-saline / Highly Sodic (Na=6)"
	),
	B4_SALINE_SODIC: createMatrixTest(
		"mx_b4",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 60, siltPercent: 25, clayPercent: 15, organicMatterPercent: 2.0 },
		{ pH: 8.4, ecDsM: 12.0, cec: 15, ca: 5, mg: 2, k: 0.5, na: 7.0 },
		"Saline (12.0) / Sodic (Na=7)"
	),
};

// --- Category C: CEC / Cations -----------------------------------------------

export const MATRIX_CEC_CATIONS = {
	C2_DERIVED_CEC: createMatrixTest(
		"mx_c2",
		SoilTestLevel.MODERATE,
		{ sandPercent: 60, siltPercent: 25, clayPercent: 15, organicMatterPercent: 2.0 },
		{ pH: 7.0, ecDsM: 0.5, ca: 10, mg: 4, k: 1, na: 0.5 }, // cec missing -> derived
		"Derived CEC (Sum of cations)"
	),
	C3_ESTIMATED_CEC: createMatrixTest(
		"mx_c3",
		SoilTestLevel.MODERATE,
		{ sandPercent: 10, siltPercent: 20, clayPercent: 70, organicMatterPercent: 5.0 },
		{ pH: 7.5, ecDsM: 1.0 }, // no cations -> estimated (if engines allow)
		"Estimated CEC (Texture/OM coefficients)"
	),
	C5_CATION_SURPLUS: createMatrixTest(
		"mx_c5",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 60, siltPercent: 25, clayPercent: 15, organicMatterPercent: 2.0 },
		{ pH: 8.2, ecDsM: 10.0, cec: 12, ca: 10, mg: 5, k: 1, na: 2 }, // sum (18) > cec (12)
		"Cation Surplus (Sum > CEC)"
	),
	C6_MISSING_CEC: createMatrixTest(
		"mx_c6",
		SoilTestLevel.BASIC,
		{ sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0 },
		{ pH: 6.5, ecDsM: 1.0 }, // No cations, no lab cec, BASIC level
		"Missing CEC / Preliminary only"
	),
};

// --- Category D: pH Propagation ----------------------------------------------
//
// Direct proof that a supplied pH flows end-to-end:
//   chemistry input → chemistry engine → interpretation → DTO → HTML.
// Each fixture supplies EC + CEC + the full Ca/Mg/K/Na cation panel so the
// chemistry engine runs in LAB mode (cecSource = LAB) and the interpretation
// receives `chemistry.ph`. D4 omits pH to prove the inverse: no pH in →
// no pH category out, and the chemistry pH cell renders as missing.

export const MATRIX_PH_PROPAGATION = {
	D1_ACIDIC_PH: createMatrixTest(
		"mx_d1",
		SoilTestLevel.MODERATE,
		{ sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0 },
		{ pH: 5.2, ecDsM: 0.8, cec: 12, ca: 6, mg: 2, k: 0.4, na: 0.2 },
		"Acidic pH 5.2 + full cation panel"
	),
	D2_NEUTRAL_PH: createMatrixTest(
		"mx_d2",
		SoilTestLevel.MODERATE,
		{ sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0 },
		{ pH: 7.0, ecDsM: 1.0, cec: 18, ca: 11, mg: 3, k: 0.6, na: 0.3 },
		"Neutral pH 7.0 + full cation panel"
	),
	D3_ALKALINE_PH: createMatrixTest(
		"mx_d3",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0 },
		{ pH: 8.3, ecDsM: 1.5, cec: 20, ca: 13, mg: 4, k: 0.7, na: 0.5 },
		"Alkaline pH 8.3 + full cation panel"
	),
	D4_MISSING_PH: createMatrixTest(
		"mx_d4",
		SoilTestLevel.MODERATE,
		{ sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0 },
		{ ecDsM: 1.0, cec: 15, ca: 9, mg: 3, k: 0.5, na: 0.3 }, // pH omitted
		"Missing pH + full cation panel"
	),
	D5_VERY_ALKALINE_CARB: createMatrixTest(
		"mx_d5",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0 },
		{
			pH: 9.2,
			ecDsM: 2.5,
			cec: 25,
			ca: 15,
			mg: 5,
			k: 0.8,
			na: 3.5,
			carbonate: 150,
			bicarbonate: 320,
		},
		"Highly Alkaline (9.2) + Carbonate/Bicarbonate"
	),
};

// --- Category E: Nutrients / Micronutrients ----------------------------------
//
// Verifies mapping and display of macro-nutrients (N, P, Cl),
// plant-available K (kMgKg), and micronutrients.
// Note: heavyMetalsJson is preserved in the appendix but not interpreted.

export const MATRIX_NUTRIENTS = {
	E1_COMPLETE_MACROS: createMatrixTest(
		"mx_e1",
		SoilTestLevel.MODERATE,
		{ sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0 },
		{
			pH: 6.5,
			ecDsM: 1.0,
			cec: 15,
			ca: 9,
			mg: 3,
			k: 0.6,
			na: 0.3,
			n: 25,
			p: 45,
			cl: 15,
		},
		"Complete N/P/Cl macro-nutrients"
	),
	E3_FULL_MICROS: createMatrixTest(
		"mx_e3",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0 },
		{
			pH: 6.5,
			ecDsM: 1.0,
			cec: 15,
			ca: 9,
			mg: 3,
			k: 0.6,
			na: 0.3,
			zn: 2.5,
			cu: 1.2,
			fe: 15,
			mn: 8,
			b: 0.5,
		},
		"Full micronutrient panel"
	),
	E5_AVAILABLE_K: createMatrixTest(
		"mx_e5",
		SoilTestLevel.MODERATE,
		{ sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0 },
		{
			pH: 6.5,
			ecDsM: 1.0,
			cec: 15,
			ca: 9,
			mg: 3,
			k: 0.6, // exchangeable K (cmol/kg)
			na: 0.3,
			kMgKg: 250, // plant-available K (mg/kg)
		},
		"Available K (mg/kg) present"
	),
	E7_HEAVY_METALS: createMatrixTest(
		"mx_e7",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 40, siltPercent: 40, clayPercent: 20, organicMatterPercent: 2.0 },
		{
			pH: 6.5,
			ecDsM: 1.0,
			cec: 15,
			ca: 9,
			mg: 3,
			k: 0.6,
			na: 0.3,
			heavyMetalsJson: { arsenic: 2, lead: 10, cadmium: 0.1 },
		},
		"Heavy metals preserved in input"
	),
};

// --- Category F: Evidence / Missing Data -------------------------------------

export const MATRIX_EVIDENCE = {
	F4_MODERATE_MISSING_CATIONS: createMatrixTest(
		"mx_f4",
		SoilTestLevel.MODERATE,
		{ sandPercent: 60, siltPercent: 25, clayPercent: 15, organicMatterPercent: 2.0 },
		{ pH: 7.2, ecDsM: 1.0, cl: 15 }, // missing cation panel -> Partial
		"MODERATE level with missing cations"
	),
	F5_ADVANCED_MISSING_MICROS: createMatrixTest(
		"mx_f5",
		SoilTestLevel.ADVANCED,
		{ sandPercent: 35, siltPercent: 35, clayPercent: 30, organicMatterPercent: 1.8 },
		{ pH: 8.3, ecDsM: 4.5, cec: 20, ca: 12, mg: 4, k: 0.8, na: 1.2 }, // missing micros -> Partial
		"ADVANCED level with missing micros"
	),
};

export const SCIENTIFIC_MATRIX_TESTS = [
	...Object.values(MATRIX_PHYSICS),
	...Object.values(MATRIX_SALINITY_SODICITY),
	...Object.values(MATRIX_CEC_CATIONS),
	...Object.values(MATRIX_PH_PROPAGATION),
	...Object.values(MATRIX_NUTRIENTS),
	...Object.values(MATRIX_EVIDENCE),
];
