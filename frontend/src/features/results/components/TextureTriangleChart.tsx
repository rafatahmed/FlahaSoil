/**
 * FlahaSOIL v2 — USDA texture-triangle SVG visualisation (Phase 10A-2).
 *
 * Renders the 12 USDA polygons (from `@flaha/soil-physics`) and plots
 * the soil-test's (sand, silt, clay) point on top. Axis layout matches
 * the canonical USDA triangle (clay apex top, sand bottom-left, silt
 * bottom-right). The component is purely presentational — all
 * geometry / classification comes from the backend response.
 */
import { Box, Stack, Typography } from "@mui/material";
import type { TextureAnalysisBlock } from "@flaha/shared-types";
import {
	DEFAULT_TRIANGLE_VERTICES,
	TEXTURE_CLASSIFICATION_ORDER,
	USDA_TEXTURE_POLYGONS,
	barycentricToCartesian,
} from "@flaha/soil-physics";

const SIZE = 360;
const PAD = 28;

function project(sand: number, silt: number, clay: number): { x: number; y: number } {
	const u = barycentricToCartesian({ sand, silt, clay }, DEFAULT_TRIANGLE_VERTICES);
	// Triangle is unit (height = √3/2 ≈ 0.866); scale into [PAD, SIZE − PAD].
	const scale = SIZE - 2 * PAD;
	return { x: PAD + u.x * scale, y: PAD + u.y * scale };
}

function polygonToPath(name: string): string {
	const poly = USDA_TEXTURE_POLYGONS[name];
	if (!poly || poly.length === 0) return "";
	return (
		poly
			.map((v, i) => {
				const p = project(v.sand, v.silt, v.clay);
				return `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`;
			})
			.join(" ") + " Z"
	);
}

interface TextureTriangleChartProps {
	texture: TextureAnalysisBlock | null;
}

export function TextureTriangleChart({ texture }: TextureTriangleChartProps) {
	const clayApex = project(0, 0, 100);
	const sandApex = project(100, 0, 0);
	const siltApex = project(0, 100, 0);
	const point = texture
		? project(texture.normalized.sand, texture.normalized.silt, texture.normalized.clay)
		: null;

	return (
		<Stack spacing={1.5}>
			<Box
				component="svg"
				viewBox={`0 0 ${SIZE} ${SIZE}`}
				role="img"
				aria-label="USDA soil texture triangle"
				sx={{ width: "100%", height: "auto", maxWidth: SIZE }}
			>
				{TEXTURE_CLASSIFICATION_ORDER.map((cls) => (
					<path
						key={cls}
						d={polygonToPath(cls)}
						fill={texture?.classification === cls ? "rgba(76,175,80,0.35)" : "rgba(0,0,0,0.04)"}
						stroke="#666"
						strokeWidth={0.75}
					>
						<title>{cls}</title>
					</path>
				))}
				<text x={clayApex.x} y={clayApex.y - 8} textAnchor="middle" fontSize={12} fill="#333">
					100% Clay
				</text>
				<text x={sandApex.x - 4} y={sandApex.y + 18} textAnchor="end" fontSize={12} fill="#333">
					100% Sand
				</text>
				<text x={siltApex.x + 4} y={siltApex.y + 18} textAnchor="start" fontSize={12} fill="#333">
					100% Silt
				</text>
				{point ? (
					<>
						<circle
							cx={point.x}
							cy={point.y}
							r={6}
							fill="#1565c0"
							stroke="#fff"
							strokeWidth={2}
							data-testid="texture-point"
						/>
						<title>
							{`${texture?.classification ?? "Unclassified"} — sand ${texture?.normalized.sand.toFixed(1)}%, silt ${texture?.normalized.silt.toFixed(1)}%, clay ${texture?.normalized.clay.toFixed(1)}%`}
						</title>
					</>
				) : null}
			</Box>
			<Typography variant="body2" color="text.secondary">
				{texture
					? `Classification: ${texture.classification ?? "Unmatched"} (sand ${texture.normalized.sand.toFixed(1)}% / silt ${texture.normalized.silt.toFixed(1)}% / clay ${texture.normalized.clay.toFixed(1)}%)`
					: "No texture data — enter sand / silt / clay to plot."}
			</Typography>
		</Stack>
	);
}
