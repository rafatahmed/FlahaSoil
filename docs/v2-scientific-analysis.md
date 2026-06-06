<!-- @format -->

# FlahaSOIL v2 — Scientific Engines & Visual Analytics (Phase 10A + 10B)

> Phase 10A adds three soil-science engines (texture triangle,
> water-retention curve, cation/structure triangle) and the visual
> components that render them. Phase 10B is the **full-matrix audit**
> that maps every legacy formula in `public/assets/js/main.js`,
> `public/assets/data/data.json`, and the legacy `/api/v1/*` controllers
> to their v2 engine equivalents. The legacy `Phase 10 — Retire legacy
> HTML` is renumbered to **Phase 11** to free the `10` slot for this
> scientific-product phase.

---

## 1. Engines

### 1.1 Texture triangle — `@flaha/soil-physics`

| Symbol                          | Kind     | File                          |
| ------------------------------- | -------- | ----------------------------- |
| `USDA_TEXTURE_POLYGONS`         | const    | `src/textureTriangle.ts`      |
| `TEXTURE_CLASSIFICATION_ORDER`  | const    | `src/textureTriangle.ts`      |
| `DEFAULT_TRIANGLE_VERTICES`     | const    | `src/textureTriangle.ts`      |
| `TEXTURE_SUM_TOLERANCE`         | const    | `src/textureTriangle.ts`      |
| `normalizeTextureFractions`     | function | `src/textureTriangle.ts`      |
| `barycentricToCartesian`        | function | `src/textureTriangle.ts`      |
| `polygonContains` (PNPOLY)      | function | `src/textureTriangle.ts`      |
| `classifyTexture`               | function | `src/textureTriangle.ts`      |

- **Polygon source:** transcribed from the legacy reference
  `public/assets/data/data.json`, which itself mirrors the USDA Soil
  Survey Manual (Handbook 18, Ch. 3, §"Soil Textural Classes").
- **Containment algorithm:** standard PNPOLY ray-casting on the
  `(sand, clay)` plane (silt is implicit because the three fractions
  sum to 100). Edges resolve deterministically via the first-match
  order in `TEXTURE_CLASSIFICATION_ORDER`.
- **Normalisation:** when one fraction is missing, the engine derives
  it as `100 − sum(other two)` and reports it via the `derived` flag.
  Sums outside `±0.5 pp` raise a `sumOk = false` flag (rendered as a
  warning in the API response).

### 1.2 Water-retention curve — `@flaha/soil-physics`

| Symbol                          | Kind     | File                            |
| ------------------------------- | -------- | ------------------------------- |
| `buildWaterRetentionCurve`      | function | `src/waterRetentionCurve.ts`    |
| `PF_SAMPLES`                    | const    | `src/waterRetentionCurve.ts`    |
| `TENSION_FIELD_CAPACITY_KPA`    | const    | `src/waterRetentionCurve.ts`    |
| `TENSION_WILTING_POINT_KPA`     | const    | `src/waterRetentionCurve.ts`    |
| `KPA_TO_CM_H2O`                 | const    | `src/waterRetentionCurve.ts`    |
| `DEFAULT_MAD_FRACTION`          | const    | `src/waterRetentionCurve.ts`    |
| `tensionKpaToPf`, `pfToKpa`     | function | `src/waterRetentionCurve.ts`    |

#### Formulas

- **pF scale:** $pF = \log_{10}(\psi \text{ in cm } H_2O)$ with
  $1\,\text{kPa} = 10.1972\,\text{cm } H_2O$.
- **Anchors:** field capacity at $\psi = 33\,\text{kPa}$ (pF ≈ 2.53);
  permanent wilting point at $\psi = 1500\,\text{kPa}$ (pF ≈ 4.18).
- **Curve coefficients** (calibrated to pass through the two anchors):
  $$
  B = \frac{\ln(33) - \ln(1500)}{\ln(\theta_{FC}) - \ln(\theta_{WP})}
  \qquad
  A = \frac{33}{\theta_{FC}^{B}}
  $$
- **Three-segment $\theta(\psi)$**:
  1. **Saturated zone** $\psi < \psi_E \Rightarrow \theta = \theta_S$
  2. **Capillary fringe** $\psi_E \le \psi \le 33$, linear in
     $\ln(\psi)$ between $(\psi_E,\theta_S)$ and $(33,\theta_{FC})$.
  3. **Soil-matric tension** $33 \le \psi \Rightarrow
     \theta = (\psi / A)^{1/B}$.
- **Plant-available water:** $PAW = \theta_{FC} - \theta_{WP}$.
- **Irrigation trigger (MAD):** $\theta_{trig} = \theta_{FC} -
  f_{MAD} \cdot PAW$, with $f_{MAD} = 0.5$ by default.

#### Source

Saxton, K.E. and Rawls, W.J. (2006). *Soil Water Characteristic
Estimates by Texture and Organic Matter for Hydrologic Solutions.*
Soil Sci. Soc. Am. J. 70:1569–1578. doi:10.2136/sssaj2005.0117.

### 1.3 Cation / structure triangle — `@flaha/soil-chemistry`

| Symbol                              | Kind     | File                          |
| ----------------------------------- | -------- | ----------------------------- |
| `STRUCTURE_CLASSIFICATION_ORDER`    | const    | `src/structureTriangle.ts`    |
| `STRUCTURE_THRESHOLDS`              | const    | `src/structureTriangle.ts`    |
| `DEFAULT_STRUCTURE_VERTICES`        | const    | `src/structureTriangle.ts`    |
| `normalizeCationFractions`          | function | `src/structureTriangle.ts`    |
| `cationToCartesian`                 | function | `src/structureTriangle.ts`    |
| `classifyCationStructure`           | function | `src/structureTriangle.ts`    |
| `summariseCationStructure`          | function | `src/structureTriangle.ts`    |

- **Axes:** Ca % (top apex), Mg % (bottom-right), K % (bottom-left)
  of (Ca + Mg + K), normalised so the three sum to 100.
- **Diagnostic priority:** deficiency labels rank above excess labels
  (a soil with Ca = 92 %, Mg = 3 %, K = 5 % reports as *Magnesium
  Deficient* — not *Calcium Excess* — because the Mg shortfall is the
  agronomic limit).
- **Thresholds** (percent of Ca + Mg + K):

  | Class                 | Rule                  |
  | --------------------- | --------------------- |
  | Magnesium Deficient   | Mg < 8                |
  | Potassium Deficient   | K  < 1                |
  | Calcium Deficient     | Ca < 50               |
  | Calcium Excess        | Ca ≥ 80               |
  | Magnesium Excess      | Mg ≥ 25               |
  | Potassium Excess      | K  ≥ 10               |
  | Balanced              | none of the above     |

- **Ratios:** `caMgRatio`, `caKRatio`, `mgKRatio` reported on the raw
  `cmol(+)/kg` inputs (safe-divide returns 0 when the denominator is
  zero). Na and CEC are echoed for the Eurofins-style summary but do
  **not** participate in the ternary projection.

#### Sources

- Bear, F.E., Prince, A.L., Malcolm, J.L. (1945). *Potassium Needs of
  New Jersey Soils.* NJ Agric. Exp. Station Bull. 721.
- Albrecht, W.A. (1975). *The Albrecht Papers, Vol. I.* Acres U.S.A.
- Kopittke, P.M., Menzies, N.W. (2007). *A review of the use of the
  basic cation saturation ratio and the "ideal" soil.* SSSAJ 71:259–265
  (critical perspective — noted in code).

---

## 2. Scientific assumptions

| Assumption                                                                       | Phase 10 location                                          |
| -------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| FC anchored at 33 kPa, WP at 1500 kPa                                            | `TENSION_FIELD_CAPACITY_KPA`, `TENSION_WILTING_POINT_KPA`  |
| Saxton-Rawls regressions are uncalibrated above 1500 kPa — engine clamps to θWP | `waterContentAt()` in `waterRetentionCurve.ts`             |
| pF range capped at 4.18 (no air-dry / oven-dry extrapolation)                    | `PF_SAMPLES`                                               |
| MAD default = 50 % (overridable per call)                                        | `DEFAULT_MAD_FRACTION`                                     |
| Polygon-edge points classified by first-match traversal order                    | `TEXTURE_CLASSIFICATION_ORDER`                             |
| Na and H not plotted on the structure triangle (Bear/Albrecht convention)        | `classifyCationStructure()` doc comment                    |
| Deficiency outranks excess in cation classification                              | `STRUCTURE_CLASSIFICATION_ORDER`                           |

---

## 3. API surface — `GET /api/v2/soil-tests/:soilTestId/scientific-analysis`

- **Auth:** standard v2 JWT + `requireSoilTestAccess` tenancy guard
  (same as the rest of the soil-test routes).
- **Response type:** `ScientificAnalysisResponse` in
  `@flaha/shared-types/src/scientific-analysis.ts`.
- **Composition:** backend service
  `backend/src/services/scientificAnalysis.service.ts` orchestrates
  the three engines; every block is independently nullable.
- **Soft-fail warnings** surfaced via `response.warnings[]`:
  - *"Texture inputs missing — texture triangle unavailable."*
  - *"Texture inputs incomplete (≥ 2 of sand/silt/clay required) — texture triangle unavailable."*
  - *"Texture fractions sum to NN.N % — engine normalised before plotting."*
  - *"Chemistry inputs missing — structure triangle unavailable."*
  - *"Chemistry inputs present but Ca/Mg/K all missing — structure triangle unavailable."*

---

## 4. Visual components (`frontend/src/features/results/components/`)

| Component                       | Renders                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `TextureTriangleChart.tsx`      | USDA 12-class polygon overlay + soil-test point + classifier.  |
| `WaterRetentionCurveChart.tsx`  | Continuous θ(ψ) on a pF/θ grid with Sat / FC / MAD / WP anchors. |
| `StructureTriangleChart.tsx`    | Ca/Mg/K ternary + classification + ratio strip.                |
| `ScientificAnalysisPanel.tsx`   | Loader + tab container, embedded under the Soil Test detail page. |

All charts are pure SVG (no external chart library), rely only on
data from the API, and degrade to an empty-state message when the
corresponding block is `null`.

---

## 5. Full-matrix audit (Phase 10B)

> Maps every legacy soil-science symbol in `public/assets/js/main.js`
> and `public/assets/data/data.json` to its v2 engine equivalent.
> Verified line numbers refer to the working-tree copy of `main.js`
> (2,723 lines, SHA pinned at the commit that introduced Phase 10A).

| Legacy symbol (file:line)                                       | v2 equivalent                                                                                            | Notes / divergence                                                                                                                                                              |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `percentToPoint(clay, sand, silt)` (main.js:1601-1612)          | `barycentricToCartesian({sand, silt, clay})` (`@flaha/soil-physics`)                                     | Same weighted-vertex projection. Legacy used `(clay, sand, silt)` argument order; v2 uses `{sand, silt, clay}` to match USDA labelling convention.                              |
| `getSoilTexture(clay, sand, silt)` (main.js:1710-1718)          | `classifyTexture(sand, silt, clay)` (`@flaha/soil-physics`)                                              | Same PNPOLY containment test. v2 returns `{className, matched, point}` instead of a bare string so callers can detect no-match cases without sentinel values.                   |
| `isPointInPolygon(...)` (main.js — D3 helper)                   | `polygonContains(polygon, point)` (`@flaha/soil-physics`)                                                | Identical W. Randolph Franklin (1970) ray-cast; v2 is typed and handles `yi === yj` via `Number.EPSILON` guard.                                                                 |
| `calculateCentroid(points)` (main.js:1690-1707)                 | *(not re-implemented — centroids are derived implicitly from `DEFAULT_TRIANGLE_VERTICES`)*               | The legacy centroid was used only for D3 label placement, which is rebuilt in `TextureTriangleChart.tsx` via `project(0,0,100)` / `(100,0,0)` / `(0,100,0)`.                    |
| `public/assets/data/data.json` (textural polygons)              | `USDA_TEXTURE_POLYGONS` (`@flaha/soil-physics/src/textureTriangle.ts`)                                   | **Transcription error corrected**: legacy `data.json` `"sandy loam"` polygon listed vertex `{clay: 20, sand: 53, silt: 32}` (sums to 105). v2 uses the correct `(52, 28, 20)`.  |
| `calculateAndUpdateWaterCharacteristics(...)` (main.js:2043+)   | `buildWaterRetentionCurve({sand, clay, organicMatter, densityFactor})` + `calculateSoilPhysics()` engine | Legacy delegated to `/api/v1/analyze`; v2 keeps the same Saxton-Rawls 2006 calibration but exposes a continuous curve plus anchor points instead of just three scalar outputs.  |
| `getAdvancedParameters()` (main.js)                             | `WaterRetentionCurveInput` (`@flaha/soil-physics`)                                                       | `gravelContent` / `electricalConductivity` are still consumed by the existing physics engine; the retention-curve generator does not use them.                                  |
| Legacy `/api/v1/analyze` controller (`api-implementation/`)     | `POST /api/v2/soil-tests/:id/calculate` + `GET .../scientific-analysis`                                  | v2 splits the legacy "one route returns everything" into a write-side calculate + two read-side projections (`flahacalc-export`, `scientific-analysis`). Tenancy enforced.      |
| Legacy CEC / cation handling (api-implementation `cec.js`)      | `classifyCationStructure(...)`, `summariseCationStructure(...)` (`@flaha/soil-chemistry`)                | Legacy reported a single scalar "structure" label; v2 adds the ternary point + three ratio diagnostics and the deferred-deficiency priority rule (see §1.3).                    |
| Legacy SVG triangle plot (main.js — D3-based)                   | `TextureTriangleChart.tsx`, `StructureTriangleChart.tsx`                                                 | Legacy used D3.js + JSON-driven polygons; v2 inlines the polygons in TypeScript and renders with React + MUI + plain SVG (no D3 dependency in the v2 SPA).                      |
| Legacy moisture-tension plot (none — only scalar outputs)       | `WaterRetentionCurveChart.tsx`                                                                           | **New surface in v2**. The legacy UI never plotted the continuous curve; it only showed FC/WP/SAT scalars.                                                                      |

### 5.1 Audit gaps and known divergences

- **Saxton-Rawls A/B**: The legacy engine exposes `tension.A` /
  `tension.B` calibrated against $\theta_S$. The Phase 10A retention
  curve re-calibrates `A` / `B` against `(θFC, 33)` and `(θWP, 1500)`
  so the rendered curve passes exactly through both anchors. The
  legacy scalars are unchanged in the v2 calculation service — only
  the visual curve uses the re-calibrated coefficients.
- **Air-entry tension `ψE`**: v2 clamps to `CLAMPS.psiEAdjMin` to
  prevent zero-crossing on sandy soils. The legacy engine had the
  same clamp; preserved verbatim.
- **Organic-matter range**: v2 enforces `0 ≤ OM ≤ 8 %` (Saxton-Rawls
  upper bound). Legacy code clamped silently; v2 throws.
- **CEC-only inputs**: the structure triangle requires at least one
  of Ca / Mg / K. When all three are missing, v2 returns
  `structure: null` and surfaces a warning; the legacy UI rendered an
  empty triangle silently.

---

## 6. Tests added in Phase 10A

| Suite                                                                    | Count    |
| ------------------------------------------------------------------------ | -------- |
| `packages/soil-physics/src/__tests__/textureTriangle.test.ts`            | 33 tests |
| `packages/soil-physics/src/__tests__/waterRetentionCurve.test.ts`        | 17 tests |
| `packages/soil-chemistry/src/__tests__/structureTriangle.test.ts`        | 23 tests |
| **Sub-total — new in Phase 10A**                                         | **73**   |

Test scope:

- Polygon containment for every USDA class centroid and every shared
  vertex.
- Texture-fraction normalisation (missing-third, off-by-one sums,
  out-of-range inputs).
- Curve monotonicity, anchor consistency, and Saxton-Rawls A/B
  re-calibration round-trip.
- Cation normalisation, ternary projection, all seven classification
  zones (Balanced + 3 deficiencies + 3 excesses), safe-divide ratios.

---

## 7. Known limitations

1. **No PDF embedding yet.** The retention-curve and triangle charts
   are rendered in-app only; they are not yet captured into the
   PDF/Word reports produced by the report-generation service. This is
   a Phase 10C deliverable.
2. **Frontend smoke tests not added.** Vitest + jsdom + Testing
   Library were missing from `frontend/package.json` (the deps were
   declared in `setup.ts` but never installed). Phase 10A added them
   so the existing 34 frontend tests run; SVG-snapshot tests for the
   three new charts are deferred to Phase 10C.
3. **Bear/Albrecht thresholds are not user-configurable.** The
   `STRUCTURE_THRESHOLDS` are baked into the package. Per-organisation
   overrides (e.g. for European labs that use stricter Mg-deficiency
   cutoffs) are deferred to Phase 10C.
4. **Curve does not include hysteresis.** Saxton-Rawls is a single
   drying-curve calibration; the wetting-curve branch is out of scope.
5. **No bulk-export of curves.** A `csv` export of the sampled
   `(pF, ψ, θ)` triples is planned but not implemented.

---

## 8. Recommended Phase 10C

In priority order:

1. **Report integration.** Embed the three charts as SVG into the
   PDF/Word reports produced by `report.service.ts`. Add a
   `withScientificAnalysis: boolean` flag on `POST .../reports`.
2. **Chart smoke tests.** Add Testing-Library + jsdom snapshot tests
   for `TextureTriangleChart`, `WaterRetentionCurveChart`, and
   `StructureTriangleChart` using the mock-client fixtures.
3. **Per-organisation thresholds.** Move `STRUCTURE_THRESHOLDS` into
   a `OrgScienceProfile` row so labs can tune the Bear/Albrecht
   classification rules.
4. **CSV / FlahaCalc export.** Extend `FlahaCalcExportResponse` with
   the sampled retention-curve points so downstream irrigation
   scheduling can consume them directly.
5. **PROCTOR / air-dry extension.** Optional — extend the retention
   curve past pF 4.2 using a published Brooks-Corey overlay.
