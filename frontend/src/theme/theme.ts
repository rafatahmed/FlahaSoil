/**
 * FlahaSOIL v2 — Material UI theme.
 *
 * Phase 5 keeps the theme intentionally minimal: a Flaha-style green
 * primary, a neutral secondary, and default MUI typography. Branding
 * polish (custom fonts, dark mode, component overrides) is deferred.
 */
import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
	palette: {
		mode: "light",
		primary: {
			main: "#2E7D32",
			light: "#60AD5E",
			dark: "#005005",
			contrastText: "#FFFFFF",
		},
		secondary: {
			main: "#6D4C41",
			light: "#9C786C",
			dark: "#40241A",
			contrastText: "#FFFFFF",
		},
		background: {
			default: "#F5F7F5",
			paper: "#FFFFFF",
		},
	},
	shape: {
		borderRadius: 8,
	},
});
