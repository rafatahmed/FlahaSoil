/**
 * FlahaSOIL v2 — wizard step: preliminary inputs.
 *
 * Texture + organic matter + basic salinity. Renders a grid of
 * MUI TextFields driven by `PRELIMINARY_FIELDS`. Phase 5 has no
 * validation; raw user values flow into the draft.
 */
import { Grid, TextField, Typography } from "@mui/material";

import type { SoilTestDraft } from "../state/soilTestDraft";
import { PRELIMINARY_FIELDS } from "../utils/soilTestDefaults";

interface PreliminaryInputStepProps {
	draft: SoilTestDraft;
	onChange: (next: SoilTestDraft) => void;
}

const TEXTURE_KEYS = new Set([
	"sandPercent",
	"siltPercent",
	"clayPercent",
	"organicMatterPercent",
]);

export function PreliminaryInputStep({
	draft,
	onChange,
}: PreliminaryInputStepProps) {
	const setField = (key: string, raw: string) => {
		const num = raw === "" ? null : Number(raw);
		if (TEXTURE_KEYS.has(key)) {
			onChange({
				...draft,
				textureInput: { ...draft.textureInput, [key]: num },
			});
		} else {
			onChange({
				...draft,
				chemistryInput: { ...draft.chemistryInput, [key]: num },
			});
		}
	};

	const valueOf = (key: string): string => {
		const src = TEXTURE_KEYS.has(key)
			? (draft.textureInput as Record<string, unknown>)
			: (draft.chemistryInput as Record<string, unknown>);
		const v = src[key];
		return v === null || v === undefined ? "" : String(v);
	};

	return (
		<>
			<Typography variant="h6" gutterBottom>
				Preliminary inputs
			</Typography>
			<Grid container spacing={2}>
				{PRELIMINARY_FIELDS.map((field) => (
					<Grid item xs={12} sm={6} md={4} key={field.key}>
						<TextField
							label={
								field.unit ? `${field.label} (${field.unit})` : field.label
							}
							type="number"
							fullWidth
							value={valueOf(field.key)}
							onChange={(e) => setField(field.key, e.target.value)}
							helperText={field.helperText}
						/>
					</Grid>
				))}
			</Grid>
		</>
	);
}
