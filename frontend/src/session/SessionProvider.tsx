/**
 * FlahaSOIL v2 — session provider (Phase 8B).
 *
 * Loads `GET /api/v2/me` once on mount, persists the resolved user id
 * to localStorage so subsequent requests carry the same dev session
 * via the `x-dev-user-id` header, and exposes the result through
 * `SessionContext`.
 *
 * Behaviour:
 *   - First render: `status === "loading"`, `user === null`.
 *   - On success: `status === "ready"`, `user` populated.
 *   - On failure: `status === "error"`, `error` populated. The UI
 *     surfaces this via a global banner so the user knows the API
 *     could not be reached (typically a backend that's not running).
 *
 * The provider intentionally renders its children even while loading
 * so the page chrome appears immediately; consumers that need the
 * user (e.g. greeting components) should branch on `status`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import type { SessionDTO } from "@flaha/shared-types";

import { getApiClient } from "../services/apiClientProvider";
import { SessionContext, type SessionStatus } from "./SessionContext";
import { setStoredDevUserId } from "./devSessionStorage";

interface SessionProviderProps {
	children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
	const [status, setStatus] = useState<SessionStatus>("loading");
	const [session, setSession] = useState<SessionDTO | null>(null);
	const [error, setError] = useState<Error | null>(null);
	// Avoid double-loads under React 18 StrictMode (which mounts
	// effects twice in development).
	const inFlight = useRef(false);

	const load = useCallback(async () => {
		if (inFlight.current) return;
		inFlight.current = true;
		setStatus("loading");
		setError(null);
		try {
			const client = getApiClient();
			const res = await client.getMe();
			setSession(res.session);
			setStoredDevUserId(res.session.user.id);
			setStatus("ready");
		} catch (err) {
			const e = err instanceof Error ? err : new Error(String(err));
			setError(e);
			setStatus("error");
		} finally {
			inFlight.current = false;
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	const value = useMemo(
		() => ({
			status,
			user: session?.user ?? null,
			role: session?.user.role ?? null,
			session,
			error,
			reload: load,
		}),
		[status, session, error, load]
	);

	return (
		<SessionContext.Provider value={value}>
			{children}
		</SessionContext.Provider>
	);
}
