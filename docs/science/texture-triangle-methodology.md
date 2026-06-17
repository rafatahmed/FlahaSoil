<!-- @format -->

# Texture Triangle — Methodology

## 1. Status & Scientific Honesty Label

`IMPLEMENTED` — The USDA 12-class polygon classifier is wired into the v2
reporting pipeline and is the authoritative texture engine for analytics and
visualisation. A simpler threshold classifier (`determineSoilTextureClass`)
is retained verbatim for legacy regression parity and is used inside the
Saxton-Rawls physics output for byte-for-byte compatibility.

Provenance: `PEER_REVIEWED` (USDA Soil Survey Manual, Handbook 18).

## 2. Purpose & Scope

Classify a soil into one of the twelve USDA textural classes from its sand,
silt, and clay mass fractions, and provide the barycentric→Cartesian geometry
needed to plot a sample on the standard texture triangle.

In scope: class assignment, missing-fraction reconciliation, sum validation,
and rendering geometry. Out of scope: any hydraulic or chemical property
(those are downstream in Papers 2–6).

## 3. Scientific Background

The USDA textural triangle partitions the (sand, silt, clay) simplex into 12
labelled polygons. Because the three fractions sum to 100 %, the space is
two-dimensional; classification reduces to a point-in-polygon test on any two
of the three axes. FlahaSOIL projects onto the (sand, clay) plane, with silt
implicit as `100 − sand − clay`.

## 4. Governing Equations & Rules

**Fraction reconciliation** (`normalizeTextureFractions`):

- If exactly one fraction is missing, derive it as `100 − (sum of the other two)`.
- If all three are present, validate the sum against a tolerance window of
  `TEXTURE_SUM_TOLERANCE = 0.5` percentage points.
- If two or more are missing, return zeros and `sumOk = false`. The function
  never throws and never clamps user values.

**Point-in-polygon** (`polygonContains`): standard ray-casting (PNPOLY,
Franklin 1970) on the `(sand, clay)` plane; edge points count as inside.

**Classification** (`classifyTexture`): polygons are tested in
`TEXTURE_CLASSIFICATION_ORDER` (more-specific classes first) and the first
containing polygon wins, so points on shared edges resolve deterministically.

**Geometry** (`barycentricToCartesian`): for the default unit equilateral
triangle (clay apex top at `y = 0`, sand bottom-left, silt bottom-right,
`y` growing downward per SVG convention), a point is placed at the
fraction-weighted vertex average; a zero/non-finite sum returns the centroid.

## 5. Inputs & Units

| Input | Unit | Notes |
| ----- | ---- | ----- |
| `sand` | % mass (0–100) | Required (or derivable) |
| `silt` | % mass (0–100) | Required (or derivable) |
| `clay` | % mass (0–100) | Required (or derivable) |

## 6. Outputs & Units

| Output | Type | Notes |
| ------ | ---- | ----- |
| `className` | string \| null | PascalCase USDA class, or `null` for invalid input |
| `matched` | boolean | True when a polygon contained the point |
| `point` | `{sand,silt,clay}` | Echo of the classified fractions |
| `NormalizedTextureFractions` | object | `derived`, `sumOk`, `sumDelta` |
| `CartesianPoint` | `{x,y}` | Rendering coordinates |

## 7. Source of Truth

- `packages/soil-physics/src/textureTriangle.ts` — polygon registry
  (`USDA_TEXTURE_POLYGONS`), `TEXTURE_CLASSIFICATION_ORDER`,
  `normalizeTextureFractions`, `polygonContains`, `classifyTexture`,
  `barycentricToCartesian`.
- `packages/soil-physics/src/calculateSoilPhysics.ts` —
  `determineSoilTextureClass` (legacy threshold classifier).

## 8. Assumptions

- Fractions are reported on a gravel-free, < 2 mm fine-earth mass basis.
- Polygon vertices mirror the USDA legend; one legacy transcription error at
  the SL/SCL/L junction `(53,42,5)` summing to 105 was corrected to
  `(52,28,20)` so the 1 % grid never produces a no-match hole.
- The clay apex uses SVG `y`-down convention for direct canvas rendering.

## 9. Limitations

- Inputs are **not** auto-normalised inside `classifyTexture`; callers should
  pipe through `normalizeTextureFractions` first.
- Negative or non-finite fractions return `className = null` (no guessing).
- The legacy threshold classifier and the polygon classifier can disagree on
  rare boundary points; the polygon classifier is authoritative for v2.

## 10. Validation & Evidence

- Phase 10C-C benchmarks exercise all 12 USDA classes; the dataset asserts
  every benchmark's `sand+silt+clay = 100` and that field capacity increases
  coarse → fine.
- BUG-10C-C-01 (Sandy Clay Loam misclassification for clay 20–26 %) was found
  and fixed in the legacy threshold classifier during 10C-C.

## 11. References

- USDA Soil Science Division Staff (2017). *Soil Survey Manual*, USDA
  Handbook 18, Chapter 3 — Soil Textural Classes and the texture triangle.
- Franklin, W.R. (1970). PNPOLY point-in-polygon algorithm.

## 12. Provenance & Change Log

| Date | Change |
| ---- | ------ |
| Phase 2.1 | Legacy `determineSoilTextureClass` ported byte-for-byte. |
| Phase 10C-C | Added USDA polygon classifier; fixed BUG-10C-C-01; corrected SL/SCL/L vertex transcription. |

## 13. Audit Notes

- No production formula, polygon, or threshold was modified by this white
  paper. It documents the engine as shipped under `FLAHA_DEFAULT`.
- The polygon registry is `Object.freeze`-d; classification order is fixed and
  deterministic.
