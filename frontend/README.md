<!-- @format -->

# `@flaha/web`

FlahaSOIL v2 frontend skeleton — **Phase 5**.

## Stack

- React 18 + TypeScript
- Material UI 5 (`@mui/material`, `@mui/icons-material`, Emotion)
- React Router 6
- Vite 5
- `@flaha/shared-types` for all wire-format types

## Folder structure

```
src/
├── main.tsx                  # React entry, StrictMode + createRoot
├── App.tsx                   # ThemeProvider + CssBaseline + BrowserRouter
├── routes/
│   └── AppRoutes.tsx         # Route table (/api/v2-backed pages)
├── layouts/
│   └── AppLayout.tsx         # AppBar + permanent Drawer + <Outlet />
├── pages/
│   ├── DashboardPage.tsx
│   ├── SoilTestWizardPage.tsx
│   ├── SoilTestDetailPage.tsx
│   ├── ReportsPage.tsx
│   └── FlahaCalcExportPage.tsx
├── features/
│   ├── soil-test/
│   │   ├── components/       # Stepper + 6 step components
│   │   ├── state/            # SoilTestDraft + toCreateSoilTestRequest
│   │   └── utils/            # Step metadata + field metadata
│   └── results/
│       └── components/       # Physics / Chemistry / Interpretation cards + WarningList
├── services/
│   ├── apiV2Client.ts        # ApiV2Client interface + not-implemented stub
│   └── mockApiV2Client.ts    # Typed mock implementation used by all pages
└── theme/
    └── theme.ts              # MUI theme (Flaha green primary)
```

## Contract-driven design

Every request and response shape is imported from `@flaha/shared-types`
(see `docs/v2-api-contracts.md`). Pages depend on the `ApiV2Client`
interface, never on a concrete implementation; the mock client and the
future real client are interchangeable. The wizard's draft state is
shaped so `toCreateSoilTestRequest(draft, sampleId)` produces a valid
`CreateSoilTestRequest` with no transformation step.

## Mock API strategy

`services/mockApiV2Client.ts` returns deterministic fixtures typed
against the shared-types DTOs. All pages and the wizard import this
mock; the real client (`apiV2Client.realApiV2Client`) currently throws
on every call. Switching to the real client in Phase 6 is a single-line
import change at the call sites (or via a context provider).

## Scripts

| Script                                     | What it does                     |
| ------------------------------------------ | -------------------------------- |
| `npm run dev --workspace @flaha/web`       | Vite dev server on port 5173     |
| `npm run build --workspace @flaha/web`     | `tsc --noEmit` then `vite build` |
| `npm run preview --workspace @flaha/web`   | Preview the production build     |
| `npm run typecheck --workspace @flaha/web` | Type-only check                  |

## What Phase 5 intentionally does NOT implement

1. **Real API calls.** `apiV2Client.realApiV2Client` rejects every call
   with `not implemented`. Pages use `mockApiV2Client` exclusively.
2. **Runtime validation.** No Zod / Yup. The wizard accepts any input;
   validation rules are documented in `docs/v2-api-contracts.md §4`
   and will be enforced in Phase 6.
3. **Authentication.** Identity is resolved through the Phase 8B
   dev-session layer (`frontend/src/session/`): `SessionProvider`
   calls `GET /api/v2/me` once, persists the dev user id in
   `localStorage`, and `realApiV2Client` injects it as the
   `x-dev-user-id` header on every request. There is no login screen,
   no password handling, and no JWT/OAuth — see
   `docs/v2-user-ownership.md` for the boundary and the migration
   path to a real auth layer.
4. **State management.** Wizard state lives in component-local
   `useState`. No Redux / Zustand / Context store.
5. **Branding polish.** Theme uses a single primary green; no custom
   typography, no dark mode, no component overrides.
6. **Scientific calculations.** No physics / chemistry / interpretation
   logic runs in React. Result cards display values as supplied.
7. **Persistence.** Drafts are not saved to localStorage or any store.
8. **Pagination, search, filters.** Lists render the mock fixture
   verbatim.
