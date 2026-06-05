/**
 * FlahaSOIL v2 — API server entry.
 *
 * Production entry point. Builds the Express app via `createApp()` and
 * binds it to the configured port. Kept separate from `app.ts` so the
 * test suite can mount the same app into supertest without binding a
 * socket.
 */

import { createApp } from "./app";
import { runBootstrap } from "./bootstrap";
import { env } from "./config/env";
import { logger } from "./utils/logger";

const app = createApp();

// Phase 8B: ensure the seeded dev user exists before accepting traffic
// in non-production environments. Bootstrap errors are non-fatal so a
// transient DB issue at boot does not block restarts.
void runBootstrap();

const server = app.listen(env.port, () => {
	logger.info("server.listening", { port: env.port, env: env.nodeEnv });
});

const SHUTDOWN_SIGNALS = ["SIGINT", "SIGTERM"] as const;
for (const sig of SHUTDOWN_SIGNALS) {
	process.on(sig, () => {
		logger.info("server.shutdown", { signal: sig });
		server.close(() => process.exit(0));
	});
}

export function serverReady(): boolean {
	return true;
}
