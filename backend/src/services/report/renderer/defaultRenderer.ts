/**
 * FlahaSOIL v2 API — Default report renderer (Phase 8D E.1).
 *
 * Assembles all `ReportTemplate` fragments into a single, self-contained
 * HTML document with inline brand styles. No external CSS or JS, so the
 * output is portable: it can be served directly from the preview
 * endpoint, written to disk, or piped to a headless browser for PDF
 * later (Phase 9).
 */

import type { ProfessionalReportDTO } from "@flaha/shared-types";

import {
	chemistryTemplate,
	coverTemplate,
	executiveTemplate,
	physicsTemplate,
	textureTemplate,
} from "./defaultTemplate";
import {
	agronomicTemplate,
	appendixTemplate,
	evidenceTemplate,
	irrigationTemplate,
	notesTemplate,
	recommendationsTemplate,
	salinityTemplate,
	sodicityTemplate,
} from "./defaultTemplate2";
import {
	DEFAULT_BRAND,
	type BrandTokens,
	type ReportRenderer,
	type ReportRenderResult,
	type ReportTemplate,
} from "./types";

const TEMPLATE_ORDER: ReportTemplate[] = [
	coverTemplate,
	executiveTemplate,
	textureTemplate,
	physicsTemplate,
	chemistryTemplate,
	salinityTemplate,
	sodicityTemplate,
	irrigationTemplate,
	agronomicTemplate,
	recommendationsTemplate,
	notesTemplate,
	evidenceTemplate,
	appendixTemplate,
];

function buildStyles(brand: BrandTokens): string {
	return `:root{
		--primary:${brand.primary};--secondary:${brand.secondary};--accent:${brand.accent};
		--warning:${brand.warning};--critical:${brand.critical};
		--bg:${brand.background};--surface:${brand.surface};
		--text:${brand.textPrimary};--muted:${brand.textMuted};
	}
	*{box-sizing:border-box}
	body{margin:0;background:var(--bg);color:var(--text);font-family:${brand.fontFamily};line-height:1.45;font-size:14px}
	.report-doc{max-width:920px;margin:24px auto;padding:24px 32px;background:var(--surface);box-shadow:0 1px 3px rgba(0,0,0,.06);border-radius:6px}
	.report-cover{border-bottom:3px solid var(--primary);padding-bottom:20px;margin-bottom:24px}
	.report-cover .brand{font-weight:700;color:var(--primary);letter-spacing:.08em;font-size:13px;text-transform:uppercase}
	.report-cover h1{margin:6px 0 16px;color:var(--primary);font-size:26px}
	.cover-meta{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 24px}
	.cover-meta>div{display:flex;flex-direction:column}
	.cover-meta span{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em}
	.cover-meta strong{color:var(--text);font-size:14px;font-weight:600}
	.report-section{margin:28px 0;page-break-inside:avoid}
	.report-section h2{color:var(--primary);font-size:18px;margin:0 0 12px;border-bottom:1px solid #e5dccd;padding-bottom:6px}
	.report-section h3{color:var(--secondary);font-size:14px;margin:14px 0 6px}
	.report-table{width:100%;border-collapse:collapse;margin:8px 0;font-size:13px}
	.report-table th{background:#f3ecdc;color:var(--primary);text-align:left;padding:6px 8px;font-weight:600;border:1px solid #e5dccd}
	.report-table td{padding:6px 8px;border:1px solid #ebe2d0}
	.rating-card{display:flex;align-items:center;gap:14px;padding:10px 14px;border-radius:6px;background:#f3ecdc;margin-bottom:10px}
	.rating-card span{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em}
	.rating-card strong{font-size:18px;color:var(--primary)}
	.rating-card .badge{margin-left:auto;background:var(--primary);color:#fff;padding:3px 8px;border-radius:999px;font-size:11px}
	.rating-excellent{background:#e7f0e3}.rating-good{background:#eef3e5}.rating-fair{background:#f5ead0}.rating-poor{background:#f5d8d8}
	.findings{margin:0;padding-left:20px}.findings li{margin:4px 0}
	.severity{display:inline-flex;flex-direction:column;padding:6px 12px;border-radius:6px;background:#f3ecdc;margin-bottom:8px}
	.severity span{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
	.severity strong{font-size:15px;color:var(--text)}
	.severity-none{background:#e7f0e3}.severity-slight{background:#eef3e5}.severity-moderate{background:#f5ead0}.severity-severe{background:#f5d8d8}.severity-extreme{background:#e8c4c4}
	.kv{display:grid;grid-template-columns:auto 1fr;gap:4px 16px;margin:8px 0}
	.kv dt{color:var(--muted);font-size:12px}.kv dd{margin:0;font-weight:500}
	.recommendation{background:#f9f3e3;border-left:3px solid var(--accent);padding:8px 12px;margin:8px 0;font-style:italic}
	.recs{list-style:none;padding:0;margin:8px 0}
	.rec{border:1px solid #ebe2d0;border-left:4px solid var(--secondary);border-radius:4px;padding:10px 12px;margin:6px 0;background:#fcfaf4}
	.rec-low{border-left-color:#a3b18a}.rec-medium{border-left-color:var(--warning)}.rec-high{border-left-color:var(--critical)}.rec-critical{border-left-color:#7b1d1d;background:#fbeee8}
	.rec header{display:flex;gap:8px;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px}
	.rec .code{font-family:monospace;color:var(--primary)}
	.rec h4{margin:2px 0 4px;font-size:14px;color:var(--primary)}
	.rec p{margin:2px 0}
	.muted{color:var(--muted);font-style:italic}
	.status-ok{color:#3F7E44}.status-warn{color:var(--warning)}.status-critical{color:var(--critical)}
	details>summary{cursor:pointer;color:var(--secondary);margin:6px 0}
	pre{background:#f3ecdc;padding:10px;border-radius:4px;overflow:auto;font-size:11px}
	@media print{body{background:#fff}.report-doc{box-shadow:none;margin:0;max-width:none}}
	`;
}

export class DefaultReportRenderer implements ReportRenderer {
	private readonly brand: BrandTokens;

	constructor(brand: BrandTokens = DEFAULT_BRAND) {
		this.brand = brand;
	}

	render(report: ProfessionalReportDTO): ReportRenderResult {
		const ctx = { report, brand: this.brand };
		const body = TEMPLATE_ORDER.map((t) => t.render(ctx)).join("\n");
		const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${report.cover.reportTitle} — ${report.cover.reportNumber}</title>
<style>${buildStyles(this.brand)}</style>
</head><body><div class="report-doc">${body}</div></body></html>`;
		return { html, bytes: Buffer.byteLength(html, "utf8") };
	}
}

export class HTMLExporter {
	readonly contentType = "text/html; charset=utf-8";
	private readonly renderer: ReportRenderer;

	constructor(renderer: ReportRenderer = new DefaultReportRenderer()) {
		this.renderer = renderer;
	}

	async export(
		report: ProfessionalReportDTO
	): Promise<{ body: string; contentType: string }> {
		const { html } = this.renderer.render(report);
		return { body: html, contentType: this.contentType };
	}
}
