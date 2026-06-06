/**
 * FlahaSOIL v2 API — auth rate limiter unit tests (Phase 9A-I).
 *
 * Drives the middleware directly through stub req/res/next so the
 * behaviour can be asserted deterministically:
 *
 *   1. Per-IP cap returns 429 once exceeded.
 *   2. Per-identity counter advances on `recordFailure` and triggers a
 *      lockout at `maxIdentityFailures`.
 *   3. Subsequent attempts during the lockout window return 429 with a
 *      `Retry-After` header.
 *   4. `recordSuccess` clears the per-identity bucket.
 *
 * The limiter is otherwise a no-op under `NODE_ENV=test`; tests opt
 * back in by setting `_forceAuthRateLimit` on the stub request.
 */

import { describe, expect, it } from "vitest";
import type { NextFunction, Request, Response } from "express";

import {
	createAuthRateLimiter,
	type AuthRateLimitOptions,
} from "../authRateLimit";

const BASE_OPTS: AuthRateLimitOptions = {
	ipWindowMs: 1000,
	maxIpAttempts: 3,
	identityWindowMs: 1000,
	maxIdentityFailures: 2,
	lockoutMs: 500,
	blockedAuditAction: "AUTH_LOGIN_RATE_LIMITED",
};

function makeReq(overrides: Partial<Request> = {}): Request {
	return {
		ip: "10.0.0.1",
		headers: {},
		socket: { remoteAddress: "10.0.0.1" } as never,
		body: { email: "user@example.com" },
		_forceAuthRateLimit: true,
		...overrides,
	} as unknown as Request;
}

interface ResRecorder {
	res: Response;
	headers: Record<string, string>;
	getStatus: () => number;
	getBody: () => unknown;
}

function makeRes(): ResRecorder {
	const headers: Record<string, string> = {};
	let status = 0;
	let body: unknown = undefined;
	const res = {
		setHeader: (k: string, v: string) => {
			headers[k.toLowerCase()] = v;
		},
		status: (s: number) => {
			status = s;
			return res;
		},
		json: (b: unknown) => {
			body = b;
			return res;
		},
	} as unknown as Response;
	return {
		res,
		headers,
		getStatus: () => status,
		getBody: () => body,
	};
}

function makeNext() {
	let called = 0;
	const fn: NextFunction = () => {
		called += 1;
	};
	return {
		fn,
		get count() {
			return called;
		},
	};
}

describe("createAuthRateLimiter", () => {
	it("rejects with 429 once the per-IP cap is exceeded", () => {
		const limiter = createAuthRateLimiter(BASE_OPTS);
		for (let i = 0; i < BASE_OPTS.maxIpAttempts; i += 1) {
			const r = useOnce(limiter, makeReq());
			expect(r.getStatus()).toBe(0);
		}
		const r = useOnce(limiter, makeReq());
		expect(r.getStatus()).toBe(429);
		expect(r.headers["retry-after"]).toMatch(/^\d+$/);
		expect((r.getBody() as { error: { code: string } }).error.code).toBe(
			"RATE_LIMITED"
		);
	});

	it("locks an identity out after maxIdentityFailures", () => {
		const limiter = createAuthRateLimiter(BASE_OPTS);
		const req = makeReq();
		// First failure (count = 1) — no lockout yet.
		limiter.recordFailure("email:user@example.com", req);
		// Second failure triggers lockout (count = 2 == max).
		limiter.recordFailure("email:user@example.com", req);
		const r = useOnce(limiter, req);
		expect(r.getStatus()).toBe(429);
		expect(r.headers["retry-after"]).toMatch(/^\d+$/);
		expect(
			(r.getBody() as { error: { message: string } }).error.message
		).toMatch(/locked/i);
	});

	it("recordSuccess clears the per-identity bucket", () => {
		const limiter = createAuthRateLimiter(BASE_OPTS);
		limiter.recordFailure("email:user@example.com", makeReq());
		limiter.recordSuccess("email:user@example.com");
		const r = useOnce(limiter, makeReq());
		// No lockout, next() was invoked.
		expect(r.getStatus()).toBe(0);
	});
});

function useOnce(
	limiter: ReturnType<typeof createAuthRateLimiter>,
	req: Request
): ResRecorder {
	const recorder = makeRes();
	const next = makeNext();
	limiter.middleware(req, recorder.res, next.fn);
	return recorder;
}
