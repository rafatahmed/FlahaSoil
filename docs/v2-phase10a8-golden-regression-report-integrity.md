# FlahaSOIL v2 — Phase 10A.8: Golden Regression & Report Integrity Lock

## Purpose

Phase 10A.8 locks the Phase 10A.7 scientific behaviour using static golden fixtures,
deterministic HTML snapshots, and a DTO integrity test suite. **No new scientific logic
is introduced.** Any future change to a calculation engine that breaks a golden assertion
must be accompanied by a scientific review before the assertion is updated.

---

## Fixture Locations

```
backend/src/services/__tests__/fixtures/
  goldenSoilTests.ts        ← canonical frozen inputs (three distinct levels)
  goldenPrismaStore.ts      ← in-memory Prisma mock (no real DB required)
  normalizeReportHtml.ts    ← HTML normalisation pipeline
  runGoldenPipeline.ts      ← shared runner that wires the full production pipeline
```

Test files:
```
backend/src/services/__tests__/
  goldenReportIntegrity.test.ts        ← 16 locked DTO assertions
  professionalReportGoldenHtml.test.ts ← 16 locked HTML assertions
```

---

## Canonical Inputs (mirrors `scripts/canon_tests_10a7.ps1`)

| Field             | Test A PRELIMINARY | Test B MODERATE (ref #001) | Test C ADVANCED |
|-------------------|--------------------|---------------------------|-----------------|
| Sand %            | 65                 | 60                        | 35              |
| Silt %            | 15                 | 25                        | 35              |
| Clay %            | 20                 | 15                        | 30              |
| OM %              | 1.5                | 2.5                       | 1.8             |
| Bulk density      | — (DEFAULT)        | — (DEFAULT)               | 1.42 USER_INPUT |
| Gravel %          | 0                  | 0                         | 5               |
| pH                | 8.1                | 7.2                       | 8.3             |
| EC (dS/m)         | 6.0                | 1.0                       | 4.5             |
| CEC (cmol(+)/kg)  | —                  | 18                        | 22              |
| Ca / Mg / K / Na  | —                  | 11 / 3 / 0.6 / 0.4        | 13 / 4 / 0.7 / 2.0 |
| Macro N / P / Cl  | —                  | 30 / 15 / 12              | 20 / 16 / 180   |
| Micros Fe/Mn/Zn/Cu/B | —              | —                         | 6.5/3.2/0.8/0.6/0.5 |
| SAR / ESP         | —                  | —                         | 4.0 / 9.1       |

---

## Locked Golden Outputs (captured 2026-06-17)

### Test A — PRELIMINARY

| Property                 | Locked value        |
|--------------------------|---------------------|
| USDA texture class       | Loam                |
| FC / WP / PAW (% v/v)   | 20.1 / 11.9 / 8.3   |
| Porosity (% v/v)         | 50.9                |
| Ksat (mm/h)              | 66.4                |
| BD used / predicted      | 1.30 DEFAULT / 1.58 |
| CEC source               | MISSING             |
| Salinity severity        | Moderate            |
| Salinity risk            | High                |
| Overall rating           | Poor                |
| Completeness             | Met 100 %           |
| Key warnings             | CHEMISTRY_SKIPPED_PRELIMINARY, INTERPRETATION_WARNING |

### Test B — MODERATE

| Property                 | Locked value            |
|--------------------------|-------------------------|
| USDA texture class       | Sandy Loam              |
| FC / WP / PAW (% v/v)   | 18.3 / 8.9 / 9.4        |
| Porosity (% v/v)         | 50.9                    |
| Ksat (mm/h)              | 82.8                    |
| BD used / predicted      | 1.30 DEFAULT / 1.59     |
| CEC source               | LAB                     |
| SAR / ESP                | 0.151 / 2.22            |
| Salinity severity        | None                    |
| Overall rating           | Fair                    |
| Completeness             | Met 100 %               |
| Warnings                 | 0                       |

### Test C — ADVANCED

| Property                 | Locked value              |
|--------------------------|---------------------------|
| USDA texture class       | Clay Loam                 |
| FC / WP / PAW (% v/v)   | 31.3 / 18.1 / 13.2        |
| Porosity (% v/v)         | 46.4                      |
| Ksat (mm/h)              | 8.8                       |
| BD used / predicted      | 1.42 USER_INPUT / 1.46    |
| CEC source               | LAB                       |
| SAR / ESP                | 0.686 / 9.09              |
| Salinity severity        | Moderate                  |
| Sodicity severity        | Slight                    |
| Infiltration class       | Moderate                  |
| Overall rating           | Poor                      |
| Completeness             | Met 100 % (7 modules, 23 fields) |

---

## DTO Lock Strategy

`goldenReportIntegrity.test.ts` runs `runGoldenPipeline(fixture)` for each level and
asserts on key fields of the returned `ProfessionalReportDTO`:

- `cover` meta (reportNumber, testLevel, clientName, consultantName, location)
- `executiveSummary` (overallRating, actionItemCount, headlineFindings count)
- `physics` (FC, WP, PAW, porosity, Ksat, bulkDensityTrace source/used/predicted)
- `chemistry` (pH, ECe, CEC, cecSource, calculationMode, exchangeableCations, micronutrients, structureDisclaimer)
- `salinity` + `sodicity` (severity, riskLabel, SAR, ESP)
- `irrigation` (infiltrationClass)
- `completeness` (status, coveragePercent, metModules count)
- `notes` (missingValues, calculationWarnings codes)

---

## HTML Normalization Strategy

`normalizeProfessionalReportHtml` applies four transformations before comparison:

1. **`stripDates`** — ISO-8601 and plain `YYYY-MM-DD` → `{{DATE}}`
2. **`stripUuids`** — UUID v4 → `{{UUID}}`
3. **`stripDynamicIds`** — entity-id prefixes (`gst_`, `smp_`, `physicsResult_`, …) → `{{ID}}`
   *(case-sensitive so uppercase scientific codes like `INTERPRETATION_WARNING` are preserved)*
4. **`collapseWhitespace`** — runs of whitespace → single space

`normalizeNumbers` (rounds to 2 dp) is **not** applied in the golden HTML tests — numeric
drift is a regression we want to catch.

---

## How to Update Golden Outputs Safely

**RULE: Do not change golden assertion values without a scientific review.**

If a legitimate engine change requires updating the locked values:

1. Restore `goldenDiscovery.tmp.test.ts` from the pattern in `runGoldenPipeline.ts`.
2. Run `npx vitest run src/services/__tests__/goldenDiscovery.tmp.test.ts` from `backend/`.
3. Capture the new DTO JSON and normalised HTML for each level.
4. Update `goldenReportIntegrity.test.ts` and `professionalReportGoldenHtml.test.ts`.
5. Update the **Locked Golden Outputs** table in this document.
6. Delete the temporary discovery test before committing.
7. Run the full backend suite and confirm 0 regressions.

---

## Verification Commands

```powershell
# Run only golden locked tests
cd backend
npx vitest run src/services/__tests__/goldenReportIntegrity.test.ts \
              src/services/__tests__/professionalReportGoldenHtml.test.ts

# Run full backend suite (should show 238 pass / 1 skip)
npx vitest run

# Full workspace matrix
npm run typecheck --workspace @flaha/api
npm run typecheck --workspace @flaha/web
npm run typecheck --workspace @flaha/shared-types
npm run typecheck --workspace @flaha/soil-physics
npm run typecheck --workspace @flaha/soil-chemistry
npm run typecheck --workspace @flaha/soil-interpretation
npm run build    --workspace @flaha/shared-types
npm run build    --workspace @flaha/soil-physics
npm run build    --workspace @flaha/soil-chemistry
npm run build    --workspace @flaha/soil-interpretation
npm run build    --workspace @flaha/web
npm test         --workspace @flaha/soil-physics
npm test         --workspace @flaha/soil-chemistry
npm test         --workspace @flaha/soil-interpretation
npm test         --workspace @flaha/web
```

---

## Known Limitations

- **No e2e golden lock** — the pre-existing `soilTest.e2e.test.ts` is skipped (requires a
  live database); it is not in scope for Phase 10A.8.
- **HTML assertions are substring checks** — structural refactors that preserve scientific
  content but rearrange sections will not break these tests, but complete renderer rewrites
  may require an HTML-snapshot refresh.
- **`packages/validation`** remains a Phase 1 skeleton; its `build`/`test` scripts are
  placeholders and are excluded from the verification matrix.
- **Frontend bundle size warning** — the `@flaha/web` build emits a chunk-size warning
  (>500 kB). This is a future cleanup item, not a Phase 10A.8 blocker.

---

*Phase 10A.8 locked 2026-06-17. Branch: `phase-10a8-golden-regression-report-integrity`.
Baseline: `4f2df8c` (tag `v0.10.7-phase-10a7`).*
