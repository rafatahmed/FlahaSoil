/**
 * FlahaSOIL v2 API — Report generator & version manager (Phase 8D A.3 + A.4).
 *
 * Coordinates the immutable-snapshot lifecycle on `SoilReport` +
 * `ReportVersion`:
 *
 *   1. `generateReport(soilTestId, options, userId)`
 *      - creates (or reuses) a `SoilReport` row in `GENERATING`,
 *      - composes the full `ProfessionalReportDTO` via
 *        `composeProfessionalReport`,
 *      - writes a new `ReportVersion` (versionNumber = current+1) with
 *        the snapshot stored verbatim in `snapshotJson`,
 *      - flips `SoilReport.currentVersionId`, status=READY, generatedAt,
 *      - returns the report + version DTOs.
 *
 *   2. `regenerateReport(reportId, ...)` — same as above, but always
 *      appends a new version to an existing report (never overwrites).
 *
 *   3. `listVersions`, `getVersion`, `getReport`, `listProjectReports`,
 *      `patchReport` — read paths used by the report controller.
 *
 * Failure handling: any exception during composition is caught, a
 * FAILED `ReportVersion` is persisted with the `errorMessage`, the
 * report's status is flipped to FAILED, and the original error is
 * rethrown as an `ApiError.internal`.
 */

import type {
	GenerateReportRequest,
	GenerateReportResponse,
	GetReportResponse,
	ListProjectReportsResponse,
	ListReportVersionsResponse,
	PatchReportRequest,
	PatchReportResponse,
	ProfessionalReportDTO,
	ReportVersionDTO,
	ReportVersionSummaryDTO,
} from "@flaha/shared-types";
import { SoilReportStatus } from "@flaha/shared-types";

import { getPrismaClient } from "../prisma/client";
import { logger } from "../utils/logger";
import { ApiError } from "../utils/apiError";
import { toSoilReportDTO } from "../utils/serializers";

import { composeProfessionalReport } from "./report/composeProfessionalReport";
import { DefaultReportRenderer } from "./report/renderer";
import { buildSoilTestReport } from "./report.service";

export interface GenerateReportOptions extends GenerateReportRequest {}

/**
 * Generates the first (or a brand-new) report version for `soilTestId`.
 * If `reportId` is provided, appends a version to that report instead
 * of creating a new SoilReport row. The caller is responsible for
 * ownership enforcement before invoking this method.
 */
export async function generateReport(
	soilTestId: string,
	options: GenerateReportOptions,
	userId: string,
	existingReportId?: string
): Promise<GenerateReportResponse> {
	const prisma = getPrismaClient();

	const test = (await prisma.soilTest.findUnique({
		where: { id: soilTestId },
		include: {
			textureInput: true,
			chemistryInput: true,
			sample: { include: { project: { include: { owner: true } } } },
		},
	})) as Record<string, unknown> | null;
	if (!test) {
		throw ApiError.notFound(`SoilTest not found: ${soilTestId}`);
	}

	const sample = test["sample"] as Record<string, unknown> | null;
	const project = sample?.["project"] as Record<string, unknown> | null;
	const user = (project?.["owner"] as Record<string, unknown> | null) ?? null;
	const chemistryInputRow =
		(test["chemistryInput"] as Record<string, unknown> | null) ?? null;
	const textureInputRow =
		(test["textureInput"] as Record<string, unknown> | null) ?? null;

	const reportRow = await ensureReportRow(soilTestId, options, existingReportId);
	const nextVersion = await nextVersionNumber(reportRow["id"] as string);

	let snapshot: ProfessionalReportDTO | null = null;
	let errorMessage: string | null = null;
	try {
		const envelope = await buildSoilTestReport(soilTestId);
		const reportNumber =
			options.reportNumber ??
			(reportRow["reportNumber"] as string | null | undefined) ??
			deriveReportNumber(project, nextVersion);
		const reportTitle =
			options.title ??
			(reportRow["title"] as string | null | undefined) ??
			deriveTitle(sample, envelope.metadata.testLevel);
		snapshot = composeProfessionalReport({
			envelope,
			sampleRow: sample ?? {},
			projectRow: project,
			userRow: user,
			chemistryInputRow,
			textureInputRow,
			meta: {
				reportNumber,
				reportTitle,
				reportDate: new Date().toISOString(),
				...(options.cover ? { coverOverrides: options.cover } : {}),
			},
		});
	} catch (err) {
		errorMessage = err instanceof Error ? err.message : String(err);
		logger.warn("reports.generate.compose_failed", {
			soilTestId,
			reportId: reportRow["id"],
			error: errorMessage,
		});
	}

	const versionRow = await writeVersionTransaction({
		reportId: reportRow["id"] as string,
		versionNumber: nextVersion,
		snapshot,
		errorMessage,
		userId,
		reportNumber: snapshot?.cover.reportNumber ?? null,
		title: snapshot?.cover.reportTitle ?? null,
	});

	if (errorMessage !== null) {
		throw ApiError.internal(
			`Report generation failed: ${errorMessage}`
		);
	}

	const refreshedReport = (await prisma.soilReport.findUnique({
		where: { id: reportRow["id"] as string },
		include: { currentVersion: true },
	})) as Record<string, unknown>;

	return {
		report: toSoilReportDTO(refreshedReport),
		version: toReportVersionDTO(versionRow),
	};
}

export async function regenerateReport(
	reportId: string,
	userId: string
): Promise<GenerateReportResponse> {
	const prisma = getPrismaClient();
	const existing = (await prisma.soilReport.findUnique({
		where: { id: reportId },
	})) as Record<string, unknown> | null;
	if (!existing) {
		throw ApiError.notFound(`SoilReport not found: ${reportId}`);
	}
	return generateReport(
		existing["soilTestId"] as string,
		{},
		userId,
		reportId
	);
}

export async function listProjectReports(
	projectId: string
): Promise<ListProjectReportsResponse> {
	const prisma = getPrismaClient();
	// Reports belong to soil tests, which belong to samples, which belong
	// to projects — walk the chain via a single nested where.
	const rows = (await prisma.soilReport.findMany({
		where: { soilTest: { sample: { projectId } }, archived: false },
		orderBy: { updatedAt: "desc" },
		include: { currentVersion: true },
	})) as Record<string, unknown>[];
	return { reports: rows.map(toSoilReportDTO) };
}

export async function getReport(reportId: string): Promise<GetReportResponse> {
	const prisma = getPrismaClient();
	const row = (await prisma.soilReport.findUnique({
		where: { id: reportId },
		include: {
			currentVersion: true,
			versions: { orderBy: { versionNumber: "desc" } },
		},
	})) as Record<string, unknown> | null;
	if (!row) {
		throw ApiError.notFound(`SoilReport not found: ${reportId}`);
	}
	const versions = (row["versions"] as Record<string, unknown>[]).map(
		toReportVersionSummaryDTO
	);
	const currentVersionRow = row["currentVersion"] as
		| Record<string, unknown>
		| null;
	return {
		report: toSoilReportDTO(row),
		versions,
		currentVersion: currentVersionRow ? toReportVersionDTO(currentVersionRow) : null,
	};
}

export async function listVersions(
	reportId: string
): Promise<ListReportVersionsResponse> {
	const prisma = getPrismaClient();
	const rows = (await prisma.reportVersion.findMany({
		where: { reportId },
		orderBy: { versionNumber: "desc" },
	})) as Record<string, unknown>[];
	return { versions: rows.map(toReportVersionSummaryDTO) };
}

export async function getVersion(
	reportId: string,
	versionNumber: number
): Promise<ReportVersionDTO> {
	const prisma = getPrismaClient();
	const row = (await prisma.reportVersion.findUnique({
		where: {
			reportId_versionNumber: { reportId, versionNumber },
		},
	})) as Record<string, unknown> | null;
	if (!row) {
		throw ApiError.notFound(
			`ReportVersion not found: report=${reportId} v=${versionNumber}`
		);
	}
	return toReportVersionDTO(row);
}

/**
 * Renders a specific report version to a self-contained HTML document.
 * Used by the preview endpoint and (later) the PDF/email pipeline.
 */
export async function renderVersionHtml(
	reportId: string,
	versionNumber: number
): Promise<{ html: string; bytes: number; versionNumber: number }> {
	const version = await getVersion(reportId, versionNumber);
	if (version.status !== SoilReportStatus.READY || !version.snapshot) {
		throw ApiError.validation(
			`Cannot render report version ${versionNumber}: status=${version.status}`
		);
	}
	const renderer = new DefaultReportRenderer();
	const { html, bytes } = renderer.render(version.snapshot);
	return { html, bytes, versionNumber };
}

export async function patchReport(
	reportId: string,
	patch: PatchReportRequest
): Promise<PatchReportResponse> {
	const prisma = getPrismaClient();
	const data: Record<string, unknown> = {};
	if (typeof patch.title === "string") data["title"] = patch.title;
	if (typeof patch.archived === "boolean") data["archived"] = patch.archived;
	const row = (await prisma.soilReport.update({
		where: { id: reportId },
		data,
		include: { currentVersion: true },
	})) as Record<string, unknown>;
	return { report: toSoilReportDTO(row) };
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

async function ensureReportRow(
	soilTestId: string,
	options: GenerateReportOptions,
	existingReportId?: string
): Promise<Record<string, unknown>> {
	const prisma = getPrismaClient();
	if (existingReportId) {
		const existing = (await prisma.soilReport.update({
			where: { id: existingReportId },
			data: {
				status: SoilReportStatus.GENERATING,
				...(options.title ? { title: options.title } : {}),
			},
		})) as Record<string, unknown>;
		return existing;
	}
	const created = (await prisma.soilReport.create({
		data: {
			soilTestId,
			status: SoilReportStatus.GENERATING,
			reportType: "PROFESSIONAL_V1",
			...(options.title ? { title: options.title } : {}),
			...(options.reportNumber ? { reportNumber: options.reportNumber } : {}),
		},
	})) as Record<string, unknown>;
	return created;
}

async function nextVersionNumber(reportId: string): Promise<number> {
	const prisma = getPrismaClient();
	const max = (await prisma.reportVersion.findFirst({
		where: { reportId },
		orderBy: { versionNumber: "desc" },
		select: { versionNumber: true },
	})) as { versionNumber: number } | null;
	return (max?.versionNumber ?? 0) + 1;
}

interface WriteVersionArgs {
	reportId: string;
	versionNumber: number;
	snapshot: ProfessionalReportDTO | null;
	errorMessage: string | null;
	userId: string;
	reportNumber: string | null;
	title: string | null;
}

async function writeVersionTransaction(
	args: WriteVersionArgs
): Promise<Record<string, unknown>> {
	const prisma = getPrismaClient();
	const status =
		args.errorMessage !== null
			? SoilReportStatus.FAILED
			: SoilReportStatus.READY;
	const snapshotJson =
		args.snapshot ?? ({ error: args.errorMessage } as Record<string, unknown>);
	const overallSoilRating =
		args.snapshot?.agronomic?.overallSoilRating ?? null;
	const textureClass = args.snapshot?.texture?.usdaClass ?? null;

	return prisma.$transaction(async (tx) => {
		const version = (await tx.reportVersion.create({
			data: {
				reportId: args.reportId,
				versionNumber: args.versionNumber,
				snapshotJson: snapshotJson as object,
				status,
				generatedByUserId: args.userId,
				...(overallSoilRating ? { overallSoilRating } : {}),
				...(textureClass ? { textureClass } : {}),
				...(args.errorMessage ? { errorMessage: args.errorMessage } : {}),
			},
		})) as Record<string, unknown>;

		const reportUpdate: Record<string, unknown> = { status };
		if (status === SoilReportStatus.READY) {
			reportUpdate["currentVersionId"] = version["id"];
			reportUpdate["generatedAt"] = new Date();
			if (args.title) reportUpdate["title"] = args.title;
			if (args.reportNumber) reportUpdate["reportNumber"] = args.reportNumber;
		}
		await tx.soilReport.update({
			where: { id: args.reportId },
			data: reportUpdate,
		});
		return version;
	}) as Promise<Record<string, unknown>>;
}

function toReportVersionDTO(
	row: Record<string, unknown>
): ReportVersionDTO {
	return {
		id: row["id"] as string,
		reportId: row["reportId"] as string,
		versionNumber: row["versionNumber"] as number,
		status: row["status"] as SoilReportStatus,
		generatedByUserId:
			(row["generatedByUserId"] as string | null | undefined) ?? null,
		overallSoilRating:
			(row["overallSoilRating"] as string | null | undefined) ?? null,
		textureClass: (row["textureClass"] as string | null | undefined) ?? null,
		errorMessage: (row["errorMessage"] as string | null | undefined) ?? null,
		generatedAt: toIso(row["generatedAt"]),
		createdAt: toIso(row["createdAt"]),
		snapshot: row["snapshotJson"] as ProfessionalReportDTO,
	};
}

function toReportVersionSummaryDTO(
	row: Record<string, unknown>
): ReportVersionSummaryDTO {
	return {
		id: row["id"] as string,
		reportId: row["reportId"] as string,
		versionNumber: row["versionNumber"] as number,
		status: row["status"] as SoilReportStatus,
		overallSoilRating:
			(row["overallSoilRating"] as string | null | undefined) ?? null,
		textureClass: (row["textureClass"] as string | null | undefined) ?? null,
		generatedAt: toIso(row["generatedAt"]),
		generatedByUserId:
			(row["generatedByUserId"] as string | null | undefined) ?? null,
	};
}

function toIso(value: unknown): string {
	if (value instanceof Date) return value.toISOString();
	if (typeof value === "string") return value;
	return new Date().toISOString();
}

function deriveReportNumber(
	project: Record<string, unknown> | null,
	version: number
): string {
	const year = new Date().getFullYear();
	const code = (project?.["code"] as string | undefined) ?? "FLH";
	return `${code}-${year}-${String(version).padStart(3, "0")}`;
}

function deriveTitle(
	sample: Record<string, unknown> | null,
	testLevel: string
): string {
	const loc = (sample?.["locationName"] as string | undefined) ?? "Soil sample";
	return `${loc} — ${testLevel} report`;
}
