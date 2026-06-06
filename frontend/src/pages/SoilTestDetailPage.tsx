/**
 * FlahaSOIL v2 — Soil-test detail page.
 *
 * Loads a soil test through the active API client and renders its
 * summary, physics, chemistry, interpretation, and reports sections.
 */
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	Divider,
	Grid,
	Stack,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import type { GetSoilTestResponse } from "@flaha/shared-types";
import { SoilReportStatus } from "@flaha/shared-types";

import { ChemistryResultCard } from "../features/results/components/ChemistryResultCard";
import { InterpretationCard } from "../features/results/components/InterpretationCard";
import { PhysicsResultCard } from "../features/results/components/PhysicsResultCard";
import { ScientificAnalysisPanel } from "../features/results/components/ScientificAnalysisPanel";
import { SoilTestSummaryHeader } from "../features/results/components/SoilTestSummaryHeader";
import { WarningList } from "../features/results/components/WarningList";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";

type SoilTestTab = "results" | "scientific";

export function SoilTestDetailPage() {
	const { soilTestId = "" } = useParams<{ soilTestId: string }>();
	const navigate = useNavigate();
	const [data, setData] = useState<GetSoilTestResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [generating, setGenerating] = useState(false);
	const [tab, setTab] = useState<SoilTestTab>("results");

	const onGenerateReport = async () => {
		if (generating) return;
		setGenerating(true);
		try {
			const { report } = await getApiClient().generateReport(soilTestId, {});
			navigate(`/reports/${report.id}`);
		} catch (err: unknown) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setGenerating(false);
		}
	};

	usePageHeader({
		title: "Soil test results",
		subtitle: data
			? `Test ${data.soilTest.id} · sample ${data.soilTest.sampleId}`
			: "Loading test…",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Projects", to: "/projects" },
			{ label: "Soil test" },
		],
	});

	useEffect(() => {
		let cancelled = false;
		setError(null);
		setData(null);
		getApiClient()
			.getSoilTest(soilTestId)
			.then((d) => {
				if (!cancelled) setData(d);
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(err instanceof Error ? err.message : String(err));
				}
			});
		return () => {
			cancelled = true;
		};
	}, [soilTestId]);

	if (error) {
		return (
			<Alert severity="error">
				Failed to load soil test {soilTestId}: {error}
			</Alert>
		);
	}

	if (!data) {
		return <Typography>Loading…</Typography>;
	}

	const warnings = data.interpretation?.warningsJson ?? [];

	return (
		<Box>
			<Stack
				direction="row"
				justifyContent="flex-end"
				spacing={1}
				sx={{ mb: 3 }}
			>
				<Button
					component={RouterLink}
					to={`/soil-tests/${data.soilTest.id}/report`}
					variant="outlined"
				>
					Quick view
				</Button>
				<Button
					variant="contained"
					onClick={onGenerateReport}
					disabled={generating}
				>
					{generating ? "Generating…" : "Generate report"}
				</Button>
			</Stack>

			<SoilTestSummaryHeader
				soilTest={data.soilTest}
				physics={data.physicsResult}
				interpretation={data.interpretation}
			/>

			<Box sx={{ mb: 2 }}>
				<WarningList warnings={warnings} />
			</Box>

			<Tabs
				value={tab}
				onChange={(_, v: SoilTestTab) => setTab(v)}
				aria-label="Soil test sections"
				sx={{ mb: 2 }}
			>
				<Tab value="results" label="Results" />
				<Tab value="scientific" label="Scientific Analysis" />
			</Tabs>

			{tab === "results" ? (
				<Grid container spacing={3}>
					<Grid item xs={12} md={6}>
						<PhysicsResultCard result={data.physicsResult} />
					</Grid>
					<Grid item xs={12} md={6}>
						<ChemistryResultCard result={data.chemistryResult} />
					</Grid>
					<Grid item xs={12} md={6}>
						<InterpretationCard interpretation={data.interpretation} />
					</Grid>
					<Grid item xs={12} md={6}>
						<Card variant="outlined">
							<CardHeader title="Reports" />
							<Divider />
							<CardContent>
								{data.reports.length === 0 ? (
									<Typography variant="body2" color="text.secondary">
										No reports generated yet. Use &quot;Generate
										report&quot; above to create the first version.
									</Typography>
								) : (
									<Stack spacing={1}>
										{data.reports.map((r) => (
											<Button
												key={r.id}
												component={RouterLink}
												to={`/reports/${r.id}`}
												variant="text"
												sx={{ justifyContent: "flex-start" }}
											>
												{r.title ?? r.reportNumber ?? "Report"} — v
												{r.latestVersionNumber} ·{" "}
												{r.status === SoilReportStatus.READY
													? "Ready"
													: r.status}
											</Button>
										))}
									</Stack>
								)}
							</CardContent>
						</Card>
					</Grid>
				</Grid>
			) : (
				<ScientificAnalysisPanel soilTestId={data.soilTest.id} />
			)}
		</Box>
	);
}
