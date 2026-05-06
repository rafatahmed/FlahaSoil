/**
 * @flaha/soil-physics — public entry point.
 *
 * Pure-function port of the legacy Saxton & Rawls (2006) engine in
 * `api-implementation/src/services/soilCalculationService.js`. Outputs are
 * byte-for-byte identical to the legacy `formatResultsByPlan(...)` payload
 * (see `docs/legacy-calculation-samples.md`).
 */
export * from "./calculateSoilPhysics";
export * from "./types";

/**
 * Phase-1 sentinel kept for backwards compatibility with any caller that
 * imported it from the placeholder build.
 */
export function soilPhysicsPackageReady(): boolean {
	return true;
}
