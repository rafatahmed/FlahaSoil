# FlahaSOIL — Legacy Baseline (Phase 0 Freeze)

> **Scope statement.** Current FlahaSOIL is a **soil water physics + irrigation DSS** system.
> It is **NOT yet a soil chemistry system**. There is no CEC, no base-saturation,
> no exchangeable-cation, no ESP, no SAR and no Ca/Mg/K/Na/H/Al/Fe logic in the
> active codebase (proven in §"Missing Scientific Scope" below).

This document captures the system as it exists on disk under
`c:\Users\rafat\repo\Flaha\FlahaSoil` at the moment Phase 0 is frozen.
No refactors, no improvements, no architectural assumptions.

---

## 1. Frontend Architecture

* **Type:** Static, vanilla HTML pages served from `public/` (no SPA framework).
* **Styling:** Bootstrap 5 + custom CSS in `public/assets/css/`.
* **Charting / visualization:** D3.js (USDA textural triangle in
  `public/assets/js/main.js → createSoilTriangle()`) and Chart.js (moisture/tension
  curves in `EnhancedSoilController` consumers).
* **API client:** Single wrapper class `FlahaSoilAPI` in
  `public/assets/js/apiClient.js`, base URL hard-coded to
  `http://localhost:3001/api/v1` (line 10).
* **Soil math on the client:** `public/assets/js/soilCalculations.js` is now a
  thin helper file — the file header explicitly states *"All calculations are
  now performed server-side using the complete Saxton & Rawls (2006) system"*.
  Only `validateSoilInputs`, drainage classification and a compaction-risk
  helper remain client-side.
* **Main pages (verified in `public/`):**
    * `index.html` (single soil analysis)
    * `advanced-dss.html` (Decision Support Workflow with role-based dropdowns
      for Farmer / Designer / Consultant)
    * `salt-management.html`
    * `reports.html`
    * `auth.html`, `profile.html`, `landing.html`

## 2. Backend Architecture

* **Runtime:** Node.js / Express, entry point `api-implementation/server.js`.
* **Default port:** `3001` (constant in `server.js`, line 70).
* **Middleware mounted globally:** `helmet`, `cors`, `morgan("combined")`,
  `express.json({ limit: "10mb" })`, `express.urlencoded({ extended: true })`.
* **Route mount points** (verified in `server.js` lines 54–61):

  | Mount path | Router file |
  |---|---|
  | `/api/v1/soil` | `src/routes/soil.js` |
  | `/api/v1/auth` | `src/routes/auth.js` |
  | `/api/v1/integrations` | `src/routes/integrations.js` |
  | `/api/v1/reports` | `src/routes/reports.js` |
  | `/api/v1/dss` | `src/routes/dss.js` |
  | `/api/v1/weather` | `src/routes/weather.js` |
  | `/api/v1/localization` | `src/routes/localization.js` |
  | `/api/v1/salt-management` | `src/routes/saltManagement.js` |

* **Auth middleware:** `src/middleware/auth.js` (JWT bearer).
* **Plan gating:** `src/middleware/planAccess.js` exposes
  `requireFeature(<featureKey>)`, `checkUsageLimit()`, `incrementUsage()`,
  `planBasedRateLimit()`. Feature keys observed in routes include
  `advancedCalculations`, `batchProcessing`, `analysisHistory`,
  `exportCapabilities`, `apiAccess`, `advancedVisualizations`, `profile3D`,
  `comparativeAnalysis`, `realtimeAdjustment`, `enhancedAnalysis`,
  `reportGeneration`, `customReports`, `adminAccess`.
* **Rate limiting:** `src/middleware/rateLimit.js` exports `freeTierLimit`,
  `professionalLimit`, `authLimit`, `passwordResetLimit`,
  `emailVerificationLimit`.

## 3. Database

* **ORM:** Prisma. Active schema: `api-implementation/prisma/schema.prisma`
  (a parallel file `prisma/schema-enhanced.prisma` also exists on disk and is
  not the active one).
* **Engine:** SQLite (Prisma default, `dev.db` artifacts present in
  `api-implementation/prisma/`).
* **Models defined in the active schema (verified):**
  `User`, `Subscription`, `UsageRecord`, `SoilAnalysis`, `SoilRegion`,
  `EnhancedSoilAnalysis`, `MoistureTensionPoint`, `ComparativeAnalysis`,
  `SoilManagementRecommendation`, `Crop`, `BBCHStage`, `KcPeriod`,
  `DSSCalculation`, `SaltToleranceThreshold`, `LeachingCalculation`,
  `DrainageAssessment`, `SaltBalanceRecord`.
* `EnhancedSoilAnalysis` declares `cationExchangeCapacity Float?` (line 172) and
  `baseSaturation Float?` (line 173) as **nullable placeholders**. No code path
  writes meaningful values to either column (see §"Missing Scientific Scope").

## 4. Main Pages (functional summary)

* `index.html` — Single-soil analysis: sand / silt / clay / OM / density /
  gravel / EC inputs, posts to `/api/v1/soil/analyze` (or `/soil/demo/analyze`
  when unauthenticated), renders Saxton & Rawls outputs and the USDA texture
  triangle.
* `advanced-dss.html` — Decision Support workflow: crop, BBCH, region, climate
  zone selectors with progressive-disclosure CSS classes (`farmer-only`,
  `designer-only`, `consultant-only`).
* `salt-management.html` — Posts to `/api/v1/salt-management/*` (leaching
  requirement, drainage assessment, salt balance).
* `reports.html` — Calls `/api/v1/reports/*` and `/api/v1/soil/report`.

## 5. Main Services

| Service file | Responsibility |
|---|---|
| `src/services/soilCalculationService.js` | Saxton & Rawls (2006) 24-equation engine |
| `src/services/enhancedSoilCalculationService.js` | Wrapper for enhanced analysis fields |
| `src/services/saltManagementService.js` | Leaching / drainage / salt balance math |
| `src/services/saltManagementServiceEnhanced.js` | Enhanced variant of the above |
| `src/services/reportService.js` | PDF / standard report generation |
| `src/services/reportService_7page_dynamic.js` | Custom 7-page report variant |
| `src/services/emailService.js` | Transactional email |
| `src/services/githubService.js`, `linearService.js` | Issue-tracker integrations |
| `src/services/weatherService.js` (consumed by `weatherController`) | Current weather / forecast / ET₀ |
| `src/services/localizationService.js` (consumed by `localizationController`) | Crops / BBCH / DSS terms / languages / translation |

## 6. Main Calculation Engine

`SoilCalculationService.calculateWaterCharacteristics(sand, clay, om,
densityFactor, gravelContent, electricalConductivity, userPlan)` in
`src/services/soilCalculationService.js`.

* **Phase 1 — Saxton & Rawls (2006) 24-equation system** (file lines 48–122):
    1. Eq. 1–5 `calculateMoistureRegressions(S, C, OM)` — θ₁₅₀₀, θ₃₃,
       θ(S–33), Ψe, θS.
    2. Eq. 6–10 `calculateDensityEffects(...)` — ρN (calculated bulk density,
       Eq. 6) and ρDF (user input, Eq. 7), θS-DF, θ₃₃-DF, θ(S-33)DF, θ₁₅₀₀-DF.
    3. Eq. 11–15 `calculateMoistureTensionRelationships(...)` — A, B, λ, Ψe-adj.
    4. Eq. 16–18 `calculateMoistureConductivity(...)` — Ksat and unsaturated K.
    5. Eq. 19–22 `calculateGravelEffects(...)` — only invoked when
       `userPlan !== "FREE"` and `gravelContent > 0`.
    6. Eq. 23–24 `calculateSalinityEffects(EC)` — only invoked when
       `userPlan === "ENTERPRISE"` and `EC > 0` (osmotic potential ΨO and ΨOu).
* **Texture classification:** `determineSoilTextureClass(sand, clay)` —
  simplified rule set (Sand, Loamy Sand, Sandy Loam, Loam, Silt Loam, Silt,
  Clay Loam, Sandy Clay Loam, Silty Clay Loam, Clay, Sandy Clay, Silty Clay).
* **Soil quality:** `calculateSoilQualityIndicators(...)` — `soilQualityIndex`
  (0–10), `drainageClass` (Very Poor … Excellent), `compactionRisk` and
  `erosionRisk` (Low / Moderate / High) keyed off Ksat, texture and bulk
  density.
* **Result shaping:** `formatResultsByPlan(...)` returns the FREE field set,
  then merges PROFESSIONAL fields (`airEntryTension`, `lambda`,
  `unsaturatedConductivity`, `confidenceIntervals`, `rSquaredValues`) and
  ENTERPRISE fields (`osmoticPotential`, `osmoticPotentialFC`, `parameterA`,
  `parameterB`, `relativeK`, `conductivityExponent`).

## 7. Existing Scientific Scope

* Soil water characteristic curve (Saxton & Rawls 2006).
* Plant available water (PAW = θ₃₃-DF − θ₁₅₀₀-DF).
* Saturated and unsaturated hydraulic conductivity.
* Air-entry tension and Brooks–Corey λ parameter.
* Bulk density (calculated ρN vs. user-input ρDF), porosity, void ratio.
* Gravel correction (Professional+).
* Osmotic potential from EC (Enterprise).
* USDA textural classification + D3 triangle visualization.
* Crop / BBCH / Kc database + DSS irrigation calculations
  (`/api/v1/dss/calculate`, `/api/v1/dss/calculate/advanced`,
  `/api/v1/dss/batch/calculate`).
* Salt management: leaching requirement, drainage assessment, salt balance
  (`/api/v1/salt-management/*`).
* Weather / ET₀ data (`/api/v1/weather/*`).
* Multi-language UI strings (`/api/v1/localization/*`).
* Tiered PDF report generation.

## 8. Missing Scientific Scope (proven absence)

Regex sweeps over `public/`, `api-implementation/src/` and
`api-implementation/prisma/` confirm:

* No formula matching `cation\s*/\s*CEC\s*\*\s*100` or any equivalent.
* No `Calcium`, `Magnesium`, `Potassium`, `Sodium`, `Aluminum`, `Iron` or
  `exchangeable` symbols outside placeholder strings.
* No `ESP`, `SAR`, `cation` or `base saturation` calculation logic — only the
  two nullable Prisma columns `cationExchangeCapacity` and `baseSaturation` on
  `EnhancedSoilAnalysis`.
* No Ca-Mg-other ternary or radar visualization. The only triangle in the code
  is the USDA sand/silt/clay textural triangle.
* No client field, validator, controller route, service method or report
  template references chemical balance.

**Conclusion:** the legacy system is a soil-physics + irrigation DSS. Soil
chemistry is out of scope of the current implementation.
