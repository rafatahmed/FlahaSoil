/**
 * FlahaSOIL v2 — Scientific Analysis composite panel (Phase 10A).
 *
 * Loads `GET /api/v2/soil-tests/:id/scientific-analysis` and renders the
 * three Phase-10 visualisations side-by-side. Each card is independent
 * — a missing input block degrades to an empty-state message rather
 * than blocking the others.
 */
import {
	Alert,
	AlertTitle,
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	CircularProgress,
	Divider,
	Grid,
	Stack,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type {
	LevelCompleteness,
	ScientificAnalysisResponse,
} from "@flaha/shared-types";

import { getApiClient } from "../../../services/apiClientProvider";
import { StructureTriangleChart } from "./StructureTriangleChart";
import { TextureTriangleChart } from "./TextureTriangleChart";
import { WaterRetentionCurveChart } from "./WaterRetentionCurveChart";

interface ScientificAnalysisPanelProps {
	soilTestId: string;
}

export function ScientificAnalysisPanel({ soilTestId }: ScientificAnalysisPanelProps) {
	const [data, setData] = useState<ScientificAnalysisResponse | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;
		setData(null);
		setError(null);
		getApiClient()
			.getScientificAnalysis(soilTestId)
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
			<Alert severity="error" data-testid="scientific-analysis-error">
				Failed to load scientific analysis: {error}
			</Alert>
		);
	}

	if (!data) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
				<CircularProgress size={28} aria-label="Loading scientific analysis" />
			</Box>
		);
	}

	return (
		<Stack spacing={2} data-testid="scientific-analysis-panel">
			{data.coverage ? (
				<CoverageBanner level={data.coverage.level} />
			) : null}

			{data.warnings.length > 0 ? (
				<Alert severity="info" data-testid="scientific-analysis-warnings">
					<Stack spacing={0.5}>
						{data.warnings.map((w, i) => (
							<Box key={i}>{w}</Box>
						))}
					</Stack>
				</Alert>
			) : null}

			<Grid container spacing={2}>
				<Grid item xs={12} md={6}>
					<Card variant="outlined">
						<CardHeader
							title="USDA texture triangle"
							subheader="Sand / silt / clay classification (USDA Soil Survey Manual)."
						/>
						<Divider />
						<CardContent>
							<TextureTriangleChart texture={data.texture} />
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} md={6}>
					<Card variant="outlined">
						<CardHeader
							title="Water-retention curve"
							subheader="θ(ψ) from Saxton & Rawls (2006); pF 0 → 4.18."
						/>
						<Divider />
						<CardContent>
							<WaterRetentionCurveChart retention={data.waterRetention} />
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} md={6}>
					<Card variant="outlined">
						<CardHeader
							title="CEC structure triangle"
							subheader="CEC saturation: Ca / CEC, Mg / CEC, and Residual (K + Na + exchangeable acidity)."
						/>
						<Divider />
						<CardContent>
							<StructureTriangleChart structure={data.structure} />
						</CardContent>
					</Card>
				</Grid>
			</Grid>
		</Stack>
	);
}


/**
 * Phase 10A.7 (Correction) — declared-level evidence chip.
 *
 * Surfaces the `SoilTestLevel`-anchored coverage summary above the
 * three charts so the user sees the requested contract *and* its
 * actual completeness in one glance. PRELIMINARY tests with only
 * pH/EC inputs read "Met" here instead of looking under-served.
 */
function CoverageBanner({ level }: { level: LevelCompleteness }) {
	const severity =
		level.status === "Met"
			? "success"
			: level.status === "Missing"
				? "warning"
				: "info";
	return (
		<Alert severity={severity} data-testid="scientific-analysis-coverage">
			<AlertTitle>
				<Stack
					direction="row"
					spacing={1}
					alignItems="center"
					flexWrap="wrap"
				>
					<Box component="span">Requested test level</Box>
					<Chip
						size="small"
						color="primary"
						variant="outlined"
						label={level.declaredLevel}
					/>
					<Chip
						size="small"
						variant="outlined"
						label={`${level.status} · ${level.coveragePercent.toFixed(1)} %`}
					/>
				</Stack>
			</AlertTitle>
			<Typography variant="body2">{level.statement}</Typography>
		</Alert>
	);
}
