/**
 * FlahaSOIL v2 — chemistry result card.
 *
 * Renders a `SoilChemistryResultDTO` as labelled rows. No calculation
 * happens here; values are displayed as-supplied by the API.
 */
import {
	Card,
	CardContent,
	CardHeader,
	Divider,
	Stack,
	Typography,
} from "@mui/material";
import type { SoilChemistryResultDTO } from "@flaha/shared-types";

interface ChemistryResultCardProps {
	result: SoilChemistryResultDTO | null | undefined;
}

export function ChemistryResultCard({ result }: ChemistryResultCardProps) {
	return (
		<Card variant="outlined">
			<CardHeader title="Soil chemistry" />
			<Divider />
			<CardContent>
				{!result ? (
					<Typography variant="body2" color="text.secondary">
						No chemistry result yet.
					</Typography>
				) : (
					<Stack spacing={1}>
						<Row label="CEC" value={`${fmt(result.cec)} cmol(+)/kg`} />
						<Row
							label="Base saturation"
							value={`${fmt(result.baseSaturation)} %`}
						/>
						<Row label="Ca %" value={fmt(result.caPercent)} />
						<Row label="Mg %" value={fmt(result.mgPercent)} />
						<Row label="K %" value={fmt(result.kPercent)} />
						<Row label="Na %" value={fmt(result.naPercent)} />
						<Row label="ESP" value={fmt(result.esp)} />
						<Row label="SAR" value={fmt(result.sar)} />
						<Row label="Mode" value={result.calculationMode} />
					</Stack>
				)}
			</CardContent>
		</Card>
	);
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
	return (
		<Stack direction="row" justifyContent="space-between">
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2" fontWeight={500}>
				{value}
			</Typography>
		</Stack>
	);
}

function fmt(n: number | null | undefined): string {
	if (n === null || n === undefined) return "—";
	return Number.isInteger(n) ? String(n) : n.toFixed(2);
}
