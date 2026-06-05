/**
 * FlahaSOIL v2 — auth module barrel (Phase 9A-G).
 *
 * Single import surface for the auth context, provider, hook, and the
 * in-memory access-token store. Consumers should NOT reach into the
 * sub-files directly so future internal refactors stay contained.
 */

export { AuthContext, type AuthContextValue, type AuthActions, type AuthStatus } from "./AuthContext";
export { AuthProvider } from "./AuthProvider";
export { useAuth } from "./useAuth";
export { ProtectedRoute } from "./ProtectedRoute";
export { PublicOnlyRoute } from "./PublicOnlyRoute";
export {
	getAccessToken,
	setAccessToken,
	clearAccessToken,
	subscribeAccessToken,
	isAccessTokenFresh,
	type AccessTokenSnapshot,
} from "./accessTokenStore";
export {
	setRefreshCoordinator,
	coordinatedRefresh,
	__resetRefreshCoordinator,
	type RefreshFn,
} from "./refreshCoordinator";
