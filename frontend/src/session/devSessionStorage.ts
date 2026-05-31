/**
 * FlahaSOIL v2 — dev-session persistence (Phase 8B).
 *
 * Reads / writes the dev-user id used by the `x-dev-user-id` header.
 * Kept in its own module so the API client can read the value without
 * pulling in React (`apiClientProvider` and `realApiV2Client` are React-
 * agnostic).
 *
 * Storage layout:
 *   - localStorage key `flahasoil.v2.devUserId` holds the dev user id
 *     last returned by `GET /api/v2/me`. The value is only consulted
 *     when running in the browser; SSR / Node test environments fall
 *     through to `undefined`.
 *
 * The storage is a soft cache — when missing or invalid the backend
 * `devSessionMiddleware` upserts the seeded `user_dev_admin` and the
 * SessionProvider then writes that id back here.
 */

const STORAGE_KEY = "flahasoil.v2.devUserId";

function isBrowser(): boolean {
	return (
		typeof window !== "undefined" &&
		typeof window.localStorage !== "undefined"
	);
}

export function getStoredDevUserId(): string | undefined {
	if (!isBrowser()) return undefined;
	try {
		const value = window.localStorage.getItem(STORAGE_KEY);
		return value && value.length > 0 ? value : undefined;
	} catch {
		// Access to localStorage can throw under restrictive privacy
		// settings (Safari in private mode, etc.). Fall back silently.
		return undefined;
	}
}

export function setStoredDevUserId(userId: string): void {
	if (!isBrowser()) return;
	try {
		window.localStorage.setItem(STORAGE_KEY, userId);
	} catch {
		// see comment in getter
	}
}

export function clearStoredDevUserId(): void {
	if (!isBrowser()) return;
	try {
		window.localStorage.removeItem(STORAGE_KEY);
	} catch {
		// see comment in getter
	}
}
