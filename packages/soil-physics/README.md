<!-- @format -->

# `@flaha/soil-physics`

Pure-function TypeScript port of the **Saxton & Rawls (2006) 24-equation soil
water characteristic engine** that lives in the legacy
`api-implementation/src/services/soilCalculationService.js`.

## Source

- **Saxton, K. E., & Rawls, W. J. (2006).** _Soil Water Characteristic
  Estimates by Texture and Organic Matter for Hydrologic Solutions._ Soil
  Science Society of America Journal, 70(5), 1569–1578.
- Legacy implementation reference:
  `api-implementation/src/services/soilCalculationService.js` (`class
SoilCalculationService`).

## Status

Phase 2 (extraction complete). The package is a **byte-for-byte port** of the
legacy engine — same equations, same constants, same clamps, same `toFixed`
precisions, same string-vs-number output shape, same plan-tier branching, and
the same documented legacy quirks (see "Legacy parity notes" below).

## Extraction note

This is a scientific extraction, not a redesign:

- No formula has been altered.
- No constant has been changed.
- No threshold or clamp has been modified.
- No rounding behaviour has been changed.
- No legacy bug has been "fixed" — see the inline comment in
  `calculateGravelEffects` for the documented `parseFloat(undefined)` quirk.

## ⚠️ Warning — must match the legacy baseline

Output parity is verified against the frozen samples in
[`docs/legacy-calculation-samples.md`](../../docs/legacy-calculation-samples.md).
Any change to this package that drifts from those numbers MUST be treated as a
regression and either reverted or accompanied by a baseline update with full
review.

## Usage

```ts
import { calculateSoilPhysics } from "@flaha/soil-physics";

const result = calculateSoilPhysics({
	sand: 40,
	clay: 20,
	organicMatter: 2.5,
	densityFactor: 1.3,
	gravelContent: 0,
	electricalConductivity: 0.8,
	userPlan: "PROFESSIONAL",
});

console.log(result.fieldCapacity); // "25.3"
console.log(result.wiltingPoint); // "12.2"
console.log(result.saturatedConductivity); // "42.3"
console.log(result.airEntryTension); // "9.6"
```

## Legacy parity notes

- `bulkDensity` is rendered with **3 decimals** for FREE-tier outputs and
  **2 decimals** for Professional+ — the underlying numeric value (ρN from
  Equation 6) is identical, only the formatting differs.
- `saturatedConductivity`, `airEntryTension`, `osmoticPotential`,
  `parameterA/B`, `relativeK`, `lambda`, `bulkDensity`, etc. are emitted as
  **strings** (the legacy engine calls `toFixed(...)` on each).
- The FREE tier returns the same engine-computed values as Professional —
  only the _additional_ fields differ. The free-tier lookup table
  (`calculateBasic`) is exposed separately.
- `calculateGravelEffects` is invoked with `densityResults` only, so its
  `Kb` / `conductivityRatio` resolve to `NaN` (`parseFloat(undefined)`).
  Preserved verbatim per Phase 2 rules — do not "fix".
