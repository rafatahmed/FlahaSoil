/**
 * FlahaSOIL v2 — current-user identifier.
 *
 * Single source of truth for the `userId` parameter used by every
 * `/api/v2` request. Until the v2 authentication layer lands (a later
 * phase), the value is read from `VITE_DEFAULT_USER_ID` and falls back
 * to the stable mock identifier `user_mock`. Keeping the lookup in one
 * helper means swapping it for a session-derived id later is a single
 * change.
 */

const FALLBACK_USER_ID = "user_mock";

export function getCurrentUserId(): string {
	const raw = import.meta.env.VITE_DEFAULT_USER_ID;
	if (typeof raw === "string" && raw.length > 0) {
		return raw;
	}
	return FALLBACK_USER_ID;
}
