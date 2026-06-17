/**
 * FlahaSOIL v2 — ScientificAnalysisPanel smoke (Phase 10S).
 *
 * Regression coverage for the Phase 10A visualisation panel. Mocks the
 * API client with a canonical sandy-loam payload (sand 60 / silt 25 /
 * clay 15, OM 2.5, BD 1.4, Ca 11 / Mg 3 / K 0.6) — the same fixture the
 * Phase 10S backend smoke runs against — and asserts that all three
 * SVG charts (texture triangle, water-retention curve, structure
 * triangle) actually render with their data-driven anchors.
 */
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ScientificAnalysisPanel } from "../ScientificAnalysisPanel";
import * as apiClientProvider from "../../../../services/apiClientProvider";
import type { ApiV2Client } from "../../../../services/apiV2Client";

const FIXTURE = {
	soilTestId: "smoke-test-1",
	texture: {
		sand: 60, silt: 25, clay: 15,
		derived: null, sumOk: true, sumDelta: 0,
		normalized: { sand: 60, silt: 25, clay: 15 },
		point: { x: 0.325, y: 0.7361215932167728 },
		classification: "Sandy Loam",
		matched: true,
	},
	waterRetention: {
		method: "saxton-rawls-2006" as const,
		textureClass: "Sandy Loam",
		points: [
			{ pF: 0, tensionKpa: 0.098, waterContentVolPercent: 47.17 },
			{ pF: 2, tensionKpa: 9.81, waterContentVolPercent: 46.5 },
			{ pF: 2.53, tensionKpa: 33.23, waterContentVolPercent: 18.29 },
			{ pF: 3, tensionKpa: 98.07, waterContentVolPercent: 14.92 },
			{ pF: 4, tensionKpa: 980.66, waterContentVolPercent: 9.68 },
			{ pF: 4.18, tensionKpa: 1484.29, waterContentVolPercent: 8.96 },
		],
		saturation: { pF: 0, tensionKpa: 0, waterContentVolPercent: 47.17, label: "Saturation" },
		fieldCapacity: { pF: 2.53, tensionKpa: 33, waterContentVolPercent: 18.31, label: "FC" },
		wiltingPoint: { pF: 4.18, tensionKpa: 1500, waterContentVolPercent: 8.94, label: "WP" },
		irrigationThreshold: { pF: 3.21, tensionKpa: 159.13, waterContentVolPercent: 13.63, label: "MAD 50%" },
		plantAvailableWater: 9.38,
		madFraction: 0.5,
		airEntryTensionKpa: 9.53,
		parameterA: 0.00395,
		parameterB: -5.32,
		// Phase 10A.7 (WS1 / WS2) — units + bulk-density traceability.
		units: {
			waterContent: "% v/v" as const,
			tension: "kPa" as const,
			plantAvailableWater: "% v/v" as const,
		},
		bulkDensity: {
			predicted: 1.4,
			used: 1.4,
			source: "USER_INPUT" as const,
			unit: "g/cm³" as const,
		},
	},
	structure: {
		ca: 11, mg: 3, k: 0.6, na: 0.4, cec: 18,
		normalized: { ca: 75.34, mg: 20.55, k: 4.11 },
		point: { x: 58.22, y: 21.35 },
		classification: "Balanced",
		matched: true,
		caMgRatio: 3.67, caKRatio: 18.33, mgKRatio: 5, basesTotal: 14.6,
		// Phase 10A.7 (WS5 — R3) — unit + Bear/Albrecht caveat.
		unit: "cmol(+)/kg" as const,
		disclaimer:
			"Bear/Albrecht (BCSR) cation balance is a diagnostic visualisation only.",
	},
	warnings: [] as string[],
};

const stubClient: Partial<ApiV2Client> = {
	getScientificAnalysis: vi.fn(async () => structuredClone(FIXTURE)),
};

vi.spyOn(apiClientProvider, "getApiClient").mockReturnValue(stubClient as ApiV2Client);

afterEach(() => {
	vi.clearAllMocks();
});

describe("ScientificAnalysisPanel", () => {
	it("renders all three SVG charts after the API resolves", async () => {
		const { container } = render(<ScientificAnalysisPanel soilTestId="smoke-test-1" />);

		// Loading state first — CircularProgress, no panel testid yet.
		expect(screen.queryByTestId("scientific-analysis-panel")).toBeNull();

		await waitFor(() =>
			expect(screen.getByTestId("scientific-analysis-panel")).toBeTruthy(),
		);

		// All three card titles are present.
		expect(screen.getByText("USDA texture triangle")).toBeTruthy();
		expect(screen.getByText("Water-retention curve")).toBeTruthy();
		expect(screen.getByText("CEC structure triangle")).toBeTruthy();

		// All three SVGs rendered with non-empty content.
		const svgs = Array.from(container.querySelectorAll("svg"));
		expect(svgs.length).toBeGreaterThanOrEqual(3);
		for (const svg of svgs) {
			expect(svg.getAttribute("viewBox")).toBeTruthy();
		}

		// Each chart's data-driven anchor exists.
		expect(screen.getByTestId("texture-point")).toBeTruthy();
		expect(screen.getByTestId("retention-curve")).toBeTruthy();
		expect(screen.getByTestId("structure-point")).toBeTruthy();

		// The retention path has a real polyline (non-empty `d`).
		const path = screen.getByTestId("retention-curve") as unknown as SVGPathElement;
		const d = path.getAttribute("d") ?? "";
		expect(d.length).toBeGreaterThan(10);
		expect(d.startsWith("M")).toBe(true);

		// Captions / chips with engine-derived values.
		expect(screen.getByText(/Classification: Sandy Loam/)).toBeTruthy();
		expect(screen.getByText(/PAW = 9\.4 % v\/v · MAD 50 % · Sandy Loam/)).toBeTruthy();
		expect(screen.getByText("Balanced")).toBeTruthy();
		// Phase 10A.7 (WS2 + WS5) — traceability + disclaimer surfaces.
		expect(screen.getByTestId("bulk-density-trace")).toBeTruthy();
		expect(screen.getByTestId("structure-disclaimer")).toBeTruthy();
	});

	it("shows a friendly empty-state when waterRetention is null", async () => {
		(stubClient.getScientificAnalysis as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
			...FIXTURE,
			waterRetention: null,
			warnings: ["Water-retention curve unavailable — texture inputs missing"],
		});

		render(<ScientificAnalysisPanel soilTestId="smoke-test-2" />);

		await waitFor(() =>
			expect(screen.getByTestId("scientific-analysis-panel")).toBeTruthy(),
		);
		expect(
			screen.getByText(/No retention curve — sand & clay percentages required\./),
		).toBeTruthy();
		expect(screen.getByTestId("scientific-analysis-warnings")).toBeTruthy();
	});
});
