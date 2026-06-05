/**
 * FlahaSOIL v2 — ReportCover (Phase 8D G.1).
 *
 * Branded hero card for the first page of the professional report.
 * Combines the FlahaSOIL palette (Deep Soil Brown band, Analytical
 * Cream body, Organic Green accent) with the cover metadata captured
 * by `ProfessionalReportDTO.cover`.
 */
import { Box, Divider, Grid, Stack, Typography } from "@mui/material";
import type { ReportCoverSection } from "@flaha/shared-types";

import { flahaSoilColors } from "../../../theme/flahaSoilTheme";

export interface ReportCoverProps {
	cover: ReportCoverSection;
}

function Field({ label, value }: { label: string; value?: string | null }) {
	return (
		<Box>
			<Typography variant="overline" color="text.secondary">
				{label}
			</Typography>
			<Typography variant="body2" sx={{ fontWeight: 600 }}>
				{value && value !== "" ? value : "—"}
			</Typography>
		</Box>
	);
}

export function ReportCover({ cover }: ReportCoverProps) {
	const coords =
		cover.latitude != null && cover.longitude != null
			? `${cover.latitude.toFixed(4)}°, ${cover.longitude.toFixed(4)}°`
			: null;
	const dateText = new Date(cover.reportDate).toLocaleDateString(undefined, {
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	return (
		<Box
			sx={{
				border: 1,
				borderColor: "divider",
				borderRadius: 2,
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					backgroundColor: flahaSoilColors.deepSoilBrown,
					color: "#FFFFFF",
					px: 4,
					py: 3,
				}}
			>
				<Typography
					variant="overline"
					sx={{ color: flahaSoilColors.sandBeige, letterSpacing: "0.2em" }}
				>
					FlahaSOIL · Professional report
				</Typography>
				<Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
					{cover.reportTitle}
				</Typography>
				<Stack direction="row" spacing={2} sx={{ mt: 1 }}>
					<Typography variant="body2" sx={{ opacity: 0.85 }}>
						Report №&nbsp;<strong>{cover.reportNumber}</strong>
					</Typography>
					<Typography variant="body2" sx={{ opacity: 0.85 }}>
						Issued&nbsp;<strong>{dateText}</strong>
					</Typography>
					<Typography variant="body2" sx={{ opacity: 0.85 }}>
						Test level&nbsp;<strong>{cover.testLevel}</strong>
					</Typography>
				</Stack>
			</Box>
			<Box
				sx={{
					height: 4,
					backgroundColor: flahaSoilColors.organicGreen,
				}}
			/>
			<Box sx={{ backgroundColor: flahaSoilColors.analyticalCream, p: 4 }}>
				<Grid container spacing={3}>
					<Grid item xs={12} md={6}>
						<Stack spacing={2}>
							<Field label="Project" value={cover.projectName} />
							<Field label="Project code" value={cover.projectCode ?? null} />
							<Field label="Client" value={cover.clientName ?? null} />
						</Stack>
					</Grid>
					<Grid item xs={12} md={6}>
						<Stack spacing={2}>
							<Field
								label="Consultant"
								value={
									cover.consultantName
										? `${cover.consultantName}${
												cover.consultantRole ? ` · ${cover.consultantRole}` : ""
											}`
										: null
								}
							/>
							<Field label="Location" value={cover.location ?? null} />
							<Field label="Coordinates" value={coords} />
						</Stack>
					</Grid>
				</Grid>
				<Divider sx={{ my: 3, borderColor: flahaSoilColors.divider }} />
				<Stack direction="row" spacing={4} flexWrap="wrap">
					<Field label="Sample ID" value={cover.sampleId} />
					<Field label="Sample code" value={cover.sampleCode ?? null} />
				</Stack>
			</Box>
		</Box>
	);
}
