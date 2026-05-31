/**
 * FlahaSOIL v2 — soil-test summary header.
 *
 * Top-of-page banner that gives the user a one-glance picture of the
 * test: project context, test level, texture class, overall
 * agronomic rating, and a short list of key alerts (interpretation
 * rows that came back as `poor`). Drives nothing — pure
 * presentational summary of data already on the page.
 */
import {
	Box,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Typography,
} from "@mui/material";
import type {
	SoilInterpretationDTO,
	SoilPhysicsResultDTO,
	SoilTestDTO,
} from "@flaha/shared-types";

import { OVERALL_RATING_HELP } from "../utils/agronomicCopy";
import {
	categoryToStatus,
	ratingToStatus,
} from "../utils/interpretationStatus";

interface SoilTestSummaryHeaderProps {
	soilTest: SoilTestDTO;
	physics: SoilPhysicsResultDTO | null | undefined;
	interpretation: SoilInterpretationDTO | null | undefined;
}

const KEY_FIELDS: Array<{ field: string; label: string }> = [
	{ field: "phCategory", label: "pH" },
	{ field: "salinityRisk", label: "Salinity" },
	{ field: "sodiumRisk", label: "Sodium" },
	{ field: "cationBalance", label: "Cation balance" },
];

export function SoilTestSummaryHeader({
	soilTest,
	physics,
	interpretation,
}: SoilTestSummaryHeaderProps) {
	const overall = ratingToStatus(interpretation?.overallSoilRating);
	const overallLabel = interpretation?.overallSoilRating ?? "Pending";
	const overallHelp = interpretation
		? OVERALL_RATING_HELP[interpretation.overallSoilRating]
		: "Calculation is queued or in progress.";

	const alerts = (interpretation
		? KEY_FIELDS.map(({ field, label }) => {
				const value = (interpretation as unknown as Record<string, string | null>)[
					field
				];
				const status = categoryToStatus(field, value);
				return { label, value, status };
			})
		: []
	).filter((a) => a.status.tone === "poor" && a.value);

	return (
		<Card variant="outlined" sx={{ mb: 3 }}>
			<CardContent>
				<Stack
					direction={{ xs: "column", md: "row" }}
					spacing={{ xs: 2, md: 4 }}
					divider={<Divider orientation="vertical" flexItem />}
				>
					<Box sx={{ minWidth: 220 }}>
						<Typography variant="overline" color="text.secondary">
							Overall rating
						</Typography>
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							sx={{ my: 0.5 }}
						>
							<Chip
								label={overallLabel}
								color={overall.color}
								size="medium"
							/>
						</Stack>
						<Typography variant="body2" color="text.secondary">
							{overallHelp}
						</Typography>
					</Box>

					<Box sx={{ flex: 1 }}>
						<Typography variant="overline" color="text.secondary">
							Test profile
						</Typography>
						<Stack
							direction="row"
							spacing={1}
							flexWrap="wrap"
							useFlexGap
							sx={{ mt: 0.5, mb: 1 }}
						>
							<Chip
								label={soilTest.testLevel}
								size="small"
								variant="outlined"
							/>
							{physics?.textureClass ? (
								<Chip
									label={`Texture: ${physics.textureClass}`}
									size="small"
									variant="outlined"
								/>
							) : null}
							{soilTest.labName ? (
								<Chip
									label={`Lab: ${soilTest.labName}`}
									size="small"
									variant="outlined"
								/>
							) : null}
						</Stack>
						{alerts.length === 0 ? (
							<Typography variant="body2" color="text.secondary">
								No critical alerts surfaced by the interpretation engine.
							</Typography>
						) : (
							<Stack
								direction="row"
								spacing={1}
								flexWrap="wrap"
								useFlexGap
							>
								{alerts.map((a) => (
									<Chip
										key={a.label}
										label={`${a.label}: ${a.value}`}
										color={a.status.color}
										size="small"
									/>
								))}
							</Stack>
						)}
					</Box>
				</Stack>
			</CardContent>
		</Card>
	);
}
