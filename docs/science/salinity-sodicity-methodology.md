<!-- @format -->

# Salinity & Sodicity Interpretation — Methodology

## 1. Status & Scientific Honesty Label

`IMPLEMENTED` — The interpretation layer classifies salinity (from EC) and
sodicity (from ESP and/or SAR) into ordinal severity classes. Two classifier
families coexist: a coarse legacy set and the FAO-29 severity set added in
Phase 8D.

Provenance: `PEER_REVIEWED` for the FAO-29 severity classifiers
(`classifySalinitySeverity`, `classifySodicitySeverity`); `HOUSE_CONVENTION`
for the coarse legacy classifiers (`classifySalinity`, `classifySodiumRisk`).

## 2. Purpose & Scope

Diagnose salt and sodium hazard from the chemistry panel so downstream
suitability and management messaging can react.

In scope: EC→salinity, ESP/SAR→sodicity severity bands, and the precedence
between ESP and SAR. Out of scope: the chemistry arithmetic that produces EC,
ESP, and SAR (Paper 4), and the suitability matrix that consumes severities.

## 3. Scientific Background

Salinity (soluble-salt concentration, measured as electrical conductivity ECe)
suppresses water uptake osmotically; sodicity (excess exchangeable sodium,
measured as ESP or inferred from SAR) degrades soil structure. FAO Irrigation
& Drainage Paper 29 (Ayers & Westcot 1985) provides the standard severity
breakpoints used here.

## 4. Governing Equations & Rules

Piecewise classifiers over pre-computed values; no formulas.

**Legacy salinity** (`classifySalinity`, dS/m — `HOUSE_CONVENTION`):
`<2` Low, `<4` Moderate, `<8` High, `≥8` Severe.

**FAO-29 salinity severity** (`classifySalinitySeverity`, ECe dS/m):
`<2` None, `<4` Slight, `<8` Moderate, `<16` Strong, `≥16` Severe.

**Legacy sodium risk** (`classifySodiumRisk`, ESP % — `HOUSE_CONVENTION`):
`<6` Low, `6–15` (inclusive) Moderate, `>15` High.

**FAO-29 sodicity severity** (`classifySodicitySeverity`). ESP wins when
supplied (more direct measure of the exchange complex); otherwise SAR is used;
if neither is supplied the result is `None`:

- ESP: `<5` None, `<10` Slight, `<15` Moderate, `<20` Strong, `≥20` Severe.
- SAR: `<3` None, `<6` Slight, `<9` Moderate, `<13` Strong, `≥13` Severe.

## 5. Inputs & Units

| Input | Unit | Notes |
| ----- | ---- | ----- |
| `ec` (ECe) | dS/m | salinity classifiers |
| `esp` | % | sodicity; takes precedence |
| `sar` | – | sodicity fallback when ESP absent |

## 6. Outputs & Units

| Output | Type | Values |
| ------ | ---- | ------ |
| Legacy salinity | string | Low / Moderate / High / Severe |
| Salinity severity | enum | None / Slight / Moderate / Strong / Severe |
| Legacy sodium risk | string | Low / Moderate / High |
| Sodicity severity | enum | None / Slight / Moderate / Strong / Severe |

## 7. Source of Truth

- `packages/soil-interpretation/src/rules.ts` — `classifySalinity`,
  `classifySalinitySeverity`, `classifySodiumRisk`,
  `classifySodicitySeverity`.
- `packages/soil-interpretation/src/interpretSoil.ts` — wiring and the
  suitability downgrades driven by severity (see Paper documenting suitability).

## 8. Assumptions

- EC is reported as saturated-paste extract ECe in dS/m (FAO-29 basis).
- ESP and SAR arrive pre-computed from the chemistry engine on a consistent
  cmol(+)/kg exchange basis.
- ESP is treated as the more direct sodicity indicator and overrides SAR when
  both are present.

## 9. Limitations

- Two salinity scales coexist (legacy + FAO-29); reports must state which is
  shown. The legacy scale is `HOUSE_CONVENTION`.
- When neither ESP nor SAR is supplied, sodicity defaults to `None` — an
  absence of evidence, not a confirmed absence of hazard.

## 10. Validation & Evidence

- `packages/soil-interpretation/src/__tests__/` — boundary tests for each
  FAO-29 and legacy band, including the ESP-over-SAR precedence.
- Phase 10C-C salinity/sodicity benchmarks exercise the severity ladder.

## 11. References

- Ayers, R.S. & Westcot, D.W. (1985). *Water Quality for Agriculture*, FAO
  Irrigation & Drainage Paper 29 (Rev. 1).
- U.S. Salinity Laboratory Staff / Richards, L.A. (1954). USDA Handbook 60.

## 12. Provenance & Change Log

| Date | Change |
| ---- | ------ |
| Phase 2.3 | Legacy salinity / sodium-risk classifiers introduced. |
| Phase 8D | FAO-29 salinity & sodicity severity classifiers added. |
| Phase 10C-E | Documented as shipped; no threshold changed. |

## 13. Audit Notes

- No breakpoint was modified by this white paper.
- The ESP-precedence rule and the FAO-29 vs legacy split are preserved exactly
  as implemented in `rules.ts`.
