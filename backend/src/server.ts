/**
 * FlahaSOIL v2 — API server entry.
 *
 * Production entry point. Builds the Express app via `createApp()` and
 * binds it to the configured port. Kept separate from `app.ts` so the
 * test suite can mount the same app into supertest without binding a
 * socket.
 */

import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

const server = app.listen(env.port, () => {
	// eslint-disable-next-line no-console
	console.log(
		`[flaha-soil-v2-api] listening on :${env.port} (env=${env.nodeEnv})`
	);
});

const SHUTDOWN_SIGNALS = ["SIGINT", "SIGTERM"] as const;
for (const sig of SHUTDOWN_SIGNALS) {
	process.on(sig, () => {
		// eslint-disable-next-line no-console
		console.log(`[flaha-soil-v2-api] received ${sig}, closing server`);
		server.close(() => process.exit(0));
	});
}

export function serverReady(): boolean {
	return true;
}
