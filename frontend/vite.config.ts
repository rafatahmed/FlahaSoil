import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	server: {
		// Fixed development port. strictPort=true makes Vite fail loudly
		// instead of silently picking a different port if 5173 is in use.
		port: 5173,
		strictPort: true,
	},
	build: {
		outDir: "dist",
		sourcemap: true,
	},
});
