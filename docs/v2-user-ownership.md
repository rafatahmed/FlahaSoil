<!-- @format -->

# FlahaSOIL v2 — User & Project Ownership (Phase 8B / Phase 9A)

> **Status — Phase 9A:** The Phase 8B dev-session model described in
> this document has been **superseded** by production JWT
> authentication + organization-scoped tenancy. The Phase 8B content
> below is preserved for historical context; current behaviour is
> documented in the [Phase 9A — Tenancy & JWT session](#phase-9a--tenancy--jwt-session)
> section at the end of this file and in `docs/v2-migration-plan.md`.

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

| Endpoint                    | Before                            | After                                 |
| --------------------------- | --------------------------------- | ------------------------------------- |
| `POST /api/v2/projects`     | body `{ userId, name, ... }`      | body `{ name, ... }` only             |
| `GET  /api/v2/projects`     | `?userId=...`                     | no query (ownership = session)        |
| `GET  /api/v2/projects/:id` | `?userId=...`                     | path only                             |
| `POST /api/v2/soil-samples` | body `{ userId, projectId, ... }` | body `{ projectId, ... }` only        |
| `GET  /api/v2/me`           | (did not exist)                   | returns `{ session: { mode, user } }` |

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

---

## Phase 9A — Tenancy & JWT session

Phase 9A landed the production auth and multi-tenant layer that Phase
8B explicitly deferred. The shape and intent of the Phase 8B ownership
helpers carried over almost verbatim; what changed is the tenancy key
and the way the session is obtained.

### What changed since Phase 8B

| Concern               | Phase 8B (dev-session)                             | Phase 9A (production)                                                                                          |
| --------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Identity              | `x-dev-user-id` header, trusted as-is              | Bearer JWT (`{ sub, oid, iat, exp }`) signed HS256 by `JWT_SECRET`                                             |
| Session lifecycle     | header set forever in `localStorage`               | 15-min access token + 30-day rotating refresh token (HttpOnly cookie scoped to `Path=/api/v2/auth`)            |
| Password storage      | none                                               | argon2id (64 MiB / 3 iterations, OWASP 2024)                                                                   |
| Tenancy key           | `Project.userId === currentUser.id`                | `<resource>.organizationId === authSession.organizationId`                                                     |
| Roles                 | single `UserRole` on the user (ADMIN/AGRONOMIST/…) | per-org `OrganizationMembership.role` (OWNER/ADMIN/AGRONOMIST/LAB_TECHNICIAN/CONSULTANT/VIEWER)                |
| Resources with tenant | only `Project`                                     | `Project`, `SoilSample`, `SoilTest`, `SoilReport` all carry `organizationId` (denormalised for fast filtering) |
| Cross-tenant access   | 404 on cross-user (Phase 8B helpers)               | 404 on cross-tenant (Phase 9A helpers — same posture, different key)                                           |
| Dev backdoor          | always on                                          | opt-in via `ALLOW_DEV_AUTH=true`; **forbidden** under `NODE_ENV=production` (boot fails fast)                  |

### Tenancy hierarchy (current)

```
Organization
 ├── OrganizationMembership (User × Organization × OrganizationRole)
 │
 └── Project          (Project.organizationId  → Organization.id, required)
      └── SoilSample  (SoilSample.organizationId → Organization.id, required;
                       still parented to a Project for navigation)
           └── SoilTest          (SoilTest.organizationId  → Organization.id, required)
                └── SoilPhysicsResult
                    SoilChemistryResult
                    SoilInterpretation
                    SoilReport    (SoilReport.organizationId → Organization.id, required)
                    FlahaCalcExport (read-only projection)
```

`Project.userId` is retained as the **author** of the row (audit and
display only); tenancy is decided exclusively by `organizationId`.

### Session flow (current)

```
Browser                         Backend
─────────                       ─────────────────────────────────────
POST /api/v2/auth/register      → 201 { session, accessToken }
   or /auth/login               + Set-Cookie: fsoil_rt=<refresh>; HttpOnly; Secure;
                                  Path=/api/v2/auth; SameSite=Lax

Authorization: Bearer <token>   → resolveAuthSession
                                    1. verifyAccessToken(jwt)
                                    2. load User + active OrganizationMembership
                                    3. attach req.authSession = {
                                         mode: "jwt",
                                         userId, organizationId, role, membershipId,
                                         user, organization, membership,
                                       }

(access expired)                → 401 UNAUTHORIZED
POST /api/v2/auth/refresh       → rotate refresh token (revoke previous, mint new family entry)
                                  → 200 { accessToken } + new Set-Cookie

POST /api/v2/auth/logout        → revoke refresh family + clear cookie
GET  /api/v2/auth/me            → 200 { session }   (JWT-protected)
```

If `ALLOW_DEV_AUTH=true` (dev/test only) and no bearer is present,
`resolveAuthSession` falls back to the Phase 8B `x-dev-user-id`
resolver and synthesises an `authSession` with `mode: "dev"` so the
older E2E flows keep working.

### Tenancy assertion helpers (current)

`backend/src/auth/ownership.ts` exposes the new tenancy helpers
alongside the legacy ownership helpers:

- `assertProjectTenancy(prisma, projectId, organizationId)`
- `assertSampleTenancy(prisma, sampleId, organizationId)`
- `assertSoilTestTenancy(prisma, soilTestId, organizationId)`
- `assertReportTenancy(prisma, reportId, organizationId)`

All four return the loaded record on success and throw a `404 Not
Found` on a cross-tenant match — never `403 Forbidden`, so the API
never leaks the existence of another tenant's row.

### Role gates

Role enforcement lives in `backend/src/auth/guards.ts`:

- `requireOrgRole(...roles)` — standalone gate (e.g. for
  org-management routes).
- `makeResourceGuard({ load, allow })` — resource-aware gate.
  `requireProjectAccess`, `requireSampleAccess`,
  `requireSoilTestAccess`, and `requireReportAccess` are built on
  top of it and combine the tenancy assertion with the role check
  from the matrix below.

| Role             | Read | Create / edit projects | Create samples + tests | Generate / regen reports | Manage org / members |
| ---------------- | :--: | :--------------------: | :--------------------: | :----------------------: | :------------------: |
| `OWNER`          |  ✅  |           ✅           |           ✅           |            ✅            |          ✅          |
| `ADMIN`          |  ✅  |           ✅           |           ✅           |            ✅            |          ✅          |
| `AGRONOMIST`     |  ✅  |           ✅           |           ✅           |            ✅            |          ❌          |
| `LAB_TECHNICIAN` |  ✅  |           ❌           |           ✅           |            ❌            |          ❌          |
| `CONSULTANT`     |  ✅  |           ❌           |           ❌           |            ✅            |          ❌          |
| `VIEWER`         |  ✅  |           ❌           |           ❌           |            ❌            |          ❌          |

The matrix is locked in by
`backend/src/__tests__/roleMatrix.test.ts` (24 cases); cross-tenant
isolation is locked in by
`backend/src/__tests__/tenantIsolation.test.ts` (9 cases against an
in-memory multi-tenant Prisma stub).

### Frontend auth UX (Phase 9A-G) ✅

The frontend now consumes the JWT backend directly. Access tokens
live in memory only (`frontend/src/auth/accessTokenStore.ts`); the
HttpOnly refresh cookie is the only persisted credential. The auth
state machine in `frontend/src/auth/AuthProvider.tsx` performs a
silent refresh on mount so reloads recover the session, and routes
are gated by `ProtectedRoute` / `PublicOnlyRoute`. The Phase 8B
`flahasoil.v2.devUserId` localStorage key and the `x-dev-user-id`
request header are gone from the web client. See the Phase 9A-G
section of `docs/v2-migration-plan.md` for the file inventory.

### Phase 9A-H — Tenant switching ✅

The SPA now ships a top-bar tenant switcher
(`frontend/src/layouts/components/TenantSwitcher.tsx`) for
users with two or more ACTIVE memberships. Picking a different
org dispatches `actions.switchOrganization(organizationId)` on
the auth context, which calls
`POST /api/v2/auth/switch-organization`. The endpoint:

1. Verifies the caller has an ACTIVE membership in the target
   org (404 otherwise — existence is not leaked).
2. Persists the new `User.activeOrganizationId`.
3. Mints a fresh access token carrying the new `oid` claim.
4. Writes an `ORG_SWITCHED` audit row.
5. Returns a full `AuthSessionDTO` so the SPA can drop it
   straight into the same `applySession` reducer used by
   login / refresh — every tenant-aware page re-renders in one
   tick. The refresh-token family is intentionally preserved
   so a switch costs zero refresh-cookie round-trips.

A companion read-only endpoint
`GET /api/v2/me/organizations` lets long-running tabs poll
their full membership list — `useAuth` already carries the
memberships hydrated on bootstrap, so the switcher consumes
them directly without a per-render fetch.

### Phase 9A-K — Demo seed (Flaha Demo Organization)

`backend/prisma/seedDemoOrganization.ts` provisions a second
organization (`Flaha Demo Organization`, slug `flaha-demo-org`)
and four role-distinct demo users in one transaction; all
writes are idempotent. The dev admin is cross-mapped into the
demo org as OWNER so a fresh `npm run db:seed --workspace
backend` yields the multi-membership shape the switcher needs.
See the **Phase 9A-H + 9A-K** section of
`docs/v2-migration-plan.md` for the demo account table.

### What is still NOT done (deferred from Phase 9A)

- Organization settings page + read-only members list
  (Phase 9B groundwork).
- Invitations, member management write actions, email
  (Phase 9B).
- Auth-endpoint rate limiting, account lockout, captcha
  (Phase 9A-I).
- Production migration runbook + secret rotation playbook
  (Phase 9A-M).
- `docs/v2-auth.md` and `docs/v2-multi-tenant-architecture.md`
  detail papers (Phase 9A-L).

### Reference files (Phase 9A)

- Backend:
  `backend/src/auth/{password,jwt,refreshTokens,audit,session.middleware,guards,ownership,requireAccessToken.middleware,currentUser}.ts`,
  `backend/src/services/auth.service.ts`,
  `backend/src/controllers/auth.controller.ts`,
  `backend/src/routes/auth.routes.ts`,
  `backend/src/routes/v2.routes.ts`.
  (`auth/devSession.middleware.ts` was deleted in 9A-E; the dev
  fallback is now an internal branch of `resolveAuthSession`.)
- Frontend:
  `frontend/src/auth/{accessTokenStore,refreshCoordinator,AuthContext,AuthProvider,useAuth,ProtectedRoute,PublicOnlyRoute,passwordPolicy,index}.ts(x)`,
  pages `Login|Register|Logout|Account`, refactored
  `frontend/src/services/{apiV2Client,realApiV2Client,mockApiV2Client}.ts`,
  `frontend/src/layouts/components/{TopAppBar,TenantSwitcher}.tsx`,
  `frontend/src/layouts/components/SidebarNav.tsx`. The
  `frontend/src/session/` module was deleted in 9A-G.
- Seed (Phase 9A-K):
  `backend/prisma/seed.ts`, `backend/prisma/seedDemoOrganization.ts`.
- Tests:
  `backend/src/auth/__tests__/{password,jwt,refreshTokens,ownership}.test.ts`,
  `backend/src/services/__tests__/auth.service.test.ts`,
  `backend/src/__tests__/{auth.routes,tenantIsolation,roleMatrix}.test.ts`,
  `backend/src/__tests__/_helpers/multiTenantStub.ts`,
  `frontend/src/auth/__tests__/{passwordPolicy,accessTokenStore,refreshCoordinator,AuthProvider}.test.ts(x)`,
  `frontend/src/layouts/components/__tests__/TenantSwitcher.test.tsx`.
- Shared types:
  `packages/shared-types/src/{users,auth,organizations}.ts`.
- Schema: `prisma/v2-schema.prisma` (`User`, `Organization`,
  `OrganizationMembership`, `OrganizationRole`, `RefreshToken`,
  `AuditLog`, plus `organizationId` on `Project`, `SoilSample`,
  `SoilTest`, `SoilReport`).
