/**
 * FlahaSOIL v2 — auth context shape (Phase 9A-G).
 *
 * The provider lives in `AuthProvider.tsx`; this file only defines the
 * context value + types so the hook can stay non-component and React
 * Fast Refresh keeps working.
 */

import { createContext } from "react";

import type {
	LoginRequest,
	OrganizationDTO,
	OrganizationMembershipDTO,
	RegisterRequest,
	UserDTO,
} from "@flaha/shared-types";

/**
 * Lifecycle of the auth state machine:
 *
 *   loading        → first render / silent refresh in flight
 *   authenticated  → access token live, user + org hydrated
 *   unauthenticated → no live session (cookie absent / rejected / logout)
 *   error          → an unexpected network/server error tried to hydrate
 *                    the session; the SPA surfaces a banner and lets the
 *                    user retry instead of bouncing them to /login
 */
export type AuthStatus =
	| "loading"
	| "authenticated"
	| "unauthenticated"
	| "error";

export interface AuthActions {
	register: (body: RegisterRequest) => Promise<void>;
	login: (body: LoginRequest) => Promise<void>;
	logout: () => Promise<void>;
	/** Manually re-hydrate from the refresh cookie. Returns true on success. */
	refresh: () => Promise<boolean>;
	/**
	 * Phase 9A-H — rotate the active organization for the current
	 * session. Calls `POST /auth/switch-organization`, which mints a new
	 * access token carrying the chosen `oid` claim and returns a fresh
	 * `AuthSessionDTO`. The provider feeds that payload through the same
	 * `applySession` reducer used by login/refresh, so the SPA's tenant-
	 * aware UI re-renders in one tick. Throws on failure so the caller
	 * (the TenantSwitcher) can surface an error toast without leaving
	 * the picker in a stale loading state.
	 */
	switchOrganization: (organizationId: string) => Promise<void>;
}

export interface AuthContextValue {
	status: AuthStatus;
	user: UserDTO | null;
	activeOrganization: OrganizationDTO | null;
	memberships: OrganizationMembershipDTO[];
	/** Last hydration / action error, cleared on the next successful action. */
	error: Error | null;
	actions: AuthActions;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
