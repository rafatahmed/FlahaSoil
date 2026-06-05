/**
 * FlahaSOIL v2 — refresh coordinator (Phase 9A-G).
 *
 * Bridges the React-agnostic API client and the React-owned
 * `AuthProvider` so that:
 *
 *   1. The API client can ask "please refresh the session" without
 *      knowing how the session is owned (provider, hook, fixture).
 *   2. Concurrent 401s on N pending requests collapse into ONE
 *      in-flight refresh; everyone awaits the same promise.
 *   3. The provider can swap the refresh implementation in tests with
 *      a deterministic stub.
 *
 * The coordinator owns NO state besides the registered callback and
 * the current in-flight promise; the access token itself lives in
 * `accessTokenStore`.
 */

import type { AccessTokenSnapshot } from "./accessTokenStore";

/**
 * Returns the new access-token snapshot on success or `null` when the
 * refresh attempt should be treated as "no live session" (e.g. the
 * refresh cookie is missing or rejected). Must never throw — failures
 * are signalled by `null`.
 */
export type RefreshFn = () => Promise<AccessTokenSnapshot | null>;

let refreshFn: RefreshFn | null = null;
let inFlight: Promise<AccessTokenSnapshot | null> | null = null;

/**
 * Register the implementation used to mint a new access token. Called
 * exactly once by `AuthProvider` on mount. Replacing the function while
 * a refresh is in flight is allowed; the in-flight call still resolves
 * against the previous implementation.
 */
export function setRefreshCoordinator(fn: RefreshFn | null): void {
	refreshFn = fn;
}

/**
 * Trigger a refresh, deduplicating concurrent callers. Resolves to the
 * new snapshot or `null` when no refresh is possible (no coordinator
 * registered yet, or the registered function returns `null`).
 */
export function coordinatedRefresh(): Promise<AccessTokenSnapshot | null> {
	if (!refreshFn) return Promise.resolve(null);
	if (inFlight) return inFlight;
	const fn = refreshFn;
	inFlight = fn().finally(() => {
		inFlight = null;
	});
	return inFlight;
}

/** Test helper — reset both the registered fn and any in-flight call. */
export function __resetRefreshCoordinator(): void {
	refreshFn = null;
	inFlight = null;
}
