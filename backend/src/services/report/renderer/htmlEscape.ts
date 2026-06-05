/**
 * FlahaSOIL v2 API — minimal HTML escaping helper for the report
 * renderer. Hand-rolled (no DOMPurify-style heavy dep) because the
 * renderer only consumes already-validated DTOs.
 */

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

export function fmtNum(
	value: number | null | undefined,
	digits = 2
): string {
	if (typeof value !== "number" || !Number.isFinite(value)) return "—";
	return value.toFixed(digits);
}
