<!-- @format -->

# FlahaSOIL v2 — End-to-End Wiring (Phase 7)

> Companion to `docs/v2-architecture.md`, `docs/v2-api-contracts.md`, and
> `docs/v2-migration-plan.md`. Describes how the React frontend, the Express
> backend, the v2 Prisma client, PostgreSQL, and the scientific engines are
> connected at runtime, and how to switch the frontend between mock and real
> mode without changing code.

---

## Runtime topology

```
┌──────────────────────┐         HTTP / JSON          ┌──────────────────────┐
│   @flaha/web (Vite)  │  ─────────────────────────▶  │   @flaha/api (Node)  │
│  React + MUI + RHF   │   /api/v2/*  (when real)     │  Express + Zod       │
│                      │                              │                      │
│  apiClientProvider   │                              │  controllers/        │
│   ├─ mockApiV2Client │                              │   ├─ soilSamples     │
│   └─ realApiV2Client │                              │   ├─ soilTests       │
└──────────────────────┘                              │   ├─ calculation     │
                                                      │   └─ flahaCalcExport │
                                                      │           │          │
                                                      │           ▼          │
                                                      │  Prisma v2 client    │
                                                      │  (generated)         │
                                                      └──────────┬───────────┘
                                                                 │
                                                       ┌─────────▼──────────┐
                                                       │  PostgreSQL (v2)   │
                                                       │  DATABASE_URL_V2   │
                                                       └────────────────────┘
                                                                 ▲
                                                                 │ pure TS
                                                       ┌─────────┴──────────┐
                                                       │  packages/soil-*   │
                                                       │  physics, chem,    │
                                                       │  interpretation    │
                                                       └────────────────────┘
```

The legacy stack (`api-implementation/` + `public/`) is untouched and keeps
running on its own SQLite store. v2 reads/writes only PostgreSQL via
`DATABASE_URL_V2`.

---

## Environment matrix

| Var                  | Where             | Required when      | Notes                                                          |
| -------------------- | ----------------- | ------------------ | -------------------------------------------------------------- |
| `DATABASE_URL_V2`    | `backend/.env`    | Backend hits DB    | Postgres URL. Leave unset to run schema-only smoke tests.      |
| `PORT`               | `backend/.env`    | Optional           | Defaults to `4000`.                                            |
| `NODE_ENV`           | `backend/.env`    | Optional           | `development` (default) / `test` / `production`.               |
| `VITE_API_BASE_URL`  | `frontend/.env`   | Real-mode frontend | Base URL for `/api/v2`. Defaults to `http://localhost:4000`.   |
| `VITE_USE_MOCK_API`  | `frontend/.env`   | Always read        | `"true"` (default) → mock client; `"false"` → real client.     |

Both `.env.example` files in `backend/` and `frontend/` carry the canonical
list. Copy them to `.env` and adjust locally; never commit secrets.

---

## Frontend client selection

`frontend/src/services/apiClientProvider.ts` is the **only** decision point
between mock and real. Pages must call `getApiClient()` (or
`getApiClientMode()` for UI labels) instead of importing
`mockApiV2Client` / `realApiV2Client` directly.

- Default: `mock` — the in-memory `mockApiV2Client` from
  `@flaha/shared-types` consumers, deterministic, no network.
- Real: set `VITE_USE_MOCK_API="false"` in `frontend/.env` (and ensure
  `VITE_API_BASE_URL` points at a running backend).
- Tests/stories may force a mode with `setApiClientModeForTesting()`.

The wizard, detail, and FlahaCalc-export pages all surface the active mode
in the UI so it is obvious which client served the data.

---

## Backend Prisma loading

`backend/src/prisma/client.ts` lazily resolves
`prisma/generated/v2-client/index.js` (relative to the source tree, so it
works from both `src/` during dev and `dist/` after build). The client is a
singleton; the resolver throws a clear error if the generated output is
missing — run `npm run prisma:generate:v2 --workspace @flaha/api` to fix.

No code path attempts to open a database connection at import time.

---

## Integration tests

`backend/src/__tests__/integration/`:

- `testDatabase.ts` — single gate: returns the URL when `DATABASE_URL_V2`
  is set **and** contains the substring `test`. Otherwise tests skip.
  Cleanup helpers refuse to truncate any database whose URL fails the
  same check, so the suite cannot wipe a non-test database.
- `soilTest.e2e.test.ts` — exercises the full flow: create sample → create
  test → calculate → fetch → flahacalc-export. Skips cleanly with no DB.

Run them locally against a disposable Postgres:

```powershell
$env:DATABASE_URL_V2 = "postgresql://flaha:flaha@localhost:5432/flahasoil_v2_test?schema=public"
npm run prisma:migrate:dev:v2 --workspace @flaha/api
npm run test --workspace @flaha/api
```

Without `DATABASE_URL_V2`, the suite reports `1 skipped` and the unit tests
still pass.

---

## Local "real-mode" runbook

1. **Postgres** — start a local instance (Docker or native) and create a DB.
2. **Backend env** — copy `backend/.env.example` to `backend/.env`; set
   `DATABASE_URL_V2`.
3. **Generate & migrate** —
   `npm run prisma:generate:v2 --workspace @flaha/api` then
   `npm run prisma:migrate:dev:v2 --workspace @flaha/api`.
4. **Backend** — `npm run dev --workspace @flaha/api` (listens on `:4000`).
5. **Frontend env** — copy `frontend/.env.example` to `frontend/.env`; set
   `VITE_USE_MOCK_API="false"` and `VITE_API_BASE_URL="http://localhost:4000"`.
6. **Frontend** — `npm run dev --workspace @flaha/web`.

The wizard, detail, and FlahaCalc-export pages now drive the real backend.
Reverting `VITE_USE_MOCK_API` to `"true"` (or removing it) restores mock
mode without restarting the backend.

---

## Hard rules (still apply)

1. No edits in `api-implementation/` or `public/`.
2. No edits to scientific engine logic in `packages/soil-*`.
3. v2 reads/writes **only** PostgreSQL via `DATABASE_URL_V2`. The legacy
   SQLite database is off-limits.
4. All v2 routes live under `/api/v2`.
5. Mock-mode in the frontend must remain functional and is the default.
