/**
 * @flaha/soil-physics — Type definitions.
 *
 * Output field types match the legacy SoilCalculationService verbatim:
 *   - Many fields are emitted as STRINGS via `Number.toFixed(n)` (e.g.
 *     `fieldCapacity`, `bulkDensity`, `saturatedConductivity`,
 *     `airEntryTension`, `osmoticPotential`, etc.).
 *   - A few echo-back fields are NUMBERS (`sand`, `clay`, `silt`,
 *     `organicMatter`, `gravelContent`, `electricalConductivity`,
 *     `inputBulkDensity`).
 * These are preserved exactly to keep wire-format parity with the legacy
 * `formatResultsByPlan` output.
 */

export type UserPlan = "FREE" | "PROFESSIONAL" | "ENTERPRISE";

export interface SoilPhysicsInput {
	sand: number;
	clay: number;
	organicMatter?: number;
	densityFactor?: number;
	gravelContent?: number;
	electricalConductivity?: number;
	userPlan?: UserPlan;
}

export interface ConfidenceIntervalsBlock {
	wiltingPoint: number;
	fieldCapacity: number;
	saturation: number;
	airEntryTension: number;
	saturatedConductivity: number;
}

export interface RSquaredBlock {
	wiltingPoint: number;
	fieldCapacity: number;
	saturation: number;
	airEntryTension: number;
	saturatedConductivity: number;
}

/**
 * Base result fields returned for ALL user plans.
 * Mirrors `baseResults` in `SoilCalculationService.formatResultsByPlan`.
 */
export interface BaseSoilPhysicsResult {
	fieldCapacity: string;
	wiltingPoint: string;
	plantAvailableWater: string;
	saturation: string;
	saturatedConductivity: string;
	textureClass: string;
	soilQualityIndex: string;
	drainageClass: string;
	compactionRisk: string;
	erosionRisk: string;

	bulkDensity: string;
	bulkDensityFactor: string;
	inputBulkDensity: number | undefined;

	/**
	 * Phase 10A.7 — Scientific Audit R2 (traceability).
	 *
	 * `bulkDensity` (above) preserves legacy semantics: the **predicted**
	 * ρN from Saxton-Rawls Eq 6 (`(1 − θS) × 2.65`). The downstream math
	 * (porosity, void ratio, all density-adjusted moisture and tension
	 * equations) actually uses **ρDF**, which equals the user-supplied
	 * `inputBulkDensity` when provided, or the engine default otherwise.
	 *
	 * The three fields below make this discrepancy explicit so reports
	 * and UIs can show *which* bulk density value drove the result:
	 *
	 *   - `predictedBulkDensity` : ρN from texture (Saxton-Rawls Eq 6).
	 *   - `bulkDensityUsed`      : ρDF — the value actually fed to the
	 *                              density-adjusted equations.
	 *   - `bulkDensitySource`    : provenance of `bulkDensityUsed`.
	 */
	predictedBulkDensity: string;
	bulkDensityUsed: string;
	bulkDensitySource: "USER_INPUT" | "DEFAULT";

	porosity: string;
	voidRatio: string;
	particleDensity: string;

	sand: number;
	clay: number;
	silt: number;
	organicMatter: number | undefined;
	gravelContent: number;
	electricalConductivity: number;
}

/**
 * Additional fields appended for PROFESSIONAL and ENTERPRISE plans.
 */
export interface ProfessionalAdditions {
	airEntryTension: string;
	lambda: string;
	unsaturatedConductivity: string;
	gravelVolumeFraction?: number;
	plantAvailableWaterBulk?: string;
	bulkConductivity?: string;
	conductivityRatio?: string;
	confidenceIntervals?: ConfidenceIntervalsBlock;
	rSquaredValues?: RSquaredBlock;
}

/**
 * Additional fields appended only for ENTERPRISE plans.
 */
export interface EnterpriseAdditions {
	osmoticPotential?: string;
	osmoticPotentialFC?: string;
	parameterA: string;
	parameterB: string;
	relativeK: string;
	conductivityExponent: string;
}

/**
 * Final result type. Professional / Enterprise additions are present at
 * runtime only when the corresponding tier is requested. The engine attaches
 * them via `Object.assign`, exactly as the legacy code does.
 */
export type SoilPhysicsResult = BaseSoilPhysicsResult &
	Partial<ProfessionalAdditions> &
	Partial<EnterpriseAdditions>;
