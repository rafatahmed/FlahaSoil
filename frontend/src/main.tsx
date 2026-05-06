/**
 * FlahaSOIL v2 — React entry.
 *
 * Mounts the application under <StrictMode>. The provider stack
 * (theme, router) lives in `App.tsx` to keep this file boot-only.
 */
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

const rootElement = document.getElementById("root");
if (!rootElement) {
	throw new Error("Root element #root not found in index.html");
}

createRoot(rootElement).render(
	<StrictMode>
		<App />
	</StrictMode>
);
