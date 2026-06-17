<!-- @format -->

# Water-Retention Model Framework — Methodology

## 1. Status & Scientific Honesty Label

`IMPLEMENTED` (framework) — A metadata-driven registry catalogues the
water-retention models FlahaSOIL knows about, their status, required
parameters, producible outputs, and citations. The registry performs **no
computation**; it governs which models are selectable and computable.

Provenance: per-model and explicitly labelled. The production default
(Saxton & Rawls 2006) is `PEER_REVIEWED` and active; alternative parametric
models are `PARAMETER_REQUIRED`; pedotransfer/custom slots are `FUTURE`.

## 2. Purpose & Scope

Make the retention-model landscape explicit and enforce that exactly one model
is the production default, while allowing parametric curve models when a user
supplies the required parameters.

In scope: the model registry, its invariants, and per-model status/parameters.
Out of scope: the Saxton-Rawls retention arithmetic (Paper 2) and the physics
engine (Paper 3); selecting an alternative model changes no production default.

## 3. Scientific Background

Soil-water retention can be described by pedotransfer regressions (texture →
θ) or by parametric curve models (van Genuchten, Brooks-Corey, Campbell) whose
parameters are fitted or measured. A laboratory-measured curve is the most
direct. FlahaSOIL keeps the peer-reviewed pedotransfer model as the default and
exposes the others behind explicit parameter requirements.

## 4. Governing Equations & Rules

The registry is metadata only. Enforced **invariants**:

- Exactly one model has status `ACTIVE_DEFAULT` — `SAXTON_RAWLS_2006`.
- Exactly one model has `productionDefault === true` — `SAXTON_RAWLS_2006`.
- All model IDs are unique.
- `FUTURE` / `REFERENCE_ONLY` models are not computable.

**Model statuses:**

- `ACTIVE_DEFAULT` — Saxton & Rawls (2006); requires `sand`, `clay` (optional
  `organicMatter`, `densityFactor`); outputs FC, WP, PAW, saturation, curve
  points.
- `PARAMETER_REQUIRED` — Van Genuchten (1980), Brooks & Corey (1964),
  Campbell (1974), Laboratory-Measured Curve. Computable only when their
  explicit parameters are supplied; they output curve points only (no FC/WP).
- `FUTURE` — Rosetta/HYPRES pedotransfer, Custom Organization Model. Not
  computable in this phase.

**Parameter validation** (`waterRetentionValidation.ts`) returns `OK`,
`MISSING_PARAMETERS`, or `INVALID_INPUT` so a caller never silently computes a
curve from absent parameters.

## 5. Inputs & Units

| Model | Required parameters | Units |
| ----- | ------------------- | ----- |
| Saxton-Rawls | sand, clay (texture) | % mass |
| Van Genuchten | thetaR, thetaS, alpha, n (m optional) | cm³/cm³, 1/kPa, – |
| Brooks-Corey | thetaR, thetaS, airEntryPressure, lambda | cm³/cm³, kPa, – |
| Campbell | thetaS, airEntryPotential, b | cm³/cm³, kPa, – |
| Lab-measured | measuredCurve (≥ 2 points) | kPa, cm³/cm³ |

## 6. Outputs & Units

| Output | Notes |
| ------ | ----- |
| `WATER_RETENTION_MODELS` | frozen registry keyed by model id |
| `curvePoints` | (ψ, θ) pairs for parametric/lab models |
| FC / WP / PAW / saturation | Saxton-Rawls only (production default) |
| validation result | `OK` / `MISSING_PARAMETERS` / `INVALID_INPUT` |

## 7. Source of Truth

- `packages/soil-physics/src/waterRetention/waterRetentionModels.ts` —
  registry and invariants.
- `packages/soil-physics/src/waterRetention/waterRetentionTypes.ts` — types.
- `packages/soil-physics/src/waterRetention/waterRetentionValidation.ts` —
  parameter validation.

## 8. Assumptions

- The production pipeline uses only the `ACTIVE_DEFAULT` (Saxton-Rawls); the
  framework does not change which model the standard report runs.
- Parametric models require explicit parameters; FlahaSOIL never estimates
  van Genuchten / Brooks-Corey / Campbell parameters from texture.
- The lab-measured model invents no data and requires ≥ 2 explicit points.

## 9. Limitations

- Only Saxton-Rawls derives FC/WP/PAW; the parametric models produce curve
  points only.
- `FUTURE` models (Rosetta/HYPRES, custom) are catalogued but not computable in
  this phase.
- The registry is metadata; it does not itself render or persist curves.

## 10. Validation & Evidence

- `packages/soil-physics/src/__tests__/waterRetentionModels.test.ts` —
  registry invariants (single `ACTIVE_DEFAULT`, single `productionDefault`,
  unique IDs, non-computable FUTURE models).
- `waterRetentionValidation.test.ts` — `OK` / `MISSING_PARAMETERS` /
  `INVALID_INPUT` outcomes.
- `waterRetentionResolver.test.ts` — model selection path.

## 11. References

- Saxton, K.E. & Rawls, W.J. (2006). *SSSAJ* 70:1569–1578.
- van Genuchten, M.Th. (1980). *SSSAJ* 44:892–898.
- Brooks, R.H. & Corey, A.T. (1964). Hydrology Paper 3, CSU.
- Campbell, G.S. (1974). *Soil Science* 117:311–314.
- Schaap et al. (2001); Wösten et al. (1999) — Rosetta / HYPRES.

## 12. Provenance & Change Log

| Date | Change |
| ---- | ------ |
| Phase 10C-B | Water-retention model registry + validation introduced. |
| Phase 10C-E | Documented as shipped; Saxton-Rawls remains sole default. |

## 13. Audit Notes

- No model was activated or made default beyond Saxton & Rawls (2006) by this
  white paper.
- The registry is `Object.freeze`-d and its invariants are enforced by test.
