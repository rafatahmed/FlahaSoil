/**
 * @flaha/shared-types — API error contract.
 *
 * All v2 API endpoints emit non-2xx responses in the shape of
 * `ApiErrorResponse`. The `error.code` field is one of `ApiErrorCode`;
 * `error.message` is a human-readable diagnostic; `error.details` is an
 * optional payload (e.g. validation failures) whose shape is documented
 * per error code in `docs/v2-api-contracts.md`.
 */

export const API_ERROR_CODES = [
	"VALIDATION_ERROR",
	"NOT_FOUND",
	"UNAUTHORIZED",
	"FORBIDDEN",
	"CALCULATION_ERROR",
	"UNSUPPORTED_TEST_LEVEL",
	"MISSING_REQUIRED_INPUT",
	"PAYLOAD_TOO_LARGE",
	"RATE_LIMITED",
	"INTERNAL_ERROR",
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

export interface ApiErrorResponse {
	error: {
		code: ApiErrorCode;
		message: string;
		details?: unknown;
	};
}

/**
 * Per-field validation failure detail. Emitted in
 * `ApiErrorResponse.error.details` when `error.code === "VALIDATION_ERROR"`.
 *
 * `path` is the dotted JSON pointer of the offending field (e.g.
 * `"textureInput.sandPercent"`). `rule` is a stable machine-readable rule
 * id (e.g. `"required"`, `"range"`, `"texture-sums-to-100"`). `message`
 * is the human-readable explanation; `expected` / `received` are
 * optional diagnostic payloads.
 */
export interface ValidationFailureDetail {
	path: string;
	rule: string;
	message: string;
	expected?: unknown;
	received?: unknown;
}

/**
 * Convenience type-guard. Useful in fetch wrappers to discriminate a
 * generic JSON response between success and error shapes.
 */
export function isApiErrorResponse(
	value: unknown
): value is ApiErrorResponse {
	if (typeof value !== "object" || value === null) return false;
	const v = value as { error?: unknown };
	if (typeof v.error !== "object" || v.error === null) return false;
	const e = v.error as { code?: unknown; message?: unknown };
	return (
		typeof e.code === "string" &&
		typeof e.message === "string" &&
		(API_ERROR_CODES as readonly string[]).includes(e.code)
	);
}
