/**
 * FlahaSOIL v2 — in-memory access token store (Phase 9A-G).
 *
 * The JWT access token is held in module-scoped memory and NEVER
 * persisted to `localStorage` / `sessionStorage`. This is the standard
 * defence against token theft via XSS: an attacker who succeeds at
 * injecting script into the SPA can still read in-memory state, but
 * the token vanishes the moment the tab reloads.
 *
 * Session recovery across reloads is delegated to the HttpOnly+Secure
 * refresh-token cookie (`fsoil_rt`) — `AuthProvider` calls
 * `POST /api/v2/auth/refresh` on mount; if the cookie is still valid
 * the server mints a fresh access token and the SPA re-hydrates.
 *
 * The store also publishes change events so the API client (which is
 * React-agnostic) can react to logout without needing a React hook.
 */

export interface AccessTokenSnapshot {
	/** Raw JWT for the `Authorization: Bearer` header. */
	token: string;
	/** Absolute expiry in epoch milliseconds. */
	expiresAtMs: number;
}

let current: AccessTokenSnapshot | null = null;
const listeners = new Set<(snap: AccessTokenSnapshot | null) => void>();

export function getAccessToken(): AccessTokenSnapshot | null {
	return current;
}

export function setAccessToken(snap: AccessTokenSnapshot | null): void {
	current = snap;
	for (const fn of listeners) fn(snap);
}

export function clearAccessToken(): void {
	setAccessToken(null);
}

/**
 * Subscribe to access-token changes. Returns an unsubscribe fn.
 * Intended for the API client; React components should call `useAuth`.
 */
export function subscribeAccessToken(
	fn: (snap: AccessTokenSnapshot | null) => void
): () => void {
	listeners.add(fn);
	return () => {
		listeners.delete(fn);
	};
}

/**
 * Returns true when an access token is present AND the expiry is more
 * than `skewSeconds` in the future. Used by the API client to proactively
 * refresh just before expiry rather than waiting for a 401.
 */
export function isAccessTokenFresh(skewSeconds = 30): boolean {
	if (!current) return false;
	return current.expiresAtMs - Date.now() > skewSeconds * 1000;
}
