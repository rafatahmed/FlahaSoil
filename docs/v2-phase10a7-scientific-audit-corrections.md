<!-- @format -->

# FlahaSOIL v2 — Phase 10A.7 Scientific Audit Corrections

> Closes the release-blocking findings from the Phase 10S-3 / 10S-4
> scientific audits. Baseline: `70d788f`.
>
> **Status: MERGED.** Phase 10A.7 is merged into `main` and tagged
> `v0.10.7-phase-10a7`.
>
> - Scientific corrections commit: `2e1ab7f`
> - Backend test-stability commit: `9282d6b`
> - Merge commit: `f70acbb`
>
> A concise release sign-off (final verification matrix, non-blocking
> warnings, and known technical debt) is recorded in
> `docs/v2-phase10a7-release-summary.md`.

---

## 1. Audit findings addressed

| ID  | Severity | Source | Defect                                                                                                                                          | Workstream |
| --- | -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| R1  | Blocker  | 10S-4  | `classifyWaterHolding` compared **% v/v** PAW against **mm/m** thresholds (50 / 150) → every mineral soil → "Low" → rating clamped to "Poor".   | WS3        |
| R2  | Blocker  | 10S-3  | Same sample reported `bulkDensity = 1.59` (predicted ρN) while the math actually used `1.30` (default ρDF); no field exposed the discrepancy.   | WS2        |
| R3  | Blocker  | 10S-3  | Bear/Albrecht (BCSR) structure triangle rendered without the Kopittke & Menzies (2007) caveat that BCSR lacks consistent peer-reviewed support. | WS5        |
| R4  | High     | 10S-4  | Unit drift across UI ↔ API ↔ report (no explicit `% v/v` / `kPa` / `cmol(+)/kg` markers on the wire).                                           | WS1        |
| R5  | High     | 10S-3  | Overall soil rating opaque — users could not see which categories contributed.                                                                  | WS3        |
| R6  | High     | 10S-4  | Free-tier `bulkDensity.toFixed(3)` vs Pro-tier `toFixed(2)` drift; no canonical precision registry.                                             | WS6        |
| R7  | High     | 10S-3  | Professional report could silently emit "Advanced" coverage even when key analytes were missing.                                                | WS4        |
| R8  | Medium   | 10S-4  | No regression guard pinning the audit reference sample to its expected outputs.                                                                 | WS7        |

---

## 2. Workstream summary

### WS1 — Unit integrity (R4)

- Added `WaterRetentionUnits` block to `WaterRetentionAnalysisBlock`
  with literal `% v/v` / `kPa` types.
- Added `unit: "cmol(+)/kg"` to `StructureAnalysisBlock`.
- All retention chart axes and structure triangle labels now read the
  unit from the DTO instead of hard-coded strings.

### WS2 — Bulk-density traceability (R2)

- Engine now emits **three** BD fields:
  - `predictedBulkDensity` — ρN from Saxton-Rawls Eq 6.
  - `bulkDensityUsed` — ρDF actually consumed by the density-adjusted equations.
  - `bulkDensitySource` — `USER_INPUT` | `DEFAULT`.
- Echoed onto `WaterRetentionAnalysisBlock.bulkDensity { predicted, used, source, unit }`.
- Surfaced on the Scientific Analysis panel, the PDF report soil-physics card, and the FlahaCalc export.

### WS3 — Rating engine transparency (R1 + R5)

- Corrected `classifyWaterHolding` thresholds to volumetric percent (`<10` Low / `10-15` Moderate / `≥15` High), per Brady & Weil 14 ed. Table 5.3 and the USDA NRCS Soil Survey Manual.
- Introduced `RatingTraceEntry[]` buckets (`severe`, `moderateNegative`, `positive`) + `decision`. Always present, even when no input categories fire.
- UI: dedicated "Why this rating?" card on the Scientific Analysis tab.

### WS4 — Evidence-coverage engine (R7) + `SoilTestLevel` correction

- **Critical correction.** The first WS4 iteration introduced a generic
  "Basic / Professional / Advanced" report-tier panel taxonomy that
  competed with the existing `SoilTestLevel` (`PRELIMINARY` /
  `MODERATE` / `ADVANCED`) contract. That has been reverted.
  `SoilTestLevel` is now the **single primary evidence contract**.
- New pure engine: `packages/shared-types/src/scientific-coverage.ts`
  (`computeScientificCoverage()` + `SOIL_TEST_LEVEL_EXPECTATIONS`).
  Modules: `texture`, `basicChemistry`, `cations`, `macroNutrients`,
  `micronutrients`, `carbonates`, `sodicity`, `physics`. Alternate
  groups (`EC` _or_ `TDS`) collapse to a single slot.
- DTO additions: `ScientificCoverage`, `LevelCompleteness`,
  `CoverageModule`, `CoverageStatus` (`Met` / `Partial` / `Missing` /
  `NotRequired`). Both `ScientificAnalysisResponse.coverage` and
  `ProfessionalReportDTO.completeness` carry the same payload so the
  UI and the PDF render identical evidence statements.
- Renderer changes:
  - HTML/PDF report: new `evidenceTemplate` in `defaultTemplate2.ts`
    emits a "Requested test level / Evidence completeness" section
    with a per-module Met / Partial / Missing table.
  - Scientific Analysis tab: `CoverageBanner` in
    `ScientificAnalysisPanel.tsx` shows the declared level + status
    chip + level-aware statement above the three charts.
  - Chemistry results card: `EmptyChemistryState` replaces the legacy
    "No chemistry result yet" copy. PRELIMINARY tests now surface the
    submitted pH / EC / TDS inline with the caption "Cation balance
    is not required at the Preliminary test level". MODERATE /
    ADVANCED tests prompt the lab to submit the missing cation panel
    and quote the declared level in the prompt.
- Backward compatibility: `completeness` is optional on the report
  DTO so persisted snapshots from before the correction still render
  (the new template prints a "no evidence-coverage snapshot available"
  fallback).

### WS5 — Structure triangle disclaimer (R3)

- New constant `STRUCTURE_TRIANGLE_DISCLAIMER` in `@flaha/soil-chemistry` (Kopittke & Menzies 2007 citation).
- Surfaced on `StructureAnalysisBlock.disclaimer`, the React triangle card, and the PDF report chemistry section.

### WS6 — Central number formatting (R6)

- New module `packages/shared-types/src/formatting.ts` with `QuantityKind`, `QUANTITY_PRECISION`, `formatQuantity`, `roundQuantity`, `MISSING_VALUE_PLACEHOLDER`.
- All result cards, the report HTML renderer, and the FlahaCalc export now route every numeric value through `formatQuantity`. New variables MUST register a `QuantityKind` before they can be rendered.

### WS7 — Locked regression fixture (R8)

Audit reference sample `Sand 60, Silt 25, Clay 15, OM 2.5, CEC 18, Ca 11, Mg 3, K 0.6, Na 0.4, pH 7.2, EC 1.0` pinned to its post-correction outputs in three new test files:

- `packages/soil-physics/src/__tests__/reference-sample.test.ts` — FC 18.3 %v/v, WP 8.9 %v/v, PAW 9.4 %v/v, Sat 50.9 %v/v, Ksat 82.8 mm/h, ρN 1.588, ρDF 1.300, source `DEFAULT`.
- `packages/soil-chemistry/src/__tests__/reference-sample.test.ts` — Ca 61.1 %, Mg 16.7 %, K 3.3 %, Na 2.2 %, ESP 2.22 %, BS 83.3 %, SAR 0.15, structure `Balanced`, disclaimer present.
- `packages/soil-interpretation/src/__tests__/reference-sample.test.ts` — overall rating `Fair`; exactly one `moderateNegative` (PAW < 10 %v/v); six positives; explicit guard that rating is **not** `Poor` (regression for R1).

---

## 3. Files changed

```text
backend/src/services/report/composeProfessionalReport.ts
backend/src/services/report/renderer/htmlEscape.ts
backend/src/services/scientificAnalysis.service.ts
frontend/src/features/results/components/StructureTriangleChart.tsx
frontend/src/features/results/components/WaterRetentionCurveChart.tsx
frontend/src/features/results/components/__tests__/ScientificAnalysisPanel.test.tsx  (new)
frontend/src/services/mockApiV2Client.ts
packages/shared-types/src/formatting.ts                                              (new)
packages/shared-types/src/index.ts
packages/shared-types/src/professional-report.ts
packages/shared-types/src/scientific-analysis.ts
packages/soil-chemistry/src/structureTriangle.ts
packages/soil-chemistry/src/__tests__/reference-sample.test.ts                       (new)
packages/soil-interpretation/src/__tests__/extended.test.ts
packages/soil-interpretation/src/__tests__/interpretation.test.ts
packages/soil-interpretation/src/__tests__/reference-sample.test.ts                  (new)
packages/soil-interpretation/src/interpretSoil.ts
packages/soil-interpretation/src/rules.ts
packages/soil-interpretation/src/types.ts
packages/soil-physics/src/calculateSoilPhysics.ts
packages/soil-physics/src/types.ts
packages/soil-physics/src/waterRetentionCurve.ts
packages/soil-physics/src/__tests__/reference-sample.test.ts                         (new)
scripts/audit-reference-sample.mts                                                   (new)
scripts/browser-smoke-sa.mjs                                                         (new)
scripts/dev-v2.ps1

# Phase 10A.7 Correction — SoilTestLevel as Evidence Contract
backend/src/services/__tests__/scientificCoverage.test.ts                            (new)
backend/src/services/report/renderer/defaultRenderer.ts
backend/src/services/report/renderer/defaultTemplate2.ts
frontend/src/features/results/components/ChemistryResultCard.tsx
frontend/src/features/results/components/ScientificAnalysisPanel.tsx
frontend/src/features/results/components/__tests__/ChemistryResultCard.test.tsx      (new)
frontend/src/pages/SoilTestDetailPage.tsx
packages/shared-types/src/scientific-coverage.ts                                     (new)
```

---

## 4. Tests added

| File                                                                                  | Cases                                                                                           |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/soil-physics/src/__tests__/reference-sample.test.ts`                        | 5                                                                                               |
| `packages/soil-chemistry/src/__tests__/reference-sample.test.ts`                      | 4                                                                                               |
| `packages/soil-interpretation/src/__tests__/reference-sample.test.ts`                 | 4                                                                                               |
| `frontend/src/features/results/components/__tests__/ScientificAnalysisPanel.test.tsx` | (existing component tests extended for disclaimer + BD trace)                                   |
| `backend/src/services/__tests__/scientificCoverage.test.ts`                           | 8 — Categories A (PRELIMINARY), B (MODERATE), C (ADVANCED) plus alternate-group + extras edges. |
| `frontend/src/features/results/components/__tests__/ChemistryResultCard.test.tsx`     | 4 — level-aware empty-state proof (PRELIMINARY no longer says "No chemistry result yet").       |

Existing tests updated to assert the new `ratingTrace` shape:

- `packages/soil-interpretation/src/__tests__/interpretation.test.ts`
- `packages/soil-interpretation/src/__tests__/extended.test.ts`

---

## 5. Test Infrastructure Stability (Post-Commit Fixes)

The Phase 10A.7 verification revealed two pre-existing stability issues in the backend test suite on Windows.

### 5.1 Native Module Crash (argon2)

- **Root Cause**: Vitest's default multi-fork pool loads the `argon2` native module concurrently in multiple processes, triggering a Windows access violation (`0xC0000005`).
- **Fix**: Added `backend/vitest.config.ts` to force `poolOptions.forks.singleFork = true`. This ensures deterministic, serial execution of backend tests, eliminating the crash.

### 5.2 Flaky JWT Tamper Test

- **Root Cause**: `jwt.test.ts` tampered with tokens by flipping the final character of the base64url signature. Due to padding/encoding rules, this occasionally resulted in a valid (unchanged) signature, causing intermittent test failure.
- **Fix**: Updated the test to mutate a character in the JWT payload section, which guaranteed a signature mismatch.

### 5.3 Cross-Test Environment Leak

- **Root Cause**: `app.test.ts` set `process.env.ALLOW_DEV_AUTH="true"` at module load without restoration. Under the new `singleFork` model, this leaked into `emailProvider.test.ts`, causing production-mode validation to fail.
- **Fix**: Added `afterAll` cleanup in `app.test.ts` to restore the environment state.

---

## 6. Reporting-contract clarifications (B-series)

These items refine how Phase 10A.7 surfaces chemistry and bulk-density
provenance in the professional report. They are unit/provenance honesty
rules, not new calculations.

### 6.1 CEC provenance (B5)

The report never silently promotes a non-lab CEC to a lab measurement.
`CecSource` (`packages/shared-types/src/professional-report.ts`) is one
of:

```text
LAB                — `cec` came directly from the chemistry input row.
DERIVED_CATION_SUM — LAB mode with no CEC input; engine summed cations.
ESTIMATED          — ESTIMATED mode (clay × 0.5 + organic matter × 2).
MISSING            — no chemistry result was produced.
```

`deriveCecSource` (`composeProfessionalReport.ts`) selects the value
and `cecSourceBanner` (`renderer/defaultTemplate.ts`) renders a
**Provisional CEC** banner for any non-`LAB` source. Derived CEC must
be presented as provisional, not as lab CEC.

### 6.2 Exchangeable cations vs plant-available K (B4 / B6)

Exchangeable cations and plant-available nutrients carry different
units and MUST NOT be merged at the renderer:

```text
Exchangeable Ca, Mg, K, Na = cmol(+)/kg   (ExchangeableCationsBlock)
Plant-available / extractable K = mg/kg   (macronutrient cell, `kMgKg`)
```

The chemistry input row stores `k` as **exchangeable K in cmol(+)/kg**.
It is not mirrored into the mg/kg macronutrient cell (doing so would
drop the unit and mislead by a factor of ~390). Until a dedicated
`kMgKg` field is supplied, the report renders the plant-available K
cell as missing. Only sulphur (S) remains in the mg/kg secondary block.

### 6.3 CEC structure triangle — display honesty (B10)

```text
SVG asset:     public/assets/img/Structure Triangle.svg
Frontend path: /assets/img/Structure%20Triangle.svg
```

The plotted point uses **CEC saturation** barycentric coordinates:

```text
Ca saturation  = Ca / CEC × 100
Mg saturation  = Mg / CEC × 100
Residual CEC   = 100 − Ca saturation − Mg saturation
```

Honesty rule: the SVG's coloured zone polygons are a **visual
background only**. They are not digitized, so SVG zone-polygon
classification is **not** claimed. The verdict label comes from the
`@flaha/soil-chemistry` threshold rules (`STRUCTURE_THRESHOLDS`),
reported separately from the plotted saturation point.

### 6.4 Salinity / sodicity reference gate

The locked reference sample pins benign salinity/sodicity so the rule
layer cannot regress into spurious remediation advice:

```text
Reference sample: EC = 1.00 dS/m, SAR ≈ 0.15, ESP ≈ 2.22 %

Expected: Salinity = None or Low
          Sodicity = None or Low
          No gypsum recommendation
          No leaching recommendation
          No salt-tolerant-crop recommendation
```

This is asserted in
`packages/soil-chemistry/src/__tests__/reference-sample.test.ts`.

---

## 7. Final verification (merged on `main`)

```text
API typecheck: PASS
API tests:     22 passed / 1 skipped files, 206 passed / 1 skipped tests

Web typecheck: PASS
Web tests:     10 passed files, 40 passed tests
Web build:     PASS

Soil physics tests:        70 passed
Soil chemistry tests:      45 passed
Soil interpretation tests: 37 passed
```

Backend stability: the suite runs in single-fork mode (see §5) and
exited cleanly across repeated runs on Windows. Full sign-off, commit
references, non-blocking warnings, and technical debt are recorded in
`docs/v2-phase10a7-release-summary.md`.

---

## 8. References

- USDA NRCS Soil Survey Manual (Handbook 18), Ch. 3 (texture) and Ch. 5 (water).
- Saxton, K.E. & Rawls, W.J. (2006). _Soil water characteristic estimates by texture and organic matter for hydrologic solutions._ SSSAJ 70:1569-1578.
- Brady, N.C. & Weil, R.R. (14 ed., 2017). _The Nature and Properties of Soils_, Table 5.3 (PAW ranges by texture).
- Kopittke, P.M. & Menzies, N.W. (2007). _A review of the use of the basic cation saturation ratio and the "ideal" soil._ SSSAJ 71:259-265.
- FAO Irrigation & Drainage Paper 29 — Water Quality for Agriculture (salinity / sodicity severities).
- Sumner, M.E. & Miller, W.P. (1996). _Cation Exchange Capacity and Exchange Coefficients._ Methods of Soil Analysis, Part 3 (SSSA Book Series 5).
- Eurofins Agro & BLGG lab-report conventions (CEC + base-saturation reporting style).
- Companion reference: `docs/v2-scientific-unit-matrix.md`.
