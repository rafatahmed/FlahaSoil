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

## Phase 8 — Reports & production hardening (foundation) ✅ COMPLETE

**Goal:** Land the Phase 8 baseline of report assembly + audit trace +
operational primitives. This is the foundation that Phase 8D builds on.

Tasks (delivered):

- `GET /api/v2/soil-tests/:id/report` — read-only `SoilReportEnvelope`
  with normalised inputs, structured warnings, and an audit trace
  (`physicsTrace`, `chemistryInputsUsed`, `normalizedInputs`,
  `skippedModules`). No calculations re-run at fetch time.
- Structured warning catalogue (`backend/src/services/report/warnings.ts`)
  with stable wire codes (`CHEMISTRY_SKIPPED_*`, `TDS_INCONSISTENT_WITH_EC`,
  `EC_DERIVED_FROM_TDS`, `INTERPRETATION_WARNING`).
- Operational primitives: structured JSON logger
  (`backend/src/utils/logger.ts`), in-memory sliding-window rate limit
  (`backend/src/middleware/rateLimit.ts`, 120 req/min/IP), hardened
  `errorHandler` mapping `entity.too.large` → `PAYLOAD_TOO_LARGE` (413),
  `express.json({ limit: "512kb" })`, new shared error codes
  `PAYLOAD_TOO_LARGE` and `RATE_LIMITED`.
- Frontend `SoilTestReportPage` mounted at `/soil-tests/:id/report` with
  `warningDetails` chips and a collapsible audit-trace panel.

Exit criteria: report envelope reachable from the SPA; warnings carry
stable codes; rate limit + payload cap in place; documented in
`docs/v2-reporting.md`.

Out of scope (moved to Phase 8D / Phase 9): immutable report versions,
recommendation rule engine, HTML/PDF renderer pipeline, container build,
production deployment runbook, real authentication.

---

## Phase 8D — Reports v1 & production hardening ✅ COMPLETE

**Goal:** Turn the Phase 8 read-only envelope into a professional,
versioned, immutable report product with a deterministic recommendation
engine and a renderer abstraction that targets HTML today and PDF /
email in Phase 9.

Tasks (P8D.A → P8D.J):

1. **Database** — Add `SoilReport` (durable handle: title, number,
   archived flag, `currentVersionId` pointer, status) and
   `ReportVersion` (immutable snapshot with `snapshotJson`,
   `versionNumber`, `status`, `generatedByUserId`, denormalised
   `overallSoilRating` + `textureClass` for cheap list rendering).
   Status enum `SoilReportStatus`
   (`DRAFT|GENERATING|READY|FAILED|ARCHIVED`). Indexed on `archived`,
   `status`, `reportId`. Schema synced via `prisma db push` against
   `flahasoil_v2_dev`; no destructive migration.
2. **Shared types** — `ProfessionalReportDTO`,
   `RecommendationSetDTO`, `ReportVersionDTO`,
   `GenerateReportRequest/Response`, `PatchReportRequest/Response`,
   `ListReportVersionsResponse`, `GetReportResponse`,
   `ListProjectReportsResponse` in
   `packages/shared-types/src/professional-report.ts` and re-exported
   from the package barrel. Wire-stable codes
   (`REC-<DOMAIN>-<NNN>`, `SoilReportStatus`).
3. **Composer (pure)** — `composeProfessionalReport()` takes already
   loaded Prisma rows + the existing `SoilReportEnvelope` and returns
   a fully populated `ProfessionalReportDTO` (cover, executive
   summary, texture/physics/chemistry, salinity/sodicity/irrigation,
   agronomic, recommendations, notes, appendix). Pure function — no
   I/O, no recalculation.
4. **Recommendation engine** — Rule registry
   (`backend/src/services/report/rules.ts`) of pure records (`code`,
   severity, horizon, category, copy, `evaluate(ctx)`). 13 rules
   across SAL / SOD / PH / OM / TEX / CEC / DRN / COMP / MON.
   `runRecommendations()` walks the registry once and groups matches
   by horizon (`SHORT|MEDIUM|LONG`).
5. **Renderer abstraction** — Three small interfaces in
   `renderer/types.ts` (`ReportTemplate`, `ReportRenderer`,
   `ReportExporter`) + `DEFAULT_BRAND` tokens. `DefaultReportRenderer`
   assembles `defaultTemplate` + `defaultTemplate2` into a
   self-contained HTML document with brand tokens inlined as CSS
   variables. PDF / email exporters intentionally deferred.
6. **Service (transactional)** — `generateReport()` /
   `regenerateReport()` write the version + flip
   `SoilReport.currentVersionId` inside a single
   `prisma.$transaction(...)`. Failures persist a `FAILED` version
   with `errorMessage` rather than leaving an orphaned `GENERATING`
   row. `listProjectReports()`, `getReport()`, `updateReport()`,
   `listVersions()`, `getVersion()` round out the surface.
7. **HTTP surface** — `POST /api/v2/soil-tests/:id/reports`,
   `GET /api/v2/projects/:projectId/reports`,
   `GET|PATCH /api/v2/reports/:id`,
   `POST /api/v2/reports/:id/regenerate`,
   `GET /api/v2/reports/:id/versions`,
   `GET /api/v2/reports/:id/versions/:n`,
   `GET /api/v2/reports/:id/versions/:n/preview` (text/html).
   Validation via zod schemas; ownership enforced through
   `assertReportOwnership` (Report → SoilTest → SoilSample → Project →
   User); cross-user access returns 404 (not 403).
8. **Frontend** — `ReportsListPage` (cards per report with status
   badge, latest version, generatedAt, generate action) and
   `ReportDetailPage` (sectioned `ProfessionalReportDTO` render,
   version history sidebar with regenerate, Print button opens HTML
   preview, disabled "Download PDF" placeholder). Both mock and real
   API clients expose `listReports` / `getReport` /
   `getReportVersions` / `getReportVersion` / `generateReport` /
   `regenerateReport` / `updateReport`.
9. **Tests** — 5 composer + 9 service (stub Prisma `$transaction`) +
   9 ownership + 5 recommendation + 16 extended interpretation +
   17 legacy interpretation tests. Full backend suite at 79 pass +
   1 skipped. `__tests__/integration/soilTest.e2e.test.ts` remains
   gated on `DATABASE_URL_V2` matching `*_test`.
10. **Documentation** — `docs/v2-reports.md` (architecture, schema,
    immutability model, DTO sections, rule registry, renderer
    abstraction, HTTP surface, frontend integration, testing matrix,
    deferred items).

Exit criteria: backend `typecheck` + `test` green (79 pass, 1 skipped);
frontend `typecheck` + `build` green; immutable snapshots reproducible
across rule registry changes; ownership chain enforced on every report
route; documented in `docs/v2-reports.md`.

Out of scope (deferred to Phase 9):

- PDF exporter (Puppeteer / Playwright) — `ReportExporter` interface
  in place.
- Email exporter (transactional templates).
- Real authentication beyond the dev-session header (login / JWT /
  role gating).
- Container image + production deployment runbook +
  `prisma migrate deploy` against managed PostgreSQL.
- Branded print stylesheet beyond the inlined token defaults.
- Formal agronomic review of rule thresholds and citations.
- Multi-tenant orgs / shared reports across users.

---

## Phase 9A — Authentication & multi-tenant architecture ✅ COMPLETE

**Goal:** Replace the Phase 8B `x-dev-user-id` development header with
production-grade authentication (argon2 + JWT access + hashed refresh
tokens) and re-anchor resource ownership from `User` to
`Organization` so the platform supports multi-tenant deployments.

### 9A-A — Database schema ✅ COMPLETE

- Added `passwordHash`, `lastLoginAt`, `archivedAt` to `User`.
- Added `Organization` (id, name, slug unique, createdAt) and
  `OrganizationMembership` (`@@unique([userId, organizationId])`,
  `role: OrganizationRole`).
- `OrganizationRole` enum: `OWNER`, `ADMIN`, `AGRONOMIST`,
  `LAB_TECHNICIAN`, `CONSULTANT`, `VIEWER`.
- Added `RefreshToken` (token-hash + family-id, revoked flag,
  user/membership FK, replayed-by pointer) and `AuditLog` (action +
  actor + target + payload + at).
- Added `organizationId` to `Project`, `SoilSample`, `SoilTest`, and
  `SoilReport` (denormalised for fast tenant-scoped queries).
- Synced via `prisma db push` against `flahasoil_v2_dev`; no
  production data so no backfill required.

### 9A-B — Tenant ownership migration ✅ COMPLETE

- All resource queries now filter by `organizationId` rather than
  `userId`. `Project.userId` is retained as the _author_ of the row
  but no longer the tenancy key.
- New tenancy assertion helpers in `backend/src/auth/ownership.ts`:
  `assertProjectTenancy`, `assertSampleTenancy`,
  `assertSoilTestTenancy`, `assertReportTenancy`. All return 404
  (not 403) on a cross-tenant match.

### 9A-C — Auth backend ✅ COMPLETE

- `backend/src/auth/password.ts` — argon2id hash + verify
  (OWASP 2024: 64 MiB / 3 iterations) + policy validation
  (≥12 chars, letter+digit, max 128).
- `backend/src/auth/jwt.ts` — HS256 access tokens via `jose`
  (15-min TTL, `{ sub, oid, iat, exp }` claims).
- `backend/src/auth/refreshTokens.ts` — 32-byte b64url tokens stored
  as SHA-256 hashes; family-based rotation + reuse detection
  (replay triggers revocation of the whole family).
- `backend/src/auth/audit.ts` — `writeAuditTransactional` for
  security events and `writeAuditBestEffort` for business events.
- HTTP surface under `/api/v2/auth`: `POST /register`, `POST /login`,
  `POST /refresh`, `POST /logout`, `GET /me`. Refresh tokens travel
  in an `HttpOnly; Secure` cookie scoped to `Path=/api/v2/auth`;
  access tokens are returned in the JSON body and held in browser
  memory only.
- Production boot fails fast when `JWT_SECRET` is missing or
  shorter than 32 chars; dev/test derive a deterministic per-machine
  fallback so issued tokens survive a `tsx watch` reload.

### 9A-D — Route protection & tenant isolation ✅ COMPLETE

- `backend/src/auth/session.middleware.ts` — `resolveAuthSession`
  verifies the bearer JWT, loads the `User` + active
  `OrganizationMembership`, and attaches
  `req.authSession = { mode, userId, organizationId, role,
membershipId, ... }`. Falls back to the legacy dev resolver only
  when `ALLOW_DEV_AUTH=true` (default ON in dev/test, FORCE OFF in
  production; explicit `ALLOW_DEV_AUTH=true` under
  `NODE_ENV=production` is a boot-time error).
- `backend/src/auth/guards.ts` — composable middlewares:
  `requireAuth`, `requireOrganization`, `requireOrgRole(...roles)`,
  `requireProjectAccess`, `requireSampleAccess`,
  `requireSoilTestAccess`, `requireReportAccess`. Resource guards
  combine the tenancy assertion with the role matrix (see below)
  and surface a single 404 on cross-tenant access.
- `backend/src/routes/v2.routes.ts` — every protected route is
  mounted with `resolveAuthSession` + the matching guards.
  `/api/v2/auth/{register,login,refresh}` stay public;
  `/api/v2/auth/{me,logout}` are JWT-protected.

#### Role matrix (Phase 9A-D)

| Role             | Read | Create / edit projects | Create samples + tests | Generate / regen reports | Manage org / members |
| ---------------- | :--: | :--------------------: | :--------------------: | :----------------------: | :------------------: |
| `OWNER`          |  ✅  |           ✅           |           ✅           |            ✅            |          ✅          |
| `ADMIN`          |  ✅  |           ✅           |           ✅           |            ✅            |          ✅          |
| `AGRONOMIST`     |  ✅  |           ✅           |           ✅           |            ✅            |          ❌          |
| `LAB_TECHNICIAN` |  ✅  |           ❌           |           ✅           |            ❌            |          ❌          |
| `CONSULTANT`     |  ✅  |           ❌           |           ❌           |            ✅            |          ❌          |
| `VIEWER`         |  ✅  |           ❌           |           ❌           |            ❌            |          ❌          |

Locked in by `backend/src/__tests__/roleMatrix.test.ts` (24 cases:
`POST /projects`, `POST /soil-samples`, `POST /reports/:id/regenerate`,
plus a positive-control read for every role).

#### Tenant isolation tests

`backend/src/__tests__/tenantIsolation.test.ts` seeds two
organizations (Org A + Org B) with an owner each. Org B's bearer
token receives a 404 for every read of Org A's project, sample,
test, report, report versions, and project-scoped report list, and
sees an empty list for `GET /projects`. The Org A owner sees their
own project as a positive control. A malformed bearer also returns
401 with `UNAUTHORIZED`.

### 9A-E — Production-only auth + legacy cleanup ✅ COMPLETE

- `ALLOW_DEV_AUTH` defaults to **false** in every environment. Tests
  that need the dev resolver opt in by setting
  `process.env.ALLOW_DEV_AUTH = "true"` BEFORE the first import of
  `config/env` and calling `_resetEnvForTesting()` (see
  `backend/src/__tests__/app.test.ts`).
- `backend/src/config/env.ts` switched to a lazy-loaded Proxy so a
  test harness can mutate `process.env` after the module import and
  the value still propagates on first read. Production /
  dev call sites are unaffected (the proxy resolves once and caches).
- `backend/src/auth/devSession.middleware.ts` deleted. The single
  entry point is `resolveAuthSession`; the dev path is now an
  internal fallback inside that middleware, gated on
  `env.auth.allowDevAuth && env.nodeEnv !== "production"`.
- `req.currentUser` back-compat write removed from
  `resolveAuthSession`. Every controller reads `req.authSession`
  exclusively (see `controllers/me.controller.ts` as the canonical
  example).
- Legacy `userId`-based ownership helpers (`assertProjectOwnership`,
  `assertSampleOwnership`, `assertSoilTestOwnership`,
  `assertReportOwnership`, `requireCurrentUser`) deleted from
  `backend/src/auth/ownership.ts`. Only the `organizationId`-based
  `assert*Tenancy` family remains.
- Unused helpers `getUserOrDev` and
  `getActiveOrganizationIdForUser` removed from
  `backend/src/auth/currentUser.ts`.

### 9A-F — Route audit & tenant safety ✅ COMPLETE

Every `/api/v2/*` route is now tenant-safe by construction:

| Route                                           | Auth            | Guard                                         | Tenancy check                         | Role gate              |
| ----------------------------------------------- | --------------- | --------------------------------------------- | ------------------------------------- | ---------------------- |
| `POST /auth/register`                           | public          | —                                             | n/a                                   | n/a                    |
| `POST /auth/login`                              | public          | —                                             | n/a                                   | n/a                    |
| `POST /auth/refresh`                            | public (cookie) | —                                             | n/a                                   | n/a                    |
| `POST /auth/logout`                             | JWT             | `requireAccessToken`                          | n/a                                   | n/a                    |
| `GET  /auth/me`                                 | JWT             | `requireAccessToken`                          | n/a                                   | n/a                    |
| `GET  /me`                                      | JWT + session   | `resolveAuthSession`                          | n/a                                   | any authenticated      |
| `POST /projects`                                | JWT + session   | `requireOrgRole(ROLES_AGRONOMY_WRITE)`        | actor.org from session                | `ROLES_AGRONOMY_WRITE` |
| `GET  /projects`                                | JWT + session   | `requireOrganization`                         | filter by `organizationId`            | any role               |
| `GET  /projects/:projectId`                     | JWT + session   | `requireProjectAccess()`                      | `assertProjectTenancy`                | any role               |
| `POST /soil-samples`                            | JWT + session   | `requireOrgRole(ROLES_LAB_WRITE)`             | `assertProjectTenancy` (in service)   | `ROLES_LAB_WRITE`      |
| `GET  /soil-samples/:sampleId`                  | JWT + session   | `requireSampleAccess()`                       | `assertSampleTenancy`                 | any role               |
| `POST /soil-tests`                              | JWT + session   | `requireOrgRole(ROLES_LAB_WRITE)`             | `assertSampleTenancy` (in controller) | `ROLES_LAB_WRITE`      |
| `GET  /soil-tests/:soilTestId`                  | JWT + session   | `requireSoilTestAccess()`                     | `assertSoilTestTenancy`               | any role               |
| `POST /soil-tests/:soilTestId/calculate`        | JWT + session   | `requireSoilTestAccess({ROLES_LAB_WRITE})`    | `assertSoilTestTenancy`               | `ROLES_LAB_WRITE`      |
| `GET  /soil-tests/:soilTestId/interpretation`   | JWT + session   | `requireSoilTestAccess()`                     | `assertSoilTestTenancy`               | any role               |
| `POST /soil-tests/:soilTestId/reports`          | JWT + session   | `requireSoilTestAccess({ROLES_REPORT_WRITE})` | `assertSoilTestTenancy`               | `ROLES_REPORT_WRITE`   |
| `GET  /soil-tests/:soilTestId/report`           | JWT + session   | `requireSoilTestAccess()`                     | `assertSoilTestTenancy`               | any role               |
| `GET  /soil-tests/:soilTestId/flahacalc-export` | JWT + session   | `requireSoilTestAccess()`                     | `assertSoilTestTenancy`               | any role               |
| `GET  /projects/:projectId/reports`             | JWT + session   | `requireProjectAccess()`                      | `assertProjectTenancy`                | any role               |
| `GET  /reports/:reportId`                       | JWT + session   | `requireReportAccess()`                       | `assertReportTenancy`                 | any role               |
| `PATCH /reports/:reportId`                      | JWT + session   | `requireReportAccess({ROLES_REPORT_WRITE})`   | `assertReportTenancy`                 | `ROLES_REPORT_WRITE`   |
| `POST /reports/:reportId/regenerate`            | JWT + session   | `requireReportAccess({ROLES_REPORT_WRITE})`   | `assertReportTenancy`                 | `ROLES_REPORT_WRITE`   |
| `GET  /reports/:reportId/versions`              | JWT + session   | `requireReportAccess()`                       | `assertReportTenancy`                 | any role               |
| `GET  /reports/:reportId/versions/:n`           | JWT + session   | `requireReportAccess()`                       | `assertReportTenancy`                 | any role               |
| `GET  /reports/:reportId/versions/:n/preview`   | JWT + session   | `requireReportAccess()`                       | `assertReportTenancy`                 | any role               |

Semantics:

- Missing / expired JWT → **401** with `UNAUTHORIZED`.
- Session present but no active org → **403** with `FORBIDDEN`.
- Session OK but role insufficient → **403** with `FORBIDDEN`.
- Resource id belongs to another tenant → **404** with `NOT_FOUND`
  (no existence leak across tenants).

### 9A-G — Frontend authentication UX ✅ COMPLETE

The frontend now consumes the JWT auth backend end-to-end. The
Phase 8B `flahasoil.v2.devUserId` localStorage flow and the
`x-dev-user-id` header are gone from the web client.

- `frontend/src/auth/accessTokenStore.ts` — in-memory access-token
  snapshot (token + `expiresAt`) with subscribe semantics; never
  persisted to storage so XSS cannot exfiltrate a long-lived
  credential.
- `frontend/src/auth/refreshCoordinator.ts` — collapses concurrent
  401-driven refresh attempts into a single `POST /auth/refresh`
  call; in-flight callers await the same promise.
- `frontend/src/auth/AuthProvider.tsx` + `AuthContext.ts` +
  `useAuth.ts` — auth state machine
  (`loading | authenticated | unauthenticated | error`) plus
  `login`, `logout`, and silent-refresh-on-mount for session
  recovery after a page reload.
- `frontend/src/auth/ProtectedRoute.tsx` — redirects to
  `/login?next=<encoded path>` when unauthenticated.
- `frontend/src/auth/PublicOnlyRoute.tsx` — redirects authenticated
  users away from `/login` and `/register` to `/dashboard`.
- `frontend/src/auth/passwordPolicy.ts` — mirrors the backend
  policy (≥12 chars, letter + digit, max 128) for client-side
  validation feedback before the request is sent.
- Pages: `LoginPage`, `RegisterPage`, `LogoutPage`, `AccountPage`
  added. `DashboardPage`, `ProfilePage`, `ProjectDetailPage`,
  `ProjectReportsPage`, `ProjectsListPage`, `ReportDetailPage`,
  `ReportsPage` were migrated from `useSession` to `useAuth`.
- `frontend/src/services/realApiV2Client.ts` now attaches
  `Authorization: Bearer <accessToken>` from `accessTokenStore`,
  sends credentials so the refresh cookie travels, and routes
  401s through `coordinatedRefresh()` with a single retry before
  surfacing the error.
- `TopAppBar` shows the new `AuthUserChip` (email + active org +
  role + logout link); `SidebarNav` hides protected links when the
  session is `unauthenticated`.
- The whole `frontend/src/session/` module (SessionProvider,
  SessionContext, SessionUserChip, useSession, devSessionStorage)
  was deleted.

#### Frontend tests (Vitest + React Testing Library)

- `frontend/vite.config.ts` and `frontend/package.json` wired up
  Vitest 2.x with `jsdom` + `@testing-library/react` and a
  workspace `npm test` script.
- `frontend/src/test/setup.ts` registers `@testing-library/jest-dom`
  matchers on the Vitest `expect`.
- 19 tests across four files all green:
  - `auth/__tests__/passwordPolicy.test.ts` (5 cases — length,
    digit, letter, max length, success).
  - `auth/__tests__/accessTokenStore.test.ts` (6 cases — set/get,
    clear, subscribe + unsubscribe, expiry awareness).
  - `auth/__tests__/refreshCoordinator.test.ts` (4 cases —
    deduplication, propagation of result, reset between calls,
    error propagation).
  - `auth/__tests__/AuthProvider.test.tsx` (4 cases — silent
    refresh success, 401 settles to unauthenticated, login flips
    status + stores token, logout clears token even when the
    network call fails).

#### Frontend acceptance (Phase 9A-G brief)

- Register from `/register` → on success the user is dropped on
  `/dashboard` already authenticated.
- Login from `/login?next=…` → returns to the original protected
  URL on success.
- Page reload triggers a silent refresh; the session recovers
  when the HttpOnly cookie is still valid and falls back to
  `/login` otherwise.
- All `/api/v2/*` calls go out with a Bearer JWT (no
  `x-dev-user-id`).
- `/logout` revokes the refresh family, clears the cookie, and
  the in-memory access token.
- `npm run typecheck --workspace @flaha/web` and
  `npm run build --workspace @flaha/web` both pass.

### Outputs (Phase 9A so far)

- Backend: `backend/src/auth/{password,jwt,refreshTokens,audit,
session.middleware,guards,ownership,requireAccessToken.middleware,
currentUser}.ts`, `backend/src/services/auth.service.ts`,
  `backend/src/controllers/auth.controller.ts`,
  `backend/src/routes/auth.routes.ts`, updated `v2.routes.ts`.
  `auth/devSession.middleware.ts` was deleted in 9A-E.
- Frontend: `frontend/src/auth/{accessTokenStore,refreshCoordinator,
AuthContext,AuthProvider,useAuth,ProtectedRoute,PublicOnlyRoute,
passwordPolicy,index}.ts(x)`, pages
  `Login|Register|Logout|Account`, refactored
  `realApiV2Client.ts`, `TopAppBar`, `SidebarNav`. The
  `frontend/src/session/` module was deleted in 9A-G.
- Shared types: `AuthSessionDTO`, `RegisterRequest`, `LoginRequest`,
  `AuthMeResponse`, `OrganizationRole`, `OrganizationDTO`,
  `OrganizationMembershipDTO`.
- Tests: backend — 162 pass + 1 skipped across 19 files (46
  Phase 9A-C auth tests, 14 tenancy/ownership tests, 9 tenant
  isolation tests, and 24 role matrix tests). Frontend — 19 pass
  across 4 files (Phase 9A-G).

### Exit criteria (Phase 9A)

- All non-auth `/api/v2/*` routes require a valid JWT. The
  `x-dev-user-id` header fallback is OFF by default in every
  environment and is only honoured when `ALLOW_DEV_AUTH=true` is
  set AND `NODE_ENV !== "production"`.
- Every resource query filters by `organizationId`; cross-tenant
  access returns 404.
- Role matrix enforced by guards and locked by tests.
- Dev-auth backdoor refuses to boot under `NODE_ENV=production`.
- Frontend ships login / register / logout / account UX, holds
  access tokens in memory only, recovers sessions via silent
  refresh, and no longer reads or writes the Phase 8B
  `flahasoil.v2.devUserId` key.
- Documented in this section, `docs/v2-user-ownership.md`,
  and (next) `docs/v2-auth.md` / `docs/v2-multi-tenant-architecture.md`.

### Deferred to later Phase 9 sub-phases

- 9A-H: organization management UX — **delivered in this pass
  (org switcher + listing endpoint).** Org settings page and
  read-only members list remain queued behind 9B.
- 9A-K: dev seed with a demo org + role mix — **delivered in
  this pass.** Production migration runbook still queued under
  9A-M.
- 9A-I … 9A-J, 9A-L … 9A-M: security hardening (rate limits on
  `/auth/*`, audit-log writers for sensitive actions), expanded
  auth + tenant-isolation test suite, migration & deploy
  runbook, and acceptance walk-through of the 15 brief criteria.
- Phase 9B: invitations + email + role management UX.

---

## Phase 9A-H + 9A-K — Organization switcher & demo seed ✅ COMPLETE

**Goal:** Let users with multiple memberships rotate their active
organization from the SPA, backed by a realistic, idempotent seed
that provisions a multi-role demo organization out of the box.

### Backend (additive)

- `POST /api/v2/auth/switch-organization` (JWT-protected). Body
  `{ organizationId }`. Verifies the caller has an ACTIVE
  membership in the target org, persists the new
  `User.activeOrganizationId`, mints a fresh access token
  carrying the new `oid` claim, writes an `ORG_SWITCHED` audit
  event, and returns a full `AuthSessionDTO`. Refresh-token
  family is intentionally preserved — switches cost zero
  refresh-cookie round-trips. Returns **404** (not 403) when the
  membership is missing or non-ACTIVE so org existence is not
  leaked.
- `GET /api/v2/me/organizations` (JWT-protected). Returns
  `{ activeOrganizationId, memberships[] }` — every ACTIVE
  membership the caller holds, hydrated with the organization.
  Pure projection; powers the tenant-switcher freshness poll
  for long-running tabs.
- Wiring: `backend/src/services/auth.service.ts`
  (`switchUserOrganization`, `listUserMemberships`),
  `backend/src/controllers/auth.controller.ts`
  (`postSwitchOrganization`),
  `backend/src/controllers/me.controller.ts`
  (`getMyOrganizations`), `backend/src/routes/auth.routes.ts`,
  `backend/src/routes/v2.routes.ts`,
  `backend/src/validation/schemas.ts`
  (`switchOrganizationSchema`).

### Seed (Phase 9A-K)

- `backend/prisma/seedDemoOrganization.ts` provisions the
  **Flaha Demo Organization** (slug `flaha-demo-org`) and four
  role-distinct demo accounts in a single transaction. All
  writes are idempotent (`upsert`), so re-running the seed is a
  no-op.
- `backend/prisma/seed.ts` calls the demo seeder after the
  baseline dev seed so `npm run db:seed --workspace backend`
  yields a multi-membership user that exercises the switcher
  end-to-end. The previously seeded `user_dev_admin` joins the
  demo org as OWNER so a single login surfaces both
  memberships.

#### Demo accounts

| Email                       | Role             | Purpose                       |
| --------------------------- | ---------------- | ----------------------------- |
| `owner@flahademo.test`      | `OWNER`          | Full org administration.      |
| `agronomist@flahademo.test` | `AGRONOMIST`     | Projects + samples + reports. |
| `lab@flahademo.test`        | `LAB_TECHNICIAN` | Samples + tests only.         |
| `viewer@flahademo.test`     | `VIEWER`         | Read-only across the org.     |

All four demo accounts share the password
`FlahaDemo!2026` (constant `FLAHA_DEMO_PASSWORD` in
`backend/prisma/seedDemoOrganization.ts`). Public on purpose —
the seed is dev-only and the script aborts under
`NODE_ENV=production`. Rotate before any shared environment
goes external.

The seed also cross-maps `user_dev_admin` (the dev fallback
user) into the demo org as `OWNER`, so a freshly seeded DB
gives that account two ACTIVE memberships — exactly what the
tenant switcher needs to render. The dev admin still owns
`org_flaha_demo` (the original Phase 8B demo org) as well.

### Frontend

- `frontend/src/auth/AuthContext.ts` — adds
  `actions.switchOrganization(organizationId)`.
- `frontend/src/auth/AuthProvider.tsx` — calls
  `apiClient.switchOrganization`, feeds the returned session
  through the existing `applySession` reducer so every tenant-
  aware page re-renders in one tick.
- `frontend/src/services/apiV2Client.ts` — interface now
  exposes `switchOrganization` + `listMyOrganizations`.
- `frontend/src/services/realApiV2Client.ts` — wires both
  endpoints; switch uses the normal `postJson` path so
  transparent 401 refresh still works.
- `frontend/src/services/mockApiV2Client.ts` — adds a second
  in-memory org so the picker is exercisable offline; tracks
  the active org id at module scope so subsequent
  `refresh` / `authMe` calls reflect the chosen tenant.
- `frontend/src/layouts/components/TenantSwitcher.tsx` — new
  MUI menu mounted in `TopAppBar`. Hidden when the user has
  fewer than two memberships, so single-tenant chrome stays
  clean.

### Tests

- Backend (`backend/src/__tests__/auth.routes.test.ts`):
  - `GET /me/organizations` returns scoped memberships and 401
    when unauthenticated.
  - `POST /auth/switch-organization` rotates the access token,
    persists the new active org, writes an `ORG_SWITCHED` audit
    row, and returns 404 for non-member orgs, 401 for
    unauthenticated calls, 400 for malformed bodies.
- Frontend
  (`frontend/src/layouts/components/__tests__/TenantSwitcher.test.tsx`):
  - Renders nothing for unauthenticated sessions or when the
    user has fewer than two memberships.
  - Renders the active org label and every membership in the
    menu with humanised role labels.
  - Calls `actions.switchOrganization` for distinct orgs and
    short-circuits when the active org is reselected.

### Exit criteria

- Switching an org rotates the access token without touching
  the refresh-token family.
- Cross-tenant switches are rejected with 404; no audit row
  written.
- Seeded demo accounts cover OWNER / AGRONOMIST /
  LAB_TECHNICIAN / VIEWER and the dev admin holds two
  memberships so the switcher renders on a fresh `db:seed`.
- Documentation: this section + the **Phase 9A-H — Tenant
  switching** block in `docs/v2-user-ownership.md`.

### Deferred to later Phase 9 sub-phases (post 9A-H/K)

- Org settings page + read-only members list (Phase 9B
  groundwork).
- Invitations, member management write actions, email
  (Phase 9B).
- Auth-endpoint rate limiting, account lockout, captcha
  — **delivered in Phase 9A-I.**
- Production migration runbook + secret rotation playbook
  (Phase 9A-M, see close-out below).
- `docs/v2-auth.md` and `docs/v2-multi-tenant-architecture.md`
  detail papers — **delivered in Phase 9A-L.**

---

## Phase 9A-I — Security hardening ✅ COMPLETE

**Goal:** Lift the production-readiness baseline of the auth surface
from "correct" to "hardened": throttle credential abuse, formalise
the HTTP security headers, and ensure the audit trail captures every
rejection.

### Delivered

- **Auth rate limiter + lockout** —
  `backend/src/middleware/authRateLimit.ts` mounts two sliding
  windows per protected surface:
  - `/login`: 20 / 60 s per IP + 5 failures / 15-min window per
    email → 15-min lockout.
  - `/refresh`: 60 / 60 s per IP + 30 failures / 5-min window per
    cookie hash → 5-min lockout.
- **Audit actions** — `AUTH_LOCKOUT`,
  `AUTH_LOGIN_RATE_LIMITED`, `AUTH_REFRESH_RATE_LIMITED` added
  to `backend/src/auth/audit.ts` (all SECURITY severity).
- **Controller feedback loop** — `postLogin` / `postRefresh` call
  `req.authRateLimiter.recordSuccess(identity)` on the happy path
  and `recordFailure(identity, req)` on a 401, so the per-identity
  bucket stays accurate without race conditions.
- **Explicit Helmet config** — `default-src 'none'` CSP,
  `frame-ancestors 'none'`, `base-uri 'none'`,
  `form-action 'none'`, HSTS in production, `no-referrer`,
  `Cross-Origin-Resource-Policy: same-site`.
- **Route-local CSP for report preview** — the only HTML response
  the API serves; allows inline `<style>` and `data:` images
  while forbidding scripts and external resources.

### Tests

- `backend/src/middleware/__tests__/authRateLimit.test.ts` — 3 unit
  tests (IP cap, identity lockout, recordSuccess reset).
- `backend/src/__tests__/app.test.ts` — new "security headers"
  suite asserts CSP + nosniff + Referrer-Policy + X-Powered-By
  suppression.
- **Suite totals:** 172 backend tests pass + 1 skipped
  (+4 vs. Phase 9A-H baseline). 24 frontend tests still pass.

---

## Phase 9A-L — Architecture documentation ✅ COMPLETE

**Goal:** Capture the v2 auth + tenancy + security model in
dedicated reference papers so onboarding does not require reading
the source tree.

### Delivered

- [`docs/v2-auth.md`](./v2-auth.md) — token shapes, endpoint table,
  password policy, refresh-token rotation, rate-limit / lockout
  matrix, frontend flow, audit pointer, test inventory.
- [`docs/v2-multi-tenant-architecture.md`](./v2-multi-tenant-architecture.md)
  — tenancy model, identity vs. tenancy, role matrix, the
  tri-layer isolation guarantees, org switching, demo seed,
  Phase 9B roadmap.
- [`docs/v2-security-architecture.md`](./v2-security-architecture.md)
  — threat model & scope, transport headers, hardening summary,
  CORS, request limits, full audit-action enumeration,
  security-relevant test coverage, operational notes.
- This section + the close-out below in the migration plan.

---

## Phase 9A — Close-out & sign-off ✅ COMPLETE

**Goal:** Lock the Phase 9A baseline behind a single sign-off
document that maps each exit criterion to an automated test,
inventories the security controls, and assesses Phase 9B readiness.

### Delivered

- [`docs/v2-phase-9a-signoff.md`](./v2-phase-9a-signoff.md) — the
  Phase 9A sign-off report:
  - Sub-phase status table (9A-A through 9A-M).
  - Security controls inventory (18 controls).
  - Acceptance walk-through mapping all 15 exit criteria to the
    automated suites that lock them (Phase 9A-J).
  - Final test results: 172 backend pass + 1 skipped, 24
    frontend pass (196 / 197 total green; the 1 skip is the
    Postgres-only E2E suite).
  - Phase 9B readiness assessment with a recommended kickoff
    order.
  - Operational follow-ups (JWT rotation cadence, edge limiter,
    AuditLog partitioning) carried into the deploy runbook.

### Recommendation

Proceed to **Phase 9B — Organization administration**.

---

## Phase 9B — Organization administration ✅ COMPLETE

**Goal:** Self-service administration of organizations, memberships and
invitations on top of the Phase 9A tenancy primitives — without
altering the data model, the access-token shape, or the role ladder.

Full surface documented in
[`docs/v2-organization-administration.md`](./v2-organization-administration.md).

### Delivered

- **9B-A — Audit & guards.** Added `ORG_UPDATED`,
  `MEMBERSHIP_ROLE_CHANGED`, `MEMBERSHIP_REMOVED`, and the four
  `INVITATION_*` actions to `auth/audit.ts`. Two new path-aware guards
  (`requireOrganizationMember`, `requireOrganizationAdmin`) in
  `auth/guards.ts` resolve the caller's membership on the path-target
  org and attach the resolved role to `req.callerOrgRole` so the
  service layer never re-queries.
- **9B-B — Service + controllers.** New
  `services/organization.service.ts` (711 LOC) implements org read /
  update, member list / role-change / remove (soft-delete to
  `REMOVED`), and the invitation lifecycle (create → pending →
  accepted / revoked / expired). New
  `controllers/organizations.controller.ts` plus 9 routes wired into
  `routes/v2.routes.ts`.
- **9B-C — Validation.** `validation/schemas.ts` extended with
  `patchOrganizationSchema`, `patchMembershipSchema`,
  `createInvitationSchema` (rejects OWNER), and
  `acceptInvitationSchema`.
- **9B-D — Frontend UX.** Pages: `OrganizationSettingsPage`,
  `OrganizationMembersPage`, `OrganizationInvitationsPage`,
  `AcceptInvitationPage`. Components: `OrgAdminTabs`,
  `InviteMemberDialog`. Hook: `useActiveOrgAdmin`. Routes and
  sidebar entry registered; sidebar entry hidden for non-admins.
- **9B-E — Email provider.** New `email/emailProvider.ts` with an
  `EmailProvider` interface and `ConsoleEmailProvider` default that
  refuses to log the token-bearing accept URL in `NODE_ENV=production`
  and emits `email.console_provider_in_production` at ERROR instead.
- **9B-F — Backend tests.** 19 service-level unit tests + 2 email
  provider tests. Combined backend total: **197 (196 pass + 1
  Postgres-only skip)**.
- **9B-G(fe) — Frontend tests.** 10 new tests across
  `useActiveOrgAdmin`, `InviteMemberDialog`, and
  `OrganizationMembersPage`. Combined frontend total: **34**.
- **9B-H — Documentation.** This entry plus
  `docs/v2-organization-administration.md`; cross-links from
  `docs/v2-multi-tenant-architecture.md` §8–§9.

### Exit criteria

- No change to `prisma/v2-schema.prisma`.
- No change to the JWT claim shape or refresh-token rotation.
- The Phase 9A role ladder (VIEWER / LAB_TECH / AGRONOMIST / ADMIN /
  OWNER) is unchanged.
- Cross-tenant access still returns 404, not 403.
- `npm run typecheck`, `npm test`, and `npm run build` pass on both
  workspaces.

### Deferred to Phase 9C

- Ownership-transfer endpoint (two-step confirmation).
- Audit-log viewer UI scoped to the active org.
- Member SUSPEND status (third value beyond ACTIVE / REMOVED).
- Real transactional email adapter (Postmark / SES / SendGrid) wired
  via `setEmailProvider(...)`.

### Recommendation

Proceed to **Phase 9C** — start with the audit-log viewer (read-only,
zero schema risk) and the transactional email adapter (unblocks
real-world invite delivery), then ownership transfer.

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

## Phase 10A — Scientific engines & visual analytics ✅ COMPLETE

**Goal:** Surface the three published soil-science visualisations
(USDA texture triangle, Saxton-Rawls 2006 water-retention curve,
Bear/Albrecht cation triangle) as first-class v2 engines, API surface
and React components.

Outputs (see `docs/v2-scientific-analysis.md`):

- New engines in `@flaha/soil-physics` (`textureTriangle.ts`,
  `waterRetentionCurve.ts`) and `@flaha/soil-chemistry`
  (`structureTriangle.ts`).
- Composite service
  `backend/src/services/scientificAnalysis.service.ts` exposed via
  `GET /api/v2/soil-tests/:soilTestId/scientific-analysis`.
- Frontend components
  `frontend/src/features/results/components/{TextureTriangle,
WaterRetentionCurve, StructureTriangle}Chart.tsx` and the
  `ScientificAnalysisPanel.tsx` container, tabbed into
  `SoilTestDetailPage`.
- API clients (`realApiV2Client.ts`, `mockApiV2Client.ts`,
  `apiV2Client.ts` interface) updated with `getScientificAnalysis`.
- Shared contracts in
  `packages/shared-types/src/scientific-analysis.ts`.
- 73 new engine tests; all 369 tests across the 5 workspaces pass.

Exit criteria: every engine has a published reference, every formula
is documented in `docs/v2-scientific-analysis.md`, the API endpoint
is registered and tenancy-gated, and the visual components render
without errors against both the mock client and the live backend.

### Deferred to Phase 10C

- Embedding the three charts into the PDF/Word reports.
- SVG-snapshot Testing-Library tests for the three charts.
- Per-organisation override of `STRUCTURE_THRESHOLDS`.
- CSV / FlahaCalc export of the sampled retention curve.

---

## Phase 10B — Full-matrix audit ✅ COMPLETE

**Goal:** Map every legacy soil-science symbol in
`public/assets/js/main.js` and `public/assets/data/data.json` (and the
legacy `/api/v1/*` controllers it called) onto its v2 engine
equivalent, recording divergences explicitly.

Outputs:

- §5 of `docs/v2-scientific-analysis.md` ("Full-matrix audit") lists
  every legacy symbol → v2 symbol mapping with file references.
- §5.1 records the corrected polygon vertex (legacy `data.json`
  "sandy loam" had a vertex summing to 105 %).
- §1.1–1.3 of the same document list every engine, function and
  constant introduced in Phase 10A.
- §2 records the scientific assumptions baked into the engines.

Exit criteria: no legacy formula is implicit; every Phase-10A symbol
has a documented reference back to the legacy implementation or an
explicit "new in v2" call-out.

---

## Phase 11 — Retire legacy HTML

> Renumbered from "Phase 10" in Phase 10A to free the `10` slot for
> the scientific-engines phase. Scope is unchanged from the original
> Phase-10 plan.

**Goal:** Remove `public/` and `api-implementation/` from runtime.

Tasks:

- Cut over DNS / reverse proxy to `frontend/` and `backend/`.
- Migrate production data from SQLite to PostgreSQL.
- Archive the legacy folders (git tag) and delete from main.
- Final regression run against the Phase 0 baseline.

Exit criteria: no traffic served from legacy code; baseline still green;
documentation updated.
