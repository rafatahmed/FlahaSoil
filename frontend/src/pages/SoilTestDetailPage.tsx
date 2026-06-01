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
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";
import type { GetSoilTestResponse } from "@flaha/shared-types";

import { ChemistryResultCard } from "../features/results/components/ChemistryResultCard";
import { InterpretationCard } from "../features/results/components/InterpretationCard";
import { PhysicsResultCard } from "../features/results/components/PhysicsResultCard";
import { SoilTestSummaryHeader } from "../features/results/components/SoilTestSummaryHeader";
import { WarningList } from "../features/results/components/WarningList";
import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";

export function SoilTestDetailPage() {
	const { soilTestId = "" } = useParams<{ soilTestId: string }>();
	const [data, setData] = useState<GetSoilTestResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

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
				sx={{ mb: 3 }}
			>
				<Button
					component={RouterLink}
					to={`/soil-tests/${data.soilTest.id}/report`}
					variant="contained"
				>
					View report
				</Button>
			</Stack>

			<SoilTestSummaryHeader
				soilTest={data.soilTest}
				physics={data.physicsResult}
				interpretation={data.interpretation}
			/>

			<Box sx={{ mb: 3 }}>
				<WarningList warnings={warnings} />
			</Box>

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
									No reports generated yet.
								</Typography>
							) : (
								data.reports.map((r) => (
									<Typography key={r.id} variant="body2">
										{r.reportType ?? "Report"} — {r.status}
									</Typography>
								))
							)}
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Box>
	);
}
