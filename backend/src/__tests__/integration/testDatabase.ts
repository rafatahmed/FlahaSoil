/**
 * FlahaSOIL v2 — integration test database harness.
 *
 * Provides a guarded entry point for tests that need a real Prisma v2
 * client against PostgreSQL. The harness deliberately refuses to run
 * unless ALL of the following are true:
 *
 *   1. `DATABASE_URL_V2` is set to a non-empty string.
 *   2. The database name embedded in that URL contains the substring
 *      `test` (case-insensitive). This is a safety guard against
 *      accidentally pointing the integration suite at a development or
 *      production database.
 *   3. `npm run prisma:generate:v2` has been run, so the generated
 *      client at `prisma/generated/v2-client` is loadable.
 *
 * When any of these conditions fails the harness returns a `skip`
 * result with a human-readable reason; callers (vitest specs) are
 * expected to surface it via `it.skip` / `describe.skip`. The harness
 * NEVER auto-applies migrations and NEVER wipes a database whose name
 * does not contain `test`.
 */
import {
	getPrismaClient,
	setPrismaClientForTesting,
	type PrismaClientLike,
} from "../../prisma/client";

export type TestDbAvailability =
	| { available: true; client: PrismaClientLike }
	| { available: false; reason: string };

/**
 * Returns a connected Prisma v2 client when the environment is set up
 * for integration testing, or a `{ available: false, reason }` object
 * otherwise. Always returns; never throws on an unset env var.
 */
export async function getIntegrationDb(): Promise<TestDbAvailability> {
	const url = process.env["DATABASE_URL_V2"];
	if (!url || url.trim().length === 0) {
		return {
			available: false,
			reason:
				"DATABASE_URL_V2 is not set; skipping DB-backed integration tests.",
		};
	}

	const dbName = extractDatabaseName(url);
	if (!dbName) {
		return {
			available: false,
			reason: `DATABASE_URL_V2 does not contain a database name: ${redact(url)}`,
		};
	}
	if (!/test/i.test(dbName)) {
		return {
			available: false,
			reason:
				`Refusing to run integration tests against database "${dbName}" — ` +
				"the database name must contain 'test' (case-insensitive) to " +
				"enable destructive operations.",
		};
	}

	let client: PrismaClientLike;
	try {
		client = getPrismaClient();
	} catch (err) {
		return {
			available: false,
			reason: `Could not load Prisma v2 client: ${
				err instanceof Error ? err.message : String(err)
			}`,
		};
	}

	try {
		await client.$connect();
	} catch (err) {
		return {
			available: false,
			reason: `Could not connect to PostgreSQL at ${redact(url)}: ${
				err instanceof Error ? err.message : String(err)
			}`,
		};
	}

	return { available: true, client };
}

/**
 * Best-effort cleanup. Refuses to run if the database name does not
 * contain `test`. Deletes child rows before parents in the order that
 * matches the v2 schema's FK graph.
 */
export async function resetIntegrationDb(
	client: PrismaClientLike
): Promise<void> {
	const url = process.env["DATABASE_URL_V2"] ?? "";
	const dbName = extractDatabaseName(url);
	if (!dbName || !/test/i.test(dbName)) {
		throw new Error(
			"resetIntegrationDb: refusing to wipe a non-test database " +
				`(${dbName ?? "unknown"}).`
		);
	}
	// Delete order: children first, then parents.
	const orderedDeletes = [
		"soilLabValue",
		"soilReport",
		"soilInterpretation",
		"soilChemistryResult",
		"soilPhysicsResult",
		"soilChemistryInput",
		"soilTextureInput",
		"soilTest",
		"soilSample",
		"project",
	] as const;
	for (const model of orderedDeletes) {
		try {
			// `deleteMany` is not on PrismaClientLike; reach for the real method.
			const delegate = (client as unknown as Record<string, { deleteMany?: () => Promise<unknown> }>)[
				model
			];
			if (delegate?.deleteMany) {
				await delegate.deleteMany();
			}
		} catch {
			// Ignore — table may not exist if migrations are partial. The
			// integration test will fail on the first real assertion if the
			// schema is genuinely missing.
		}
	}
}

/** Releases the cached client so subsequent suites pick up env changes. */
export async function releaseIntegrationDb(
	client: PrismaClientLike
): Promise<void> {
	try {
		await client.$disconnect();
	} catch {
		// ignore
	}
	setPrismaClientForTesting(null);
}

function extractDatabaseName(url: string): string | null {
	try {
		const u = new URL(url);
		const path = u.pathname.replace(/^\//, "");
		return path.length > 0 ? path : null;
	} catch {
		return null;
	}
}

function redact(url: string): string {
	return url.replace(/\/\/[^@]+@/, "//***:***@");
}
