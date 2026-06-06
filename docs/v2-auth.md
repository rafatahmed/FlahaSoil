# FlahaSOIL v2 — Authentication

> Status: ✅ Phase 9A close-out (9A-C through 9A-I).
> Audience: backend & frontend engineers, ops.

## 1. Tokens

| Token             | Type            | Lifetime    | Transport                         | Storage                                  |
| ----------------- | --------------- | ----------- | --------------------------------- | ---------------------------------------- |
| Access token      | JWT HS256       | 15 minutes  | `Authorization: Bearer <token>`   | In-memory only (React `accessTokenStore`) |
| Refresh token     | Opaque (32-byte CSPRNG, base64url) | 30 days     | `HttpOnly`, `Secure`, `SameSite=Strict` cookie (`flaha_rt`) | SHA-256 hash persisted in `RefreshToken` table |
| CSRF              | n/a (cookie is `SameSite=Strict` + JWT is bearer) | n/a | n/a | n/a |

Access tokens carry `sub` (User.id), `oid` (active Organization.id or `null`), `role` (membership role on `oid`), and standard `iat`/`exp`/`jti`. Frontend never sees the refresh token.

## 2. Endpoints

| Method | Path                                  | Auth        | Purpose                                                      |
| ------ | ------------------------------------- | ----------- | ------------------------------------------------------------ |
| POST   | `/api/v2/auth/register`               | Public      | Create User + personal Organization + OWNER membership.      |
| POST   | `/api/v2/auth/login`                  | Public      | Verify credentials, issue access + refresh, audit `AUTH_LOGIN`. |
| POST   | `/api/v2/auth/refresh`                | Cookie only | Rotate refresh token (single-use family), mint new access.   |
| POST   | `/api/v2/auth/logout`                 | JWT         | Revoke the current refresh-token family.                     |
| GET    | `/api/v2/auth/me`                     | JWT         | Echo current session (`AuthSessionDTO`).                     |
| POST   | `/api/v2/auth/switch-organization`    | JWT         | Validate membership, mint new access token bound to the chosen org. |

All write endpoints return a stable `ApiErrorResponse` envelope: `{ error: { code, message, details? } }`.

## 3. Password policy

Enforced server-side by `backend/src/auth/password.ts → validatePasswordPolicy`. Mirrored client-side by `frontend/src/auth/passwordPolicy.ts` for UX only — the backend rule is authoritative.

- Min length 12.
- At least one upper, one lower, one digit, one symbol.
- Top-1000 common-password blocklist.
- Hash: argon2id, 64 MiB memory cost, 3 iterations, 1 parallelism (OWASP 2024 baseline).

## 4. Refresh-token rotation

Single-use families with reuse detection (`backend/src/auth/refreshTokens.ts`):

1. `/refresh` looks up the SHA-256 hash of the supplied cookie.
2. If `revokedAt IS NOT NULL` → reuse detected. The entire family is revoked, an `AUTH_REFRESH_REUSE_DETECTED` audit row is written at SECURITY severity, and the response is 401.
3. Otherwise the row is marked `revokedAt = now`, a new sibling row in the same `familyId` is inserted, and a new access token is minted.
4. Each family is bound to a `userAgentFingerprint` + `ipAddress`; mismatches are logged but currently advisory only.

## 5. Rate limiting & lockout (Phase 9A-I)

`backend/src/middleware/authRateLimit.ts` mounts two sliding-window counters per protected surface:

| Surface     | Per-IP cap   | Identity cap (lockout trigger)            | Lockout window |
| ----------- | ------------ | ----------------------------------------- | -------------- |
| `/login`    | 20 / 60 s    | 5 failures keyed on email / 15-min window | 15 minutes     |
| `/refresh`  | 60 / 60 s    | 30 failures keyed on SHA-256 of cookie    | 5 minutes      |

- A blocked attempt returns HTTP `429` with a `Retry-After` header (seconds) and the `{ error: { code: "RATE_LIMITED" } }` envelope.
- Hitting the identity cap writes an `AUTH_LOCKOUT` audit row at SECURITY severity (with the identity hash and lockout duration). Every blocked attempt also writes `AUTH_LOGIN_RATE_LIMITED` / `AUTH_REFRESH_RATE_LIMITED`.
- The limiter is in-process. Multi-pod deployments should additionally place a shared edge limiter (nginx, CDN) in front; the application limiter remains the defence-in-depth tier closest to the credential store.
- A successful login clears the identity bucket; the controller calls `req.authRateLimiter.recordSuccess(identity)` on the happy path and `recordFailure(identity, req)` on a 401.

## 6. Frontend flow

`frontend/src/auth/` owns the client glue:

- `accessTokenStore` — module-scoped, never persisted. Lost on tab close.
- `refreshCoordinator` — deduplicates concurrent 401s into a single `POST /refresh`; other in-flight requests await the resolved promise.
- `AuthProvider` / `useAuth` — context hook exposing `session`, `login`, `logout`, `switchOrganization`.
- `ProtectedRoute` / `PublicOnlyRoute` — react-router guards.
- `TenantSwitcher` — drives `POST /auth/switch-organization` from the top app bar.

The fetch client (`frontend/src/api/realApiV2Client.ts`) intercepts 401, calls the coordinator, replays the original request once with the new access token, and forwards the result.

## 7. Audit trail

Every auth event lands in the `AuditLog` table via `writeAudit` / `writeAuditBestEffort`. See [`docs/v2-security-architecture.md`](./v2-security-architecture.md#audit-log) for the full action enumeration and severity mapping.

## 8. Test coverage

| Suite                                                     | Focus                                       | Count |
| --------------------------------------------------------- | ------------------------------------------- | :---: |
| `backend/src/auth/__tests__/password.test.ts`             | Policy + argon2 round-trip                  | 12    |
| `backend/src/auth/__tests__/jwt.test.ts`                  | Sign/verify, bearer parsing                 | 10    |
| `backend/src/auth/__tests__/refreshTokens.test.ts`        | Rotation + reuse detection                  | 7     |
| `backend/src/services/__tests__/auth.service.test.ts`    | Register / login / refresh / logout         | 11    |
| `backend/src/__tests__/auth.routes.test.ts`              | HTTP integration incl. cookie handling      | 12    |
| `backend/src/middleware/__tests__/authRateLimit.test.ts`  | IP cap + identity lockout + reset           | 3     |
| `frontend/src/auth/__tests__/*`                           | Provider, coordinator, store, policy        | 19    |
