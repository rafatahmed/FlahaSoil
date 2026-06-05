<!-- @format -->

# FlahaSOIL v2 — App Shell, Navigation, and Branding

> Phase 8C-A reference. Describes the platform shell that wraps every
> v2 route, the brand tokens it applies, the navigation hierarchy it
> exposes, and the page-header contract that pages use to feed the
> shell their context.

---

## 1. Brand and theme

The shell is built on `frontend/src/theme/flahaSoilTheme.ts`. The
palette is anchored to soil-science semantics rather than generic UI
colours:

| Token              | Hex       | Used for                                       |
| ------------------ | --------- | ---------------------------------------------- |
| `deepSoilBrown`    | `#4B2E1A` | Primary brand, top app bar, sidebar accents    |
| `clayEarth`        | `#8B5E3C` | Secondary brand, hero gradient                 |
| `sandBeige`        | `#D9C7A7` | Subtle surfaces, sand-tier KPI accents         |
| `organicGreen`     | `#2E7D32` | Action / success, "green" KPI accents, avatars |
| `analyticalCream`  | `#F5F0E6` | Card backgrounds for high-content panels       |
| `mineralWarning`   | `#C97B33` | Warning accent for at-risk KPIs and alerts     |
| `criticalSalinity` | `#B71C1C` | High-salinity / critical interpretation chips  |
| `neutralBg`        | `#FAF8F4` | Application background                         |

Typography uses MUI defaults; heading weights are tightened (600) and
captions are softened for the dense dashboards.

---

## 2. Shell anatomy

`frontend/src/layouts/AppLayout.tsx` mounts three regions inside an
MUI `Box` shell. On `md+` viewports the sidebar is persistent
(`Drawer variant="permanent"`); below `md` the sidebar collapses into
a swipeable drawer toggled from the top app bar.

```
┌──────────────────────────────────────────────────────────────┐
│ TopAppBar (logo · page title · project ctx · search · user) │
├──────────────────┬───────────────────────────────────────────┤
│                  │ PageContextBar (breadcrumbs · subtitle)   │
│                  ├───────────────────────────────────────────┤
│  SidebarNav      │                                           │
│  (sections)      │  Page content (Outlet)                    │
│                  │                                           │
└──────────────────┴───────────────────────────────────────────┘
```

Sub-components live in `frontend/src/layouts/components/`:

- `TopAppBar.tsx` — brand logo (`FlahaLogo`), page title + project
  context (from `PageHeaderContext`), disabled search placeholder,
  "New soil test" quick action, and the session user chip.
- `SidebarNav.tsx` — four sections (Primary / Analysis / Integration
  / Account) with NavLink-driven active states; planned items render
  a "Planned" chip and dimmed text so the surface stays honest.
- `PageContextBar.tsx` — breadcrumb trail + one-line subtitle.
  Renders nothing when neither is set (e.g. landing page).
- `FlahaLogo.tsx` — brand mark / full lockup with size + variant
  props for responsive headers.

---

## 3. Route hierarchy

Defined in `frontend/src/routes/AppRoutes.tsx`:

| Path                             | Page                  | Notes                                  |
| -------------------------------- | --------------------- | -------------------------------------- |
| `/`                              | `LandingPage`         | Marketing entry; no API calls          |
| `/dashboard`                     | `DashboardPage`       | Operational workspace                  |
| `/projects`                      | `ProjectsListPage`    | "My projects"                          |
| `/projects/:projectId`           | `ProjectDetailPage`   | Samples + project actions              |
| `/soil-tests/new`                | `SoilTestWizardPage`  | Accepts `?projectId=` preselection     |
| `/soil-tests/:soilTestId`        | `SoilTestDetailPage`  | Physics / chemistry / interpretation   |
| `/soil-tests/:soilTestId/report` | `SoilTestReportPage`  | Read-only report                       |
| `/reports`                       | `ReportsPage`         | Project-grouped report index           |
| `/flahacalc-export`              | `FlahaCalcExportPage` | Preview + raw JSON                     |
| `/profile`                       | `ProfilePage`         | Identity + platform activity + session |
| `/settings`                      | `SettingsPage`        | Stub (Planned categories)              |
| `/standards`                     | `StandardsPage`       | Stub (reference index)                 |

The landing page is intentionally separate from `/dashboard`: `/` is
the unauthenticated face of the platform and must render even when
the backend is unreachable.

---

## 4. Page-header contract

`frontend/src/layouts/PageHeaderContext.tsx` exposes:

```ts
usePageHeader({
  title: string,
  subtitle?: string,
  breadcrumbs?: { label: string; to?: string }[],
  projectContext?: { id: string; name: string; code?: string },
});
```

Each page calls `usePageHeader(...)` once its data is available. The
shell subscribes via `usePageHeaderState()` and re-renders the top
bar + breadcrumb strip. Cleanup resets the header to the default
(`FlahaSOIL`) when the page unmounts, so navigating away never leaks
stale context.

Pages may declare a `projectContext` whenever they operate inside a
specific project (project detail, soil-test detail when the parent
project is known); the top bar then renders a small "Project · Name
(Code)" line under the title.

---

## 5. Responsive behaviour

- **`md+` (≥ 900 px):** persistent sidebar (240 px) + top bar. The
  top bar sits above the sidebar (`zIndex = drawer + 1`) so the
  brand and quick actions stay anchored across navigation.
- **`sm` (600–899 px):** sidebar collapses into a drawer toggled by
  the menu button; the FlahaSOIL logo lockup appears in the top bar.
- **`xs` (< 600 px):** as above, plus the search field is hidden,
  the "New soil test" button collapses to an icon, and the logo
  reduces to the mark variant.

---

## 6. Local dev (v2)

The v2 stack has a dedicated launcher at `scripts/dev-v2.ps1`. It is
deliberately separate from the legacy `scripts/launch-flaha.ps1`
(which targets `public/` + `api-implementation/` on ports 3000/3001)
and never touches that surface.

| Command                             | Effect                                                                                                          |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `pwsh ./scripts/dev-v2.ps1 start`   | Verify `backend/.env` + Postgres, run `prisma generate` for the v2 schema, start backend + frontend (detached). |
| `pwsh ./scripts/dev-v2.ps1 stop`    | Terminate the tracked backend + frontend processes and free their ports.                                        |
| `pwsh ./scripts/dev-v2.ps1 restart` | `stop`, brief settle, `start`.                                                                                  |
| `pwsh ./scripts/dev-v2.ps1 status`  | Listening state + tracked PID for Postgres / backend / frontend.                                                |

Prerequisites:

- PostgreSQL must already be running on `localhost:5432`. The script
  probes the port and refuses to start the stack if it is down; it
  never starts Postgres itself.
- `backend/.env` must exist (copy from `backend/.env.example`) and
  must set `DATABASE_URL_V2`.

URLs:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3002/api/v2` (health probe at
  `http://localhost:3002/health`)

Logs and tracked PIDs land under `logs/`:

- `logs/dev-v2-backend.log`, `logs/dev-v2-frontend.log` — full child
  process output.
- `logs/dev-v2-prisma.log` — last `prisma generate` run.
- `logs/dev-v2-backend.pid`, `logs/dev-v2-frontend.pid` — used by
  `stop` / `restart` to find the right processes across invocations.

Flags: `-NoGenerate` skips `prisma generate`; `-SkipDbCheck` skips
the Postgres reachability probe (only useful for no-DB sanity runs).

---

## 7. Deferred

- Real `/settings` — currently four planned categories with
  outlined "Planned" chips; no settings are persistable yet.
- Real `/standards` — descriptive index of Saxton & Rawls, USDA
  texture triangle, FAO salinity classes, and CEC conventions;
  deep-link pages will land in a later phase.
- Frontend Vitest setup (carried over from Phase 8C).
- Authentication beyond the dev-session header.
- Print / PDF stylesheet for `/soil-tests/:id/report`.

See `docs/v2-migration-plan.md` for the full phase trail.
