/**
 * FlahaSOIL v2 — interpretation card.
 *
 * Renders a `SoilInterpretationDTO`'s categorical fields as rows of
 * label + status chip + plain-language snippet. The classification
 * itself comes from `@flaha/soil-interpretation`; this card only
 * maps the resulting strings to a tri-state visual status
 * (`good | fair | poor`) and the agronomic help copy.
 */
import {
	Box,
	Card,
	CardContent,
	CardHeader,
	Chip,
	Divider,
	Stack,
	Typography,
} from "@mui/material";
import type { SoilInterpretationDTO } from "@flaha/shared-types";

import { INTERPRETATION_FIELD_HELP } from "../utils/agronomicCopy";
import {
	categoryToStatus,
	ratingToStatus,
} from "../utils/interpretationStatus";

interface InterpretationCardProps {
	interpretation: SoilInterpretationDTO | null | undefined;
}

const ROWS: Array<{ field: keyof SoilInterpretationDTO; label: string }> = [
	{ field: "phCategory", label: "pH" },
	{ field: "salinityRisk", label: "Salinity" },
	{ field: "cecLevel", label: "CEC level" },
	{ field: "baseSaturationCategory", label: "Base saturation" },
	{ field: "cationBalance", label: "Cation balance" },
	{ field: "sodiumRisk", label: "Sodium risk" },
	{ field: "waterHoldingClass", label: "Water holding" },
	{ field: "drainageClass", label: "Drainage" },
];

export function InterpretationCard({ interpretation }: InterpretationCardProps) {
	const overall = ratingToStatus(interpretation?.overallSoilRating);
	return (
		<Card variant="outlined">
			<CardHeader
				title="Interpretation"
				action={
					interpretation ? (
						<Chip
							label={interpretation.overallSoilRating}
							color={overall.color}
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
					<Stack spacing={2}>
						{ROWS.map(({ field, label }) => {
							const value = interpretation[field] as string | null | undefined;
							return (
								<InterpretationRow
									key={field}
									label={label}
									value={value ?? null}
									status={categoryToStatus(field as string, value ?? null)}
									help={INTERPRETATION_FIELD_HELP[field as string]}
								/>
							);
						})}
					</Stack>
				)}
			</CardContent>
		</Card>
	);
}

function InterpretationRow({
	label,
	value,
	status,
	help,
}: {
	label: string;
	value: string | null;
	status: ReturnType<typeof categoryToStatus>;
	help?: string | undefined;
}) {
	return (
		<Box>
			<Stack
				direction="row"
				justifyContent="space-between"
				alignItems="center"
				spacing={1}
			>
				<Typography variant="body2" color="text.secondary">
					{label}
				</Typography>
				{value ? (
					<Chip
						label={value}
						color={status.color}
						size="small"
						variant={status.tone === "neutral" ? "outlined" : "filled"}
					/>
				) : (
					<Typography variant="body2" color="text.disabled">
						{"\u2014"}
					</Typography>
				)}
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
