# FlahaSOIL v2 — User & Project Ownership (Phase 8B)

Phase 8B replaces the temporary `user_mock` literal that Phase 8A used
as a placeholder owner with a proper, end-to-end ownership layer. It
is **not** production authentication — there are no passwords, JWTs,
OAuth providers, or password reset flows. It establishes the
boundaries and types so that a real auth layer can be slotted in
later without rewriting controllers or services.

## Ownership hierarchy

```
User
 └── Project          (Project.userId → User.id, required)
      └── SoilSample  (SoilSample.projectId → Project.id, required)
           └── SoilTest
                └── SoilPhysicsResult
                    SoilChemistryResult
                    SoilInterpretation
                    SoilReport
                    FlahaCalcExport (read-only projection)
```

Every record that belongs to a user is reached **through the Project**.
Samples, tests, results, and reports never store a `userId`
independently; they inherit ownership from their parent Project. This
keeps the join graph small and the access checks consistent: every
ownership assertion ultimately resolves to `project.userId === currentUser.id`.

## Session flow

```
Browser                      Backend
─────────                    ────────────────
SessionProvider              devSessionMiddleware
 │                            │
 │ GET /api/v2/me ───────────►│ read x-dev-user-id header
 │                            │   ↳ fallback: ensure seeded user_dev_admin
 │                            │   ↳ attach req.currentUser
 │ ◄───────── { session } ────┤
 │
 │ persist user.id → localStorage (flahasoil.v2.devUserId)
 │
 │ every subsequent request adds header
 │   x-dev-user-id: <persisted id>
```

- `SessionProvider` (`frontend/src/session/SessionProvider.tsx`) loads
  `/api/v2/me` once on mount and exposes `{ status, user, role, error,
  reload }` to the rest of the React tree via `useSession()`.
- The persisted id is read by `realApiV2Client` and sent as
  `x-dev-user-id` on every request. This is **not** a security token —
  it is a development convenience that the backend trusts only while
  Phase 8B is the current auth layer.
- The mock client implements `getMe()` against an in-memory fixture so
  the UI behaves identically when `VITE_USE_MOCK_API=true`.

## Backend resolver

`backend/src/auth/devSession.middleware.ts` runs on every `/api/v2`
request and sets `req.currentUser` to the resolved `User` row.
Resolution order:

1. The `x-dev-user-id` header. The user is looked up by `id`. If not
   found, the seeded dev user is used instead (logged once per process).
2. No header → the seeded `user_dev_admin` (development) is upserted on
   first boot via `backend/src/bootstrap.ts` and returned.

Ownership checks live in `backend/src/auth/ownership.ts`:

- `assertProjectOwnership(prisma, projectId, currentUser)` — used by
  every project read and by sample creation.
- `assertSampleOwnership(prisma, sampleId, currentUser)` — walks up
  through `SoilSample.project`.
- `assertSoilTestOwnership(prisma, soilTestId, currentUser)` — walks up
  through `SoilTest.sample.project`.

All three return the parent record on success and throw a
`404 Not Found` (NOT `403 Forbidden`) on cross-user access so the API
never leaks whether a record exists in another user's account.

## API contract changes (Phase 8B)

| Endpoint                         | Before                          | After                             |
| -------------------------------- | ------------------------------- | --------------------------------- |
| `POST /api/v2/projects`          | body `{ userId, name, ... }`    | body `{ name, ... }` only         |
| `GET  /api/v2/projects`          | `?userId=...`                   | no query (ownership = session)    |
| `GET  /api/v2/projects/:id`      | `?userId=...`                   | path only                         |
| `POST /api/v2/soil-samples`      | body `{ userId, projectId, ... }` | body `{ projectId, ... }` only  |
| `GET  /api/v2/me`                | (did not exist)                 | returns `{ session: { mode, user } }` |

The matching shared-types DTOs were updated:
`CreateProjectRequest`, `ListProjectsQuery`, `CreateSoilSampleRequest`
no longer include `userId`.

## What is intentionally NOT done yet

- **No login screen** — there is only ever one current dev user.
- **No password storage** — the `User` model has no `passwordHash`,
  `salt`, `lastLoginAt`, or auth-token columns.
- **No OAuth / JWT / refresh tokens** — the dev-session header is
  intentionally trivial. Replacing it with real auth is the work of
  Phase 8C and later.
- **No role-based UI gating** — the role chip is displayed but the
  router does not enforce it. Role-based access is Phase 8D.
- **No multi-tenant org concept** — Phase 8E.
- **No audit log of who modified what** — Phase 9.

## Migration strategy (when real auth lands)

The boundaries are designed so the swap is local:

1. Replace `devSessionMiddleware` with a JWT/OIDC verifier that still
   populates `req.currentUser`. Controllers and services do not need
   to change.
2. Replace `realApiV2Client.buildHeaders()` to attach an
   `Authorization: Bearer <token>` header instead of `x-dev-user-id`.
   `SessionProvider` continues to call `GET /api/v2/me`.
3. The seeded `user_dev_admin` becomes a database fixture for tests
   only; production seeds are removed.

If those three substitutions are the only changes, the ownership
layer was correctly factored in Phase 8B.

## Reference files

- Backend: `backend/src/auth/{devSession.middleware,currentUser,ownership}.ts`,
  `backend/src/bootstrap.ts`, `backend/src/controllers/me.controller.ts`,
  `backend/prisma/seed.ts`.
- Frontend: `frontend/src/session/{SessionContext,SessionProvider,useSession,devSessionStorage,SessionUserChip}.tsx`,
  `frontend/src/services/{realApiV2Client,mockApiV2Client,apiV2Client}.ts`.
- Shared types: `packages/shared-types/src/users.ts`.
- Schema: `prisma/v2-schema.prisma` (`User` model, `UserRole` enum,
  `Project.userId → User.id` relation).
