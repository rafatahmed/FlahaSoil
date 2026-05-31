/**
 * FlahaSOIL v2 API — runtime bootstrap (Phase 8B).
 *
 * Side-effectful init that runs once on server start, AFTER the env is
 * read but BEFORE the HTTP socket binds. Currently:
 *
 *   - Ensures the seeded dev user exists in the v2 `users` table
 *     (development + test only; production must not auto-seed users).
 *
 * Failures here are logged but do not crash the process — the dev
 * session middleware will retry the upsert on the first request, so a
 * transient DB outage during boot is recoverable.
 */

import { ensureDevUser } from "./auth/currentUser";
import { env } from "./config/env";
import { logger } from "./utils/logger";

export async function runBootstrap(): Promise<void> {
	if (env.nodeEnv === "production") return;
	try {
		const user = await ensureDevUser();
		logger.info("[bootstrap] dev user ensured", {
			userId: user.id,
			role: user.role,
		});
	} catch (err) {
		logger.warn(
			"[bootstrap] failed to ensure dev user (will retry on first request)",
			{ error: err instanceof Error ? err.message : String(err) }
		);
	}
}
