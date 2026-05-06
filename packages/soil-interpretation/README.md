<!-- @format -->

# `@flaha/soil-interpretation`

Pure decision-layer engine that classifies pre-computed physics and
chemistry results into qualitative categories, risk classes, and a
warnings array. **No calculations** — interpretation only.

## Purpose

Turn the numeric outputs of `@flaha/soil-physics` and
`@flaha/soil-chemistry` into agronomic categories suitable for the
FlahaSOIL UI, DSS, and reporting layer. The engine never recomputes,
mutates, or rounds an input value.

## Supported inputs

```ts
interface SoilInterpretationInput {
	physics?: Record<string, unknown> | null; // SoilPhysicsResult
	chemistry?: Record<string, unknown> | null; // SoilChemistryResult
}
```

Both fields are optional. Each classification is emitted only when its
underlying input value is present and finite. Missing inputs never throw.

## Classification rules

| Output                   | Source field                                             | Buckets                                                                                                          |
| ------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `phCategory`             | `chemistry.ph`                                           | `< 5.5` Strongly Acidic · `< 6.5` Slightly Acidic · `< 7.5` Neutral · `< 8.5` Alkaline · `≥ 8.5` Highly Alkaline |
| `salinityRisk`           | `chemistry.ec` → `physics.electricalConductivity` (dS/m) | `< 2` Low · `< 4` Moderate · `< 8` High · `≥ 8` Severe                                                           |
| `cecLevel`               | `chemistry.cec` (cmol(+)/kg)                             | `< 5` Very Low · `< 15` Low · `< 25` Moderate · `≥ 25` High                                                      |
| `baseSaturationCategory` | `chemistry.baseSaturation` (%)                           | `< 50` Low · `≤ 80` Moderate · `> 80` High                                                                       |
| `sodiumRisk`             | `chemistry.esp` (%)                                      | `< 6` Low · `≤ 15` Moderate · `> 15` High                                                                        |
| `cationBalance`          | `chemistry.{caPercent, mgPercent, kPercent}`             | Optimal windows Ca 60–75 %, Mg 10–20 %, K 2–5 % → `Balanced` else `Imbalanced`                                   |
| `waterHoldingClass`      | `physics.plantAvailableWater`                            | `< 50` Low · `≤ 150` Moderate · `> 150` High                                                                     |
| `drainageClass`          | `physics.drainageClass`                                  | passthrough (Excellent / Good / Moderate / Poor / Very Poor)                                                     |

Numeric fields are coerced from strings when necessary, so the engine
consumes the legacy physics output (which emits `toFixed(...)` strings)
without modification.

## Warnings

Pushed in deterministic order:

- Salinity `Severe` or `High`
- Sodium risk `High` (ESP > 15)
- pH `Strongly Acidic` (< 5.5) or `Highly Alkaline` (> 8.5)
- CEC `Very Low` (< 5)
- Cation balance `Imbalanced`

## Overall rating

- `Poor` — any High / Severe risk, Very Low CEC, extreme pH, or imbalance
- `Fair` — at least one Moderate-tier negative signal (or no signals at all)
- `Good` — no negative signals and at least one positive classification

## Output

```ts
interface SoilInterpretationResult {
	phCategory?: string;
	salinityRisk?: string;
	cecLevel?: string;
	baseSaturationCategory?: string;
	cationBalance?: string;
	sodiumRisk?: string;
	waterHoldingClass?: string;
	drainageClass?: string;
	overallSoilRating: string; // always present
	warnings: string[]; // always present, [] when none apply
}
```

## Usage

```ts
import { interpretSoil } from "@flaha/soil-interpretation";
import { calculateSoilPhysics } from "@flaha/soil-physics";
import { calculateSoilChemistry } from "@flaha/soil-chemistry";

const physics = calculateSoilPhysics({
	sand: 40,
	clay: 25,
	organicMatter: 2.5,
	densityFactor: 1.0,
	electricalConductivity: 1.0,
	gravelContent: 0,
	plan: "PROFESSIONAL",
});

const chemistry = calculateSoilChemistry({
	mode: "LAB",
	cec: 20,
	ca: 13,
	mg: 3,
	k: 0.6,
	na: 0.4,
	ph: 6.8,
	ec: 1.0,
});

const interpretation = interpretSoil({ physics, chemistry });
// interpretation.overallSoilRating → "Good"
// interpretation.warnings           → []
```

## Scope (what this package is NOT)

- Not a calculation engine. It will not derive CEC, PAW, ESP, etc.
- Not a recommendation engine. No fertilizer rates, no irrigation depths.
- Not a unit converter. Inputs must already be in the units used by the
  calculation packages.
- No I/O, no logging, no framework dependencies.
