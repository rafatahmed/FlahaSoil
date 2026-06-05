/**
 * FlahaSOIL v2 API — composeProfessionalReport unit tests (Phase 8D I.1a).
 *
 * Pure tests against a frozen `SoilReportEnvelope` fixture. The composer
 * has no I/O, so the suite exercises the snapshot contract directly:
 *
 *   - schemaVersion === "1.0" (immutability gate)
 *   - cover composition with consultant + client overrides
 *   - executive-summary rating + headline findings derivation
 *   - recommendation triggering (salinity + sodicity → SHORT bucket)
 *   - notes section reports missing engine outputs
 *
 * The fixture is intentionally hand-built (no Prisma round-trip) so the
 * tests stay deterministic and remain valid even if Prisma row shapes
 * shift around the composer.
 */
import { describe, expect, it } from "vitest";

import {
	SoilInterpretationRating,
	SoilTestLevel,
	SoilValueSource,
	type SoilReportEnvelope,
} from "@flaha/shared-types";

import { composeProfessionalReport } from "../report/composeProfessionalReport";
import { buildFixtureEnvelope, REPORT_META } from "./fixtures/reportFixture";

const SAMPLE_ROW = {
	id: "smp_1",
	userId: "u_1",
	projectId: "p_1",
	locationName: "North paddock",
	latitude: 25.5,
	longitude: 51.5,
	sampleCode: "S-001",
};

const PROJECT_ROW = {
	id: "p_1",
	userId: "u_1",
	name: "Doha Pilot",
	code: "DOHA",
	clientName: "Al Wakra Farms",
};

const USER_ROW = { id: "u_1", displayName: "Dr. R. Khashan", role: "ADMIN" };

const CHEMISTRY_INPUT = {
	pH: 8.4,
	ecDsM: 7.2,
	organicMatter: 1.1,
	n: 12,
	p: 9,
	k: 180,
	ca: 1850,
	mg: 410,
	s: 18,
	fe: 8,
	mn: 4,
	zn: 1.2,
	cu: 0.8,
	b: 0.6,
};

const TEXTURE_INPUT = {
	sandPercent: 22,
	siltPercent: 38,
	clayPercent: 40,
	organicMatterPercent: 1.1,
	source: SoilValueSource.LAB,
};

describe("composeProfessionalReport", () => {
	it("freezes the schema version and assembles the cover from the supplied rows", () => {
		const envelope = buildFixtureEnvelope();
		const dto = composeProfessionalReport({
			envelope,
			sampleRow: SAMPLE_ROW,
			projectRow: PROJECT_ROW,
			userRow: USER_ROW,
			chemistryInputRow: CHEMISTRY_INPUT,
			textureInputRow: TEXTURE_INPUT,
			meta: REPORT_META,
		});

		expect(dto.schemaVersion).toBe("1.0");
		expect(dto.cover).toMatchObject({
			projectName: "Doha Pilot",
			projectCode: "DOHA",
			clientName: "Al Wakra Farms",
			consultantName: "Dr. R. Khashan",
			location: "North paddock",
			sampleId: "smp_1",
			sampleCode: "S-001",
			reportNumber: REPORT_META.reportNumber,
			reportTitle: REPORT_META.reportTitle,
			testLevel: SoilTestLevel.MODERATE,
		});
	});

	it("derives executive-summary headlines + action count from interpretation + recommendations", () => {
		const envelope = buildFixtureEnvelope();
		const dto = composeProfessionalReport({
			envelope,
			sampleRow: SAMPLE_ROW,
			projectRow: PROJECT_ROW,
			userRow: USER_ROW,
			chemistryInputRow: CHEMISTRY_INPUT,
			textureInputRow: TEXTURE_INPUT,
			meta: REPORT_META,
		});

		expect(dto.executiveSummary.overallRating).toBe("Fair");
		expect(dto.executiveSummary.headlineFindings.length).toBeGreaterThan(0);
		expect(dto.executiveSummary.headlineFindings.length).toBeLessThanOrEqual(5);
		expect(dto.executiveSummary.headlineFindings).toEqual(
			expect.arrayContaining([
				expect.stringContaining("Clay"),
				expect.stringContaining("Strong"),
			])
		);
		expect(dto.executiveSummary.actionItemCount).toBeGreaterThan(0);
	});

	it("triggers SHORT-horizon salinity + sodicity rules for high-severity inputs", () => {
		const envelope = buildFixtureEnvelope();
		const dto = composeProfessionalReport({
			envelope,
			sampleRow: SAMPLE_ROW,
			projectRow: PROJECT_ROW,
			userRow: USER_ROW,
			chemistryInputRow: CHEMISTRY_INPUT,
			textureInputRow: TEXTURE_INPUT,
			meta: REPORT_META,
		});

		const codes = dto.recommendations.short.map((r) => r.code);
		expect(codes).toContain("REC-SAL-001");
		expect(codes).toContain("REC-SOD-001");
		expect(dto.recommendations.long.map((r) => r.code)).toContain(
			"REC-DRN-001"
		);
	});

	it("falls back to user defaults when cover overrides are omitted", () => {
		const envelope = buildFixtureEnvelope();
		const dto = composeProfessionalReport({
			envelope,
			sampleRow: SAMPLE_ROW,
			projectRow: { ...PROJECT_ROW, clientName: undefined },
			userRow: USER_ROW,
			chemistryInputRow: CHEMISTRY_INPUT,
			textureInputRow: TEXTURE_INPUT,
			meta: { ...REPORT_META, coverOverrides: undefined },
		});

		expect(dto.cover.clientName).toBeNull();
		expect(dto.cover.consultantName).toBe("Dr. R. Khashan");
	});

	it("reports missing engine outputs through the notes section", () => {
		const envelope: SoilReportEnvelope = {
			...buildFixtureEnvelope(),
			chemistry: null,
			interpretation: null,
		};
		const dto = composeProfessionalReport({
			envelope,
			sampleRow: SAMPLE_ROW,
			projectRow: PROJECT_ROW,
			userRow: USER_ROW,
			chemistryInputRow: null,
			textureInputRow: TEXTURE_INPUT,
			meta: REPORT_META,
		});

		expect(dto.notes.missingValues).toEqual(
			expect.arrayContaining(["Chemistry engine output", "Interpretation output"])
		);
		expect(dto.executiveSummary.overallRating).toBe("Fair");
		// With interpretation missing the rating defaults to FAIR via the
		// composer's mapOverallRating fallback.
		void SoilInterpretationRating;
	});
});
