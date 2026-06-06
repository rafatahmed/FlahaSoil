# FlahaSOIL v2 — Phase 9A Sign-off

> **Status:** ✅ COMPLETE
> **Date:** 2026-06-06
> **Scope:** Phase 9A-A through 9A-M (authentication, multi-tenancy,
> security hardening, documentation, acceptance, close-out).
> **Next:** Phase 9B — Organization administration (members,
> invitations, settings).

## 1. Sub-phase status

| Sub-phase | Title                                   | Status      | Reference                          |
| --------- | --------------------------------------- | ----------- | ---------------------------------- |
| 9A-A      | Database schema (User/Org/Membership)   | ✅ COMPLETE | `v2-migration-plan.md §9A-A`       |
| 9A-B      | Tenant ownership migration              | ✅ COMPLETE | `v2-migration-plan.md §9A-B`       |
| 9A-C      | Auth backend (argon2, JWT, refresh)     | ✅ COMPLETE | `v2-auth.md`                       |
| 9A-D      | Route protection & tenant isolation     | ✅ COMPLETE | `v2-multi-tenant-architecture.md`  |
| 9A-E      | Production-only auth + legacy cleanup   | ✅ COMPLETE | `v2-migration-plan.md §9A-E`       |
| 9A-F      | Route audit & tenant safety             | ✅ COMPLETE | `v2-migration-plan.md §9A-F`       |
| 9A-G      | Frontend auth UX                        | ✅ COMPLETE | `v2-migration-plan.md §9A-G`       |
| 9A-H      | Organization switcher                   | ✅ COMPLETE | `v2-migration-plan.md §9A-H`       |
| 9A-I      | Security hardening (rate limit + CSP)   | ✅ COMPLETE | `v2-security-architecture.md`      |
| 9A-J      | Acceptance walk-through                 | ✅ COMPLETE | §3 below                           |
| 9A-K      | Demo seed                               | ✅ COMPLETE | `v2-migration-plan.md §9A-K`       |
| 9A-L      | Architecture documentation              | ✅ COMPLETE | `v2-auth.md`, `v2-multi-tenant-architecture.md`, `v2-security-architecture.md` |
| 9A-M      | Close-out + sign-off                    | ✅ COMPLETE | this document                      |

## 2. Security controls inventory

| Control                                | Implementation                                                  |
| -------------------------------------- | --------------------------------------------------------------- |
| Password hashing                       | argon2id, 64 MiB / 3 iter / 1 parallelism (OWASP 2024)          |
| Password policy                        | min 12 chars + mixed classes + top-1000 blocklist               |
| Access token                           | JWT HS256, 15-min TTL, in-memory only                           |
| Refresh token                          | Opaque 32-byte CSPRNG, SHA-256-at-rest, HttpOnly/Secure/SameSite=Strict cookie |
| Refresh rotation                       | Single-use families + reuse detection + family revocation       |
| Login rate limit                       | 20/min/IP + 5 failures/15-min/email → 15-min lockout            |
| Refresh rate limit                     | 60/min/IP + 30 failures/5-min/cookie-hash → 5-min lockout       |
| Tenant isolation                       | Tri-layer: route guard + service query + ownership helper       |
| Role enforcement                       | 5-tier ladder (VIEWER / LAB_TECH / AGRONOMIST / ADMIN / OWNER)  |
| Cross-tenant response                  | 404 (never 403) — no existence leakage                          |
| CSP                                    | `default-src 'none'; frame-ancestors 'none'; base-uri 'none'`   |
| HSTS                                   | 1y + includeSubDomains (production only)                        |
| Referrer-Policy                        | `no-referrer`                                                   |
| CORP                                   | `same-site`                                                     |
| `X-Powered-By`                         | suppressed                                                      |
| Request body limit                     | 512 KB                                                          |
| Dev-auth fallback                      | hard-disabled by default; refuses to boot under production      |
| Audit trail                            | `AuditLog` table; 13 auth + tenancy actions; SECURITY severity for rejections |

## 3. Acceptance walk-through (Phase 9A-J)

Each Phase 9A exit criterion is locked by automated tests:

| #  | Exit criterion                                                                | Locked by                                                       |
| -- | ----------------------------------------------------------------------------- | --------------------------------------------------------------- |
| 1  | All non-auth `/api/v2/*` routes require a valid JWT                           | `auth.routes.test.ts`, `roleMatrix.test.ts`                     |
| 2  | `x-dev-user-id` fallback OFF by default                                       | `app.test.ts`, `env.test.ts`                                    |
| 3  | Dev-auth refuses to boot in production                                        | `env.test.ts`                                                   |
| 4  | Every query filters by `organizationId`                                       | `tenantIsolation.test.ts` (9 tests)                             |
| 5  | Cross-tenant access returns 404                                               | `tenantIsolation.test.ts`                                       |
| 6  | Role matrix enforced by guards                                                | `roleMatrix.test.ts` (24 tests, 5 roles × 5 endpoints)          |
| 7  | Registration creates personal org + OWNER membership                          | `auth.service.test.ts`, `auth.routes.test.ts`                   |
| 8  | Login issues access + refresh, audits `AUTH_LOGIN`                            | `auth.routes.test.ts`                                           |
| 9  | Refresh rotation is single-use + reuse detected                               | `refreshTokens.test.ts` (7 tests)                               |
| 10 | Logout revokes the family                                                     | `auth.routes.test.ts`, `auth.service.test.ts`                   |
| 11 | Organization switching validates membership + rebinds access token            | `auth.routes.test.ts` (switch-org), `TenantSwitcher.test.tsx`   |
| 12 | Frontend holds access tokens in memory only                                   | `accessTokenStore.test.ts`                                      |
| 13 | Silent refresh recovers sessions, dedups concurrent 401s                      | `refreshCoordinator.test.ts`, `AuthProvider.test.tsx`           |
| 14 | Password policy enforced server- and client-side                              | `password.test.ts` (12), `passwordPolicy.test.ts` (5)           |
| 15 | Rate limiting + lockout on `/login` and `/refresh`; security headers in place | `authRateLimit.test.ts` (3), `app.test.ts` (security headers)   |

## 4. Test results

| Surface  | Suites | Tests | Pass | Skip | Fail |
| -------- | -----: | ----: | ---: | ---: | ---: |
| Backend  |     19 |   173 |  172 |    1 |    0 |
| Frontend |      5 |    24 |   24 |    0 |    0 |
| **Total**|     24 |   197 |  196 |    1 |    0 |

The single skipped backend test is `integration/soilTest.e2e.test.ts`,
which requires a live Postgres instance and is opt-in via
`E2E_DATABASE_URL`.

## 5. Documentation deliverables

- [`docs/v2-auth.md`](./v2-auth.md) — auth tokens, endpoints, policy,
  rotation, rate limits, frontend flow, test inventory.
- [`docs/v2-multi-tenant-architecture.md`](./v2-multi-tenant-architecture.md)
  — tenancy model, roles, isolation guarantees, org switching, demo
  seed, Phase 9B roadmap.
- [`docs/v2-security-architecture.md`](./v2-security-architecture.md)
  — threat model, transport headers, hardening summary, CORS, audit
  enumeration, operational notes.
- [`docs/v2-migration-plan.md`](./v2-migration-plan.md) — Phase 9A-I
  and 9A-L sections added; Phase 9A header updated to ✅ COMPLETE.
- This document.

## 6. Phase 9B readiness

The Phase 9A baseline satisfies every prerequisite for Phase 9B:

- **Data model** — `Organization`, `OrganizationMembership`, and
  `User.archivedAt` are in place. No schema migration is required to
  start 9B; member invitations introduce one new table
  (`OrganizationInvitation`) but reuse the existing membership shape.
- **Auth** — JWT carries `oid` + `role`; the SPA already revalidates
  on org switch. Member management write actions can hang directly
  off the existing session middleware.
- **Authorization** — `ROLES_ORG_ADMIN` bundle (`ADMIN` + `OWNER`)
  is the natural gate for Phase 9B endpoints; no new role tier
  needed.
- **Audit** — `MEMBERSHIP_*`, `ORG_UPDATED`, `ORG_SWITCHED` actions
  already declared in `audit.ts`; only `MEMBERSHIP_INVITED` /
  `MEMBERSHIP_ACCEPTED` need to be added.
- **Security** — rate limiter, CSP, and headers cover the new
  endpoints transparently; no global config changes anticipated.

**Recommendation:** proceed to Phase 9B (Organization
Administration) immediately. Suggested 9B kickoff order:

1. 9B-A — `OrganizationInvitation` schema + email provider
   abstraction.
2. 9B-B — Member CRUD endpoints + `ROLES_ORG_ADMIN` guards.
3. 9B-C — Organization settings (rename, slug change, archive).
4. 9B-D — Members & invitations UX (settings page).
5. 9B-E — Audit-log viewer scoped to the active org.

## 7. Operational follow-ups (out of Phase 9A scope)

- Rotate `JWT_SECRET` on first production cut-over; document the
  rotation cadence in the deploy runbook.
- Place a shared edge limiter (nginx / CDN) in front of the
  application limiter once horizontal scaling is enabled.
- Migrate `AuditLog` to a partitioned table when row counts exceed
  ~10 M (anticipated mid-Phase 9B at the earliest).
