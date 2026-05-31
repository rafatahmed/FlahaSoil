/**
 * FlahaSOIL v2 — wizard step: sample identity.
 *
 * Captures the fields needed to build a `CreateSoilSampleRequest`.
 * Ownership is resolved server-side from the dev-session (Phase 8B),
 * so this step no longer reads or forwards a user id. The raw
 * `projectId` text field was replaced in Phase 8A with a
 * `ProjectSelector` so the user only ever picks from real projects.
 */
import { Box, Grid, TextField, Typography } from "@mui/material";

import type { SoilTestDraftSampleInfo } from "../state/soilTestDraft";
import { ProjectSelector } from "./ProjectSelector";

interface SampleInfoStepProps {
	value: SoilTestDraftSampleInfo;
	onChange: (next: SoilTestDraftSampleInfo) => void;
}

export function SampleInfoStep({ value, onChange }: SampleInfoStepProps) {
	const set = <K extends keyof SoilTestDraftSampleInfo>(
		key: K,
		next: SoilTestDraftSampleInfo[K]
	) => onChange({ ...value, [key]: next });

	return (
		<Box>
			<Typography variant="h6" gutterBottom>
				Sample information
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				Tell us where this sample came from. The owning project
				determines reporting, sharing and ownership. Location and depth
				are optional but improve audit-trail quality.
			</Typography>

			<Section title="Owning project">
				<ProjectSelector
					value={value.projectId ?? null}
					onChange={(projectId) => set("projectId", projectId)}
				/>
			</Section>

			<Section
				title="Identity"
				caption="A short, recognisable name helps later when comparing samples within a project."
			>
				<Grid container spacing={2}>
					<Grid item xs={12} sm={6}>
						<TextField
							label="Location name"
							fullWidth
							size="small"
							value={value.locationName ?? ""}
							onChange={(e) => set("locationName", e.target.value || null)}
						/>
					</Grid>
					<Grid item xs={12} sm={6}>
						<TextField
							label="Sample date"
							type="date"
							fullWidth
							size="small"
							InputLabelProps={{ shrink: true }}
							value={value.sampleDate?.slice(0, 10) ?? ""}
							onChange={(e) =>
								set(
									"sampleDate",
									e.target.value
										? new Date(e.target.value).toISOString()
										: null
								)
							}
						/>
					</Grid>
				</Grid>
			</Section>

			<Section
				title="Coordinates"
				caption="Decimal degrees, WGS84. Leave blank for indoor or hypothetical samples."
			>
				<Grid container spacing={2}>
					<Grid item xs={6}>
						<TextField
							label="Latitude"
							type="number"
							fullWidth
							size="small"
							value={value.latitude ?? ""}
							onChange={(e) =>
								set(
									"latitude",
									e.target.value === "" ? null : Number(e.target.value)
								)
							}
						/>
					</Grid>
					<Grid item xs={6}>
						<TextField
							label="Longitude"
							type="number"
							fullWidth
							size="small"
							value={value.longitude ?? ""}
							onChange={(e) =>
								set(
									"longitude",
									e.target.value === "" ? null : Number(e.target.value)
								)
							}
						/>
					</Grid>
				</Grid>
			</Section>

			<Section
				title="Depth interval"
				caption="Centimetres below surface. Use the same interval the lab analysed."
			>
				<Grid container spacing={2}>
					<Grid item xs={6}>
						<TextField
							label="From (cm)"
							type="number"
							fullWidth
							size="small"
							value={value.depthFromCm ?? ""}
							onChange={(e) =>
								set(
									"depthFromCm",
									e.target.value === "" ? null : Number(e.target.value)
								)
							}
						/>
					</Grid>
					<Grid item xs={6}>
						<TextField
							label="To (cm)"
							type="number"
							fullWidth
							size="small"
							value={value.depthToCm ?? ""}
							onChange={(e) =>
								set(
									"depthToCm",
									e.target.value === "" ? null : Number(e.target.value)
								)
							}
						/>
					</Grid>
				</Grid>
			</Section>
		</Box>
	);
}

function Section({
	title,
	caption,
	children,
}: {
	title: string;
	caption?: string;
	children: React.ReactNode;
}) {
	return (
		<Box sx={{ mb: 3 }}>
			<Typography variant="subtitle1" fontWeight={600}>
				{title}
			</Typography>
			{caption ? (
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ display: "block", mb: 1.5 }}
				>
					{caption}
				</Typography>
			) : (
				<Box sx={{ mb: 1 }} />
			)}
			{children}
		</Box>
	);
}
