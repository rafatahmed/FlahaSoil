/**
 * FlahaSOIL v2 — refreshCoordinator unit tests (Phase 9A-G).
 *
 * The coordinator's single responsibility is to deduplicate concurrent
 * refresh attempts. These tests pin:
 *   - returns null when no fn is registered
 *   - calls the fn exactly once when N callers race
 *   - allows a fresh call after the in-flight call resolves
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AccessTokenSnapshot } from "../accessTokenStore";
import {
	__resetRefreshCoordinator,
	coordinatedRefresh,
	setRefreshCoordinator,
} from "../refreshCoordinator";

const SNAP: AccessTokenSnapshot = { token: "jwt", expiresAtMs: Date.now() + 60_000 };

afterEach(() => {
	__resetRefreshCoordinator();
});

describe("coordinatedRefresh", () => {
	it("resolves to null when no coordinator is registered", async () => {
		await expect(coordinatedRefresh()).resolves.toBeNull();
	});

	it("deduplicates concurrent refresh calls", async () => {
		type Resolve = (s: AccessTokenSnapshot | null) => void;
		const deferred: { resolve: Resolve; promise: Promise<AccessTokenSnapshot | null> } =
			(() => {
				let resolve!: Resolve;
				const promise = new Promise<AccessTokenSnapshot | null>((r) => {
					resolve = r;
				});
				return { resolve, promise };
			})();

		const fn = vi.fn(() => deferred.promise);
		setRefreshCoordinator(fn);

		const a = coordinatedRefresh();
		const b = coordinatedRefresh();
		const c = coordinatedRefresh();
		expect(fn).toHaveBeenCalledTimes(1);

		deferred.resolve(SNAP);
		const [resA, resB, resC] = await Promise.all([a, b, c]);
		expect(resA).toEqual(SNAP);
		expect(resB).toEqual(SNAP);
		expect(resC).toEqual(SNAP);
	});

	it("issues a new call once the in-flight promise resolves", async () => {
		const fn = vi.fn().mockResolvedValue(SNAP);
		setRefreshCoordinator(fn);

		await coordinatedRefresh();
		await coordinatedRefresh();

		expect(fn).toHaveBeenCalledTimes(2);
	});

	it("propagates a null result without throwing", async () => {
		const fn = vi.fn().mockResolvedValue(null);
		setRefreshCoordinator(fn);
		await expect(coordinatedRefresh()).resolves.toBeNull();
	});
});
