/**
 * FlahaSOIL v2 — CEC structure triangle SVG (Phase 10A.7 R2 — B10).
 *
 * Renders the canonical `assets/img/Structure Triangle.svg` asset as
 * the diagram backdrop and overlays the sample point under the
 * **CEC saturation** methodology (USDA-NRCS / FAO style) rather than
 * the Bear/Albrecht pure-cation share:
 *
 *   - Ca_sat (%)   = Ca / CEC × 100
 *   - Mg_sat (%)   = Mg / CEC × 100
 *   - Residual (%) = 100 − Ca_sat − Mg_sat
 *                    (carries K + Na + H/Al exchangeable acidity)
 *
 * The "Residual" apex deliberately replaces the legacy K apex so the
 * triangle reports the **complete** unaccounted-for share of CEC
 * (potassium, sodium, and exchangeable acidity), which is what
 * structural-stability work actually needs. The asset's coloured
 * polygons are kept as a visual reference only; classification still
 * comes from `@flaha/soil-chemistry` (`STRUCTURE_THRESHOLDS`).
 *
 * SVG apex coordinates (extracted from the outermost triangle path):
 *   - Ca apex       : (408.28, 135.90)  ← top
 *   - Residual apex : ( 43.87, 562.74)  ← bottom-left (was "K")
 *   - Mg apex       : (780.58, 562.74)  ← bottom-right
 */
import { Box, Chip, Stack, Typography } from "@mui/material";
import type { StructureAnalysisBlock } from "@flaha/shared-types";

// SVG viewBox is 0 0 842 842; apex coords are taken verbatim from
// the asset's outermost triangle path so the overlay is pixel-aligned.
const SVG_SIZE = 842;
const APEX_CA = { x: 408.28, y: 135.9 };
const APEX_RESIDUAL = { x: 43.87, y: 562.74 };
const APEX_MG = { x: 780.58, y: 562.74 };

const STRUCTURE_TRIANGLE_URL = "/assets/img/Structure%20Triangle.svg";

const VERDICT_COLOR: Record<string, string> = {
	Balanced: "success",
	"Calcium Excess": "warning",
	"Magnesium Excess": "warning",
	"Potassium Excess": "warning",
	"Calcium Deficient": "error",
	"Magnesium Deficient": "error",
	"Potassium Deficient": "error",
};

interface CecSaturation {
	caSat: number;
	mgSat: number;
	residual: number;
}

/**
 * Compute Ca / Mg / residual CEC saturation. Returns null when CEC
 * is missing or non-positive so the caller can render an empty-state
 * instead of a misleading divide-by-zero point.
 */
function computeCecSaturation(s: StructureAnalysisBlock): CecSaturation | null {
	if (!s.cec || s.cec <= 0) return null;
	const caSat = (s.ca / s.cec) * 100;
	const mgSat = (s.mg / s.cec) * 100;
	const residual = Math.max(0, 100 - caSat - mgSat);
	return { caSat, mgSat, residual };
}

/**
 * Map a (Ca_sat %, Mg_sat %, Residual %) triple onto the SVG using
 * barycentric weights against the three apex coordinates. Inputs are
 * percent (0-100) and need not sum exactly to 100; we normalise
 * defensively in case the caller passes raw fractions.
 */
function barycentric(
	caSat: number,
	mgSat: number,
	residual: number
): { x: number; y: number } {
	const sum = caSat + mgSat + residual || 1;
	const a = caSat / sum;
	const m = mgSat / sum;
	const r = residual / sum;
	return {
		x: a * APEX_CA.x + m * APEX_MG.x + r * APEX_RESIDUAL.x,
		y: a * APEX_CA.y + m * APEX_MG.y + r * APEX_RESIDUAL.y,
	};
}

interface StructureTriangleChartProps {
	structure: StructureAnalysisBlock | null;
}

export function StructureTriangleChart({ structure }: StructureTriangleChartProps) {
	const saturation = structure ? computeCecSaturation(structure) : null;
	const point = saturation
		? barycentric(saturation.caSat, saturation.mgSat, saturation.residual)
		: null;
	const verdictColor =
		(structure?.classification && VERDICT_COLOR[structure.classification]) ?? "default";

	return (
		<Stack spacing={1.5}>
			<Box
				component="svg"
				viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
				role="img"
				aria-label="CEC structure triangle (Ca / Mg / Residual saturation)"
				sx={{ width: "100%", height: "auto", maxWidth: SVG_SIZE }}
			>
				{/* B10 — embed the canonical asset as the backdrop. */}
				<image
					href={STRUCTURE_TRIANGLE_URL}
					x={0}
					y={0}
					width={SVG_SIZE}
					height={SVG_SIZE}
					data-testid="structure-triangle-backdrop"
				/>
				{/* Apex labels drawn on top of the backdrop — the bottom-left
				    apex is "Residual" (K + Na + exchangeable acidity), NOT
				    K alone, since the methodology is CEC saturation. */}
				<text x={APEX_CA.x} y={APEX_CA.y - 14} textAnchor="middle" fontSize={22} fontWeight={600} fill="#222">
					Ca
				</text>
				<text x={APEX_RESIDUAL.x - 8} y={APEX_RESIDUAL.y + 28} textAnchor="end" fontSize={22} fontWeight={600} fill="#222">
					Residual
				</text>
				<text x={APEX_MG.x + 8} y={APEX_MG.y + 28} textAnchor="start" fontSize={22} fontWeight={600} fill="#222">
					Mg
				</text>
				{point && saturation ? (
					<circle
						cx={point.x}
						cy={point.y}
						r={14}
						fill="#6a1b9a"
						stroke="#fff"
						strokeWidth={4}
						data-testid="structure-point"
					>
						<title>
							{`Ca-sat ${saturation.caSat.toFixed(1)}% · Mg-sat ${saturation.mgSat.toFixed(1)}% · Residual ${saturation.residual.toFixed(1)}%`}
						</title>
					</circle>
				) : null}
			</Box>
			{structure ? (
				<Stack spacing={1}>
					<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
						<Chip
							size="small"
							color={verdictColor as "default" | "success" | "warning" | "error"}
							label={structure.classification ?? "Unclassified"}
						/>
						<Typography variant="body2" color="text.secondary">
							{saturation
								? `Ca-sat ${saturation.caSat.toFixed(1)}% · Mg-sat ${saturation.mgSat.toFixed(1)}% · Residual ${saturation.residual.toFixed(1)}% · CEC ${(structure.cec ?? 0).toFixed(1)} ${structure.unit}`
								: `CEC missing — saturation cannot be computed (showing classification only). Ca:Mg ${structure.caMgRatio.toFixed(1)} · Ca:K ${structure.caKRatio.toFixed(1)} · Mg:K ${structure.mgKRatio.toFixed(1)}`}
						</Typography>
					</Stack>
					<Typography
						variant="caption"
						color="text.secondary"
						data-testid="structure-disclaimer"
						sx={{ fontStyle: "italic" }}
					>
						CEC saturation methodology: Ca-sat = Ca / CEC × 100, Mg-sat = Mg / CEC × 100, Residual = 100 − Ca-sat − Mg-sat (includes K, Na, and exchangeable acidity). {structure.disclaimer}
					</Typography>
				</Stack>
			) : (
				<Typography variant="body2" color="text.secondary">
					No structure data — enter Ca / Mg and CEC to plot the CEC saturation triangle.
				</Typography>
			)}
		</Stack>
	);
}
