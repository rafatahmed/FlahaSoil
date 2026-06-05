/**
 * FlahaSOIL v2 API — Default report template (Phase 8D E.1).
 *
 * Concrete implementations of `ReportTemplate` covering every section
 * of a `ProfessionalReportDTO`. Each template is pure; the renderer
 * assembles them in the canonical reading order:
 *
 *   cover → executive → texture → physics → chemistry → salinity →
 *   sodicity → irrigation → agronomic → recommendations → notes →
 *   appendix.
 */

import type { ReportTemplate, ReportTemplateContext } from "./types";
import { esc, fmtNum } from "./htmlEscape";

function section(title: string, body: string, id: string): string {
	return `<section id="${id}" class="report-section"><h2>${esc(title)}</h2>${body}</section>`;
}

function table(headers: string[], rows: (string | number | null)[][]): string {
	const th = headers.map((h) => `<th>${esc(h)}</th>`).join("");
	const tr = rows
		.map(
			(r) =>
				`<tr>${r
					.map((c) =>
						`<td>${typeof c === "number" ? esc(fmtNum(c)) : esc(c ?? "—")}</td>`
					)
					.join("")}</tr>`
		)
		.join("");
	return `<table class="report-table"><thead><tr>${th}</tr></thead><tbody>${tr}</tbody></table>`;
}

export const coverTemplate: ReportTemplate = {
	id: "cover",
	render({ report }: ReportTemplateContext) {
		const c = report.cover;
		return `<header class="report-cover">
			<div class="brand">FlahaSOIL</div>
			<h1>${esc(c.reportTitle)}</h1>
			<div class="cover-meta">
				<div><span>Report Number</span><strong>${esc(c.reportNumber)}</strong></div>
				<div><span>Date</span><strong>${esc(c.reportDate.slice(0, 10))}</strong></div>
				<div><span>Project</span><strong>${esc(c.projectName)}${c.projectCode ? ` (${esc(c.projectCode)})` : ""}</strong></div>
				${c.clientName ? `<div><span>Client</span><strong>${esc(c.clientName)}</strong></div>` : ""}
				${c.consultantName ? `<div><span>Consultant</span><strong>${esc(c.consultantName)}${c.consultantRole ? `, ${esc(c.consultantRole)}` : ""}</strong></div>` : ""}
				${c.location ? `<div><span>Location</span><strong>${esc(c.location)}</strong></div>` : ""}
				<div><span>Test Level</span><strong>${esc(c.testLevel)}</strong></div>
			</div>
		</header>`;
	},
};

export const executiveTemplate: ReportTemplate = {
	id: "executive",
	render({ report }) {
		const e = report.executiveSummary;
		const findings = e.headlineFindings
			.map((f) => `<li>${esc(f)}</li>`)
			.join("");
		return section(
			"Executive Summary",
			`<div class="rating-card rating-${e.overallRating.toLowerCase()}">
				<span>Overall rating</span><strong>${esc(e.overallRating)}</strong>
				<span class="badge">${e.actionItemCount} action item${e.actionItemCount === 1 ? "" : "s"}</span>
			</div>
			<ul class="findings">${findings}</ul>`,
			"executive"
		);
	},
};

export const textureTemplate: ReportTemplate = {
	id: "texture",
	render({ report }) {
		const t = report.texture;
		return section(
			"Texture",
			table(
				["USDA Class", "Sand %", "Silt %", "Clay %", "OM %"],
				[[t.usdaClass ?? null, t.sandPercent ?? null, t.siltPercent ?? null, t.clayPercent ?? null, t.organicMatterPercent ?? null]]
			),
			"texture"
		);
	},
};

export const physicsTemplate: ReportTemplate = {
	id: "physics",
	render({ report }) {
		const p = report.physics;
		return section(
			"Physical Properties",
			table(
				[
					`Field Capacity (${p.units.moisture})`,
					`Wilting Point (${p.units.moisture})`,
					`PAW (${p.units.moisture})`,
					`Bulk Density (${p.units.bulkDensity})`,
					"Porosity",
					"Saturation",
					`Ksat (${p.units.conductivity})`,
				],
				[[p.fieldCapacity ?? null, p.wiltingPoint ?? null, p.plantAvailableWater ?? null, p.bulkDensity ?? null, p.porosity ?? null, p.saturation ?? null, p.saturatedConductivity ?? null]]
			),
			"physics"
		);
	},
};

export const chemistryTemplate: ReportTemplate = {
	id: "chemistry",
	render({ report }) {
		const c = report.chemistry;
		const head = table(
			["pH", "EC (dS/m)", "OM (%)", "CEC (cmol+/kg)", "Mode"],
			[[c.pH ?? null, c.ece ?? null, c.organicMatter ?? null, c.cec ?? null, c.calculationMode ?? "—"]]
		);
		const macro = table(
			["N", "P", "K"],
			[[c.macroNutrients.n ?? null, c.macroNutrients.p ?? null, c.macroNutrients.k ?? null]]
		);
		const secondary = table(
			["Ca", "Mg", "S"],
			[[c.secondaryNutrients.ca ?? null, c.secondaryNutrients.mg ?? null, c.secondaryNutrients.s ?? null]]
		);
		const micro = table(
			["Fe", "Mn", "Zn", "Cu", "B"],
			[[c.micronutrients.fe ?? null, c.micronutrients.mn ?? null, c.micronutrients.zn ?? null, c.micronutrients.cu ?? null, c.micronutrients.b ?? null]]
		);
		return section(
			"Chemistry",
			`${head}<h3>Macronutrients</h3>${macro}<h3>Secondary</h3>${secondary}<h3>Micronutrients</h3>${micro}`,
			"chemistry"
		);
	},
};
