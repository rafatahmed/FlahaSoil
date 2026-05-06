<!-- @format -->

# FlahaSOIL v2 — API Contracts (Phase 4)

> **Status:** Draft. Contracts live in `packages/shared-types/src/`. No
> controllers, routes, or runtime validation have been implemented.
> The legacy API under `api-implementation/` remains the runtime source
> of truth and is **untouched**.

---

## 1. Purpose of this document

Phase 4 fixes the **wire format** between the v2 frontend, the v2 API,
and any downstream consumer (FlahaCalc, reporting). The goal is to lock
the request / response shapes before any controller is written so that
frontend (Phase 5) and backend (Phase 6) can be implemented in parallel
against the same TypeScript types.

The contracts are pure types — no runtime code, no validation, no
network logic. They live in three files:

| File                                         | Contents                                                |
| -------------------------------------------- | ------------------------------------------------------- |
| `packages/shared-types/src/soil-domain.ts`   | DTOs and enums mirroring `prisma/v2-schema.prisma`      |
| `packages/shared-types/src/api-contracts.ts` | Request / response interfaces for every `/api/v2` route |
| `packages/shared-types/src/errors.ts`        | Standard error envelope + `ApiErrorCode` union          |

All v2 routes live under the `/api/v2` prefix. The legacy `/api/v1`
surface is not modified, not deprecated, and not referenced from these
contracts.

---

## 2. Route table

| #   | Method | Path                                              | Purpose                                                  | Request                    | Response                        |
| --- | ------ | ------------------------------------------------- | -------------------------------------------------------- | -------------------------- | ------------------------------- |
| 1   | POST   | `/api/v2/soil-samples`                            | Register a physical sample                               | `CreateSoilSampleRequest`  | `CreateSoilSampleResponse`      |
| 2   | GET    | `/api/v2/soil-samples/:sampleId`                  | Fetch sample + summary of its tests                      | —                          | `GetSoilSampleResponse`         |
| 3   | POST   | `/api/v2/soil-tests`                              | Create a test event for a sample, optionally with inputs | `CreateSoilTestRequest`    | `CreateSoilTestResponse`        |
| 4   | GET    | `/api/v2/soil-tests/:soilTestId`                  | Fetch a test with all inputs and results                 | —                          | `GetSoilTestResponse`           |
| 5   | POST   | `/api/v2/soil-tests/:soilTestId/calculate`        | Run physics / chemistry / interpretation engines         | `CalculateSoilTestRequest` | `CalculateSoilTestResponse`     |
| 6   | GET    | `/api/v2/soil-tests/:soilTestId/interpretation`   | Fetch the latest interpretation only                     | —                          | `GetSoilInterpretationResponse` |
| 7   | POST   | `/api/v2/soil-tests/:soilTestId/reports`          | Generate a report (PDF / CSV)                            | `CreateSoilReportRequest`  | `CreateSoilReportResponse`      |
| 8   | GET    | `/api/v2/soil-tests/:soilTestId/flahacalc-export` | Stable contract consumed by FlahaCalc                    | —                          | `FlahaCalcExportResponse`       |

Routes 1–4 are CRUD-shaped. Route 5 is the only route that runs
engines. Route 6 is a read-optimised projection of route 4. Routes 7–8
are downstream-consumer surfaces.

---

## 3. Request / response summaries

### 3.1 Identity

`SoilSampleDTO` describes the **physical sample** (location, depth,
date). One sample can have many `SoilTestDTO`s — one per test event
(lab visit, re-analysis, etc.). All other DTOs hang off a `SoilTestDTO`
via `soilTestId`.

### 3.2 Inputs

`SoilTextureInputDTO` and `SoilChemistryInputDTO` carry the values the
user / lab supplied. Each carries a `source: SoilValueSource`
(`LAB | ESTIMATED | DEFAULT | CALCULATED`) so the API can later
distinguish between a measured value and a guess. `SoilLabValueDTO` is
an audit row for the raw lab number with its raw unit, preserved
losslessly via `DecimalString`.

### 3.3 Engine results

`SoilPhysicsResultDTO`, `SoilChemistryResultDTO`, and
`SoilInterpretationDTO` are the persisted outputs of the three
scientific engines. Each has its own row keyed by `soilTestId` so that
re-running an engine overwrites only its own slice.

### 3.4 Calculation request shape

`CalculateSoilTestRequest` is intentionally explicit: the caller picks
which engines to run (`runPhysics`, `runChemistry`, `runInterpretation`)
and supplies `calculationMode: "LAB" | "ESTIMATED"` for chemistry. The
response omits any engine result whose flag was `false`. This avoids
the legacy "calculate everything every time" pattern and keeps the test
levels (PRELIMINARY / MODERATE / ADVANCED) honest at the API boundary.

### 3.5 Create payloads

`CreateSoilTextureInputPayload`, `CreateSoilChemistryInputPayload`, and
`CreateSoilLabValuePayload` are derived from their DTOs via `Omit<…,
"id" | "createdAt" | "updatedAt" | "soilTestId">`. The server fills
`soilTestId` from the URL parameter and generates the rest.

---

## 4. Validation rules by test level

Validation is layered: route-level shape checks (Phase 6), engine-level
domain checks (already enforced inside `@flaha/soil-physics` and
`@flaha/soil-chemistry`), and these cross-cutting rules.

### 4.1 Universal rules (all test levels)

- `sampleId` and `soilTestId` path parameters must reference existing
  rows; otherwise `NOT_FOUND`.
- `userId` on `CreateSoilSampleRequest` must reference an authenticated
  user; mismatched user → `FORBIDDEN`.
- All numeric fields must be finite (`Number.isFinite`); any `NaN` or
  `±Infinity` → `VALIDATION_ERROR` with `rule: "finite"`.
- All percent fields must lie in `[0, 100]` (inclusive); out-of-range →
  `VALIDATION_ERROR` with `rule: "range"`.
- All cmol(+)/kg cation fields (`ca`, `mg`, `k`, `na`) must be `>= 0`.

### 4.2 Texture rule (when `textureInput` is supplied)

- `sandPercent + siltPercent + clayPercent` must equal `100 ± 0.5`
  (the engine's documented tolerance). Out of tolerance →
  `VALIDATION_ERROR` with `rule: "texture-sums-to-100"` and
  `details.expected = 100`, `details.received = <actual sum>`.

### 4.3 By test level

`SoilTestLevel` drives which inputs are required when route 5
(`/calculate`) is invoked.

| Level         | Required for `runPhysics`                               | Required for `runChemistry`                                    | Required for `runInterpretation`              |
| ------------- | ------------------------------------------------------- | -------------------------------------------------------------- | --------------------------------------------- |
| `PRELIMINARY` | `textureInput` (sand, silt, clay)                       | not supported — returns `UNSUPPORTED_TEST_LEVEL`               | physics result must already exist             |
| `MODERATE`    | `textureInput` + `organicMatterPercent`                 | `chemistryInput` with at least one of (`pH`, `ec`, `cec`)      | physics **or** chemistry result must exist    |
| `ADVANCED`    | `textureInput` + `organicMatterPercent` + `bulkDensity` | `chemistryInput` with `pH`, `ec`, `cec`, `ca`, `mg`, `k`, `na` | both physics and chemistry results must exist |

Missing required inputs for the requested engine →
`MISSING_REQUIRED_INPUT` with `details.path` pointing at the absent
field. Requesting an engine that the test level does not support →
`UNSUPPORTED_TEST_LEVEL` with `details.testLevel` and
`details.engine`.

### 4.4 Calculation-mode rule

- `calculationMode` is required when `runChemistry === true`.
- `calculationMode === "LAB"` requires that the supplied
  `chemistryInput` provides `cec` (or all four of `ca`, `mg`, `k`,
  `na` so CEC can be derived).
- `calculationMode === "ESTIMATED"` requires `textureInput` with
  `clayPercent` and `organicMatterPercent` (per the chemistry engine's
  ESTIMATED-mode contract).

---

## 5. Error contract

All non-2xx responses follow `ApiErrorResponse`:

```ts
interface ApiErrorResponse {
	error: {
		code: ApiErrorCode;
		message: string;
		details?: unknown;
	};
}
```

`ApiErrorCode` is a closed union (see `errors.ts`):

| Code                     | HTTP | When emitted                                        | `details` shape             |
| ------------------------ | ---- | --------------------------------------------------- | --------------------------- |
| `VALIDATION_ERROR`       | 400  | Shape, range, finiteness, or sum-to-100 failure     | `ValidationFailureDetail[]` |
| `MISSING_REQUIRED_INPUT` | 400  | Engine invoked without its required inputs          | `{ engine, path }`          |
| `UNSUPPORTED_TEST_LEVEL` | 400  | Engine not allowed at this `testLevel`              | `{ testLevel, engine }`     |
| `UNAUTHORIZED`           | 401  | Missing / invalid auth token                        | `undefined`                 |
| `FORBIDDEN`              | 403  | Caller is not the owner of the resource             | `undefined`                 |
| `NOT_FOUND`              | 404  | Path parameter references a row that does not exist | `{ resource, id }`          |
| `CALCULATION_ERROR`      | 422  | Engine threw (e.g. zero CEC, negative cation)       | `{ engine, message }`       |
| `INTERNAL_ERROR`         | 500  | Unhandled server failure                            | `undefined`                 |

The `isApiErrorResponse` type-guard in `errors.ts` lets a v2 client
discriminate a generic JSON response between success and error shapes
without re-implementing the envelope check.

---

## 6. FlahaCalc export contract

`FlahaCalcExportResponse` (route 8) is the **only** v2 surface that
external systems are expected to consume. It is intentionally narrow
and additive-only:

- **Required fields** are the minimum physics surface FlahaCalc needs
  to run an irrigation / leaching plan: `textureClass`, `fieldCapacity`,
  `wiltingPoint`, `plantAvailableWater`, `saturation`,
  `saturatedConductivity`.
- **Optional fields** (`cec`, `salinityRisk`, `sodiumRisk`) enrich the
  plan with chemistry-derived risk gates when an interpretation is
  available.
- **`warnings`** is always present (possibly empty) and carries the
  interpretation engine's `warningsJson` verbatim.

Stability guarantee: required fields will never be removed or
renamed; optional fields may be added but never removed; new fields
will always be optional. Breaking changes require a new route under
`/api/v3/...`.

---

## 7. What Phase 4 intentionally does NOT implement

To stay inside the "contracts only" scope, Phase 4 deliberately
excludes:

1. **Controllers and routes.** No Express / Fastify handlers, no
   route registration, no middleware. Routes 1–8 exist only as types.
2. **Runtime validation.** No Zod / Joi / class-validator schemas.
   The validation rules in §4 are documentation only; runtime
   enforcement is Phase 6.
3. **Authentication and authorisation.** `userId` appears in the
   sample-create request as a placeholder; the actual auth flow
   (token issuance, session storage, RBAC) is Phase 6.
4. **Database access.** No Prisma client usage, no query helpers.
   The DTOs mirror `prisma/v2-schema.prisma` but Phase 4 does not
   import from `@prisma/client` and does not run migrations.
5. **Engine orchestration.** Route 5's response shape is defined,
   but the code that calls `@flaha/soil-physics`,
   `@flaha/soil-chemistry`, and `@flaha/soil-interpretation` and
   stitches their outputs into a single response is Phase 6.
6. **Frontend wiring.** No React hooks, no `fetch` wrapper, no API
   client. The `ApiV2RouteResponseMap` type is provided so a Phase-5
   client can be typed correctly, but no client exists yet.
7. **Legacy compatibility shims.** The v2 contracts do not reference
   any v1 type or route. Migration of v1 callers is out of scope.
8. **Pagination, filtering, and bulk endpoints.** All list-shaped
   responses (e.g. `tests` on `GetSoilSampleResponse`) are unbounded
   in Phase 4. Pagination contracts will be added when the first
   list view in Phase 5 needs them.
