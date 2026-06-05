/**
 * FlahaSOIL v2 API — frozen `SoilReportEnvelope` fixture for the
 * Phase 8D test suites. The fixture is deliberately tuned to trigger
 * multiple recommendation rules at once (strong salinity + strong
 * sodicity + poor drainage + clay texture + low organic matter) so the
 * composer + recommendation engine paths get full coverage from a
 * single envelope.
 *
 * The shape mirrors `SoilReportEnvelope` from `@flaha/shared-types`
 * verbatim; tests should treat the returned object as immutable.
 */

import {
	SoilInterpretationRating,
	SoilTestLevel,
	SoilValueSource,
	type SoilReportEnvelope,
} from "@flaha/shared-types";

export const REPORT_META = {
	reportNumber: "FLH-2026-001",
	reportTitle: "North paddock — MODERATE report",
	reportDate: "2026-06-03T00:00:00.000Z",
	coverOverrides: {
		clientName: "Al Wakra Farms",
		consultantName: "Dr. R. Khashan",
		consultantRole: "Soil scientist",
	},
};

export function buildFixtureEnvelope(): SoilReportEnvelope {
	const ts = "2026-06-03T00:00:00.000Z";
	return {
		sample: {
			id: "smp_1",
			userId: "u_1",
			projectId: "p_1",
			locationName: "North paddock",
			latitude: 25.5,
			longitude: 51.5,
			depthFromCm: 0,
			depthToCm: 30,
			sampleDate: ts,
			createdAt: ts,
			updatedAt: ts,
		},
		test: {
			id: "st_1",
			sampleId: "smp_1",
			testLevel: SoilTestLevel.MODERATE,
			labName: "Doha Soil Lab",
			labReference: "DSL-001",
			testDate: ts,
			notes: null,
			createdAt: ts,
			updatedAt: ts,
		},
		physics: {
			id: "phy_1",
			soilTestId: "st_1",
			fieldCapacity: 0.34,
			wiltingPoint: 0.18,
			plantAvailableWater: 0.16,
			saturation: 0.46,
			saturatedConductivity: 4.2,
			textureClass: "Clay",
			bulkDensity: 1.32,
			porosity: 0.5,
			calculationVersion: "v2.0.0",
			createdAt: ts,
			updatedAt: ts,
		},
		chemistry: {
			id: "che_1",
			soilTestId: "st_1",
			cec: 18.4,
			baseSaturation: 92,
			caPercent: 62,
			mgPercent: 18,
			kPercent: 4.5,
			naPercent: 9,
			esp: 14.5,
			sar: 13.2,
			cationBalanceOther: 6.5,
			calculationMode: "LAB",
			createdAt: ts,
			updatedAt: ts,
		},
		interpretation: {
			id: "int_1",
			soilTestId: "st_1",
			phCategory: "Strongly alkaline",
			salinityRisk: "High",
			cecLevel: "Moderate",
			baseSaturationCategory: "Adequate",
			cationBalance: "Sodium-biased",
			sodiumRisk: "High",
			waterHoldingClass: "High",
			drainageClass: "Poor",
			overallSoilRating: SoilInterpretationRating.FAIR,
			warningsJson: ["High salinity reduces yield."],
			salinitySeverity: "Strong",
			sodicitySeverity: "Strong",
			organicMatterCategory: "Low",
			infiltrationClass: "Slow",
			compactionRisk: "Moderate",
			textureSuitabilityJson: {
				turfgrass: { verdict: "Marginal", reasons: ["High clay content"] },
				landscape: { verdict: "Marginal", reasons: ["Slow infiltration"] },
				agriculture: { verdict: "Suitable", reasons: ["Adequate CEC"] },
				irrigation: { verdict: "Marginal", reasons: ["Poor drainage"] },
			},
			createdAt: ts,
			updatedAt: ts,
		},
		warnings: ["High salinity reduces yield."],
		warningDetails: [
			{
				code: "INTERPRETATION_WARNING",
				severity: "warning",
				message: "High salinity reduces yield.",
			},
		],
		auditTrace: {
			physicsTrace: { step: "fc-from-pttr", value: 0.34 },
			chemistryInputsUsed: { pH: 8.4, ecDsM: 7.2 },
			skippedModules: [],
		},
		metadata: {
			generatedAt: ts,
			version: "v2.0.0",
			calculationMode: "LAB",
			testLevel: SoilTestLevel.MODERATE,
		},
	};
}

// Re-export to keep import noise in the test files low.
export { SoilTestLevel, SoilInterpretationRating, SoilValueSource };
