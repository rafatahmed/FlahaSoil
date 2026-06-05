/**
 * FlahaSOIL v2 — interpretation status mapping.
 *
 * Translates the categorical strings emitted by
 * `@flaha/soil-interpretation` (and the overall rating enum on
 * `SoilInterpretationDTO`) into a tri-state visual status —
 * `good | fair | poor` — paired with a Material-UI chip color. This
 * file does not classify any data; it only maps already-classified
 * strings to UI states. The thresholds themselves live in
 * `packages/soil-interpretation/src/rules.ts`.
 */
import { SoilInterpretationRating } from "@flaha/shared-types";

export type StatusTone = "good" | "fair" | "poor" | "neutral";
export type ChipColor =
	| "success"
	| "warning"
	| "error"
	| "default"
	| "info";

export interface StatusDescriptor {
	tone: StatusTone;
	color: ChipColor;
}

export const NEUTRAL: StatusDescriptor = { tone: "neutral", color: "default" };

const GOOD: StatusDescriptor = { tone: "good", color: "success" };
const FAIR: StatusDescriptor = { tone: "fair", color: "warning" };
const POOR: StatusDescriptor = { tone: "poor", color: "error" };

/** Map a `SoilInterpretationRating` enum value to a chip color. */
export function ratingToStatus(
	rating: SoilInterpretationRating | null | undefined
): StatusDescriptor {
	switch (rating) {
		case SoilInterpretationRating.GOOD:
			return GOOD;
		case SoilInterpretationRating.FAIR:
			return FAIR;
		case SoilInterpretationRating.POOR:
			return POOR;
		default:
			return NEUTRAL;
	}
}

/**
 * Per-field categorical tables. Values mirror exactly the strings
 * emitted by `@flaha/soil-interpretation/rules.ts`. Any value not
 * present in a table falls back to `NEUTRAL` so unknown classifier
 * outputs do not crash the UI.
 */
const TABLES: Record<string, Record<string, StatusDescriptor>> = {
	phCategory: {
		Neutral: GOOD,
		"Slightly Acidic": FAIR,
		Alkaline: FAIR,
		"Strongly Acidic": POOR,
		"Highly Alkaline": POOR,
	},
	salinityRisk: {
		Low: GOOD,
		Moderate: FAIR,
		High: POOR,
		Severe: POOR,
	},
	cecLevel: {
		High: GOOD,
		Moderate: GOOD,
		Low: FAIR,
		"Very Low": POOR,
	},
	baseSaturationCategory: {
		Moderate: GOOD,
		High: FAIR,
		Low: POOR,
	},
	sodiumRisk: {
		Low: GOOD,
		Moderate: FAIR,
		High: POOR,
	},
	cationBalance: {
		Balanced: GOOD,
		Imbalanced: FAIR,
	},
	waterHoldingClass: {
		Moderate: GOOD,
		High: GOOD,
		Low: FAIR,
	},
};

export function categoryToStatus(
	field: string,
	value: string | null | undefined
): StatusDescriptor {
	if (!value) return NEUTRAL;
	const table = TABLES[field];
	if (!table) return NEUTRAL;
	return table[value] ?? NEUTRAL;
}
