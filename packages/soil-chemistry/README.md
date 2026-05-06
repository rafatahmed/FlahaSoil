<!-- @format -->

# `@flaha/soil-chemistry`

Pure-function TypeScript engine for the soil-chemistry domain that the
legacy FlahaSOIL system does **not** implement
(see `docs/legacy-baseline.md` § "Missing Scientific Scope").

## Purpose

Compute Cation Exchange Capacity, base saturation, individual cation
percentages, Exchangeable Sodium Percentage (ESP), Sodium Adsorption
Ratio (SAR), and the residual cation balance from either lab-measured
inputs or texture-derived estimates. **Calculation only — no
interpretation.** Interpretation lives in `@flaha/soil-interpretation`.

## Supported modes

| Mode        | Source of CEC                                         | Cation source                  |
| ----------- | ----------------------------------------------------- | ------------------------------ |
| `LAB`       | `input.cec` if provided; otherwise `ca + mg + k + na` | `input.ca/mg/k/na` (default 0) |
| `ESTIMATED` | `clay × 0.5 + organicMatter × 2`                      | `input.ca/mg/k/na` (default 0) |

`ESTIMATED` mode requires `clay` and `organicMatter`. `LAB` mode requires
either an explicit `cec` or at least one non-zero base cation.

## Units

| Quantity                              | Unit            |
| ------------------------------------- | --------------- |
| Cation concentrations (Ca, Mg, K, Na) | cmol(+)/kg      |
| Cation Exchange Capacity (CEC)        | cmol(+)/kg      |
| Texture (sand, clay, OM)              | percent (0–100) |
| Electrical conductivity (EC)          | dS/m            |
| pH                                    | dimensionless   |

The engine **does not perform unit conversions** — inputs must already be
in the units above.

## Formulae

| Output                | Expression                                                                 |
| --------------------- | -------------------------------------------------------------------------- |
| `cec` (LAB, no input) | `ca + mg + k + na`                                                         |
| `cec` (ESTIMATED)     | `clay × 0.5 + organicMatter × 2`                                           |
| `caPercent` etc.      | `(cation / cec) × 100`, clamped to [0, 100]                                |
| `baseSaturation`      | `((ca + mg + k + na) / cec) × 100`, clamped to [0, 100]                    |
| `esp`                 | `naPercent`                                                                |
| `sar`                 | `na / sqrt((ca + mg) / 2)` — emitted only when both Ca AND Mg are supplied |
| `cationBalanceOther`  | `100 − (caPercent + mgPercent)`, clamped to [0, 100]                       |

## Safety rules

- All numeric inputs must be finite and ≥ 0.
- Texture percents and pH are range-checked.
- A resolved CEC of zero throws — division-by-zero is never produced.
- `SAR` is set to `0` when both Ca and Mg are zero (denominator guard).
- All percent outputs are clamped to `[0, 100]` after computation.

## Usage

```ts
import { calculateSoilChemistry } from "@flaha/soil-chemistry";

const result = calculateSoilChemistry({
	mode: "LAB",
	cec: 20, // cmol(+)/kg
	ca: 12,
	mg: 4,
	k: 0.6,
	na: 0.4,
	ph: 7.2,
	ec: 1.5, // dS/m
});

console.log(result.baseSaturation); // 85
console.log(result.caPercent); // 60
console.log(result.esp); // 2
console.log(result.sar); // ≈ 0.1414
```

```ts
// ESTIMATED mode — derives CEC from texture.
const screened = calculateSoilChemistry({
	mode: "ESTIMATED",
	clay: 30,
	organicMatter: 2.5,
	ca: 8,
	mg: 2,
	k: 0.4,
	na: 0.1,
});
// screened.cec === 30 × 0.5 + 2.5 × 2 === 20
```

## Scope (what this package is NOT)

- Not an interpretation engine. It will not tell you whether your
  base saturation is "low" or "balanced".
- Not a unit converter. Supply data already in the units above.
- Not a recommendation engine. No fertilizer rates, no amendments.
- No I/O, no logging, no framework dependencies.
