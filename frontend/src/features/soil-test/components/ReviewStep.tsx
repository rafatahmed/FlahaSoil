/**
 * FlahaSOIL v2 — wizard step: review.
 *
 * Renders the draft as read-only sections and a JSON preview of the
 * `CreateSoilTestRequest` payload that would be sent on submit.
 */
import {
	Box,
	Divider,
	Paper,
	Typography,
} from "@mui/material";

import {
	type SoilTestDraft,
	toCreateSoilTestRequest,
} from "../state/soilTestDraft";

interface ReviewStepProps {
	draft: SoilTestDraft;
	previewSampleId?: string;
}

export function ReviewStep({
	draft,
	previewSampleId = "<sample-id-pending>",
}: ReviewStepProps) {
	const previewRequest = toCreateSoilTestRequest(draft, previewSampleId);

	return (
		<>
			<Typography variant="h6" gutterBottom>
				Review
			</Typography>

			<Section title="Sample">
				<Field label="Location">
					{draft.sampleInfo.locationName ?? "—"}
				</Field>
				<Field label="Coordinates">
					{draft.sampleInfo.latitude ?? "—"},{" "}
					{draft.sampleInfo.longitude ?? "—"}
				</Field>
				<Field label="Depth">
					{draft.sampleInfo.depthFromCm ?? "—"}–
					{draft.sampleInfo.depthToCm ?? "—"} cm
				</Field>
			</Section>

			<Section title="Test">
				<Field label="Level">{draft.testLevel}</Field>
				<Field label="Lab">{draft.labName ?? "—"}</Field>
			</Section>

			<Section title="Payload preview (CreateSoilTestRequest)">
				<Paper
					variant="outlined"
					sx={{
						p: 2,
						bgcolor: "background.default",
						fontFamily: "monospace",
						fontSize: 12,
						overflowX: "auto",
					}}
				>
					<pre style={{ margin: 0 }}>
						{JSON.stringify(previewRequest, null, 2)}
					</pre>
				</Paper>
			</Section>
		</>
	);
}

function Section({
	title,
	children,
}: {
	title: string;
	children: React.ReactNode;
}) {
	return (
		<Box sx={{ mb: 3 }}>
			<Typography variant="subtitle1" fontWeight={600} gutterBottom>
				{title}
			</Typography>
			<Divider sx={{ mb: 1 }} />
			{children}
		</Box>
	);
}

function Field({
	label,
	children,
}: {
	label: string;
	children: React.ReactNode;
}) {
	return (
		<Box sx={{ display: "flex", gap: 2, py: 0.5 }}>
			<Typography
				component="span"
				variant="body2"
				color="text.secondary"
				sx={{ minWidth: 140 }}
			>
				{label}
			</Typography>
			<Typography component="span" variant="body2">
				{children}
			</Typography>
		</Box>
	);
}
