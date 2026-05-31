/**
 * FlahaSOIL v2 — application root.
 *
 * Owns the provider stack (MUI theme + CssBaseline + BrowserRouter)
 * and delegates route definition to `routes/AppRoutes`.
 */
import { CssBaseline, ThemeProvider } from "@mui/material";
import { BrowserRouter } from "react-router-dom";

import { AppRoutes } from "./routes/AppRoutes";
import { SessionProvider } from "./session";
import { theme } from "./theme/theme";

export default function App() {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<SessionProvider>
				<BrowserRouter>
					<AppRoutes />
				</BrowserRouter>
			</SessionProvider>
		</ThemeProvider>
	);
}
