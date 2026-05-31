/**
 * FlahaSOIL v2 — wizard step: sample identity.
 *
 * Captures the fields needed to build a `CreateSoilSampleRequest`.
 * Ownership is resolved server-side from the dev-session (Phase 8B),
 * so this step no longer reads or forwards a user id. The raw
 * `projectId` text field was replaced in Phase 8A with a
 * `ProjectSelector` so the user only ever picks from real projects.
 */
import { Grid, TextField, Typography } from "@mui/material";

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
		<>
			<Typography variant="h6" gutterBottom>
				Sample information
			</Typography>
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<ProjectSelector
						value={value.projectId ?? null}
						onChange={(projectId) => set("projectId", projectId)}
					/>
				</Grid>
				<Grid item xs={12} sm={6}>
					<TextField
						label="Location name"
						fullWidth
						value={value.locationName ?? ""}
						onChange={(e) => set("locationName", e.target.value || null)}
					/>
				</Grid>
				<Grid item xs={6} sm={3}>
					<TextField
						label="Latitude"
						type="number"
						fullWidth
						value={value.latitude ?? ""}
						onChange={(e) =>
							set("latitude", e.target.value === "" ? null : Number(e.target.value))
						}
					/>
				</Grid>
				<Grid item xs={6} sm={3}>
					<TextField
						label="Longitude"
						type="number"
						fullWidth
						value={value.longitude ?? ""}
						onChange={(e) =>
							set(
								"longitude",
								e.target.value === "" ? null : Number(e.target.value)
							)
						}
					/>
				</Grid>
				<Grid item xs={6} sm={3}>
					<TextField
						label="Depth from (cm)"
						type="number"
						fullWidth
						value={value.depthFromCm ?? ""}
						onChange={(e) =>
							set(
								"depthFromCm",
								e.target.value === "" ? null : Number(e.target.value)
							)
						}
					/>
				</Grid>
				<Grid item xs={6} sm={3}>
					<TextField
						label="Depth to (cm)"
						type="number"
						fullWidth
						value={value.depthToCm ?? ""}
						onChange={(e) =>
							set(
								"depthToCm",
								e.target.value === "" ? null : Number(e.target.value)
							)
						}
					/>
				</Grid>
				<Grid item xs={12} sm={6}>
					<TextField
						label="Sample date"
						type="date"
						fullWidth
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
		</>
	);
}
