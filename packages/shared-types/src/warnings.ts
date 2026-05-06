/**
 * @flaha/shared-types — structured system warnings.
 *
 * The v2 API has historically returned `warnings: string[]` on the
 * calculate response. Phase 8 introduces a parallel, machine-readable
 * channel (`warningDetails: SystemWarning[]`) so frontends and
 * downstream consumers (FlahaCalc, audit dashboards) can branch on a
 * stable `code` rather than parse free-text English.
 *
 * Backward compatibility:
 *   - `warnings: string[]` continues to be emitted (the `message` field
 *     of every `SystemWarning` is concatenated into it).
 *   - Existing string consumers keep working unchanged.
 *
 * Adding a new code:
 *   1. Append it to `SYSTEM_WARNING_CODES` (DO NOT remove or renumber
 *      existing entries — they are part of the wire contract).
 *   2. Document it in `docs/v2-reporting.md` under "Warning codes".
 */

export const SYSTEM_WARNING_CODES = [
	/** Chemistry engine was skipped because the test only carried pH/EC/TDS. */
	"CHEMISTRY_SKIPPED_PRELIMINARY",
	/** Chemistry engine was skipped because LAB mode lacked CEC and cations. */
	"CHEMISTRY_SKIPPED_NO_CHEMISTRY_INPUT",
	/** Chemistry engine was skipped because ESTIMATED mode lacked clay+OM. */
	"CHEMISTRY_SKIPPED_INSUFFICIENT_TEXTURE",
	/** EC was the canonical value but supplied TDS disagreed by >20%. */
	"TDS_INCONSISTENT_WITH_EC",
	/** Salinity normalization derived EC from a TDS-only input (informational). */
	"EC_DERIVED_FROM_TDS",
	/** Interpretation engine emitted a free-text warning (passed through). */
	"INTERPRETATION_WARNING",
] as const;

export type SystemWarningCode = (typeof SYSTEM_WARNING_CODES)[number];

export type SystemWarningSeverity = "info" | "warning" | "critical";

/**
 * Structured warning surfaced alongside successful 2xx responses. Not
 * an error — errors use `ApiErrorResponse`. A `SystemWarning` simply
 * tells the client that a calculation continued under degraded or
 * non-default conditions.
 *
 * `details` is reserved for code-specific machine-readable context
 * (e.g. `{ supplied: 1000, expected: 640 }` for `TDS_INCONSISTENT_WITH_EC`).
 */
export interface SystemWarning {
	code: SystemWarningCode | string;
	message: string;
	severity: SystemWarningSeverity;
	details?: Record<string, unknown>;
}

/** Convenience type-guard. */
export function isSystemWarning(value: unknown): value is SystemWarning {
	if (typeof value !== "object" || value === null) return false;
	const v = value as { code?: unknown; message?: unknown; severity?: unknown };
	return (
		typeof v.code === "string" &&
		typeof v.message === "string" &&
		(v.severity === "info" ||
			v.severity === "warning" ||
			v.severity === "critical")
	);
}
