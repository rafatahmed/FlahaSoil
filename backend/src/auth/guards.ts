/**
 * FlahaSOIL v2 API — authorization guards (Phase 9A-D).
 *
 * Composable Express middlewares that enforce the v2 role matrix on
 * top of the authSession resolved by `resolveAuthSession`. Each guard
 * is intentionally tiny so route tables read like a permission spec.
 *
 *   requireAuth                — must have a resolved session
 *   requireOrganization        — must have an active org membership
 *   requireOrgRole(...roles)   — active membership role ∈ roles
 *   requireProjectAccess(opts) — tenancy + (optional) role gate
 *   requireSampleAccess(opts)  — tenancy + (optional) role gate
 *   requireSoilTestAccess(opts)— tenancy + (optional) role gate
 *   requireReportAccess(opts)  — tenancy + (optional) role gate
 *
 * Semantics:
 *   - Missing/expired session → 401 (never leaks the failure mode).
 *   - Session present but no active org → 403.
 *   - Session OK but role insufficient → 403 with stable code.
 *   - Cross-tenant resource access → 404 (no existence leak — see
 *     `assert*Tenancy` helpers in `ownership.ts`).
 */

import type { NextFunction, Request, RequestHandler, Response } from "express";

import { OrganizationRole } from "@flaha/shared-types";

import { getMembershipForOrg } from "../services/organization.service";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler";

import type { AuthSession } from "./session.middleware";
import {
	assertProjectTenancy,
	assertReportTenancy,
	assertSampleTenancy,
	assertSoilTestTenancy,
} from "./ownership";

// Phase 9B — guard-resolved caller role for the path-target organization.
// Populated by `requireOrganizationMember` / `requireOrganizationAdmin` so
// downstream controllers can defer role-aware decisions (e.g. ADMIN may
// not demote OWNER) without re-querying the membership row.
declare module "express-serve-static-core" {
	interface Request {
		callerOrgRole?: OrganizationRole;
	}
}

// ---------------------------------------------------------------------------
// Role matrix presets
// ---------------------------------------------------------------------------

/** Roles that may manage org settings + memberships. */
export const ROLES_ADMIN: OrganizationRole[] = [
	OrganizationRole.OWNER,
	OrganizationRole.ADMIN,
];

/**
 * Phase 9B alias — kept distinct from `ROLES_ADMIN` so future tightening
 * of the org-admin matrix (e.g. requiring OWNER for destructive flows)
 * does not have to thread through every resource guard.
 */
export const ROLES_ORG_ADMIN: OrganizationRole[] = [
	OrganizationRole.OWNER,
	OrganizationRole.ADMIN,
];

/** Roles that may create/edit projects, samples, tests. */
export const ROLES_AGRONOMY_WRITE: OrganizationRole[] = [
	OrganizationRole.OWNER,
	OrganizationRole.ADMIN,
	OrganizationRole.AGRONOMIST,
];

/** Roles that may create/edit lab artefacts (samples + tests). */
export const ROLES_LAB_WRITE: OrganizationRole[] = [
	OrganizationRole.OWNER,
	OrganizationRole.ADMIN,
	OrganizationRole.AGRONOMIST,
	OrganizationRole.LAB_TECHNICIAN,
];

/** Roles that may generate/regenerate reports. */
export const ROLES_REPORT_WRITE: OrganizationRole[] = [
	OrganizationRole.OWNER,
	OrganizationRole.ADMIN,
	OrganizationRole.AGRONOMIST,
	OrganizationRole.CONSULTANT,
];

/** All roles — read-only endpoints accept the full matrix. */
export const ROLES_ANY: OrganizationRole[] = [
	OrganizationRole.OWNER,
	OrganizationRole.ADMIN,
	OrganizationRole.AGRONOMIST,
	OrganizationRole.LAB_TECHNICIAN,
	OrganizationRole.CONSULTANT,
	OrganizationRole.VIEWER,
];

// ---------------------------------------------------------------------------
// Primitive guards
// ---------------------------------------------------------------------------

export function getAuthSession(req: Request): AuthSession {
	if (!req.authSession) {
		throw ApiError.internal(
			"req.authSession is missing — resolveAuthSession must be mounted before this handler."
		);
	}
	return req.authSession;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
	if (!req.authSession) {
		next(ApiError.unauthorized("Authentication required."));
		return;
	}
	next();
};

export const requireOrganization: RequestHandler = (req, _res, next) => {
	const s = req.authSession;
	if (!s) {
		next(ApiError.unauthorized("Authentication required."));
		return;
	}
	if (!s.organizationId) {
		next(ApiError.forbidden("No active organization for this session."));
		return;
	}
	next();
};

export function requireOrgRole(
	...roles: OrganizationRole[]
): RequestHandler {
	return (req, _res, next) => {
		const s = req.authSession;
		if (!s) return next(ApiError.unauthorized("Authentication required."));
		if (!s.role) {
			return next(ApiError.forbidden("No active organization for this session."));
		}
		if (!roles.includes(s.role)) {
			return next(ApiError.forbidden("Insufficient role for this action."));
		}
		next();
	};
}

// ---------------------------------------------------------------------------
// Resource guards — combine tenancy assertion with optional role gate
// ---------------------------------------------------------------------------

export interface ResourceAccessOptions {
	/** Roles permitted for this access path. Defaults to ROLES_ANY (read). */
	roles?: OrganizationRole[];
	/** Express route param name carrying the resource id. */
	param?: string;
}

function makeResourceGuard(
	assertFn: (id: string, organizationId: string) => Promise<unknown>,
	defaultParam: string,
	resourceLabel: string
): (opts?: ResourceAccessOptions) => RequestHandler {
	return (opts = {}) => {
		const allowedRoles = opts.roles ?? ROLES_ANY;
		const paramName = opts.param ?? defaultParam;
		return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
			const s = req.authSession;
			if (!s) throw ApiError.unauthorized("Authentication required.");
			if (!s.organizationId || !s.role) {
				throw ApiError.forbidden("No active organization for this session.");
			}
			if (!allowedRoles.includes(s.role)) {
				throw ApiError.forbidden(
					`Insufficient role for this ${resourceLabel} action.`
				);
			}
			const id = req.params[paramName];
			if (typeof id !== "string" || id.length === 0) {
				throw ApiError.validation(`Missing path parameter: ${paramName}`);
			}
			await assertFn(id, s.organizationId);
			next();
		});
	};
}

export const requireProjectAccess = makeResourceGuard(
	assertProjectTenancy,
	"projectId",
	"project"
);
export const requireSampleAccess = makeResourceGuard(
	assertSampleTenancy,
	"sampleId",
	"sample"
);
export const requireSoilTestAccess = makeResourceGuard(
	assertSoilTestTenancy,
	"soilTestId",
	"soil test"
);
export const requireReportAccess = makeResourceGuard(
	assertReportTenancy,
	"reportId",
	"report"
);


// ---------------------------------------------------------------------------
// Phase 9B — organization-scoped guards
// ---------------------------------------------------------------------------

/**
 * Resolves the caller's role inside the path-target organization and
 * gates the route on it. Used by `requireOrganizationMember` and
 * `requireOrganizationAdmin`. Returns 404 when the caller has no
 * ACTIVE membership in the target org — existence is never leaked
 * across tenants (an outsider sees the same response as for a missing
 * org id).
 */
function makeOrgGuard(
	allowedRoles: OrganizationRole[],
	paramName = "organizationId"
): RequestHandler {
	return asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
		const s = req.authSession;
		if (!s) throw ApiError.unauthorized("Authentication required.");
		const orgId = req.params[paramName];
		if (typeof orgId !== "string" || orgId.length === 0) {
			throw ApiError.validation(`Missing path parameter: ${paramName}`);
		}
		const membership = await getMembershipForOrg(s.userId, orgId);
		if (!membership) {
			throw ApiError.notFound("Organization not found.");
		}
		if (!allowedRoles.includes(membership.role)) {
			throw ApiError.forbidden("Insufficient role for this organization action.");
		}
		req.callerOrgRole = membership.role;
		next();
	});
}

/** Any ACTIVE membership in the path-target org may pass. */
export const requireOrganizationMember: RequestHandler = makeOrgGuard(ROLES_ANY);

/** OWNER or ADMIN of the path-target org may pass. */
export const requireOrganizationAdmin: RequestHandler = makeOrgGuard(ROLES_ORG_ADMIN);
