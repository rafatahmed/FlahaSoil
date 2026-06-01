/**
 * FlahaSOIL v2 — official platform theme (Phase 8C-A).
 *
 * Centralizes the FlahaSOIL brand palette so every surface — landing,
 * shell, cards, charts — pulls from the same tokens. The palette is
 * earth-based and scientific: Deep Soil Brown anchors structural
 * navigation, Organic Green drives primary action, Analytical Cream is
 * the resting card surface, and Mineral / Salinity warn the operator.
 *
 * Visual identity goals (per Phase 8C-A spec):
 *   - Scientific, Earth-based, Professional, Grounded, Precise.
 *   - Premium agronomic platform, not a developer dashboard.
 */
import { createTheme } from "@mui/material/styles";

/** Raw brand tokens. Exported so non-MUI surfaces can reuse them. */
export const flahaSoilColors = {
	deepSoilBrown: "#4B2E1A",
	clayEarth: "#8A5A2B",
	sandBeige: "#D9B382",
	organicGreen: "#556B2F",
	organicGreenLight: "#7A8F4F",
	organicGreenDark: "#3D4F1F",
	analyticalCream: "#F4E8D0",
	mineralWarning: "#D97706",
	criticalSalinity: "#B91C1C",
	neutralBackground: "#FAF8F4",
	textPrimary: "#2A1E12",
	textSecondary: "#5C4A38",
	divider: "#E4D9C2",
} as const;

/** Status tokens for interpretation chips and warnings. */
export const flahaSoilStatus = {
	good: flahaSoilColors.organicGreen,
	fair: flahaSoilColors.mineralWarning,
	poor: flahaSoilColors.criticalSalinity,
} as const;

declare module "@mui/material/styles" {
	interface Palette {
		soil: {
			brown: string;
			clay: string;
			sand: string;
			cream: string;
		};
	}
	interface PaletteOptions {
		soil?: {
			brown: string;
			clay: string;
			sand: string;
			cream: string;
		};
	}
}

export const flahaSoilTheme = createTheme({
	palette: {
		mode: "light",
		primary: {
			main: flahaSoilColors.organicGreen,
			light: flahaSoilColors.organicGreenLight,
			dark: flahaSoilColors.organicGreenDark,
			contrastText: "#FFFFFF",
		},
		secondary: {
			main: flahaSoilColors.deepSoilBrown,
			light: flahaSoilColors.clayEarth,
			dark: "#2E1B0E",
			contrastText: "#FFFFFF",
		},
		warning: {
			main: flahaSoilColors.mineralWarning,
			contrastText: "#FFFFFF",
		},
		error: {
			main: flahaSoilColors.criticalSalinity,
			contrastText: "#FFFFFF",
		},
		success: {
			main: flahaSoilColors.organicGreen,
			contrastText: "#FFFFFF",
		},
		background: {
			default: flahaSoilColors.neutralBackground,
			paper: "#FFFFFF",
		},
		text: {
			primary: flahaSoilColors.textPrimary,
			secondary: flahaSoilColors.textSecondary,
		},
		divider: flahaSoilColors.divider,
		soil: {
			brown: flahaSoilColors.deepSoilBrown,
			clay: flahaSoilColors.clayEarth,
			sand: flahaSoilColors.sandBeige,
			cream: flahaSoilColors.analyticalCream,
		},
	},
	shape: {
		borderRadius: 10,
	},
	typography: {
		fontFamily:
			'"Inter", "Helvetica Neue", "Segoe UI", Roboto, Arial, sans-serif',
		h1: { fontWeight: 700, letterSpacing: "-0.02em" },
		h2: { fontWeight: 700, letterSpacing: "-0.02em" },
		h3: { fontWeight: 700, letterSpacing: "-0.01em" },
		h4: { fontWeight: 700, letterSpacing: "-0.01em" },
		h5: { fontWeight: 600 },
		h6: { fontWeight: 600 },
		button: { fontWeight: 600, textTransform: "none", letterSpacing: "0.01em" },
		subtitle1: { fontWeight: 600 },
		body2: { lineHeight: 1.6 },
	},
	components: {
		MuiAppBar: {
			styleOverrides: {
				root: {
					backgroundColor: flahaSoilColors.deepSoilBrown,
					color: "#FFFFFF",
				},
			},
		},
		MuiDrawer: {
			styleOverrides: {
				paper: {
					backgroundColor: "#FFFFFF",
					borderRight: `1px solid ${flahaSoilColors.divider}`,
				},
			},
		},
		MuiCard: {
			defaultProps: { variant: "outlined" },
			styleOverrides: {
				root: {
					borderColor: flahaSoilColors.divider,
					backgroundImage: "none",
				},
			},
		},
		MuiButton: {
			defaultProps: { disableElevation: true },
			styleOverrides: {
				root: { borderRadius: 8 },
			},
		},
		MuiChip: {
			styleOverrides: {
				root: { fontWeight: 500 },
			},
		},
	},
});
