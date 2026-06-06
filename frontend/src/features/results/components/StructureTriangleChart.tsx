/**
 * FlahaSOIL v2 — Cation / structure triangle SVG (Phase 10A-6).
 *
 * Plots normalised (Ca %, Mg %, K %) on an equilateral ternary
 * diagram. Axis layout: Ca apex at top, Mg bottom-right, K
 * bottom-left — matching `@flaha/soil-chemistry`'s
 * `DEFAULT_STRUCTURE_VERTICES`. Classification thresholds are not
 * drawn as zones (Bear/Albrecht boundaries are not strict polygons);
 * instead the badge under the chart reports the engine's verdict.
 */
import { Box, Chip, Stack, Typography } from "@mui/material";
import type { StructureAnalysisBlock } from "@flaha/shared-types";

const SIZE = 360;
const PAD = 28;

// Engine returns coordinates on a side-100 triangle; rescale here.
function rescale(x: number, y: number): { x: number; y: number } {
	const scale = (SIZE - 2 * PAD) / 100;
	return { x: PAD + x * scale, y: PAD + y * scale };
}

const APEX_CA = rescale(50, 0);
const APEX_MG = rescale(100, 100 * (Math.sqrt(3) / 2));
const APEX_K = rescale(0, 100 * (Math.sqrt(3) / 2));

const VERDICT_COLOR: Record<string, string> = {
	Balanced: "success",
	"Calcium Excess": "warning",
	"Magnesium Excess": "warning",
	"Potassium Excess": "warning",
	"Calcium Deficient": "error",
	"Magnesium Deficient": "error",
	"Potassium Deficient": "error",
};

interface StructureTriangleChartProps {
	structure: StructureAnalysisBlock | null;
}

export function StructureTriangleChart({ structure }: StructureTriangleChartProps) {
	const trianglePath = `M ${APEX_CA.x} ${APEX_CA.y} L ${APEX_MG.x} ${APEX_MG.y} L ${APEX_K.x} ${APEX_K.y} Z`;
	const point = structure ? rescale(structure.point.x, structure.point.y) : null;
	const verdictColor =
		(structure?.classification && VERDICT_COLOR[structure.classification]) ?? "default";

	return (
		<Stack spacing={1.5}>
			<Box
				component="svg"
				viewBox={`0 0 ${SIZE} ${SIZE}`}
				role="img"
				aria-label="Cation balance triangle (Ca / Mg / K)"
				sx={{ width: "100%", height: "auto", maxWidth: SIZE }}
			>
				<path d={trianglePath} fill="rgba(0,0,0,0.04)" stroke="#666" strokeWidth={1} />
				{/* gridlines at 25 / 50 / 75 % Ca for visual reference */}
				{[25, 50, 75].map((p) => {
					const a = rescale(
						0 + (p / 100) * (50 - 0),
						100 * (Math.sqrt(3) / 2) - (p / 100) * 100 * (Math.sqrt(3) / 2)
					);
					const b = rescale(
						100 - (p / 100) * (100 - 50),
						100 * (Math.sqrt(3) / 2) - (p / 100) * 100 * (Math.sqrt(3) / 2)
					);
					return <line key={p} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#ccc" strokeWidth={0.5} />;
				})}
				<text x={APEX_CA.x} y={APEX_CA.y - 8} textAnchor="middle" fontSize={12} fill="#333">
					Ca
				</text>
				<text x={APEX_K.x - 4} y={APEX_K.y + 18} textAnchor="end" fontSize={12} fill="#333">
					K
				</text>
				<text x={APEX_MG.x + 4} y={APEX_MG.y + 18} textAnchor="start" fontSize={12} fill="#333">
					Mg
				</text>
				{point ? (
					<circle
						cx={point.x}
						cy={point.y}
						r={6}
						fill="#6a1b9a"
						stroke="#fff"
						strokeWidth={2}
						data-testid="structure-point"
					>
						<title>
							{`Ca ${structure!.normalized.ca.toFixed(1)}% · Mg ${structure!.normalized.mg.toFixed(1)}% · K ${structure!.normalized.k.toFixed(1)}%`}
						</title>
					</circle>
				) : null}
			</Box>
			{structure ? (
				<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
					<Chip
						size="small"
						color={verdictColor as "default" | "success" | "warning" | "error"}
						label={structure.classification ?? "Unclassified"}
					/>
					<Typography variant="body2" color="text.secondary">
						Ca:Mg {structure.caMgRatio.toFixed(1)} · Ca:K {structure.caKRatio.toFixed(1)} · Mg:K{" "}
						{structure.mgKRatio.toFixed(1)} · Σ bases {structure.basesTotal.toFixed(2)} cmol(+)/kg
					</Typography>
				</Stack>
			) : (
				<Typography variant="body2" color="text.secondary">
					No structure data — enter Ca / Mg / K to plot the cation balance.
				</Typography>
			)}
		</Stack>
	);
}
