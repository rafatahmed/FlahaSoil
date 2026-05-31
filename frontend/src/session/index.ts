/**
 * FlahaSOIL v2 — session module barrel (Phase 8B).
 *
 * Single import surface for the dev-session layer. Consumers should
 * import from `~/session` rather than reaching into the individual
 * files so the internal shape can evolve without breaking call sites.
 */

export {
	SessionContext,
	type SessionContextValue,
	type SessionStatus,
} from "./SessionContext";
export { SessionProvider } from "./SessionProvider";
export { SessionUserChip } from "./SessionUserChip";
export { useSession, useCurrentUserId } from "./useSession";
export {
	getStoredDevUserId,
	setStoredDevUserId,
	clearStoredDevUserId,
} from "./devSessionStorage";
