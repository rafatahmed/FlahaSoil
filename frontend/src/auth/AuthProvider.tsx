/**
 * FlahaSOIL v2 — AuthProvider (Phase 9A-G).
 *
 * Owns the SPA's auth state machine. Behaviour:
 *
 *   1. On mount, attempts a silent refresh by POSTing /auth/refresh.
 *      The HttpOnly cookie is sent automatically; if it is still valid
 *      the backend mints a new access token and returns the full
 *      session, so the user lands on the requested page already
 *      logged in.
 *   2. The access token is held in `accessTokenStore` (in-memory only)
 *      so the React-agnostic API client can attach it to every request.
 *   3. The provider registers a refresh coordinator so 401s caught by
 *      the API client trigger a single deduplicated refresh; if that
 *      refresh fails the provider transitions to `unauthenticated`.
 *   4. `actions.login` / `register` capture the returned session and
 *      flip status to `authenticated`; `actions.logout` calls the API
 *      to revoke the refresh cookie family and then clears local state.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import type {
	AuthSessionDTO,
	LoginRequest,
	OrganizationDTO,
	OrganizationMembershipDTO,
	RegisterRequest,
	UserDTO,
} from "@flaha/shared-types";

import { getApiClient } from "../services/apiClientProvider";
import { ApiClientError } from "../services/realApiV2Client";

import { AuthContext, type AuthStatus } from "./AuthContext";
import {
	clearAccessToken,
	setAccessToken,
	type AccessTokenSnapshot,
} from "./accessTokenStore";
import { setRefreshCoordinator } from "./refreshCoordinator";

interface AuthState {
	status: AuthStatus;
	user: UserDTO | null;
	activeOrganization: OrganizationDTO | null;
	memberships: OrganizationMembershipDTO[];
	error: Error | null;
}

const INITIAL_STATE: AuthState = {
	status: "loading",
	user: null,
	activeOrganization: null,
	memberships: [],
	error: null,
};

function sessionToSnapshot(session: AuthSessionDTO): AccessTokenSnapshot {
	return {
		token: session.accessToken,
		expiresAtMs: new Date(session.accessTokenExpiresAt).getTime(),
	};
}

function isUnauthorizedError(err: unknown): boolean {
	return err instanceof ApiClientError && err.status === 401;
}

interface AuthProviderProps {
	children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
	const [state, setState] = useState<AuthState>(INITIAL_STATE);
	// StrictMode mounts effects twice in dev; this latch makes the
	// boot refresh idempotent.
	const bootedRef = useRef(false);

	const applySession = useCallback((session: AuthSessionDTO) => {
		setAccessToken(sessionToSnapshot(session));
		setState({
			status: "authenticated",
			user: session.user,
			activeOrganization: session.activeOrganization,
			memberships: session.memberships,
			error: null,
		});
	}, []);

	const applyUnauthenticated = useCallback((error: Error | null = null) => {
		clearAccessToken();
		setState({
			status: "unauthenticated",
			user: null,
			activeOrganization: null,
			memberships: [],
			error,
		});
	}, []);

	const refresh = useCallback(async (): Promise<boolean> => {
		try {
			const client = getApiClient();
			const res = await client.refresh();
			applySession(res.session);
			return true;
		} catch (err) {
			if (isUnauthorizedError(err)) {
				applyUnauthenticated();
				return false;
			}
			const e = err instanceof Error ? err : new Error(String(err));
			setState((prev) => ({ ...prev, status: "error", error: e }));
			return false;
		}
	}, [applySession, applyUnauthenticated]);

	const login = useCallback(
		async (body: LoginRequest) => {
			const client = getApiClient();
			const res = await client.login(body);
			applySession(res.session);
		},
		[applySession]
	);

	const register = useCallback(
		async (body: RegisterRequest) => {
			const client = getApiClient();
			const res = await client.register(body);
			applySession(res.session);
		},
		[applySession]
	);

	const logout = useCallback(async () => {
		const client = getApiClient();
		try {
			await client.logout();
		} catch {
			// Even if the server call fails (network down, token already
			// invalid) we drop the local session — the user clicked
			// "log out" and must not stay logged in client-side.
		}
		applyUnauthenticated();
	}, [applyUnauthenticated]);

	// Wire the API client's 401 handler to our refresh action.
	useEffect(() => {
		setRefreshCoordinator(async () => {
			try {
				const client = getApiClient();
				const res = await client.refresh();
				applySession(res.session);
				return sessionToSnapshot(res.session);
			} catch {
				applyUnauthenticated();
				return null;
			}
		});
		return () => setRefreshCoordinator(null);
	}, [applySession, applyUnauthenticated]);

	// Silent refresh on first mount so a page reload keeps the user
	// logged in (or surfaces "unauthenticated" once the cookie expires).
	useEffect(() => {
		if (bootedRef.current) return;
		bootedRef.current = true;
		void refresh();
	}, [refresh]);

	const value = useMemo(
		() => ({
			status: state.status,
			user: state.user,
			activeOrganization: state.activeOrganization,
			memberships: state.memberships,
			error: state.error,
			actions: { register, login, logout, refresh },
		}),
		[state, register, login, logout, refresh]
	);

	return (
		<AuthContext.Provider value={value}>{children}</AuthContext.Provider>
	);
}
