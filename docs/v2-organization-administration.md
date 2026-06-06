# FlahaSOIL v2 — Organization administration

> Status: ✅ Phase 9B close-out.
> Companions: [`docs/v2-auth.md`](./v2-auth.md), [`docs/v2-multi-tenant-architecture.md`](./v2-multi-tenant-architecture.md), [`docs/v2-security-architecture.md`](./v2-security-architecture.md).

## 1. Scope

Phase 9B layers a self-service administration surface on top of the Phase 9A tenancy primitives. It does **not** change the data model, the access-token shape, or the tenant-isolation guarantees — every Phase 9B endpoint reuses `resolveAuthSession` and the route guards from `auth/guards.ts`.

What ships:

- Organization read + rename / type-change (settings page).
- Member listing, role change, and removal (soft-delete to `REMOVED`).
- Invitation lifecycle: create → pending → accepted / revoked / expired.
- Accept-link landing page that consumes a one-shot token.
- Sidebar entry visible only to OWNER / ADMIN.

What is intentionally deferred:

- Ownership transfer (two-step confirmation, separate endpoint).
- Suspending a member without removing them.
- Audit-log viewer UI (the table is queryable; UI is a Phase 9C item).
- SSO / SCIM provisioning.

## 2. Endpoints

All routes live under `/api/v2` and require a valid access token. `requireOrganizationMember` accepts any ACTIVE role; `requireOrganizationAdmin` is OWNER or ADMIN. Cross-tenant calls return **404**, never 403 — existence never leaks across orgs.

| Method | Path                                                              | Guard                          | Purpose                                                          |
| ------ | ----------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------- |
| GET    | `/organizations/:organizationId`                                  | `requireOrganizationMember`    | Read org metadata (name, slug, type, timestamps).                |
| PATCH  | `/organizations/:organizationId`                                  | `requireOrganizationAdmin`     | Rename / change type. Empty body → 400.                          |
| GET    | `/organizations/:organizationId/members`                          | `requireOrganizationMember`    | List ACTIVE + INVITED memberships (REMOVED hidden).              |
| PATCH  | `/organizations/:organizationId/members/:userId`                  | `requireOrganizationAdmin`     | Change role. OWNER seat only granted/revoked by OWNER.           |
| DELETE | `/organizations/:organizationId/members/:userId`                  | `requireOrganizationAdmin`     | Soft-remove; clears `activeOrganizationId` if it matched.        |
| GET    | `/organizations/:organizationId/invitations`                      | `requireOrganizationAdmin`     | List invitations; lazy-transitions past-expiry PENDING→EXPIRED.  |
| POST   | `/organizations/:organizationId/invitations`                      | `requireOrganizationAdmin`     | Issue a one-shot accept link; rolls back on email-send failure.  |
| DELETE | `/organizations/:organizationId/invitations/:invitationId`        | `requireOrganizationAdmin`     | Revoke a PENDING invitation; idempotent for ACCEPTED / EXPIRED.  |
| POST   | `/invitations/accept`                                             | session only                   | Consume an invitation token; canonicalised email must match.     |

The accept endpoint is intentionally outside the `/organizations/:organizationId` prefix because the caller is not yet a member of the target org — an org-scoped guard would (correctly) reject them.

## 3. Authorization rules

Enforced by `services/organization.service.ts` as defence-in-depth on top of the route guards.

| Rule                                                | Where enforced                              | Failure              |
| --------------------------------------------------- | ------------------------------------------- | -------------------- |
| Only OWNER may grant or revoke the OWNER role      | `updateMemberRole`                          | 403 `FORBIDDEN`      |
| Last OWNER may not be demoted or removed           | `assertNotLastOwner`                        | 400 `VALIDATION_ERROR` |
| ADMIN may not remove an OWNER                      | `removeMember`                              | 403 `FORBIDDEN`      |
| Invitations may never grant the OWNER role         | `createInvitation` + `createInvitationSchema` | 400 `VALIDATION_ERROR` |
| One PENDING invitation per (org, email)            | `createInvitation`                          | 400 `VALIDATION_ERROR` |
| Re-inviting an existing member is blocked          | `createInvitation`                          | 400 `VALIDATION_ERROR` |
| Accept rejects email mismatch                      | `acceptInvitation`                          | 403 `FORBIDDEN`      |

The role ladder itself (VIEWER < LAB_TECH < AGRONOMIST < ADMIN < OWNER) is unchanged from Phase 9A; see `docs/v2-multi-tenant-architecture.md §3`.

## 4. Invitation flow

1. Admin posts `{ email, role }`. Server canonicalises email (`trim().toLowerCase()`), validates role ≠ OWNER, and confirms no duplicate PENDING / no existing membership.
2. Server generates a 32-byte CSPRNG token, persists only its SHA-256 hash (`tokenHash`), and stores `expiresAt = now + 7d`.
3. `EmailProvider.sendInvitation(...)` is dispatched with the raw token in the accept URL. The token leaves the service exactly once.
4. On send failure the row is deleted (rollback) and the caller sees `INTERNAL`.
5. `INVITATION_CREATED` is written to `AuditLog` at SECURITY severity.
6. Invitee opens `/invite/:token`, authenticates if needed, and `POST /invitations/accept`:
   - Token is hashed and looked up.
   - Status must be PENDING and not past `expiresAt` (otherwise transitioned to EXPIRED and 400 returned).
   - Canonicalised caller email must match the invited email; otherwise 403.
   - Transactionally: invitation → ACCEPTED, membership upserted to ACTIVE (re-using any prior REMOVED row), `User.activeOrganizationId` defaulted if null, `INVITATION_ACCEPTED` audited.

## 5. Email provider

`backend/src/email/emailProvider.ts` exports the `EmailProvider` interface and a default `ConsoleEmailProvider` that logs the rendered accept link to the structured logger in non-production environments. In `NODE_ENV=production` it refuses to log the token-bearing URL and emits `email.console_provider_in_production` at ERROR — a deploy-time signal to wire a real transactional adapter via `setEmailProvider(...)`.

## 6. Audit actions added in Phase 9B

Appended to the `AuditAction` union in `backend/src/auth/audit.ts` (no schema change, the field is `Text`):

- `ORG_UPDATED` (INFO) — org rename / type change.
- `MEMBERSHIP_ROLE_CHANGED` (SECURITY) — payload includes `previousRole`, `nextRole`, `targetUserId`.
- `MEMBERSHIP_REMOVED` (SECURITY) — payload flags `selfRemoval`.
- `INVITATION_CREATED` / `INVITATION_ACCEPTED` / `INVITATION_REVOKED` / `INVITATION_EXPIRED` (SECURITY).

## 7. Frontend surface

Routes registered in `frontend/src/routes/AppRoutes.tsx`:

| Path                                                      | Page                                       |
| --------------------------------------------------------- | ------------------------------------------ |
| `/organization/settings`                                  | `OrganizationSettingsPage` (active org)   |
| `/organization/members`                                   | `OrganizationMembersPage` (active org)    |
| `/organization/invitations`                               | `OrganizationInvitationsPage` (active org) |
| `/organizations/:organizationId/{settings,members,invitations}` | Same pages, explicit org targeting   |
| `/invite/:token`                                          | `AcceptInvitationPage`                     |

`useActiveOrgAdmin` resolves the path-target org (URL param first, then session active org) and projects `{ role, isAdmin, isOwner }` for view-layer gating. The backend remains the authoritative gate; the hook only hides controls that would 403.

`InviteMemberDialog` validates the email client-side, calls `POST .../invitations`, and surfaces the server's normalised error envelope verbatim.

The sidebar entry "Organization" (in `SidebarNav.tsx`) is rendered only when `useActiveOrgAdmin().isAdmin` is true.

## 8. Test coverage

| Suite                                                                     | Focus                                                 | Count |
| ------------------------------------------------------------------------- | ----------------------------------------------------- | :---: |
| `backend/src/services/__tests__/organization.service.test.ts`             | 19 unit tests over the service (role, lifecycle, audit) | 19  |
| `backend/src/email/__tests__/emailProvider.test.ts`                       | Console provider production redaction                  |   2  |
| `frontend/src/features/organizations/__tests__/useActiveOrgAdmin.test.tsx`| Path / session resolution + role projection            |   3  |
| `frontend/src/features/organizations/__tests__/InviteMemberDialog.test.tsx`| Email validation + happy-path / error surfacing       |   4  |
| `frontend/src/pages/__tests__/OrganizationMembersPage.test.tsx`           | Role-change + remove flow under RBAC                   |   3  |

Combined with the Phase 9A suites, the totals are **197 backend tests** (196 pass + 1 Postgres-only skip) and **34 frontend tests**.

## 9. Roadmap into Phase 9C

Phase 9C will build on this surface with:

- Ownership-transfer endpoint (two-step confirmation).
- Audit-log viewer scoped to the active org.
- Suspend (without remove) as a third membership status.
- A real transactional email adapter wired via `setEmailProvider(...)`.

No schema or auth changes are anticipated.
