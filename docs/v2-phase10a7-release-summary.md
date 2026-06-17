<!-- @format -->

# FlahaSOIL v2 — Phase 10A.7 Release Summary

> Concise release sign-off for Phase 10A.7 (Scientific Audit
> Corrections). Phase 10A.7 is **merged into `main`** and tagged
> `v0.10.7-phase-10a7`. Full defect-by-defect detail lives in
> `docs/v2-phase10a7-scientific-audit-corrections.md`; the per-quantity
> unit contract lives in `docs/v2-scientific-unit-matrix.md`.

---

## 1. Release coordinates

```text
Branch (merged):           phase-10a7-scientific-audit-corrections
Tag:                       v0.10.7-phase-10a7
Scientific corrections:    2e1ab7f
Backend test stability:    9282d6b
Merge commit:              f70acbb
Baseline:                  70d788f
```

---

## 2. Scientific behaviour delivered

Pointers to the canonical documentation (no behaviour is duplicated here):

- **Water unit integrity** — field capacity, wilting point, plant
  available water, porosity, and saturation are reported as `% v/v`
  and must not be mixed with raw fraction units. See unit matrix §1.
- **Bulk-density traceability** — `predictedBulkDensity` (Saxton-Rawls
  texture/OM estimate), `bulkDensityUsed` (value used in
  density-coupled calculations), and `bulkDensitySource`
  (`DEFAULT` / `USER_INPUT`). When `texture.bulkDensity` is null the
  engine uses `1.30 g/cm³` with source `DEFAULT`; when supplied it uses
  the supplied value with source `USER_INPUT`. The Phase 10A.7 fix has
  `calculation.service.ts` forward `texture.bulkDensity` to
  `calculateSoilPhysics` as `densityFactor`. See corrections doc WS2.
- **Chemistry unit separation** — exchangeable Ca/Mg/K/Na are
  `cmol(+)/kg`; plant-available / extractable K is `mg/kg`.
  Exchangeable K must not be displayed as K mg/kg. See corrections
  doc §6.2.
- **CEC source honesty** — `LAB` / `DERIVED_CATION_SUM` / `ESTIMATED` /
  `MISSING`; derived CEC is provisional and must not be presented as
  lab CEC. See corrections doc §6.1.
- **SoilTestLevel vs ScientificCoverage** — `SoilTestLevel` is the
  requested/expected evidence level; `ScientificCoverage` is the actual
  submitted coverage. `PRELIMINARY` / `MODERATE` / `ADVANCED` are
  evidence contracts, not calculation blockers: extra fields are
  accepted, and missing fields reduce completeness without preventing
  available calculations. See unit matrix §4.
- **CEC structure triangle** — backdrop SVG
  `public/assets/img/Structure Triangle.svg`
  (`/assets/img/Structure%20Triangle.svg`); the plotted point uses CEC
  saturation barycentric coordinates. SVG zone polygons are a visual
  background only and are **not** digitized, so zone-polygon
  classification is not claimed; cation ratio status is reported
  separately by threshold rules. See corrections doc §6.3.

### Salinity / sodicity reference gate

```text
Reference sample: EC = 1.00 dS/m, SAR ≈ 0.15, ESP ≈ 2.22 %

Expected: Salinity = None or Low
          Sodicity = None or Low
          No gypsum recommendation
          No leaching recommendation
          No salt-tolerant-crop recommendation
```

---

## 3. Verification & regression architecture

These guard the Phase 10A.7 corrections from regression — water units,
the bulk-density `DEFAULT` / `USER_INPUT` path, cation units, the
reference salinity/sodicity gate, evidence completeness, and the
structure-triangle display:

```text
backend/src/services/__tests__/calculation.service.test.ts
backend/src/services/__tests__/scientificCoverage.test.ts
packages/soil-physics/src/__tests__/reference-sample.test.ts
packages/soil-chemistry/src/__tests__/reference-sample.test.ts
packages/soil-interpretation/src/__tests__/reference-sample.test.ts
frontend result-component tests (ScientificAnalysisPanel, ChemistryResultCard)
scripts/canon_tests_10a7.ps1        (real end-to-end app-path runner)
scripts/audit-reference-sample.mts
scripts/browser-smoke-sa.mjs
```

---

## 4. Backend test stability architecture

- **`backend/vitest.config.ts`** — backend Vitest runs in `singleFork`
  mode on Windows to avoid intermittent `argon2` native-module crashes
  (`0xC0000005`) under worker concurrency.
- **JWT tamper test** — mutates the payload deterministically instead
  of changing the padding-sensitive final signature character.
- **`app.test.ts`** — restores `ALLOW_DEV_AUTH` after the suite so the
  value does not leak across files under single-fork execution.

---

## 5. Scientific package verification

Placeholder build scripts were removed from the scientific engines:

```text
@flaha/soil-physics    typecheck = tsc -p tsconfig.json --noEmit ; build = npm run typecheck
@flaha/soil-chemistry  typecheck = tsc -p tsconfig.json --noEmit ; build = npm run typecheck
```

- `@flaha/shared-types` has real `typecheck` / `build` (`test` is a
  types-only no-op echo — there is no runtime to test).
- `@flaha/soil-interpretation` has real `typecheck` / `build` / `test`.

### Known technical debt

```text
packages/validation remains a Phase 1 skeleton with placeholder
build/test scripts. It is outside the Phase 10A.7 scientific engine
path; cleanup is deferred to a future maintenance phase unless it
becomes part of runtime.
```

---

## 6. Final verification (on `main` after merge)

```text
API typecheck: PASS
API tests:     22 passed / 1 skipped files, 206 passed / 1 skipped tests

Web typecheck: PASS
Web tests:     10 passed files, 40 passed tests
Web build:     PASS

Soil physics tests:        70 passed
Soil chemistry tests:      45 passed
Soil interpretation tests: 37 passed
```

### Non-blocking warnings (future cleanup, not Phase 10A.7 blockers)

- Vite CJS Node API deprecation warning.
- React Router v7 future-flag warnings.
- Frontend bundle-size warning.
