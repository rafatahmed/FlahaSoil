/**
 * FlahaSOIL v2 — ChemistryResultCard level-aware empty-state tests
 * (Phase 10A.7 Correction).
 *
 * Locks in the audit-correction promise: a PRELIMINARY test that
 * submits only pH + EC must never render the legacy "No chemistry
 * result yet" message. Instead it surfaces a level-aware caption
 * plus the salinity inputs inline. MODERATE / ADVANCED tests without
 * a calculated cation panel still see an action-oriented prompt that
 * names the missing analytes.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
	SoilTestLevel,
	SoilValueSource,
	type SoilChemistryInputDTO,
} from "@flaha/shared-types";

import { ChemistryResultCard } from "../ChemistryResultCard";

const NOW = "2026-06-12T12:00:00.000Z";

function chemInput(
	overrides: Partial<SoilChemistryInputDTO> = {}
): SoilChemistryInputDTO {
	return {
		id: "chin_prelim_1",
		soilTestId: "st_prelim_1",
		pH: 7.2,
		ecDsM: 1.0,
		source: SoilValueSource.LAB,
		createdAt: NOW,
		updatedAt: NOW,
		...overrides,
	};
}

describe("ChemistryResultCard — PRELIMINARY empty-state", () => {
	it("does not show the legacy 'No chemistry result yet' message", () => {
		render(
			<ChemistryResultCard
				result={null}
				testLevel={SoilTestLevel.PRELIMINARY}
				chemistryInput={chemInput()}
			/>
		);
		expect(screen.queryByText(/No chemistry result yet/i)).toBeNull();
	});

	it("surfaces a level-aware caption and the submitted salinity panel", () => {
		render(
			<ChemistryResultCard
				result={null}
				testLevel={SoilTestLevel.PRELIMINARY}
				chemistryInput={chemInput({ tdsMgL: 640 })}
			/>
		);
		expect(screen.getByTestId("chemistry-empty-preliminary")).toBeTruthy();
		expect(
			screen.getByText(/not required at the Preliminary test level/i)
		).toBeTruthy();
		expect(screen.getByText("pH (1:5 water)")).toBeTruthy();
		expect(screen.getByText("EC (dS/m)")).toBeTruthy();
		expect(screen.getByText("TDS (mg/L)")).toBeTruthy();
		expect(screen.getByText("Level: PRELIMINARY")).toBeTruthy();
	});

	it("prompts the lab to submit salinity inputs when none arrived", () => {
		render(
			<ChemistryResultCard
				result={null}
				testLevel={SoilTestLevel.PRELIMINARY}
				chemistryInput={null}
			/>
		);
		expect(
			screen.getByText(/No salinity inputs submitted yet/i)
		).toBeTruthy();
	});
});

describe("ChemistryResultCard — MODERATE empty-state", () => {
	it("asks for the cation panel and names the declared level", () => {
		render(
			<ChemistryResultCard
				result={null}
				testLevel={SoilTestLevel.MODERATE}
				chemistryInput={chemInput()}
			/>
		);
		const node = screen.getByTestId("chemistry-empty-moderate");
		expect(node.textContent ?? "").toMatch(
			/Cation panel results not yet calculated/
		);
		expect(node.textContent ?? "").toMatch(/MODERATE evidence contract/);
		expect(screen.queryByText(/No chemistry result yet/i)).toBeNull();
	});
});
