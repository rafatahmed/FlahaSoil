/**
 * FlahaSOIL v2 — ReportSnapshotView (Phase 8D F.2).
 *
 * Pure renderer for a `ProfessionalReportDTO` snapshot. Composes the
 * cover, executive summary, texture/physics/chemistry tables, salinity
 * and sodicity badges, irrigation implications, agronomic
 * interpretation, recommendation set, notes and appendix sections.
 * The component is content-only — all interactive controls (print,
 * regenerate, version switching) live on `ReportDetailPage`.
 */
import { Alert, Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import type { ProfessionalReportDTO } from "@flaha/shared-types";

import { ReportCover } from "./ReportCover";
import { ReportFooter } from "./ReportFooter";
import { ReportSectionHeader } from "./ReportSectionHeader";
import { ReportTable } from "./ReportTable";
import { StatusBadge } from "./StatusBadge";
import {
	AgronomicCategoriesBlock,
	IrrigationImplicationsBlock,
	NotesBlock,
	RecommendationGroup,
	SuitabilityBlock,
} from "./ReportSnapshotBlocks";

export interface ReportSnapshotViewProps {
	snapshot: ProfessionalReportDTO;
	versionNumber: number;
	generatedAt: string;
}

export function ReportSnapshotView({
	snapshot,
	versionNumber,
	generatedAt,
}: ReportSnapshotViewProps) {
	const {
		cover,
		executiveSummary,
		texture,
		physics,
		chemistry,
		salinity,
		sodicity,
		irrigation,
		agronomic,
		recommendations,
		notes,
		appendix,
	} = snapshot;

	return (
		<Stack spacing={0}>
			<ReportCover cover={cover} />

			<ReportSectionHeader
				title="Executive summary"
				subtitle="Headline findings for non-technical readers"
				action={<StatusBadge status={executiveSummary.overallRating} />}
			/>
			<Card>
				<CardContent>
					<Stack component="ul" sx={{ pl: 3, m: 0 }} spacing={0.5}>
						{executiveSummary.headlineFindings.map((line, i) => (
							<li key={i}>
								<Typography variant="body2">{line}</Typography>
							</li>
						))}
					</Stack>
					{executiveSummary.actionItemCount > 0 && (
						<Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
							{executiveSummary.actionItemCount} action item
							{executiveSummary.actionItemCount === 1 ? "" : "s"} flagged below.
						</Typography>
					)}
				</CardContent>
			</Card>

			<ReportSectionHeader title="Soil texture" subtitle="USDA classification + composition" />
			<Card><CardContent>
				<ReportTable rows={[
					{ label: "USDA texture class", value: texture.usdaClass },
					{ label: "Sand", value: texture.sandPercent, unit: "%" },
					{ label: "Silt", value: texture.siltPercent, unit: "%" },
					{ label: "Clay", value: texture.clayPercent, unit: "%" },
					{ label: "Organic matter", value: texture.organicMatterPercent, unit: "%" },
				]}/>
			</CardContent></Card>

			<ReportSectionHeader title="Soil physics" subtitle="Saxton & Rawls 2006 hydraulics" />
			<Card><CardContent>
				<ReportTable rows={[
					{ label: "Field capacity", value: physics.fieldCapacity, unit: physics.units.moisture },
					{ label: "Wilting point", value: physics.wiltingPoint, unit: physics.units.moisture },
					{ label: "Plant-available water", value: physics.plantAvailableWater, unit: physics.units.moisture },
					{ label: "Bulk density", value: physics.bulkDensity, unit: physics.units.bulkDensity },
					{ label: "Porosity", value: physics.porosity, unit: physics.units.moisture },
					{ label: "Saturation", value: physics.saturation, unit: physics.units.moisture },
					{ label: "Saturated hydraulic conductivity (Ksat)", value: physics.saturatedConductivity, unit: physics.units.conductivity },
				]}/>
			</CardContent></Card>

			<ReportSectionHeader title="Soil chemistry" subtitle={`Mode: ${chemistry.calculationMode ?? "—"}`} />
			<Card><CardContent>
				<ReportTable rows={[
					{ label: "pH", value: chemistry.pH },
					{ label: "Electrical conductivity (ECe)", value: chemistry.ece, unit: "dS/m" },
					{ label: "Organic matter", value: chemistry.organicMatter, unit: "%" },
					{ label: "CEC", value: chemistry.cec, unit: "cmol+/kg" },
					{ label: "Nitrogen (N)", value: chemistry.macroNutrients.n, unit: "mg/kg" },
					{ label: "Phosphorus (P)", value: chemistry.macroNutrients.p, unit: "mg/kg" },
					{ label: "Potassium (K)", value: chemistry.macroNutrients.k, unit: "mg/kg" },
					{ label: "Calcium (Ca)", value: chemistry.secondaryNutrients.ca, unit: "mg/kg" },
					{ label: "Magnesium (Mg)", value: chemistry.secondaryNutrients.mg, unit: "mg/kg" },
					{ label: "Sulphur (S)", value: chemistry.secondaryNutrients.s, unit: "mg/kg" },
				]}/>
			</CardContent></Card>

			<ReportSectionHeader title="Salinity & sodicity" />
			<Grid container spacing={2}>
				<Grid item xs={12} md={6}><Card><CardContent>
					<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
						<Typography variant="subtitle1" sx={{ flexGrow: 1 }}>Salinity</Typography>
						<StatusBadge status={salinity.severity} />
					</Stack>
					<Typography variant="body2" color="text.secondary">{salinity.riskLabel}</Typography>
					<Typography variant="body2" sx={{ mt: 1 }}>ECe: {salinity.ece ?? "—"} dS/m</Typography>
					<Alert severity="info" sx={{ mt: 1 }}>{salinity.recommendation}</Alert>
				</CardContent></Card></Grid>
				<Grid item xs={12} md={6}><Card><CardContent>
					<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
						<Typography variant="subtitle1" sx={{ flexGrow: 1 }}>Sodicity</Typography>
						<StatusBadge status={sodicity.severity} />
					</Stack>
					<Typography variant="body2">SAR: {sodicity.sar ?? "—"} · ESP: {sodicity.esp ?? "—"} %</Typography>
					<Alert severity="info" sx={{ mt: 1 }}>{sodicity.recommendation}</Alert>
				</CardContent></Card></Grid>
			</Grid>

			<ReportSectionHeader title="Irrigation implications" />
			<Card><CardContent><IrrigationImplicationsBlock irrigation={irrigation} /></CardContent></Card>

			<ReportSectionHeader title="Agronomic interpretation" action={<StatusBadge status={agronomic.overallSoilRating} />} />
			<Card><CardContent>
				<AgronomicCategoriesBlock categories={agronomic.categories} />
				<Box sx={{ mt: 2 }}><SuitabilityBlock suitability={agronomic.suitability} /></Box>
			</CardContent></Card>

			<ReportSectionHeader title="Recommendations" subtitle="Grouped by action horizon" />
			<RecommendationGroup horizon="SHORT" items={recommendations.short} />
			<RecommendationGroup horizon="MEDIUM" items={recommendations.medium} />
			<RecommendationGroup horizon="LONG" items={recommendations.long} />

			<ReportSectionHeader title="Notes & calculation warnings" />
			<Card><CardContent><NotesBlock notes={notes} /></CardContent></Card>

			<ReportSectionHeader title="Appendix" subtitle="Calculation summary + frozen inputs" />
			<Card><CardContent>
				<Typography variant="body2" sx={{ mb: 1 }}>{appendix.calculationSummary}</Typography>
				<pre style={{ margin: 0, fontSize: 12, whiteSpace: "pre-wrap" }}>
					{JSON.stringify(appendix.inputs, null, 2)}
				</pre>
			</CardContent></Card>

			<ReportFooter
				schemaVersion={snapshot.schemaVersion}
				versionNumber={versionNumber}
				generatedAt={generatedAt}
				reportNumber={cover.reportNumber}
			/>
		</Stack>
	);
}
