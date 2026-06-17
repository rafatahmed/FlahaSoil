<!-- @format -->

# FlahaSOIL v2 — Phase 10C-B: Advanced Water-Retention Model Framework

## 1. Purpose

Phase 10C-B introduces a modular, extensible **Water-Retention Model Framework** inside
`@flaha/soil-physics`. The framework registers multiple pedotransfer / parameter-based
models alongside the existing production default (Saxton-Rawls 2006), gives each a formal
status, enforces strict validation, and dispatches computation to the correct adapter.

**The Saxton-Rawls 2006 model is NOT replaced.** It remains the sole `ACTIVE_DEFAULT`
and the sole production-default model. No existing logic was modified.

---

## 2. Baseline

| Item                               | Value                                                 |
| ---------------------------------- | ----------------------------------------------------- |
| Branch                             | `phase-10c-b-advanced-water-retention-models`         |
| Branched from                      | `main` after Phase 10C-C (tag `v0.10.11-phase-10c-c`) |
| Working tree state at branch point | clean                                                 |

---

## 3. Model Registry Architecture

All models live in a **frozen registry** (`WATER_RETENTION_MODELS`) keyed by
`WaterRetentionModelId`. Each entry is a `WaterRetentionModelMetadata` object carrying:

| Field               | Meaning                                            |
| ------------------- | -------------------------------------------------- |
| `id`                | Unique string literal key                          |
| `name`              | Human-readable name                                |
| `status`            | `ACTIVE_DEFAULT` / `PARAMETER_REQUIRED` / `FUTURE` |
| `computable`        | `true` iff this phase can compute a result         |
| `productionDefault` | `true` for SAXTON_RAWLS_2006 only                  |
| `parameters`        | Required-parameter list with types and ranges      |
| `outputs`           | Output list (empty for FUTURE)                     |
| `limitations`       | Known limitations / caveats                        |
| `reference`         | Scientific citation                                |

---

## 4. Registered Model IDs and Statuses

| Model ID                    | Status               | Phase computable?      |
| --------------------------- | -------------------- | ---------------------- |
| `SAXTON_RAWLS_2006`         | `ACTIVE_DEFAULT`     | ✅ Yes (texture)       |
| `VAN_GENUCHTEN`             | `PARAMETER_REQUIRED` | ✅ Yes (fitted params) |
| `BROOKS_COREY`              | `PARAMETER_REQUIRED` | ✅ Yes (fitted params) |
| `CAMPBELL`                  | `PARAMETER_REQUIRED` | ✅ Yes (fitted params) |
| `LAB_MEASURED_CURVE`        | `PARAMETER_REQUIRED` | ✅ Yes (measured data) |
| `ROSETTA_HYPRES_FUTURE`     | `FUTURE`             | ❌ Not yet             |
| `CUSTOM_ORGANIZATION_MODEL` | `FUTURE`             | ❌ Not yet             |

---

## 5. Required Parameters per Parameterized Model

### Van Genuchten

`thetaR`, `thetaS`, `alpha`, `n` (required); `m` optional (defaults to `1 − 1/n`)

Constraints: `0 ≤ thetaR < thetaS ≤ 1`, `alpha > 0`, `n > 1`.

### Brooks-Corey

`thetaR`, `thetaS`, `airEntryPressure`, `lambda`

Constraints: `0 ≤ thetaR < thetaS ≤ 1`, `airEntryPressure > 0`, `lambda > 0`.

### Campbell

`thetaS`, `airEntryPotential`, `b`

Constraints: `thetaS ∈ (0, 1]`, `airEntryPotential > 0` (positive-suction convention, kPa), `b > 0`.

### Lab-Measured Curve

`measuredCurve`: array of `{ matricPotentialKpa: > 0, waterContentFraction: [0,1] }`, ≥ 2 points.

---

## 6. Missing-Parameter Behaviour

> **Policy: parameters are NEVER inferred, estimated, or extrapolated.**

When any required parameter is absent or non-finite the model returns:

```json
{ "status": "MISSING_PARAMETERS", "missingParameters": ["param1", ...] }
```

No numeric output is produced. The caller must supply the missing data explicitly.

---

## 7. Invalid-Input Behaviour

When all required parameters are present but violate physical/mathematical constraints,
the model returns:

```json
{ "status": "INVALID_INPUT", "warnings": ["explanation ..."] }
```

---

## 8. FUTURE Model Behaviour

FUTURE models (`ROSETTA_HYPRES_FUTURE`, `CUSTOM_ORGANIZATION_MODEL`) are always
non-computable regardless of input. They return:

```json
{ "status": "NOT_AVAILABLE" }
```

---

## 9. Scientific Honesty Statement

- The Van Genuchten, Brooks-Corey, and Campbell implementations compute mathematically
  correct curves from caller-supplied fitted parameters. The parameters themselves must
  be derived from laboratory measurements or literature; FlahaSOIL does not derive them
  automatically from texture in this phase.
- The Saxton-Rawls wrapper re-uses the unchanged production pedotransfer function.
  Its outputs are bit-identical to those produced before Phase 10C-B.
- No model fabricates, interpolates, or estimates missing data.

---

## 10. Known Limitations

1. Van Genuchten / Brooks-Corey / Campbell require externally fitted parameters; the
   framework provides no pedotransfer function to estimate them from texture alone.
2. FC and WP are not derived for parameterized models in Phase 10C-B (interpolation
   conventions are not yet specified/tested).
3. ROSETTA and CUSTOM models are structural placeholders only.
4. The framework is internal to `@flaha/soil-physics` and is not exposed via the REST
   API or any DTO in Phase 10C-B.

---

## 11. Files Created / Modified

### New files

| File                                                                   | Role                   |
| ---------------------------------------------------------------------- | ---------------------- |
| `packages/soil-physics/src/waterRetention/waterRetentionTypes.ts`      | Type definitions       |
| `packages/soil-physics/src/waterRetention/waterRetentionValidation.ts` | Parameter validators   |
| `packages/soil-physics/src/waterRetention/waterRetentionModels.ts`     | Frozen registry        |
| `packages/soil-physics/src/waterRetention/waterRetentionResolver.ts`   | Resolver + dispatcher  |
| `packages/soil-physics/src/waterRetention/models/saxtonRawls2006.ts`   | SR2006 adapter         |
| `packages/soil-physics/src/waterRetention/models/vanGenuchten.ts`      | VG model               |
| `packages/soil-physics/src/waterRetention/models/brooksCorey.ts`       | BC model               |
| `packages/soil-physics/src/waterRetention/models/campbell.ts`          | Campbell model         |
| `packages/soil-physics/src/waterRetention/models/labMeasuredCurve.ts`  | Lab curve passthrough  |
| `packages/soil-physics/src/waterRetention/index.ts`                    | Sub-package re-exports |
| `packages/soil-physics/src/__tests__/waterRetentionModels.test.ts`     | Registry tests (11)    |
| `packages/soil-physics/src/__tests__/waterRetentionResolver.test.ts`   | Resolver tests (12)    |
| `packages/soil-physics/src/__tests__/waterRetentionValidation.test.ts` | Validation tests (14)  |

### Modified files

| File                                 | Change                                   |
| ------------------------------------ | ---------------------------------------- |
| `packages/soil-physics/src/index.ts` | Added `export * from "./waterRetention"` |

---

## 12. Test Coverage

| Suite                    | Tests   | Coverage                                                                           |
| ------------------------ | ------- | ---------------------------------------------------------------------------------- |
| Registry integrity       | 11      | IDs, default, metadata, FUTURE/PARAMETER_REQUIRED separation                       |
| Resolver                 | 12      | Default fallback, unknown→error, availability, SR2006 parity, FUTURE→NOT_AVAILABLE |
| Validation / computation | 14      | Missing-params, invalid-input, COMPUTED for all 4 parameterized models             |
| **Phase 10C-B subtotal** | **37**  |                                                                                    |
| Existing physics suite   | 80      | Unchanged                                                                          |
| **Package total**        | **117** | All passing                                                                        |

---

## 13. Verification Matrix (full)

| Suite / Workspace               | Type-check | Tests                                 | Build |
| ------------------------------- | ---------- | ------------------------------------- | ----- |
| `@flaha/soil-physics`           | ✅         | ✅ 117 passed                         | ✅    |
| `@flaha/soil-chemistry`         | ✅         | ✅ 45 passed                          | ✅    |
| `@flaha/soil-interpretation`    | ✅         | ✅ 60 passed                          | ✅    |
| `@flaha/web`                    | ✅         | ✅ 40 passed                          | ✅    |
| `@flaha/api`                    | ✅         | (backend suite)                       | —     |
| `@flaha/shared-types`           | ✅         | —                                     | ✅    |
| Backend regression (all suites) | —          | ✅ 301 passed, 1 skipped              | —     |
| **Total**                       |            | **563 passed, 1 skipped, 0 failures** |       |

---

## 14. Verification Commands

```bash
# Type-check all workspaces
npm run typecheck --workspace @flaha/soil-physics
npm run typecheck --workspace @flaha/api
npm run typecheck --workspace @flaha/soil-chemistry
npm run typecheck --workspace @flaha/soil-interpretation
npm run typecheck --workspace @flaha/web

# Physics package tests
cd packages/soil-physics && npx vitest run

# Backend regression (must stay green — Phase 10C-C dataset)
cd backend && npx vitest run --reporter=basic

# Other workspace test suites
npm test --workspace @flaha/web
npm test --workspace @flaha/soil-chemistry
npm test --workspace @flaha/soil-interpretation

# Builds
npm run build --workspace @flaha/soil-physics
npm run build --workspace @flaha/shared-types
npm run build --workspace @flaha/soil-chemistry
npm run build --workspace @flaha/soil-interpretation
npm run build --workspace @flaha/web
```
