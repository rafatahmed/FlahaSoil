<!-- @format -->

# Soil Water Retention — Methodology

## 1. Status & Scientific Honesty Label

`IMPLEMENTED` — Field capacity (θ33), wilting point (θ1500), plant-available
water (PAW), and saturation (θS) are produced by the production Saxton & Rawls
(2006) engine and reported on every test. This is the active default and the
only retention method wired into the standard pipeline.

Provenance: `PEER_REVIEWED` (Saxton & Rawls 2006).

## 2. Purpose & Scope

Estimate the soil-water retention points that bound plant-available water,
from texture (sand, clay) plus optional organic matter and a density factor.

In scope: θ33, θ1500, θS, PAW, and the air-entry tension that anchors the
retention curve. Out of scope: hydraulic conductivity (Paper 3), alternative
parametric curve models (Paper 10), and any chemical property.

## 3. Scientific Background

Saxton & Rawls (2006) is a pedotransfer model: a set of regression equations
that predict water content at fixed matric potentials from routinely measured
texture and organic matter. Field capacity is taken at −33 kPa and permanent
wilting point at −1500 kPa; PAW is the difference between them, expressed as a
volumetric percentage.

## 4. Governing Equations & Rules

The engine implements the 24-equation Saxton-Rawls sequence verbatim. The
retention-relevant subset:

- **Eq 1 — θ1500t** (wilting-point regression) in S, C, OM and cross-terms.
- **Eq 2 — θ33t** (field-capacity regression).
- **Eq 3 — θ(S−33)t** (the saturation-to-33 kPa moisture difference).
- **Eq 4 — Ψe** (air-entry tension), clamped at `max(0, Ψe)`.
- **Eq 5 — θS** = θ33t + θ(S−33)t − 0.097·S + 0.043, clamped to
  `[thetaSMin, thetaSMax]`.
- **Eq 9 — θ33-DF** density-adjusted field capacity (quadratic correction).
- **Eq 10 — θ(S−33)DF** = θS-DF − θ33-DF, floored at `thetaS33DFMin`.
- **θ1500-DF** density-adjusted wilting point, floored at
  `theta1500DFMin = 0.001` (BUG-10C-C-02) so the logs in Eqs 11–12 never
  receive a non-positive argument.

**Reported points** (`formatResultsByPlan`):

- `fieldCapacity = θ33-DF × 100` (% v/v, 1 dp)
- `wiltingPoint = θ1500-DF × 100` (% v/v, 1 dp)
- `plantAvailableWater = (θ33-DF − θ1500-DF) × 100` (% v/v, 1 dp)
- `saturation = θS-DF × 100` (% v/v, 1 dp)

## 5. Inputs & Units

| Input | Unit | Default |
| ----- | ---- | ------- |
| `sand` | % mass | required |
| `clay` | % mass | required |
| `organicMatter` | % mass (0–8) | `DEFAULTS.organicMatter` |
| `densityFactor` (ρDF) | g/cm³ | `DEFAULTS.densityFactor` |

Internally S, C, OM are converted to decimal fractions before the regressions.

## 6. Outputs & Units

| Output | Unit | Notes |
| ------ | ---- | ----- |
| `fieldCapacity` | % v/v | θ at −33 kPa |
| `wiltingPoint` | % v/v | θ at −1500 kPa |
| `plantAvailableWater` | % v/v | FC − WP |
| `saturation` | % v/v | porosity-equivalent |
| `airEntryTension` | kPa | Ψe-adj (Professional+) |

All numeric outputs are emitted as `toFixed(1)` strings for legacy parity.

## 7. Source of Truth

- `packages/soil-physics/src/calculateSoilPhysics.ts` —
  `calculateMoistureRegressions` (Eqs 1–5), `calculateDensityEffects`
  (Eqs 6–10), `formatResultsByPlan` (reported points).
- `packages/soil-physics/src/constants.ts` — `CLAMPS`, `DEFAULTS`.
- `packages/soil-physics/src/waterRetentionCurve.ts` — curve-point sampler.

## 8. Assumptions

- Particle density is 2.65 g/cm³ (mineral soil).
- FC = −33 kPa and WP = −1500 kPa (standard agronomic conventions).
- The density factor ρDF stands in for measured bulk density when no lab
  value is supplied; its provenance is reported as `DEFAULT` vs `USER_INPUT`.

## 9. Limitations

- Pedotransfer **estimate**, not pressure-plate measurement; accuracy is
  bounded by the published Saxton-Rawls standard errors and R² values.
- Extreme-domain inputs (e.g. the pure-sand apex) are clamped for numerical
  stability; clamps fire only at physically extreme corners.
- PAW is volumetric % v/v, not depth-integrated mm; downstream interpretation
  thresholds were corrected to this scale in Phase 10A.7.

## 10. Validation & Evidence

- `packages/soil-physics/src/__tests__/physics.test.ts` pins five canonical
  soils × three plan tiers byte-for-byte against the legacy baseline.
- `reference-sample.test.ts` locks the Phase 10A.7 audit sample
  (60/25/15, OM 2.5, ρDF 1.30) to 0.1 % v/v precision.
- Phase 10C-C asserts FC increases monotonically coarse → fine across the 12
  USDA classes.

## 11. References

- Saxton, K.E. & Rawls, W.J. (2006). Soil water characteristic estimates by
  texture and organic matter. *SSSAJ* 70:1569–1578.
- Brady, N.C. & Weil, R.R. (14th ed.) Table 5.3 — interpretive PAW ranges.

## 12. Provenance & Change Log

| Date | Change |
| ---- | ------ |
| Phase 2.1 | Saxton-Rawls engine ported byte-for-byte from legacy service. |
| Phase 10A.7 | PAW confirmed as % v/v; bulk-density provenance trace added. |
| Phase 10C-C | θ1500-DF floor `0.001` added (BUG-10C-C-02). |

## 13. Audit Notes

- No regression coefficient, clamp value, or `toFixed` precision was changed
  by this white paper.
- The BUG-10C-C-02 floor is a numerical guard at the sand apex only; typical
  soils have θ1500-DF far above the floor.
