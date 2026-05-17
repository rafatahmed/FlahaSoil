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

const DEFAULT_BASE_URL = "http://localhost:3002/api/v2";

function getBaseUrl(): string {
	const fromEnv = import.meta.env.VITE_API_BASE_URL;
	const url =
		typeof fromEnv === "string" && fromEnv.length > 0
			? fromEnv
			: DEFAULT_BASE_URL;
	return url.replace(/\/+$/, "");
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
		headers: { Accept: "application/json" },
	});
	return parseJsonOrThrow<T>(res);
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
	const res = await fetch(`${getBaseUrl()}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify(body),
	});
	return parseJsonOrThrow<T>(res);
}

export const realApiV2Client: ApiV2Client = {
	createProject(body: CreateProjectRequest) {
		return postJson<CreateProjectResponse>("/projects", body);
	},

	listProjects(query: ListProjectsQuery) {
		const params = new URLSearchParams({ userId: query.userId });
		if (query.status !== undefined) params.set("status", query.status);
		return getJson<ListProjectsResponse>(`/projects?${params.toString()}`);
	},

	getProjectById(projectId: string, userId: string) {
		const params = new URLSearchParams({ userId });
		return getJson<GetProjectResponse>(
			`/projects/${encodeURIComponent(projectId)}?${params.toString()}`
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
