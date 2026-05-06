/**
 * FlahaSOIL v2 — interpretation card.
 *
 * Renders a `SoilInterpretationDTO` (categorical fields + overall
 * rating). No interpretation logic runs here; values are
 * passed through from the API.
 */
import {
	Card,
	CardContent,
	CardHeader,
	Chip,
	Divider,
	Stack,
	Typography,
} from "@mui/material";
import {
	type SoilInterpretationDTO,
	SoilInterpretationRating,
} from "@flaha/shared-types";

interface InterpretationCardProps {
	interpretation: SoilInterpretationDTO | null | undefined;
}

export function InterpretationCard({ interpretation }: InterpretationCardProps) {
	return (
		<Card variant="outlined">
			<CardHeader
				title="Interpretation"
				action={
					interpretation ? (
						<Chip
							label={interpretation.overallSoilRating}
							color={ratingColor(interpretation.overallSoilRating)}
							size="small"
						/>
					) : null
				}
			/>
			<Divider />
			<CardContent>
				{!interpretation ? (
					<Typography variant="body2" color="text.secondary">
						No interpretation yet.
					</Typography>
				) : (
					<Stack spacing={1}>
						<Row label="pH" value={interpretation.phCategory} />
						<Row label="Salinity" value={interpretation.salinityRisk} />
						<Row label="CEC level" value={interpretation.cecLevel} />
						<Row
							label="Base saturation"
							value={interpretation.baseSaturationCategory}
						/>
						<Row
							label="Cation balance"
							value={interpretation.cationBalance}
						/>
						<Row label="Sodium risk" value={interpretation.sodiumRisk} />
						<Row
							label="Water holding"
							value={interpretation.waterHoldingClass}
						/>
						<Row label="Drainage" value={interpretation.drainageClass} />
					</Stack>
				)}
			</CardContent>
		</Card>
	);
}

function Row({
	label,
	value,
}: {
	label: string;
	value: string | null | undefined;
}) {
	return (
		<Stack direction="row" justifyContent="space-between">
			<Typography variant="body2" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2" fontWeight={500}>
				{value ?? "—"}
			</Typography>
		</Stack>
	);
}

function ratingColor(
	rating: SoilInterpretationRating
): "success" | "warning" | "error" | "default" {
	switch (rating) {
		case SoilInterpretationRating.GOOD:
			return "success";
		case SoilInterpretationRating.FAIR:
			return "warning";
		case SoilInterpretationRating.POOR:
			return "error";
		default:
			return "default";
	}
}
