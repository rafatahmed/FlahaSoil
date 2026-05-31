/**
 * FlahaSOIL v2 — useSession hook (Phase 8B).
 *
 * Read-side accessor for the dev-session. Components call
 * `useSession()` to discover the current user, role, and load status;
 * mutations are not allowed (the session is owned by `SessionProvider`
 * and refreshed via its `reload()` callback).
 *
 * Throws when used outside a `SessionProvider` — that's a programming
 * error (the provider is mounted unconditionally in `App.tsx`) and a
 * loud failure is preferable to silently returning a stale fallback.
 */

import { useContext } from "react";

import {
	SessionContext,
	type SessionContextValue,
} from "./SessionContext";

export function useSession(): SessionContextValue {
	const ctx = useContext(SessionContext);
	if (!ctx) {
		throw new Error(
			"useSession() must be used inside <SessionProvider>. Check App.tsx."
		);
	}
	return ctx;
}

/**
 * Convenience accessor for the current user's id. Returns `undefined`
 * while the session is still loading; callers in render paths should
 * branch on `status` instead of relying on the id alone.
 */
export function useCurrentUserId(): string | undefined {
	const { user } = useSession();
	return user?.id;
}
