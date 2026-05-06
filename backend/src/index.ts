/**
 * FlahaSOIL v2 — API package entry.
 *
 * Re-exports the app factory so other packages (notably the test suite)
 * can build a fresh Express instance without going through `server.ts`,
 * which would bind a port.
 */

export { createApp } from "./app";

export function apiReady(): boolean {
	return true;
}
