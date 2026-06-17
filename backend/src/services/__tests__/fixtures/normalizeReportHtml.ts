/**
 * FlahaSOIL v2 API — Phase 10A.8 rendered-report HTML normalizers.
 *
 * The professional report renders a fully self-contained HTML document.
 * Before a golden HTML integrity test can assert on it, every
 * non-deterministic or presentation-only token must be stripped so the
 * assertions track scientific/structural content, not cosmetics.
 *
 * Each helper is pure and independently testable. `normalizeProfessional
 * ReportHtml` applies the full chain. Number formatting is deliberately
 * NOT collapsed — numeric drift is a regression we WANT the golden HTML
 * tests to catch, so `normalizeNumbers` is exported for callers that
 * explicitly opt in (e.g. layout-only assertions).
 */

/** Replace ISO-8601 datetimes (with optional ms + Z) with a token. */
export function stripDates(html: string): string {
	const isoDateTime =
		/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})?/g;
	const plainDate = /\d{4}-\d{2}-\d{2}/g;
	return html.replace(isoDateTime, "{{DATE}}").replace(plainDate, "{{DATE}}");
}

/** Replace UUID v4-style identifiers with a token. */
export function stripUuids(html: string): string {
	const uuid =
		/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
	return html.replace(uuid, "{{UUID}}");
}

/**
 * Replace volatile entity-id values that appear inside the report body
 * (e.g. `gst_advanced`, `smp_adv`, `physicsResult_gst_...`). These are
 * stable within a fixture but encode the test id, so a normalizer keeps
 * the golden assertions resilient to id renames.
 *
 * The match is intentionally CASE-SENSITIVE: every fixture entity id is
 * lower/camel case, whereas scientific warning codes are upper snake case
 * (e.g. `INTERPRETATION_WARNING`). A case-insensitive match would wrongly
 * collapse those codes into `{{ID}}` and blind the golden HTML lock to
 * warning-code drift.
 */
export function stripDynamicIds(html: string): string {
	const prefixedId =
		/\b(?:gst|smp|tex|che|p|u|physicsResult|chemistryResult|interpretation)_[a-z0-9_]+/g;
	return html.replace(prefixedId, "{{ID}}");
}

/** Collapse all runs of whitespace to a single space and trim. */
export function collapseWhitespace(html: string): string {
	return html.replace(/\s+/g, " ").replace(/>\s+</g, "><").trim();
}

/**
 * Round every decimal to 2 dp so layout-only assertions ignore
 * insignificant trailing precision. Opt-in only (see module note).
 */
export function normalizeNumbers(html: string): string {
	return html.replace(/\d+\.\d{3,}/g, (m) => Number(m).toFixed(2));
}

/**
 * Full deterministic normalization chain for golden HTML integrity
 * assertions: dates → uuids → dynamic ids → whitespace. Numeric values
 * are preserved so the tests still lock the scientific outputs.
 */
export function normalizeProfessionalReportHtml(html: string): string {
	return collapseWhitespace(stripDynamicIds(stripUuids(stripDates(html))));
}
