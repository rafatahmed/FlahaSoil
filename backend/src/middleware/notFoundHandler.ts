/**
 * FlahaSOIL v2 API — 404 fallthrough handler.
 *
 * Matches anything that fell past the route table and emits the
 * standard `NOT_FOUND` envelope so clients get a typed error instead
 * of Express's default HTML response.
 */

import type { RequestHandler } from "express";
import type { ApiErrorResponse } from "@flaha/shared-types";

export const notFoundHandler: RequestHandler = (req, res) => {
	const body: ApiErrorResponse = {
		error: {
			code: "NOT_FOUND",
			message: `Route not found: ${req.method} ${req.originalUrl}`,
		},
	};
	res.status(404).json(body);
};
