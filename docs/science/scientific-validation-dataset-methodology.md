<!-- @format -->

# Scientific Validation Dataset — Methodology

## 1. Status & Scientific Honesty Label

`IMPLEMENTED` — A formal benchmark dataset validates that, under the
`FLAHA_DEFAULT` control profile, FlahaSOIL returns scientifically consistent
texture, physics, chemistry, and interpretation outputs across a spread of
soils.

Provenance: `SYNTHETIC_BENCHMARK` — every benchmark is synthetic. The dataset
validates **internal consistency and expected scientific ranges**, not
measured field accuracy. Measured/regional calibration is reserved for a later
phase (the `LAB_MEASURED` / `REGIONAL_DATASET` source slots are intentionally
unused).

## 2. Purpose & Scope

Pin the production pipeline against a documented, provenance-tagged set of
benchmark soils so regressions in scientific behaviour are caught
deterministically.

In scope: benchmark inputs, their categories and provenance, and the
consistency assertions (ranges and orderings). Out of scope: proving universal
field accuracy and any production formula or threshold (unchanged).

## 3. Scientific Background

Pedotransfer and interpretation engines must behave monotonically and within
agronomically plausible ranges (e.g. field capacity rises coarse → fine; CEC
ordering low < moderate < high). A curated benchmark set turns those
expectations into executable, auditable checks.

## 4. Governing Equations & Rules

This is a dataset + harness, not a formula. Structure:

- **Inputs** live in `scientificValidationDataset.ts` (texture/physics and
  optional chemistry per benchmark).
- **Expected outputs / ranges** live in `scientificValidationExpectations.ts`.
- **Harness** in `runScientificValidation.ts` runs the production pipeline
  under `FLAHA_DEFAULT` and asserts each expectation.

**Provenance types** (`BenchmarkSourceType`): `SYNTHETIC_BENCHMARK`,
`LITERATURE_REFERENCE`, `LAB_MEASURED`, `REGIONAL_DATASET` (only the first is
used in this phase).

**Categories** (`BenchmarkCategory`): `TEXTURE_PHYSICS`, `CHEMISTRY`,
`SALINITY_SODICITY`, `EVIDENCE_COMPLETENESS`, `EDGE_ROBUSTNESS`.

## 5. Inputs & Units

| Input group | Fields | Units |
| ----------- | ------ | ----- |
| Texture/physics | sand/silt/clay, organicMatter, bulkDensity?, gravelContent? | % mass, %, g/cm³, % vol |
| Chemistry (optional) | pH, ecDsM, cec, ca/mg/k/na, n, p, micros, carbonate, bicarbonate, sar, esp | mixed (cmol(+)/kg, dS/m, …) |
| Declared level | `SoilTestLevel` | enum |

## 6. Outputs & Units

The dataset itself emits no values; the harness produces pass/fail assertions
against expected ranges and orderings (field capacity monotonicity, CEC
ordering, finite Ksat across all benchmarks, no-NaN base saturation, etc.).

## 7. Source of Truth

- `backend/src/services/__tests__/fixtures/scientificValidationDataset.ts` —
  benchmark inputs + provenance/category metadata.
- `backend/src/services/__tests__/fixtures/scientificValidationExpectations.ts`
  — expected ranges/orderings.
- `backend/src/services/__tests__/runScientificValidation.ts` — harness.

## 8. Assumptions

- All benchmarks are evaluated under the `FLAHA_DEFAULT` control profile.
- Synthetic inputs are physically plausible and chosen to span the texture
  triangle and the chemistry/salinity ladders.
- Expected outputs encode **ranges and orderings**, not single golden values,
  to validate scientific behaviour rather than byte-for-byte legacy parity
  (which is covered separately by the physics golden suite).

## 9. Limitations

- `SYNTHETIC_BENCHMARK` only — the dataset does not prove universal field
  accuracy and is not a measured calibration set.
- Coverage is bounded by the chosen benchmarks; it complements, but does not
  replace, the per-package unit suites.

## 10. Validation & Evidence

- Phase 10C-C achieved a full verification matrix (563 passed, 1 skipped, 0
  failures) with this dataset green.
- BUG-10C-C-01 (texture misclassification) and BUG-10C-C-02 (θ1500-DF floor)
  were found and fixed via this dataset.

## 11. References

- Saxton, K.E. & Rawls, W.J. (2006). *SSSAJ* 70:1569–1578.
- USDA NRCS Soil Survey Manual — interpretive ranges used as expectations.
- FAO Irrigation & Drainage Paper 29 — salinity/sodicity ladders.

## 12. Provenance & Change Log

| Date | Change |
| ---- | ------ |
| Phase 10C-C | Benchmark dataset, expectations, and harness introduced. |
| Phase 10C-E | Documented as shipped; no benchmark or expectation changed. |

## 13. Audit Notes

- No benchmark input, expectation, or production formula was modified by this
  white paper.
- The `LAB_MEASURED` / `REGIONAL_DATASET` source slots remain intentionally
  unused, marking the boundary of current validation claims.
