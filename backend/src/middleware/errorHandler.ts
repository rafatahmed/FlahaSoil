/**
 * FlahaSOIL v2 API — central error handler.
 *
 * Translates everything that bubbles out of a route handler into the
 * standard `ApiErrorResponse` envelope from `@flaha/shared-types`.
 *
 *   - `ApiError`               → its declared statusCode / code / details.
 *   - `ZodError`               → 400 VALIDATION_ERROR with per-issue
 *                                `ValidationFailureDetail[]`.
 *   - Anything else            → 500 INTERNAL_ERROR (no message leak in
 *                                production).
 */

import type { ErrorRequestHandler } from "express";
import type {
	ApiErrorResponse,
	ValidationFailureDetail,
} from "@flaha/shared-types";
import { ZodError } from "zod";

import { env } from "../config/env";
import { ApiError } from "../utils/apiError";
import { logger } from "../utils/logger";

interface BodyParserError extends Error {
	type?: string;
	statusCode?: number;
}

function isBodyParserPayloadTooLarge(err: unknown): boolean {
	if (typeof err !== "object" || err === null) return false;
	const e = err as BodyParserError;
	return e.type === "entity.too.large" || e.statusCode === 413;
}

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
	if (err instanceof ApiError) {
		// Client errors are logged at warn level; server errors at error.
		const level = err.statusCode >= 500 ? "error" : "warn";
		logger[level]("api.error", {
			code: err.code,
			status: err.statusCode,
			path: req.path,
			method: req.method,
		});
		const body: ApiErrorResponse = {
			error: {
				code: err.code,
				message: err.message,
				...(err.details === undefined ? {} : { details: err.details }),
			},
		};
		res.status(err.statusCode).json(body);
		return;
	}

	if (err instanceof ZodError) {
		const details: ValidationFailureDetail[] = err.errors.map((issue) => ({
			path: issue.path.map(String).join("."),
			rule: issue.code,
			message: issue.message,
		}));
		logger.warn("api.validation_failed", {
			path: req.path,
			method: req.method,
			issues: details.length,
		});
		const body: ApiErrorResponse = {
			error: {
				code: "VALIDATION_ERROR",
				message: "Request validation failed.",
				details,
			},
		};
		res.status(400).json(body);
		return;
	}

	if (isBodyParserPayloadTooLarge(err)) {
		logger.warn("api.payload_too_large", {
			path: req.path,
			method: req.method,
		});
		res.status(413).json({
			error: {
				code: "PAYLOAD_TOO_LARGE",
				message: "Request body exceeds the configured size limit.",
			},
		} satisfies ApiErrorResponse);
		return;
	}

	const message =
		env.nodeEnv === "production"
			? "Internal server error."
			: err instanceof Error
				? err.message
				: String(err);

	logger.error("api.unhandled", {
		path: req.path,
		method: req.method,
		err: err instanceof Error ? err : new Error(String(err)),
	});

	const body: ApiErrorResponse = {
		error: { code: "INTERNAL_ERROR", message },
	};
	res.status(500).json(body);
};
