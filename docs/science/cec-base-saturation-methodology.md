<!-- @format -->

# CEC & Base Saturation Interpretation — Methodology

## 1. Status & Scientific Honesty Label

`IMPLEMENTED` — The interpretation layer assigns qualitative classes to the
already-computed CEC, base saturation, and cation-balance numbers produced by
the chemistry engine (Paper 4). The classifiers are wired into the
`FLAHA_DEFAULT` interpretation profile.

Provenance: `HOUSE_CONVENTION` — the level breakpoints are the FlahaSOIL
Phase-2.3 project specification. They are **not** cited from a peer-reviewed
source and MUST be reviewed before any external agronomic claim.

## 2. Purpose & Scope

Translate three derived chemistry quantities into human-readable fertility
classes: CEC level, base-saturation level, and cation-balance verdict.

In scope: the piecewise breakpoints and the optimal cation windows. Out of
scope: the CEC/base-saturation arithmetic itself (Paper 4), sodium hazard
(Paper 6), and any physics property.

## 3. Scientific Background

Cation exchange capacity quantifies a soil's capacity to hold exchangeable
base cations; base saturation is the share of that capacity occupied by
Ca + Mg + K + Na. The relative shares of Ca, Mg, and K (the cation balance)
influence nutrient availability and structure. FlahaSOIL bins each into
ordinal classes for reporting.

## 4. Governing Equations & Rules

These are piecewise classifiers over pre-computed values — no formulas, no
unit conversions.

**CEC level** (`classifyCec`, cmol(+)/kg):

- `< 5` → Very Low
- `< 15` → Low
- `< 25` → Moderate
- `≥ 25` → High

**Base saturation** (`classifyBaseSaturation`, %):

- `< 50` → Low
- `50–80` (inclusive) → Moderate
- `> 80` → High

**Cation balance** (`classifyCationBalance`, % shares of CEC). Optimal
windows, any supplied cation outside its window ⇒ `Imbalanced`, otherwise
`Balanced`; absent cations are skipped (cannot fail by absence):

- Ca: 60–75 %
- Mg: 10–20 %
- K : 2–5 %

## 5. Inputs & Units

| Input | Unit | Source |
| ----- | ---- | ------ |
| `cec` | cmol(+)/kg | chemistry engine (Paper 4) |
| `baseSaturation` | % | chemistry engine |
| `caPercent`, `mgPercent`, `kPercent` | % of CEC | chemistry engine |

## 6. Outputs & Units

| Output | Type | Values |
| ------ | ---- | ------ |
| CEC class | string | Very Low / Low / Moderate / High |
| Base-saturation class | string | Low / Moderate / High |
| Cation-balance verdict | string | Balanced / Imbalanced |

## 7. Source of Truth

- `packages/soil-interpretation/src/rules.ts` — `classifyCec`,
  `classifyBaseSaturation`, `classifyCationBalance`, `CATION_WINDOWS`.
- `packages/soil-interpretation/src/interpretSoil.ts` — wiring into the
  `SoilInterpretationResult`.

## 8. Assumptions

- Inputs already arrive in the units defined by `@flaha/soil-chemistry`; the
  rules perform no conversion.
- Cation windows apply only to supplied cations; a panel that omits K cannot
  be marked imbalanced on the K criterion.

## 9. Limitations

- Breakpoints are house conventions, not peer-reviewed thresholds; they are
  flagged `HOUSE_CONVENTION` in `calibrationMetadata.ts`.
- The cation-balance verdict is binary (Balanced / Imbalanced); it does not
  rank severity or identify which cation is out of range beyond the appended
  reason text.

## 10. Validation & Evidence

- `packages/soil-interpretation/src/__tests__/` — rule unit tests covering
  each breakpoint boundary.
- Phase 10C-C chemistry benchmarks assert CEC ordering low < moderate < high,
  which exercises the `classifyCec` bands end-to-end.

## 11. References

- FlahaSOIL Phase-2.3 specification (project house thresholds).
- Sparks, D.L. (2003). *Environmental Soil Chemistry*, 2nd ed. (background).
- USDA NRCS — Soil Survey Laboratory Methods Manual (background).

## 12. Provenance & Change Log

| Date | Change |
| ---- | ------ |
| Phase 2.3 | CEC / base-saturation / cation-balance classifiers introduced. |
| Phase 10C-E | Documented as shipped; no threshold changed. |

## 13. Audit Notes

- No breakpoint or cation window was modified by this white paper.
- The `HOUSE_CONVENTION` provenance label is mandatory wherever these classes
  appear in a published report.
