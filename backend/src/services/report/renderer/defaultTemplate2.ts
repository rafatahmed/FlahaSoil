/**
 * FlahaSOIL v2 API — Default report templates (Phase 8D E.1, part 2).
 *
 * Continuation of `defaultTemplate.ts` covering the back-half sections:
 * salinity, sodicity, irrigation, agronomic, recommendations, notes,
 * appendix. Kept in a second file purely to honour the per-file size
 * convention.
 */

import type { ReportTemplate } from "./types";
import { esc, fmtNum } from "./htmlEscape";

function section(title: string, body: string, id: string): string {
	return `<section id="${id}" class="report-section"><h2>${esc(title)}</h2>${body}</section>`;
}

export const salinityTemplate: ReportTemplate = {
	id: "salinity",
	render({ report }) {
		const s = report.salinity;
		return section(
			"Salinity Assessment",
			`<div class="severity severity-${s.severity.toLowerCase()}">
				<span>Severity</span><strong>${esc(s.severity)}</strong>
			</div>
			<dl class="kv">
				<dt>Risk</dt><dd>${esc(s.riskLabel)}</dd>
				<dt>ECe (dS/m)</dt><dd>${esc(fmtNum(s.ece ?? null))}</dd>
			</dl>
			<p class="recommendation">${esc(s.recommendation)}</p>`,
			"salinity"
		);
	},
};

export const sodicityTemplate: ReportTemplate = {
	id: "sodicity",
	render({ report }) {
		const s = report.sodicity;
		return section(
			"Sodicity Assessment",
			`<div class="severity severity-${s.severity.toLowerCase()}">
				<span>Severity</span><strong>${esc(s.severity)}</strong>
			</div>
			<dl class="kv">
				<dt>Risk</dt><dd>${esc(s.riskLabel)}</dd>
				<dt>SAR</dt><dd>${esc(fmtNum(s.sar ?? null))}</dd>
				<dt>ESP (%)</dt><dd>${esc(fmtNum(s.esp ?? null))}</dd>
			</dl>
			<p class="recommendation">${esc(s.recommendation)}</p>`,
			"sodicity"
		);
	},
};

export const irrigationTemplate: ReportTemplate = {
	id: "irrigation",
	render({ report }) {
		const i = report.irrigation;
		const notes = i.notes.length
			? `<ul>${i.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`
			: '<p class="muted">No irrigation flags raised.</p>';
		return section(
			"Irrigation Implications",
			`<dl class="kv">
				<dt>Infiltration</dt><dd>${esc(i.infiltrationClass ?? "—")}</dd>
				<dt>Drainage</dt><dd>${esc(i.drainageClass ?? "—")}</dd>
				<dt>Water holding</dt><dd>${esc(i.waterHoldingClass ?? "—")}</dd>
				<dt>Leaching requirement</dt><dd>${esc(fmtNum(i.leachingRequirement ?? null, 2))}</dd>
			</dl>${notes}`,
			"irrigation"
		);
	},
};

export const agronomicTemplate: ReportTemplate = {
	id: "agronomic",
	render({ report }) {
		const a = report.agronomic;
		const rows = a.categories
			.map(
				(c) =>
					`<tr><td>${esc(c.label)}</td><td>${esc(c.value)}</td><td class="status-${esc(c.status)}">${esc(c.status)}</td></tr>`
			)
			.join("");
		const suit = Object.entries(a.suitability)
			.filter(([, v]) => v !== undefined)
			.map(
				([k, v]) =>
					`<tr><td>${esc(k)}</td><td>${esc(v!.verdict)}</td><td>${esc(v!.reasons.join("; "))}</td></tr>`
			)
			.join("");
		return section(
			"Agronomic Interpretation",
			`<table class="report-table"><thead><tr><th>Category</th><th>Value</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
			${suit ? `<h3>Suitability Matrix</h3><table class="report-table"><thead><tr><th>Use</th><th>Verdict</th><th>Reasons</th></tr></thead><tbody>${suit}</tbody></table>` : ""}`,
			"agronomic"
		);
	},
};

export const recommendationsTemplate: ReportTemplate = {
	id: "recommendations",
	render({ report }) {
		const r = report.recommendations;
		const renderGroup = (label: string, items: typeof r.short) => {
			if (!items.length) return "";
			const li = items
				.map(
					(it) =>
						`<li class="rec rec-${it.severity.toLowerCase()}">
							<header><span class="code">${esc(it.code)}</span><span class="cat">${esc(it.category)}</span><span class="sev">${esc(it.severity)}</span></header>
							<h4>${esc(it.title)}</h4>
							<p>${esc(it.body)}</p>
							${it.bullets ? `<ul>${it.bullets.map((b) => `<li>${esc(b)}</li>`).join("")}</ul>` : ""}
						</li>`
				)
				.join("");
			return `<h3>${esc(label)}</h3><ul class="recs">${li}</ul>`;
		};
		return section(
			"Recommendations",
			`${renderGroup("Short-term", r.short)}${renderGroup("Medium-term", r.medium)}${renderGroup("Long-term", r.long)}`,
			"recommendations"
		);
	},
};

export const notesTemplate: ReportTemplate = {
	id: "notes",
	render({ report }) {
		const n = report.notes;
		const wl = (label: string, items: string[]) =>
			items.length
				? `<h3>${esc(label)}</h3><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>`
				: "";
		const warns = n.calculationWarnings.length
			? `<h3>Calculation warnings</h3><ul>${n.calculationWarnings
					.map((w) => `<li><strong>${esc(w.code)}</strong>: ${esc(w.message)}</li>`)
					.join("")}</ul>`
			: "";
		return section(
			"Notes & Warnings",
			`${wl("Missing values", n.missingValues)}${wl("Estimated values", n.estimatedValues)}${warns}` ||
				'<p class="muted">No notes recorded.</p>',
			"notes"
		);
	},
};

export const appendixTemplate: ReportTemplate = {
	id: "appendix",
	render({ report }) {
		const a = report.appendix;
		return section(
			"Appendix",
			`<p>${esc(a.calculationSummary)}</p>
			<details><summary>Inputs (JSON)</summary><pre>${esc(JSON.stringify(a.inputs, null, 2))}</pre></details>`,
			"appendix"
		);
	},
};
