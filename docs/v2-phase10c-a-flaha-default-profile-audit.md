<!-- @format -->

# FlahaSOIL v2 — Phase 10C-A: FLAHA_DEFAULT Profile Audit

## Purpose

`FLAHA_DEFAULT` is defined as the **verified, deployed FlahaSOIL v2 scientific
baseline**. This document audits it method-by-method and asserts the invariant that
makes the calibration framework safe: **`FLAHA_DEFAULT` is a faithful, complete
mirror of the methods already wired into the production pipeline** — it adds no new
science and changes no threshold.

- **Branch:** `phase-10c-a-scientific-calibration-framework`
- **Baseline:** `main` (Phase 10B merged, tag `v0.10.9-phase-10b`)
- **Definition source:** `packages/soil-interpretation/src/calibration/calibrationMetadata.ts`
- **Registry entry:** `packages/soil-interpretation/src/calibration/calibrationProfiles.ts`

---

## Profile header

| Field              | Value                                            |
| ------------------ | ------------------------------------------------ |
| `id`               | `FLAHA_DEFAULT`                                   |
| `displayName`      | FlahaSOIL Default (v2 baseline)                  |
| `status`           | `ACTIVE` (the only ACTIVE profile)               |
| `scope`            | `FULL` (physics + chemistry + interpretation)    |
| `methods.length`   | 16                                               |

---

## Method audit

Each method in `FLAHA_DEFAULT.methods` maps to a live implementation. The audit
below confirms the metadata matches the shipped code; threshold *values* are not
duplicated here — they remain authoritative in their source files.

### Calculation engines

| `key`               | Live implementation                          | Source                | Peer-reviewed |
| ------------------- | -------------------------------------------- | --------------------- | ------------- |
| `soil_water_physics`| `@flaha/soil-physics` `calculateSoilPhysics` | Saxton & Rawls (2006) | Yes           |
| `soil_chemistry`    | `@flaha/soil-chemistry`                      | Std. equations        | Yes           |

### Interpretation thresholds (`rules.ts`)

| `key`                | Function                     | Source                          | Peer-reviewed |
| -------------------- | ---------------------------- | ------------------------------- | ------------- |
| `ph_classification`  | `classifyPh`                 | Phase-2.3 house                 | No            |
| `salinity_risk`      | `classifySalinity`           | Phase-2.3 house                 | No            |
| `salinity_severity`  | `classifySalinitySeverity`   | FAO-29 (1985)                   | Yes           |
| `sodicity_severity`  | `classifySodicitySeverity`   | FAO-29 (1985)                   | Yes           |
| `cec_level`          | `classifyCec`                | Phase-2.3 house                 | No            |
| `base_saturation`    | `classifyBaseSaturation`     | Phase-2.3 house                 | No            |
| `sodium_risk_esp`    | `classifySodiumRisk`         | Phase-2.3 house                 | No            |
| `cation_balance`     | `classifyCationBalance`      | BCSR windows (house)            | No            |
| `water_holding`      | `classifyWaterHolding`       | Brady & Weil; USDA NRCS SSM     | Yes           |
| `organic_matter`     | `classifyOrganicMatter`      | House                           | No            |
| `drainage_from_ksat` | `classifyDrainageFromKsat`   | NRCS-aligned house              | No            |
| `infiltration`       | `classifyInfiltration`       | USDA-style house buckets        | No            |
| `compaction_risk`    | `classifyCompactionRisk`     | NRCS guidance (house)           | No            |
| `texture_suitability`| `classifyTextureSuitability` | House suitability matrix        | No            |

---

## Invariants (enforced by tests)

`packages/soil-interpretation/src/__tests__/calibrationProfiles.test.ts` locks:

1. `FLAHA_DEFAULT` is the **only** profile with `status === "ACTIVE"`.
2. `FLAHA_DEFAULT.methods` is the `FLAHA_DEFAULT_METHODS` audit array and is
   non-empty.
3. Both calculation engines (`soil_water_physics`, `soil_chemistry`) and a
   representative spread of interpretation thresholds are present.
4. Method keys are unique; every method has a valid `domain`, a non-empty
   `source`, and a boolean `peerReviewed`.
5. The FAO-29 severity methods and the physics engine are flagged
   `peerReviewed: true`; house conventions remain `peerReviewed: false`.

`packages/soil-interpretation/src/__tests__/calibrationResolver.test.ts` locks the
resolver safety contract (see the framework document).

---

## Regression safety

Phase 10C-A adds **no** call into the calculation or interpretation paths — the
registry is pure metadata. The existing golden reports, the Phase 10B scientific
matrix audit, and the `reference-sample` interpretation fixture are therefore
unaffected. This is verified by the full backend + package test matrix (see the
framework document's verification section).
