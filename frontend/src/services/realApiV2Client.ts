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
	type GetCurrentUserResponse,
	type GetProjectResponse,
	type GetSoilInterpretationResponse,
	type GetSoilSampleResponse,
	type GetSoilTestReportResponse,
	type GetSoilTestReportSummaryResponse,
	type GetSoilTestResponse,
	type ListProjectsQuery,
	type ListProjectsResponse,
	isApiErrorResponse,
} from "@flaha/shared-types";
import type { ApiErrorCode } from "@flaha/shared-types";

import type { ApiV2Client } from "./apiV2Client";
import { getStoredDevUserId } from "../session/devSessionStorage";

const DEFAULT_BASE_URL = "http://localhost:3002/api/v2";
const DEV_USER_HEADER = "x-dev-user-id";

function getBaseUrl(): string {
	const fromEnv = import.meta.env.VITE_API_BASE_URL;
	const url =
		typeof fromEnv === "string" && fromEnv.length > 0
			? fromEnv
			: DEFAULT_BASE_URL;
	return url.replace(/\/+$/, "");
}

/**
 * Phase 8B: every request includes the persisted dev-user id so the
 * backend's `devSessionMiddleware` resolves the same session across
 * reloads. The header is omitted on the very first boot (before
 * /me has populated it) — the backend falls back to the seeded
 * `user_dev_admin` in that case.
 */
function buildHeaders(extra?: Record<string, string>): HeadersInit {
	const headers: Record<string, string> = {
		Accept: "application/json",
		...(extra ?? {}),
	};
	const devUserId = getStoredDevUserId();
	if (devUserId) headers[DEV_USER_HEADER] = devUserId;
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

async function getJson<T>(path: string): Promise<T> {
	const res = await fetch(`${getBaseUrl()}${path}`, {
		method: "GET",
		headers: buildHeaders(),
	});
	return parseJsonOrThrow<T>(res);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`${getBaseUrl()}${path}`, {
		method: "POST",
		headers: buildHeaders({ "Content-Type": "application/json" }),
		body: JSON.stringify(body),
	});
	return parseJsonOrThrow<T>(res);
}

export const realApiV2Client: ApiV2Client = {
	getMe() {
		return getJson<GetCurrentUserResponse>("/me");
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
};
