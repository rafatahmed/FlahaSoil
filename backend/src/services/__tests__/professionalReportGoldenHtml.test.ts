/**
 * FlahaSOIL v2 API — Phase 10A.8 golden HTML integrity lock.
 *
 * Asserts structural and scientific content of the rendered
 * ProfessionalReport HTML for each golden level. HTML is normalized
 * (dates → {{DATE}}, UUIDs → {{UUID}}, dynamic IDs → {{ID}},
 * whitespace collapsed) before assertion so cosmetic reflows never break
 * the lock. Numeric drift IS caught because normalizeNumbers is NOT
 * applied here — values like "1.42", "50.9", "0.15" must remain stable.
 *
 * Golden HTML was captured by goldenDiscovery.tmp.test.ts on 2026-06-03
 * and is now locked in place. Any failing assertion here means the Phase
 * 10A.7 rendered report output has changed — review before updating.
 */
import { describe, expect, it } from "vitest";

import {
	GOLDEN_ADVANCED,
	GOLDEN_MODERATE,
	GOLDEN_PRELIMINARY,
} from "./fixtures/goldenSoilTests";
import { normalizeProfessionalReportHtml } from "./fixtures/normalizeReportHtml";
import { runGoldenPipeline } from "./fixtures/runGoldenPipeline";

async function getHtml(test: typeof GOLDEN_PRELIMINARY): Promise<string> {
	const { html } = await runGoldenPipeline(test);
	return normalizeProfessionalReportHtml(html);
}

// Shared helper: assert a substring exists in normalized HTML.
function assertContains(html: string, fragment: string, label: string): void {
	expect(html, `HTML must contain: ${label}`).toContain(fragment);
}

describe("golden HTML — PRELIMINARY", () => {
	it("cover section", async () => {
		const h = await getHtml(GOLDEN_PRELIMINARY);
		assertContains(h, "FLH-2026-A", "report number");
		assertContains(h, "PRELIMINARY", "test level badge");
		assertContains(h, "Al Wakra Farms", "client name");
		assertContains(h, "Dr. R. Khashan", "consultant name");
		assertContains(h, "North paddock", "location");
	});

	it("executive summary section", async () => {
		const h = await getHtml(GOLDEN_PRELIMINARY);
		assertContains(h, 'id="executive"', "executive section id");
		// 65/15/20 Sandy Clay Loam EC 6.0 → Moderate salinity → Poor overall
		// BUG-10C-C-01 FIX: 65/15/20 now correctly classified as Sandy Clay Loam.
		assertContains(h, "Poor", "overall rating Poor");
		assertContains(h, "0 action items", "action item badge");
		assertContains(h, "USDA texture class: Sandy Clay Loam.", "texture headline Sandy Clay Loam");
		assertContains(h, "Salinity severity: Moderate.", "salinity headline Moderate");
	});

	it("physics section — DEFAULT trace", async () => {
		const h = await getHtml(GOLDEN_PRELIMINARY);
		assertContains(h, 'id="physics"', "physics section id");
		assertContains(h, "DEFAULT (engine fallback)", "DEFAULT trace label");
		assertContains(h, ">1.30<", "used density 1.30");
		// predicted BD for 65/15/20 OM 1.5 (Saxton-Rawls Eq.6) ≈ 1.58
		assertContains(h, ">1.58<", "predicted density 1.58");
	});

	it("chemistry section — MISSING CEC", async () => {
		const h = await getHtml(GOLDEN_PRELIMINARY);
		assertContains(h, 'id="chemistry"', "chemistry section id");
		assertContains(h, "MISSING", "cecSource MISSING");
	});

	it("salinity and sodicity sections", async () => {
		const h = await getHtml(GOLDEN_PRELIMINARY);
		// EC 6.0 → Moderate salinity severity
		assertContains(h, "Severity: Moderate", "salinity severity Moderate");
		assertContains(h, 'id="sodicity"', "sodicity section id");
	});

	it("evidence completeness section", async () => {
		const h = await getHtml(GOLDEN_PRELIMINARY);
		assertContains(h, 'id="evidence"', "evidence section id");
		assertContains(h, "Met · 100.0 %", "100% coverage badge");
		assertContains(h, "PRELIMINARY", "level label in evidence");
	});

	it("notes — chemistry skipped warning", async () => {
		const h = await getHtml(GOLDEN_PRELIMINARY);
		assertContains(h, "CHEMISTRY_SKIPPED_PRELIMINARY", "skip warning code");
		assertContains(h, "Chemistry engine output", "missing value note");
	});
});

describe("golden HTML — MODERATE", () => {
	it("cover section", async () => {
		const h = await getHtml(GOLDEN_MODERATE);
		assertContains(h, "FLH-2026-B", "report number");
		assertContains(h, "MODERATE", "test level badge");
	});

	it("chemistry — LAB cations, structure disclaimer", async () => {
		const h = await getHtml(GOLDEN_MODERATE);
		assertContains(h, ">18.0<", "CEC value");
		assertContains(h, ">LAB<", "CEC source LAB");
		assertContains(h, "11.00", "Ca cation 11");
		assertContains(h, "cmol(+)/kg", "cation unit");
		assertContains(h, "BCSR", "structure disclaimer");
		assertContains(h, "Kopittke", "disclaimer citation");
	});

	it("sodicity — computed SAR/ESP", async () => {
		const h = await getHtml(GOLDEN_MODERATE);
		assertContains(h, ">0.15<", "SAR 0.15");
		assertContains(h, ">2.22<", "ESP 2.22");
	});

	it("evidence — MODERATE Met 100 %", async () => {
		const h = await getHtml(GOLDEN_MODERATE);
		assertContains(h, "Met · 100.0 %", "100% badge");
		assertContains(h, "MODERATE", "level in evidence");
	});

	it("no warning notes for MODERATE", async () => {
		const h = await getHtml(GOLDEN_MODERATE);
		expect(h).not.toContain("CHEMISTRY_SKIPPED");
	});
});

describe("golden HTML — ADVANCED", () => {
	it("physics — USER_INPUT trace, density 1.42, clay loam Ksat", async () => {
		const h = await getHtml(GOLDEN_ADVANCED);
		assertContains(h, "USER_INPUT (lab / user provided)", "USER_INPUT label");
		assertContains(h, ">1.42<", "used density 1.42");
		assertContains(h, ">46.4<", "porosity 46.4");
		// Clay loam 35/35/30 with BD 1.42 → Ksat 8.80 (much slower than sandy loam)
		assertContains(h, ">8.80<", "Ksat 8.80");
		// predicted BD for 35/35/30 OM 1.8 ≈ 1.46
		assertContains(h, ">1.46<", "predicted density 1.46");
	});

	it("chemistry — micronutrients populated", async () => {
		const h = await getHtml(GOLDEN_ADVANCED);
		// Fe=6.5, Mn=3.2, Zn=0.8, Cu=0.6, B=0.5 from fixture
		assertContains(h, ">6.5<", "Fe 6.5");
		assertContains(h, ">3.2<", "Mn 3.2");
		assertContains(h, ">0.8<", "Zn 0.8");
	});

	it("evidence — ADVANCED Met 100 %", async () => {
		const h = await getHtml(GOLDEN_ADVANCED);
		assertContains(h, "ADVANCED", "level in evidence");
		assertContains(h, "Met · 100.0 %", "100% badge");
	});

	it("irrigation — Moderate infiltration (clay loam + BD 1.42 → Ksat 8.8)", async () => {
		const h = await getHtml(GOLDEN_ADVANCED);
		// Clay Loam 35/35/30 with USER_INPUT BD 1.42 → Ksat 8.8 → Moderate class
		assertContains(h, ">Moderate<", "infiltration Moderate");
	});
});
