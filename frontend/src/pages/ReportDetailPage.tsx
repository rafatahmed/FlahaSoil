/**
 * FlahaSOIL v2 — Report detail page (Phase 8D F.2).
 *
 * Loads a single SoilReport with its version history and the decoded
 * current ProfessionalReportDTO snapshot. Renders the report sections
 * via `ReportSnapshotView` and a sidebar with the version timeline,
 * a "Print preview" button (opens the HTML preview endpoint in a new
 * tab), and a regenerate action that appends a new version.
 */
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Grid,
	Stack,
	Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import RefreshIcon from "@mui/icons-material/Refresh";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type {
	GetReportResponse,
	ReportVersionDTO,
} from "@flaha/shared-types";

import { ReportSnapshotView } from "../features/reports/components/ReportSnapshotView";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";
import { useAuth } from "../auth";

export function ReportDetailPage() {
	const { projectId = "", reportId = "" } = useParams<{
		projectId: string;
		reportId: string;
	}>();
	const { status: sessionStatus } = useAuth();
	const [data, setData] = useState<GetReportResponse | null>(null);
	const [activeVersion, setActiveVersion] = useState<ReportVersionDTO | null>(
		null
	);
	const [error, setError] = useState<string | null>(null);
	const [busy, setBusy] = useState(false);

	usePageHeader({
		title: data?.report.title ?? "Report",
		...(data?.report.reportNumber ? { subtitle: data.report.reportNumber } : {}),
		breadcrumbs: projectId
			? [
					{ label: "Home", to: "/" },
					{ label: "Dashboard", to: "/dashboard" },
					{ label: "Projects", to: "/projects" },
					{ label: "Project", to: `/projects/${projectId}` },
					{ label: "Reports", to: `/projects/${projectId}/reports` },
					{ label: data?.report.title ?? "Report" },
				]
			: [
					{ label: "Home", to: "/" },
					{ label: "Dashboard", to: "/dashboard" },
					{ label: "Reports", to: "/reports" },
					{ label: data?.report.title ?? "Report" },
				],
	});

	const load = useCallback(() => {
		setError(null);
		setData(null);
		setActiveVersion(null);
		getApiClient()
			.getReport(reportId)
			.then((res) => {
				setData(res);
				setActiveVersion(res.currentVersion);
			})
			.catch((err: unknown) =>
				setError(err instanceof Error ? err.message : String(err))
			);
	}, [reportId]);

	useEffect(() => {
		if (sessionStatus !== "authenticated" || !reportId) return;
		load();
	}, [load, reportId, sessionStatus]);

	const onRegenerate = async () => {
		if (busy) return;
		setBusy(true);
		try {
			await getApiClient().regenerateReport(reportId);
			load();
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setBusy(false);
		}
	};

	const onPrint = () => {
		if (!activeVersion) return;
		const url = getApiClient().getReportVersionPreviewUrl(
			reportId,
			activeVersion.versionNumber
		);
		window.open(url, "_blank", "noopener,noreferrer");
	};

	const onSelectVersion = async (versionNumber: number) => {
		try {
			const { version } = await getApiClient().getReportVersion(
				reportId,
				versionNumber
			);
			setActiveVersion(version);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : String(err));
		}
	};

	if (error)
		return (
			<Alert
				severity="error"
				action={
					<Button color="inherit" size="small" onClick={load}>
						Retry
					</Button>
				}
			>
				Failed: {error}
			</Alert>
		);
	if (!data || !activeVersion)
		return <Typography color="text.secondary">Loading report…</Typography>;

	return (
		<Grid container spacing={2}>
			<Grid item xs={12} md={9}>
				<Stack direction="row" spacing={1} sx={{ mb: 2 }}>
					<Button variant="contained" startIcon={<PrintIcon />} onClick={onPrint}>
						Print preview
					</Button>
					<Button
						variant="outlined"
						startIcon={<RefreshIcon />}
						onClick={onRegenerate}
						disabled={busy}
					>
						{busy ? "Regenerating…" : "Regenerate"}
					</Button>
				</Stack>
				<ReportSnapshotView
					snapshot={activeVersion.snapshot}
					versionNumber={activeVersion.versionNumber}
					generatedAt={activeVersion.generatedAt}
				/>
			</Grid>
			<Grid item xs={12} md={3}>
				<Card variant="outlined">
					<CardContent>
						<Typography variant="subtitle1" sx={{ mb: 1 }}>
							Version history
						</Typography>
						<Stack spacing={1}>
							{data.versions.map((v) => (
								<Box
									key={v.id}
									onClick={() => onSelectVersion(v.versionNumber)}
									sx={{
										cursor: "pointer",
										p: 1,
										borderRadius: 1,
										border: 1,
										borderColor:
											activeVersion.versionNumber === v.versionNumber
												? "primary.main"
												: "divider",
									}}
								>
									<Stack direction="row" alignItems="center" spacing={1}>
										<Typography variant="body2" sx={{ flexGrow: 1 }}>
											v{v.versionNumber}
										</Typography>
										<Chip size="small" label={v.status} />
									</Stack>
									<Typography variant="caption" color="text.secondary">
										{new Date(v.generatedAt).toLocaleString()}
									</Typography>
								</Box>
							))}
						</Stack>
					</CardContent>
				</Card>
			</Grid>
		</Grid>
	);
}
