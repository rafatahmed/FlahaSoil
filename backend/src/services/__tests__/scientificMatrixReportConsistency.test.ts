/**
 * FlahaSOIL v2 API — Phase 10B Scientific Matrix Report Consistency.
 *
 * Verifies that the ProfessionalReport HTML output is internally consistent
 * with the DTO for various matrix cases (labels, severities, warnings).
 */
import { describe, expect, it } from "vitest";

import {
	MATRIX_SALINITY_SODICITY,
	MATRIX_EVIDENCE,
} from "./fixtures/scientificMatrixSoilTests";
import { normalizeProfessionalReportHtml } from "./fixtures/normalizeReportHtml";
import { runGoldenPipeline } from "./fixtures/runGoldenPipeline";

describe("scientific matrix report consistency", () => {
	it("B4: Saline-sodic report consistency (EC 12, Na=7)", async () => {
		const { dto, html } = await runGoldenPipeline(MATRIX_SALINITY_SODICITY.B4_SALINE_SODIC);
		const h = normalizeProfessionalReportHtml(html);

		// DTO checks — EC 12 dS/m -> Strong salinity; ESP 46.7 % -> Severe sodicity.
		expect(dto.salinity.severity).toBe("Strong");
		expect(dto.sodicity.severity).toBe("Severe");

		// Executive summary echoes the DTO severities verbatim.
		expect(h).toContain("Salinity severity: Strong.");
		expect(h).toContain("Sodicity severity: Severe.");

		// Dedicated assessment sections render the matching severity badges.
		expect(h).toContain('id="salinity"');
		expect(h).toContain('id="sodicity"');
		expect(h).toContain("Severity: Strong");
		expect(h).toContain("Severity: Severe");
	});

	it("F5: ADVANCED level with missing micronutrients (Partial)", async () => {
		const { dto, html } = await runGoldenPipeline(MATRIX_EVIDENCE.F5_ADVANCED_MISSING_MICROS);
		const h = normalizeProfessionalReportHtml(html);

		expect(dto.completeness?.level.status).toBe("Partial");

		// Evidence badge renders "<status> · <coverage> %".
		expect(h).toContain("Partial ·");
		// Declared level is surfaced on both the cover and the evidence block.
		expect(h).toContain("ADVANCED");
		// The micronutrients module row renders its label and Missing status.
		expect(h).toContain("Micro-nutrients");
		expect(h).toContain("Missing");
	});
});
