/**
 * FlahaSOIL v2 — chemistry result card.
 *
 * Grouped layout: a top "buffer + balance" block (CEC, base
 * saturation), a cation share block (Ca / Mg / K / Na as % of CEC),
 * and a sodicity / salinity-risk block (ESP, SAR). Each major number
 * carries a plain-language caption from `CHEMISTRY_HELP`. No
 * thresholds or calculation logic live here — the chemistry engine
 * already produced these values.
 */
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Divider,
	Grid,
	Stack,
	Typography,
} from "@mui/material";
import type { SoilChemistryResultDTO } from "@flaha/shared-types";

import { CHEMISTRY_HELP } from "../utils/agronomicCopy";

interface ChemistryResultCardProps {
	result: SoilChemistryResultDTO | null | undefined;
}

export function ChemistryResultCard({ result }: ChemistryResultCardProps) {
	return (
		<Card variant="outlined">
			<CardHeader
				title="Soil chemistry"
				subheader="Nutrient buffering, cation balance and sodicity / salinity risk."
				action={
					result ? (
						<Chip
							size="small"
							variant="outlined"
							label={`Mode: ${result.calculationMode}`}
						/>
					) : null
				}
			/>
			<Divider />
			<CardContent>
				{!result ? (
					<Typography variant="body2" color="text.secondary">
						No chemistry result yet — this test was processed without a
						full cation panel.
					</Typography>
				) : (
					<Stack spacing={2.5}>
						<Grid container spacing={2}>
							<Grid item xs={6}>
								<HighlightStat
									label="CEC"
									value={`${fmt(result.cec)} cmol(+)/kg`}
									help={CHEMISTRY_HELP.cec}
									emphasised
								/>
							</Grid>
							<Grid item xs={6}>
								<HighlightStat
									label="Base saturation"
									value={`${fmt(result.baseSaturation)} %`}
									help={CHEMISTRY_HELP.baseSaturation}
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
								Cation share (% of CEC)
							</Typography>
							<Grid container spacing={1.5}>
								<Grid item xs={3}>
									<CationCell label="Ca" value={fmt(result.caPercent)} />
								</Grid>
								<Grid item xs={3}>
									<CationCell label="Mg" value={fmt(result.mgPercent)} />
								</Grid>
								<Grid item xs={3}>
									<CationCell label="K" value={fmt(result.kPercent)} />
								</Grid>
								<Grid item xs={3}>
									<CationCell label="Na" value={fmt(result.naPercent)} />
								</Grid>
							</Grid>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: "block", mt: 0.75 }}
							>
								{CHEMISTRY_HELP.cationShare}
							</Typography>
						</Box>

						<Divider flexItem />

						<Box>
							<Typography
								variant="overline"
								color="text.secondary"
								sx={{ display: "block", mb: 1 }}
							>
								Sodicity indicators
							</Typography>
							<Stack spacing={1}>
								<DetailRow
									label="Exchangeable Na %"
									value={`${fmt(result.esp)} %`}
									help={CHEMISTRY_HELP.esp}
								/>
								<DetailRow
									label="SAR"
									value={fmt(result.sar)}
									help={CHEMISTRY_HELP.sar}
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
				variant={emphasised ? "h5" : "h6"}
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

function CationCell({ label, value }: { label: string; value: string }) {
	return (
		<Box
			sx={{
				textAlign: "center",
				px: 1,
				py: 0.75,
				border: 1,
				borderColor: "divider",
				borderRadius: 1,
			}}
		>
			<Typography variant="caption" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1 }}>
				{value}
			</Typography>
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
	return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
