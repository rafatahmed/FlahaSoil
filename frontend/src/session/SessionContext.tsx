/**
 * FlahaSOIL v2 — session context (Phase 8B).
 *
 * Carries the resolved dev-session for every component subscribed via
 * `useSession`. The provider lives in `SessionProvider.tsx`; this file
 * only defines the context object + shape so consumers and providers
 * stay decoupled (React Fast Refresh requires hook + context exports to
 * sit alongside non-component code in their own module).
 */

import { createContext } from "react";

import type { SessionDTO, UserDTO, UserRole } from "@flaha/shared-types";

export type SessionStatus = "loading" | "ready" | "error";

export interface SessionContextValue {
	/** Current loading state of the session. */
	status: SessionStatus;
	/** Resolved user once `status === "ready"`, otherwise `null`. */
	user: UserDTO | null;
	/** Shortcut for `user?.role` so consumers can branch on role. */
	role: UserRole | null;
	/** Full session (mode + user) once ready, otherwise `null`. */
	session: SessionDTO | null;
	/** Last error encountered loading /api/v2/me, if any. */
	error: Error | null;
	/** Forces a re-fetch of `/api/v2/me`. */
	reload: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextValue | null>(null);
