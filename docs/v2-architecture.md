<!-- @format -->

# FlahaSOIL v2 — Architecture

> Phase 1 deliverable. Defines **why** v2 exists, **what** it will look like and
> **how** the codebase is organised. No runtime code is moved at this stage —
> only the skeleton.

---

## 1. Why FlahaSOIL v2?

The legacy system (audited in `docs/legacy-baseline.md` and
`docs/known-issues.md`) is functional but is shaped by accumulated decisions
that block the next stage of the product:

- **No soil chemistry domain.** The legacy database advertises
  `cationExchangeCapacity` and `baseSaturation` columns on
  `EnhancedSoilAnalysis`, but the codebase contains zero CEC, base-saturation,
  cation-balance, ESP or SAR logic (proven by the regex sweep in the forensic
  audit). The product is a soil-water-physics + irrigation DSS only.
- **Frontend is static HTML + vanilla JS** (`public/*.html`,
  `public/assets/js/*.js`) with a hard-coded `http://localhost:3001/api/v1`
  base URL in `apiClient.js` — no build pipeline, no type safety, no component
  model.
- **Backend mixes concerns.** `SoilCalculationService` is simultaneously a
  scientific engine (Saxton & Rawls equations 1–24), a presentation layer
  (`formatResultsByPlan`) and a plan-gating layer.
- **SQLite** is fine for development but unsuitable for the multi-tenant
  production target.
- **No type sharing** between client and server.
- **Duplicated and noisy artefacts** in the repo (Console Ninja files,
  scratch test scripts, duplicate Prisma schemas — see ISS-001 … ISS-011).

v2 keeps the science (Saxton & Rawls 2006 — frozen in
`docs/legacy-calculation-samples.md` as the regression target) and rebuilds the
surrounding architecture.

---

## 2. Limitations of the legacy system

| Area                | Legacy reality                                                   | Consequence                                              |
| ------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| Frontend            | Static HTML + jQuery-style JS, no build, no types                | Hard to evolve, duplicated DOM logic, no test harness    |
| Backend             | Single `SoilCalculationService` mixes math + presentation + gate | Hard to test the science in isolation                    |
| Soil chemistry      | Absent                                                           | Cannot answer fertility / amendment questions            |
| Database            | SQLite + Prisma                                                  | Not production-ready for multi-tenant / concurrent loads |
| Validation          | Express-validator chains, server-only                            | Client re-implements the same rules ad hoc               |
| Type system         | None on the wire                                                 | Drift between client and server contracts                |
| API path convention | Both `/api/v1/...` and `/api/v1/dss/api/v1/dss/...` co-exist     | Confusing surface (ISS-005)                              |
| Localization        | `requireFeature("multi_language_support")` on every endpoint     | Public UI strings end up gated (ISS-007)                 |

---

## 3. Target architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                    FlahaSOIL v2 — high-level                            │
└────────────────────────────────────────────────────────────────────────┘

   frontend (React + TypeScript)
        │  HTTPS / typed DTOs (@flahasoil/shared-types)
        ▼
   backend (Node.js + Express + TypeScript)
        │  composes pure-function engines
        ├─► @flahasoil/soil-physics         (Saxton & Rawls 2006)
        ├─► @flahasoil/soil-chemistry       (CEC, BS, ESP, SAR, pH, EC)
        ├─► @flahasoil/soil-interpretation  (agronomic guidance)
        └─► @flahasoil/validation           (shared input rules)
        │
        ▼
   PostgreSQL (Prisma ORM)
```

### 3.1 Frontend — `frontend/`

- **React + TypeScript** (build tool selected at the start of Phase 6).
- Consumes `@flahasoil/shared-types` for all API DTOs.
- Replaces every page currently in `public/`.
- No direct DOM manipulation against soil-calculation results — all values
  arrive as typed objects from the API.

### 3.2 Backend — `backend/`

- **Node.js + Express + TypeScript**.
- Thin HTTP layer. **No science** lives here.
- Composition root: takes pure functions from the engine packages, validates
  input via `@flahasoil/validation`, persists via Prisma, returns typed DTOs.
- Plan gating, rate limiting and auth are kept (concepts inherited from the
  legacy `planAccess.js` / `auth.js`) but rebuilt as middleware modules.

### 3.3 Database — PostgreSQL + Prisma

- PostgreSQL as the production target (SQLite kept only for the legacy app
  during the transition).
- Prisma remains the ORM. The schema is **redesigned** in Phase 4 to model
  soil chemistry properly — the legacy nullable `cationExchangeCapacity` /
  `baseSaturation` columns are not carried forward (see
  `docs/migration-notes.md`).

---

## 4. Scientific engines (separation of concerns)

Each engine package is **framework-free** (no Express, no Prisma, no React) and
exposes pure functions only. This makes them trivially unit-testable and
reusable across CLI, batch jobs and the FlahaCalc DSS in Phase 7.

### 4.1 `@flahasoil/soil-physics`

Future home for the Saxton & Rawls (2006) engine currently embedded in
`api-implementation/src/services/soilCalculationService.js`:

- Equations 1–5 — moisture regressions (WP, FC, S-FC, Saturation).
- Equations 6–10 — density / OM effects (`DF`, `ρb`, porosity, particle
  density, void ratio).
- Equations 11–15 — moisture-tension (`A`, `B`, ψ at FC, ψ at WP, etc.).
- Equations 16–18 — moisture-conductivity (`Ksat`, λ, K(θ)).
- Equations 19–22 — gravel correction (Professional+).
- Equations 23–24 — salinity / osmotic potential (Enterprise).
- USDA texture classification + soil-quality indicators.

### 4.2 `@flahasoil/soil-chemistry`

Net-new domain for v2:

- CEC, base saturation, cation balance (Ca / Mg / K / Na / H / Al).
- ESP, SAR.
- pH interpretation, salinity interpretation.

### 4.3 `@flahasoil/soil-interpretation`

Composes physics + chemistry into agronomic guidance: plant-available water
vs. crop demand, salinity stress, cation imbalance flags, irrigation /
amendment recommendations.

---

## 5. Monorepo benefits

- **One install, one lockfile** via npm workspaces (`apps/*`, `packages/*`).
- **Atomic refactors** across client, server and engines.
- **Type safety end-to-end** via `@flahasoil/shared-types`.
- **Reusable engines** — the same `@flahasoil/soil-physics` package backs the
  API, future CLI tools, and the FlahaCalc integration in Phase 7.
- **Clear scope boundaries** — engines never import HTTP / DB code, apps never
  hold scientific logic.

---

## 6. What this Phase 1 skeleton intentionally does **not** do

- Does not pick a frontend build tool (Vite vs. Next vs. Remix).
- Does not pick a runtime validation library.
- Does not configure ESLint, Prettier, Jest / Vitest, or CI.
- Does not touch the legacy `api-implementation/` or `public/` trees.
- Does not change the Prisma schema or the database.

Those decisions are made in their respective phases (see
`docs/v2-migration-plan.md`).
