/**
 * FlahaSOIL v2 — API client provider.
 *
 * Single decision point for choosing between the in-memory mock and
 * the fetch-backed real client at runtime.
 *
 *   - `VITE_USE_MOCK_API === "true"`  → `mockApiV2Client` (default)
 *   - any other value (incl. unset)   → `realApiV2Client`
 *
 * Pages MUST import `getApiClient()` from this module rather than
 * referencing the mock or real client directly. That keeps the toggle
 * confined to one file and preserves the rule "do not remove mock API
 * support from frontend".
 */
import type { ApiV2Client } from "./apiV2Client";
import { mockApiV2Client } from "./mockApiV2Client";
import { realApiV2Client } from "./realApiV2Client";

export type ApiClientMode = "mock" | "real";

function readMode(): ApiClientMode {
	const raw = import.meta.env.VITE_USE_MOCK_API;
	// Default: mock. Only an explicit "false" switches to real to make
	// the safe path the default during development.
	if (typeof raw !== "string") return "mock";
	return raw.toLowerCase() === "false" ? "real" : "mock";
}

let cachedMode: ApiClientMode | null = null;

export function getApiClientMode(): ApiClientMode {
	if (cachedMode === null) {
		cachedMode = readMode();
	}
	return cachedMode;
}

export function getApiClient(): ApiV2Client {
	return getApiClientMode() === "mock" ? mockApiV2Client : realApiV2Client;
}

/**
 * Test / story helper: forces a specific mode. Pass `null` to clear
 * the override and re-read the env var on next access.
 */
export function setApiClientModeForTesting(mode: ApiClientMode | null): void {
	cachedMode = mode;
}
