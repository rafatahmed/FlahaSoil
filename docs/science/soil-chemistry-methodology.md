<!-- @format -->

# Soil Chemistry — Methodology

## 1. Status & Scientific Honesty Label

`IMPLEMENTED` — The chemistry engine is a pure-function calculator that
produces CEC, base saturation, individual cation percentages, ESP, SAR, and a
cation-balance residual. It computes numbers only; all qualitative judgement
lives in the interpretation layer (Papers 5–6).

Provenance: `PEER_REVIEWED` (standard soil-chemistry equations, USDA NRCS /
Sparks 2003; Richards 1954 for ESP).

## 2. Purpose & Scope

Convert a chemistry panel (CEC and base cations, or texture for estimated CEC)
into the derived ratios used downstream for fertility, sodicity, and balance
assessment.

In scope: CEC resolution (LAB vs ESTIMATED), cation %, base saturation, ESP,
SAR, cation-balance residual. Out of scope: pH/EC classification thresholds
(interpretation layer) and any physics property.

## 3. Scientific Background

The cation-exchange complex holds exchangeable Ca, Mg, K, and Na. Their shares
of total CEC define base saturation and balance; the sodium share (ESP) and
the sodium adsorption ratio (SAR) diagnose sodicity hazard. When measured CEC
is unavailable, CEC can be estimated from clay and organic-matter content via
linear coefficients.

## 4. Governing Equations & Rules

**CEC resolution** (`resolveCecAndCations`):

- `LAB` mode: `cec = input.cec` if supplied, else the sum of supplied base
  cations `ca + mg + k + na`.
- `ESTIMATED` mode: `cec = clay·CLAY_CEC_COEFFICIENT + OM·OM_CEC_COEFFICIENT`
  (clay and OM are guaranteed present by validation).
- A resolved CEC below `MIN_VALID_CEC` throws (division-by-zero guard).

**Derived ratios** (all clamped to `[0, 100]`):

- `caPercent = ca/cec·100` (and likewise mg, k, na).
- `baseSaturation = (ca+mg+k+na)/cec·100`.
- `esp = naPercent` (Richards 1954, USDA Handbook 60).
- `cationBalanceOther = 100 − (caPercent + mgPercent)`.

**SAR** — emitted only when **both** Ca and Mg are supplied:
`SAR = Na / sqrt((Ca + Mg)/2)`, all in cmol(+)/kg; a denominator below
`MIN_SAR_DENOM` yields SAR = 0, and any non-finite result is coerced to 0.

## 5. Inputs & Units

| Input | Unit | Notes |
| ----- | ---- | ----- |
| `mode` | `LAB` \| `ESTIMATED` | selects CEC resolution |
| `cec` | cmol(+)/kg | LAB, optional |
| `ca`, `mg`, `k`, `na` | cmol(+)/kg | default 0 when omitted |
| `clay`, `organicMatter` | % mass | required in ESTIMATED |
| `ph`, `ec` | – / dS/m | echoed through if supplied |

## 6. Outputs & Units

| Output | Unit | Notes |
| ------ | ---- | ----- |
| `cec` | cmol(+)/kg | resolved value |
| `baseSaturation` | % | clamped 0–100 |
| `caPercent`/`mgPercent`/`kPercent`/`naPercent` | % | clamped 0–100 |
| `esp` | % | = naPercent |
| `cationBalanceOther` | % | residual not held by Ca+Mg |
| `sar` | – | only when Ca & Mg supplied |
| `calculationMode` | enum | provenance of CEC |

## 7. Source of Truth

- `packages/soil-chemistry/src/calculateSoilChemistry.ts` — engine.
- `packages/soil-chemistry/src/constants.ts` — `CLAY_CEC_COEFFICIENT`,
  `OM_CEC_COEFFICIENT`, `MIN_VALID_CEC`, `MIN_SAR_DENOM`, percent bounds.
- `packages/soil-chemistry/src/validation.ts` — input validation.

## 8. Assumptions

- All cation concentrations are in cmol(+)/kg on the same exchange basis.
- Omitted cations default to 0, never to an imputed estimate.
- ESP equals the sodium percentage of CEC (exchange-complex convention).

## 9. Limitations

- Estimated CEC is a linear texture/OM proxy; it is not a substitute for a
  measured CEC and is flagged via `calculationMode`.
- SAR requires both Ca and Mg; otherwise it is intentionally omitted rather
  than approximated.
- The engine never interprets — a high ESP here is a number, not a verdict.

## 10. Validation & Evidence

- `packages/soil-chemistry/src/__tests__/` — engine unit tests (45 passing).
- Phase 10C-C chemistry benchmarks assert `cecSource = LAB`,
  `calculationMode = LAB`, and CEC ordering low < moderate < high.
- `BENCH_EDGE_ZERO_CATIONS_01` confirms absent cations produce no NaN base
  saturation.

## 11. References

- Sparks, D.L. (2003). *Environmental Soil Chemistry*, 2nd ed.
- USDA NRCS — Soil Survey Laboratory Methods Manual.
- U.S. Salinity Laboratory Staff / Richards, L.A. (1954). USDA Handbook 60.

## 12. Provenance & Change Log

| Date | Change |
| ---- | ------ |
| Phase 2.3 | Chemistry engine introduced (calculation-only contract). |
| Phase 10A.7 | CEC provenance (`LAB`/`ESTIMATED`) surfaced to reports. |

## 13. Audit Notes

- No coefficient or clamp was changed by this white paper.
- The determinism contract (no state, no randomness, no I/O) is part of the
  engine's module header and is relied upon by the golden regression suite.
