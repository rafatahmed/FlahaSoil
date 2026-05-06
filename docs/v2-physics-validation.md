<!-- @format -->

# Phase 2.1A — Soil Physics Validation and Defect Notes

**Phase:** 2.1A (analysis-only, no code changes)
**Package:** `@flaha/soil-physics` v1.0.0
**Reference engine:** `api-implementation/src/services/soilCalculationService.js`
**Reference baseline:** `docs/legacy-calculation-samples.md`

---

## Summary

The extracted Saxton & Rawls (2006) engine in `packages/soil-physics/` is a
**byte-for-byte port** of the legacy `SoilCalculationService` implementation.
All 15 regression tests (5 baseline soils × 3 plan tiers) pass on the first
run, and the resulting outputs match the frozen legacy baseline to the
precision the legacy engine emits (`toFixed(n)`).

Engine consistency is high — equations 1–24 are present, in correct order,
with constants and clamps preserved. The audit identified **14 defects**,
none of which cause the regression suite to fail (because the legacy engine
exhibited the same defects, and the baseline was captured **after** them).

| Severity | Count |
|----------|-------|
| CRITICAL | 0 |
| HIGH     | 1 (DEF-001) |
| MEDIUM   | 6 |
| LOW      | 7 |
| **Total**| **14** |

The package is **ready for Phase 2.2** — the defects are documented for the
future v2 cleanup phase, but they MUST NOT be fixed inside the extraction
package without an accompanying baseline-rebaseline cycle.

---

## Regression Validation Result

```
RUN  vitest 1.6.1 — packages/soil-physics

✓ src/__tests__/physics.test.ts (15)
  ✓ Sample 1 — Sandy        (FREE / PROFESSIONAL / ENTERPRISE)
  ✓ Sample 2 — Loam         (FREE / PROFESSIONAL / ENTERPRISE)
  ✓ Sample 3 — Clay         (FREE / PROFESSIONAL / ENTERPRISE)
  ✓ Sample 4 — High OM      (FREE / PROFESSIONAL / ENTERPRISE)
  ✓ Sample 5 — Saline       (FREE / PROFESSIONAL / ENTERPRISE)

Test Files  1 passed (1)
     Tests  15 passed (15)
  Duration  721 ms
```

- **Numeric parity:** every primary output (`fieldCapacity`,
  `wiltingPoint`, `plantAvailableWater`, `saturation`,
  `saturatedConductivity`, `airEntryTension`, `lambda`, `parameterA`,
  `parameterB`, `relativeK`, `conductivityExponent`, `osmoticPotential`,
  `osmoticPotentialFC`) compared to the baseline within `toBeCloseTo(value, n)`
  at the precision the legacy engine emits.
- **String/number formatting parity:** confirmed identical (see "Output
  Consistency Notes" below).
- **Plan-tier shape parity:** FREE returns the baseline keys; PROFESSIONAL
  adds `airEntryTension`, `lambda`, `unsaturatedConductivity`, confidence
  block, and (when triggered) gravel block; ENTERPRISE additionally exposes
  `parameterA`, `parameterB`, `relativeK`, `conductivityExponent`, and the
  salinity block (when EC > 0). All three tiers reproduce the legacy
  payload verbatim.
- **`bulkDensity` precision parity:** FREE renders `rhoN.toFixed(3)`;
  PROFESSIONAL/ENTERPRISE renders `rhoN.toFixed(2)`. Same underlying value,
  different formatting — preserved.

No mismatches. No deviations.

---

## Defect List

| ID       | File                       | Function                                   | Severity | Affects Output | Fix Required | Breaking |
|----------|----------------------------|--------------------------------------------|----------|----------------|--------------|----------|
| DEF-001  | calculateSoilPhysics.ts    | calculateGravelEffects (call site)         | HIGH     | YES            | YES          | YES      |
| DEF-002  | calculateSoilPhysics.ts    | calculateGravelEffects (Eq 22)             | LOW      | YES (NaN)      | YES (after 001) | YES   |
| DEF-003  | calculateSoilPhysics.ts    | calculateMoistureTensionRelationships      | LOW      | NO             | NO           | NO       |
| DEF-004  | calculateSoilPhysics.ts    | calculateMoistureConductivity              | LOW      | NO             | NO           | NO       |
| DEF-005  | calculateSoilPhysics.ts    | formatResultsByPlan (PRO branch)           | LOW      | NO             | NO           | NO       |
| DEF-006  | calculateSoilPhysics.ts    | formatResultsByPlan (ENTERPRISE branch)    | MEDIUM   | YES (omission) | YES          | YES      |
| DEF-007  | calculateSoilPhysics.ts    | formatResultsByPlan (`bulkDensity` field)  | MEDIUM   | NO (semantic)  | YES (rename) | YES      |
| DEF-008  | calculateSoilPhysics.ts    | calculateAdditionalProperties              | LOW      | NO             | NO           | NO       |
| DEF-009  | calculateSoilPhysics.ts    | determineSoilTextureClass                  | MEDIUM   | YES            | YES          | YES      |
| DEF-010  | calculateSoilPhysics.ts    | calculateMoistureConductivity (Eq 17/18)   | MEDIUM   | YES            | YES          | YES      |
| DEF-011  | calculateSoilPhysics.ts    | calculateSoilQualityIndicators             | MEDIUM   | YES            | YES          | YES      |
| DEF-012  | calculateSoilPhysics.ts    | assessCompactionRisk / assessErosionRisk   | MEDIUM   | YES            | YES          | YES      |
| DEF-013  | calculateSoilPhysics.ts    | formatResultsByPlan (`||` echo)            | LOW      | NO             | NO           | NO       |
| DEF-014  | calculateSoilPhysics.ts    | calculateMoistureTensionRelationships (Eq 14) | LOW   | YES (subtle)   | NO           | NO       |

---

## Detailed Defects

### DEF-001 — Gravel block is fed `densityResults` instead of `conductivityResults`

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `calculateGravelEffects` (call site at line 702 of orchestrator)
- **Description:** `calculateWaterCharacteristics` passes `densityResults` to
  `calculateGravelEffects`, which destructures `saturatedConductivity` from
  it. `densityResults` does NOT contain `saturatedConductivity` — that field
  is created later by `calculateMoistureConductivity` and lives on
  `conductivityResults`.
- **Root Cause:** Incorrect parameter passed from orchestrator (replicated
  verbatim from legacy `soilCalculationService.js` line 74).
- **Current Behavior:** `parseFloat(undefined) === NaN` for both `Kb`
  (Equation 21) and `conductivityRatio` (Equation 22). The returned
  `bulkConductivity` is `"NaN"` and `conductivityRatio` is `"NaN"`.
- **Scientific Impact:** Gravel-adjusted conductivity is invalid. Equations
  21 and 22 of Saxton & Rawls (2006) are effectively non-functional whenever
  gravel content > 0 on Professional+ tiers.
- **Severity:** HIGH
- **Affects Output:** YES
- **Fix Required:** YES
- **Breaking Change:** YES (regression-test baseline must be re-captured)

### DEF-002 — Equation 22 simplifies to `(1 − Rv)²` and is therefore redundant

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `calculateGravelEffects` (Equation 22)
- **Description:** `conductivityRatio = Kb / parseFloat(saturatedConductivity)`
  with `Kb = parseFloat(saturatedConductivity) * (1 − Rv)²` algebraically
  reduces to `(1 − Rv)²`, regardless of input. Even after DEF-001 is fixed,
  the `parseFloat → multiply → divide` round-trip via a string introduces a
  precision artifact and is computationally redundant.
- **Root Cause:** Direct port of legacy expression; ratio was likely meant
  to be derived without re-parsing the formatted string.
- **Current Behavior:** Returns `"NaN"` today (because of DEF-001). After
  fixing DEF-001 it would return `(1 − Rv)²` rounded to 3 decimals.
- **Scientific Impact:** None on the value (the ratio IS `(1 − Rv)²` per the
  source), but the implementation depends on a stringified intermediate.
- **Severity:** LOW
- **Affects Output:** YES (currently NaN)
- **Fix Required:** YES (after DEF-001)
- **Breaking Change:** YES

### DEF-003 — `calculateMoistureTensionRelationships` accepts unused `S, C, OM`

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `calculateMoistureTensionRelationships`
- **Description:** Parameters `_S, _C, _OM` are accepted but never read.
  Equations 11–14 only reference fields from `densityResults`.
- **Root Cause:** Legacy signature retained for parity. Prefixed with `_`
  in the port to satisfy the linter without changing the call signature.
- **Current Behavior:** No effect. Dead parameters.
- **Scientific Impact:** None.
- **Severity:** LOW
- **Affects Output:** NO
- **Fix Required:** NO (cosmetic)
- **Breaking Change:** NO

### DEF-004 — `calculateMoistureConductivity` accepts unused `S, C`

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `calculateMoistureConductivity`
- **Description:** Parameters `_S, _C` are accepted but never read. Eq 16/17/18
  use only `tensionResults` fields.
- **Root Cause:** Same as DEF-003.
- **Current Behavior:** No effect.
- **Scientific Impact:** None.
- **Severity:** LOW
- **Affects Output:** NO
- **Fix Required:** NO
- **Breaking Change:** NO

### DEF-005 — `formatResultsByPlan` re-assigns `compactionRisk` / `erosionRisk` in the PRO branch

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `formatResultsByPlan` (PROFESSIONAL/ENTERPRISE branch)
- **Description:** Both fields are already set in `baseResults` and then
  re-assigned to the same values inside the PRO/ENTERPRISE block.
- **Root Cause:** Verbatim from legacy.
- **Current Behavior:** Idempotent overwrite.
- **Scientific Impact:** None.
- **Severity:** LOW (dead code)
- **Affects Output:** NO
- **Fix Required:** NO
- **Breaking Change:** NO

### DEF-006 — Salinity block is omitted when `electricalConductivity === 0` on ENTERPRISE

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `formatResultsByPlan` (ENTERPRISE branch) and orchestrator
- **Description:** `salinityResults` is populated only if
  `electricalConductivity > 0`. As a result an ENTERPRISE user passing
  `EC = 0` (a valid scientific input meaning "non-saline") gets no
  `osmoticPotential` / `osmoticPotentialFC` / `electricalConductivity`
  fields at all, while a user passing `EC = 0.001` does. The baseResults
  block already echoes `electricalConductivity` from input but loses the
  computed `osmoticPotential` and `osmoticPotentialFC`, which would simply
  be `0.0` for `EC = 0`.
- **Root Cause:** Conditional gating on `> 0` instead of always computing
  Eq 23/24.
- **Current Behavior:** Inconsistent ENTERPRISE response shape depending on
  whether EC is exactly zero.
- **Scientific Impact:** A non-saline soil produces a different field set
  than a slightly-saline soil. Downstream consumers must handle both shapes.
- **Severity:** MEDIUM
- **Affects Output:** YES (omission, not value)
- **Fix Required:** YES
- **Breaking Change:** YES (response schema change)

### DEF-007 — `bulkDensity` field name vs content (ρN, not ρDF) and tier-dependent precision

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `formatResultsByPlan` (`bulkDensity` field)
- **Description:** The field labelled `bulkDensity` in the output is
  `rhoN.toFixed(3)` on FREE and `rhoN.toFixed(2)` on PRO/ENTERPRISE. ρN is
  the **calculated** bulk density from texture (Equation 6,
  `(1 − θS) · 2.65`). The **user-input** density used downstream in
  Equations 8–10 is ρDF (`densityFactor`). The output additionally exposes
  `bulkDensityFactor: rhoN.toFixed(2)` and `inputBulkDensity:
  inputParameters.densityFactor` — the field naming therefore conflates
  three concepts.
- **Root Cause:** Verbatim from legacy.
- **Current Behavior:** Three fields convey two values with overlapping
  names: `bulkDensity` (= ρN), `bulkDensityFactor` (= ρN), `inputBulkDensity`
  (= ρDF input).
- **Scientific Impact:** None on the value but the field semantics are
  ambiguous and the precision shift between tiers is undocumented in the
  response itself.
- **Severity:** MEDIUM (semantic / naming)
- **Affects Output:** NO (values identical to baseline)
- **Fix Required:** YES (rename)
- **Breaking Change:** YES (field rename = schema change)

### DEF-008 — `inputGravelContent` produced by `calculateAdditionalProperties` is never read

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `calculateAdditionalProperties`
- **Description:** The function returns `inputGravelContent: gravelContent`
  but `formatResultsByPlan` never picks it up — the base block instead echoes
  `gravelContent: inputParameters.gravelContent || 0`.
- **Root Cause:** Verbatim from legacy.
- **Current Behavior:** Dead field; not visible in any tier output.
- **Scientific Impact:** None.
- **Severity:** LOW
- **Affects Output:** NO
- **Fix Required:** NO
- **Breaking Change:** NO

### DEF-009 — `determineSoilTextureClass` is a simplified, non-USDA classifier

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `determineSoilTextureClass`
- **Description:** The classifier uses 8 hard-coded thresholds and does not
  implement the full USDA soil texture triangle. Notable gaps: no Sandy
  Clay Loam region (clay 20–35 with sand 45–80), Loamy Sand vs Sandy Loam
  uses a single sand=70 threshold, Silt Loam vs Sandy Loam vs Loam at
  clay 7–27 with silt 28–50 is collapsed, no separate Sandy Clay below
  clay 35, no Silty Clay Loam below clay 27.
- **Root Cause:** Verbatim from legacy. Likely a placeholder pending a
  proper triangle implementation.
- **Current Behavior:** Some intermediate textures are misclassified
  (e.g., a soil at sand=60/clay=25 returns "Loam" rather than the
  USDA-correct "Sandy Clay Loam").
- **Scientific Impact:** Misclassification cascades into
  `assessCompactionRisk` / `assessErosionRisk` (which both `String.includes`
  on the texture name) and into the FREE-tier `BASIC_ESTIMATES` lookup.
- **Severity:** MEDIUM
- **Affects Output:** YES
- **Fix Required:** YES
- **Breaking Change:** YES (texture class can change for boundary samples)

### DEF-010 — `unsaturatedConductivity` is reported only at field capacity and is effectively zero

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `calculateMoistureConductivity`
- **Description:** Equation 18 evaluates `relativeK = (θ33DF / θSDF) ^
  (3 + 2/λ)`. With typical λ in [0.1, 0.5] the exponent is large
  (13–23), and `θ33DF/θSDF` is well below 1, so `relativeK ≈ 0` for all
  realistic soils. The reported `unsaturatedConductivity = KS · relativeK`
  is then `0.0` for every regression sample — confirmed by the test
  expectation `expect(result.unsaturatedConductivity).toBe("0.0")`.
- **Root Cause:** The formula is hard-coded to evaluate at θ = θ33DF
  (field capacity), not at a user-supplied moisture content. Saxton &
  Rawls (2006) Equation 18 is meant to be a function of θ.
- **Current Behavior:** Field reports `"0.0"` for every soil.
- **Scientific Impact:** The Professional+ tier exposes a field that
  carries no information.
- **Severity:** MEDIUM
- **Affects Output:** YES (constant zero)
- **Fix Required:** YES (accept θ as input, return Ku(θ))
- **Breaking Change:** YES (signature change + new field meaning)

### DEF-011 — Soil quality scoring uses heuristic thresholds with no published source

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `calculateSoilQualityIndicators`
- **Description:** `qualityScore`, `drainageClass` thresholds (e.g. `paw > 20`
  → +3, `ksat > 100` → "Excellent") are house heuristics. They do not
  derive from Saxton & Rawls (2006) or any cited source. The `0–10` scale
  itself is a base-5 ± offsets construct.
- **Root Cause:** Verbatim from legacy.
- **Current Behavior:** Reproducible numbers, but provenance is opaque.
- **Scientific Impact:** Cannot defend the indicator under audit.
- **Severity:** MEDIUM
- **Affects Output:** YES
- **Fix Required:** YES (cite a source or move to a clearly-named
  "FlahaSOIL house index")
- **Breaking Change:** YES (numerics may shift if recalibrated)

### DEF-012 — `assessCompactionRisk` and `assessErosionRisk` are 3-line heuristics

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `assessCompactionRisk`, `assessErosionRisk`
- **Description:** Compaction risk is decided by texture name + bulk density.
  Erosion risk is decided by texture name + Ksat. No slope, no rainfall, no
  vegetation, no RUSLE2/USLE K-factor, no aggregate stability, no SOC.
- **Root Cause:** Verbatim from legacy.
- **Current Behavior:** Returns one of {Low, Moderate, High} from a static
  decision table.
- **Scientific Impact:** Erosion risk in particular cannot be derived
  without slope and rainfall; field is misleading.
- **Severity:** MEDIUM
- **Affects Output:** YES
- **Fix Required:** YES (either rename to "physics-only erosion proxy" or
  replace with a real model in v2)
- **Breaking Change:** YES

### DEF-013 — `||` truthy-or-default loses zero distinction in echo fields

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `formatResultsByPlan` (base block)
- **Description:** `gravelContent: inputParameters.gravelContent || 0` and
  `electricalConductivity: inputParameters.electricalConductivity || 0` use
  `||`, which collapses falsy inputs (`0`, `null`, `undefined`, `NaN`) to
  the same `0`. For numeric echo fields this is harmless (input `0` and
  default `0` are both `0`), but it diverges from the `??` semantics used
  in the orchestrator's defaulting path (`input.x ?? DEFAULTS.x`).
- **Root Cause:** Verbatim from legacy.
- **Current Behavior:** Numeric echo always renders a number, never null.
- **Scientific Impact:** None (numeric fields).
- **Severity:** LOW
- **Affects Output:** NO
- **Fix Required:** NO
- **Breaking Change:** NO

### DEF-014 — Equation 14 (`psiEAdj`) uses clamped `theta33DF` against unclamped `theta33t`

- **File:** `packages/soil-physics/src/calculateSoilPhysics.ts`
- **Function:** `calculateMoistureTensionRelationships`
- **Description:** `psiEAdj = psiE · (theta33DF / theta33t)^(-B)`. The
  numerator `theta33DF` has been clamped to `[0.05, 0.5]` in
  `calculateDensityEffects`, while `theta33t` is the raw Eq 2 output. When
  Eq 9 hits the clamp, the ratio no longer reflects the true density-shift
  ratio, biasing `psiEAdj` at the boundary.
- **Root Cause:** Verbatim from legacy. The clamp is applied to the
  exported field, and the same exported (clamped) field is then re-used in
  Eq 14.
- **Current Behavior:** For soils where Eq 9 saturates the clamp,
  `psiEAdj` is biased.
- **Scientific Impact:** Subtle bias near texture extremes (very sandy or
  very clay-rich soils).
- **Severity:** LOW
- **Affects Output:** YES (within clamped regions)
- **Fix Required:** NO (would need a Saxton & Rawls re-reading to confirm
  intent)
- **Breaking Change:** NO (within current baseline samples)

---

## Output Consistency Notes

### String fields (rendered via `toFixed(n)`)

Always strings, regardless of tier:

- `fieldCapacity`, `wiltingPoint`, `plantAvailableWater`, `saturation` —
  `toFixed(1)`
- `saturatedConductivity` — `toFixed(1)`
- `bulkDensity` — `toFixed(3)` on FREE, `toFixed(2)` on PRO/ENTERPRISE
- `bulkDensityFactor` — `toFixed(2)`
- `porosity` — `toFixed(1)`, `voidRatio` — `toFixed(3)`,
  `particleDensity` — `toFixed(2)`
- `soilQualityIndex` — `toFixed(1)`

PROFESSIONAL/ENTERPRISE-only:

- `airEntryTension` — `toFixed(1)`
- `lambda` — `toFixed(2)`
- `unsaturatedConductivity` — `toFixed(1)` (always `"0.0"`, see DEF-010)

ENTERPRISE-only:

- `parameterA`, `parameterB` — `toFixed(3)`
- `relativeK` — `toFixed(3)`
- `conductivityExponent` — `toFixed(2)`
- `osmoticPotential`, `osmoticPotentialFC`, `electricalConductivity` —
  `toFixed(1)`

Gravel block (PRO/ENTERPRISE when `gravelContent > 0`):

- `bulkDensity` (gravel-adjusted) — `toFixed(2)` (overwrites the base
  `bulkDensity` field via spread)
- `plantAvailableWaterBulk` — `toFixed(1)`
- `bulkConductivity` — `toFixed(1)` (currently `"NaN"`, see DEF-001)
- `conductivityRatio` — `toFixed(3)` (currently `"NaN"`, see DEF-001/002)

### Number fields (raw passthrough)

- `sand`, `clay`, `silt`, `organicMatter` — input echo (number)
- `gravelContent`, `electricalConductivity` — input echo, normalised via
  `|| 0` (number, see DEF-013)
- `inputBulkDensity` — input `densityFactor` echo (number)
- `gravelVolumeFraction` — `Rv` (number, only present in gravel block)
- `confidenceIntervals.*` and `rSquaredValues.*` — numbers from
  `CONFIDENCE_DATA` lookup

### Class / enum fields (string)

- `textureClass` ∈ {Sand, Loamy Sand, Sandy Loam, Loam, Silt Loam, Silt,
  Sandy Clay Loam, Silty Clay Loam, Clay Loam, Sandy Clay, Silty Clay,
  Clay} — but see DEF-009 for missing branches
- `drainageClass` ∈ {Excellent, Good, Moderate, Poor, Very Poor}
- `compactionRisk`, `erosionRisk` ∈ {Low, Moderate, High}

### Cross-tier consistency

- The base block of every tier is identical in shape.
- PROFESSIONAL is a strict superset of FREE.
- ENTERPRISE is a strict superset of PROFESSIONAL.
- **Exception (DEF-006):** ENTERPRISE drops the salinity sub-block when
  `electricalConductivity === 0`, breaking the strict-superset rule for
  that one input value.

---

## Numerical Stability Notes

| Risk                         | Location                                         | Status                                                             |
|------------------------------|--------------------------------------------------|--------------------------------------------------------------------|
| `Math.log(0)` → `-Infinity`  | `Math.log(theta33DF)`, `Math.log(thetaSDF)` in Eq 11/12 | Guarded by clamps in Eq 9 (`theta33DF ∈ [0.05, 0.5]`, `thetaSDF ∈ [0.25, 0.6]`). |
| `Math.log(negative)` → `NaN` | `Math.log(theta1500DF)` in Eq 11/12              | **NOT guarded.** `theta1500DF = 1.14 · theta1500t − 0.02` can be ≤ 0 for very sandy / low-OM inputs (large negative `theta1500t` from Eq 1). |
| Division by zero in Eq 12    | `(log(theta33DF) − log(theta1500DF))` denominator | **NOT guarded.** When `theta33DF == theta1500DF` the denominator is 0; `B = ±Infinity`, then `lambda = 1/B = 0` is clamped to `0.1`. Result: clamp masks the singularity but the path runs through Infinity. |
| Division by zero in Eq 11    | `(log(theta1500DF) − log(thetaSDF))` denominator  | Same shape as above. Result clamped via `AMin = 0.1`.            |
| `Math.pow(negative, frac)` → `NaN` | `Math.pow(thetaSDF − theta33DF, 3 − lambda)` in Eq 16 | Guarded **only by the clamps**: `thetaSDF ≥ 0.25 > theta33DF ≤ 0.5` is **not** strict — for high-clay soils where Eq 9 hits 0.5 and Eq 8 hits its lower bound, `thetaSDF − theta33DF` could be 0 or slightly negative. Currently not observed in baseline samples. |
| `parseFloat(undefined)` → `NaN` | `calculateGravelEffects` (DEF-001)              | **Active defect** — see DEF-001.                                  |
| `NaN / NaN` → `NaN`          | `Kb / parseFloat(saturatedConductivity)` (DEF-002)| **Active defect** — see DEF-001/002.                              |
| `Infinity` from division     | `voidRatio = porosity / (100 − porosity)`         | Guarded: `thetaSDF` clamped at 0.6 → `porosity ≤ 60` → safe.     |
| `Math.pow(0, -B)` → `Infinity` | Eq 14 `Math.pow(theta33DF / theta33t, -B)`     | Possible if `theta33t == 0`. Guarded only by Eq 2 numerics; never triggered in baseline. |
| Overflow                     | None of the equations approach Number.MAX_VALUE. | OK.                                                               |
| Underflow                    | `relativeK = (theta33DF / thetaSDF) ^ (3 + 2/λ)` underflows to 0 for typical inputs. Documented as DEF-010. | OK numerically; problematic semantically. |

No numerical-stability defect causes the regression suite to fail because
all five baseline soils stay well inside the safe regions defined by the
clamps. The risks above are latent — they would surface for inputs outside
the regression sample space (e.g., pure silt, S=0/C=0 corner cases,
gravelContent near 100).

---

## Recommendations (classification only — NOT to be applied in this phase)

These recommendations are deferred to the future v2 cleanup phase
(provisionally Phase 4 or later, post-cutover). They MUST NOT be applied
inside `@flaha/soil-physics` while the package is the single source of
parity with the legacy engine.

**Tier 1 — must-fix before declaring v2 GA:**

1. DEF-001 + DEF-002 — Pass `conductivityResults` to `calculateGravelEffects`
   and replace Equation 22 with the algebraic identity `(1 − Rv)²` (no
   string round-trip). This restores Equations 21/22 of Saxton & Rawls.
2. DEF-006 — Always emit the salinity sub-block on ENTERPRISE; for
   `EC = 0` the values are well-defined zeros.
3. DEF-009 — Replace the simplified texture classifier with a complete
   USDA triangle implementation; lock down with reference fixtures from
   the official USDA texture-triangle table.
4. DEF-010 — Either remove `unsaturatedConductivity` from the output or
   accept a moisture-content input and return `Ku(θ)` per Eq 18.

**Tier 2 — should-fix before scientific publication:**

5. DEF-007 — Rename `bulkDensity` to disambiguate ρN, ρDF, and the gravel-
   adjusted ρB. Standardise precision across tiers.
6. DEF-011, DEF-012 — Either cite a published source for the SQI / drainage
   / compaction / erosion heuristics or rebrand them as house indices and
   document their derivation explicitly.
7. DEF-014 — Re-examine Eq 14 `psiEAdj` against the unclamped `theta33t`
   reference; either propagate the unclamped value or document the bias.

**Tier 3 — cosmetic / cleanup:**

8. DEF-003, DEF-004 — Drop unused parameters from `calculateMoistureTension
   Relationships` and `calculateMoistureConductivity`.
9. DEF-005 — Remove the duplicate `compactionRisk` / `erosionRisk`
   assignment in the PRO branch.
10. DEF-008 — Remove the unused `inputGravelContent` field from
    `calculateAdditionalProperties`.
11. DEF-013 — Switch `||` to `??` in echo fields for symmetry with the
    orchestrator (no functional change for numeric inputs).

**Numerical-stability hardening (defensive):**

12. Add explicit guards for `theta1500DF ≤ 0` and `theta33DF == theta1500DF`
    before `Math.log` and division in Eq 11/12.
13. Add an explicit `thetaSDF − theta33DF ≥ 0` guard before Eq 16.

---

## Final Output

1. **Total number of defects:** 14 (1 HIGH, 6 MEDIUM, 7 LOW)
2. **Highest severity defect:** DEF-001 — `calculateGravelEffects` receives
   `densityResults` instead of `conductivityResults`; produces `NaN` for
   `bulkConductivity` and `conductivityRatio` whenever gravel > 0 on
   Professional+ tiers.
3. **Confirmation:**
   - **No code was modified.** `packages/soil-physics/src/*.ts` is
     unchanged. `api-implementation/src/services/soilCalculationService.js`
     is unchanged. Only `docs/v2-physics-validation.md` was created.
   - **No logic was changed.** No equation, constant, clamp, threshold,
     `toFixed` precision, or output field was altered.
4. **Phase 2.2 readiness:** `@flaha/soil-physics` is **READY** for Phase
   2.2. The engine reproduces the frozen legacy baseline byte-for-byte;
   all known defects are inherited from the legacy engine and are
   documented above for the future cleanup phase.
