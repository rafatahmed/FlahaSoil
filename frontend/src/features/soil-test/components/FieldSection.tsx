/**
 * FlahaSOIL v2 — wizard field-group section.
 *
 * Reusable presentational wrapper: shows a section title, optional
 * caption, and a responsive grid of MUI TextFields driven by a list
 * of `FieldMeta` entries. Used by the preliminary / moderate /
 * advanced input steps to render their grouped inputs uniformly.
 */
import { Box, Grid, TextField, Typography } from "@mui/material";

import type { FieldGroup } from "../utils/soilTestDefaults";

interface FieldSectionProps {
	group: FieldGroup;
	valueOf: (key: string) => string;
	onChange: (key: string, raw: string) => void;
}

export function FieldSection({ group, valueOf, onChange }: FieldSectionProps) {
	return (
		<Box sx={{ mb: 3 }}>
			<Typography variant="subtitle1" fontWeight={600}>
				{group.title}
			</Typography>
			{group.caption ? (
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ display: "block", mb: 1.5 }}
				>
					{group.caption}
				</Typography>
			) : (
				<Box sx={{ mb: 1 }} />
			)}
			<Grid container spacing={2}>
				{group.fields.map((field) => (
					<Grid item xs={12} sm={6} md={4} key={field.key}>
						<TextField
							label={
								field.unit ? `${field.label} (${field.unit})` : field.label
							}
							type="number"
							fullWidth
							size="small"
							value={valueOf(field.key)}
							onChange={(e) => onChange(field.key, e.target.value)}
							helperText={field.helperText}
						/>
					</Grid>
				))}
			</Grid>
		</Box>
	);
}
