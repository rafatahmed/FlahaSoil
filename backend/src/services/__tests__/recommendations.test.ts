/**
 * FlahaSOIL v2 API — recommendation engine tests (Phase 8D I.2).
 *
 * Covers the in-tree `runRecommendations` engine against the rule
 * registry. The engine itself is a pure projection over the supplied
 * `SoilReportEnvelope`, so these tests stay deterministic — each case
 * mutates a copy of the frozen fixture, drives a known set of rules,
 * and asserts on the resulting `RecommendationSetDTO`.
 *
 * Coverage:
 *   - REC-SAL-001 / REC-SOD-001 trigger together for Strong+Strong
 *     severities (already implied by composer tests; verified directly
 *     against the engine here).
 *   - REC-SAL-002 fires at Moderate salinity but REC-SAL-001 does not.
 *   - REC-TEX-002 fires for sandy textures; REC-TEX-001 does not.
 *   - REC-PH-001 (lime) and REC-PH-002 (alkalinity) are mutually
 *     exclusive.
 *   - The `REC-MON-001` baseline rule always fires, even on an empty
 *     envelope, and grouping by horizon is exhaustive.
 */
import { describe, expect, it } from "vitest";

import type { SoilReportEnvelope } from "@flaha/shared-types";

import { runRecommendations } from "../report/recommendations";
import { buildFixtureEnvelope } from "./fixtures/reportFixture";

function withInterpretation(
	patch: Partial<NonNullable<SoilReportEnvelope["interpretation"]>>
): SoilReportEnvelope {
	const base = buildFixtureEnvelope();
	return {
		...base,
		interpretation: { ...base.interpretation!, ...patch },
	};
}

function flatCodes(set: ReturnType<typeof runRecommendations>): string[] {
	return [...set.short, ...set.medium, ...set.long].map((r) => r.code);
}

describe("runRecommendations — rule matching", () => {
	it("emits SAL-001 + SOD-001 together for Strong/Strong severity inputs", () => {
		const envelope = buildFixtureEnvelope();
		const set = runRecommendations({
			envelope,
			chemistryInput: { ecDsM: 7.2 },
			textureInput: null,
		});
		const codes = flatCodes(set);
		expect(codes).toContain("REC-SAL-001");
		expect(codes).toContain("REC-SOD-001");
		// REC-SAL-001 stores the EC reading in its `context` payload.
		const sal = set.short.find((r) => r.code === "REC-SAL-001")!;
		expect(sal.context).toEqual({ ecDsM: 7.2 });
	});

	it("emits SAL-002 (watch) but NOT SAL-001 at Moderate salinity", () => {
		const envelope = withInterpretation({
			salinitySeverity: "Moderate",
			sodicitySeverity: "None",
		});
		const set = runRecommendations({
			envelope,
			chemistryInput: { ecDsM: 3.5 },
			textureInput: null,
		});
		const codes = flatCodes(set);
		expect(codes).toContain("REC-SAL-002");
		expect(codes).not.toContain("REC-SAL-001");
	});

	it("emits TEX-002 for sandy soils and NOT TEX-001 (clay)", () => {
		const base = buildFixtureEnvelope();
		const envelope: SoilReportEnvelope = {
			...base,
			physics: { ...base.physics!, textureClass: "Sand" },
			interpretation: {
				...base.interpretation!,
				salinitySeverity: "None",
				sodicitySeverity: "None",
				drainageClass: "Good",
				compactionRisk: "Low",
				organicMatterCategory: "Adequate",
				phCategory: "Neutral",
				cecLevel: "Moderate",
			},
		};
		const set = runRecommendations({
			envelope,
			chemistryInput: null,
			textureInput: null,
		});
		const codes = flatCodes(set);
		expect(codes).toContain("REC-TEX-002");
		expect(codes).not.toContain("REC-TEX-001");
	});

	it("emits PH-001 (lime) for strongly acidic and PH-002 only for alkaline (mutual exclusion)", () => {
		const acidic = runRecommendations({
			envelope: withInterpretation({ phCategory: "Strongly Acidic" }),
			chemistryInput: null,
			textureInput: null,
		});
		const acidicCodes = flatCodes(acidic);
		expect(acidicCodes).toContain("REC-PH-001");
		expect(acidicCodes).not.toContain("REC-PH-002");

		const alkaline = runRecommendations({
			envelope: withInterpretation({ phCategory: "Strongly alkaline" }),
			chemistryInput: null,
			textureInput: null,
		});
		const alkalineCodes = flatCodes(alkaline);
		expect(alkalineCodes).toContain("REC-PH-002");
		expect(alkalineCodes).not.toContain("REC-PH-001");
	});

	it("baseline REC-MON-001 always fires and groups recommendations by horizon", () => {
		const empty: SoilReportEnvelope = {
			...buildFixtureEnvelope(),
			physics: null,
			chemistry: null,
			interpretation: null,
		};
		const set = runRecommendations({
			envelope: empty,
			chemistryInput: null,
			textureInput: null,
		});

		const allHorizons = [...set.short, ...set.medium, ...set.long];
		// MON-001 has horizon=MEDIUM in the registry.
		expect(set.medium.map((r) => r.code)).toContain("REC-MON-001");
		// Every emitted recommendation must land in exactly one horizon bucket.
		expect(allHorizons.length).toBe(
			set.short.length + set.medium.length + set.long.length
		);
		// And no unexpected rule fires from an empty envelope.
		expect(allHorizons.length).toBe(1);
	});
});
