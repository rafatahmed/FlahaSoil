/**
 * @flaha/soil-chemistry — public entry point.
 *
 * Pure-function CEC / base-saturation / cation-balance / ESP / SAR engine.
 * No interpretation, no I/O, no UI.
 */
export * from "./calculateSoilChemistry";
export * from "./structureTriangle";
export * from "./types";

/**
 * Phase-1 sentinel kept for backwards compatibility with any caller that
 * imported it from the placeholder build.
 */
export function soilChemistryPackageReady(): boolean {
	return true;
}
