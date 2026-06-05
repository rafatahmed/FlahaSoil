/**
 * FlahaSOIL v2 — ReportSnapshotView sub-blocks (Phase 8D F.2).
 *
 * Extracted to keep the top-level `ReportSnapshotView` composer under
 * the 150-line budget. Each block is a pure, presentational component
 * that consumes one section of the ProfessionalReportDTO.
 */
import {
	Alert,
	Box,
	Card,
	CardContent,
	Chip,
	Divider,
	Stack,
	Typography,
} from "@mui/material";
import type {
	AgronomicInterpretationSection,
	IrrigationImplicationsSection,
	NotesAndWarningsSection,
	RecommendationDTO,
	RecommendationHorizon,
	SuitabilityVerdict,
} from "@flaha/shared-types";

import { flahaSoilColors, flahaSoilStatus } from "../../../theme/flahaSoilTheme";

export function IrrigationImplicationsBlock({
	irrigation,
}: {
	irrigation: IrrigationImplicationsSection;
}) {
	return (
		<Stack spacing={1}>
			<Stack direction="row" spacing={1} flexWrap="wrap">
				<Chip size="small" label={`Infiltration: ${irrigation.infiltrationClass ?? "—"}`} />
				<Chip size="small" label={`Drainage: ${irrigation.drainageClass ?? "—"}`} />
				<Chip size="small" label={`Water holding: ${irrigation.waterHoldingClass ?? "—"}`} />
				<Chip
					size="small"
					label={`Leaching req.: ${
						irrigation.leachingRequirement != null
							? `${(irrigation.leachingRequirement * 100).toFixed(1)}%`
							: "—"
					}`}
				/>
			</Stack>
			{irrigation.notes.length > 0 && (
				<Stack component="ul" sx={{ pl: 3, m: 0 }} spacing={0.25}>
					{irrigation.notes.map((n, i) => (
						<li key={i}>
							<Typography variant="body2" color="text.secondary">
								{n}
							</Typography>
						</li>
					))}
				</Stack>
			)}
		</Stack>
	);
}

export function AgronomicCategoriesBlock({
	categories,
}: {
	categories: AgronomicInterpretationSection["categories"];
}) {
	return (
		<Stack spacing={1}>
			{categories.map((c) => (
				<Stack key={c.label} direction="row" spacing={1} alignItems="center">
					<Box
						sx={{
							width: 8,
							height: 8,
							borderRadius: "50%",
							backgroundColor: flahaSoilStatus[c.status],
						}}
					/>
					<Typography variant="body2" sx={{ flexGrow: 1 }}>
						{c.label}
					</Typography>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						{c.value}
					</Typography>
				</Stack>
			))}
		</Stack>
	);
}

export function SuitabilityBlock({
	suitability,
}: {
	suitability: AgronomicInterpretationSection["suitability"];
}) {
	const entries: Array<[string, SuitabilityVerdict | undefined]> = [
		["Turfgrass", suitability.turfgrass],
		["Landscape", suitability.landscape],
		["Agriculture", suitability.agriculture],
		["Irrigation", suitability.irrigation],
	];
	return (
		<Stack spacing={1}>
			{entries
				.filter(([, v]) => v != null)
				.map(([label, v]) => (
					<Box key={label}>
						<Stack direction="row" spacing={1} alignItems="center">
							<Typography variant="body2" sx={{ flexGrow: 1, fontWeight: 600 }}>
								{label}
							</Typography>
							<Chip size="small" label={v!.verdict} />
						</Stack>
						{v!.reasons.length > 0 && (
							<Typography variant="caption" color="text.secondary">
								{v!.reasons.join(" · ")}
							</Typography>
						)}
					</Box>
				))}
		</Stack>
	);
}

export function RecommendationGroup({
	horizon,
	items,
}: {
	horizon: RecommendationHorizon;
	items: RecommendationDTO[];
}) {
	if (items.length === 0) return null;
	return (
		<Card sx={{ mb: 1 }}>
			<CardContent>
				<Typography
					variant="overline"
					sx={{ color: flahaSoilColors.deepSoilBrown, letterSpacing: "0.15em" }}
				>
					{horizon} term · {items.length} item{items.length === 1 ? "" : "s"}
				</Typography>
				<Divider sx={{ my: 1 }} />
				<Stack spacing={1.5}>
					{items.map((r) => (
						<Box key={r.code}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Chip size="small" label={r.severity} />
								<Chip size="small" variant="outlined" label={r.category} />
								<Typography variant="caption" color="text.secondary">
									{r.code}
								</Typography>
							</Stack>
							<Typography variant="subtitle2" sx={{ mt: 0.5 }}>
								{r.title}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{r.body}
							</Typography>
							{r.bullets && r.bullets.length > 0 && (
								<Stack component="ul" sx={{ pl: 3, m: 0, mt: 0.5 }} spacing={0.25}>
									{r.bullets.map((b, i) => (
										<li key={i}>
											<Typography variant="body2">{b}</Typography>
										</li>
									))}
								</Stack>
							)}
						</Box>
					))}
				</Stack>
			</CardContent>
		</Card>
	);
}

export function NotesBlock({ notes }: { notes: NotesAndWarningsSection }) {
	const isEmpty =
		notes.missingValues.length === 0 &&
		notes.estimatedValues.length === 0 &&
		notes.calculationWarnings.length === 0;
	if (isEmpty) {
		return (
			<Typography variant="body2" color="text.secondary">
				No missing values, estimates, or calculation warnings.
			</Typography>
		);
	}
	return (
		<Stack spacing={1}>
			{notes.missingValues.length > 0 && (
				<Box>
					<Typography variant="subtitle2">Missing values</Typography>
					<Typography variant="body2" color="text.secondary">
						{notes.missingValues.join(", ")}
					</Typography>
				</Box>
			)}
			{notes.estimatedValues.length > 0 && (
				<Box>
					<Typography variant="subtitle2">Estimated values</Typography>
					<Typography variant="body2" color="text.secondary">
						{notes.estimatedValues.join(", ")}
					</Typography>
				</Box>
			)}
			{notes.calculationWarnings.length > 0 && (
				<Stack spacing={0.5}>
					{notes.calculationWarnings.map((w, i) => (
						<Alert
							key={i}
							severity={
								w.severity === "critical"
									? "error"
									: w.severity === "info"
										? "info"
										: "warning"
							}
							variant="outlined"
						>
							<strong>{w.code}</strong> — {w.message}
						</Alert>
					))}
				</Stack>
			)}
		</Stack>
	);
}
