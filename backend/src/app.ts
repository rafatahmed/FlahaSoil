/**
 * FlahaSOIL v2 API — Express app factory.
 *
 * Builds a bare Express instance with security middleware, CORS,
 * JSON body parsing, request logging, the v2 router under `/api/v2`,
 * a health probe, and the standard 404 + error handlers.
 *
 * The factory shape (no top-level `app.listen`) keeps the same module
 * usable by the production entry point (`server.ts`) and by the test
 * suite (which mounts the app into supertest without binding a port).
 */

import cors from "cors";
import express, { type Express, type Request, type Response } from "express";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";
import { createRateLimiter } from "./middleware/rateLimit";
import { createV2Router } from "./routes/v2.routes";

export function createApp(): Express {
	const app = express();

	app.disable("x-powered-by");
	app.use(helmet());
	app.use(cors());
	// Phase 8: cap JSON request bodies. Soil-test payloads are well
	// under 100 KB in practice; 512 KB leaves comfortable headroom for
	// large lab-value batches without inviting abuse.
	app.use(express.json({ limit: "512kb" }));
	// Phase 8: shed-load protection. The limiter is a no-op under
	// NODE_ENV=test so the supertest suite is unaffected.
	app.use("/api/v2", createRateLimiter());

	if (env.nodeEnv !== "test") {
		app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));
	}

	// Lightweight liveness / readiness probe. `/health` is the
	// canonical path required by the deployment contract; `/healthz`
	// is kept as an alias for the Kubernetes-style probe convention
	// already in use elsewhere in the stack.
	const healthHandler = (_req: Request, res: Response): void => {
		res.status(200).json({
			status: "ok",
			service: "flaha-soil-v2-api",
			env: env.nodeEnv,
		});
	};
	app.get("/health", healthHandler);
	app.get("/healthz", healthHandler);

	app.use("/api/v2", createV2Router());

	app.use(notFoundHandler);
	app.use(errorHandler);

	return app;
}
