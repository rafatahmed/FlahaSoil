/**
 * FlahaSOIL v2 — FlahaCalc export page.
 *
 * Lets the user enter a soil-test id and fetches the FlahaCalc export
 * projection through the active API client. Shows the raw JSON
 * envelope plus the key hydraulic and chemistry-risk fields.
 *
 * This page only PREPARES the export — cross-app transfer to the
 * FlahaCalc application is out of scope.
 */
import {
	Alert,
	Box,
	Button,
	Grid,
	Paper,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { useState } from "react";
import type { FlahaCalcExportResponse } from "@flaha/shared-types";

import { usePageHeader } from "../layouts/PageHeaderContext";
import { getApiClient } from "../services/apiClientProvider";

export function FlahaCalcExportPage() {
	const [soilTestId, setSoilTestId] = useState<string>("");
	const [preview, setPreview] = useState<FlahaCalcExportResponse | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	usePageHeader({
		title: "FlahaCalc export",
		subtitle: "Hand off hydraulic and chemistry parameters for irrigation planning",
		breadcrumbs: [
			{ label: "Home", to: "/" },
			{ label: "Dashboard", to: "/dashboard" },
			{ label: "FlahaCalc export" },
		],
	});

	const handlePreview = async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await getApiClient().getFlahaCalcExport(soilTestId);
			setPreview(result);
		} catch (err) {
			setPreview(null);
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				Export soil hydraulic and chemistry parameters to FlahaCalc.
				Paste a soil-test id from a project to preview the export.
			</Typography>

			<Alert severity="info" sx={{ mb: 3 }}>
				The export contract is documented in{" "}
				<code>docs/v2-api-contracts.md §6</code>. Required fields are stable
				and will never be removed; optional fields may be added.
			</Alert>

			<Stack direction="row" spacing={2} sx={{ mb: 3 }} alignItems="center">
				<TextField
					label="Soil test id"
					size="small"
					value={soilTestId}
					onChange={(e) => setSoilTestId(e.target.value)}
				/>
				<Button
					variant="contained"
					onClick={handlePreview}
					disabled={loading || soilTestId.length === 0}
				>
					{loading ? "Fetching…" : "Fetch export"}
				</Button>
			</Stack>

			{error && (
				<Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			{preview && <ExportSummary preview={preview} />}
			{preview && <ExportRawJson preview={preview} />}
		</Box>
	);
}

function ExportSummary({ preview }: { preview: FlahaCalcExportResponse }) {
	return (
		<Grid container spacing={2} sx={{ mb: 3 }}>
			<KeyValue label="Texture class" value={preview.textureClass} />
			<KeyValue label="Field capacity" value={preview.fieldCapacity} />
			<KeyValue label="Wilting point" value={preview.wiltingPoint} />
			<KeyValue
				label="Plant available water"
				value={preview.plantAvailableWater}
			/>
			<KeyValue label="Saturation" value={preview.saturation} />
			<KeyValue
				label="Saturated conductivity"
				value={preview.saturatedConductivity}
			/>
			{preview.cec !== undefined && (
				<KeyValue label="CEC" value={preview.cec} />
			)}
			{preview.salinityRisk !== undefined && (
				<KeyValue label="Salinity risk" value={preview.salinityRisk} />
			)}
			{preview.sodiumRisk !== undefined && (
				<KeyValue label="Sodium risk" value={preview.sodiumRisk} />
			)}
		</Grid>
	);
}

function KeyValue({
	label,
	value,
}: {
	label: string;
	value: string | number;
}) {
	return (
		<Grid item xs={12} sm={6} md={4}>
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="caption" color="text.secondary">
					{label}
				</Typography>
				<Typography variant="body1">{String(value)}</Typography>
			</Paper>
		</Grid>
	);
}

function ExportRawJson({ preview }: { preview: FlahaCalcExportResponse }) {
	return (
		<Paper
			variant="outlined"
			sx={{
				p: 2,
				bgcolor: "background.default",
				fontFamily: "monospace",
				fontSize: 12,
				overflowX: "auto",
			}}
		>
			<pre style={{ margin: 0 }}>{JSON.stringify(preview, null, 2)}</pre>
		</Paper>
	);
}
