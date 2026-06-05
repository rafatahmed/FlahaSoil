/**
 * FlahaSOIL v2 — application root.
 *
 * Owns the provider stack (MUI theme + CssBaseline + BrowserRouter)
 * and delegates route definition to `routes/AppRoutes`.
 */
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./auth";
import { AppRoutes } from "./routes/AppRoutes";
import { flahaSoilTheme } from "./theme/flahaSoilTheme";

// Phase 9A-G: AuthProvider replaces the legacy dev-session SessionProvider.
// BrowserRouter is mounted INSIDE AuthProvider so the auth context is
// available to ProtectedRoute / PublicOnlyRoute. AuthProvider, in turn,
// uses `useNavigate`-free APIs so it doesn't require the Router.
export default function App() {
	return (
		<ThemeProvider theme={flahaSoilTheme}>
			<CssBaseline />
			<AuthProvider>
				<BrowserRouter>
					<AppRoutes />
				</BrowserRouter>
			</AuthProvider>
		</ThemeProvider>
	);
}
