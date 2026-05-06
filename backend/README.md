<!-- @format -->

# `@flaha/api`

FlahaSOIL v2 backend — Express + TypeScript + Prisma v2.

Composes the pure-function scientific engines (`@flaha/soil-physics`,
`@flaha/soil-chemistry`, `@flaha/soil-interpretation`) and serves the
typed `/api/v2` contracts declared in `@flaha/shared-types`.

## Status

Phase 6 complete — all 8 routes from `docs/v2-api-contracts.md §2` are
implemented under `/api/v2`. Unit tests (validation, FlahaCalc
projection, HTTP smoke) are green. DB-backed integration tests against
a real Prisma v2 client are out of scope for Phase 6.

## Hard rules

- Does NOT import from `api-implementation/` or `public/`.
- Does NOT consult the legacy `DATABASE_URL` env var; uses
  `DATABASE_URL_V2` exclusively.
- Does NOT contain scientific computation; engines stay pure and live
  in `packages/soil-*`.

## Routes

Mounted under `/api/v2` by `src/routes/v2.routes.ts`:

| #   | Method | Path                                       |
| --- | ------ | ------------------------------------------ |
| 1   | POST   | `/soil-samples`                            |
| 2   | GET    | `/soil-samples/:sampleId`                  |
| 3   | POST   | `/soil-tests`                              |
| 4   | GET    | `/soil-tests/:soilTestId`                  |
| 5   | POST   | `/soil-tests/:soilTestId/calculate`        |
| 6   | GET    | `/soil-tests/:soilTestId/interpretation`   |
| 7   | POST   | `/soil-tests/:soilTestId/reports`          |
| 8   | GET    | `/soil-tests/:soilTestId/flahacalc-export` |

Out-of-band:

- `GET /health` — canonical liveness probe.
- `GET /healthz` — alias kept for k8s-style probes.

All non-2xx responses use the `ApiErrorResponse` envelope from
`@flaha/shared-types`.

## Source layout

```
src/
├── app.ts                # Express app factory (no listen)
├── server.ts             # Production entry — binds the port
├── index.ts              # Re-exports createApp for tests
├── config/env.ts         # Reads PORT, NODE_ENV, DATABASE_URL_V2
├── controllers/          # HTTP handlers (thin: parse → service)
├── routes/v2.routes.ts   # Mounts the 8 /api/v2 routes
├── services/             # Orchestration + Prisma access
│   ├── calculation.service.ts      # Engine composition root
│   ├── flahaCalcExport.service.ts  # Read-only FlahaCalc projection
│   ├── soilSamples.service.ts
│   └── soilTests.service.ts
├── middleware/           # errorHandler, notFoundHandler
├── prisma/client.ts      # Lazy v2 client wrapper + test injector
├── utils/                # apiError, asyncHandler, serializers
└── validation/schemas.ts # Zod schemas — texture sum, level gates
```

## Scripts

```bash
npm run dev --workspace @flaha/api          # tsx watch src/server.ts
npm run build --workspace @flaha/api        # tsc → backend/dist
npm run start --workspace @flaha/api        # node backend/dist/server.js
npm run typecheck --workspace @flaha/api    # tsc --noEmit
npm run test --workspace @flaha/api         # vitest run
npm run prisma:generate:v2 --workspace @flaha/api
```

## Environment

Copy `backend/.env.example` to `backend/.env` and fill in:

- `PORT` (default 3002)
- `NODE_ENV` (`development` | `test` | `production`)
- `DATABASE_URL_V2` — PostgreSQL URL for the segregated v2 datasource

The legacy `DATABASE_URL` is intentionally NOT read here.

## Test scope

- ✅ Unit tests against pure schemas, service-layer projection, and
  HTTP envelope behaviour pass via supertest with no DB.
- ⛔ DB-backed success paths (routes 1–7 happy paths) are NOT tested
  in this phase — they require `npm run prisma:generate:v2` against a
  reachable PostgreSQL datasource and migration apply, both of which
  are deferred to a later integration phase.
- ⛔ Production migrations are NOT run as part of `npm run test`.
