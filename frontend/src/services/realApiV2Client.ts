/**
 * FlahaSOIL v2 — fetch-backed API client.
 *
 * Implements the `ApiV2Client` interface against the v2 Express
 * backend. The base URL is read from `VITE_API_BASE_URL` and must
 * include the `/api/v2` prefix (see `frontend/.env.example`).
 *
 * Hard rules:
 *   - All response shapes are typed via `@flaha/shared-types` — no
 *     ad-hoc DTOs are defined here.
 *   - Non-2xx responses are decoded through the standard
 *     `ApiErrorResponse` envelope and re-thrown as `ApiClientError`,
 *     which preserves the status code and the typed `code` field.
 *   - This client never falls back to the mock; switching is the job
 *     of `apiClientProvider.ts`.
 */
import {
	type AuthLoginResponse,
	type AuthLogoutResponse,
	type AuthMeResponse,
	type AuthRefreshResponse,
	type AuthRegisterResponse,
	type CalculateSoilTestRequest,
	type CalculateSoilTestResponse,
	type CreateProjectRequest,
	type CreateProjectResponse,
	type CreateSoilReportRequest,
	type CreateSoilReportResponse,
	type CreateSoilSampleRequest,
	type CreateSoilSampleResponse,
	type CreateSoilTestRequest,
	type CreateSoilTestResponse,
	type FlahaCalcExportResponse,
	type GenerateReportRequest,
	type GenerateReportResponse,
	type GetCurrentUserResponse,
	type GetProjectResponse,
	type GetReportResponse,
	type GetReportVersionResponse,
	type GetSoilInterpretationResponse,
	type GetSoilSampleResponse,
	type GetSoilTestReportResponse,
	type GetSoilTestReportSummaryResponse,
	type GetSoilTestResponse,
	type ListProjectReportsResponse,
	type ListProjectsQuery,
	type ListProjectsResponse,
	type ListReportVersionsResponse,
	type LoginRequest,
	type PatchReportRequest,
	type PatchReportResponse,
	type RegenerateReportResponse,
	type RegisterRequest,
	type SwitchOrganizationRequest,
	type SwitchOrganizationResponse,
	type UserMembershipsResponse,
	isApiErrorResponse,
} from "@flaha/shared-types";
import type { ApiErrorCode } from "@flaha/shared-types";

import type { ApiV2Client } from "./apiV2Client";
import { getAccessToken } from "../auth/accessTokenStore";
import { coordinatedRefresh } from "../auth/refreshCoordinator";

const DEFAULT_BASE_URL = "http://localhost:3002/api/v2";

function getBaseUrl(): string {
	const fromEnv = import.meta.env.VITE_API_BASE_URL;
	const url =
		typeof fromEnv === "string" && fromEnv.length > 0
			? fromEnv
			: DEFAULT_BASE_URL;
	return url.replace(/\/+$/, "");
}

/**
 * Phase 9A-G: every request runs with `credentials: include` so the
 * HttpOnly refresh-token cookie is sent on `/auth/refresh` and
 * `/auth/logout`. The in-memory access token (if any) is attached as a
 * `Bearer` token; the dev-user-id header is gone — the backend no
 * longer accepts it in production and the SPA must not depend on it.
 */
function buildHeaders(extra?: Record<string, string>): HeadersInit {
	const headers: Record<string, string> = {
		Accept: "application/json",
		...(extra ?? {}),
	};
	const snap = getAccessToken();
	if (snap) headers.Authorization = `Bearer ${snap.token}`;
	return headers;
}

export class ApiClientError extends Error {
	public readonly status: number;
	public readonly code: ApiErrorCode;
	public readonly details: unknown;

	constructor(
		status: number,
		code: ApiErrorCode,
		message: string,
		details: unknown
	) {
		super(message);
		this.name = "ApiClientError";
		this.status = status;
		this.code = code;
		this.details = details;
	}
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
	let body: unknown = null;
	const text = await res.text();
	if (text.length > 0) {
		try {
			body = JSON.parse(text);
		} catch {
			body = null;
		}
	}
	if (!res.ok) {
		if (isApiErrorResponse(body)) {
			throw new ApiClientError(
				res.status,
				body.error.code,
				body.error.message,
				body.error.details
			);
		}
		throw new ApiClientError(
			res.status,
			"INTERNAL_ERROR",
			`HTTP ${res.status} ${res.statusText}`,
			body
		);
	}
	return body as T;
}

/**
 * Single source of truth for outgoing fetches against the v2 API.
 *
 * Phase 9A-G behaviour:
 *   - `credentials: "include"` so the HttpOnly refresh cookie is sent
 *     on `/auth/refresh` and `/auth/logout`.
 *   - On 401 we ask the refresh coordinator for a fresh access token.
 *     If we get one, we retry the original request ONCE with the new
 *     Bearer header. If refresh fails, we surface the original 401.
 *   - The auth endpoints opt out of the retry loop by passing
 *     `retryOn401: false` — a 401 from `/auth/refresh` IS the logout
 *     signal and must propagate.
 */
interface FetchOptions {
	method: "GET" | "POST" | "PATCH";
	body?: unknown;
	retryOn401?: boolean;
}

async function apiFetch<T>(path: string, opts: FetchOptions): Promise<T> {
	const url = `${getBaseUrl()}${path}`;
	const hasBody = opts.body !== undefined;
	const init: RequestInit = {
		method: opts.method,
		credentials: "include",
		headers: buildHeaders(
			hasBody ? { "Content-Type": "application/json" } : undefined
		),
	};
	if (hasBody) init.body = JSON.stringify(opts.body);

	let res = await fetch(url, init);

	if (res.status === 401 && (opts.retryOn401 ?? true)) {
		const snap = await coordinatedRefresh();
		if (snap) {
			// Rebuild headers so the new Bearer token is picked up.
			const retryInit: RequestInit = {
				method: opts.method,
				credentials: "include",
				headers: buildHeaders(
					hasBody ? { "Content-Type": "application/json" } : undefined
				),
			};
			if (hasBody) retryInit.body = JSON.stringify(opts.body);
			res = await fetch(url, retryInit);
		}
	}

	return parseJsonOrThrow<T>(res);
}

function getJson<T>(path: string): Promise<T> {
	return apiFetch<T>(path, { method: "GET" });
}

function postJson<T>(path: string, body: unknown): Promise<T> {
	return apiFetch<T>(path, { method: "POST", body });
}

function patchJson<T>(path: string, body: unknown): Promise<T> {
	return apiFetch<T>(path, { method: "PATCH", body });
}

/** POST helper for `/auth/*` — never retries on 401. */
function postAuthJson<T>(path: string, body: unknown): Promise<T> {
	return apiFetch<T>(path, { method: "POST", body, retryOn401: false });
}

export const realApiV2Client: ApiV2Client = {
	getMe() {
		return getJson<GetCurrentUserResponse>("/me");
	},

	// ---------------------------------------------------------------
	// Phase 9A-G — Auth
	// ---------------------------------------------------------------
	register(body: RegisterRequest) {
		return postAuthJson<AuthRegisterResponse>("/auth/register", body);
	},

	login(body: LoginRequest) {
		return postAuthJson<AuthLoginResponse>("/auth/login", body);
	},

	refresh() {
		// No body — the refresh token lives in the cookie.
		return postAuthJson<AuthRefreshResponse>("/auth/refresh", {});
	},

	logout() {
		// Uses Bearer token (logout is JWT-protected) AND clears the
		// refresh cookie server-side. retryOn401 stays the default
		// (true) so a stale access token can be refreshed once before
		// logout; if the refresh ALSO fails we surface the 401 and
		// the caller treats the session as already gone.
		return postJson<AuthLogoutResponse>("/auth/logout", {});
	},

	authMe() {
		return getJson<AuthMeResponse>("/auth/me");
	},

	// Phase 9A-H — tenant listing + switching.
	listMyOrganizations() {
		return getJson<UserMembershipsResponse>("/me/organizations");
	},

	switchOrganization(body: SwitchOrganizationRequest) {
		// Routed under `/auth/*` because it rotates the access token.
		// `postJson` (not `postAuthJson`) keeps the standard retry-on-401
		// path active so a transparently-refreshed access token can be
		// used to perform the switch.
		return postJson<SwitchOrganizationResponse>(
			"/auth/switch-organization",
			body
		);
	},

	createProject(body: CreateProjectRequest) {
		return postJson<CreateProjectResponse>("/projects", body);
	},

	listProjects(query: ListProjectsQuery) {
		const params = new URLSearchParams();
		if (query.status !== undefined) params.set("status", query.status);
		const qs = params.toString();
		return getJson<ListProjectsResponse>(
			qs.length > 0 ? `/projects?${qs}` : "/projects"
		);
	},

	getProjectById(projectId: string) {
		return getJson<GetProjectResponse>(
			`/projects/${encodeURIComponent(projectId)}`
		);
	},

	createSoilSample(body: CreateSoilSampleRequest) {
		return postJson<CreateSoilSampleResponse>("/soil-samples", body);
	},

	getSoilSample(sampleId: string) {
		return getJson<GetSoilSampleResponse>(
			`/soil-samples/${encodeURIComponent(sampleId)}`
		);
	},

	createSoilTest(body: CreateSoilTestRequest) {
		return postJson<CreateSoilTestResponse>("/soil-tests", body);
	},

	getSoilTest(soilTestId: string) {
		return getJson<GetSoilTestResponse>(
			`/soil-tests/${encodeURIComponent(soilTestId)}`
		);
	},

	calculateSoilTest(soilTestId: string, body: CalculateSoilTestRequest) {
		return postJson<CalculateSoilTestResponse>(
			`/soil-tests/${encodeURIComponent(soilTestId)}/calculate`,
			body
		);
	},

	getSoilInterpretation(soilTestId: string) {
		return getJson<GetSoilInterpretationResponse>(
			`/soil-tests/${encodeURIComponent(soilTestId)}/interpretation`
		);
	},

	createSoilReport(soilTestId: string, body: CreateSoilReportRequest) {
		return postJson<CreateSoilReportResponse>(
			`/soil-tests/${encodeURIComponent(soilTestId)}/reports`,
			body
		);
	},

	getSoilTestReport(soilTestId: string) {
		return getJson<GetSoilTestReportResponse>(
			`/soil-tests/${encodeURIComponent(soilTestId)}/report`
		);
	},

	getSoilTestReportSummary(soilTestId: string) {
		return getJson<GetSoilTestReportSummaryResponse>(
			`/soil-tests/${encodeURIComponent(soilTestId)}/report?format=summary`
		);
	},

	getFlahaCalcExport(soilTestId: string) {
		return getJson<FlahaCalcExportResponse>(
			`/soil-tests/${encodeURIComponent(soilTestId)}/flahacalc-export`
		);
	},

	// Phase 8D — Report management surface.
	generateReport(soilTestId: string, body: GenerateReportRequest) {
		return postJson<GenerateReportResponse>(
			`/soil-tests/${encodeURIComponent(soilTestId)}/reports`,
			body
		);
	},

	listProjectReports(projectId: string) {
		return getJson<ListProjectReportsResponse>(
			`/projects/${encodeURIComponent(projectId)}/reports`
		);
	},

	getReport(reportId: string) {
		return getJson<GetReportResponse>(
			`/reports/${encodeURIComponent(reportId)}`
		);
	},

	listReportVersions(reportId: string) {
		return getJson<ListReportVersionsResponse>(
			`/reports/${encodeURIComponent(reportId)}/versions`
		);
	},

	getReportVersion(reportId: string, versionNumber: number) {
		return getJson<GetReportVersionResponse>(
			`/reports/${encodeURIComponent(reportId)}/versions/${versionNumber}`
		);
	},

	regenerateReport(reportId: string) {
		return postJson<RegenerateReportResponse>(
			`/reports/${encodeURIComponent(reportId)}/regenerate`,
			{}
		);
	},

	patchReport(reportId: string, body: PatchReportRequest) {
		return patchJson<PatchReportResponse>(
			`/reports/${encodeURIComponent(reportId)}`,
			body
		);
	},

	getReportVersionPreviewUrl(reportId: string, versionNumber: number) {
		return (
			`${getBaseUrl()}/reports/${encodeURIComponent(reportId)}` +
			`/versions/${versionNumber}/preview`
		);
	},
};
