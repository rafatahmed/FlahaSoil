/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
	plugins: [react()],
	// Phase 10A.7 (B10) — expose the repo-root `public/` so canonical
	// assets such as `assets/img/Structure Triangle.svg` are served at
	// `/assets/img/Structure%20Triangle.svg` by Vite dev and copied to
	// `dist/` at build time.
	publicDir: "../public",
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
	test: {
		environment: "jsdom",
		globals: true,
		setupFiles: ["./src/test/setup.ts"],
		css: false,
	},
});
