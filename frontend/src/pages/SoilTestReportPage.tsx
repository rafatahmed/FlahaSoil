/**
 * FlahaSOIL v2 — soil-test report viewer.
 *
 * Display-only projection of `GET /api/v2/soil-tests/:soilTestId/report`.
 * Reuses the result cards from the detail page so the visual language
 * stays consistent; adds a structured warnings list and a collapsible
 * audit trace block so the page can act as a printable artefact.
 */
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Divider,
	Grid,
	Stack,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import type {
	GetSoilTestReportResponse,
	SystemWarning,
} from "@flaha/shared-types";

import { ChemistryResultCard } from "../features/results/components/ChemistryResultCard";
import { InterpretationCard } from "../features/results/components/InterpretationCard";
import { PhysicsResultCard } from "../features/results/components/PhysicsResultCard";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient, getApiClientMode } from "../services/apiClientProvider";

function severityToMui(
	s: SystemWarning["severity"]
): "info" | "warning" | "error" {
	if (s === "critical") return "error";
	if (s === "info") return "info";
	return "warning";
}

export function SoilTestReportPage() {
	const { soilTestId = "" } = useParams<{ soilTestId: string }>();
	const [data, setData] = useState<GetSoilTestReportResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const apiMode = getApiClientMode();

	usePageHeader({
		title: "Soil report",
		subtitle: data
			? `Test ${data.test.id} · ${data.metadata.testLevel} · v${data.metadata.version}`
			: "Loading report…",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "Soil test", to: `/soil-tests/${soilTestId}` },
			{ label: "Report" },
		],
	});

	useEffect(() => {
		let cancelled = false;
		setError(null);
		setData(null);
		getApiClient()
			.getSoilTestReport(soilTestId)
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
				Failed to load report for {soilTestId}: {error}
			</Alert>
		);
	}
	if (!data) {
		return <Typography>Loading…</Typography>;
	}

	return (
		<Box>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				sx={{ mb: 2 }}
			>
				<Typography variant="caption" color="text.secondary">
					Sample {data.sample.id} · API mode: <strong>{apiMode}</strong>
				</Typography>
				<Button
					component={RouterLink}
					to={`/soil-tests/${data.test.id}`}
					variant="outlined"
				>
					Back to test
				</Button>
			</Stack>

			{data.warningDetails.length > 0 && (
				<Stack spacing={1} sx={{ mb: 3 }}>
					{data.warningDetails.map((w, i) => (
						<Alert key={i} severity={severityToMui(w.severity)} variant="outlined">
							<strong>{w.code}</strong> — {w.message}
						</Alert>
					))}
				</Stack>
			)}

			<Grid container spacing={3}>
				<Grid item xs={12} md={6}>
					<PhysicsResultCard result={data.physics} />
				</Grid>
				<Grid item xs={12} md={6}>
					<ChemistryResultCard result={data.chemistry} />
				</Grid>
				<Grid item xs={12} md={6}>
					<InterpretationCard interpretation={data.interpretation} />
				</Grid>
				<Grid item xs={12} md={6}>
					<Card variant="outlined">
						<CardHeader
							title="Audit trace"
							subheader="What the engines saw and what they did."
						/>
						<Divider />
						<CardContent>
							<Stack spacing={1.5}>
								<Box>
									<Typography variant="overline">Skipped modules</Typography>
									{data.auditTrace.skippedModules.length === 0 ? (
										<Typography variant="body2" color="text.secondary">
											None — every requested module ran.
										</Typography>
									) : (
										data.auditTrace.skippedModules.map((s, i) => (
											<Chip
												key={i}
												label={`${s.module}: ${s.reason}`}
												color="warning"
												size="small"
												sx={{ mr: 1, mb: 1 }}
											/>
										))
									)}
								</Box>
								<Divider flexItem />
								<Box>
									<Typography variant="overline">Normalized inputs</Typography>
									<pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>
										{JSON.stringify(
											data.auditTrace.normalizedInputs ?? {},
											null,
											2
										)}
									</pre>
								</Box>
								<Divider flexItem />
								<Box>
									<Typography variant="overline">Physics trace</Typography>
									<pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>
										{JSON.stringify(data.auditTrace.physicsTrace ?? {}, null, 2)}
									</pre>
								</Box>
							</Stack>
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Box>
	);
}
