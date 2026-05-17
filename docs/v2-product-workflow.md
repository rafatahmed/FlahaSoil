# FlahaSOIL v2 — Product Workflow

**Status:** Phase 8A — accepted product flow.
**Scope:** the official navigation, data hierarchy, and page-by-page
contract for the v2 application. Supersedes the developer-centric flow
inherited from Phase 5.

This document is binding for the v2 web app (`frontend/`) and the v2
API (`backend/`). It does not modify the scientific engines
(`packages/soil-*`) or the legacy stack (`api-implementation/`).

---

## 1. Product hierarchy

The v2 application is **project-centric**. Every soil sample belongs to
a project; every soil test belongs to a sample; every result and report
belongs to a test.

```
User
 └── Project                        (agronomic context: farm, trial, field block)
      └── SoilSample                (physical sample at a location + depth)
           └── SoilTest             (one lab/manual event for that sample)
                ├── SoilTextureInput
                ├── SoilChemistryInput
                ├── SoilLabValue[]  (raw lab readings)
                ├── SoilPhysicsResult        ← engine output
                ├── SoilChemistryResult      ← engine output
                ├── SoilInterpretation       ← engine output
                └── SoilReport[]             ← generated artefact(s)
                       └── FlahaCalc export   (read-only projection)
```

A sample without a project is not a valid v2 record. Older rows
created in Phase 5/6/7 with `projectId = null` remain readable but the
UI surfaces them under a synthetic "Unassigned" project.

---

## 2. Navigation map

| Path                                  | Page                  | Purpose                                                |
| ------------------------------------- | --------------------- | ------------------------------------------------------ |
| `/`                                   | Dashboard             | Live summary: counts, recent activity, quick actions   |
| `/projects`                           | Projects list         | Browse, search, create projects                        |
| `/projects/:projectId`                | Project Detail        | Project metadata + samples + tests + reports for this project |
| `/projects/:projectId/samples/new`    | New Sample (in-context) | Create a sample bound to this project                |
| `/soil-tests/new?projectId=…&sampleId=…` | Soil Test Wizard   | Multi-step input → calculate → results                 |
| `/soil-tests/:soilTestId`             | Soil Test Detail      | Inputs, results (physics / chemistry / interpretation), warnings |
| `/soil-tests/:soilTestId/report`      | Soil Test Report      | Full read-only report (envelope + audit trace)         |
| `/reports`                            | Reports               | Cross-project report index                             |
| `/flahacalc-export`                   | FlahaCalc Export      | Stable cross-app projection                            |

Top-level nav order: **Dashboard · Projects · Reports · Export.**
"New Soil Test" is no longer a top-level item — sample/test creation
starts from a project to keep agronomic context intact.

---

## 3. Data flow per user action

1. **Create project** → `POST /api/v2/projects` → returns `ProjectDTO`.
2. **Open project** → `GET /api/v2/projects/:id` → returns
   `{ project, samples }`.
3. **New sample in project** → `POST /api/v2/soil-samples` with
   `projectId` set → returns `SoilSampleDTO`.
4. **New test on sample** → `POST /api/v2/soil-tests` with `sampleId`
   set → returns `SoilTestDTO` (+ inputs).
5. **Calculate** → `POST /api/v2/soil-tests/:id/calculate` →
   `{ physicsResult?, chemistryResult?, interpretation?, warnings,
   warningDetails }`.
6. **View report** → `GET /api/v2/soil-tests/:id/report` →
   `SoilReportEnvelope` (full) or `?format=summary` for the compact
   variant.
7. **Export to FlahaCalc** → `GET /api/v2/soil-tests/:id/flahacalc-export`
   → `FlahaCalcExportResponse`.

The wizard chains 3 → 4 → 5 in a single submit. When launched from a
project (with `?projectId=…` in the URL), step 3 forwards the project
id so the resulting sample is bound on the server side.

---

## 4. UX contract

- **Production copy.** No "mock", "preview", or "Phase N" language on
  pages that render real data. The mock-mode banner is shown **only**
  when `VITE_USE_MOCK_API="true"`.
- **Empty states.** Every list page (Projects, Samples within a
  project, Reports) must render an explicit empty state with a primary
  call-to-action, not a blank panel.
- **Section hierarchy.** Pages follow `h4` (page title) → `h6`
  (section header) → body. Cards use `variant="outlined"`. Tables and
  data lists use `Paper variant="outlined"`.
- **Loading + error states.** Every fetching page exposes one of:
  loading skeleton, error `Alert`, or rendered content. No silent
  failure states.
- **Breadcrumbs.** Pages two levels deep (Project Detail, Soil Test
  Detail, Report) render a back affordance to the parent context.

---

## 5. Authorisation scope (Phase 8A)

User-scoping in v2 is still **userId-by-string** (no auth integration
yet). Every project and sample is filtered by `userId` at the API
layer; cross-user access returns `404`. A future phase adds real auth
and converts these gates into session-driven checks.

---

## 6. Out of scope for Phase 8A

The following are explicitly deferred to later phases and must not be
implemented as part of 8A:

- Project sharing / multi-user collaboration.
- Project archive / soft-delete with cascade rules beyond the
  `status="ARCHIVED"` flag.
- Server-side pagination on the Projects list (client-side filtering
  is sufficient at the expected v2 record volume).
- PDF rendering — `POST /api/v2/soil-tests/:id/reports` still
  persists a `DRAFT` row only; the file pipeline arrives later.
- Cross-app handoff to FlahaCalc — the export endpoint is the contract,
  not a transport.

---

## 7. Cross-references

- `docs/v2-architecture.md` — system architecture and layering.
- `docs/v2-api-contracts.md` — request/response shapes for `/api/v2`.
- `docs/v2-database-design.md` — Prisma schema rationale.
- `docs/v2-reporting.md` — report envelope, audit trace, warning codes.
- `docs/v2-runtime-verification.md` — Phase 7A real-runtime evidence.
