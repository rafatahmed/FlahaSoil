/**
 * FlahaSOIL v2 — Prisma seed script (Phase 8B).
 *
 * Idempotent seed for development / test environments. Currently
 * ensures the seeded dev user exists; designed to be extended as new
 * fixture data (templates, demo projects) is added in later phases.
 *
 * Run with:
 *   npm run prisma:seed:v2 --workspace @flaha/api
 *
 * The script aborts loudly when invoked against NODE_ENV=production
 * so a misconfigured CI job cannot silently insert dev fixtures into
 * the production database.
 */

import { ensureDevUser } from "../src/auth/currentUser";
import { seedFlahaDemoOrganization } from "./seedDemoOrganization";

async function main(): Promise<void> {
	if (process.env.NODE_ENV === "production") {
		throw new Error(
			"Refusing to run dev seed under NODE_ENV=production. " +
				"This script only writes development fixtures."
		);
	}
	const user = await ensureDevUser();
	// eslint-disable-next-line no-console
	console.log(
		`[seed] dev user ensured (id=${user.id}, role=${user.role}, email=${user.email})`
	);

	// Phase 9A-K — Flaha Demo Organization with one user per role so
	// the multi-tenant UX (login, tenant switcher, role matrix) can be
	// driven without hand-rolling accounts through /auth/register.
	const demo = await seedFlahaDemoOrganization();
	// eslint-disable-next-line no-console
	console.log(
		`[seed] Flaha Demo Organization ensured (id=${demo.organizationId})`
	);
	for (const u of demo.users) {
		// eslint-disable-next-line no-console
		console.log(`[seed]   - ${u.email}  role=${u.role}  id=${u.userId}`);
	}
}

main()
	.then(() => process.exit(0))
	.catch((err: unknown) => {
		// eslint-disable-next-line no-console
		console.error("[seed] failed:", err);
		process.exit(1);
	});
