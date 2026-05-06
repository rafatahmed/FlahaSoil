/**
 * FlahaSOIL v2 — wizard step: moderate (chemistry) inputs.
 *
 * All fields land on `draft.chemistryInput`. No validation in Phase 5.
 */
import { Grid, TextField, Typography } from "@mui/material";

import type { SoilTestDraft } from "../state/soilTestDraft";
import { MODERATE_FIELDS } from "../utils/soilTestDefaults";

interface ModerateInputStepProps {
	draft: SoilTestDraft;
	onChange: (next: SoilTestDraft) => void;
}

export function ModerateInputStep({
	draft,
	onChange,
}: ModerateInputStepProps) {
	const setField = (key: string, raw: string) => {
		const num = raw === "" ? null : Number(raw);
		onChange({
			...draft,
			chemistryInput: { ...draft.chemistryInput, [key]: num },
		});
	};

	const valueOf = (key: string): string => {
		const v = (draft.chemistryInput as Record<string, unknown>)[key];
		return v === null || v === undefined ? "" : String(v);
	};

	return (
		<>
			<Typography variant="h6" gutterBottom>
				Moderate inputs
			</Typography>
			<Grid container spacing={2}>
				{MODERATE_FIELDS.map((field) => (
					<Grid item xs={12} sm={6} md={4} key={field.key}>
						<TextField
							label={
								field.unit ? `${field.label} (${field.unit})` : field.label
							}
							type="number"
							fullWidth
							value={valueOf(field.key)}
							onChange={(e) => setField(field.key, e.target.value)}
						/>
					</Grid>
				))}
			</Grid>
		</>
	);
}
