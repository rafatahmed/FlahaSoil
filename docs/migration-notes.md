# FlahaSOIL — Migration Notes (Phase 0 → v2)

This document records what the v2 migration **should reuse** from the legacy
codebase and what **should not be carried forward blindly**. It is informed by
the forensic audit (see `docs/legacy-baseline.md`, `docs/legacy-api-map.md`,
`docs/known-issues.md`).

## Reuse in v2

### 1. Saxton & Rawls (2006) physics engine
* Source: `api-implementation/src/services/soilCalculationService.js`.
* Implements Eq. 1–24 (moisture regressions, density effects, moisture-tension
  relationships, moisture-conductivity, gravel and salinity effects) as static
  methods on `SoilCalculationService`.
* Equations themselves are sound and verifiable against the original paper.
* Migration approach: lift the equation methods (Eq. 1–24) into a v2 service
  module. Keep the equation coefficients and intermediate variables byte-
  identical to preserve baseline outputs (see
  `docs/legacy-calculation-samples.md`).

### 2. Soil texture triangle logic
* Classification: `SoilCalculationService.determineSoilTextureClass(sand, clay)`
  (rule-based USDA 12-class returning `Sand`, `Loamy Sand`, … `Clay`).
* Visualization: D3 implementation in
  `public/assets/js/main.js → createSoilTriangle()` and the server-side
  `SoilTriangleGenerator` used by report templates.
* Migration approach: keep the classification rules verbatim; reimplement the
  visualization on the v2 frontend stack but preserve the input/output
  contract (sand %, silt %, clay % → texture class).

### 3. API validation patterns
* `soilAnalysisValidation` chain in `src/routes/soil.js` lines 20–55 using
  `express-validator` defines the canonical input ranges (`sand ∈ [0,100]`,
  `clay ∈ [0,100]`, `sand+clay ≤ 100`, `om ∈ [0,8]`, `densityFactor ∈
  [0.9,1.8]`, `gravelContent ∈ [0,80]`, `EC ∈ [0,20]`).
* `src/middleware/sanitization.js` exposes `validationRules.{register, login,
  resetPassword, verifyEmail}`.
* Migration approach: port these range constraints to the v2 schema layer
  (zod / class-validator / Prisma + DTO) so the existing baseline samples
  remain valid inputs.

### 4. Plan-gating concepts
* `src/middleware/planAccess.js` defines `requireFeature(featureKey)`,
  `checkUsageLimit()`, `incrementUsage()`, `planBasedRateLimit()`.
* Feature keys observed: `advancedCalculations`, `batchProcessing`,
  `analysisHistory`, `exportCapabilities`, `apiAccess`,
  `advancedVisualizations`, `profile3D`, `comparativeAnalysis`,
  `realtimeAdjustment`, `enhancedAnalysis`, `reportGeneration`,
  `customReports`, `adminAccess`.
* Tier-shaped result merging is centralized in
  `SoilCalculationService.formatResultsByPlan(...)`.
* Migration approach: keep the feature-key vocabulary and the result-shaping
  pattern, but move the FREE / PROFESSIONAL / ENTERPRISE matrix into a single
  source of truth (e.g. a config file or DB table) instead of being
  duplicated across middleware + service.

### 5. Report generation concepts
* `src/services/reportService.js` and `src/services/reportService_7page_dynamic.js`
  produce the standard and the 7-page custom PDFs.
* The `reportGeneration` and `customReports` feature gates and the
  `/api/v1/reports/{generate,preview,templates}` endpoint shape are the
  contract the frontend already depends on.
* Migration approach: preserve the endpoint contract and template structure
  so existing report consumers and PDF templates can be reused; replace the
  underlying renderer implementation only if necessary.

### 6. DSS integration concepts
* `src/routes/dss.js` defines the calculate / save / batch flow:
  `POST /api/v1/dss/calculate`, `POST /calculate/advanced`,
  `POST /save-calculation`, `POST /batch/calculate`, plus `GET /crops`,
  `GET /crops/:cropId/stages`, `GET /crops/:cropId/kc`.
* Prisma models `Crop`, `BBCHStage`, `KcPeriod`, `DSSCalculation` model the
  domain.
* Salt management routes in `src/routes/saltManagement.js`
  (`/leaching-requirement`, `/drainage-assessment`, `/salt-balance`) and their
  Prisma counterparts (`SaltToleranceThreshold`, `LeachingCalculation`,
  `DrainageAssessment`, `SaltBalanceRecord`) form a reusable salt-management
  domain model.
* Migration approach: keep the route surface and Prisma model fields. Re-map
  to v2 services without changing the public contract.

## Do NOT carry forward blindly

### A. Pure HTML frontend as long-term architecture
* Current frontend = static HTML + Bootstrap 5 + D3 + Chart.js + a single
  `apiClient.js` wrapper.
* Acceptable for the legacy product, not appropriate as the long-term v2
  base. Migration should choose an explicit framework (React / Vue / Svelte +
  build pipeline + typed API client) before significant new feature work.

### B. SQLite as production database
* Active Prisma datasource is SQLite (`dev.db` checked in under
  `api-implementation/prisma/`).
* Adequate for a single-tenant dev environment; not appropriate for v2
  production (no concurrent writers, no horizontal scaling, no managed
  backup story). Migration target should be PostgreSQL (or the team's
  preferred managed RDBMS).

### C. Console Ninja debug code
* Large obfuscated `_0x412f05` block injected into route files (e.g.
  `api-implementation/src/routes/auth.js` line 1001 in the regex audit).
  This is the Wallaby/Console Ninja runtime instrumentation, accidentally
  committed.
* Strip from all source files in v2; do not re-introduce.

### D. Duplicate / parallel schema files
* `api-implementation/prisma/schema.prisma` is the active schema. A second
  file `api-implementation/prisma/schema-enhanced.prisma` exists alongside it
  and is not referenced as the active datasource.
* Pick one schema for v2 and delete the other.

### E. CEC / baseSaturation placeholders without logic
* `EnhancedSoilAnalysis.cationExchangeCapacity Float?` and
  `EnhancedSoilAnalysis.baseSaturation Float?` (schema lines 172–173) exist
  as nullable columns with no service or controller writing real values.
* Either implement chemistry properly in v2 (Ca/Mg/K/Na/H/Al, ESP, SAR, base
  saturation, charge balance) or remove the columns. Do not migrate the
  placeholders unchanged — they create the false impression that chemistry
  is supported.

### F. Broken or double-prefixed API paths
* `public/assets/js/apiClient.js` line 531 calls
  `${this.baseURL}/api/v1/soil/recommendations` while `baseURL` is already
  `http://localhost:3001/api/v1`, producing
  `http://localhost:3001/api/v1/api/v1/soil/recommendations`.
* The route on the server is `POST /api/v1/soil/recommendations` (single
  prefix). Migration should standardize on a single base URL constant and
  fix the call site rather than carry the bug forward.

### G. Other items that should be revisited
* Hard-coded backend URL (`http://localhost:3001/api/v1`) in `apiClient.js`
  line 10 — replace with environment-driven config.
* `localization.js` imports `authenticateToken` but never uses it on any
  route — decide whether the routes should be public or protected and act
  accordingly.
* `src/middleware/auth.js` is applied as a router-level middleware in some
  places (`router.use(...)`) and as a per-route middleware in others — pick
  one convention.
* `bulkDensity` is formatted with different decimal counts depending on
  tier (`toFixed(3)` for FREE vs `toFixed(2)` for Professional+) inside
  `formatResultsByPlan`. Decide on a single canonical precision in v2.
