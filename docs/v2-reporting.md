# FlahaSOIL v2 — Reporting, Audit Trace, and Structured Warnings

Phase 8 of the v2 stack adds three orthogonal capabilities on top of the
existing engines and orchestration:

1. **Structured warnings** — every calculate / report response now
   carries `warningDetails: SystemWarning[]` alongside the legacy
   `warnings: string[]`.
2. **Audit trace** — the report endpoint exposes "what the engines saw"
   (normalized inputs) and "what they did" (intermediate physics steps).
3. **Read-only report assembly** — `GET /api/v2/soil-tests/:id/report`
   stitches sample, test, physics, chemistry, interpretation, warnings,
   and audit trace into a single envelope without re-running math.

Nothing in this phase changes calculation formulas or modifies the
scientific packages (`packages/soil-*`).

## 1. Endpoint contract

### `GET /api/v2/soil-tests/:soilTestId/report`

Returns `SoilReportEnvelope` (see
`packages/shared-types/src/reports.ts`).

Query parameters:

| Name     | Values            | Default | Behaviour                                   |
| -------- | ----------------- | ------- | ------------------------------------------- |
| `format` | `full`, `summary` | `full`  | `summary` returns the compact projection.   |

Errors follow the standard `ApiErrorResponse` envelope:

| Status | `error.code`        | When                                      |
| -----: | ------------------- | ----------------------------------------- |
|    400 | `VALIDATION_ERROR`  | Bad `format` value.                       |
|    404 | `NOT_FOUND`         | Soil test (or its sample) does not exist. |
|    413 | `PAYLOAD_TOO_LARGE` | Request body > 512 KB.                    |
|    429 | `RATE_LIMITED`      | More than 120 req/min from one IP.        |
|    500 | `INTERNAL_ERROR`    | Unhandled error (message redacted in prod). |

## 2. Warning codes

`SystemWarning.code` is one of the values in
`SYSTEM_WARNING_CODES` (`packages/shared-types/src/warnings.ts`):

| Code                                      | Severity  | Meaning                                                                   |
| ----------------------------------------- | --------- | ------------------------------------------------------------------------- |
| `CHEMISTRY_SKIPPED_PRELIMINARY`           | `warning` | Test only carried pH/EC/TDS; chemistry engine was not run.                |
| `CHEMISTRY_SKIPPED_NO_CHEMISTRY_INPUT`    | `warning` | LAB mode lacked CEC and cations entirely.                                 |
| `CHEMISTRY_SKIPPED_INSUFFICIENT_TEXTURE`  | `warning` | ESTIMATED mode lacked clay% / OM% needed to derive chemistry inputs.      |
| `TDS_INCONSISTENT_WITH_EC`                | `warning` | Both EC and TDS were supplied but disagreed by > 20 %; EC was used.       |
| `EC_DERIVED_FROM_TDS`                     | `info`    | Only TDS was supplied; EC was derived as `TDS / 640`.                     |
| `INTERPRETATION_WARNING`                  | `warning` | Pass-through of a free-text warning emitted by the interpretation engine. |

Adding a new code requires updating both `warnings.ts` and the table
above. Existing codes MUST NOT be renamed or removed — they are part of
the wire contract.

## 3. Audit trace shape

```ts
SoilReportAuditTrace = {
  physicsTrace: Record<string, unknown> | null,
  chemistryInputsUsed: Record<string, unknown> | null,
  normalizedInputs?: {
    salinity?: {
      ecDsM?: number,
      tdsMgL?: number,
      derivedFromTds: boolean,
      warnings: string[],
    },
  },
  skippedModules: Array<{ module: "chemistry", reason: string }>,
}
```

- `physicsTrace` is the verbatim engine output stored in
  `SoilPhysicsResult.calculationTraceJson` at calculation time.
- `chemistryInputsUsed` echoes the post-normalization fields that would
  reach the chemistry engine (canonical `ecDsM`, plus `pH`, `cec`,
  `ca`, `mg`, `k`, `na`, and the relevant texture fields).
- `normalizedInputs.salinity` is re-derived by replaying the pure
  `normalizeSalinity()` function over the stored inputs.
- `skippedModules` is non-empty whenever the report layer detects that
  a chemistry input row exists but no chemistry result was produced.

## 4. Example report (PRELIMINARY)

```jsonc
{
  "sample": { "id": "smpl_001", /* … */ },
  "test":   { "id": "test_001", "testLevel": "PRELIMINARY", /* … */ },
  "physics": { "textureClass": "Loam", /* … */ },
  "chemistry": null,
  "interpretation": { "phCategory": "Neutral", "salinityRisk": "Low" },
  "warnings": [
    "Chemistry calculation skipped: PRELIMINARY-style input (pH/EC only); CEC and cation data (Ca, Mg, K, Na) are required for the chemistry engine."
  ],
  "warningDetails": [
    {
      "code": "CHEMISTRY_SKIPPED_PRELIMINARY",
      "severity": "warning",
      "message": "Chemistry calculation skipped: …"
    }
  ],
  "auditTrace": {
    "physicsTrace": { "fieldCapacity": 0.28, "wiltingPoint": 0.12 },
    "chemistryInputsUsed": { "pH": 7.2, "ecDsM": 1.5 },
    "normalizedInputs": {
      "salinity": { "ecDsM": 1.5, "derivedFromTds": false, "warnings": [] }
    },
    "skippedModules": [
      { "module": "chemistry", "reason": "Chemistry calculation skipped: …" }
    ]
  },
  "metadata": {
    "generatedAt": "2026-05-05T08:00:00.000Z",
    "version": "v2.0.0",
    "calculationMode": null,
    "testLevel": "PRELIMINARY"
  }
}
```

## 5. Production hardening

Phase 8 also added:

- `backend/src/utils/logger.ts` — structured JSON logger with
  `info` / `warn` / `error` levels (silenced under `NODE_ENV=test`).
- `backend/src/middleware/rateLimit.ts` — in-memory sliding-window
  limiter (120 req / min / IP by default; no-op under tests).
- Hardened `errorHandler.ts` — maps `entity.too.large` to
  `PAYLOAD_TOO_LARGE` (413) and logs every error with request context.
- `express.json({ limit: "512kb" })` in `app.ts`.
- New error codes `PAYLOAD_TOO_LARGE` and `RATE_LIMITED` in
  `@flaha/shared-types/errors`.

## 6. Frontend

- New page `frontend/src/pages/SoilTestReportPage.tsx` mounted at
  `/soil-tests/:soilTestId/report`.
- "View report" button on the soil-test detail page navigates there.
- Reuses the existing physics / chemistry / interpretation cards and
  renders `warningDetails` plus a collapsible audit-trace panel. The
  page never re-runs calculations.
