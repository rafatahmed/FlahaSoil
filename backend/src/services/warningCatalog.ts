/**
 * FlahaSOIL v2 API — structured warning factory.
 *
 * Centralises the construction of `SystemWarning` objects so the
 * calculation pipeline emits one consistent shape per kind of soft
 * failure. The string `code` values mirror the catalog declared in
 * `@flaha/shared-types/warnings.ts` and MUST stay in sync.
 *
 * Usage:
 *   warnings.chemistrySkippedPreliminary("…");
 *   warnings.tdsInconsistentWithEc({ ecDsM: 1, tdsMgL: 1000 });
 *   warnings.interpretation("High salinity — yields will be reduced.");
 */

import type {
	SystemWarning,
	SystemWarningCode,
} from "@flaha/shared-types";

function make(
	code: SystemWarningCode,
	message: string,
	severity: SystemWarning["severity"],
	details?: Record<string, unknown>
): SystemWarning {
	const w: SystemWarning = { code, message, severity };
	if (details !== undefined) w.details = details;
	return w;
}

export const warnings = {
	chemistrySkippedPreliminary(message: string): SystemWarning {
		return make("CHEMISTRY_SKIPPED_PRELIMINARY", message, "warning");
	},
	chemistrySkippedNoInput(message: string): SystemWarning {
		return make("CHEMISTRY_SKIPPED_NO_CHEMISTRY_INPUT", message, "warning");
	},
	chemistrySkippedInsufficientTexture(message: string): SystemWarning {
		return make(
			"CHEMISTRY_SKIPPED_INSUFFICIENT_TEXTURE",
			message,
			"warning"
		);
	},
	tdsInconsistentWithEc(details: {
		ecDsM: number;
		suppliedTdsMgL: number;
		expectedTdsMgL: number;
	}): SystemWarning {
		return make(
			"TDS_INCONSISTENT_WITH_EC",
			"TDS inconsistent with EC; EC used as primary",
			"warning",
			details
		);
	},
	ecDerivedFromTds(details: {
		ecDsM: number;
		tdsMgL: number;
	}): SystemWarning {
		return make(
			"EC_DERIVED_FROM_TDS",
			"EC was derived from TDS using the standard 640 mg/L per dS/m factor.",
			"info",
			details
		);
	},
	interpretation(message: string): SystemWarning {
		return make("INTERPRETATION_WARNING", message, "warning");
	},
};
