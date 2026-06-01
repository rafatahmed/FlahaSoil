<!-- @format -->

# FlahaSOIL v2 — Migration Plan

> Companion to `docs/v2-architecture.md`. Lists the phases, their entry/exit
> criteria and the legacy-system rules that apply throughout the migration.

---

## Ground rules (apply to every phase)

1. The **legacy system** (`api-implementation/` + `public/`) keeps running
   exactly as it does today until Phase 8 retires it.
2. No legacy file is modified during a v2 phase unless the phase explicitly
   says so.
3. Every v2 phase ends with the legacy regression baseline
   (`docs/legacy-calculation-samples.md`) still passing for the corresponding
   v2 outputs (from Phase 3 onwards).
4. Every phase produces written evidence in `docs/`.

---

## Phase 0 — Freeze legacy baseline ✅ COMPLETE

**Goal:** Lock in what exists today so v2 can be verified against it.

Outputs (already in `docs/`):

- `legacy-baseline.md` — frontend / backend / DB / engine / scope.
- `legacy-api-map.md` — every route under `/api/v1/*`.
- `legacy-calculation-samples.md` — verbatim engine outputs for five canonical
  soils across FREE / PROFESSIONAL / ENTERPRISE tiers.
- `migration-notes.md` — reuse vs. do-not-carry list.
- `known-issues.md` — ISS-001 … ISS-011.

Exit criteria: numerical regression target frozen; reuse vs. discard decisions
recorded.

---

## Phase 1 — Create v2 skeleton ✅ COMPLETE

**Goal:** Stand up the monorepo structure and placeholders only.

Outputs:

- `backend`, `frontend` (placeholders).
- `packages/soil-physics`, `packages/soil-chemistry`,
  `packages/soil-interpretation`, `packages/shared-types`,
  `packages/validation` (placeholders).
- Root `package.json` declared as `private` workspace root (`frontend`,
  `backend`, `packages/*`).
- `tsconfig.base.json` — shared strict TypeScript config.
- `docs/v2-architecture.md`, `docs/v2-migration-plan.md`.

Exit criteria: directory structure exists; no legacy file modified except the
additive workspace fields in the root `package.json`; no runtime behaviour
changed.

---

## Phase 2 — Extract soil physics engine ✅ COMPLETE

**Goal:** Port the Saxton & Rawls (2006) engine from
`api-implementation/src/services/soilCalculationService.js` into
`packages/soil-physics` as **pure TypeScript functions**.

Tasks:

- Choose runtime (Node 20+) and build tool (`tsup` or `tsc`).
- Choose unit-test runner (`vitest` likely).
- Translate equations 1–24 verbatim — no algorithmic changes, no “improvements”.
- Add USDA texture classification.
- Public API exports DTOs from `@flahasoil/shared-types`.

Exit criteria: pure functions exist; the legacy `SoilCalculationService` is
**unchanged**; both engines can be invoked side-by-side from a script for the
Phase 3 regression run.

---

## Phase 3 — Add regression testing ✅ COMPLETE

**Goal:** Prove that `@flahasoil/soil-physics` reproduces the frozen baseline.

Tasks:

- Encode the five canonical soils from
  `docs/legacy-calculation-samples.md` as fixtures.
- Compare v2 outputs to legacy outputs field-by-field within an explicit
  numeric tolerance (decided at the start of the phase).
- CI job that fails on any drift.

Exit criteria: regression suite green for FREE / PROFESSIONAL / ENTERPRISE
shapes for all five soils.

---

## Phase 4 — Build soil chemistry engine ✅ COMPLETE

**Goal:** Implement the domain that the legacy system lacks.

Tasks:

- Schema design for chemistry inputs (CEC, exchangeable cations, pH, EC).
- Implement: CEC, base saturation, cation percentages
  (`cation / CEC × 100`), Ca / Mg / K / Na / H / Al balance, ESP, SAR.
- Pure functions in `@flahasoil/soil-chemistry`.
- New Prisma model in v2 (the legacy nullable
  `cationExchangeCapacity` / `baseSaturation` columns are **not** carried
  forward — see `docs/migration-notes.md` ISS-002).
- Unit tests against published worked examples.

Exit criteria: chemistry engine returns deterministic outputs for documented
fixtures; persistence layer designed.

---

## Phase 5 — Add interpretation engine ✅ COMPLETE

**Goal:** Combine physics + chemistry into agronomic guidance.

Tasks:

- `@flahasoil/soil-interpretation` consumes the two scientific packages.
- Outputs: plant-available water vs. crop demand, salinity stress flags,
  cation imbalance flags, fertility status, amendment recommendations.
- Pure functions; rule sources documented in code comments + a methodology
  doc.

Exit criteria: interpretation outputs reviewed by a domain expert; rules
catalogued.

---

## Phase 5A — Single-application layout ✅ COMPLETE

**Goal:** Collapse the early `frontend/` placeholder + `apps/web` experiment
into one canonical client (`frontend/`) and one canonical server (`backend/`)
so subsequent phases have a single, unambiguous wiring target.

Tasks:

- Promote `frontend/` to the canonical React/Vite client (workspace name
  `@flaha/web`).
- Promote `backend/` to the canonical Node/Express server (workspace name
  `@flaha/api`).
- Delete legacy experimental scaffolds; keep `api-implementation/` and
  `public/` untouched.
- Wire the mock-only React pages (wizard, detail, FlahaCalc export, reports)
  against `mockApiV2Client` from `@flaha/shared-types`.

Exit criteria: `npm run typecheck` / `build` / `test` green for both
workspaces; no references to removed scaffolds remain.

---

## Phase 6 — Backend API implementation ✅ COMPLETE

**Goal:** Replace the placeholder `backend/` with the real Express server that
serves the eight `/api/v2` routes from `docs/v2-api-contracts.md`.

Tasks:

- Express app with security middleware (`helmet`, `cors`, `morgan`), Zod
  validation, structured error handler, and `GET /health` (alias `/healthz`).
- Eight `/api/v2` route handlers (samples, tests, calculate, interpretation,
  reports, FlahaCalc export) backed by service-layer code that talks to the
  v2 Prisma client and the scientific packages.
- Calculation orchestration service that runs physics → chemistry →
  interpretation in one transaction.
- Vitest suite covering schema validation, the FlahaCalc export projection,
  and the HTTP surface via `supertest` (no DB required).
- Backend README documenting routes, scripts, env vars, and hard rules.

Exit criteria: `typecheck` / `build` / `test` green for `@flaha/api`; no
legacy folder modified; all eight routes implemented under `backend/src/`.

---

## Phase 7 — End-to-end wiring & runtime integration ✅ COMPLETE

**Goal:** Make the v2 system runnable in development — connect the React
frontend to the Express backend, generate the v2 Prisma client, and gate any
DB-touching tests behind explicit opt-in. Mock-mode is preserved as the
default so the frontend still runs with no backend at all.

Tasks:

- Environment safety: `backend/.env.example` and `frontend/.env.example`
  document `DATABASE_URL_V2`, `VITE_API_BASE_URL`, and `VITE_USE_MOCK_API`.
- Run `npm run prisma:generate:v2` to emit the v2 client into
  `prisma/generated/v2-client`; verify the loader in
  `backend/src/prisma/client.ts` resolves it from `src/` and `dist/`.
- Add a guarded integration test (`backend/src/__tests__/integration/`) that
  exercises create-sample → create-test → calculate → fetch →
  flahacalc-export against a real Postgres, and skips cleanly when no test
  DB is configured. Cleanup refuses to run unless the connection string
  contains `test`.
- Frontend: introduce `realApiV2Client.ts` (fetch-backed) and
  `apiClientProvider.ts` (single decision point). Pages call
  `getApiClient()` instead of importing the mock directly. Default mode is
  `mock`; `VITE_USE_MOCK_API="false"` flips to `real`.
- Wire `SoilTestWizardPage`, `SoilTestDetailPage`, and `FlahaCalcExportPage`
  through the provider so they exercise the real `/api/v2` surface end-to-end
  when configured for it.
- Document the runtime architecture in `docs/v2-e2e-wiring.md`.

Exit criteria: `typecheck` / `build` / `test` green for both workspaces;
integration test passes against a real test DB and skips otherwise; mock
mode still works with no backend running; no legacy code touched.

See `docs/v2-e2e-wiring.md` for the runtime topology, env matrix, and
operational runbook.

---

## Phase 7A — Real runtime verification ✅ COMPLETE

**Goal:** Prove the v2 stack actually runs against a real PostgreSQL
database on the fixed development ports — not just in mocks and unit
tests. No features added, no refactors, no legacy code touched.

Tasks:

- Provision the `flahasoil_v2_dev` PostgreSQL 16 database locally.
- Materialise `backend/.env` (`DATABASE_URL_V2`, `PORT=3002`) and
  `frontend/.env` (`VITE_API_BASE_URL=http://localhost:3002/api/v2`,
  `VITE_USE_MOCK_API=false`); add both to `.gitignore`.
- Pin `frontend/vite.config.ts` to `port: 5173` with `strictPort: true`,
  and load `backend/.env` via `tsx --env-file=.env` so the API always
  binds 3002 with the correct `DATABASE_URL_V2`.
- Sync schema with `prisma db push` against `flahasoil_v2_dev` (no
  production migration history is created).
- Drive the prescribed Doha sample end-to-end through the live API:
  `POST /soil-samples` → `POST /soil-tests` → `POST /calculate` →
  `GET /soil-tests/:id` → `GET /flahacalc-export`.
- Verify rows in all seven core tables in PostgreSQL and confirm the
  legacy SQLite file (`api-implementation/prisma/dev.db`) is untouched.
- Confirm the SPA on `:5173` is in real-API mode (env values inlined by
  Vite) and that CORS preflight + cross-origin GET succeed against
  `:3002`.
- `typecheck` / `build` / `test` green for both workspaces; the gated
  integration test stays skipped because the dev DB name does not
  contain `test`.

Exit criteria: all of the above verified and recorded in
`docs/v2-runtime-verification.md`. Ready for Phase 8.

---

## Phase 8A — Product workflow correction ✅ COMPLETE

**Goal:** Make the Project the primary container of the product. Every
soil sample must belong to a project; every soil test belongs to a
sample; every report belongs to a test. No orphan samples, no orphan
tests, no orphan reports.

Tasks:

- Promote `Project` to a required parent for `SoilSample` in the v2
  Prisma schema (`SoilSample.projectId` non-null, FK to `Project.id`).
- Add `POST /api/v2/projects`, `GET /api/v2/projects`,
  `GET /api/v2/projects/:id` and project-scoped sample listing.
- Add the Projects list, Project detail, and "new project" UI; gate
  the soil-test wizard on a selected project.
- Update report/export flows to surface the parent project on every
  artefact.

Exit criteria: every sample, test, and report in the v2 stack is
reachable via a project; the Phase 7A runtime flow still passes
end-to-end through the project-scoped routes; no legacy code touched.

---

## Phase 8B — User + project ownership foundation ✅ COMPLETE

**Goal:** Replace the temporary `user_mock` literal that Phase 8A used
as a placeholder owner with a real `User` model, a centralised
dev-session layer, and consistent ownership enforcement on every
project-scoped route. This is **not** production authentication — no
passwords, JWT, OAuth, or email verification — only the boundaries
and types needed so a real auth layer can be slotted in later.

Tasks:

- Add `User` (id, email, displayName, role, createdAt, updatedAt,
  archivedAt) and `UserRole` (`ADMIN | AGRONOMIST | CLIENT | VIEWER`)
  to the v2 Prisma schema; turn `Project.userId` into an FK to
  `User.id`. Seed `user_dev_admin` via `backend/src/bootstrap.ts` so
  cold starts always have one resolvable owner.
- Introduce `backend/src/auth/devSession.middleware.ts` (resolves
  `req.currentUser` from the `x-dev-user-id` header, falls back to the
  seeded dev user) and `backend/src/auth/ownership.ts`
  (`assertProjectOwnership`, `assertSampleOwnership`,
  `assertSoilTestOwnership` — all return `404` on cross-user access).
- Refactor `projects`, `soil-samples`, `soil-tests`, `reports`, and
  the FlahaCalc export controller/service to take `currentUser` from
  the resolver instead of a `userId` field on the request body/query.
  Remove `userId` from the matching shared-types DTOs
  (`CreateProjectRequest`, `ListProjectsQuery`,
  `CreateSoilSampleRequest`).
- Add `GET /api/v2/me` returning `{ session: { mode, user } }` for the
  frontend bootstrap.
- Add `frontend/src/session/{SessionContext, SessionProvider,
useSession, devSessionStorage, SessionUserChip}.tsx`; call
  `GET /api/v2/me` on mount, persist the resolved id in
  `localStorage` (`flahasoil.v2.devUserId`), and have
  `realApiV2Client` inject it as `x-dev-user-id` on every request.
  `mockApiV2Client` mirrors the same shape against an in-memory
  fixture.
- Sweep the frontend for `user_mock` / `getCurrentUserId()` literals;
  every page (`DashboardPage`, `ProjectDetailPage`, `ProjectsListPage`,
  `ReportsPage`, `SoilTestWizardPage`) and component (`SampleInfoStep`,
  `ProjectSelector`, `NewProjectDialog`) now reads identity from the
  session.
- UX: AppBar shows `SessionUserChip` (avatar + name + role); the
  dashboard greets the current user; the projects list is now
  "My projects".
- Document the layer in `docs/v2-user-ownership.md` (hierarchy,
  session flow, resolver, future-auth migration strategy, and what is
  intentionally NOT done yet).

Exit criteria: backend `typecheck` / `test` green; frontend
`typecheck` green; no hardcoded `user_mock` literal remains in the
frontend or in production backend code; every project-scoped route
goes through an ownership assertion; the Phase 8A
project → sample → test → report flow still runs end-to-end with the
seeded dev user. Recorded in `docs/v2-user-ownership.md`.

Out of scope (deferred): login screen, password storage, JWT/OAuth,
role-gated routing, multi-tenant orgs, audit log of mutations.

---

## Phase 8C — Professional soil-test UX ✅ COMPLETE

**Goal:** Transform the soil-test wizard and results pages from a
developer-facing form into a guided agronomic workflow. Scientific
packages (`packages/soil-*`) and legacy code (`api-implementation/`)
were **not** touched; this phase is purely presentational.

Tasks (P8C.1 → P8C.8):

1. **Helper utilities** (`frontend/src/features/.../utils/`)
   - `textureValidator.ts` — sand+silt+clay sum-to-100 check with a
     0.1 % tolerance and a per-component missing detector.
   - `salinityConsistency.ts` — pure EC vs. TDS consistency hint
     (~640 mg/L per dS/m); never blocks submission.
   - `interpretationStatus.ts` — categorical-string → tri-state
     visual status (`good | fair | poor`) + MUI chip color. The
     mappings mirror exactly the strings emitted by
     `@flaha/soil-interpretation/rules.ts`.
   - `agronomicCopy.ts` — short plain-language captions per
     interpretation field, per physics number, per chemistry number,
     and per overall rating.
2. **Wizard stepper** (`SoilTestStepper`) — vertical orientation on
   small screens, optional per-step description, and an at-a-glance
   "Step N of M" indicator.
3. **Wizard steps** (`SampleInfoStep`, `TestLevelStep`,
   `PreliminaryInputStep`, `ModerateInputStep`, `AdvancedInputStep`)
   - Refactored into grouped `FieldSection`s with explanatory
     captions per group.
   - `TestLevelStep` rendered as three selectable cards showing what
     each level captures and which scenarios it suits.
   - `PreliminaryInputStep` surfaces a live texture-sum chip and an
     EC/TDS consistency hint without blocking progress.
4. **Review step** (`ReviewStep`) — human-readable summary first
   (sample, test level, populated panels), a pre-submit checklist
   (project selected, texture sums valid, EC/TDS consistent), and
   the raw `CreateSoilTestRequest` payload tucked behind a
   "Developer details" accordion.
5. **Results header** (`SoilTestSummaryHeader`) — at-a-glance banner
   with overall rating chip, test-level + texture-class + lab
   chips, and a "critical alerts" strip generated from
   `categoryToStatus(...) === poor` interpretation rows.
6. **Interpretation card** (`InterpretationCard`) — per-row status
   chip (good / fair / poor) and an agronomic snippet under each
   field. No thresholds live in the UI; only mappings.
7. **Physics card** (`PhysicsResultCard`) — emphasised
   plant-available water / field capacity / wilting point block,
   then a compact "structure & conductivity" table. Plain-language
   captions per number.
8. **Chemistry card** (`ChemistryResultCard`) — grouped layout:
   a CEC / base-saturation highlight pair, a cation-share row
   (Ca / Mg / K / Na as % of CEC), and a sodicity indicators
   block (ESP, SAR). Calculation mode is shown as a small chip in
   the header.

Exit criteria: `npm run typecheck` and `npm run build` green for
`@flaha/web` (vitest is not configured for the frontend — see
P8C.7 below); no scientific package edited; all wizard steps
rendered through the new `FieldSection`; results detail page
mounts `SoilTestSummaryHeader` and the redesigned cards;
agronomic copy lives in `agronomicCopy.ts` and is reused by the
header and the interpretation card.

Out of scope (deferred):

- **P8C.7 — Vitest coverage for helper utilities** was cancelled:
  the frontend has no Vitest runner configured and adding one is a
  separate task. The new helpers are small pure functions and are
  exercised through TypeScript types at the call sites.
- Charts / visualisations of physics or chemistry values.
- i18n of the new agronomic copy.
- Print stylesheet for the results page.

---

## Phase 8C-A — App shell, navigation, branding ✅ COMPLETE

**Goal:** Lift FlahaSOIL from a developer-style single-pane app into a
coherent professional platform: brand-driven theme, persistent app
shell with sidebar + top bar + breadcrumbs, a marketing-style landing
page distinct from the operational dashboard, a profile workspace, and
honest stubs for the platform surfaces still on the roadmap. No
scientific packages or legacy code were modified.

Outputs:

- `frontend/src/theme/flahaSoilTheme.ts` — palette tokens (Deep Soil
  Brown, Clay Earth, Sand Beige, Organic Green, Analytical Cream,
  Mineral Warning, Critical Salinity Red, Neutral Background) and an
  MUI theme override (typography scale, surface treatments). Wired
  through `App.tsx`.
- `frontend/src/layouts/AppLayout.tsx` — persistent shell on `md+`,
  drawer on mobile, with three regions: `TopAppBar`, `SidebarNav`,
  `PageContextBar`. Header state flows through `PageHeaderContext`
  so each route declares its own title / subtitle / breadcrumbs via
  the `usePageHeader` hook.
- Route hierarchy (`AppRoutes.tsx`): `/` (Landing), `/dashboard`,
  `/projects`, `/projects/:id`, `/soil-tests/new`, `/soil-tests/:id`,
  `/soil-tests/:id/report`, `/reports`, `/flahacalc-export`,
  `/profile`, `/settings` (stub), `/standards` (stub).
- `LandingPage.tsx` — hero, five-pillar platform overview, workflow
  strip, Flaha ecosystem (SOIL / Calc / FAST), footer with runtime
  mode + platform status. Does not load API data.
- `DashboardPage.tsx` — operational workspace with a Soil Health
  Overview (Projects / Samples / Active / Archived KPIs), recent
  projects, alerts panel (archived + empty-active signals today),
  system-status card, and quick actions.
- `ProfilePage.tsx` — identity card (avatar, role, dev-session chip),
  platform activity (project / sample counts), session information,
  and planned-feature cards (account security, organisation
  settings, API access).
- `SettingsPage.tsx`, `StandardsPage.tsx` — honest stubs with
  "Planned" / "Reference in preparation" chips so the sidebar entries
  do not lead to 404s.
- Page-context integration: `ProjectsListPage`, `ProjectDetailPage`,
  `SoilTestWizardPage`, `SoilTestDetailPage`, `SoilTestReportPage`,
  `ReportsPage`, `FlahaCalcExportPage`, `ProfilePage` all call
  `usePageHeader(...)`. The shell's top bar shows the page title and
  the optional project context; the breadcrumb strip shows the path
  from Home / Dashboard down to the active record.
- Copywriting cleanup: `In-memory mock` → `Demonstration mode`,
  `Mock client — no backend call.` → `Demonstration mode — sample
data only.`, `Coming soon` / `Soon` → `Planned`. Redundant in-page
  H4 titles removed where the shell already shows the same title.
- `docs/v2-app-shell.md` — shell architecture, theme tokens, route
  hierarchy, page-header contract, responsive behaviour, deferred
  items.

Exit criteria: `npm run typecheck` + `npm run build` green for
`@flaha/web`; `npm run typecheck` green for `@flaha/api`; no
scientific package or legacy file touched; every route in the
hierarchy renders inside the shell and updates the top bar +
breadcrumbs via `usePageHeader`.

Out of scope (deferred to later phases):

- Real Settings (units, locale, notifications, theme) — UI shell
  only, no persistence.
- Real Standards reference content — descriptive index only.
- Frontend Vitest setup (already deferred from Phase 8C).
- Authentication beyond the dev-session header (Phase 9+).
- Print / PDF stylesheet for the report page.

---

## Phase 8 — Reports, audit trace, production hardening

**Goal:** Round out the v2 surface with the report generation pipeline,
end-to-end audit traceability, and the operational primitives required for a
non-development deployment.

Tasks:

- Wire `POST /api/v2/soil-tests/:id/reports` to the templated PDF/HTML
  generator and persist artefacts.
- Capture an audit trace per calculation (inputs, engine versions, derived
  outputs) using the existing Prisma `AuditEntry` model.
- Add structured request logging, rate limiting, and authentication on
  `/api/v2/*`.
- Production-grade env handling, container build, and migration runbook for
  `prisma migrate deploy` against PostgreSQL.

Exit criteria: reports generated and downloadable from the frontend; audit
entries written for every calculation; backend deployable from a single
container image.

---

## Phase 9 — Integrate with FlahaCalc

**Goal:** Wire `@flahasoil/soil-physics`, `@flahasoil/soil-chemistry` and
`@flahasoil/soil-interpretation` into the FlahaCalc DSS so the same engine
backs both products.

Tasks:

- Define the cross-product contract.
- Publish engine packages internally (workspace dependency or private
  registry).
- Replace any duplicated soil math inside FlahaCalc with engine calls.

Exit criteria: FlahaCalc consumes the engines; no soil math is duplicated.

---

## Phase 10 — Retire legacy HTML

**Goal:** Remove `public/` and `api-implementation/` from runtime.

Tasks:

- Cut over DNS / reverse proxy to `frontend/` and `backend/`.
- Migrate production data from SQLite to PostgreSQL.
- Archive the legacy folders (git tag) and delete from main.
- Final regression run against the Phase 0 baseline.

Exit criteria: no traffic served from legacy code; baseline still green;
documentation updated.
