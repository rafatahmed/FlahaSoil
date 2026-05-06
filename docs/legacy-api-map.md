# FlahaSOIL — Legacy API Map (Phase 0 Freeze)

Base URL (server): `http://localhost:3001`
All routers are mounted under `/api/v1/<area>` in `api-implementation/server.js`
(lines 54–61).

Legend
* **Auth** = `authMiddleware` from `src/middleware/auth.js` (JWT bearer).
* **Gate** = `requireFeature("<key>")` from `src/middleware/planAccess.js`.
* **Limit** = rate limiter from `src/middleware/rateLimit.js`.
* **Usage** = `checkUsageLimit()` and/or `incrementUsage()`.
* All routes return JSON unless noted (PDF endpoints stream `application/pdf`).

---

## 1. `/api/v1/soil` — `src/routes/soil.js`

| Method | Path | Controller | Auth / Gate / Limit | Body / Params | Response |
|---|---|---|---|---|---|
| POST | `/demo/analyze` | `SoilController.analyzeSoilDemo` | none / none / `freeTierLimit` (implicit via demo) | `{sand, clay, organicMatter, densityFactor, gravelContent?, electricalConductivity?}` | FREE-tier Saxton & Rawls result |
| POST | `/demo/analyze/enhanced` | `EnhancedSoilController.analyzeSoilEnhancedDemo` | none | same as above | enhanced demo result |
| GET  | `/demo/moisture-tension/:demoData` | `EnhancedSoilController.getMoistureTensionCurveDemo` | none | base64-encoded inputs in URL | curve points |
| GET  | `/demo/profile-3d/:demoData` | `EnhancedSoilController.getSoilProfile3DDemo` | none | base64-encoded inputs in URL | 3-D profile data |
| POST | `/analyze` | `SoilController.analyzeSoil` | Auth + Usage | soil inputs | soil analysis (plan-shaped) |
| POST | `/analyze/advanced` | `SoilController.analyzeSoilAdvanced` | Auth + `advancedCalculations` + Usage | soil inputs + advanced flags | extended analysis |
| POST | `/analyze/batch` | `SoilController.analyzeBatch` | Auth + `batchProcessing` + Usage | `{samples: [...]}` | array of results |
| GET  | `/history` | `SoilController.getAnalysisHistory` | Auth + `analysisHistory` | `?page&limit&sortBy&order` | paginated `SoilAnalysis` rows |
| GET  | `/export/:format` | `SoilController.exportAnalysis` | Auth + `exportCapabilities` | `format` ∈ `csv`/`json`/`pdf` | file download |
| POST | `/recommendations` | `SoilController.getCropRecommendations` | Auth + Usage | `{textureClass, paw, om}` | crop suggestion list |
| POST | `/api/analyze` | `SoilController.apiAnalyzeSoil` | Auth + `apiAccess` + `planBasedRateLimit` | soil inputs | analysis (machine-clients) |
| GET  | `/moisture-tension/:analysisId` | `EnhancedSoilController.getMoistureTensionCurve` | Auth + `advancedVisualizations` | `analysisId` path param | curve points |
| GET  | `/profile-3d/:analysisId` | `EnhancedSoilController.getSoilProfile3D` | Auth + `profile3D` | `analysisId` path param | 3-D profile data |
| POST | `/compare` | `EnhancedSoilController.compareAnalyses` | Auth + `comparativeAnalysis` + Usage | `{analysisIds: [...]}` | comparison object |
| POST | `/adjust-realtime` | `EnhancedSoilController.adjustParametersRealtime` | Auth + `realtimeAdjustment` | partial soil inputs | recomputed result |
| GET  | `/regional-data/:regionId` | `EnhancedSoilController.getRegionalSoilData` | Auth | `regionId` | `SoilRegion` row |
| GET  | `/regions` | `EnhancedSoilController.getAvailableRegions` | Auth | – | list of regions |
| POST | `/analyze/enhanced` | `EnhancedSoilController.analyzeSoilEnhanced` | Auth + `enhancedAnalysis` + Usage | soil inputs | `EnhancedSoilAnalysis` payload |
| POST | `/report` | inline handler (uses `ReportService`) | Auth + `reportGeneration` | `{analysisData, options?}` | `application/pdf` |
| POST | `/report/custom` | inline handler | Auth + `customReports` | `{analysisData, template, options?}` | `application/pdf` |

> Validation chain `soilAnalysisValidation` (file lines 20–55) enforces
> `sand ∈ [0,100]`, `clay ∈ [0,100]`, `sand+clay ≤ 100`, `organicMatter ∈ [0,8]`,
> `densityFactor ∈ [0.9,1.8]`, `gravelContent ∈ [0,80]`, `electricalConductivity ∈ [0,20]`.

## 2. `/api/v1/auth` — `src/routes/auth.js`

| Method | Path | Limit / Validation | Body | Response |
|---|---|---|---|---|
| POST | `/register` | `authLimit` + `validationRules.register` | `{email, password, name, ...}` | `{token, user}` |
| POST | `/login` | `authLimit` + `validationRules.login` | `{email, password}` | `{token, user}` |
| GET  | `/profile` | JWT (manual verify in handler) | – | user profile |
| POST | `/forgot-password` | `passwordResetLimit` | `{email}` | `{message}` |
| POST | `/reset-password` | `validationRules.resetPassword` | `{token, password}` | `{message}` |
| PUT  | `/profile` | JWT (manual verify) | profile fields | updated user |
| POST | `/logout` | JWT (manual verify) | – | `{message}` |
| POST | `/reset-usage` | JWT (manual verify) | – | `{message}` |
| POST | `/change-password` | JWT (manual verify) | `{currentPassword, newPassword}` | `{message}` |
| POST | `/verify-email` | `validationRules.verifyEmail` | `{token}` | `{message}` |
| POST | `/resend-verification` | `emailVerificationLimit` | `{email}` | `{message}` |
| POST | `/upgrade-plan` | JWT (manual verify) | `{plan}` | updated subscription |

## 3. `/api/v1/dss` — `src/routes/dss.js`

| Method | Path | Auth / Gate / Limit | Body / Params |
|---|---|---|---|
| GET  | `/crops` | `professionalLimit` | – |
| GET  | `/crops/:cropId/stages` | `professionalLimit` | `cropId` |
| GET  | `/crops/:cropId/kc` | `professionalLimit` | `cropId` |
| POST | `/calculate` | Auth + `freeTierLimit` | `{soilAnalysis, cropId, environment, ...}` |
| GET  | `/calculations` | Auth + `professionalLimit` | – |
| GET  | `/calculations/:calculationId` | Auth + `professionalLimit` | `calculationId` |
| POST | `/save-calculation` | Auth + `professionalLimit` | calculation payload |
| POST | `/calculate/advanced` | Auth + `advancedCalculations` + `professionalLimit` | extended payload |
| POST | `/batch/calculate` | Auth + `batchProcessing` + `professionalLimit` | `{calculations: [...]}` |

> Lines 55, 65: `router.use(planAccess.requireFeature("advancedCalculations"))`
> and `router.use("/batch", planAccess.requireFeature("batchProcessing"))`
> apply gating to all subsequent routes in their respective scopes.

## 4. `/api/v1/weather` — `src/routes/weather.js`

| Method | Path | Auth / Gate / Limit | Notes |
|---|---|---|---|
| GET | `/current` | Auth | current observations |
| GET | `/forecast` | Auth | multi-day forecast |
| GET | `/et0` | Auth | reference ET₀ |
| GET | `/dss` | Auth + `advancedCalculations` + `professionalLimit` | DSS-shaped weather payload |
| POST | `/cache/clear` | Auth + `adminAccess` | – |
| GET | `/cache/stats` | Auth + `adminAccess` | – |
| GET | `/docs` | none | static JSON docs blob |

## 5. `/api/v1/salt-management` — `src/routes/saltManagement.js`

All routes have `auth` and `planAccess.requireFeature("advancedCalculations")`
applied via `router.use(...)` (file lines 23–24).

| Method | Path | Limit | Body |
|---|---|---|---|
| POST | `/leaching-requirement` | `professionalLimit` | `{soilAnalysisId, cropId, irrigationWater, ...}` |
| POST | `/drainage-assessment` | `professionalLimit` | `{soilAnalysisId, fieldDimensions, ...}` |
| POST | `/salt-balance` | `professionalLimit` | `{soilAnalysisId, period, inputs, outputs}` |

## 6. `/api/v1/reports` — `src/routes/reports.js`

| Method | Path | Auth / Gate | Body | Response |
|---|---|---|---|---|
| GET  | `/capabilities` | Auth | – | plan capability matrix |
| POST | `/generate/standard` | Auth + `reportGeneration` | `{analysisData, options?}` | `application/pdf` |
| POST | `/generate/custom` | Auth + `customReports` | `{analysisData, template, options?}` | `application/pdf` |
| POST | `/preview/standard` | Auth + `reportGeneration` | same as generate | HTML / image preview |
| POST | `/preview/custom` | Auth + `customReports` | same as generate | HTML / image preview |
| GET  | `/templates` | Auth + `customReports` | – | template list |
| DELETE | `/cleanup` | Auth (admin check inside handler) | – | cleanup count |

## 7. `/api/v1/integrations` — `src/routes/integrations.js`

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET  | `/status` | Auth | combined GitHub + Linear status |
| POST | `/github/webhook` | none (raw body, signature verified inside) | GitHub webhook receiver |
| POST | `/linear/webhook` | none (signature verified inside) | Linear webhook receiver |
| GET  | `/github/issues` | Auth | `?state&labels&page&per_page` |
| POST | `/github/issues` | Auth | `{title, body, labels?, assignees?}` |
| GET  | `/linear/issues` | Auth | `?first&state` |
| POST | `/linear/issues` | Auth | `{title, description, priority?, labels?}` |
| GET  | `/github/repository` | Auth | repo metadata |
| GET  | `/linear/team` | Auth | team metadata |

## 8. `/api/v1/localization` — `src/routes/localization.js`

| Method | Path | Auth |
|---|---|---|
| GET  | `/crops` | none |
| GET  | `/crops/:id` | none |
| GET  | `/bbch-stages` | none |
| GET  | `/dss-terms` | none |
| GET  | `/languages` | none |
| GET  | `/package` | none |
| POST | `/translate` | none |

> File line 10 imports `{ authenticateToken }` from `src/middleware/auth.js`
> but no route in this router currently applies it.
