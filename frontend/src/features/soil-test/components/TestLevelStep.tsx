/**
 * FlahaSOIL v2 — wizard step: test level selection.
 *
 * Rendered as three selectable cards instead of a flat radio group so
 * the user can see, side-by-side, what each level captures and which
 * scenarios it suits. Selection drives which subsequent steps are
 * shown (see `visibleStepsForLevel`).
 */
import {
	Box,
	Card,
	CardActionArea,
	CardContent,
	Chip,
	Grid,
	Radio,
	Stack,
	Typography,
} from "@mui/material";
import { SoilTestLevel } from "@flaha/shared-types";

import { TEST_LEVEL_OPTIONS } from "../utils/soilTestDefaults";

interface TestLevelStepProps {
	value: SoilTestLevel;
	onChange: (next: SoilTestLevel) => void;
}

export function TestLevelStep({ value, onChange }: TestLevelStepProps) {
	return (
		<Box>
			<Typography variant="h6" gutterBottom>
				Test level
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				Choose the depth of analysis that matches your lab report. You
				can always start with Preliminary and submit a Moderate or
				Advanced test later for the same sample.
			</Typography>

			<Grid container spacing={2} role="radiogroup" aria-label="Test level">
				{TEST_LEVEL_OPTIONS.map((opt) => {
					const selected = value === opt.value;
					return (
						<Grid item xs={12} md={4} key={opt.value}>
							<Card
								variant="outlined"
								sx={{
									height: "100%",
									borderColor: selected ? "primary.main" : "divider",
									borderWidth: selected ? 2 : 1,
									transition:
										"border-color 120ms ease, box-shadow 120ms ease",
								}}
							>
								<CardActionArea
									onClick={() => onChange(opt.value)}
									sx={{ height: "100%", alignItems: "stretch" }}
								>
									<CardContent>
										<Stack
											direction="row"
											spacing={1}
											alignItems="center"
											sx={{ mb: 1 }}
										>
											<Radio
												checked={selected}
												value={opt.value}
												name="test-level"
												size="small"
												onChange={() => onChange(opt.value)}
												inputProps={{
													"aria-label": `Select ${opt.label}`,
												}}
												sx={{ p: 0.5 }}
											/>
											<Typography variant="subtitle1" fontWeight={600}>
												{opt.label}
											</Typography>
											{selected ? (
												<Chip
													label="Selected"
													size="small"
													color="primary"
													variant="outlined"
												/>
											) : null}
										</Stack>
										<Typography
											variant="body2"
											sx={{ mb: 2 }}
										>
											{opt.description}
										</Typography>
										<MetaRow label="Captures" value={opt.captures} />
										<MetaRow label="Best for" value={opt.bestFor} />
									</CardContent>
								</CardActionArea>
							</Card>
						</Grid>
					);
				})}
			</Grid>
		</Box>
	);
}

function MetaRow({ label, value }: { label: string; value: string }) {
	return (
		<Box sx={{ mb: 1 }}>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
			>
				{label}
			</Typography>
			<Typography variant="body2">{value}</Typography>
		</Box>
	);
}
