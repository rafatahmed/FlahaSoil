/**
 * FlahaSOIL v2 API — minimal HTML escaping helper for the report
 * renderer. Hand-rolled (no DOMPurify-style heavy dep) because the
 * renderer only consumes already-validated DTOs.
 *
 * Phase 10A.7 (WS6) — `fmtNum` delegates to the canonical per-variable
 * precision table in `@flaha/shared-types` so the HTML/PDF report and
 * the React UI never disagree on decimal places.
 */

import { formatQuantity, MISSING_VALUE_PLACEHOLDER, type QuantityKind } from "@flaha/shared-types";

const ENTITY_MAP: Record<string, string> = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': "&quot;",
	"'": "&#39;",
};

export function esc(value: unknown): string {
	if (value === null || value === undefined) return "";
	const s = String(value);
	return s.replace(/[&<>"']/g, (ch) => ENTITY_MAP[ch] ?? ch);
}

/**
 * Format a numeric value for the HTML/PDF report.
 *
 * Preferred call shape — pass a {@link QuantityKind} so the canonical
 * precision is picked up automatically:
 *   `fmtNum(envelope.physics?.bulkDensity, "bulkDensity")`
 *
 * Legacy call shape — pass a raw digit count (kept for backwards
 * compatibility with templates that have not been migrated yet):
 *   `fmtNum(value, 2)`
 *
 * Returns `—` for nullish / non-finite input.
 */
export function fmtNum(
	value: number | null | undefined,
	kindOrDigits: QuantityKind | number = 2
): string {
	if (typeof value !== "number" || !Number.isFinite(value)) {
		return MISSING_VALUE_PLACEHOLDER;
	}
	if (typeof kindOrDigits === "number") {
		return value.toFixed(kindOrDigits);
	}
	return formatQuantity(value, kindOrDigits);
}
