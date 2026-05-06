# FlahaSOIL — Known Issues (Phase 0 Freeze)

Each issue is recorded with file-level evidence from the forensic audit. No
runtime change is performed in Phase 0; treatment recommendations are for the
v2 migration.

---

## ISS-001 — Double-prefixed API path for recommendations

* **Affected file:** `public/assets/js/apiClient.js` (line 531).
* **Problem:** `this.baseURL` is set to `http://localhost:3001/api/v1` at
  line 10, but the recommendations call uses
  `` `${this.baseURL}/api/v1/soil/recommendations` ``, producing the URL
  `http://localhost:3001/api/v1/api/v1/soil/recommendations`. The server
  exposes the route as `POST /api/v1/soil/recommendations` (single prefix,
  declared in `api-implementation/src/routes/soil.js`).
* **Impact:** The recommendations request 404s in production; the feature is
  silently broken from the UI.
* **Treatment in migration:** Centralize the base URL in a single
  configuration constant and remove the duplicate `/api/v1` segment from the
  call site.

## ISS-002 — Hard-coded backend URL in the API client

* **Affected file:** `public/assets/js/apiClient.js` (line 10).
* **Problem:** `this.baseURL = "http://localhost:3001/api/v1"` is hard coded;
  there is no environment-driven configuration mechanism.
* **Impact:** The frontend cannot be deployed against any backend other than
  `localhost:3001` without editing source.
* **Treatment in migration:** Replace with environment configuration (build-
  time env var or runtime config endpoint).

## ISS-003 — CEC and base-saturation are unused placeholders

* **Affected file:** `api-implementation/prisma/schema.prisma`
  (lines 172–173, model `EnhancedSoilAnalysis`).
* **Problem:** `cationExchangeCapacity Float?` and `baseSaturation Float?` are
  declared as nullable columns. No service, controller, validator, route, UI
  field, or report template anywhere in the codebase computes, validates,
  reads or writes either column with a meaningful value. Regex sweeps over
  `public/`, `api-implementation/src/` and `api-implementation/prisma/`
  return zero matches for `cation\s*/\s*CEC`, `Calcium`, `Magnesium`,
  `Potassium`, `Sodium`, `exchangeable`, `ESP`, or `SAR` in computational
  contexts.
* **Impact:** Falsely implies the system supports soil chemistry. Causes
  confusion in API consumers and roadmap planning.
* **Treatment in migration:** Either implement soil chemistry properly in v2
  (Ca / Mg / K / Na / H / Al, exchangeable cations, base saturation, ESP,
  SAR, charge balance) or drop the two columns. Do not migrate the
  placeholders unchanged.

## ISS-004 — Console Ninja debug payload committed in source

* **Affected files (verified):** `api-implementation/src/routes/auth.js`
  (line 1001 contains the obfuscated `_0x412f05` IIFE). The same Wallaby /
  Console Ninja injection pattern may be present in other route or service
  files; the Phase 0 audit confirmed at minimum the auth router.
* **Problem:** A large obfuscated WebSocket-based debug instrumentation block
  is checked in. It is not part of the production logic and reaches out to
  `localhost`/`127.0.0.1` on tool-defined ports.
* **Impact:** Pollutes the source tree, increases bundle size, complicates
  code review, and creates an unexpected outbound connection in any
  deployed environment that loads it.
* **Treatment in migration:** Strip the Console Ninja block from every file
  on import into v2. Add a lint or pre-commit rule to prevent re-injection.

## ISS-005 — Duplicate Prisma schema files

* **Affected files:** `api-implementation/prisma/schema.prisma` (active) and
  `api-implementation/prisma/schema-enhanced.prisma` (parallel, not the
  active datasource).
* **Problem:** Two schema files coexist with overlapping models. Only one is
  the active source for `prisma generate`; the other is a stale or
  experimental copy.
* **Impact:** Risk of model drift, unclear source of truth, future migrations
  applied to the wrong file.
* **Treatment in migration:** Pick one schema and delete the other before
  starting v2 model design.

## ISS-006 — SQLite as the active datasource

* **Affected file:** `api-implementation/prisma/schema.prisma` and committed
  `dev.db` artifacts under `api-implementation/prisma/`.
* **Problem:** Prisma is configured against SQLite. SQLite has no concurrent
  writers and limited operational tooling.
* **Impact:** Acceptable for a single-developer dev workflow, not viable for
  the v2 production target.
* **Treatment in migration:** Move to PostgreSQL (or the team's chosen
  managed RDBMS) and rerun migrations against the new datasource.

## ISS-007 — `localization` router imports auth but never applies it

* **Affected file:** `api-implementation/src/routes/localization.js`
  (line 10 imports `{ authenticateToken }`; routes lines 20, 29, 38, 46, 53,
  61, 71 do not use it).
* **Problem:** The middleware import is present but unused, leaving every
  localization endpoint open. Whether that is intentional is unclear.
* **Impact:** Crops, BBCH stages, DSS terms, languages, packages and
  translation are publicly readable. If that is by design the import should
  be removed; if not, the routes are mistakenly unprotected.
* **Treatment in migration:** Decide on the policy explicitly and either
  remove the import or apply the middleware.

## ISS-008 — Inconsistent auth-middleware application style

* **Affected files:** `api-implementation/src/routes/dss.js` (line 55, 65 use
  `router.use(planAccess.requireFeature(...))`),
  `api-implementation/src/routes/saltManagement.js` (lines 23–24 use
  `router.use(...)`), `api-implementation/src/routes/soil.js` (uses
  per-route arrays of middleware), `api-implementation/src/routes/auth.js`
  (uses inline `jwt.verify` calls inside several handlers instead of the
  shared middleware).
* **Problem:** Three different conventions for applying authentication and
  feature gating coexist. No single pattern is enforced.
* **Impact:** Increases the chance of a route shipping without the intended
  middleware. Makes audits harder.
* **Treatment in migration:** Pick a single convention (recommended: per-
  route middleware arrays, no inline `jwt.verify`) and enforce it.

## ISS-009 — `bulkDensity` formatting changes by tier

* **Affected file:**
  `api-implementation/src/services/soilCalculationService.js`
  (line 583 `densityResults.rhoN.toFixed(3)` for FREE; line 605
  `densityResults.rhoN.toFixed(2)` for PROFESSIONAL+).
* **Problem:** The numeric value of `bulkDensity` is the same calculated ρN
  for every tier, but is rendered with three decimals on FREE and two on
  Professional/Enterprise. This is visible in the baseline samples
  (`docs/legacy-calculation-samples.md`).
* **Impact:** Downstream consumers comparing values across tiers see a
  spurious rounding difference; PDF reports show different precision based
  on plan.
* **Treatment in migration:** Choose a single canonical precision and apply
  it consistently in the v2 result schema.

## ISS-010 — `unsaturatedConductivity` always returns "0.0" in observed samples

* **Affected file:**
  `api-implementation/src/services/soilCalculationService.js`
  (`calculateMoistureConductivity`).
* **Problem:** All five Phase 0 baseline samples (Sandy, Loam, Clay, High OM,
  Saline) returned `unsaturatedConductivity: "0.0"` for the Professional and
  Enterprise tiers.
* **Impact:** Either the engine is correctly reporting K(ψ) ≈ 0 at the
  default reference tension, or the formatter is rounding to zero. Either
  way the Professional output adds no information today.
* **Treatment in migration:** During v2 implementation, verify whether the
  underlying value is genuinely near zero and adjust the displayed
  precision, or recompute at a meaningful reference tension.

## ISS-011 — Console Ninja import surface unverified beyond `auth.js`

* **Affected files:** Unknown breadth.
* **Problem:** The Phase 0 audit confirmed the obfuscated block in
  `routes/auth.js`. A repo-wide sweep was not performed for every other
  service/controller file.
* **Impact:** Hidden debug instrumentation may exist elsewhere.
* **Treatment in migration:** Run a scripted scan for the
  `_0x[0-9a-f]{6}` / `console-ninja` markers across the entire codebase
  before lifting any file into v2 and remove every occurrence.
