/**
 * @flaha/soil-chemistry — public type contracts.
 *
 * Units (locked by the spec, do NOT silently convert):
 *   - Cation concentrations (`ca`, `mg`, `k`, `na`)  : cmol(+)/kg
 *   - Cation Exchange Capacity (`cec`)               : cmol(+)/kg
 *   - Texture inputs (`sand`, `clay`, `organicMatter`) : percent (0–100)
 *   - Electrical conductivity (`ec`)                  : dS/m
 *   - pH                                              : dimensionless (0–14)
 *
 * The engine never mutates inputs and never reads ambient state.
 */

/** Selects whether the engine derives CEC from texture or from cations. */
export type SoilChemistryMode = "LAB" | "ESTIMATED";

/**
 * Input contract for `calculateSoilChemistry`.
 *
 * - `mode === "LAB"`  : `cec` is taken from input when present, otherwise
 *                       derived as `ca + mg + k + na`. At least the four
 *                       cations or `cec` must be supplied.
 * - `mode === "ESTIMATED"` : `clay` and `organicMatter` are required and
 *                       `cec` is computed as `(clay × 0.5) + (OM × 2)`.
 *                       Cations default to 0 when omitted.
 */
export interface SoilChemistryInput {
	mode: SoilChemistryMode;

	// Texture (required for ESTIMATED mode; optional / ignored otherwise)
	sand?: number;
	clay?: number;
	organicMatter?: number;

	// Chemistry (lab inputs — cmol(+)/kg)
	cec?: number;
	ca?: number;
	mg?: number;
	k?: number;
	na?: number;

	// Optional environmental
	ph?: number;
	ec?: number;
}

/**
 * Output contract for `calculateSoilChemistry`.
 *
 * All percent fields (`baseSaturation`, `caPercent`, `mgPercent`, `kPercent`,
 * `naPercent`, `esp`, `cationBalanceOther`) are clamped to [0, 100].
 *
 * - `cec`                : cmol(+)/kg, ≥ 0
 * - `baseSaturation`     : percent of CEC occupied by Ca + Mg + K + Na
 * - `cationBalanceOther` : 100 − (caPercent + mgPercent), the share NOT
 *                          occupied by the two divalent base cations
 *                          (i.e. monovalent + acidic + unaccounted)
 * - `esp`                : Exchangeable Sodium Percentage = naPercent
 * - `sar`                : Sodium Adsorption Ratio (only emitted when both
 *                          `ca` and `mg` are supplied)
 * - `ph`, `ec`           : passthrough echo of the input when supplied
 * - `calculationMode`    : echo of the input mode
 */
export interface SoilChemistryResult {
	cec: number;

	baseSaturation: number;

	caPercent: number;
	mgPercent: number;
	kPercent: number;
	naPercent: number;

	esp: number;
	sar?: number;

	cationBalanceOther: number;

	ph?: number;
	ec?: number;

	calculationMode: SoilChemistryMode;
}
