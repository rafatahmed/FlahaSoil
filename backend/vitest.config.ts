import { defineConfig } from "vitest/config";

// Backend Vitest runs in a single fork. The auth layer links the
// `argon2` native addon (see src/auth/password.ts); loading and calling
// that binding from several Vitest worker forks concurrently
// intermittently triggers a native access violation on Windows
// (exit 0xC0000005 / 3221225477). Pinning to one fork serialises the
// native calls and keeps the suite deterministic. This is a
// test-runner-only setting — no production code is affected.
export default defineConfig({
	test: {
		pool: "forks",
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
	},
});
