/**
 * FlahaSOIL v2 — Phase 10C-E science-docs inventory test.
 *
 * A documentation guard (not a science test): it asserts that every
 * methodology white paper required by Phase 10C-E is present under
 * `docs/science/` and follows the shared 13-section methodology template,
 * and that the index README exists. It changes NO production behaviour.
 *
 * The docs live at the repo root, so paths are resolved from `__dirname`
 * (backend/src/services/__tests__) up to the repository root.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

/** Repository-root `docs/science` directory. */
const SCIENCE_DIR = resolve(__dirname, "../../../../docs/science");

/** The ten methodology white papers, in delivery order. */
const METHODOLOGY_DOCS = [
	"texture-triangle-methodology.md",
	"soil-water-retention-methodology.md",
	"soil-physics-methodology.md",
	"soil-chemistry-methodology.md",
	"cec-base-saturation-methodology.md",
	"salinity-sodicity-methodology.md",
	"evidence-completeness-methodology.md",
	"scientific-calibration-standards-methodology.md",
	"scientific-validation-dataset-methodology.md",
	"water-retention-model-framework-methodology.md",
] as const;

/** The shared 13-section methodology template headings. */
const REQUIRED_HEADINGS = [
	"## 1. Status & Scientific Honesty Label",
	"## 2. Purpose & Scope",
	"## 3. Scientific Background",
	"## 4. Governing Equations & Rules",
	"## 5. Inputs & Units",
	"## 6. Outputs & Units",
	"## 7. Source of Truth",
	"## 8. Assumptions",
	"## 9. Limitations",
	"## 10. Validation & Evidence",
	"## 11. References",
	"## 12. Provenance & Change Log",
	"## 13. Audit Notes",
] as const;

function read(file: string): string {
	return readFileSync(resolve(SCIENCE_DIR, file), "utf8");
}

describe("science docs inventory — presence", () => {
	it("has the docs/science directory and the index README", () => {
		expect(existsSync(SCIENCE_DIR)).toBe(true);
		expect(existsSync(resolve(SCIENCE_DIR, "README.md"))).toBe(true);
	});

	it.each(METHODOLOGY_DOCS)("contains %s", (file) => {
		expect(existsSync(resolve(SCIENCE_DIR, file))).toBe(true);
	});
});

describe("science docs inventory — methodology template", () => {
	it.each(METHODOLOGY_DOCS)("%s has all 13 template headings", (file) => {
		const content = read(file);
		for (const heading of REQUIRED_HEADINGS) {
			expect(content, `${file} missing heading "${heading}"`).toContain(
				heading
			);
		}
	});

	it.each(METHODOLOGY_DOCS)(
		"%s carries an explicit scientific-honesty label",
		(file) => {
			const content = read(file);
			expect(content).toMatch(
				/`(IMPLEMENTED|PARAMETER_REQUIRED|FUTURE|REFERENCE_ONLY|HOUSE_CONVENTION)`/
			);
		}
	);
});

describe("science docs inventory — README index", () => {
	it("links to every methodology white paper", () => {
		const readme = read("README.md");
		for (const file of METHODOLOGY_DOCS) {
			expect(readme, `README missing link to ${file}`).toContain(file);
		}
	});
});
