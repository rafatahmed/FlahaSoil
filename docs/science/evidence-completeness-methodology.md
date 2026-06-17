<!-- @format -->

# Evidence Completeness (Coverage) — Methodology

## 1. Status & Scientific Honesty Label

`IMPLEMENTED` — `computeScientificCoverage` scores how completely a submitted
lab panel satisfies the field expectations for its declared `SoilTestLevel`.
It is wired into the scientific-analysis service and emitted on every
analysis response.

Provenance: `HOUSE_CONVENTION` — the per-level module expectations are the
FlahaSOIL Phase-10A.7 evidence contract, not an external standard.

## 2. Purpose & Scope

Report evidence completeness honestly: what was expected at the declared test
level, what was actually submitted, and the resulting coverage percentage —
without ever blocking or imputing missing data.

In scope: module expectations per level, slot counting, alternate groups, and
the level roll-up. Out of scope: the scientific calculations themselves; this
engine never computes a soil property, only completeness of inputs.

## 3. Scientific Background

A soil report is only as trustworthy as the data behind it. FlahaSOIL
stratifies tests into three declared levels — PRELIMINARY, MODERATE, ADVANCED —
each expecting a progressively larger panel. Coverage makes the gap between
the declared level and the supplied data explicit and auditable.

## 4. Governing Equations & Rules

**Level ranking:** PRELIMINARY (0) < MODERATE (1) < ADVANCED (2).

**Module requirement** (`moduleIsRequired`): a module with `requiredFrom = L`
is required when `rank(declaredLevel) ≥ rank(L)`; `requiredFrom = null`
modules are always optional.

**Slot counting** (`scoreModule`):

- Each expected field is one slot.
- Each alternate group (e.g. EC OR TDS) collapses to one slot, satisfied if
  any member key is present — so a lab is not penalised for measuring EC
  instead of TDS.
- `extraSubmittedFields` (submitted but not expected at this level) never
  affect status; they only credit the lab for over-collection.

**Module status** (`CoverageStatus`): `NotRequired` (not required at level),
`Met` (all slots satisfied), `Missing` (zero satisfied), else `Partial`.

**Level roll-up:** `NotRequired` if no required modules; `Met` if every
required module is `Met`; `Missing` if every required module is `Missing`;
otherwise `Partial`.

**Coverage percent:** `round(satisfied / expected × 1000) / 10` (one decimal),
or `100` when nothing is expected.

## 5. Inputs & Units

| Input | Type | Notes |
| ----- | ---- | ----- |
| `declaredLevel` | `SoilTestLevel` | PRELIMINARY / MODERATE / ADVANCED |
| `inputs.texture` | record | texture/physics submitted fields |
| `inputs.chemistry` | record | chemistry submitted fields |

## 6. Outputs & Units

| Output | Type | Notes |
| ------ | ---- | ----- |
| `level.status` | enum | Met / Partial / Missing / NotRequired |
| `level.coveragePercent` | % (1 dp) | required slots satisfied |
| `level.statement` | string | pre-formatted summary, render verbatim |
| `level.met/partial/missingModules` | string[] | module ids by status |
| `modules[]` | `CoverageModule[]` | per-module expected/submitted/missing/extra |

## 7. Source of Truth

- `packages/shared-types/src/scientific-coverage.ts` —
  `SOIL_TEST_LEVEL_EXPECTATIONS`, `scoreModule`, `computeScientificCoverage`.
- `packages/shared-types/src/scientific-analysis.ts` — `CoverageModule`,
  `LevelCompleteness`, `ScientificCoverage` types.
- `backend/src/services/scientificAnalysis.service.ts` — invocation per
  analysis response.

## 8. Assumptions

- The declared level is authoritative; coverage measures the submission
  against that declaration, not against the most complete level possible.
- Field presence is determined by `isPresent` (non-null, non-empty); a present
  field is counted regardless of its value.
- Extra data is always welcome and never penalised.

## 9. Limitations

- Coverage measures **completeness of inputs**, not correctness or quality of
  the values supplied.
- Module expectations are house conventions (`HOUSE_CONVENTION`) and may
  evolve; consumers should not treat them as a regulatory checklist.

## 10. Validation & Evidence

- `backend/src/services/__tests__/scientificCoverage.test.ts` — three
  canonical scenarios (PRELIMINARY / MODERATE / ADVANCED) covering level
  roll-up, per-module status, alternate-group satisfaction (EC OR TDS), and
  the `extraSubmittedFields` over-collection channel.

## 11. References

- FlahaSOIL Phase-10A.7 evidence-contract correction brief (project internal).
- USDA NRCS Soil Survey Manual — basis for the panel field groupings.

## 12. Provenance & Change Log

| Date | Change |
| ---- | ------ |
| Phase 10A.7 | Coverage engine introduced; PAW-scale and evidence-contract correction. |
| Phase 10C-E | Documented as shipped; no expectation or counting rule changed. |

## 13. Audit Notes

- No module spec, slot-counting rule, or percentage formula was modified by
  this white paper.
- The `extraSubmittedFields` channel guarantees the engine never blocks a
  submission for containing more data than the declared level expects.
