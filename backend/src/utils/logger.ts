/**
 * FlahaSOIL v2 API — structured logger.
 *
 * Tiny zero-dependency logger that emits one JSON object per call to
 * stdout/stderr. Designed for log aggregators (CloudWatch, Loki) that
 * key off `level`, `msg`, and `service`. Avoids `console.log` so the
 * shape stays consistent across the codebase.
 *
 * Usage:
 *   import { logger } from "../utils/logger";
 *   logger.info("calculation.completed", { soilTestId, ms });
 *   logger.warn("salinity.tds_inconsistent", { ecDsM, tdsMgL });
 *   logger.error("calculate.failed", { err });
 *
 * The logger is silent at level "test" (NODE_ENV=test) so the Vitest
 * runner output stays readable.
 */

import { env } from "../config/env";

type LogLevel = "info" | "warn" | "error";

interface LogPayload {
	level: LogLevel;
	msg: string;
	service: string;
	time: string;
	[key: string]: unknown;
}

function emit(level: LogLevel, msg: string, ctx?: Record<string, unknown>): void {
	if (env.nodeEnv === "test") return;
	const payload: LogPayload = {
		level,
		msg,
		service: "flaha-soil-v2-api",
		time: new Date().toISOString(),
		...(ctx ?? {}),
	};
	// `err` instances are not JSON-serialisable by default. Replace them
	// with a {name, message, stack} projection so they show up usefully.
	if (ctx && ctx["err"] instanceof Error) {
		const e = ctx["err"];
		payload["err"] = { name: e.name, message: e.message, stack: e.stack };
	}
	const line = JSON.stringify(payload);
	if (level === "error") {
		// eslint-disable-next-line no-console
		console.error(line);
	} else {
		// eslint-disable-next-line no-console
		console.log(line);
	}
}

export const logger = {
	info(msg: string, ctx?: Record<string, unknown>): void {
		emit("info", msg, ctx);
	},
	warn(msg: string, ctx?: Record<string, unknown>): void {
		emit("warn", msg, ctx);
	},
	error(msg: string, ctx?: Record<string, unknown>): void {
		emit("error", msg, ctx);
	},
};
