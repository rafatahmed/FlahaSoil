/**
 * @flaha/soil-interpretation — public entry point.
 *
 * Pure decision-layer engine that classifies pre-computed physics and
 * chemistry results into qualitative categories, risk classes, and
 * warnings. No calculations, no I/O.
 */

export { interpretSoil } from "./interpretSoil";
export type {
	SoilInterpretationInput,
	SoilInterpretationResult,
} from "./types";
export {
	classifyCompactionRisk,
	classifyDrainageFromKsat,
	classifyInfiltration,
	classifyOrganicMatter,
	classifySalinitySeverity,
	classifySodicitySeverity,
	classifyTextureSuitability,
} from "./rules";
export type {
	SalinitySeverity,
	SodicitySeverity,
	SuitabilityEntry,
	SuitabilityMatrix,
	SuitabilityVerdict,
	TextureSuitabilityInput,
} from "./rules";

/** Phase-1 sentinel kept for backwards compatibility with the skeleton. */
export function soilInterpretationPackageReady(): boolean {
	return true;
}
