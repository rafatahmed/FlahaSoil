/**
 * FlahaSOIL v2 API — environment configuration.
 *
 * Reads only the v2 environment variables. The legacy `DATABASE_URL`
 * is intentionally NOT consulted; the v2 backend must never share a
 * datasource with the legacy stack.
 */

import crypto from "node:crypto";

const DEFAULT_PORT = 3002;

// Phase 9A-C — JWT / auth defaults. Short-lived access tokens + long
// refresh tokens is the standard OWASP-recommended split. Both windows
// are overridable via env so ops can tune without a redeploy.
const DEFAULT_ACCESS_TTL_MINUTES = 15;
const DEFAULT_REFRESH_TTL_DAYS = 30;

function parsePort(raw: string | undefined): number {
	if (!raw) return DEFAULT_PORT;
	const n = Number(raw);
	if (!Number.isInteger(n) || n <= 0 || n > 65_535) {
		throw new Error(
			`Invalid PORT environment variable: ${raw}. Must be an integer in [1, 65535].`
		);
	}
	return n;
}

function parsePositiveInt(
	raw: string | undefined,
	fallback: number,
	name: string
): number {
	if (!raw) return fallback;
	const n = Number(raw);
	if (!Number.isInteger(n) || n <= 0) {
		throw new Error(
			`Invalid ${name} environment variable: ${raw}. Must be a positive integer.`
		);
	}
	return n;
}

function parseBool(raw: string | undefined, fallback: boolean): boolean {
	if (raw === undefined) return fallback;
	const v = raw.trim().toLowerCase();
	if (v === "true" || v === "1" || v === "yes") return true;
	if (v === "false" || v === "0" || v === "no") return false;
	throw new Error(
		`Invalid boolean environment variable: ${raw}. Expected true|false.`
	);
}

export interface AuthEnv {
	/** HMAC secret used to sign access JWTs. Never log or echo. */
	jwtSecret: string;
	accessTtlMinutes: number;
	refreshTtlDays: number;
	/** Cookie name for the refresh token (HttpOnly+Secure). */
	refreshCookieName: string;
	/** Optional cookie Domain attribute (e.g. ".flahasoil.com"). */
	cookieDomain: string | undefined;
	/** Sets the Secure attribute on the refresh-token cookie. */
	cookieSecure: boolean;
	/** SameSite attribute on the refresh-token cookie. */
	cookieSameSite: "strict" | "lax" | "none";
	/** True when JWT_SECRET was synthesised at boot (dev/test only). */
	jwtSecretIsDevFallback: boolean;
	/**
	 * Phase 9A-E — when true, the session middleware accepts the legacy
	 * `x-dev-user-id` header (and falls back to the seeded dev user) for
	 * `/api/v2/*` requests that arrive without a JWT bearer token.
	 *
	 * Defaults to FALSE in every environment so a missing/forgotten env
	 * var never opens the backdoor by accident. Tests that need the dev
	 * resolver MUST set `ALLOW_DEV_AUTH=true` explicitly. The boot path
	 * refuses to start when NODE_ENV=production AND this flag is true,
	 * and the session middleware additionally gates the fallback on
	 * `NODE_ENV=development` so test runners that opt in cannot
	 * accidentally enable dev auth against the production datasource.
	 */
	allowDevAuth: boolean;
}

export interface ApiEnv {
	port: number;
	nodeEnv: "development" | "production" | "test";
	databaseUrlV2: string | undefined;
	auth: AuthEnv;
	/**
	 * Phase 9A-G — origins allowed by the CORS layer. The Vite dev server
	 * (default http://localhost:5173) and the production SPA host must
	 * appear here so the browser will send the HttpOnly refresh cookie
	 * with cross-origin XHR. Wildcard origins are NOT supported under
	 * `credentials: true` (the browser rejects them).
	 */
	corsOrigins: string[];
}

function resolveJwtSecret(
	nodeEnv: ApiEnv["nodeEnv"]
): { secret: string; isDevFallback: boolean } {
	const raw = process.env.JWT_SECRET;
	if (raw && raw.length >= 32) {
		return { secret: raw, isDevFallback: false };
	}
	if (raw && raw.length > 0 && raw.length < 32) {
		throw new Error(
			"JWT_SECRET is set but too short. Must be at least 32 characters."
		);
	}
	// Production refuses to boot without an explicit, sufficiently long
	// secret. Dev/test derive a deterministic per-machine fallback so
	// repeat runs share the same signing key (so issued tokens survive a
	// `tsx watch` reload).
	if (nodeEnv === "production") {
		throw new Error(
			"JWT_SECRET is required in production. Set a 32+ character random value."
		);
	}
	const seed = `flaha-soil-v2-dev::${process.platform}::${process.cwd()}`;
	const secret = crypto
		.createHash("sha256")
		.update(seed)
		.digest("hex");
	return { secret, isDevFallback: true };
}

function readEnv(): ApiEnv {
	const nodeEnvRaw = process.env.NODE_ENV ?? "development";
	const nodeEnv =
		nodeEnvRaw === "production" || nodeEnvRaw === "test"
			? nodeEnvRaw
			: "development";

	const { secret: jwtSecret, isDevFallback } = resolveJwtSecret(nodeEnv);

	const sameSiteRaw = (process.env.AUTH_COOKIE_SAMESITE ?? "lax")
		.trim()
		.toLowerCase();
	if (
		sameSiteRaw !== "strict" &&
		sameSiteRaw !== "lax" &&
		sameSiteRaw !== "none"
	) {
		throw new Error(
			`Invalid AUTH_COOKIE_SAMESITE: ${sameSiteRaw}. Expected strict|lax|none.`
		);
	}

	// Phase 9A-E — dev-auth flag. Defaults to FALSE in every environment
	// so a missing/forgotten env var never opens the backdoor by
	// accident. Tests that exercise the dev resolver opt in explicitly
	// (see backend/src/__tests__/app.test.ts). Production must FAIL FAST
	// when the flag is explicitly enabled: silently downgrading would be
	// a security footgun — a misconfigured prod deploy must crash, not
	// pretend the dev backdoor is closed.
	const allowDevAuthRaw = parseBool(process.env.ALLOW_DEV_AUTH, false);
	if (nodeEnv === "production" && allowDevAuthRaw) {
		throw new Error(
			"ALLOW_DEV_AUTH=true is forbidden under NODE_ENV=production. " +
				"Unset the variable or set it to false."
		);
	}

	const auth: AuthEnv = {
		jwtSecret,
		jwtSecretIsDevFallback: isDevFallback,
		accessTtlMinutes: parsePositiveInt(
			process.env.JWT_ACCESS_TTL_MINUTES,
			DEFAULT_ACCESS_TTL_MINUTES,
			"JWT_ACCESS_TTL_MINUTES"
		),
		refreshTtlDays: parsePositiveInt(
			process.env.JWT_REFRESH_TTL_DAYS,
			DEFAULT_REFRESH_TTL_DAYS,
			"JWT_REFRESH_TTL_DAYS"
		),
		refreshCookieName: process.env.AUTH_REFRESH_COOKIE_NAME ?? "fsoil_rt",
		cookieDomain: process.env.AUTH_COOKIE_DOMAIN,
		// Default Secure ON in production, OFF in dev/test so browsers
		// will set the cookie over plain http://localhost.
		cookieSecure: parseBool(
			process.env.AUTH_COOKIE_SECURE,
			nodeEnv === "production"
		),
		cookieSameSite: sameSiteRaw,
		allowDevAuth: allowDevAuthRaw,
	};

	// Phase 9A-G — comma-separated allowlist of SPA origins. Defaults to
	// the Vite dev server URL so a clean checkout works out of the box;
	// production deploys MUST override with the real SPA origin.
	const corsRaw = process.env.CORS_ORIGIN ?? "http://localhost:5173";
	const corsOrigins = corsRaw
		.split(",")
		.map((s) => s.trim())
		.filter((s) => s.length > 0);
	if (corsOrigins.length === 0) {
		throw new Error(
			"CORS_ORIGIN resolved to an empty list. Provide at least one origin."
		);
	}

	return {
		port: parsePort(process.env.PORT),
		nodeEnv,
		databaseUrlV2: process.env.DATABASE_URL_V2,
		auth,
		corsOrigins,
	};
}

// Phase 9A-E — lazy initialisation. The `env` value is materialised on
// first property access rather than at module-load time. This lets test
// harnesses mutate `process.env` (e.g. `process.env.ALLOW_DEV_AUTH =
// "true"`) AFTER the source `import` of this module but BEFORE the
// first read of an env field, without forcing every consumer onto a
// new function-call API. Production / dev call sites are unaffected:
// the proxy resolves once and caches the result.
let _env: ApiEnv | undefined;

function ensureEnv(): ApiEnv {
	if (!_env) _env = readEnv();
	return _env;
}

export const env: ApiEnv = new Proxy({} as ApiEnv, {
	get(_target, prop) {
		return (ensureEnv() as unknown as Record<string, unknown>)[
			prop as string
		];
	},
}) as ApiEnv;

/**
 * Test-only escape hatch: clears the cached `ApiEnv` so the next access
 * re-reads `process.env`. Production code MUST NOT call this — it
 * exists so the env gate can be exercised under different
 * `process.env` snapshots within a single vitest run.
 */
export function _resetEnvForTesting(): void {
	_env = undefined;
}
