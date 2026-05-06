/**
 * Unit tests for the pure report-assembly helpers.
 *
 * `reportAssembler.ts` has no Prisma dependency, so these tests run
 * against in-memory record-shaped objects that mirror what
 * `report.service.ts` extracts from the database.
 */
import { describe, expect, it } from "vitest";

import {
	buildAuditTrace,
	deriveWarningDetails,
} from "../reportAssembler";

const PHYSICS_WITH_TRACE = {
	calculationTraceJson: { step: "fc-from-pttr", value: 0.28 },
};

describe("reportAssembler.buildAuditTrace", () => {
	it("captures the verbatim physics trace when present", () => {
		const trace = buildAuditTrace({
			chemistryInput: null,
			textureInput: null,
			physicsRow: PHYSICS_WITH_TRACE,
			chemistryRow: null,
		});
		expect(trace.physicsTrace).toEqual({ step: "fc-from-pttr", value: 0.28 });
	});

	it("returns null physics trace when none was persisted", () => {
		const trace = buildAuditTrace({
			chemistryInput: null,
			textureInput: null,
			physicsRow: null,
			chemistryRow: null,
		});
		expect(trace.physicsTrace).toBeNull();
		expect(trace.skippedModules).toEqual([]);
	});

	it("flags chemistry as skipped when chemistry input has no CEC and no cations", () => {
		const trace = buildAuditTrace({
			chemistryInput: { pH: 7.2, ecDsM: 1.5, tdsMgL: null },
			textureInput: null,
			physicsRow: null,
			chemistryRow: null,
		});
		expect(trace.skippedModules).toHaveLength(1);
		expect(trace.skippedModules[0]?.module).toBe("chemistry");
		expect(trace.skippedModules[0]?.reason).toMatch(/PRELIMINARY-style/);
	});

	it("does not flag a skip when a chemistry result row is present", () => {
		const trace = buildAuditTrace({
			chemistryInput: { pH: 7.2 },
			textureInput: null,
			physicsRow: null,
			chemistryRow: { id: "cr_1" },
		});
		expect(trace.skippedModules).toEqual([]);
	});

	it("replays salinity normalization for TDS-only chemistry input", () => {
		const trace = buildAuditTrace({
			chemistryInput: { tdsMgL: 1280 },
			textureInput: null,
			physicsRow: null,
			chemistryRow: null,
		});
		const sal = trace.normalizedInputs?.salinity;
		expect(sal?.derivedFromTds).toBe(true);
		expect(sal?.ecDsM).toBeCloseTo(2);
		expect(sal?.tdsMgL).toBe(1280);
	});

	it("flags inconsistent EC + TDS via the salinity warning", () => {
		const trace = buildAuditTrace({
			chemistryInput: { ecDsM: 1, tdsMgL: 2000 },
			textureInput: null,
			physicsRow: null,
			chemistryRow: null,
		});
		expect(trace.normalizedInputs?.salinity?.warnings).toContain(
			"TDS inconsistent with EC; EC used as primary"
		);
	});
});

describe("reportAssembler.deriveWarningDetails", () => {
	it("emits CHEMISTRY_SKIPPED_PRELIMINARY when chemistry was skipped on a PRELIMINARY-style input", () => {
		const trace = buildAuditTrace({
			chemistryInput: { pH: 7.2, ecDsM: 1.5 },
			textureInput: null,
			physicsRow: null,
			chemistryRow: null,
		});
		const details = deriveWarningDetails({
			auditTrace: trace,
			interpretationWarnings: [],
		});
		const codes = details.map((w) => w.code);
		expect(codes).toContain("CHEMISTRY_SKIPPED_PRELIMINARY");
	});

	it("emits TDS_INCONSISTENT_WITH_EC plus EC_DERIVED_FROM_TDS as appropriate", () => {
		const trace = buildAuditTrace({
			chemistryInput: { ecDsM: 1, tdsMgL: 2000 },
			textureInput: null,
			physicsRow: null,
			chemistryRow: { id: "cr_1" },
		});
		const details = deriveWarningDetails({
			auditTrace: trace,
			interpretationWarnings: [],
		});
		const codes = details.map((w) => w.code);
		expect(codes).toContain("TDS_INCONSISTENT_WITH_EC");
		// EC was supplied directly, so no EC_DERIVED_FROM_TDS expected.
		expect(codes).not.toContain("EC_DERIVED_FROM_TDS");
	});

	it("passes through interpretation warnings as INTERPRETATION_WARNING", () => {
		const trace = buildAuditTrace({
			chemistryInput: null,
			textureInput: null,
			physicsRow: null,
			chemistryRow: null,
		});
		const details = deriveWarningDetails({
			auditTrace: trace,
			interpretationWarnings: ["High salinity reduces yield."],
		});
		expect(details).toHaveLength(1);
		expect(details[0]?.code).toBe("INTERPRETATION_WARNING");
		expect(details[0]?.message).toBe("High salinity reduces yield.");
	});

	it("emits no warnings for a clean test", () => {
		const trace = buildAuditTrace({
			chemistryInput: { ecDsM: 1, tdsMgL: 640 },
			textureInput: null,
			physicsRow: PHYSICS_WITH_TRACE,
			chemistryRow: { id: "cr_1" },
		});
		const details = deriveWarningDetails({
			auditTrace: trace,
			interpretationWarnings: [],
		});
		expect(details).toEqual([]);
	});
});
