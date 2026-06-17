<!-- @format -->

# FlahaSOIL v2 — Phase 10C-A: Scientific Calibration Framework

## Purpose

Phase 10C-A lays the **foundation** for configurable scientific calibration. It
introduces a metadata layer that names the methods FlahaSOIL applies, declares
`FLAHA_DEFAULT` as the verified active baseline, and allows alternative profiles to
be registered as **metadata-only** records for audit and roadmap tracking.

**No scientific behaviour changes.** Nothing in this phase alters a formula,
threshold, unit, DTO, or HTML output. The framework is inert: the engine continues
to apply exactly the `FLAHA_DEFAULT` methods, and the resolver guarantees no
alternative profile can silently change results.

- **Branch:** `phase-10c-a-scientific-calibration-framework`
- **Baseline:** `main` (Phase 10B merged, tag `v0.10.9-phase-10b`)

---

## Architecture

```
@flaha/shared-types
  src/scientificCalibration.ts     ← public type vocabulary (DTO-level)
        │  (structurally mirrored, no import — see note below)
        ▼
@flaha/soil-interpretation
  src/calibration/
    calibrationTypes.ts      ← local mirror of the shared types
    calibrationMetadata.ts   ← FLAHA_DEFAULT_METHODS (the method audit)
    calibrationProfiles.ts   ← CALIBRATION_PROFILES registry + FLAHA_DEFAULT
    calibrationResolver.ts   ← resolveCalibrationProfile + helpers
    index.ts                 ← barrel (re-exported from package root)
```

**Why a local type mirror?** The engine packages (`soil-physics`,
`soil-chemistry`, `soil-interpretation`) intentionally carry **no cross-package
dependencies**, and `soil-interpretation` emits with `rootDir: src`. Importing the
`@flaha/shared-types` source from inside the engine would trip TS6059
("not under rootDir") and break its build. The calibration types are therefore
declared in both places and MUST stay structurally in sync. This mirrors existing
house style (e.g. `SuitabilityMatrix` vs the inline `textureSuitability` shape).

---

## Type vocabulary

| Type                           | Meaning                                                               |
| ------------------------------ | --------------------------------------------------------------------- |
| `CalibrationProfileId`         | Union of registered ids (`FLAHA_DEFAULT`, …)                          |
| `CalibrationProfileStatus`     | `ACTIVE` / `REFERENCE_ONLY` / `PROVISIONAL` / `FUTURE` / `DEPRECATED` |
| `CalibrationProfileScope`      | `PHYSICS` / `CHEMISTRY` / `INTERPRETATION` / `FULL`                   |
| `CalibrationMethod`            | One method's provenance (`source`, `peerReviewed`)                    |
| `ScientificCalibrationProfile` | A named profile: header + `methods[]` + audit dates                   |

---

## Resolver safety contract

`resolveCalibrationProfile(profileId?)` is the **only** function the engine should
call to select a profile to apply:

| Input                       | Result                                     |
| --------------------------- | ------------------------------------------ |
| `undefined` / `null` / `""` | returns `FLAHA_DEFAULT`                    |
| a known **ACTIVE** id       | returns that profile                       |
| a known **non-ACTIVE** id   | **throws** (metadata-only; not applicable) |
| an unknown id               | **throws** (`Unknown calibration profile`) |

Supporting helpers:

- `getActiveCalibrationProfile()` → always `FLAHA_DEFAULT`.
- `getCalibrationProfileMetadata(id)` → reads any **known** profile regardless of
  status (for audit / comparison UIs); throws on unknown.
- `isCalibrationProfileActive(id)` → boolean.
- `listCalibrationProfiles()` → the full registry.

This is the safety guarantee: because a missing selection resolves to the baseline
and any non-active selection is rejected, **no alternative profile can change engine
output by accident** in Phase 10C-A.

---

## Registered profiles

| Profile               | Status         | Scope          | Wired? |
| --------------------- | -------------- | -------------- | ------ |
| `FLAHA_DEFAULT`       | ACTIVE         | FULL           | Yes    |
| `USDA_EXTENSION`      | REFERENCE_ONLY | INTERPRETATION | No     |
| `ALBRECHT_BEAR`       | REFERENCE_ONLY | CHEMISTRY      | No     |
| `EUROFINS_STYLE`      | REFERENCE_ONLY | INTERPRETATION | No     |
| `MENA_ARID_REGION`    | PROVISIONAL    | FULL           | No     |
| `CUSTOM_ORGANIZATION` | FUTURE         | FULL           | No     |

---

## Adding a future profile (procedure)

1. Append the new id to `CALIBRATION_PROFILE_IDS` in **both**
   `shared-types/src/scientificCalibration.ts` and
   `soil-interpretation/src/calibration/calibrationTypes.ts` (do not remove or
   renumber existing ids — they are part of the audit contract).
2. Add the profile object to `CALIBRATION_PROFILES`. Keep `status` non-`ACTIVE`
   until the methods are implemented and validated end-to-end.
3. Document its methods (with `source` + `peerReviewed`) before promoting it.
4. Promoting a profile to `ACTIVE` is a **scientific behaviour change** and belongs
   to a later phase with its own golden/matrix verification — never in 10C-A.

---

## Verification

| Workspace                    | Tests                  | Result |
| ---------------------------- | ---------------------- | ------ |
| `@flaha/soil-interpretation` | 60 (37 + 23 new)       | PASS   |
| `@flaha/soil-physics`        | 71                     | PASS   |
| `@flaha/soil-chemistry`      | 45                     | PASS   |
| `@flaha/api` (regression)    | 261 (+1 skipped)       | PASS   |
| `@flaha/web`                 | 40 + typecheck + build | PASS   |
| `@flaha/shared-types`        | typecheck + build      | PASS   |

The 23 new tests live in `calibrationProfiles.test.ts` (12) and
`calibrationResolver.test.ts` (11). `shared-types` is a types-only package
(no runtime test runner); its calibration contract is validated by `tsc`.

---

## API contract impact

**None.** No request/response DTO changed, no new field is emitted on any
`/api/v2/...` response, and no warning code was added. `docs/v2-api-contracts.md`
needs no update for Phase 10C-A.
