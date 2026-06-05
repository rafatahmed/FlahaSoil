/**
 * FlahaSOIL v2 API — typed error class.
 *
 * Throw an `ApiError` from anywhere in the request pipeline; the
 * error-handling middleware will translate it into the standard
 * `ApiErrorResponse` envelope from `@flaha/shared-types`.
 */

import type { ApiErrorCode } from "@flaha/shared-types";

export class ApiError extends Error {
	public readonly statusCode: number;
	public readonly code: ApiErrorCode;
	public readonly details: unknown;

	constructor(
		statusCode: number,
		code: ApiErrorCode,
		message: string,
		details?: unknown
	) {
		super(message);
		this.name = "ApiError";
		this.statusCode = statusCode;
		this.code = code;
		this.details = details;
	}

	static badRequest(
		code: ApiErrorCode,
		message: string,
		details?: unknown
	): ApiError {
		return new ApiError(400, code, message, details);
	}

	static notFound(message: string, details?: unknown): ApiError {
		return new ApiError(404, "NOT_FOUND", message, details);
	}

	// Phase 9A-C — distinct factories for the auth layer. `unauthorized`
	// is used for *credential* failures (no/invalid/expired token, bad
	// password); `forbidden` is used for *authorization* failures
	// (authenticated, but not allowed to touch the target resource).
	static unauthorized(message: string, details?: unknown): ApiError {
		return new ApiError(401, "UNAUTHORIZED", message, details);
	}

	static forbidden(message: string, details?: unknown): ApiError {
		return new ApiError(403, "FORBIDDEN", message, details);
	}

	static validation(message: string, details?: unknown): ApiError {
		return new ApiError(400, "VALIDATION_ERROR", message, details);
	}

	static unsupportedTestLevel(message: string, details?: unknown): ApiError {
		return new ApiError(400, "UNSUPPORTED_TEST_LEVEL", message, details);
	}

	static missingRequiredInput(message: string, details?: unknown): ApiError {
		return new ApiError(400, "MISSING_REQUIRED_INPUT", message, details);
	}

	static calculation(message: string, details?: unknown): ApiError {
		return new ApiError(422, "CALCULATION_ERROR", message, details);
	}

	static internal(message: string, details?: unknown): ApiError {
		return new ApiError(500, "INTERNAL_ERROR", message, details);
	}
}
