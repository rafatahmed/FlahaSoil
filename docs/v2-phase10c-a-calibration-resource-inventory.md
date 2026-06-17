<!-- @format -->

# FlahaSOIL v2 — Phase 10C-A: Calibration Resource Inventory

## Purpose

Phase 10C-A introduces a **Scientific Calibration Framework** — a metadata layer
that names, audits, and version-controls the scientific methods FlahaSOIL applies.
This document is the **resource inventory**: a single map of every scientific
method, threshold set, and reference standard currently wired into the v2 pipeline,
organised by engine layer and by provenance.

**No scientific behaviour changes in Phase 10C-A.** The inventory describes what
already ships. It is the input to the `FLAHA_DEFAULT` profile audit
(`docs/v2-phase10c-a-flaha-default-profile-audit.md`) and the framework design
(`docs/v2-phase10c-a-scientific-calibration-framework.md`).

- **Branch:** `phase-10c-a-scientific-calibration-framework`
- **Baseline:** `main` (Phase 10B merged, tag `v0.10.9-phase-10b`)

---

## Resource locations

```
packages/soil-physics/src/calculateSoilPhysics.ts   ← FC, WP, PAW, Ksat, drainage
packages/soil-chemistry/src/                         ← CEC, BS, cation %, ESP, SAR
packages/soil-interpretation/src/rules.ts            ← all classification thresholds
packages/soil-interpretation/src/calibration/        ← Phase 10C-A registry (new)
packages/shared-types/src/scientificCalibration.ts   ← public type vocabulary (new)
```

---

## Inventory by engine layer

### 1. Physics (calculation — formulas)

| Method                      | Source                | Peer-reviewed |
| --------------------------- | --------------------- | ------------- |
| FC / WP / PAW / Ksat / θsat | Saxton & Rawls (2006) | Yes           |

Phase 10B added a Ksat domain guard (BUG-10B-01) — a numerical robustness fix, not a
formula change.

### 2. Chemistry (calculation — equations)

| Method                                   | Source                                       | Peer-reviewed |
| ---------------------------------------- | -------------------------------------------- | ------------- |
| CEC, base saturation, cation %, ESP, SAR | Standard equations (USDA NRCS / Sparks 2003) | Yes           |

### 3. Interpretation (classification — thresholds)

| Method (`rules.ts`)          | Threshold provenance                          | Peer-reviewed |
| ---------------------------- | --------------------------------------------- | ------------- |
| `classifyPh`                 | FlahaSOIL Phase-2.3 house thresholds          | No            |
| `classifySalinity`           | FlahaSOIL Phase-2.3 house thresholds          | No            |
| `classifySalinitySeverity`   | FAO-29 (Ayers & Westcot 1985)                 | Yes           |
| `classifySodicitySeverity`   | FAO-29 (Ayers & Westcot 1985)                 | Yes           |
| `classifyCec`                | FlahaSOIL Phase-2.3 house thresholds          | No            |
| `classifyBaseSaturation`     | FlahaSOIL Phase-2.3 house thresholds          | No            |
| `classifySodiumRisk`         | FlahaSOIL Phase-2.3 house thresholds          | No            |
| `classifyCationBalance`      | BCSR windows — project convention             | No            |
| `classifyWaterHolding`       | Brady & Weil 14 ed. Table 5.3; USDA NRCS SSM  | Yes           |
| `classifyOrganicMatter`      | FlahaSOIL house thresholds                    | No            |
| `classifyDrainageFromKsat`   | NRCS-aligned house thresholds                 | No            |
| `classifyInfiltration`       | USDA-style house buckets                      | No            |
| `classifyCompactionRisk`     | NRCS bulk-density guidance (house thresholds) | No            |
| `classifyTextureSuitability` | FlahaSOIL house suitability matrix            | No            |

---

## Provenance summary

- **Peer-reviewed / standards-backed (3):** soil-water physics (Saxton & Rawls),
  soil-chemistry equations, and the FAO-29 salinity/sodicity severity bands. The
  PAW water-holding thresholds are also anchored to published interpretive ranges.
- **House conventions pending citation (≈10):** the remaining interpretation
  thresholds are FlahaSOIL project conventions. They are correct and internally
  consistent but are not yet cited to a peer-reviewed source — and MUST be reviewed
  before any external agronomic-claim publication (carried over from `rules.ts`).

This split is the motivation for the calibration framework: it makes each method's
provenance explicit and machine-readable so future profiles (USDA NRCS, FAO-29,
regional surveys) can be compared against the baseline without ambiguity.

---

## Roadmap profiles (metadata-only)

The following roadmap profiles are recorded in the registry as **metadata-only**
alternatives. None are wired to any engine in Phase 10C-A.

| Profile               | Status         | Scope          | Intent                                         |
| --------------------- | -------------- | -------------- | ---------------------------------------------- |
| `USDA_EXTENSION`      | REFERENCE_ONLY | INTERPRETATION | USDA cooperative-extension interpretive ranges |
| `ALBRECHT_BEAR`       | REFERENCE_ONLY | CHEMISTRY      | Albrecht / BCSR cation-balance school          |
| `EUROFINS_STYLE`      | REFERENCE_ONLY | INTERPRETATION | Commercial-lab (Eurofins-style) bands          |
| `MENA_ARID_REGION`    | PROVISIONAL    | FULL           | Draft MENA arid-region calibration             |
| `CUSTOM_ORGANIZATION` | FUTURE         | FULL           | Per-organization custom overrides              |

External standards such as USDA NRCS, FAO-29, and the EU LUCAS survey remain
relevant as **source references** (they already back several FLAHA_DEFAULT methods —
see the audit) but are not registry profile ids in this phase.
