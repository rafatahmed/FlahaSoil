/**
 * FlahaSOIL v2 API — pure report assembly helpers.
 *
 * Splits the audit-trace and warning-derivation logic out of
 * `report.service.ts` so it can be unit-tested without Prisma. Every
 * function here is pure (no I/O, no globals) and idempotent.
 *
 * `chemistrySkipReason` matches the predicate in
 * `calculation.service.ts` 1:1 — the report layer cannot import the
 * calculation service directly because it would create a runtime cycle
 * once we surface a "calculate from report" affordance later, so the
 * predicate is duplicated here. Keep the two in sync if you change one.
 */
import type {
	SoilReportAuditTrace,
	SystemWarning,
} from "@flaha/shared-types";

import {
	normalizeSalinity,
	SALINITY_INCONSISTENCY_WARNING,
	TDS_PER_DSM,
} from "./salinityNormalization";
import { warnings as warn } from "./warningCatalog";

function num(value: unknown): number | undefined {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const n = parseFloat(value);
		return Number.isFinite(n) ? n : undefined;
	}
	return undefined;
}

export interface BuildAuditTraceArgs {
	chemistryInput: Record<string, unknown> | null;
	textureInput: Record<string, unknown> | null;
	physicsRow: Record<string, unknown> | null;
	chemistryRow: Record<string, unknown> | null;
}

export function buildAuditTrace(
	args: BuildAuditTraceArgs
): SoilReportAuditTrace {
	const { chemistryInput, textureInput, physicsRow, chemistryRow } = args;

	const physicsTrace =
		(physicsRow?.["calculationTraceJson"] as Record<string, unknown> | null) ??
		null;

	const normalized = chemistryInput
		? normalizeSalinity({
				ecDsM: num(chemistryInput["ecDsM"]),
				tdsMgL: num(chemistryInput["tdsMgL"]),
		  })
		: { derivedFromTds: false, warnings: [] as string[] };

	const skippedModules: SoilReportAuditTrace["skippedModules"] = [];
	if (chemistryInput && chemistryRow === null) {
		const reason = describeChemistrySkip(chemistryInput, textureInput);
		if (reason) skippedModules.push({ module: "chemistry", reason });
	}

	const chemistryInputsUsed = chemistryInput
		? projectChemistryInputs(chemistryInput, normalized.ecDsM, textureInput)
		: null;

	const trace: SoilReportAuditTrace = {
		physicsTrace,
		chemistryInputsUsed,
		normalizedInputs: chemistryInput
			? {
					salinity: {
						...(normalized.ecDsM !== undefined
							? { ecDsM: normalized.ecDsM }
							: {}),
						...(normalized.tdsMgL !== undefined
							? { tdsMgL: normalized.tdsMgL }
							: {}),
						derivedFromTds: normalized.derivedFromTds,
						warnings: normalized.warnings,
					},
			  }
			: undefined,
		skippedModules,
	};
	return trace;
}

export function deriveWarningDetails(args: {
	auditTrace: SoilReportAuditTrace;
	interpretationWarnings: string[];
}): SystemWarning[] {
	const out: SystemWarning[] = [];
	const sal = args.auditTrace.normalizedInputs?.salinity;
	if (sal && sal.derivedFromTds && sal.ecDsM !== undefined && sal.tdsMgL !== undefined) {
		out.push(warn.ecDerivedFromTds({ ecDsM: sal.ecDsM, tdsMgL: sal.tdsMgL }));
	}
	if (
		sal &&
		sal.warnings.includes(SALINITY_INCONSISTENCY_WARNING) &&
		sal.ecDsM !== undefined &&
		sal.tdsMgL !== undefined
	) {
		out.push(
			warn.tdsInconsistentWithEc({
				ecDsM: sal.ecDsM,
				suppliedTdsMgL: sal.tdsMgL,
				expectedTdsMgL: sal.ecDsM * TDS_PER_DSM,
			})
		);
	}
	for (const skip of args.auditTrace.skippedModules) {
		// Map the reason text back to the most specific catalog entry we
		// can identify; default to PRELIMINARY since that is by far the
		// most common skip path in production.
		if (/ESTIMATED mode/i.test(skip.reason)) {
			out.push(warn.chemistrySkippedInsufficientTexture(skip.reason));
		} else if (/no chemistry input/i.test(skip.reason)) {
			out.push(warn.chemistrySkippedNoInput(skip.reason));
		} else {
			out.push(warn.chemistrySkippedPreliminary(skip.reason));
		}
	}
	for (const w of args.interpretationWarnings) {
		out.push(warn.interpretation(w));
	}
	return out;
}

function projectChemistryInputs(
	chem: Record<string, unknown>,
	canonicalEc: number | undefined,
	tex: Record<string, unknown> | null
): Record<string, unknown> {
	const out: Record<string, unknown> = {};
	const keys = ["pH", "cec", "ca", "mg", "k", "na"] as const;
	for (const k of keys) {
		const v = num(chem[k]);
		if (v !== undefined) out[k] = v;
	}
	if (canonicalEc !== undefined) out["ecDsM"] = canonicalEc;
	if (tex) {
		const tk = ["sandPercent", "clayPercent", "organicMatterPercent"] as const;
		for (const k of tk) {
			const v = num(tex[k]);
			if (v !== undefined) out[k] = v;
		}
	}
	return out;
}

function describeChemistrySkip(
	chem: Record<string, unknown>,
	_tex: Record<string, unknown> | null
): string | null {
	const cec = num(chem["cec"]);
	const ca = num(chem["ca"]);
	const mg = num(chem["mg"]);
	const k = num(chem["k"]);
	const na = num(chem["na"]);
	const cationSum = (ca ?? 0) + (mg ?? 0) + (k ?? 0) + (na ?? 0);
	const hasCec = cec !== undefined && cec > 0;
	const hasCations =
		ca !== undefined || mg !== undefined || k !== undefined || na !== undefined;
	if (!hasCec && (!hasCations || cationSum <= 0)) {
		return (
			"Chemistry calculation skipped: PRELIMINARY-style input (pH/EC " +
			"only); CEC and cation data (Ca, Mg, K, Na) are required for the " +
			"chemistry engine."
		);
	}
	return null;
}
