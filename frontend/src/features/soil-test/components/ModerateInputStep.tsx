/**
 * FlahaSOIL v2 — wizard step: moderate (chemistry) inputs.
 *
 * Grouped sections: exchangeable cations, macronutrients & anions,
 * CEC. All fields land on `draft.chemistryInput`. Validation is the
 * backend's responsibility.
 */
import { Box, Typography } from "@mui/material";

import type { SoilTestDraft } from "../state/soilTestDraft";
import { MODERATE_GROUPS } from "../utils/soilTestDefaults";
import { FieldSection } from "./FieldSection";

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
		<Box>
			<Typography variant="h6" gutterBottom>
				Core chemistry panel
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				Major cations and macronutrients enable the chemistry engine and
				unlock CEC, base saturation and cation-balance interpretations.
			</Typography>

			{MODERATE_GROUPS.map((group) => (
				<FieldSection
					key={group.title}
					group={group}
					valueOf={valueOf}
					onChange={setField}
				/>
			))}
		</Box>
	);
}
