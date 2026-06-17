<!-- @format -->

# FlahaSOIL — Scientific White Papers

This directory contains the formal, explainable, and auditable scientific
methodology documentation for FlahaSOIL v2. Each white paper describes one
production methodology exactly as it is implemented in code — no methodology
is invented, embellished, or promised here that the engine does not perform.

These documents are the **single human-readable source of scientific truth**
for the platform. They are kept in lock-step with the implementation; when an
engine changes, its white paper changes in the same phase.

---

## Scientific honesty labels

Every white paper, and every method inside it, carries one of the following
status labels. The label states precisely how far the method is wired into
the production pipeline. Nothing is overstated.

| Label                | Meaning                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `IMPLEMENTED`        | Wired into the production pipeline under `FLAHA_DEFAULT` and covered by tests.            |
| `PARAMETER_REQUIRED` | Implemented and computable, but only when the user supplies explicit parameters/data.    |
| `REFERENCE_ONLY`     | Documented for comparison/audit; **not** wired to any engine.                            |
| `PROVISIONAL`        | Drafted on the roadmap; **not** validated end-to-end and **not** active.                 |
| `FUTURE`             | Reserved registry slot; **not** computable in the current release.                       |

Threshold provenance is additionally tagged:

| Provenance         | Meaning                                                                       |
| ------------------ | ----------------------------------------------------------------------------- |
| `PEER_REVIEWED`    | Sourced from a recognised standard or peer-reviewed publication.              |
| `HOUSE_CONVENTION` | A FlahaSOIL project convention; defensible but pending a peer-reviewed cite.  |

---

## Methodology template

Every white paper follows the same 13-section template so the corpus is
uniform and machine-checkable (see `scienceDocsInventory.test.ts`):

1. Status & Scientific Honesty Label
2. Purpose & Scope
3. Scientific Background
4. Governing Equations & Rules
5. Inputs & Units
6. Outputs & Units
7. Source of Truth
8. Assumptions
9. Limitations
10. Validation & Evidence
11. References
12. Provenance & Change Log
13. Audit Notes

---

## Index of white papers

| #  | White paper                                                                          | Primary status       | Supporting phase |
| -- | ------------------------------------------------------------------------------------ | -------------------- | ---------------- |
| 1  | [Texture Triangle](./texture-triangle-methodology.md)                                | `IMPLEMENTED`        | 10C-C            |
| 2  | [Soil Water Retention](./soil-water-retention-methodology.md)                        | `IMPLEMENTED`        | 2.1 / 10A.7      |
| 3  | [Soil Physics](./soil-physics-methodology.md)                                        | `IMPLEMENTED`        | 2.1 / 10B        |
| 4  | [Soil Chemistry](./soil-chemistry-methodology.md)                                    | `IMPLEMENTED`        | 2.3 / 10A.7      |
| 5  | [CEC & Base Saturation](./cec-base-saturation-methodology.md)                        | `IMPLEMENTED`        | 2.3              |
| 6  | [Salinity & Sodicity](./salinity-sodicity-methodology.md)                            | `IMPLEMENTED`        | 8D               |
| 7  | [Evidence Completeness](./evidence-completeness-methodology.md)                      | `IMPLEMENTED`        | 10A.7            |
| 8  | [Scientific Calibration Standards](./scientific-calibration-standards-methodology.md)| `IMPLEMENTED`        | 10C-A            |
| 9  | [Scientific Validation Dataset](./scientific-validation-dataset-methodology.md)      | `IMPLEMENTED`        | 10C-C            |
| 10 | [Water Retention Model Framework](./water-retention-model-framework-methodology.md)  | `PARAMETER_REQUIRED` | 10C-B            |

---

## Reading guide

- The **production default** for all soil-water physics is Saxton & Rawls
  (2006); the alternative retention models (Paper 10) are `PARAMETER_REQUIRED`
  and do not replace the default.
- The **active calibration profile** is `FLAHA_DEFAULT` (Paper 8); every other
  profile is `REFERENCE_ONLY`, `PROVISIONAL`, or `FUTURE`.
- Where a threshold is a `HOUSE_CONVENTION`, the white paper says so plainly so
  that no agronomic claim is published beyond what the evidence supports.

---

## Cross-references

| Topic                      | Implementation                                                        | Phase doc                                            |
| -------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| Saxton-Rawls engine        | `packages/soil-physics/src/calculateSoilPhysics.ts`                  | `docs/v2-physics-validation.md`                      |
| USDA polygon classifier    | `packages/soil-physics/src/textureTriangle.ts`                       | `docs/v2-phase10c-c-scientific-validation-dataset.md`|
| Chemistry engine           | `packages/soil-chemistry/src/calculateSoilChemistry.ts`             | `docs/v2-phase10a7-scientific-audit-corrections.md`  |
| Interpretation rules       | `packages/soil-interpretation/src/rules.ts`                          | `docs/v2-scientific-analysis.md`                     |
| Calibration registry       | `packages/soil-interpretation/src/calibration/`                     | `docs/v2-phase10c-a-scientific-calibration-framework.md` |
| Evidence completeness      | `packages/shared-types/src/scientific-coverage.ts`                  | `docs/v2-scientific-analysis.md`                     |
| Retention model registry   | `packages/soil-physics/src/waterRetention/`                         | `docs/v2-phase10c-b-advanced-water-retention-models.md` |
| Validation dataset         | `backend/src/services/__tests__/fixtures/scientificValidationDataset.ts` | `docs/v2-phase10c-c-scientific-validation-dataset.md` |
