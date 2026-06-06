<!-- @format -->

# FlahaSOIL v2 — Multi-tenant architecture

> Status: ✅ Phase 9A close-out; extended in Phase 9B (administration surface).
> Companion: [`docs/v2-auth.md`](./v2-auth.md), [`docs/v2-user-ownership.md`](./v2-user-ownership.md), [`docs/v2-organization-administration.md`](./v2-organization-administration.md).

## 1. Tenancy model

FlahaSOIL v2 is a **soft multi-tenant** application: a single Postgres schema partitions data per `Organization` via foreign keys. There is **no** schema-per-tenant or DB-per-tenant.

```
User ── owns ──> RefreshToken
 │
 │  has many
 ▼
OrganizationMembership ── belongs to ──> Organization
                                              │
                                              │  owns
                                              ▼
                                      Project ─► SoilSample ─► SoilTest ─► …
```

Every billable / soil-domain row carries an `organizationId` column. The session middleware loads `User + active Organization + Membership` on every request and the route guards refuse to run a query that doesn't constrain on `organizationId`.

## 2. Identity vs. tenancy

- **User** — the principal. Globally unique by email. Outlives memberships.
- **Organization** — the tenant. Has a stable `id`, human `name`, and unique `slug`.
- **OrganizationMembership** — the (User × Organization) join with a `role` and `status`. A user may have many ACTIVE memberships; exactly one is the **active** organization at any time, encoded as the `oid` claim on the access token.

`User.activeOrganizationId` is **not** persisted; the active org is per-session, derived from the JWT. This lets the same user keep separate active orgs in two browsers without coordination.

## 3. Roles

Role ladder defined in `backend/src/auth/guards.ts`:

| Role         | Read | Create / edit projects | Create samples + tests | Generate / regen reports | Manage org / members |
| ------------ | :--: | :--------------------: | :--------------------: | :----------------------: | :------------------: |
| `VIEWER`     |  ✓   |           —            |           —            |            —             |          —           |
| `LAB_TECH`   |  ✓   |           —            |           ✓            |            —             |          —           |
| `AGRONOMIST` |  ✓   |           ✓            |           ✓            |            ✓             |          —           |
| `ADMIN`      |  ✓   |           ✓            |           ✓            |            ✓             |          ✓           |
| `OWNER`      |  ✓   |           ✓            |           ✓            |            ✓             |          ✓           |

Convenience role bundles exported from `guards.ts`:

- `ROLES_READ` — every role.
- `ROLES_LAB_WRITE` — `LAB_TECH`, `AGRONOMIST`, `ADMIN`, `OWNER`.
- `ROLES_AGRONOMY_WRITE` — `AGRONOMIST`, `ADMIN`, `OWNER`.
- `ROLES_REPORT_WRITE` — `AGRONOMIST`, `ADMIN`, `OWNER`.
- `ROLES_ORG_ADMIN` — `ADMIN`, `OWNER`.

## 4. Tenant isolation guarantees

Enforced at three layers:

1. **Route guards** (`backend/src/auth/guards.ts`) — `requireOrganization`, `requireOrgRole(...roles)`, `requireProjectAccess({roles?})`, `requireSampleAccess(...)`, `requireSoilTestAccess(...)`, `requireReportAccess(...)`. Each loads the target row, asserts `row.organizationId === session.activeOrganizationId`, and (when given a role set) asserts membership role.
2. **Service queries** — every read & write in `backend/src/services/**` accepts an `organizationId` and includes it in the Prisma `where` clause. No service function takes a "current user" without taking the org too.
3. **Ownership rules** (`backend/src/auth/ownership.ts`) — pure helpers (14 unit tests) that codify the project/sample/test/report parent-child relationships so guards stay consistent.

Cross-tenant attempts return **404 NOT_FOUND**, never 403. Leaking row existence across orgs is treated as the same bug class as leaking row contents.

## 5. Organization switching

`POST /api/v2/auth/switch-organization` validates that the caller has an ACTIVE membership on the requested org, mints a **fresh access token** bound to the new `oid`, and returns the updated `AuthSessionDTO`. The refresh-token family is NOT rotated — the same family can mint access tokens for any of the user's orgs.

The SPA's `TenantSwitcher` calls the endpoint, replaces the in-memory access token, and revalidates the active queries. Concurrent in-flight requests against the old org complete normally and the cache is invalidated by tenant key.

## 6. Audit scope

Audit rows persist both `actorUserId` and `organizationId` whenever both are knowable. Org-independent events (registration, login) record `organizationId = null`. The `AuditLog` table is queryable by tenant so administrators only ever see their org's trail.

## 7. Demo seed

`backend/prisma/seedDemoOrganization.ts` provisions **Flaha Demo Organization** (`flaha-demo-org`) with four demo users covering every role tier, plus a second membership for the dev user so the tenant switcher exercises the multi-org branch. Idempotent: safe to re-run.

## 8. Test coverage

| Suite                                                                      | Focus                                       | Count |
| -------------------------------------------------------------------------- | ------------------------------------------- | :---: |
| `backend/src/auth/__tests__/ownership.test.ts`                             | Parent-child ownership rules                |  14   |
| `backend/src/__tests__/tenantIsolation.test.ts`                            | Cross-tenant row leakage (404 vs 200)       |   9   |
| `backend/src/__tests__/roleMatrix.test.ts`                                 | 5 roles × ~5 endpoints                      |  24   |
| `backend/src/__tests__/auth.routes.test.ts` (switch-org)                   | Membership validation + access-token rebind |   4   |
| `backend/src/services/__tests__/organization.service.test.ts` (Phase 9B)   | Org / member / invitation lifecycle         |  19   |
| `frontend/src/layouts/components/__tests__/TenantSwitcher.test.tsx`        | Switcher UX                                 |   5   |
| `frontend/src/features/organizations/__tests__/*` (Phase 9B)               | Active-org admin hook + invite dialog       |   7   |
| `frontend/src/pages/__tests__/OrganizationMembersPage.test.tsx` (Phase 9B) | Role-change + remove under RBAC             |   3   |

## 9. Phase 9B — Organization administration ✅ COMPLETE

Phase 9B layered self-service **organization administration** on this foundation **without altering the tenancy model**: no new tables, no token-shape change, no new role tier. The full surface (endpoints, authorization rules, invitation flow, audit actions, frontend routes) is documented in [`docs/v2-organization-administration.md`](./v2-organization-administration.md).

Net additions:

- 9 new `/api/v2` endpoints under `requireOrganizationMember` / `requireOrganizationAdmin`.
- 7 new audit actions (`ORG_UPDATED`, `MEMBERSHIP_ROLE_CHANGED`, `MEMBERSHIP_REMOVED`, `INVITATION_*`).
- Frontend admin pages + accept-link landing, sidebar-gated by `useActiveOrgAdmin().isAdmin`.
- `EmailProvider` abstraction with a production-safe `ConsoleEmailProvider` default.

Deferred to Phase 9C: ownership transfer, audit-log viewer UI, member SUSPEND status, real transactional email adapter.
