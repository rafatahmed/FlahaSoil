/**
 * FlahaSOIL v2 — brand logo mark (Phase 8C-A).
 *
 * Inline SVG so the shell can render without an asset pipeline. The
 * mark uses the Sand Beige and Organic Green tokens to suggest a soil
 * horizon under a growing leaf. The wordmark "FlahaSOIL" sits to the
 * right with the SOIL syllable emphasised to anchor the platform name.
 */
import { Box, Typography } from "@mui/material";

import { flahaSoilColors } from "../../theme/flahaSoilTheme";

interface FlahaLogoProps {
	size?: number;
	variant?: "full" | "mark";
	color?: string;
}

export function FlahaLogo({
	size = 28,
	variant = "full",
	color = "#FFFFFF",
}: FlahaLogoProps) {
	return (
		<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
			<svg
				width={size}
				height={size}
				viewBox="0 0 32 32"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				aria-hidden="true"
			>
				{/* Soil horizon */}
				<rect x="3" y="20" width="26" height="3" rx="1" fill={flahaSoilColors.sandBeige} />
				<rect x="3" y="24" width="26" height="3" rx="1" fill={flahaSoilColors.clayEarth} />
				<rect x="3" y="28" width="26" height="2" rx="1" fill={flahaSoilColors.deepSoilBrown} />
				{/* Leaf */}
				<path
					d="M16 4 C 11 8, 9 14, 13 19 C 17 14, 21 9, 16 4 Z"
					fill={flahaSoilColors.organicGreen}
				/>
				<path
					d="M16 4 L 16 19"
					stroke={flahaSoilColors.organicGreenDark}
					strokeWidth="0.8"
					strokeLinecap="round"
				/>
			</svg>
			{variant === "full" && (
				<Typography
					component="span"
					sx={{
						fontWeight: 700,
						letterSpacing: "-0.01em",
						fontSize: size * 0.62,
						color,
						lineHeight: 1,
					}}
				>
					Flaha
					<Box
						component="span"
						sx={{ color, opacity: 1, fontWeight: 800 }}
					>
						SOIL
					</Box>
				</Typography>
			)}
		</Box>
	);
}
