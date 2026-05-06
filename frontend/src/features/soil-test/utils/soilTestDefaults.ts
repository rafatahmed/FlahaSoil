/**
 * FlahaSOIL v2 — soil-test wizard defaults and step metadata.
 *
 * Pure data only — no side effects, no I/O. Used by the wizard
 * components to render labels, placeholder values, and the visible
 * step list given a `SoilTestLevel`.
 */
import { SoilTestLevel } from "@flaha/shared-types";

export type WizardStepKey =
	| "sample-info"
	| "test-level"
	| "preliminary"
	| "moderate"
	| "advanced"
	| "review";

export interface WizardStepMeta {
	key: WizardStepKey;
	label: string;
}

export const ALL_WIZARD_STEPS: WizardStepMeta[] = [
	{ key: "sample-info", label: "Sample Info" },
	{ key: "test-level", label: "Test Level" },
	{ key: "preliminary", label: "Preliminary Inputs" },
	{ key: "moderate", label: "Moderate Inputs" },
	{ key: "advanced", label: "Advanced Inputs" },
	{ key: "review", label: "Review" },
];

/**
 * Visible steps for the given test level.
 *
 * - PRELIMINARY → sample, level, preliminary, review
 * - MODERATE    → sample, level, preliminary, moderate, review
 * - ADVANCED    → sample, level, preliminary, moderate, advanced, review
 */
export function visibleStepsForLevel(
	level: SoilTestLevel
): WizardStepMeta[] {
	const showModerate =
		level === SoilTestLevel.MODERATE || level === SoilTestLevel.ADVANCED;
	const showAdvanced = level === SoilTestLevel.ADVANCED;

	return ALL_WIZARD_STEPS.filter((step) => {
		if (step.key === "moderate" && !showModerate) return false;
		if (step.key === "advanced" && !showAdvanced) return false;
		return true;
	});
}

export const TEST_LEVEL_OPTIONS: Array<{
	value: SoilTestLevel;
	label: string;
	description: string;
}> = [
	{
		value: SoilTestLevel.PRELIMINARY,
		label: "Preliminary",
		description: "Texture only — sand / silt / clay percentages.",
	},
	{
		value: SoilTestLevel.MODERATE,
		label: "Moderate",
		description: "Texture plus core chemistry (pH, EC, major cations).",
	},
	{
		value: SoilTestLevel.ADVANCED,
		label: "Advanced",
		description: "Full lab panel including micronutrients and salinity indices.",
	},
];

export interface FieldMeta {
	key: string;
	label: string;
	unit?: string;
	helperText?: string;
}

export const PRELIMINARY_FIELDS: FieldMeta[] = [
	{ key: "sandPercent", label: "Sand", unit: "%" },
	{ key: "siltPercent", label: "Silt", unit: "%" },
	{ key: "clayPercent", label: "Clay", unit: "%" },
	{
		key: "organicMatterPercent",
		label: "Organic matter",
		unit: "%",
	},
	{ key: "pH", label: "pH" },
	{ key: "ecDsM", label: "EC", unit: "dS/m" },
	{ key: "tdsMgL", label: "TDS", unit: "mg/L" },
];

export const MODERATE_FIELDS: FieldMeta[] = [
	{ key: "ca", label: "Calcium (Ca)", unit: "cmol(+)/kg" },
	{ key: "mg", label: "Magnesium (Mg)", unit: "cmol(+)/kg" },
	{ key: "k", label: "Potassium (K)", unit: "cmol(+)/kg" },
	{ key: "na", label: "Sodium (Na)", unit: "cmol(+)/kg" },
	{ key: "cl", label: "Chloride (Cl)", unit: "mg/kg" },
	{ key: "n", label: "Nitrogen (N)", unit: "mg/kg" },
	{ key: "p", label: "Phosphorus (P)", unit: "mg/kg" },
	{ key: "cec", label: "CEC", unit: "cmol(+)/kg" },
];

export const ADVANCED_FIELDS: FieldMeta[] = [
	{ key: "fe", label: "Iron (Fe)", unit: "mg/kg" },
	{ key: "mn", label: "Manganese (Mn)", unit: "mg/kg" },
	{ key: "zn", label: "Zinc (Zn)", unit: "mg/kg" },
	{ key: "cu", label: "Copper (Cu)", unit: "mg/kg" },
	{ key: "b", label: "Boron (B)", unit: "mg/kg" },
	{ key: "mo", label: "Molybdenum (Mo)", unit: "mg/kg" },
	{ key: "s", label: "Sulphur (S)", unit: "mg/kg" },
	{ key: "carbonate", label: "Carbonate", unit: "mg/kg" },
	{ key: "bicarbonate", label: "Bicarbonate", unit: "mg/kg" },
	{ key: "sar", label: "SAR" },
	{ key: "esp", label: "ESP", unit: "%" },
];
