/**
 * FlahaSOIL v2 — physics result card.
 *
 * Renders a `SoilPhysicsResultDTO` as labelled rows. No calculation
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
import type { SoilPhysicsResultDTO } from "@flaha/shared-types";

interface PhysicsResultCardProps {
	result: SoilPhysicsResultDTO | null | undefined;
}

export function PhysicsResultCard({ result }: PhysicsResultCardProps) {
	return (
		<Card variant="outlined">
			<CardHeader title="Soil physics" />
			<Divider />
			<CardContent>
				{!result ? (
					<Typography variant="body2" color="text.secondary">
						No physics result yet.
					</Typography>
				) : (
					<Stack spacing={1}>
						<Row label="Texture class" value={result.textureClass} />
						<Row label="Field capacity" value={fmt(result.fieldCapacity)} />
						<Row label="Wilting point" value={fmt(result.wiltingPoint)} />
						<Row
							label="Plant-available water"
							value={fmt(result.plantAvailableWater)}
						/>
						<Row label="Saturation" value={fmt(result.saturation)} />
						<Row
							label="Saturated conductivity"
							value={`${fmt(result.saturatedConductivity)} mm/h`}
						/>
						<Row label="Bulk density" value={fmt(result.bulkDensity)} />
						<Row label="Drainage class" value={result.drainageClass ?? "—"} />
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
	return Number.isInteger(n) ? String(n) : n.toFixed(3);
}
