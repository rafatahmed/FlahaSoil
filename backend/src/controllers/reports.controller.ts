/**
 * FlahaSOIL v2 API — Report HTTP controllers (Phase 8D F → 9A-D.5).
 *
 * Thin Express handlers for the report management surface:
 *   - POST   /soil-tests/:soilTestId/reports           (generate v1)
 *   - GET    /projects/:projectId/reports              (list)
 *   - GET    /reports/:reportId                        (detail + versions)
 *   - GET    /reports/:reportId/versions               (versions index)
 *   - GET    /reports/:reportId/versions/:versionNumber (snapshot)
 *   - POST   /reports/:reportId/regenerate             (append version)
 *   - PATCH  /reports/:reportId                        (title/archive)
 *
 * Tenancy: every route is gated by `requireSoilTestAccess`,
 * `requireProjectAccess`, or `requireReportAccess` at the route table,
 * which call `assert*Tenancy` before the handler runs. Cross-tenant
 * ids surface as 404 so the API never leaks row existence. The
 * controllers pull only `userId` (audit attribution) from
 * `req.authSession`.
 */

import type { Request, Response } from "express";

import { getAuthSession } from "../auth/guards";
import {
	generateReport,
	getReport,
	getVersion,
	listProjectReports,
	listVersions,
	patchReport,
	regenerateReport,
	renderVersionHtml,
} from "../services/reports.service";
import { ApiError } from "../utils/apiError";
import {
	createSoilReportSchema,
	patchReportSchema,
} from "../validation/schemas";

function readReportId(req: Request): string {
	const id = req.params["reportId"];
	if (!id) throw ApiError.validation("reportId path parameter is required");
	return id;
}

function readVersionNumber(req: Request): number {
	const raw = req.params["versionNumber"];
	if (!raw) throw ApiError.validation("versionNumber path parameter is required");
	const n = parseInt(raw, 10);
	if (!Number.isFinite(n) || n < 1) {
		throw ApiError.validation(`versionNumber must be a positive integer (got '${raw}')`);
	}
	return n;
}

export async function postGenerateReport(
	req: Request,
	res: Response
): Promise<void> {
	const session = getAuthSession(req);
	const soilTestId = req.params["soilTestId"];
	if (!soilTestId) {
		throw ApiError.validation("soilTestId path parameter is required");
	}
	const parsed = createSoilReportSchema.parse(req.body ?? {});
	const result = await generateReport(soilTestId, parsed, session.userId);
	res.status(201).json(result);
}

export async function getProjectReports(
	req: Request,
	res: Response
): Promise<void> {
	const projectId = req.params["projectId"];
	if (!projectId) {
		throw ApiError.validation("projectId path parameter is required");
	}
	const result = await listProjectReports(projectId);
	res.status(200).json(result);
}

export async function getReportById(
	req: Request,
	res: Response
): Promise<void> {
	const reportId = readReportId(req);
	const result = await getReport(reportId);
	res.status(200).json(result);
}

export async function getReportVersions(
	req: Request,
	res: Response
): Promise<void> {
	const reportId = readReportId(req);
	const result = await listVersions(reportId);
	res.status(200).json(result);
}

export async function getReportVersion(
	req: Request,
	res: Response
): Promise<void> {
	const reportId = readReportId(req);
	const versionNumber = readVersionNumber(req);
	const version = await getVersion(reportId, versionNumber);
	res.status(200).json({ version });
}

export async function postRegenerateReport(
	req: Request,
	res: Response
): Promise<void> {
	const session = getAuthSession(req);
	const reportId = readReportId(req);
	const result = await regenerateReport(reportId, session.userId);
	res.status(201).json(result);
}

export async function getReportVersionPreview(
	req: Request,
	res: Response
): Promise<void> {
	const reportId = readReportId(req);
	const versionNumber = readVersionNumber(req);
	const { html } = await renderVersionHtml(reportId, versionNumber);
	// Phase 9A-I — the global Helmet CSP is `default-src 'none'` for
	// JSON API responses. This endpoint is the one exception: it serves
	// a fully self-contained HTML document with inline <style>. Allow
	// inline styles for this response only; no scripts, no external
	// resources, no framing. `frame-ancestors 'none'` keeps the preview
	// from being embedded by a third-party page.
	res.setHeader(
		"Content-Security-Policy",
		"default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src data:; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
	);
	res.status(200).type("html").send(html);
}

export async function patchReportById(
	req: Request,
	res: Response
): Promise<void> {
	const reportId = readReportId(req);
	const parsed = patchReportSchema.parse(req.body ?? {});
	const result = await patchReport(reportId, parsed);
	res.status(200).json(result);
}
