/**
 * @flaha/shared-types — soil-test report contract.
 *
 * Wire shape returned by `GET /api/v2/soil-tests/:soilTestId/report`.
 *
 * The report assembles already-persisted data (sample, test, physics,
 * chemistry, interpretation, warnings) into a single envelope plus a
 * machine-readable `auditTrace` so consumers can prove transparency
 * without re-running engines. The endpoint NEVER recalculates.
 *
 * Two formats are supported:
 *   - default (full): `SoilReportEnvelope`
 *   - `?format=summary`: `SoilReportSummary` — UI-card friendly slice.
 */

import type {
	SoilChemistryResultDTO,
	SoilInterpretationDTO,
	SoilPhysicsResultDTO,
	SoilSampleDTO,
	SoilTestDTO,
} from "./soil-domain";
import type { SystemWarning } from "./warnings";

/**
 * Audit trace surfaced on the report. Every field is optional so the
 * shape remains stable across PRELIMINARY (chemistry skipped) and
 * MODERATE/ADVANCED (full-panel) tests alike.
 */
export interface SoilReportAuditTrace {
	/**
	 * Verbatim physics engine output captured at calculation time
	 * (already persisted to `SoilPhysicsResult.calculationTraceJson`).
	 * Includes intermediate equation outputs when the engine emits them.
	 */
	physicsTrace?: Record<string, unknown> | null;
	/**
	 * The chemistry input fields actually consumed by the engine
	 * orchestration (post-normalization), keyed by canonical name.
	 * Useful for auditing what the engines saw versus what the lab sent.
	 */
	chemistryInputsUsed?: Record<string, unknown> | null;
	/**
	 * Result of `normalizeSalinity` applied to chemistry input. Records
	 * the canonical EC, whether it was derived from TDS, and any
	 * consistency warnings the normalization layer emitted.
	 */
	normalizedInputs?: {
		salinity?: {
			ecDsM?: number;
			tdsMgL?: number;
			derivedFromTds: boolean;
			warnings: string[];
		};
	};
	/**
	 * Names of engine modules skipped during calculation, with a
	 * human-readable reason per skip. Empty array when nothing was
	 * skipped.
	 */
	skippedModules: Array<{ module: "chemistry"; reason: string }>;
}

export interface SoilReportMetadata {
	generatedAt: string; // ISO timestamp
	version: string; // matches calculationVersion on the physics row
	calculationMode?: "LAB" | "ESTIMATED" | null;
	testLevel: string;
}

/** Full report envelope. */
export interface SoilReportEnvelope {
	sample: SoilSampleDTO;
	test: SoilTestDTO;
	physics: SoilPhysicsResultDTO | null;
	chemistry: SoilChemistryResultDTO | null;
	interpretation: SoilInterpretationDTO | null;
	warnings: string[];
	warningDetails: SystemWarning[];
	auditTrace: SoilReportAuditTrace;
	metadata: SoilReportMetadata;
}

/**
 * Compact projection for UI cards / list views. Shape is intentionally
 * narrow (no nested DTOs) so a list of summaries stays cheap.
 */
export interface SoilReportSummary {
	soilTestId: string;
	sampleId: string;
	testLevel: string;
	labName?: string | null;
	textureClass?: string | null;
	overallSoilRating?: string | null;
	phCategory?: string | null;
	salinityRisk?: string | null;
	hasChemistry: boolean;
	hasInterpretation: boolean;
	warningCount: number;
	generatedAt: string;
}
