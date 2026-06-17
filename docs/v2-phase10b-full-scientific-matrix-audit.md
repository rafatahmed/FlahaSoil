<!-- @format -->

# FlahaSOIL v2 — Phase 10B: Full Scientific Matrix Audit

## Purpose

Phase 10A.7 corrected the scientific/report contracts; Phase 10A.8 locked the three
canonical golden reports. Phase 10B widens coverage by auditing the engines and reporting
pipeline across a **broader scientific matrix** — texture/physics extremes, salinity ×
sodicity combinations, CEC source modes (LAB / derived / estimated), cation imbalance,
and missing-data evidence edges.

**No new scientific logic is introduced.** Phase 10B exercises the _existing_ Phase 10A.7
engines through the production pipeline and asserts on their real outputs. The single
production change is a **numerical robustness correction** (BUG-10B-01 — a Ksat domain
guard); no formula, threshold, or unit was altered. Where an output is otherwise
scientifically defective, the behaviour is documented as a tracked bug and locked as a
regression guard rather than silently patched.

- **Branch:** `phase-10b-full-scientific-matrix-audit`
- **Baseline:** `d949d23` (tag `v0.10.8-phase-10a8`, merge of Phase 10A.8 into `main`)

---

## Fixture & Test Locations

```
backend/src/services/__tests__/fixtures/
  scientificMatrixSoilTests.ts  ← matrix inputs (Categories A, B, C, D, E, F)
  runGoldenPipeline.ts          ← shared runner (seeds golden + matrix tests)
  goldenPrismaStore.ts          ← in-memory Prisma mock (re-used from 10A.8)
  normalizeReportHtml.ts        ← HTML normalisation pipeline (re-used from 10A.8)

backend/src/services/__tests__/
  scientificMatrixAudit.test.ts             ← 21 DTO-contract assertions
  scientificMatrixReportConsistency.test.ts ← DTO↔HTML consistency (Category G)

packages/soil-physics/src/__tests__/
  bug-10b-01.test.ts            ← BUG-10B-01 package-level regression guard
```

The matrix runner re-uses the Phase 10A.8 pipeline 1:1
(`calculateSoilTest → buildSoilTestReport → composeProfessionalReport → DefaultReportRenderer`),
so the DTO/HTML asserted here are the exact artefacts the live `/reports` endpoint produces.

---

## Matrix Categories & Cases

| Category                           | Focus                                                          | Cases                                                                                                          |
| ---------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **A — Texture / Physics**          | USDA class, Ksat, PAW, infiltration, bulk-density source       | A1 Very sandy (92/5/3), A4 Clay loam + user BD 1.55, A5 Heavy clay + extreme BD 1.60                           |
| **B — Salinity / Sodicity**        | FAO-29 severity unions, SAR/ESP, saline×sodic decoupling       | B2 Saline EC 8.5 / non-sodic, B3 Non-saline / sodic Na=6, B4 Saline EC 12 / sodic Na=7                         |
| **C — CEC / Cations**              | CEC provenance, derived sum, surplus handling                  | C2 Derived CEC (sum), C3 pH/EC-only → MISSING, C5 Cation surplus (Σ 18 > CEC 12), C6 Missing CEC / preliminary |
| **D — pH Propagation**             | pH input → engine → interpretation → DTO → HTML                | D1 Acidic 5.2, D2 Neutral 7.0, D3 Alkaline 8.3, D4 Missing pH, D5 Highly alkaline 9.2 + carbonates             |
| **E — Nutrients / Micronutrients** | Macro/micro mapping, available vs exchangeable K, heavy metals | E1 N/P/Cl macros, E3 Full micronutrient panel, E5 Available K (mg/kg), E7 Heavy metals                         |
| **F — Evidence / Missing Data**    | Level completeness, missing-module reporting                   | F4 MODERATE missing cations, F5 ADVANCED missing micros                                                        |

**Total matrix cases:** 21 fixtures across 6 categories. Category G
(report consistency) is asserted in `scientificMatrixReportConsistency.test.ts`
against the same DTO↔HTML artefacts.

---

## Confirmed Scientific Contracts

The audit confirmed the following Phase 10A.7 contracts hold across the matrix:

- **Texture** — `usdaClass` resolves correctly at extremes: 92/5/3 → `Sand`,
  35/35/30 → `Clay Loam`, 10/20/70 → `Clay`.
- **Physics** — A1 sandy soil gives Ksat > 100 mm/h, PAW < 5 % v/v, infiltration
  `Very Rapid`; A4 clay loam gives Ksat < 10 mm/h, infiltration `Slow`.
- **Salinity (FAO-29 union `None|Slight|Moderate|Strong|Severe`)** — EC 8.5 dS/m →
  severity `Strong` / risk `Severe`; EC 12 dS/m → severity `Strong`. Severity and risk
  are distinct labels and both surface in the executive summary and salinity section.
- **Sodicity** — ESP = Na/CEC×100 computed exactly: Na 6 / CEC 15 → ESP 40 % → `Severe`;
  Na 7 / CEC 15 → ESP ≈ 46.7 % → `Severe`. Salinity and sodicity classify independently
  (B2 saline-only, B3 sodic-only, B4 both).
- **CEC provenance** — missing CEC with a full cation panel → `DERIVED_CATION_SUM`
  (10+4+1+0.5 = 15.5); a lab CEC is reported as `LAB` even when cations exceed it.
- **Cation surplus** — Σ cations (18) > CEC (12) does not crash; the agronomic strip
  reports `Base saturation: High` and `Cation balance: Imbalanced`.
- **Evidence completeness** — declared level drives coverage. MODERATE missing the cation
  panel → `Partial`, `missingModules` contains `cations`; ADVANCED missing micros →
  `Partial`, `missingModules` contains `micronutrients` and `macroNutrients`. The HTML
  evidence table renders matching module labels and `Missing` status.
- **DTO ↔ HTML consistency** — severities asserted on the DTO appear verbatim in the
  normalised rendered report (`Salinity severity: Strong.`, `Severity: Severe`).

---

## Production Scientific Changes

### BUG-10B-01 — Ksat NaN for heavy clay + high user bulk density

| Field                       | Value                                                          |
| --------------------------- | -------------------------------------------------------------- |
| **Status**                  | **FOUND AND FIXED**                                            |
| **Production file changed** | `packages/soil-physics/src/calculateSoilPhysics.ts`            |
| **Case**                    | A5 (sand 10 / clay 60, OM 1.0 %, user bulk density 1.60 g/cm³) |

**Cause.** An extreme user bulk density on heavy clay drives the conductivity-domain
term `thetaSDF - theta33DF` (Saxton-Rawls Eq 10, θ(S-33)DF) negative. Equation 16
then evaluates `Math.pow(base, 3 - lambda)` — a negative base raised to a fractional
exponent — which returns `NaN`. `Math.max(ksMin, NaN)` does not rescue the value, so
`saturatedConductivity` propagated as `NaN` and `infiltrationClass` / `drainageClass`
collapsed.

**Fix.** The conductivity-domain term is clamped before the power-law calculation.
`calculateMoistureDensityEffects` already produces a domain-safe
`thetaS33DF = Math.max(CLAMPS.thetaS33DFMin, thetaSDF - theta33DF)` (Eq 10). Equation 16
in `calculateMoistureConductivity` now consumes that clamped `thetaS33DF` instead of
recomputing the raw `thetaSDF - theta33DF`, so the base of `Math.pow` can never be
negative.

**Scientific contract.** Ksat must be finite — never `NaN`, never `Infinity`.

**Expected behaviour.** The extreme heavy-clay / high bulk-density case returns a very
low **finite** Ksat and a **non-null** infiltration/drainage classification (A5 yields
`drainageClass === "Very Poor"`).

**Warning / code.** `PHYSICS_KSAT_DOMAIN_CLAMPED` is **not implemented**. The fix reuses
the pre-existing `thetaS33DF` clamp (Eq 10) rather than emitting a new warning, so no new
warning code is added and the physics output structure is unchanged.

**Package regression test.** `packages/soil-physics/src/__tests__/bug-10b-01.test.ts` —
reproduces the A5 inputs and asserts `Number.isFinite(ksat)` and `drainageClass` is defined.

**Backend matrix guard.** A5 in `scientificMatrixAudit.test.ts` — asserts the same
heavy-clay / high bulk-density case yields finite Ksat and non-null classification through
the full report pipeline.

---

### SUSPECT-10B-02 — pH propagation when the chemistry engine runs

| Field                       | Value                        |
| --------------------------- | ---------------------------- |
| **Status**                  | **INVESTIGATED / PROVEN OK** |
| **Production fix required** | No                           |

**Evidence.** Category D (D1 acidic 5.2, D2 neutral 7.0, D3 alkaline 8.3, D4 missing pH)
proves pH flows through the chemistry LAB path into interpretation, the DTO, the agronomic
`pH` category, and the rendered HTML. A supplied pH propagates end-to-end
(input row → chemistry engine → interpretation `phCategory` → `dto.chemistry.pH` +
agronomic `pH` row → HTML chemistry table cell); a missing pH (D4) correctly yields no
agronomic pH category and a missing chemistry cell. No change to
`calculation.service.ts` interpretation-input assembly is required.

---

### GAP-10B-03 — CEC source modes

| Field      | Value                 |
| ---------- | --------------------- |
| **Status** | **RESOLVED CONTRACT** |

| `cecSource`          | Meaning                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LAB`                | Submitted lab CEC.                                                                                                                                   |
| `DERIVED_CATION_SUM` | No lab CEC, but an exchangeable cation panel exists; CEC is summed from Ca+Mg+K+Na.                                                                  |
| `MISSING`            | No lab CEC and no cation basis in the backend report pipeline (e.g. pH/EC-only input). pH/EC are still echoed to the DTO.                            |
| `ESTIMATED`          | Not currently exercised by `runGoldenPipeline` / the backend report path (the pipeline runs LAB mode). Reserved for a texture-derived estimate path. |

---

## Category D / E / G — Final Coverage

- **Category D (pH propagation)** — 5 cases (D1–D5), all green. pH input → chemistry LAB
  engine → interpretation `phCategory` → DTO `chemistry.pH` + agronomic `pH` → HTML chemistry
  table cell + agronomic row. Missing pH (D4) yields no pH category and a missing chemistry
  cell. D5 additionally exercises carbonate/bicarbonate inputs through the coverage engine.
- **Category E (nutrients / micronutrients)** — 4 cases (E1, E3, E5, E7), all green. Macro
  (`n`/`p`), micronutrient panel (`zn`/`cu`/`fe`/`mn`/`b`), plant-available K (`kMgKg` →
  `macroNutrients.k`, mg/kg) vs exchangeable K (`k`, cmol(+)/kg), and heavy metals (appendix).
- **Category G (report consistency)** — `scientificMatrixReportConsistency.test.ts` asserts
  DTO-declared severities appear verbatim in the normalised rendered HTML, so the DTO and the
  report can never silently diverge.

**Coverage limitations (by design in the current report path):**

- **Carbonate / bicarbonate** are preserved and covered (coverage engine marks the
  `carbonates` module Met for D5) but are not necessarily interpreted in the main chemistry
  DTO where the current report path does not expose them.
- **Heavy metals** are preserved in the appendix / frozen inputs (E7) but are not interpreted
  in the main chemistry DTO — no Phase 10B heavy-metal interpretation rules.
- **Chloride** (`cl`) is tracked by the coverage engine but is not exposed as
  `macroNutrients.cl`, because `ChemistrySection` has no such field.

---

## Verification Matrix

Run from the repository root unless noted.

| Workspace                    | Test                          |
| ---------------------------- | ----------------------------- |
| `@flaha/api` (backend)       | 261 passed, 1 skipped (e2e)   |
| `@flaha/soil-physics`        | 71 passed                     |
| `@flaha/soil-chemistry`      | 45 passed                     |
| `@flaha/soil-interpretation` | 37 passed                     |
| `@flaha/shared-types`        | types-only (no runtime tests) |

**Totals:** 414 tests passed, 1 skipped. The Phase 10A.8 golden DTO (16) and golden HTML
(16) suites remain green alongside the Phase 10B matrix assertions (21 audit + Category G).
The `scientificMatrixAudit.test.ts` suite is 21/21 green.

```powershell
# Phase 10B + 10A.8 locked suites
cd backend
npx vitest run src/services/__tests__/goldenReportIntegrity.test.ts `
              src/services/__tests__/professionalReportGoldenHtml.test.ts `
              src/services/__tests__/scientificMatrixAudit.test.ts `
              src/services/__tests__/scientificMatrixReportConsistency.test.ts

# Full backend suite (250 pass / 1 skip)
npx vitest run

# Full workspace matrix (typecheck + build + test) — see table above
```

---

## Known Limitations / Deferred Items

- **BUG-10B-01** (NaN Ksat) is **FOUND AND FIXED** in `calculateSoilPhysics.ts` (see
  Production Scientific Changes). No golden re-baseline was required — the A5 case previously
  emitted `null`/`NaN`, so no valid golden baseline encoded the defective value.
- **ESTIMATED CEC** path is not exercised end-to-end via `runGoldenPipeline` (the pipeline is
  hard-wired to LAB mode); the C3 fixture documents the contract and the LAB-mode pH/EC-only
  input correctly yields `MISSING`.
- **No e2e golden lock** — the pre-existing `soilTest.e2e.test.ts` remains skipped (requires
  a live database) and is out of scope, consistent with Phase 10A.8.

---

_Phase 10B authored 2026-06-17. Branch: `phase-10b-full-scientific-matrix-audit`.
Baseline: `d949d23` (tag `v0.10.8-phase-10a8`). No commit, push, merge, or tag performed._
