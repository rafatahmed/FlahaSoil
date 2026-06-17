<!-- @format -->

# FlahaSOIL v2 — Scientific Unit Matrix (Phase 10A.7)

> Single source of truth for every quantity emitted by the scientific
> engines, the units they carry across the wire, the precision they are
> rendered with, and the rule layer that consumes them. Anchored to the
> Phase 10A.7 _Scientific Audit Corrections_ freeze (commit baseline
> `70d788f`). Any new variable MUST be added to this matrix **and** to
> `packages/shared-types/src/formatting.ts` (`QuantityKind`) before it
> can be rendered to the user.

---

## 1. Physics engine (`@flaha/soil-physics`)

| Variable                | Engine output                                                                     | Engine unit | DTO field (`WaterRetentionAnalysisBlock` / `BaseSoilPhysicsResult`) | DTO unit               | `QuantityKind`    | Precision | Interpretation rule (`@flaha/soil-interpretation`)          |
| ----------------------- | --------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------- | ---------------------- | ----------------- | --------- | ----------------------------------------------------------- |
| Sand %                  | `calculateSoilPhysics.sand`                                                       | % w/w       | `texture.sand`, `texture.normalized.sand`                           | % w/w                  | `particlePercent` | 1         | `classifyTexture` (USDA polygons)                           |
| Silt %                  | `calculateSoilPhysics.silt`                                                       | % w/w       | `texture.silt`, `texture.normalized.silt`                           | % w/w                  | `particlePercent` | 1         | `classifyTexture`                                           |
| Clay %                  | `calculateSoilPhysics.clay`                                                       | % w/w       | `texture.clay`, `texture.normalized.clay`                           | % w/w                  | `particlePercent` | 1         | `classifyTexture`                                           |
| Organic matter %        | `calculateSoilPhysics.organicMatter`                                              | % w/w       | passthrough                                                         | % w/w                  | `particlePercent` | 1         | `classifyOrganicMatter`                                     |
| Field capacity (θFC)    | `calculateSoilPhysics.fieldCapacity`                                              | % v/v       | `waterRetention.fieldCapacity.waterContentVolPercent`               | **% v/v** (WS1)        | `waterContent`    | 1         | (anchor for PAW)                                            |
| Wilting point (θWP)     | `calculateSoilPhysics.wiltingPoint`                                               | % v/v       | `waterRetention.wiltingPoint.waterContentVolPercent`                | **% v/v** (WS1)        | `waterContent`    | 1         | (anchor for PAW)                                            |
| Plant available water   | `calculateSoilPhysics.plantAvailableWater`                                        | **% v/v**   | `waterRetention.plantAvailableWater`                                | **% v/v** (WS1)        | `waterContent`    | 1         | `classifyWaterHolding` (Low <10, Mod 10–15, High ≥15) — WS3 |
| Saturation (θS)         | `calculateSoilPhysics.saturation`                                                 | % v/v       | `waterRetention.saturation.waterContentVolPercent`                  | % v/v                  | `waterContent`    | 1         | —                                                           |
| Ksat                    | `calculateSoilPhysics.saturatedConductivity`                                      | mm/h        | passthrough                                                         | mm/h                   | `conductivity`    | 2         | `classifyDrainageFromKsat`, `classifyInfiltration`          |
| Air-entry tension (ψae) | `waterRetentionCurve.airEntryTensionKpa`                                          | kPa         | `waterRetention.airEntryTensionKpa`                                 | kPa (WS1)              | `tensionKpa`      | 1         | —                                                           |
| Tension @ FC / WP / MAD | `waterRetentionCurve.{fieldCapacity,wiltingPoint,irrigationThreshold}.tensionKpa` | kPa         | same                                                                | kPa (WS1)              | `tensionKpa`      | 1         | —                                                           |
| pF                      | `waterRetentionCurve.points[].pF`                                                 | unitless    | same                                                                | log₁₀(cm H₂O)          | `pF`              | 2         | —                                                           |
| ρN (predicted BD)       | `calculateSoilPhysics.predictedBulkDensity`                                       | g/cm³       | `waterRetention.bulkDensity.predicted` (WS2)                        | g/cm³                  | `bulkDensity`     | 2         | —                                                           |
| ρDF (used BD)           | `calculateSoilPhysics.bulkDensityUsed`                                            | g/cm³       | `waterRetention.bulkDensity.used` (WS2)                             | g/cm³                  | `bulkDensity`     | 2         | `classifyCompactionRisk`                                    |
| BD provenance           | `calculateSoilPhysics.bulkDensitySource`                                          | enum        | `waterRetention.bulkDensity.source` (WS2)                           | `USER_INPUT`/`DEFAULT` | —                 | —         | —                                                           |
| Porosity                | `calculateSoilPhysics.porosity`                                                   | % v/v       | passthrough                                                         | % v/v                  | `waterContent`    | 1         | —                                                           |

**WS1 unit anchor:** every retention-curve field that previously
floated as a bare number now carries an explicit `units` block
(`waterContent: "% v/v"`, `tension: "kPa"`, `plantAvailableWater:
"% v/v"`). The PAW unit was the root cause of audit defect R1 — the
interpretation rule was anchored to depth-integrated `mm/m`
thresholds (50 / 150) while the engine emitted `% v/v`, which
forced every realistic mineral soil into "Low".

---

## 2. Chemistry engine (`@flaha/soil-chemistry`)

| Variable             | Engine output                             | Engine unit   | DTO field (`StructureAnalysisBlock` / report) | DTO unit             | `QuantityKind`     | Precision | Interpretation rule                                            |
| -------------------- | ----------------------------------------- | ------------- | --------------------------------------------- | -------------------- | ------------------ | --------- | -------------------------------------------------------------- |
| CEC                  | `calculateSoilChemistry.cec`              | cmol(+)/kg    | `structure.cec` + `cecSource` (B5)            | **cmol(+)/kg** (WS5) | `cec`              | 1         | `classifyCec`                                                  |
| Ca, Mg, K, Na (exch) | `calculateSoilChemistry.{ca,mg,k,na}`     | cmol(+)/kg    | `exchangeableCations.{ca,mg,k,na}` + `unit`   | **cmol(+)/kg** (B4)  | `cation`           | 2         | (used by triangle + ratios)                                    |
| K (plant-available)  | macronutrient input `kMgKg` (B6)          | mg/kg         | macronutrient cell (separate from exch. K)    | **mg/kg**            | `nutrientMgKg`     | 1         | (fertility only — never mirrored from exchangeable K)          |
| Ca/Mg/K saturation % | `calculateSoilChemistry.{ca,mg,k}Percent` | % of CEC      | `structure.normalized.{ca,mg,k}`              | % of (Ca+Mg+K)       | `cationSaturation` | 1         | `classifyCationBalance` (Ca 60-75, Mg 10-20, K 2-5)            |
| Base saturation      | `calculateSoilChemistry.baseSaturation`   | % of CEC      | report `baseSaturation`                       | %                    | `baseSaturation`   | 1         | `classifyBaseSaturation`                                       |
| ESP                  | `calculateSoilChemistry.esp`              | % of CEC      | report `esp`                                  | %                    | `esp`              | 1         | `classifySodiumRisk`, `classifySodicitySeverity`               |
| SAR                  | `calculateSoilChemistry.sar`              | (mmol/L)^½    | report `sar`                                  | unitless ratio       | `sar`              | 2         | `classifySodicitySeverity` (fallback when ESP absent)          |
| pH (1:5 H₂O)         | `calculateSoilChemistry.ph`               | dimensionless | passthrough                                   | (–)                  | `pH`               | 2         | `classifyPh`                                                   |
| EC (ECe or 1:5)      | `calculateSoilChemistry.ec`               | dS/m          | passthrough                                   | dS/m                 | `ec`               | 2         | `classifySalinity`, `classifySalinitySeverity` (FAO-29 on ECe) |
| Ca:Mg / Ca:K / Mg:K  | `summariseCationStructure.*Ratio`         | dimensionless | `structure.{caMg,caK,mgK}Ratio`               | ratio                | `ratio`            | 2         | (diagnostic only)                                              |
| BCSR disclaimer      | `STRUCTURE_TRIANGLE_DISCLAIMER`           | string        | `structure.disclaimer` (WS5)                  | text                 | —                  | —         | mandatory on every triangle surface                            |

**WS5 disclaimer.** Every wire surface that exposes the structure
triangle MUST also carry `STRUCTURE_TRIANGLE_DISCLAIMER` (Kopittke &
Menzies 2007, SSSAJ 71:259-265). The disclaimer is checked in
`packages/soil-chemistry/src/__tests__/reference-sample.test.ts` to
prevent silent removal.

**B5 — CEC provenance.** The report carries a `cecSource` of `LAB` /
`DERIVED_CATION_SUM` / `ESTIMATED` / `MISSING`. Only `LAB` is a
measured value; every other source renders a **Provisional CEC**
banner. Derived CEC must never be presented as lab CEC.

**B4 / B6 — cation unit separation.** Exchangeable Ca/Mg/K/Na are
`cmol(+)/kg` (`ExchangeableCationsBlock`); plant-available K is
`mg/kg` (`kMgKg` macronutrient cell). Exchangeable K must not be
displayed as K mg/kg — the two are never mirrored at the renderer.

**B10 — structure-triangle display honesty.** The triangle backdrop is
the SVG asset `public/assets/img/Structure Triangle.svg` (served at
`/assets/img/Structure%20Triangle.svg`). The plotted point uses CEC
saturation barycentric coordinates (`Ca/CEC`, `Mg/CEC`, residual =
`100 − Ca_sat − Mg_sat`). The SVG zone polygons are a **visual
reference only and are not digitized**; classification comes from
`@flaha/soil-chemistry` threshold rules (`STRUCTURE_THRESHOLDS`),
reported separately. SVG zone-polygon classification is not claimed.

---

## 3. Interpretation engine (`@flaha/soil-interpretation`)

The interpretation layer performs **no recomputation** — it consumes
the canonical units above and emits qualitative categories. The
overall rating is reconciled through `ratingTrace` (WS3):

| Bucket             | Triggers                                                                                                    | Effect on `overallSoilRating` |
| ------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `severe`           | salinityRisk=Severe, sodiumRisk=High, phCategory∈{Strongly Acidic, Highly Alkaline}                         | → `Poor`                      |
| `moderateNegative` | salinityRisk=Moderate, sodiumRisk=Moderate, waterHoldingClass=Low (PAW < 10 %v/v), cationBalance=Imbalanced | → `Fair`                      |
| `positive`         | everything else (Neutral pH, Low salinity, ≥Moderate CEC, ≥50 % BS, Low ESP)                                | → `Good` when no negatives    |

`decision = ratingTrace.decision` and is always one of `Poor` / `Fair`
/ `Good`. The engine emits the trace verbatim on every call so the UI
card and the PDF report can show _why_ a rating was assigned.

---

## 4. Evidence-coverage engine — `SoilTestLevel` contract (WS4 + Correction)

**Critical correction (Phase 10A.7).** The first WS4 iteration introduced
a generic "Basic / Professional / Advanced" panel system that conflated
report-tier marketing with the _declared_ `SoilTestLevel` of a soil
test. That has been reverted. `SoilTestLevel` (`PRELIMINARY` /
`MODERATE` / `ADVANCED`) is the **single primary evidence contract**;
the coverage engine derives completeness _relative to the declared
level_, never against a parallel taxonomy.

Architecture:

```
SoilTestLevel
  → expected modules (texture / pH+salinity / cations / macros / micros / carbonates / sodicity)
  → submitted lab inputs (texture + chemistry rows)
  → per-module status (Met / Partial / Missing / NotRequired)
  → LevelCompleteness roll-up + statement
```

Expected modules per level (cumulative — ADVANCED requires MODERATE +
PRELIMINARY; MODERATE requires PRELIMINARY):

| Module                | PRELIMINARY | MODERATE | ADVANCED |
| --------------------- | :---------: | :------: | :------: |
| `texture`             |  required   | required | required |
| `basicChemistry`      |  required   | required | required |
| `cations`             |      —      | required | required |
| `macroNutrients`      |      —      | required | required |
| `micronutrients`      |      —      |    —     | required |
| `carbonates`          |      —      |    —     | required |
| `sodicity` (SAR/ESP)  |      —      |    —     | required |
| `physics` (BD/gravel) |  optional   | optional | optional |

Counting rules:

- Each field is one expected slot.
- Alternate groups (e.g. `EC` _or_ `TDS`) collapse to a single slot —
  any member key present satisfies the slot.
- `extraSubmittedFields` are submitted-but-not-expected keys; they
  never lower a status. Extras are reported so the lab gets credit
  for going further than the declared level.
- `coveragePercent = satisfied / expected × 100`, one decimal.

Wire surfaces (added Phase 10A.7 Correction):

- `ScientificAnalysisResponse.coverage` (`scientific-analysis.ts`).
- `ProfessionalReportDTO.completeness` (`professional-report.ts`).
- Pure engine: `packages/shared-types/src/scientific-coverage.ts`
  (`computeScientificCoverage()` + `SOIL_TEST_LEVEL_EXPECTATIONS`).

Renderer surfaces:

- HTML/PDF report: `evidenceTemplate` in `defaultTemplate2.ts` →
  "Requested test level / Evidence completeness" section.
- Scientific Analysis tab: `CoverageBanner` in `ScientificAnalysisPanel.tsx`.
- Chemistry results card: `EmptyChemistryState` in
  `ChemistryResultCard.tsx` — PRELIMINARY tests no longer render the
  legacy "No chemistry result yet" message; they surface the salinity
  panel inline with a level-aware caption.

---

## 5. Cross-reference

- Engine code: `packages/soil-physics/src/`, `packages/soil-chemistry/src/`, `packages/soil-interpretation/src/`.
- DTO contracts: `packages/shared-types/src/scientific-analysis.ts`, `packages/shared-types/src/professional-report.ts`.
- Formatting registry: `packages/shared-types/src/formatting.ts` (`QuantityKind`, `QUANTITY_PRECISION`, `formatQuantity`).
- Regression fixtures (audit reference sample 60/25/15):
  - `packages/soil-physics/src/__tests__/reference-sample.test.ts`
  - `packages/soil-chemistry/src/__tests__/reference-sample.test.ts`
  - `packages/soil-interpretation/src/__tests__/reference-sample.test.ts`
