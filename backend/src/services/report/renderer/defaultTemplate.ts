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

import type { QuantityKind } from "@flaha/shared-types";

type Cell = string | number | null | { value: number | null; kind: QuantityKind };

function renderCell(c: Cell): string {
	if (c === null || c === undefined) return `<td>${esc("—")}</td>`;
	if (typeof c === "number") return `<td>${esc(fmtNum(c))}</td>`;
	if (typeof c === "string") return `<td>${esc(c)}</td>`;
	return `<td>${esc(fmtNum(c.value, c.kind))}</td>`;
}

function table(headers: string[], rows: Cell[][]): string {
	const th = headers.map((h) => `<th>${esc(h)}</th>`).join("");
	const tr = rows
		.map((r) => `<tr>${r.map(renderCell).join("")}</tr>`)
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
		// Phase 10A.7 R2 (B1) — main table reports the OPERATIONAL bulk
		// density (ρDF / `bulkDensityTrace.used`), the value actually
		// substituted into every density-coupled equation (porosity,
		// saturation, Ksat). The Saxton-Rawls predicted ρN is exposed
		// separately in the traceability block below so the two are
		// never conflated; legacy snapshots without a trace fall back to
		// the persisted scalar.
		const trace = p.bulkDensityTrace;
		const usedBd = trace?.used ?? p.bulkDensity ?? null;
		// Phase 10A.7 (B2) — water content is persisted as % v/v (the
		// engine multiplies θ by 100 in `formatResultsByPlan`). Every
		// header now spells out its unit so a reader cannot confuse
		// "37" with the volumetric-fraction "0.37".
		const main = table(
			[
				`Field Capacity (${p.units.moisture})`,
				`Wilting Point (${p.units.moisture})`,
				`PAW (${p.units.moisture})`,
				`Bulk Density used (${p.units.bulkDensity})`,
				`Porosity (${p.units.porosity})`,
				`Saturation (${p.units.saturation})`,
				`Ksat (${p.units.conductivity})`,
			],
			[[
				{ value: p.fieldCapacity ?? null, kind: "waterContent" },
				{ value: p.wiltingPoint ?? null, kind: "waterContent" },
				{ value: p.plantAvailableWater ?? null, kind: "waterContent" },
				{ value: usedBd, kind: "bulkDensity" },
				{ value: p.porosity ?? null, kind: "waterContent" },
				{ value: p.saturation ?? null, kind: "waterContent" },
				{ value: p.saturatedConductivity ?? null, kind: "conductivity" },
			]]
		);
		// Phase 10A.7 (B3 / R2-B1) — Bulk-density traceability block.
		// Always shown when a trace exists; surfaces Used (ρDF) +
		// Predicted (ρN) + Source so a reader can verify the report
		// never silently promotes the predicted value to the operating
		// value used downstream.
		const traceTable = trace
			? `<dl class="kv">
					<dt>Bulk density used (ρDF, g/cm³)</dt><dd>${esc(fmtNum(trace.used, "bulkDensity"))}</dd>
					<dt>Bulk density source</dt><dd>${esc(sourceLabel(trace.source))}</dd>
					<dt>Predicted bulk density (ρN, g/cm³)</dt><dd>${esc(fmtNum(trace.predicted, "bulkDensity"))}</dd>
				</dl>`
			: "";
		const traceNote = trace
			? `<p class="muted">Used (ρDF) is the value substituted into every density-coupled equation (porosity, saturation, Ksat). Predicted (ρN) is the Saxton-Rawls 2006 Eq. 6 texture-OM estimate, shown for traceability only. Source declares whether the engine accepted a USER_INPUT or fell back to a DEFAULT.</p>`
			: "";
		return section(
			"Physical Properties",
			`${main}${trace ? `<h3>Bulk density traceability</h3>${traceTable}${traceNote}` : ""}`,
			"physics"
		);
	},
};

function sourceLabel(source: "USER_INPUT" | "DEFAULT" | "UNKNOWN"): string {
	if (source === "USER_INPUT") return "USER_INPUT (lab / user provided)";
	if (source === "DEFAULT") return "DEFAULT (engine fallback)";
	return "UNKNOWN (trace unavailable)";
}

function cecSourceBanner(
	source: "LAB" | "DERIVED_CATION_SUM" | "ESTIMATED" | "MISSING" | undefined
): string {
	// Phase 10A.7 (B5) — CEC provenance disclosure. The report must
	// never silently promote a derived cation-sum or texture-estimated
	// CEC to a lab measurement; a Provisional banner is rendered for
	// any non-LAB source.
	if (!source || source === "LAB") return "";
	const label =
		source === "DERIVED_CATION_SUM"
			? "Derived from sum of base cations (LAB mode without a measured CEC)."
			: source === "ESTIMATED"
			? "Estimated from clay × 0.5 + organic matter × 2 (ESTIMATED mode)."
			: "No chemistry result was produced.";
	return `<p class="severity severity-moderate"><strong>Provisional CEC</strong> — ${esc(label)}</p>`;
}

export const chemistryTemplate: ReportTemplate = {
	id: "chemistry",
	render({ report }) {
		const c = report.chemistry;
		const head = table(
			["pH", "EC (dS/m)", "OM (%)", "CEC (cmol(+)/kg)", "CEC source", "Mode"],
			[[
				{ value: c.pH ?? null, kind: "pH" },
				{ value: c.ece ?? null, kind: "ec" },
				{ value: c.organicMatter ?? null, kind: "percent" },
				{ value: c.cec ?? null, kind: "cec" },
				c.cecSource ?? "—",
				c.calculationMode ?? "—",
			]]
		);
		const macro = table(
			["N (mg/kg)", "P (mg/kg)", "K (mg/kg)"],
			[[
				{ value: c.macroNutrients.n ?? null, kind: "nutrientMgKg" },
				{ value: c.macroNutrients.p ?? null, kind: "nutrientMgKg" },
				{ value: c.macroNutrients.k ?? null, kind: "nutrientMgKg" },
			]]
		);
		// Phase 10A.7 (B4) — Ca/Mg have moved out of "secondary nutrients"
		// because the chemistry input row stores them as EXCHANGEABLE
		// cations in cmol(+)/kg, not as plant-available mg/kg. Only S
		// remains in the mg/kg secondary block.
		const secondary = table(
			["S (mg/kg)"],
			[[{ value: c.secondaryNutrients.s ?? null, kind: "nutrientMgKg" }]]
		);
		const exch = c.exchangeableCations;
		const exchangeable = exch
			? table(
					[
						`Ca (${exch.unit})`,
						`Mg (${exch.unit})`,
						`K (${exch.unit})`,
						`Na (${exch.unit})`,
					],
					[[
						{ value: exch.ca ?? null, kind: "cation" },
						{ value: exch.mg ?? null, kind: "cation" },
						{ value: exch.k ?? null, kind: "cation" },
						{ value: exch.na ?? null, kind: "cation" },
					]]
			  )
			: "";
		const micro = table(
			["Fe (mg/kg)", "Mn (mg/kg)", "Zn (mg/kg)", "Cu (mg/kg)", "B (mg/kg)"],
			[[
				{ value: c.micronutrients.fe ?? null, kind: "micronutrientMgKg" },
				{ value: c.micronutrients.mn ?? null, kind: "micronutrientMgKg" },
				{ value: c.micronutrients.zn ?? null, kind: "micronutrientMgKg" },
				{ value: c.micronutrients.cu ?? null, kind: "micronutrientMgKg" },
				{ value: c.micronutrients.b ?? null, kind: "micronutrientMgKg" },
			]]
		);
		// Phase 10A.7 (WS5 — R3) — render the Bear/Albrecht (BCSR) disclaimer
		// under the "CEC structure triangle" heading when the composer has
		// attached it (i.e., at least one of Ca / Mg / K is present).
		const structureBlock = c.structureDisclaimer
			? `<h3>CEC structure triangle</h3><p class="muted">${esc(c.structureDisclaimer)}</p>`
			: "";
		return section(
			"Chemistry",
			`${cecSourceBanner(c.cecSource)}${head}` +
				`${exchangeable ? `<h3>Exchangeable Cations</h3>${exchangeable}` : ""}` +
				`<h3>Macronutrients</h3>${macro}` +
				`<h3>Secondary</h3>${secondary}` +
				`<h3>Micronutrients</h3>${micro}` +
				structureBlock,
			"chemistry"
		);
	},
};
