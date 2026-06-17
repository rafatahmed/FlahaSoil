<!-- @format -->

# Scientific Calibration Standards — Methodology

## 1. Status & Scientific Honesty Label

`IMPLEMENTED` — A calibration-profile registry documents which scientific
methods are wired into FlahaSOIL and their provenance. Exactly one profile,
`FLAHA_DEFAULT`, is `ACTIVE` and mirrors the live pipeline; every other
profile is metadata-only.

Provenance: mixed and explicitly labelled per method — `PEER_REVIEWED` for the
calculation engines and FAO-29 severities, `HOUSE_CONVENTION` for the
project-specific interpretation thresholds.

## 2. Purpose & Scope

Provide a single auditable record of every scientific method behind a
FlahaSOIL result, its source, and whether that source is peer-reviewed — so a
reviewer can trace any reported value to its method.

In scope: the profile registry, the `FLAHA_DEFAULT` method list, and the
peer-reviewed/house-convention split. Out of scope: the executable thresholds
themselves (they live in `rules.ts` and the engine packages and are documented
in Papers 1–7); introducing a profile here changes **no** behaviour.

## 3. Scientific Background

A defensible soil report must distinguish established science (e.g. Saxton &
Rawls, FAO-29) from project conventions adopted for consistency. The
calibration registry makes this distinction first-class metadata rather than
tribal knowledge.

## 4. Governing Equations & Rules

This is a metadata registry — no formulas.

**Profile statuses** (`ScientificCalibrationProfile.status`):

- `ACTIVE` — wired into production. **Only `FLAHA_DEFAULT`.**
- `REFERENCE_ONLY` — documented for comparison (USDA_EXTENSION,
  ALBRECHT_BEAR, EUROFINS_STYLE).
- `PROVISIONAL` — drafted, not validated, not active (MENA_ARID_REGION).
- `FUTURE` — reserved slot, not yet defined (CUSTOM_ORGANIZATION).

**Method provenance** (`CalibrationMethod.peerReviewed`): `true` for a
recognised standard/publication, `false` for a house convention pending
citation. The live threshold values are **not** duplicated here; they remain
in the engines, keeping a single source of truth.

**Peer-reviewed methods** in `FLAHA_DEFAULT_METHODS`: soil-water physics
(Saxton & Rawls 2006), soil chemistry (USDA NRCS / Sparks 2003), salinity &
sodicity severity (FAO-29), water-holding class (Brady & Weil / NRCS).

**House-convention methods**: pH category, legacy salinity risk, CEC level,
base saturation, sodium risk (ESP), cation balance (BCSR windows), organic
matter, drainage-from-Ksat, infiltration, compaction risk, texture
suitability.

## 5. Inputs & Units

Not applicable — this layer is metadata describing methods, not a calculator.

## 6. Outputs & Units

| Output | Type | Notes |
| ------ | ---- | ----- |
| `CALIBRATION_PROFILES` | record | all profiles keyed by id |
| `FLAHA_DEFAULT` | profile | the only `ACTIVE` profile |
| `FLAHA_DEFAULT_METHODS` | `CalibrationMethod[]` | per-method provenance audit |

## 7. Source of Truth

- `packages/soil-interpretation/src/calibration/calibrationProfiles.ts` —
  registry and the `FLAHA_DEFAULT` profile.
- `packages/soil-interpretation/src/calibration/calibrationMetadata.ts` —
  `FLAHA_DEFAULT_METHODS` provenance list.
- `packages/soil-interpretation/src/calibration/calibrationTypes.ts` — types.

## 8. Assumptions

- The `FLAHA_DEFAULT` method list is kept in lock-step with the engine
  implementations; it is a provenance audit, not an alternate set of values.
- Reference/provisional/future profiles carry empty `methods` arrays because
  they are not wired to any engine.

## 9. Limitations

- Only `FLAHA_DEFAULT` is active; the other profiles are documentation and
  roadmap, not switchable behaviour, in this phase.
- A `peerReviewed: false` method is not wrong — it is a deliberate project
  convention that has not yet been mapped to an external citation.

## 10. Validation & Evidence

- `packages/soil-interpretation/src/__tests__/` — registry invariants
  (single `ACTIVE` profile; `FLAHA_DEFAULT` mirrors the live methods).
- The per-method provenance is cross-checked against the thresholds documented
  in Papers 1–7.

## 11. References

- Saxton, K.E. & Rawls, W.J. (2006). *SSSAJ* 70:1569–1578.
- Ayers, R.S. & Westcot, D.W. (1985). FAO Irrigation & Drainage Paper 29.
- Sparks, D.L. (2003). *Environmental Soil Chemistry*, 2nd ed.
- Brady, N.C. & Weil, R.R. (14th ed.).

## 12. Provenance & Change Log

| Date | Change |
| ---- | ------ |
| Phase 10C-A | Calibration registry + `FLAHA_DEFAULT` method audit introduced. |
| Phase 10C-E | Documented as shipped; no profile activated, no method changed. |

## 13. Audit Notes

- No profile was activated and no method provenance flag was changed by this
  white paper.
- The registry remains metadata-only; `FLAHA_DEFAULT` is the sole control
  profile for all validation work.
