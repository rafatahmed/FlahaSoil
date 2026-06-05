/**
 * FlahaSOIL v2 — Vitest global setup (Phase 9A-G).
 *
 * Registers jest-dom matchers (toBeInTheDocument, toHaveTextContent, …)
 * on the Vitest `expect`. Kept minimal — anything heavier (MSW handlers,
 * theme providers, etc.) belongs in per-suite fixtures, not here.
 *
 * The `/vitest` subpath import handles both the runtime registration
 * AND the type augmentation that adds the matchers to the Vitest
 * `Assertion` interface, so test files do not need any extra reference.
 */
import "@testing-library/jest-dom/vitest";
import * as matchers from "@testing-library/jest-dom/matchers";
import { expect } from "vitest";

// Belt-and-braces: the `/vitest` import already calls `expect.extend`,
// but Vitest 2.x only runs that side effect once and some environments
// load this file before Vitest's `expect` exists. Re-extending is safe.
expect.extend(matchers);
