/**
 * FlahaSOIL v2 API — Report renderer abstractions (Phase 8D E.1).
 *
 * Three small interfaces decouple "what to render" from "how to render"
 * and "where to write":
 *
 *   - `ReportTemplate` renders a single section to an HTML fragment.
 *   - `ReportRenderer` orchestrates templates into a full HTML document
 *     (with brand styles) for a `ProfessionalReportDTO`.
 *   - `ReportExporter` writes the rendered document somewhere (string,
 *     filesystem, PDF, email). Only the HTML exporter is implemented in
 *     v1; PDF / email are deliberate stubs for Phase 9.
 *
 * This split is intentional: the renderer is pure (no I/O), so the
 * preview endpoint and any future export path share the same code.
 */

import type { ProfessionalReportDTO } from "@flaha/shared-types";

export interface ReportTemplateContext {
	report: ProfessionalReportDTO;
	/** Branding tokens injected by the renderer (CSS variables). */
	brand: BrandTokens;
}

export interface BrandTokens {
	/** Hex string (e.g. `#3C2F2F`). */
	primary: string;
	secondary: string;
	accent: string;
	warning: string;
	critical: string;
	background: string;
	surface: string;
	textPrimary: string;
	textMuted: string;
	fontFamily: string;
}

/**
 * One template per section. Implementations MUST be pure and return
 * raw HTML string (already escaped). The renderer assembles fragments
 * in the order the implementations are registered.
 */
export interface ReportTemplate {
	readonly id: string;
	render(ctx: ReportTemplateContext): string;
}

export interface ReportRenderResult {
	html: string;
	/** Length of the rendered document, useful for logging. */
	bytes: number;
}

export interface ReportRenderer {
	render(report: ProfessionalReportDTO): ReportRenderResult;
}

export interface ReportExporter {
	readonly contentType: string;
	export(report: ProfessionalReportDTO): Promise<{ body: string | Buffer }>;
}

export const DEFAULT_BRAND: BrandTokens = {
	primary: "#3C2F2F",
	secondary: "#7B5E3C",
	accent: "#3F7E44",
	warning: "#D08C3A",
	critical: "#B23A48",
	background: "#FAF6EE",
	surface: "#FFFFFF",
	textPrimary: "#221E1B",
	textMuted: "#6B6259",
	fontFamily:
		"'Helvetica Neue', Helvetica, 'Segoe UI', Arial, sans-serif",
};
