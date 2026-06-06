/**
 * FlahaSOIL v2 API — email provider abstraction (Phase 9B-E).
 *
 * The invitation pipeline (Phase 9B) needs to deliver a one-time
 * accept-link to the invitee. Production will plug this into a
 * transactional email service (Postmark / SES / SendGrid); the v2
 * scaffolding only needs an abstraction stable enough that the
 * controller code does not change when the production adapter is
 * wired in.
 *
 * Hard rules — DO NOT relax without explicit security review:
 *   1. The provider receives the FULLY-RENDERED accept link including
 *      the raw invitation token. The token is already a one-shot
 *      secret; the provider MUST NOT log it outside of a development
 *      build (see `ConsoleEmailProvider`).
 *   2. Providers MUST NOT persist the message body to disk in
 *      production. The console implementation logs to stdout because
 *      a developer is the only audience.
 *   3. Errors thrown from `send` propagate to the caller. The
 *      invitation controller treats a failed send as a hard failure
 *      and rolls back the invitation row.
 */

import { env } from "../config/env";
import { logger } from "../utils/logger";

/**
 * Minimal payload the invitation flow needs to deliver. Kept small on
 * purpose: each call site builds the exact shape, no provider-specific
 * extensions allowed at this layer.
 */
export interface InvitationEmailPayload {
	/** Canonicalised invitee email (trim + lowercase). */
	to: string;
	/** Display name of the organization extending the invitation. */
	organizationName: string;
	/** Display name of the user who issued the invitation. */
	inviterDisplayName: string;
	/** Role the invitee will hold on acceptance, for body copy. */
	role: string;
	/**
	 * Fully-rendered accept URL including the raw token query param.
	 * Treat this string as a secret — never echo it in production logs.
	 */
	acceptUrl: string;
	/** Absolute expiry time, used in body copy. */
	expiresAt: Date;
}

export interface EmailProvider {
	/**
	 * Deliver an invitation email. MUST throw on permanent failure so
	 * the invitation row can be rolled back; transient failures are the
	 * provider's responsibility to retry (the controller does not retry).
	 */
	sendInvitation(payload: InvitationEmailPayload): Promise<void>;
}

// ---------------------------------------------------------------------------
// Console provider — dev/test default
// ---------------------------------------------------------------------------

/**
 * Default provider for development and tests. Logs the invitation
 * payload to stdout via the structured logger so the developer can
 * copy/paste the accept link.
 *
 * Production safety:
 *   - Refuses to log the raw `acceptUrl` (which contains the token)
 *     when `NODE_ENV=production`. The token-bearing URL is replaced
 *     with `<redacted>` and an error-level log is emitted to make the
 *     misconfiguration obvious.
 *   - Never throws — a missing real provider in production is a
 *     deploy-time problem, not a per-invitation failure.
 */
export class ConsoleEmailProvider implements EmailProvider {
	async sendInvitation(payload: InvitationEmailPayload): Promise<void> {
		const isProduction = env.nodeEnv === "production";
		if (isProduction) {
			logger.error("email.console_provider_in_production", {
				to: payload.to,
				organization: payload.organizationName,
				role: payload.role,
				expiresAt: payload.expiresAt.toISOString(),
				note: "Invitation accept URL was NOT delivered. Wire a real EmailProvider.",
			});
			return;
		}
		logger.info("email.invitation.dispatched", {
			to: payload.to,
			organization: payload.organizationName,
			inviter: payload.inviterDisplayName,
			role: payload.role,
			expiresAt: payload.expiresAt.toISOString(),
			acceptUrl: payload.acceptUrl,
		});
	}
}

// ---------------------------------------------------------------------------
// Singleton accessor
// ---------------------------------------------------------------------------

let _instance: EmailProvider | undefined;

/**
 * Returns the process-wide EmailProvider. The default is the console
 * provider; production deploys are expected to call
 * `setEmailProvider(...)` from the bootstrap path once a real adapter
 * lands.
 */
export function getEmailProvider(): EmailProvider {
	if (!_instance) _instance = new ConsoleEmailProvider();
	return _instance;
}

/**
 * Replace the active provider. Intended for the bootstrap layer and
 * for tests; not safe to call mid-request.
 */
export function setEmailProvider(provider: EmailProvider): void {
	_instance = provider;
}

/** Test-only — restore the default ConsoleEmailProvider. */
export function _resetEmailProviderForTesting(): void {
	_instance = undefined;
}
