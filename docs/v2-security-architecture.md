# FlahaSOIL v2 — Security architecture

> Status: ✅ Phase 9A close-out (Phase 9A-I hardening pass).
> Companions: [`docs/v2-auth.md`](./v2-auth.md), [`docs/v2-multi-tenant-architecture.md`](./v2-multi-tenant-architecture.md).

## 1. Threat model (scope)

Defended against in Phase 9A:

- **Credential stuffing / brute force** on `/login` and `/refresh` (rate limiting + lockout, Argon2id).
- **Token theft** of the refresh token via XSS (HttpOnly cookie + strict CSP + CSRF-resistant `SameSite=Strict`).
- **Token reuse** after rotation (single-use refresh families with reuse detection + family revocation).
- **Cross-tenant data leakage** (tri-layer isolation: route guard, service query, ownership helper — see [`v2-multi-tenant-architecture.md`](./v2-multi-tenant-architecture.md#4-tenant-isolation-guarantees)).
- **Header injection / clickjacking / framework leakage** (Helmet baseline + `default-src 'none'` + `X-Powered-By` strip + `frame-ancestors 'none'`).
- **Oversized request flood** (Express body limit + per-route `createRateLimiter`).

Out of scope for Phase 9A (queued):

- Email-based 2FA (Phase 9B).
- WebAuthn / passkeys (post-9B).
- Per-org IP allowlists (post-9B).
- Field-level encryption at rest (handled by Postgres TDE / disk encryption today).

## 2. Transport & headers (Phase 9A-I)

Set globally in `backend/src/app.ts`:

| Header                              | Value                                                                                                                  | Notes                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `Content-Security-Policy`           | `default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`                                       | API is JSON-only; this baseline is the tightest practical. |
| `X-Content-Type-Options`            | `nosniff`                                                                                                              | Helmet default.                                      |
| `Referrer-Policy`                   | `no-referrer`                                                                                                          | Avoid leaking tokens via referer.                    |
| `Cross-Origin-Resource-Policy`      | `same-site`                                                                                                            | API not loadable by other origins as a resource.     |
| `Strict-Transport-Security`         | `max-age=31536000; includeSubDomains` (production only)                                                                | HSTS off in dev/test to avoid cert pinning headaches. |
| `X-Powered-By`                      | removed                                                                                                                | `app.disable("x-powered-by")`.                       |

The report preview endpoint (`GET /reports/:id/versions/:n/preview`) sets a **route-local CSP** that additionally permits `style-src 'unsafe-inline'` plus `img-src data:` and `font-src data:`, because the renderer emits self-contained HTML with inline `<style>`. No scripts, no external loads, no framing.

## 3. Authentication hardening

See [`docs/v2-auth.md §5`](./v2-auth.md#5-rate-limiting--lockout-phase-9a-i) for the rate-limit / lockout matrix.

- **Argon2id** with OWASP-recommended cost (64 MiB / 3 iterations / 1 parallelism).
- **Password policy** enforced server-side (min 12 chars, mixed character classes, top-1000 blocklist).
- **Refresh token rotation** with single-use families; reuse detection revokes the family and writes a SECURITY audit row.
- **Access tokens** are 15-minute HS256 JWTs stored in memory only — never in `localStorage` or a non-HttpOnly cookie.
- **Refresh tokens** stored only as SHA-256 hashes in `RefreshToken.tokenHash`; the raw value lives in an HttpOnly + Secure + SameSite=Strict cookie.

## 4. CORS

- Allowlist driven by `env.corsOrigins` (`CORS_ORIGINS=https://app.example.com,https://app2.example.com`).
- Wildcard origins rejected.
- `credentials: true` so the refresh cookie travels cross-site to the API origin during dev.
- A misconfigured SPA origin fails the CORS check loudly (`CORS: origin not allowed`) instead of silently dropping the cookie.

## 5. Request limits

- `express.json({ limit: "512kb" })` — soil-test payloads are well under 100 KB in practice; 512 KB leaves headroom without inviting abuse.
- `/api/v2` is wrapped in `createRateLimiter` (general shed-load) on top of the per-auth-endpoint limiters from Phase 9A-I.

## 6. Audit log

Schema: `backend/prisma/schema.prisma → AuditLog`. Writer: `backend/src/auth/audit.ts → writeAudit` (transactional) and `writeAuditBestEffort` (fire-and-forget; never blocks the response).

| Action                            | Severity   | Actor known? | Notes                                                       |
| --------------------------------- | ---------- | ------------ | ----------------------------------------------------------- |
| `AUTH_REGISTER`                   | `INFO`     | yes (new)    | Personal org + OWNER membership created.                    |
| `AUTH_LOGIN`                      | `INFO`     | yes          | Successful credential exchange.                             |
| `AUTH_LOGIN_FAILED`               | `WARNING`  | no           | Generic — same response for unknown email vs. wrong password. |
| `AUTH_LOGIN_RATE_LIMITED`         | `SECURITY` | no           | Limiter rejected the attempt (IP or identity tier).         |
| `AUTH_LOCKOUT`                    | `SECURITY` | no           | Identity bucket hit `maxIdentityFailures`; 15-min lockout.  |
| `AUTH_LOGOUT`                     | `INFO`     | yes          | Family revoked.                                             |
| `AUTH_REFRESH`                    | `INFO`     | yes          | Successful rotation.                                        |
| `AUTH_REFRESH_RATE_LIMITED`       | `SECURITY` | sometimes    | Limiter rejected on `/refresh`.                             |
| `AUTH_REFRESH_REUSE_DETECTED`     | `SECURITY` | yes          | Family revoked, sibling chain dropped.                      |
| `AUTH_TOKEN_REVOKED`              | `INFO`     | yes          | Operator or self-service revocation.                        |
| `ORG_CREATED` / `ORG_UPDATED` / `ORG_SWITCHED` | `INFO`     | yes          | Tenant-mutating events.                                     |
| `MEMBERSHIP_*`                    | `INFO`     | yes          | Member CRUD (mostly Phase 9B).                              |
| `PROJECT_*` / `REPORT_*`          | `INFO`     | yes          | Domain audit trail.                                         |

Every row carries `actorUserId` (nullable), `organizationId` (nullable), `action`, `severity`, `metadataJson`, and `createdAt`. Operators query by `(organizationId, severity, createdAt)`.

## 7. Test coverage

Security-relevant suites:

| Suite                                                      | What it locks down                              | Count |
| ---------------------------------------------------------- | ----------------------------------------------- | :---: |
| `backend/src/middleware/__tests__/authRateLimit.test.ts`   | IP cap, identity lockout, success-reset         |  3    |
| `backend/src/__tests__/app.test.ts (security headers)`     | CSP + nosniff + Referrer-Policy + X-Powered-By  |  1    |
| `backend/src/auth/__tests__/refreshTokens.test.ts`         | Rotation + reuse detection                      |  7    |
| `backend/src/__tests__/tenantIsolation.test.ts`            | Cross-tenant 404 vs 200                         |  9    |
| `backend/src/__tests__/roleMatrix.test.ts`                 | 5 roles × ~5 endpoints                          | 24    |
| `backend/src/__tests__/auth.routes.test.ts`                | HTTP flow incl. cookie handling                 | 12    |

## 8. Operational notes

- Rotate `JWT_SECRET` periodically. Rotation invalidates all live access tokens; refresh tokens continue to work and re-mint access tokens signed with the new secret on next `/refresh`.
- The application limiter is in-process — production deployments behind multiple pods should also place a shared edge limiter (nginx, CDN) in front. The two tiers compose.
- The dev-auth fallback (`ALLOW_DEV_AUTH=true` + `x-dev-user-id` header) is hard-disabled in every environment by default. The smoke test suite opts in by setting the env var BEFORE the first import of `../app`.
- HSTS is only enabled when `NODE_ENV=production`. Do NOT enable it in dev — browsers cache the policy indefinitely.
