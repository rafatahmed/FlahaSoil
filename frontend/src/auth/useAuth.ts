/**
 * FlahaSOIL v2 — useAuth hook (Phase 9A-G).
 *
 * Returns the current `AuthContextValue` provided by `<AuthProvider>`.
 * Throws when used outside the provider so misconfiguration is caught
 * loudly during development.
 */

import { useContext } from "react";

import { AuthContext, type AuthContextValue } from "./AuthContext";

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) {
		throw new Error(
			"useAuth() must be used inside <AuthProvider>. Check App.tsx."
		);
	}
	return ctx;
}
