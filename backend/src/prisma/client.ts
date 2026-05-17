/**
 * FlahaSOIL v2 API — Prisma v2 client wrapper.
 *
 * The v2 Prisma schema generates a client to a SEGREGATED output dir
 * (`prisma/generated/v2-client`) so it never collides with the legacy
 * client produced by `api-implementation/prisma/schema.prisma`.
 *
 * Resolution strategy:
 *   - We use a runtime `require` against a relative path so the
 *     compile step does not need the generated client to exist.
 *   - If the client has not been generated, the first DB call throws a
 *     clear, actionable error pointing at `npm run prisma:generate:v2`.
 *   - The exported `PrismaClientLike` interface declares only the
 *     delegates the v2 services use; if you need a new model, add it
 *     here and the rest of the codebase stays type-safe.
 *
 * DO NOT import from the legacy `@prisma/client` here — the legacy
 * client is generated for a SQLite datasource and a different model
 * graph and would cause subtle runtime drift.
 */

import path from "node:path";

// ---------------------------------------------------------------------------
// Minimal typed surface of the generated Prisma v2 client.
// ---------------------------------------------------------------------------

export interface PrismaModelDelegate<T> {
	create(args: { data: unknown; include?: unknown }): Promise<T>;
	findUnique(args: {
		where: Record<string, unknown>;
		include?: unknown;
	}): Promise<T | null>;
	findFirst(args: {
		where: Record<string, unknown>;
		include?: unknown;
		orderBy?: unknown;
	}): Promise<T | null>;
	update(args: {
		where: Record<string, unknown>;
		data: unknown;
		include?: unknown;
	}): Promise<T>;
	upsert(args: {
		where: Record<string, unknown>;
		create: unknown;
		update: unknown;
		include?: unknown;
	}): Promise<T>;
	delete(args: { where: Record<string, unknown> }): Promise<T>;
	findMany(args?: {
		where?: Record<string, unknown>;
		include?: unknown;
		orderBy?: unknown;
		take?: number;
		skip?: number;
	}): Promise<T[]>;
}

export interface PrismaClientLike {
	$connect(): Promise<void>;
	$disconnect(): Promise<void>;
	$transaction<R>(fn: (tx: PrismaClientLike) => Promise<R>): Promise<R>;
	project: PrismaModelDelegate<Record<string, unknown>>;
	soilSample: PrismaModelDelegate<Record<string, unknown>>;
	soilTest: PrismaModelDelegate<Record<string, unknown>>;
	soilTextureInput: PrismaModelDelegate<Record<string, unknown>>;
	soilChemistryInput: PrismaModelDelegate<Record<string, unknown>>;
	soilPhysicsResult: PrismaModelDelegate<Record<string, unknown>>;
	soilChemistryResult: PrismaModelDelegate<Record<string, unknown>>;
	soilInterpretation: PrismaModelDelegate<Record<string, unknown>>;
	soilReport: PrismaModelDelegate<Record<string, unknown>>;
	soilLabValue: PrismaModelDelegate<Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Lazy resolution of the generated client.
// ---------------------------------------------------------------------------

// Resolves to <repo-root>/prisma/generated/v2-client from
// backend/src/prisma/client.ts (3 levels up: prisma → src → backend → root).
const GENERATED_CLIENT_DIR = path.resolve(
	__dirname,
	"..",
	"..",
	"..",
	"prisma",
	"generated",
	"v2-client"
);

let cachedClient: PrismaClientLike | null = null;

function loadGeneratedClient(): PrismaClientLike {
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const mod: { PrismaClient: new () => PrismaClientLike } = require(
			GENERATED_CLIENT_DIR
		);
		return new mod.PrismaClient();
	} catch (err) {
		const reason = err instanceof Error ? err.message : String(err);
		throw new Error(
			"Prisma v2 client has not been generated. Run " +
				"`npm run prisma:generate:v2` from backend/ before starting the " +
				`server or executing DB-backed code. (cause: ${reason})`
		);
	}
}

/**
 * Returns a singleton Prisma v2 client. Throws on first access if the
 * client has not been generated yet.
 */
export function getPrismaClient(): PrismaClientLike {
	if (cachedClient === null) {
		cachedClient = loadGeneratedClient();
	}
	return cachedClient;
}

/** Test-only: inject a mock client so unit tests can avoid the DB. */
export function setPrismaClientForTesting(
	client: PrismaClientLike | null
): void {
	cachedClient = client;
}
