/**
 * FlahaSOIL v2 — accessTokenStore unit tests (Phase 9A-G).
 *
 * The store is module-scoped state; each test resets it explicitly so
 * order does not matter. Subscriber notification, expiry comparison, and
 * the clear contract are the only invariants the rest of the auth layer
 * depends on.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
	clearAccessToken,
	getAccessToken,
	isAccessTokenFresh,
	setAccessToken,
	subscribeAccessToken,
} from "../accessTokenStore";

const FUTURE = Date.now() + 5 * 60 * 1000;
const PAST = Date.now() - 1_000;

afterEach(() => {
	clearAccessToken();
	vi.restoreAllMocks();
});

describe("accessTokenStore", () => {
	it("starts empty", () => {
		expect(getAccessToken()).toBeNull();
		expect(isAccessTokenFresh()).toBe(false);
	});

	it("stores and returns a snapshot", () => {
		setAccessToken({ token: "jwt-1", expiresAtMs: FUTURE });
		expect(getAccessToken()).toEqual({ token: "jwt-1", expiresAtMs: FUTURE });
	});

	it("treats an unexpired token as fresh, respecting the skew window", () => {
		setAccessToken({ token: "jwt-1", expiresAtMs: Date.now() + 60_000 });
		expect(isAccessTokenFresh(30)).toBe(true);
		// 120s skew exceeds the 60s remaining → no longer fresh.
		expect(isAccessTokenFresh(120)).toBe(false);
	});

	it("treats an expired token as stale", () => {
		setAccessToken({ token: "jwt-1", expiresAtMs: PAST });
		expect(isAccessTokenFresh()).toBe(false);
	});

	it("notifies subscribers on every change", () => {
		const fn = vi.fn();
		const unsub = subscribeAccessToken(fn);

		setAccessToken({ token: "jwt-1", expiresAtMs: FUTURE });
		setAccessToken(null);
		setAccessToken({ token: "jwt-2", expiresAtMs: FUTURE });

		expect(fn).toHaveBeenCalledTimes(3);
		expect(fn).toHaveBeenNthCalledWith(2, null);
		expect(fn).toHaveBeenLastCalledWith({ token: "jwt-2", expiresAtMs: FUTURE });

		unsub();
		setAccessToken(null);
		expect(fn).toHaveBeenCalledTimes(3);
	});

	it("clearAccessToken empties the snapshot", () => {
		setAccessToken({ token: "jwt-1", expiresAtMs: FUTURE });
		clearAccessToken();
		expect(getAccessToken()).toBeNull();
	});
});
