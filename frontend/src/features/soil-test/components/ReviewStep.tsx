/**
 * FlahaSOIL v2 — wizard step: review.
 *
 * Human-readable summary first: sample identity, test level, what
 * was captured per panel, and a pre-submit checklist with the
 * texture-sum / project-selected status. The raw
 * `CreateSoilTestRequest` JSON moves behind a "Developer details"
 * accordion so non-technical reviewers can focus on the content.
 */
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Chip,
	Divider,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Paper,
	Stack,
	Typography,
} from "@mui/material";
import {
	CheckCircleOutline as CheckIcon,
	ExpandMore as ExpandMoreIcon,
	ErrorOutline as ErrorIcon,
	HelpOutline as HelpIcon,
} from "@mui/icons-material";

import {
	type SoilTestDraft,
	toCreateSoilTestRequest,
} from "../state/soilTestDraft";
import { validateTextureSum } from "../utils/textureValidator";
import { checkSalinityConsistency } from "../utils/salinityConsistency";
import { TEST_LEVEL_OPTIONS } from "../utils/soilTestDefaults";

interface ReviewStepProps {
	draft: SoilTestDraft;
	previewSampleId?: string;
}

export function ReviewStep({
	draft,
	previewSampleId = "<sample-id-pending>",
}: ReviewStepProps) {
	const previewRequest = toCreateSoilTestRequest(draft, previewSampleId);
	const texture = validateTextureSum(draft.textureInput);
	const salinity = checkSalinityConsistency(draft.chemistryInput);
	const levelMeta = TEST_LEVEL_OPTIONS.find((o) => o.value === draft.testLevel);

	const checks: ChecklistItem[] = [
		{
			ok: !!draft.sampleInfo.projectId,
			label: draft.sampleInfo.projectId
				? "Owning project selected"
				: "Owning project is required before submission",
			severity: draft.sampleInfo.projectId ? "ok" : "blocking",
		},
		{
			ok: texture.status === "valid",
			label:
				texture.status === "valid"
					? `Texture sums to ${texture.sum?.toFixed(1)} %`
					: texture.message,
			severity:
				texture.status === "valid"
					? "ok"
					: texture.status === "incomplete"
						? "hint"
						: "warning",
		},
		{
			ok: salinity.status !== "inconsistent",
			label:
				salinity.status === "inconsistent"
					? (salinity.message ?? "EC and TDS look inconsistent")
					: salinity.status === "missing"
						? "EC / TDS not provided (interpretation will use defaults)"
						: (salinity.message ??
							"EC / TDS look consistent"),
			severity:
				salinity.status === "inconsistent"
					? "warning"
					: salinity.status === "missing"
						? "hint"
						: "ok",
		},
	];

	return (
		<Box>
			<Typography variant="h6" gutterBottom>
				Review &amp; submit
			</Typography>
			<Typography color="text.secondary" sx={{ mb: 3 }}>
				Check the summary below. When you are happy, hit{" "}
				<em>Submit soil test</em> to persist the sample and run the
				calculation engine.
			</Typography>

			<Section title="Pre-submit checklist">
				<Checklist items={checks} />
			</Section>

			<Section title="Sample">
				<Field label="Location">
					{draft.sampleInfo.locationName ?? DASH}
				</Field>
				<Field label="Coordinates">
					{draft.sampleInfo.latitude ?? DASH},{" "}
					{draft.sampleInfo.longitude ?? DASH}
				</Field>
				<Field label="Depth">
					{draft.sampleInfo.depthFromCm ?? DASH}
					{EN_DASH}
					{draft.sampleInfo.depthToCm ?? DASH} cm
				</Field>
				<Field label="Sample date">
					{draft.sampleInfo.sampleDate?.slice(0, 10) ?? DASH}
				</Field>
			</Section>

			<Section title="Test level">
				<Stack direction="row" spacing={1} sx={{ mb: 1 }} alignItems="center">
					<Chip
						label={levelMeta?.label ?? String(draft.testLevel)}
						color="primary"
						size="small"
					/>
					<Typography variant="body2" color="text.secondary">
						{levelMeta?.description ?? ""}
					</Typography>
				</Stack>
				<Field label="Lab">{draft.labName ?? DASH}</Field>
				<Field label="Lab reference">{draft.labReference ?? DASH}</Field>
			</Section>

			<Section title="Texture inputs">
				<DraftRows
					rows={[
						["Sand", draft.textureInput.sandPercent, "%"],
						["Silt", draft.textureInput.siltPercent, "%"],
						["Clay", draft.textureInput.clayPercent, "%"],
						["Organic matter", draft.textureInput.organicMatterPercent, "%"],
						["Bulk density", draft.textureInput.bulkDensity, "g/cm\u00B3"],
					]}
				/>
			</Section>

			<Section title="Chemistry inputs">
				<DraftRows
					rows={[
						["pH", draft.chemistryInput.pH, ""],
						["EC", draft.chemistryInput.ecDsM, "dS/m"],
						["TDS", draft.chemistryInput.tdsMgL, "mg/L"],
						["CEC", draft.chemistryInput.cec, "cmol(+)/kg"],
						["Ca", draft.chemistryInput.ca, "cmol(+)/kg"],
						["Mg", draft.chemistryInput.mg, "cmol(+)/kg"],
						["K", draft.chemistryInput.k, "cmol(+)/kg"],
						["Na", draft.chemistryInput.na, "cmol(+)/kg"],
					]}
				/>
			</Section>

			{draft.notes ? (
				<Section title="Notes">
					<Alert severity="info" variant="outlined">
						{draft.notes}
					</Alert>
				</Section>
			) : null}

			<Accordion variant="outlined" disableGutters sx={{ mt: 2 }}>
				<AccordionSummary expandIcon={<ExpandMoreIcon />}>
					<Typography variant="body2" color="text.secondary">
						{`Developer details \u2014 raw CreateSoilTestRequest payload`}
					</Typography>
				</AccordionSummary>
				<AccordionDetails>
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
				</AccordionDetails>
			</Accordion>
		</Box>
	);
}

const DASH = "\u2014";
const EN_DASH = "\u2013";

interface ChecklistItem {
	ok: boolean;
	label: string;
	severity: "ok" | "warning" | "blocking" | "hint";
}

function Checklist({ items }: { items: ChecklistItem[] }) {
	return (
		<List dense disablePadding>
			{items.map((item, idx) => (
				<ListItem key={idx} disableGutters sx={{ py: 0.25 }}>
					<ListItemIcon sx={{ minWidth: 32 }}>
						{item.severity === "ok" ? (
							<CheckIcon color="success" fontSize="small" />
						) : item.severity === "blocking" ? (
							<ErrorIcon color="error" fontSize="small" />
						) : item.severity === "warning" ? (
							<ErrorIcon color="warning" fontSize="small" />
						) : (
							<HelpIcon color="disabled" fontSize="small" />
						)}
					</ListItemIcon>
					<ListItemText
						primary={item.label}
						primaryTypographyProps={{ variant: "body2" }}
					/>
				</ListItem>
			))}
		</List>
	);
}

type DraftRowValue = number | string | null | undefined;
function DraftRows({ rows }: { rows: Array<[string, DraftRowValue, string]> }) {
	const populated = rows.filter(
		([, value]) => value !== null && value !== undefined && value !== ""
	);
	if (populated.length === 0) {
		return (
			<Typography variant="body2" color="text.secondary">
				No values supplied for this panel.
			</Typography>
		);
	}
	return (
		<Box>
			{populated.map(([label, value, unit]) => (
				<Field key={label} label={label}>
					{value}
					{unit ? ` ${unit}` : ""}
				</Field>
			))}
		</Box>
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
