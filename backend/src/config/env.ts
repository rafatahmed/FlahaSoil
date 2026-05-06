/**
 * FlahaSOIL v2 API — environment configuration.
 *
 * Reads only the v2 environment variables. The legacy `DATABASE_URL`
 * is intentionally NOT consulted; the v2 backend must never share a
 * datasource with the legacy stack.
 */

const DEFAULT_PORT = 3002;

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

export interface ApiEnv {
	port: number;
	nodeEnv: "development" | "production" | "test";
	databaseUrlV2: string | undefined;
}

function readEnv(): ApiEnv {
	const nodeEnvRaw = process.env.NODE_ENV ?? "development";
	const nodeEnv =
		nodeEnvRaw === "production" || nodeEnvRaw === "test"
			? nodeEnvRaw
			: "development";

	return {
		port: parsePort(process.env.PORT),
		nodeEnv,
		databaseUrlV2: process.env.DATABASE_URL_V2,
	};
}

export const env: ApiEnv = readEnv();
