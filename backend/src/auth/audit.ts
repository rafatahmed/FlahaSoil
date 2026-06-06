/**
 * FlahaSOIL v2 API — audit log helpers (Phase 9A-C).
 *
 * Two write modes, deliberately separate:
 *
 *   writeAuditTransactional(tx, ...)
 *       Used for SECURITY events that MUST land in the same DB
 *       transaction as the state change they describe (failed login
 *       counter, refresh-token reuse, role-change). Throws if the
 *       insert fails — that failure rolls back the parent tx, which is
 *       the desired behaviour.
 *
 *   writeAuditBestEffort(...)
 *       Used for BUSINESS events (project created, report generated,
 *       successful login, logout, register). Issued outside the
 *       primary transaction. Failures are LOGGED and SWALLOWED so a
 *       transient DB hiccup never turns a successful user action into
 *       a 5xx.
 *
 * Metadata redaction: NEVER place raw passwords, raw refresh tokens,
 * `tokenHash`, JWTs, or session cookies into `metadataJson`. Callers
 * are expected to populate `metadataJson` themselves; this module
 * cannot redact what it does not know about. Reviewers, please flag.
 */

import { getPrismaClient, type PrismaClientLike } from "../prisma/client";
import { logger } from "../utils/logger";

// Mirrors the Phase 9A `AuditAction` and `AuditSeverity` enums in
// prisma/v2-schema.prisma. Kept as string-literal unions instead of a
// runtime enum so the file has zero coupling to the generated client.
export type AuditAction =
	| "AUTH_REGISTER"
	| "AUTH_LOGIN"
	| "AUTH_LOGIN_FAILED"
	| "AUTH_LOGOUT"
	| "AUTH_REFRESH"
	| "AUTH_REFRESH_REUSE_DETECTED"
	| "AUTH_REFRESH_RATE_LIMITED"
	| "AUTH_LOGIN_RATE_LIMITED"
	| "AUTH_LOCKOUT"
	| "AUTH_TOKEN_REVOKED"
	| "ORG_CREATED"
	| "ORG_UPDATED"
	| "ORG_SWITCHED"
	| "MEMBERSHIP_CREATED"
	| "MEMBERSHIP_ROLE_CHANGED"
	| "MEMBERSHIP_REMOVED"
	| "INVITATION_CREATED"
	| "INVITATION_ACCEPTED"
	| "INVITATION_REVOKED"
	| "INVITATION_EXPIRED"
	| "PROJECT_CREATED"
	| "PROJECT_UPDATED"
	| "REPORT_GENERATED"
	| "REPORT_REGENERATED"
	| "REPORT_ARCHIVED"
	| "REPORT_RENAMED";

export type AuditSeverity = "INFO" | "WARNING" | "SECURITY";

export interface AuditEntry {
	action: AuditAction;
	severity?: AuditSeverity;
	/** Null for unauthenticated actions (e.g. AUTH_LOGIN_FAILED). */
	actorUserId?: string | null;
	/** Null for org-independent actions (registration, login). */
	organizationId?: string | null;
	requestId?: string | null;
	targetType?: string | null;
	targetId?: string | null;
	metadataJson?: Record<string, unknown> | null;
	ipAddress?: string | null;
	userAgent?: string | null;
}

function toCreateData(entry: AuditEntry): Record<string, unknown> {
	return {
		action: entry.action,
		severity: entry.severity ?? "INFO",
		actorUserId: entry.actorUserId ?? null,
		organizationId: entry.organizationId ?? null,
		requestId: entry.requestId ?? null,
		targetType: entry.targetType ?? null,
		targetId: entry.targetId ?? null,
		metadataJson: entry.metadataJson ?? undefined,
		ipAddress: entry.ipAddress ?? null,
		userAgent: entry.userAgent ?? null,
	};
}

/**
 * Writes an audit entry inside the supplied Prisma client/transaction.
 * Throws on failure — by design, callers are wrapping security-
 * sensitive ops where the audit row must be all-or-nothing with the
 * state change.
 */
export async function writeAuditTransactional(
	tx: PrismaClientLike,
	entry: AuditEntry
): Promise<void> {
	await tx.auditLog.create({ data: toCreateData(entry) });
}

/**
 * Writes an audit entry on the singleton Prisma client. Failures are
 * logged via the structured logger and SWALLOWED — the caller's
 * happy-path response is preserved.
 *
 * Returns a Promise so callers can `await` it if they want
 * deterministic ordering in tests; production code typically
 * fire-and-forgets.
 */
export async function writeAuditBestEffort(
	entry: AuditEntry
): Promise<void> {
	try {
		const prisma = getPrismaClient();
		await prisma.auditLog.create({ data: toCreateData(entry) });
	} catch (err) {
		logger.error("audit.write_failed", {
			action: entry.action,
			actorUserId: entry.actorUserId ?? null,
			err,
		});
	}
}
