/**
 * FlahaSOIL v2 — Water-retention curve SVG visualisation (Phase 10A-4).
 *
 * X-axis: pF (log10 of tension in cm H2O), 0 → 4.2.
 * Y-axis: volumetric water content θ, 0 → 50 % (auto-extended if the
 *         engine emits a higher saturation value).
 *
 * The four agronomic anchors (saturation / field capacity / irrigation
 * trigger / wilting point) are plotted as labelled dots over the
 * continuous curve. All numerical work happens in the backend engine;
 * this component only maps to screen space.
 */
import { Box, Stack, Typography } from "@mui/material";
import type { WaterRetentionAnalysisBlock } from "@flaha/shared-types";

const W = 480;
const H = 280;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 36;
const PF_MAX = 4.2;

function xAt(pF: number): number {
	const clamped = Math.max(0, Math.min(PF_MAX, pF));
	return PAD_L + (clamped / PF_MAX) * (W - PAD_L - PAD_R);
}
function yAt(theta: number, max: number): number {
	const t = Math.max(0, Math.min(max, theta));
	return H - PAD_B - (t / max) * (H - PAD_T - PAD_B);
}

interface WaterRetentionCurveChartProps {
	retention: WaterRetentionAnalysisBlock | null;
}

export function WaterRetentionCurveChart({ retention }: WaterRetentionCurveChartProps) {
	if (!retention) {
		return (
			<Typography variant="body2" color="text.secondary">
				No retention curve — sand &amp; clay percentages required.
			</Typography>
		);
	}
	const thetaMax = Math.max(
		50,
		retention.saturation.waterContentVolPercent,
		...retention.points.map((p) => p.waterContentVolPercent)
	);
	const path = retention.points
		.slice()
		.sort((a, b) => a.pF - b.pF)
		.map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(p.pF).toFixed(2)} ${yAt(p.waterContentVolPercent, thetaMax).toFixed(2)}`)
		.join(" ");

	const anchors: Array<{ key: string; pF: number; theta: number; color: string; label: string }> = [
		{ key: "sat", pF: 0, theta: retention.saturation.waterContentVolPercent, color: "#0277bd", label: "Sat" },
		{ key: "fc", pF: retention.fieldCapacity.pF, theta: retention.fieldCapacity.waterContentVolPercent, color: "#2e7d32", label: "FC" },
		{ key: "mad", pF: retention.irrigationThreshold.pF, theta: retention.irrigationThreshold.waterContentVolPercent, color: "#f9a825", label: "MAD" },
		{ key: "wp", pF: retention.wiltingPoint.pF, theta: retention.wiltingPoint.waterContentVolPercent, color: "#c62828", label: "WP" },
	];

	return (
		<Stack spacing={1.5}>
			<Box
				component="svg"
				viewBox={`0 0 ${W} ${H}`}
				role="img"
				aria-label="Soil water-retention curve"
				sx={{ width: "100%", height: "auto", maxWidth: W }}
			>
				{/* axes */}
				<line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="#666" />
				<line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="#666" />
				{[0, 1, 2, 3, 4].map((pF) => (
					<g key={pF}>
						<line x1={xAt(pF)} y1={H - PAD_B} x2={xAt(pF)} y2={H - PAD_B + 4} stroke="#666" />
						<text x={xAt(pF)} y={H - PAD_B + 18} fontSize={11} textAnchor="middle" fill="#333">
							pF {pF}
						</text>
					</g>
				))}
				{[0, 10, 20, 30, 40, 50].filter((v) => v <= thetaMax).map((v) => (
					<g key={v}>
						<line x1={PAD_L - 4} y1={yAt(v, thetaMax)} x2={PAD_L} y2={yAt(v, thetaMax)} stroke="#666" />
						<text x={PAD_L - 6} y={yAt(v, thetaMax) + 3} fontSize={11} textAnchor="end" fill="#333">
							{v}
						</text>
					</g>
				))}
				<text x={(W + PAD_L) / 2} y={H - 6} fontSize={11} textAnchor="middle" fill="#666">
					Soil-water tension (pF = log₁₀ cm H₂O)
				</text>
				<text
					x={12} y={(H + PAD_T) / 2} fontSize={11} textAnchor="middle" fill="#666"
					transform={`rotate(-90 12 ${(H + PAD_T) / 2})`}
				>
					θ (vol %)
				</text>
				{/* curve */}
				<path d={path} fill="none" stroke="#1565c0" strokeWidth={2} data-testid="retention-curve" />
				{/* anchors */}
				{anchors.map((a) => (
					<g key={a.key}>
						<circle cx={xAt(a.pF)} cy={yAt(a.theta, thetaMax)} r={5} fill={a.color} stroke="#fff" strokeWidth={1.5} />
						<text x={xAt(a.pF) + 7} y={yAt(a.theta, thetaMax) - 7} fontSize={11} fill={a.color}>
							{a.label}
						</text>
					</g>
				))}
			</Box>
			<Typography variant="body2" color="text.secondary">
				{`PAW = ${retention.plantAvailableWater.toFixed(1)} ${retention.units.plantAvailableWater} · MAD ${(retention.madFraction * 100).toFixed(0)} % · ${retention.textureClass} (Saxton-Rawls 2006)`}
			</Typography>
			<Typography variant="caption" color="text.secondary" data-testid="bulk-density-trace">
				{`Bulk density — predicted ${retention.bulkDensity.predicted.toFixed(3)} ${retention.bulkDensity.unit}, used ${retention.bulkDensity.used.toFixed(3)} ${retention.bulkDensity.unit} (${
					retention.bulkDensity.source === "USER_INPUT" ? "user input" : "engine default"
				})`}
			</Typography>
		</Stack>
	);
}
