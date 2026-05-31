/**
 * FlahaSOIL v2 — wizard step: preliminary inputs.
 *
 * Grouped sections: texture, organic matter, reaction & salinity.
 * Two live, non-blocking validators sit alongside the inputs:
 *
 *   - Texture sum-to-100 chip (`validateTextureSum`)
 *   - EC / TDS consistency caption (`checkSalinityConsistency`)
 *
 * Submission is not gated here — the backend zod schema and
 * salinity-normalization layer remain the authoritative guards.
 */
import { Box, Chip, Stack, Typography } from "@mui/material";

import type { SoilTestDraft } from "../state/soilTestDraft";
import {
	PRELIMINARY_GROUPS,
	type FieldGroup,
} from "../utils/soilTestDefaults";
import { checkSalinityConsistency } from "../utils/salinityConsistency";
import { validateTextureSum } from "../utils/textureValidator";
import { FieldSection } from "./FieldSection";

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

	const texture = validateTextureSum(draft.textureInput);
	const salinity = checkSalinityConsistency(draft.chemistryInput);

	return (
		<Box>
			<Typography variant="h6" gutterBottom>
				Texture & basic chemistry
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				Capture the inputs that every soil test needs. Sand, silt and clay
				drive the physics engine; pH and salinity drive the preliminary
				interpretation.
			</Typography>

			{PRELIMINARY_GROUPS.map((group: FieldGroup) => (
				<Box key={group.title}>
					<FieldSection
						group={group}
						valueOf={valueOf}
						onChange={setField}
					/>
					{group.title === "Texture" ? (
						<Stack
							direction="row"
							spacing={1}
							alignItems="center"
							sx={{ mt: -1, mb: 3 }}
						>
							<Chip
								size="small"
								label={
									texture.sum !== null
										? `Sum: ${texture.sum.toFixed(1)} %`
										: "Sum: \u2014"
								}
								color={chipColorFor(texture.status)}
								variant={
									texture.status === "valid" ? "filled" : "outlined"
								}
							/>
							<Typography variant="caption" color="text.secondary">
								{texture.message}
							</Typography>
						</Stack>
					) : null}
					{group.title === "Reaction & salinity" && salinity.message ? (
						<Typography
							variant="caption"
							color={
								salinity.status === "inconsistent"
									? "warning.main"
									: "text.secondary"
							}
							sx={{ display: "block", mt: -1, mb: 2 }}
						>
							{salinity.message}
						</Typography>
					) : null}
				</Box>
			))}
		</Box>
	);
}

function chipColorFor(
	status: ReturnType<typeof validateTextureSum>["status"]
): "default" | "success" | "warning" | "error" {
	switch (status) {
		case "valid":
			return "success";
		case "off-by-a-little":
			return "warning";
		case "invalid":
			return "error";
		default:
			return "default";
	}
}
