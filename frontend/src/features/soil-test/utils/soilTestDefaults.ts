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
	/**
	 * Short caption rendered under the step label. Helps a first-time
	 * user understand what each step asks for without opening it.
	 */
	description?: string;
}

export const ALL_WIZARD_STEPS: WizardStepMeta[] = [
	{
		key: "sample-info",
		label: "Sample Info",
		description: "Project, location, and depth of the sample.",
	},
	{
		key: "test-level",
		label: "Test Level",
		description: "Choose how much detail your lab report contains.",
	},
	{
		key: "preliminary",
		label: "Texture & Basics",
		description: "Sand / silt / clay, organic matter, pH, salinity.",
	},
	{
		key: "moderate",
		label: "Core Chemistry",
		description: "Major cations, CEC, and macronutrients.",
	},
	{
		key: "advanced",
		label: "Advanced Panel",
		description: "Micronutrients and salinity indices.",
	},
	{
		key: "review",
		label: "Review & Submit",
		description: "Confirm everything before sending to the lab engine.",
	},
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

export interface TestLevelOption {
	value: SoilTestLevel;
	label: string;
	description: string;
	captures: string;
	bestFor: string;
}

export const TEST_LEVEL_OPTIONS: TestLevelOption[] = [
	{
		value: SoilTestLevel.PRELIMINARY,
		label: "Preliminary",
		description: "Texture, organic matter, pH and salinity.",
		captures:
			"Sand / silt / clay %, organic matter %, pH, EC, TDS. Skips the cation panel.",
		bestFor:
			"Quick reconnaissance, basic irrigation planning, or before commissioning a full lab analysis.",
	},
	{
		value: SoilTestLevel.MODERATE,
		label: "Moderate",
		description: "Adds the cation panel and CEC for full chemistry.",
		captures:
			"Everything in Preliminary plus Ca, Mg, K, Na, Cl, N, P and measured / derived CEC.",
		bestFor:
			"Routine agronomic decisions: lime / gypsum requirement, NPK fertiliser planning, sodicity screen.",
	},
	{
		value: SoilTestLevel.ADVANCED,
		label: "Advanced",
		description:
			"Full lab panel: micronutrients and salinity indices.",
		captures:
			"Everything in Moderate plus Fe, Mn, Zn, Cu, B, Mo, S, carbonate, bicarbonate, SAR, ESP.",
		bestFor:
			"Problem soils, high-value crops, exporter / certification reports, salinity & sodicity management.",
	},
];

export interface FieldMeta {
	key: string;
	label: string;
	unit?: string;
	helperText?: string;
}

export interface FieldGroup {
	title: string;
	caption?: string;
	fields: FieldMeta[];
}

export const PRELIMINARY_GROUPS: FieldGroup[] = [
	{
		title: "Texture",
		caption:
			"Particle-size distribution. Sand + silt + clay should sum to 100 %.",
		fields: [
			{ key: "sandPercent", label: "Sand", unit: "%" },
			{ key: "siltPercent", label: "Silt", unit: "%" },
			{ key: "clayPercent", label: "Clay", unit: "%" },
		],
	},
	{
		title: "Organic matter",
		caption: "Loss-on-ignition or Walkley-Black, dry-weight basis.",
		fields: [
			{ key: "organicMatterPercent", label: "Organic matter", unit: "%" },
		],
	},
	{
		title: "Reaction & salinity",
		caption: "pH (1:1 water) and saturated-paste EC / TDS.",
		fields: [
			{ key: "pH", label: "pH" },
			{ key: "ecDsM", label: "EC", unit: "dS/m" },
			{ key: "tdsMgL", label: "TDS", unit: "mg/L" },
		],
	},
];

export const MODERATE_GROUPS: FieldGroup[] = [
	{
		title: "Exchangeable cations",
		caption: "Saturated-paste or ammonium-acetate extract.",
		fields: [
			{ key: "ca", label: "Calcium (Ca)", unit: "cmol(+)/kg" },
			{ key: "mg", label: "Magnesium (Mg)", unit: "cmol(+)/kg" },
			{ key: "k", label: "Potassium (K)", unit: "cmol(+)/kg" },
			{ key: "na", label: "Sodium (Na)", unit: "cmol(+)/kg" },
		],
	},
	{
		title: "Macronutrients & anions",
		caption: "Plant-available pools by standard lab methods.",
		fields: [
			{ key: "n", label: "Nitrogen (N)", unit: "mg/kg" },
			{ key: "p", label: "Phosphorus (P)", unit: "mg/kg" },
			{ key: "cl", label: "Chloride (Cl)", unit: "mg/kg" },
		],
	},
	{
		title: "CEC",
		caption: "Leave blank to derive from the cations above.",
		fields: [{ key: "cec", label: "CEC", unit: "cmol(+)/kg" }],
	},
];

export const ADVANCED_GROUPS: FieldGroup[] = [
	{
		title: "Micronutrients",
		caption: "Plant-available pools, typical DTPA extraction.",
		fields: [
			{ key: "fe", label: "Iron (Fe)", unit: "mg/kg" },
			{ key: "mn", label: "Manganese (Mn)", unit: "mg/kg" },
			{ key: "zn", label: "Zinc (Zn)", unit: "mg/kg" },
			{ key: "cu", label: "Copper (Cu)", unit: "mg/kg" },
			{ key: "b", label: "Boron (B)", unit: "mg/kg" },
			{ key: "mo", label: "Molybdenum (Mo)", unit: "mg/kg" },
			{ key: "s", label: "Sulphur (S)", unit: "mg/kg" },
		],
	},
	{
		title: "Salinity & sodicity indices",
		caption: "Carbonate fractions and derived ratios from the lab.",
		fields: [
			{ key: "carbonate", label: "Carbonate", unit: "mg/kg" },
			{ key: "bicarbonate", label: "Bicarbonate", unit: "mg/kg" },
			{ key: "sar", label: "SAR" },
			{ key: "esp", label: "ESP", unit: "%" },
		],
	},
];

/** Flat field lists kept for backward compatibility with any consumer
 * that iterates fields without caring about grouping. */
export const PRELIMINARY_FIELDS: FieldMeta[] = PRELIMINARY_GROUPS.flatMap(
	(g) => g.fields
);
export const MODERATE_FIELDS: FieldMeta[] = MODERATE_GROUPS.flatMap(
	(g) => g.fields
);
export const ADVANCED_FIELDS: FieldMeta[] = ADVANCED_GROUPS.flatMap(
	(g) => g.fields
);
