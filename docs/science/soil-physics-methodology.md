<!-- @format -->

# Soil Physics — Methodology

## 1. Status & Scientific Honesty Label

`IMPLEMENTED` — The full Saxton & Rawls (2006) 24-equation engine is the
production physics core. Beyond the retention points (Paper 2) it derives
density, hydraulic conductivity, gravel corrections, additional properties,
and house soil-quality indicators. All outputs are tiered by plan
(FREE / PROFESSIONAL / ENTERPRISE).

Provenance: `PEER_REVIEWED` for the Saxton-Rawls formulas; `HOUSE_CONVENTION`
for the Soil Quality Index and the in-engine drainage/compaction/erosion
heuristics.

## 2. Purpose & Scope

Compute the physical hydraulic and structural properties of a soil from
texture and density, as a single deterministic pure function.

In scope: density (ρN, ρDF), tension parameters (A, B, λ), saturated and
unsaturated conductivity (Ksat, Ku), gravel effects, porosity/void ratio, and
quality indicators. Out of scope: chemistry and qualitative interpretation
(Papers 4–6), which consume these numbers downstream.

## 3. Scientific Background

The Saxton-Rawls system links texture and organic matter to a continuous
moisture-tension-conductivity description of the soil. The retention curve is
parameterised by A and B (Eqs 11–12); λ = 1/B controls the conductivity decay
(Eqs 13, 16–18). Conductivity follows a Brooks-Corey-type power law in
effective saturation.

## 4. Governing Equations & Rules

- **Eqs 6–8 — density:** ρN = (1 − θS)·2.65 (calculated normal density);
  ρDF = user density factor; θS-DF = 1 − ρDF/2.65, clamped.
- **Eqs 11–12 — A, B:** log-linear interpolation of the retention curve
  between 33 and 1500 kPa; A floored at `AMin`, B clamped to `[BMin, BMax]`.
- **Eq 13 — λ = 1/B**, clamped to `[lambdaMin, lambdaMax]`.
- **Eq 14 — Ψe-adj** = Ψe·(θ33-DF/θ33t)^(−B), floored at `psiEAdjMin`.
- **Eq 16 — Ksat** = `KS_COEFFICIENT · (θ(S−33)DF)^(3 − λ)`. Phase 10B
  (BUG-10B-01) uses the clamped θ(S−33)DF from Eq 10 to avoid
  `pow(negative, fractional) = NaN` for highly compacted heavy clays; result
  floored at `ksMin`.
- **Eqs 17–18 — Ku:** conductivity exponent `3 + 2/λ`; relative K
  `(θ33-DF/θS-DF)^exponent`; Ku = Ksat·relativeK.
- **Eqs 19–22 — gravel:** bulk density, PAW-bulk, bulk conductivity, and
  Kb/Ksat ratio (Professional+, only when gravel > 0). Legacy parity: Kb and
  the ratio inherit a documented `NaN` from the legacy destructure and are
  preserved verbatim.
- **Eqs 23–24 — salinity:** osmotic potential ΨO and ΨO at FC (Enterprise,
  EC > 0); see Paper 6.

**Quality indicators** (`HOUSE_CONVENTION`): a 0–10 Soil Quality Index from
PAW and Ksat bands, plus drainage/compaction/erosion labels derived from Ksat,
texture, and density.

## 5. Inputs & Units

| Input | Unit | Notes |
| ----- | ---- | ----- |
| `sand`, `clay` | % mass | required; `sand + clay ≤ 100` |
| `organicMatter` | % mass | 0–8, validated |
| `densityFactor` | g/cm³ | optional; provenance tracked |
| `gravelContent` | % vol | Professional+ |
| `electricalConductivity` | dS/m | Enterprise salinity |
| `userPlan` | enum | gates tiered outputs |

## 6. Outputs & Units

| Output | Unit | Tier |
| ------ | ---- | ---- |
| `saturatedConductivity` (Ksat) | mm/h | all |
| `unsaturatedConductivity` (Ku) | mm/h | Professional+ |
| `lambda`, `airEntryTension` | – / kPa | Professional+ |
| `bulkDensity`, `porosity`, `voidRatio` | g/cm³, %, – | all/Professional+ |
| `soilQualityIndex`, `drainageClass`, `compactionRisk`, `erosionRisk` | – | all |
| `parameterA`, `parameterB`, `relativeK`, osmotic potentials | – / kPa | Enterprise |

## 7. Source of Truth

- `packages/soil-physics/src/calculateSoilPhysics.ts` — all 24 equations and
  `formatResultsByPlan` tiering.
- `packages/soil-physics/src/constants.ts` — `CLAMPS`, `KS_COEFFICIENT`,
  `OSMOTIC_POTENTIAL_*`, `PARTICLE_DENSITY`, `CONFIDENCE_DATA`.

## 8. Assumptions

- Particle density 2.65 g/cm³; mineral soil.
- Pure function: no state, randomness, or I/O — identical input yields
  identical output, byte-for-byte.
- ρDF substitutes for measured bulk density when none is supplied.

## 9. Limitations

- Pedotransfer estimates inherit Saxton-Rawls standard errors (exposed as
  `confidenceIntervals` / `rSquaredValues` on Professional+).
- The Soil Quality Index and in-engine drainage/compaction/erosion labels are
  `HOUSE_CONVENTION` and must be reviewed before any external agronomic claim.
- Legacy `NaN` in gravel Kb/ratio is intentionally preserved (not a defect to
  fix without a baseline change).

## 10. Validation & Evidence

- `physics.test.ts` — 5 soils × 3 tiers byte-for-byte against legacy baseline.
- `bug-10b-01.test.ts` — Ksat is finite for highly compacted heavy clays.
- Phase 10C-C — Ksat finite across all 31 benchmarks including the sand apex.

## 11. References

- Saxton, K.E. & Rawls, W.J. (2006). *SSSAJ* 70:1569–1578.
- Brooks, R.H. & Corey, A.T. (1964). Hydrology Paper 3, Colorado State Univ.
- USDA NRCS Soil Survey Manual — drainage/infiltration interpretive ranges.

## 12. Provenance & Change Log

| Date | Change |
| ---- | ------ |
| Phase 2.1 | 24-equation engine ported byte-for-byte. |
| Phase 10B | BUG-10B-01 — Ksat domain guard via clamped θ(S−33)DF. |
| Phase 10A.7 | Bulk-density provenance (`USER_INPUT`/`DEFAULT`) surfaced. |

## 13. Audit Notes

- No formula, coefficient, clamp, or precision was altered by this white
  paper; it is a description of the shipped engine.
- Tiering (`FREE`/`PROFESSIONAL`/`ENTERPRISE`) is a packaging concern and does
  not change any computed value.
