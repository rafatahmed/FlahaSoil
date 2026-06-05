/**
 * FlahaSOIL v2 — wizard step: advanced (micronutrient + salinity) inputs.
 *
 * Grouped sections: micronutrients and salinity / sodicity indices.
 * All fields land on `draft.chemistryInput`. Validation is the
 * backend's responsibility.
 */
import { Box, Typography } from "@mui/material";

import type { SoilTestDraft } from "../state/soilTestDraft";
import { ADVANCED_GROUPS } from "../utils/soilTestDefaults";
import { FieldSection } from "./FieldSection";

interface AdvancedInputStepProps {
	draft: SoilTestDraft;
	onChange: (next: SoilTestDraft) => void;
}

export function AdvancedInputStep({
	draft,
	onChange,
}: AdvancedInputStepProps) {
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
				Micronutrients & salinity indices
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				Optional inputs for full advisory: micronutrients enable
				deficiency screening, SAR / ESP enable sodicity diagnosis.
			</Typography>

			{ADVANCED_GROUPS.map((group) => (
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
