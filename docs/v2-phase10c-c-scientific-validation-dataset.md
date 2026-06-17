<!-- @format -->

# FlahaSOIL v2 — Phase 10C-C: Scientific Validation Dataset

## 1. Purpose

Phase 10C-C creates a formal **Scientific Validation Dataset** for FlahaSOIL v2.  
It validates that, under the **FLAHA_DEFAULT** control profile, the production pipeline returns internally consistent, scientifically defensible outputs across texture, physics, chemistry, salinity/sodicity, evidence-completeness, and edge/robustness scenarios.

This phase is **not** about:

- New formulas or models
- Chart or PDF polish
- Recommendation engines
- Alternative calibration profiles

---

## 2. Baseline

| Item          | Value                                                       |
| ------------- | ----------------------------------------------------------- |
| Branch        | `phase-10c-c-scientific-validation-dataset`                 |
| Branched from | `main` after Phase 10C-A merge + tag `v0.10.10-phase-10c-a` |
| Working tree  | Clean at branch start                                       |

---

## 3. Dataset Architecture

```
backend/src/services/__tests__/fixtures/
  scientificValidationDataset.ts   — benchmark inputs + provenance metadata
  runScientificValidation.ts       — harness: seeds Prisma in-memory store,
                                     runs full pipeline, returns ProfessionalReportDTO
backend/src/services/__tests__/
  scientificValidationDataset.test.ts — all validation tests
```

The dataset and harness are self-contained. They can be moved to a future `packages/scientific-validation/` workspace without modification.

---

## 4. Benchmark Groups

| Category                  | Count  | Purpose                                                          |
| ------------------------- | ------ | ---------------------------------------------------------------- |
| A — Texture / Physics     | 12     | All 12 USDA texture classes, Saxton-Rawls physics                |
| B — Chemistry             | 3      | Low / moderate / high CEC; cation balance                        |
| C — Salinity / Sodicity   | 4      | Normal, saline, sodic, saline-sodic                              |
| D — Evidence Completeness | 6      | PRELIMINARY, MODERATE full, ADVANCED full, missing panels        |
| E — Edge / Robustness     | 6      | Extreme sand, extreme clay, high/low OM, high BD, absent cations |
| **Total**                 | **31** |                                                                  |

---

## 5. Source Type Definitions

| Type                   | Used in Phase 10C-C | Meaning                                 |
| ---------------------- | ------------------- | --------------------------------------- |
| `SYNTHETIC_BENCHMARK`  | All 31 benchmarks   | Synthetic, center-of-class compositions |
| `LITERATURE_REFERENCE` | Reserved            | Published measured retention curves     |
| `LAB_MEASURED`         | Reserved            | Actual pressure-plate data              |
| `REGIONAL_DATASET`     | Reserved            | Field survey averages                   |

---

## 6. Expectation Policy

| Type            | What is asserted                                                                                                     | Source of truth                                                    |
| --------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Exact**       | USDA texture class, CEC source, BD source, salinity/sodicity severity, coverage status, missing/partial module lists | External deterministic standards (USDA Soil Survey Manual; FAO-29) |
| **Range**       | FC, WP, PAW, saturation, porosity, Ksat, BD — must be finite                                                         | Model outputs; finitude is the contract                            |
| **Qualitative** | Salinity/sodicity label direction (None / not-None); ESP ≥ 15 for sodic                                              | FLAHA_DEFAULT label logic                                          |

> **Rule:** USDA texture class expectations are NEVER bent to match model output.  
> If the model returns a wrong class, the model is fixed, not the expectation.

---

## 7. BUG-10C-C-01 — USDA Sandy Clay Loam Classification Defect

| Field                     | Value                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Discovered by             | Phase 10C-C validation dataset (BENCH_SANDY_CLAY_LOAM_01)                                                                            |
| Input                     | sand=60%, silt=15%, clay=25%                                                                                                         |
| Previous incorrect output | "Loam"                                                                                                                               |
| Correct USDA output       | "Sandy Clay Loam"                                                                                                                    |
| Root cause                | `determineSoilTextureClass` required `clay >= 27` for Sandy Clay Loam, missing the 20–26% clay wedge where sand > 45% and silt < 28% |
| Fix file                  | `packages/soil-physics/src/calculateSoilPhysics.ts`                                                                                  |
| Fix                       | Extended Sandy Clay Loam logic to include the lower clay wedge (clay ≥ 20, sand > 45, silt < 28)                                     |
| Nature                    | Deterministic USDA standard correction. Not a calibration change, not a new model, not a report polish change.                       |
| Regression test           | `packages/soil-physics/src/__tests__/physics.test.ts` — 6 boundary cases                                                             |

### Golden Impact

| Item                                               | Change                                                                      |
| -------------------------------------------------- | --------------------------------------------------------------------------- |
| `backend/.../goldenReportIntegrity.test.ts`        | Comments updated to reflect Sandy Clay Loam                                 |
| `backend/.../professionalReportGoldenHtml.test.ts` | Executive-summary assertion updated to "Sandy Clay Loam"                    |
| Physics numeric outputs                            | **Unchanged** — texture label correction does not alter Saxton-Rawls values |

---

## 8. BUG-10C-C-02 — theta1500DF NaN at Sand Apex

| Field           | Value                                                                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Discovered by   | Phase 10C-C edge benchmark BENCH_EDGE_EXTREME_SAND_01                                                                                                                                                                          |
| Input           | sand=99%, silt=1%, clay=0%, OM=0.2%                                                                                                                                                                                            |
| Symptom         | `saturatedConductivity` was NaN (masked as `null` in JSON)                                                                                                                                                                     |
| Root cause      | Saxton-Rawls Eq-1 regression yields θ1500t ≈ 0.007 for extreme sand. Density adjustment `θ1500t + 0.14·θ1500t − 0.02` produces **θ1500DF ≈ −0.012** (negative). `Math.log(negative)` → NaN → propagates through B, lambda, KS. |
| Fix file        | `packages/soil-physics/src/calculateSoilPhysics.ts` (+ `constants.ts`)                                                                                                                                                         |
| Fix             | Added `CLAMPS.theta1500DFMin = 0.001` and applied `Math.max(CLAMPS.theta1500DFMin, ...)` in `calculateDensityEffects` — mirrors the same pattern as BUG-10B-01 (thetaS33DFMin)                                                 |
| Regression test | `packages/soil-physics/src/__tests__/physics.test.ts` — 3 new cases                                                                                                                                                            |
| Status          | **Fixed**                                                                                                                                                                                                                      |
| Scientific note | Sand=99% clay=0% is a valid pedological input (engineered sand, beach sand, desert erg). The Saxton-Rawls regression was not calibrated for this extreme, but the model must not emit NaN for valid inputs.                    |

### Impact on Other Soils

The `theta1500DFMin = 0.001` floor activates only when `theta1500t < 0.02/1.14 ≈ 0.01754`. All soils with clay > 0% or OM > 1% have theta1500t well above this threshold. Legacy baseline regression tests for all five canonical soils remain bit-exact.

---

## 9. Golden Impact (Combined)

| Test file                              | Change                                                               |
| -------------------------------------- | -------------------------------------------------------------------- |
| `goldenReportIntegrity.test.ts`        | BUG-10C-C-01 label update (comments only, assertion logic unchanged) |
| `professionalReportGoldenHtml.test.ts` | Executive-summary "Sandy Clay Loam" assertion                        |

No new golden snapshot files were created or removed.

---

## 10. Scientific Honesty Statement

> This dataset validates **internal consistency** under FLAHA_DEFAULT only.
>
> - It is NOT measured laboratory calibration.
> - It is NOT pressure-plate retention validation.
> - It does NOT validate Van Genuchten, Brooks-Corey, or Campbell parameters.
> - It does NOT activate alternative calibration profiles (USDA_EXTENSION, ALBRECHT_BEAR, etc.).
> - It does NOT create recommendation authority.
> - It does NOT prove universal field accuracy.
>
> Every benchmark is `SYNTHETIC_BENCHMARK`. Measured and regional datasets are reserved for a later phase.

---

## 11. Known Limitations

| Limitation                   | Detail                                                                                                                                                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Saxton-Rawls domain boundary | The model was calibrated on USDA-NRCS soils with sand 5–90%, clay 5–60%, OM 0.5–8%. The extreme benchmarks (99/1/0 and 5/5/90) probe the model at or beyond its calibration boundary. Results in these ranges are engineering approximations, not validated predictions. |
| Extreme clay breakdown       | For BENCH_EDGE_EXTREME_CLAY_01 (5/5/90) Saxton-Rawls can produce field capacity < wilting point; the pipeline does not throw but the numeric values may be physically inconsistent. Documented: FC is asserted as `null or finite`.                                      |
| Synthetic inputs only        | All 31 benchmarks are synthetic center-of-class compositions. Validation against published field datasets is a future deliverable.                                                                                                                                       |
| FLAHA_DEFAULT only           | Only the `ACTIVE` profile is exercised. Alternative profiles are wired but untested.                                                                                                                                                                                     |

---

## 12. Test Coverage

| Suite                 | Tests                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------- |
| Dataset integrity     | 5 (unique IDs, texture sums, category counts, source type)                               |
| Texture/physics       | 5 (12× USDA class exact, Ksat trend, FC trend, BD source, finitude)                      |
| Chemistry             | 4 (CEC source, calculation mode, CEC magnitude, salinity severity)                       |
| Salinity/sodicity     | 4 (normal, saline, sodic ESP≥15, saline-sodic)                                           |
| Evidence completeness | 5 (PRELIM Met 100%, ADVANCED Met 100%, missing cations, missing pH, missing micros)      |
| Edge/robustness       | 6 (no-throw, USER_INPUT BD, OM extremes, zero cations, clay apex, sand apex finite Ksat) |
| **Total**             | **29**                                                                                   |

---

## 13. Verification Matrix

| Workspace                    | typecheck    | Tests                                                  | build        |
| ---------------------------- | ------------ | ------------------------------------------------------ | ------------ |
| `@flaha/soil-physics`        | ✅           | ✅ **80 passed** (5 files, +3 BUG-10C-C-02 regression) | ✅           |
| `@flaha/soil-chemistry`      | ✅           | ✅ **45 passed** (3 files)                             | ✅           |
| `@flaha/soil-interpretation` | ✅           | ✅ **60 passed** (5 files)                             | ✅           |
| `@flaha/api` (backend)       | ✅           | ✅ **301 passed, 1 skipped** (28 files)                | ✅           |
| `@flaha/shared-types`        | ✅           | —                                                      | ✅           |
| `@flaha/web`                 | ✅           | ✅ **40 passed** (10 files)                            | ✅           |
| **Grand total**              | **all pass** | **526 passed, 1 skipped**                              | **all pass** |

Focused backend regression (5 suites): **95 passed** — goldenReportIntegrity, professionalReportGoldenHtml, scientificMatrixAudit, scientificMatrixReportConsistency, scientificValidationDataset.

---

## 14. Future Path — Measured Lab Dataset

The source-type slots `LAB_MEASURED` and `REGIONAL_DATASET` are intentionally unused in Phase 10C-C. A future phase should:

1. Source published pressure-plate retention data (e.g., UNSODA, Rosetta, HYPRES).
2. Add benchmarks with `sourceType: "LAB_MEASURED"` and exact θ33/θ1500 expected values.
3. Compute Saxton-Rawls error vs. measured values to quantify model RMSE.
4. Consider adding `REGIONAL_DATASET` benchmarks from MENA arid soils for local calibration validation.
