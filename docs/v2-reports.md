<!-- @format -->

# FlahaSOIL v2 — Reports v1 (Phase 8D)

Companion to `docs/v2-reporting.md` (which covers the Phase 8 read-only
`/report` endpoint, structured warnings, and audit trace). This document
describes the **Reports v1** subsystem: versioned, immutable,
professional soil reports backed by a deterministic recommendation
engine and a renderer pipeline that targets HTML today and PDF / email
in Phase 9.

The Phase 8 read-only `/api/v2/soil-tests/:id/report` endpoint is
unchanged and still serves the lightweight envelope. Reports v1 lives
beside it on `/api/v2/.../reports` and `/api/v2/reports/...`.

---

## 1. Architecture

```
SoilTest ──► generateReport() ──► composeProfessionalReport()
                │                          │
                │                          ├─► runRecommendations()
                │                          │      (rules registry)
                │                          │
                ├─► ReportVersion (immutable snapshot, versionNumber=N+1)
                │      snapshotJson : ProfessionalReportDTO
                │      status       : READY | FAILED
                │
                └─► SoilReport.currentVersionId  → latest READY version
                                  status         → READY | FAILED
                                  generatedAt    → now()
```

- **Composition is pure.** `composeProfessionalReport()` takes already
  loaded Prisma rows + the existing `SoilReportEnvelope` (from the
  Phase 8 read-only assembler) and returns a fully populated
  `ProfessionalReportDTO`. No database I/O, no recalculation.
- **Persistence is transactional.** The version write + report pointer
  update happen inside `prisma.$transaction(...)` so a half-written
  report can never be observed.
- **Rendering is decoupled.** The renderer reads only the snapshot, so
  re-printing an old version produces byte-stable HTML even after rule
  registry or interpretation logic changes.

---

## 2. Database schema (Phase 8D additions)

```prisma
model SoilReport {
  id               String   @id @default(cuid())
  soilTestId       String
  status           SoilReportStatus @default(DRAFT)
  title            String?
  reportNumber     String?
  archived         Boolean  @default(false)
  currentVersionId String?
  generatedAt      DateTime?
  // ... relations + indexes
}

model ReportVersion {
  id                String   @id @default(cuid())
  reportId          String
  versionNumber     Int
  snapshotJson      Json
  status            SoilReportStatus
  generatedByUserId String?
  overallSoilRating String?
  textureClass      String?
  errorMessage      String?
  generatedAt       DateTime @default(now())
  @@unique([reportId, versionNumber])
}

enum SoilReportStatus { DRAFT GENERATING READY FAILED ARCHIVED }
```

Two indexes back the list pages: `soil_reports.archived` (default list
filter) and `soil_report_versions.reportId` (history scrolling).

Status transitions (enforced by the service, not the DB):

| From         | To           | Trigger                                   |
| ------------ | ------------ | ----------------------------------------- |
| `DRAFT`      | `GENERATING` | `generateReport()` enters                 |
| `GENERATING` | `READY`      | snapshot composed + version written       |
| `GENERATING` | `FAILED`     | composer threw → FAILED version persisted |
| `READY`      | `GENERATING` | `regenerateReport()` enters               |
| `*`          | `ARCHIVED`   | `PATCH /reports/:id { archived: true }`   |

---

## 3. Immutability model

`ReportVersion.snapshotJson` is **append-only**: the service never
issues an `UPDATE` against an existing row. Regeneration always creates
a new version with `versionNumber = max(existing) + 1`, then atomically
flips `SoilReport.currentVersionId` to the new row in the same
transaction.

Consequences:

1. **Historical reports are reproducible.** A v1 printed in May 2026
   renders identically in May 2027 even after the recommendation
   registry adds new rules — the snapshot already contains the matched
   recommendations and the composed copy.
2. **Audit trails are stable.** `snapshotJson.notes.missingValues` and
   `snapshotJson.appendix.calculationVersion` capture exactly what the
   engines did at generate time.
3. **Failed attempts are visible.** A FAILED version carries
   `errorMessage` and a `{ error }` payload in `snapshotJson` so
   operators can diagnose without scraping logs.

The only mutable fields on `SoilReport` are `title`, `archived`,
`currentVersionId`, `status`, and `generatedAt`. Renaming a report
never mutates its versions.

---

## 4. ProfessionalReportDTO sections

Defined in `packages/shared-types/src/professional-report.ts`. Every
section is optional only where the underlying engine output is missing
(PRELIMINARY tests have no `chemistry`/`sodicity` sections, etc.).

| Section            | Source rows                                  | Notes                                                   |
| ------------------ | -------------------------------------------- | ------------------------------------------------------- |
| `cover`            | project, sample, user, `meta`                | Report number, title, consultant + client overrides.    |
| `executiveSummary` | interpretation + recommendation count        | Overall rating + 3–5 headline findings + action count.  |
| `texture`          | `SoilTextureInput` + physics                 | USDA class + percentages + source provenance.           |
| `physics`          | `SoilPhysicsResult`                          | FC / WP / PAW / BD / porosity / Ksat + classifications. |
| `chemistry`        | `SoilChemistryInput` + `SoilChemistryResult` | pH, EC, OM, NPK, secondary + micronutrients.            |
| `salinity`         | interpretation                               | FAO-29 severity + risk + recommendation hook.           |
| `sodicity`         | interpretation + chemistry                   | SAR/ESP + severity + structural risk.                   |
| `irrigation`       | interpretation                               | Infiltration / drainage / WHC / leaching requirement.   |
| `agronomic`        | interpretation                               | Plain-language suitability + overall rating.            |
| `recommendations`  | `runRecommendations()`                       | Grouped by horizon (`short` / `medium` / `long`).       |
| `notes`            | warnings + missing values                    | Carries `SystemWarning[]` + missing engine outputs.     |
| `appendix`         | physics trace + chemistry inputs used        | Calculation summary + raw inputs for reproducibility.   |

The full schema is the source of truth; the table above only describes
the intent of each section.

---

## 5. Recommendation rule registry

Source: `backend/src/services/report/rules.ts`. Each rule is a pure
record with a stable `code`, severity, horizon, category, copy, and a
`evaluate(ctx)` predicate that returns either `null` (no match) or an
optional `{ body?, context? }` override.

Rule code convention: `REC-<DOMAIN>-<NNN>`.

| Domain | Codes             | Trigger summary                                |
| ------ | ----------------- | ---------------------------------------------- |
| SAL    | `REC-SAL-001/002` | Strong/Severe → leach; Moderate → tolerant cv. |
| SOD    | `REC-SOD-001`     | Strong/Severe sodicity → gypsum + leach.       |
| PH     | `REC-PH-001/002`  | Strongly acidic → lime; alkaline → micros.     |
| OM     | `REC-OM-001`      | Very Low / Low OM → compost / cover crops.     |
| TEX    | `REC-TEX-001/002` | Clay → aeration; sand → split irrigation.      |
| CEC    | `REC-CEC-001`     | Low CEC → split fert.                          |
| DRN    | `REC-DRN-001`     | Poor / Very Poor drainage → subsurface drain.  |
| COMP   | `REC-COMP-001`    | High compaction risk → subsoiling.             |
| MON    | `REC-MON-001`     | Baseline annual re-test (always fires).        |

`runRecommendations()` (`backend/src/services/report/recommendations.ts`)
walks the registry once, collects matches, and groups them by horizon
(`SHORT` / `MEDIUM` / `LONG`) into a `RecommendationSetDTO`. Adding a
new rule is one append to `RECOMMENDATION_RULES` — no caller code
changes.

The engine is exercised by `backend/src/services/__tests__/recommendations.test.ts`
(direct rule matching) and `composeProfessionalReport.test.ts`
(end-to-end composition with the frozen Doha fixture).

---

## 6. Renderer abstraction

Three small interfaces in
`backend/src/services/report/renderer/types.ts` decouple "what to
render" from "how" and "where":

```ts
interface ReportTemplate {
	readonly id: string;
	render(ctx: { report: ProfessionalReportDTO; brand: BrandTokens }): string;
}

interface ReportRenderer {
	render(report: ProfessionalReportDTO): { html: string; bytes: number };
}

interface ReportExporter {
	readonly contentType: string;
	export(report: ProfessionalReportDTO): Promise<{ body: string | Buffer }>;
}
```

- `DefaultReportRenderer` is the only concrete implementation in v1.
  It composes the included `defaultTemplate` + `defaultTemplate2`
  fragments into a self-contained HTML document with the Flaha brand
  tokens inlined as CSS variables (`DEFAULT_BRAND`).
- `ReportExporter` is intentionally left without a concrete
  implementation. The HTML preview endpoint returns the renderer
  output directly; a PDF exporter (Puppeteer / Playwright) and email
  exporter (transactional templates) are Phase 9 work.
- Branding is centralised in `BrandTokens` so the FlahaCALC and
  FlahaFAST suites can reuse the same shape with a different palette.

---

## 7. HTTP surface

All routes go through the `devSessionMiddleware` and the
`assertReportOwnership` / `assertSoilTestOwnership` checks. Cross-user
access returns 404 (not 403) to avoid existence leaks.

| Method  | Path                                            | Body / Response                                    |
| ------- | ----------------------------------------------- | -------------------------------------------------- |
| `POST`  | `/api/v2/soil-tests/:soilTestId/reports`        | `GenerateReportRequest` → `GenerateReportResponse` |
| `GET`   | `/api/v2/projects/:projectId/reports`           | `ListProjectReportsResponse`                       |
| `GET`   | `/api/v2/reports/:reportId`                     | `GetReportResponse` (versions + currentVersion)    |
| `PATCH` | `/api/v2/reports/:reportId`                     | `PatchReportRequest` → `PatchReportResponse`       |
| `POST`  | `/api/v2/reports/:reportId/regenerate`          | `GenerateReportResponse` (versionNumber += 1)      |
| `GET`   | `/api/v2/reports/:reportId/versions`            | `ListReportVersionsResponse` (summaries only)      |
| `GET`   | `/api/v2/reports/:reportId/versions/:n`         | `ReportVersionDTO` (full snapshot)                 |
| `GET`   | `/api/v2/reports/:reportId/versions/:n/preview` | `text/html` (rendered preview)                     |

Validation is zod-driven (`backend/src/validation/schemas.ts`); errors
flow through the standard `ApiError` → `errorHandler` envelope and
include `PAYLOAD_TOO_LARGE`, `VALIDATION_ERROR`, `NOT_FOUND`,
`RATE_LIMITED`, and `INTERNAL_ERROR`.

---

## 8. Frontend integration

- `/projects/:projectId/reports` — `ReportsListPage` shows cards per
  report with status badge, latest version, generatedAt, soil test ref,
  and a "Generate report" action that picks from the project's tests.
- `/projects/:projectId/reports/:reportId` — `ReportDetailPage` renders
  the `ProfessionalReportDTO` sections with Flaha branding, a version
  history sidebar with regenerate action, a Print button that opens
  the HTML preview endpoint in a new tab, and a disabled "Download
  PDF" placeholder.
- `realApiV2Client` and `mockApiV2Client` both expose
  `listReports`, `getReport`, `getReportVersions`, `getReportVersion`,
  `generateReport`, `regenerateReport`, `updateReport`. The dev session
  header (`x-dev-user-id`) is injected automatically.

---

## 9. Testing matrix

| Layer                      | Suite                                                     | Cases |
| -------------------------- | --------------------------------------------------------- | ----- |
| Composer (pure)            | `composeProfessionalReport.test.ts`                       | 5     |
| Service (stub Prisma)      | `reports.service.test.ts`                                 | 9     |
| Ownership isolation        | `auth/__tests__/ownership.test.ts`                        | 9     |
| Recommendation engine      | `recommendations.test.ts`                                 | 5     |
| Interpretation classifiers | `packages/soil-interpretation/.../extended.test.ts`       | 16    |
| Interpretation (legacy)    | `packages/soil-interpretation/.../interpretation.test.ts` | 17    |

Full backend suite: **79 pass, 1 skipped**. All suites are pure unit /
stub-Prisma; the only integration test
(`__tests__/integration/soilTest.e2e.test.ts`) remains gated on
`DATABASE_URL_V2` matching `*_test`.

---

## 10. Deferred to Phase 9

- **PDF exporter.** `ReportExporter` interface is in place; a
  Puppeteer or Playwright-backed implementation is the next milestone.
- **Email exporter.** Same interface, transactional templates TBD.
- **Auth hardening.** Reports inherit the dev-session header; real
  login + JWT + role gating are Phase 9 work.
- **Branded PDF stylesheet.** The HTML renderer ships with Flaha brand
  tokens inlined; the print stylesheet is intentionally minimal.
- **Recommendation tuning + provenance.** Current thresholds reference
  the project house spec; FAO-29 and NRCS sources are cited inline.
  Formal agronomic review is a separate workstream.
- **Multi-tenant orgs.** Reports are scoped per user via project
  ownership; org-level sharing is not yet modelled.
