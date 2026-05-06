/**
 * FlahaSOIL v2 API — async route handler wrapper.
 *
 * Express 4 does not catch promise rejections from async handlers; this
 * wrapper forwards them to `next(err)` so the central `errorHandler`
 * always sees a single, typed error path.
 */

import type { NextFunction, Request, RequestHandler, Response } from "express";

export type AsyncRequestHandler = (
	req: Request,
	res: Response,
	next: NextFunction
) => Promise<unknown>;

export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
}
