/**
 * FlahaSOIL v2 — physics result card.
 *
 * Two-tier layout: highlighted plant-available water / field
 * capacity / wilting point block (the numbers a grower actually
 * makes irrigation decisions on), then a compact details table for
 * the rest of the Saxton & Rawls outputs. Plain-language snippets
 * come from `agronomicCopy.PHYSICS_HELP`; no thresholds or
 * calculation logic live here.
 */
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Divider,
	Grid,
	Stack,
	Typography,
} from "@mui/material";
import type { SoilPhysicsResultDTO } from "@flaha/shared-types";

import { PHYSICS_HELP } from "../utils/agronomicCopy";

interface PhysicsResultCardProps {
	result: SoilPhysicsResultDTO | null | undefined;
}

export function PhysicsResultCard({ result }: PhysicsResultCardProps) {
	return (
		<Card variant="outlined">
			<CardHeader
				title="Soil physics"
				subheader="Water-holding and structure derived from texture & organic matter."
			/>
			<Divider />
			<CardContent>
				{!result ? (
					<Typography variant="body2" color="text.secondary">
						No physics result yet.
					</Typography>
				) : (
					<Stack spacing={2.5}>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={4}>
								<HighlightStat
									label="Plant-available water"
									value={fmtPct(result.plantAvailableWater)}
									help={PHYSICS_HELP.plantAvailableWater}
									emphasised
								/>
							</Grid>
							<Grid item xs={6} sm={4}>
								<HighlightStat
									label="Field capacity"
									value={fmtPct(result.fieldCapacity)}
									help={PHYSICS_HELP.fieldCapacity}
								/>
							</Grid>
							<Grid item xs={6} sm={4}>
								<HighlightStat
									label="Wilting point"
									value={fmtPct(result.wiltingPoint)}
									help={PHYSICS_HELP.wiltingPoint}
								/>
							</Grid>
						</Grid>

						<Divider flexItem />

						<Box>
							<Typography
								variant="overline"
								color="text.secondary"
								sx={{ display: "block", mb: 1 }}
							>
								Structure &amp; conductivity
							</Typography>
							<Stack spacing={1}>
								<DetailRow
									label="Texture class"
									value={result.textureClass}
									help={PHYSICS_HELP.textureClass}
								/>
								<DetailRow
									label="Saturation"
									value={fmtPct(result.saturation)}
									help={PHYSICS_HELP.saturation}
								/>
								<DetailRow
									label="Saturated conductivity"
									value={`${fmt(result.saturatedConductivity)} mm/h`}
									help={PHYSICS_HELP.saturatedConductivity}
								/>
								<DetailRow
									label="Bulk density"
									value={`${fmt(result.bulkDensity)} g/cm\u00B3`}
									help={PHYSICS_HELP.bulkDensity}
								/>
								<DetailRow
									label="Drainage class"
									value={result.drainageClass ?? "\u2014"}
								/>
							</Stack>
						</Box>
					</Stack>
				)}
			</CardContent>
		</Card>
	);
}

function HighlightStat({
	label,
	value,
	help,
	emphasised = false,
}: {
	label: string;
	value: string;
	help?: string | undefined;
	emphasised?: boolean | undefined;
}) {
	return (
		<Box>
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography
				variant={emphasised ? "h4" : "h5"}
				fontWeight={600}
				color={emphasised ? "primary.main" : "text.primary"}
				sx={{ lineHeight: 1.1, my: 0.25 }}
			>
				{value}
			</Typography>
			{help ? (
				<Typography variant="caption" color="text.secondary">
					{help}
				</Typography>
			) : null}
		</Box>
	);
}

function DetailRow({
	label,
	value,
	help,
}: {
	label: string;
	value: React.ReactNode;
	help?: string | undefined;
}) {
	return (
		<Box>
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Typography variant="body2" color="text.secondary">
					{label}
				</Typography>
				<Typography variant="body2" fontWeight={500}>
					{value}
				</Typography>
			</Stack>
			{help ? (
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ display: "block", mt: 0.25 }}
				>
					{help}
				</Typography>
			) : null}
		</Box>
	);
}

function fmt(n: number | null | undefined): string {
	if (n === null || n === undefined) return "\u2014";
	return Number.isInteger(n) ? String(n) : n.toFixed(3);
}

function fmtPct(n: number | null | undefined): string {
	if (n === null || n === undefined) return "\u2014";
	return `${n.toFixed(1)} %`;
}
