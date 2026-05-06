<!-- @format -->

# FlahaSOIL v2 — Database Design (Phase 3)

> **Status:** Draft. Schema lives in `prisma/v2-schema.prisma`. No migrations
> have been generated. The legacy schema in
> `api-implementation/prisma/schema.prisma` remains the runtime source of
> truth and is **untouched**.

---

## 1. Why a database redesign is needed

The legacy schema in `api-implementation/prisma/schema.prisma` was built
around a single `SoilAnalysis` row that stores every input and every
calculated output side-by-side, regardless of whether the values came from
a lab, a guess, or an engine. This conflates four distinct concerns:

1. **Identity of the physical sample** (location, depth, date).
2. **Identity of a test event** (which lab, when, what the test contained).
3. **Provenance of each value** (LAB vs ESTIMATED vs DEFAULT vs CALCULATED).
4. **Engine outputs** (physics, chemistry, interpretation).

Because everything is one row, the legacy database cannot:

- distinguish between "the lab reported 12.4 cmol(+)/kg of Ca" and "the
  engine derived a Ca percentage from a guessed CEC";
- record more than one test against the same physical sample;
- store soil-chemistry results at all (the legacy system does not implement
  CEC, base saturation, or ESP — see `docs/v2-physics-validation.md`);
- store interpretation results without polluting the calculation row;
- evolve the input schema without breaking historical analyses.

The v2 schema separates each of these concerns into its own model, allowing
the same physical sample to be tested at PRELIMINARY, MODERATE, and
ADVANCED levels over time without rewriting history.

---

## 2. Why the schema is centred on `SoilSample` and `SoilTest`

The unit of scientific identity in soil science is the **sample** — a
physical handful of soil collected at a specific location and depth on a
specific date. A sample can be analysed many times: a quick field-kit
preliminary screen, then a moderate lab panel a week later, then an
advanced micronutrient + heavy-metal panel after a problem is suspected.

The v2 schema models this directly:

```
SoilSample (1) ──< (N) SoilTest ──< (1) SoilTextureInput
                                  ──< (1) SoilChemistryInput
                                  ──< (1) SoilPhysicsResult
                                  ──< (1) SoilChemistryResult
                                  ──< (1) SoilInterpretation
                                  ──< (N) SoilReport
                                  ──< (N) SoilLabValue
```

`SoilSample` carries everything about *where* and *when*; `SoilTest`
carries everything about *what was measured*. Engines are run per
`SoilTest`, so re-running an engine after a methodology fix never mutates
the inputs and never destroys prior results.

---

## 3. PRELIMINARY / MODERATE / ADVANCED test levels

`SoilTestLevel` stratifies the expected input completeness so the API can
validate uploads, the UI can show the appropriate form, and reports can
declare their evidence level honestly.

| Level         | Required / expected fields                                                                                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PRELIMINARY` | sand, silt, clay, organicMatter, pH, EC, TDS                                                                                                                                        |
| `MODERATE`    | PRELIMINARY **+** Ca, Mg, K, Na, Cl, N, P, lab-CEC (if provided)                                                                                                                    |
| `ADVANCED`    | MODERATE **+** Fe, Mn, Zn, Cu, B, Mo, S, heavy metals, carbonate, bicarbonate, SAR, ESP, full nutrient panel (the latter two persisted as JSON for forward-compatible extra fields) |

The level is **descriptive**, not enforcing — fields outside a level are
still accepted and stored. Enforcement is the job of the validation layer
in Phase 4.

---

## 4. Raw value vs converted value strategy

The Phase-3 brief mandates that for any lab value we keep:

- the **raw lab value** as it was reported,
- a **converted standard value** in the engine's expected unit,
- the **unit** the lab used,
- the **method** the lab used.

The naive approach — quadrupling every column on `SoilChemistryInput` —
makes the table unreadable and brittle (different fields use different
sets of acceptable units). The v2 design uses two complementary tables:

| Concern                       | Lives in                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------ |
| **Engine-ready values**       | Flat columns on `SoilChemistryInput` (already in the engine's standard units). |
| **Per-field raw provenance**  | `SoilLabValue` rows keyed by `fieldKey` (`"ca"`, `"ec"`, `"ph"`, ...).         |

Each `SoilLabValue` carries `rawLabValue` (Decimal, for lossless
preservation of lab precision), `rawUnit`, `convertedStandardValue`,
`standardUnit`, and `method`. The flat input table is what the engines
read; the lab-value table is what the report layer cites.

This split also lets a single `SoilTest` carry raw readings for fields
that the engine does not yet consume (e.g. forward-looking soil-biology
panels) without inflating the input model.

`SoilValueSource` tags every input column-set with the provenance of its
contents (LAB / ESTIMATED / DEFAULT / CALCULATED) so reports can mark
"derived" values clearly.

---

## 5. How physics, chemistry, and interpretation results are separated

Each engine writes to its own dedicated table:

| Engine                       | Result table          | Why separate                                                                                                          |
| ---------------------------- | --------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `@flaha/soil-physics`        | `SoilPhysicsResult`   | Versioned (`calculationVersion`) so a Saxton-Rawls update never overwrites prior outputs; trace JSON for audit.       |
| `@flaha/soil-chemistry`      | `SoilChemistryResult` | Records `calculationMode` so consumers know whether CEC came from lab or texture estimation.                          |
| `@flaha/soil-interpretation` | `SoilInterpretation`  | Pure category fields + a `warningsJson` array; ratings indexed for fast filtering ("show me my Poor-rated samples").  |

Splitting results from inputs is what makes re-runs safe. An interpretation
re-run does not touch physics; a physics re-run does not touch chemistry;
a chemistry re-run does not touch the underlying lab readings.

Each result table has a `@unique` FK to `SoilTest`, so each engine can be
run at most once per test until the row is replaced (delete-and-insert is
the v2 pattern; no in-place mutation).

---

## 6. How this prepares future FlahaCalc integration

FlahaCalc consumes derived soil hydraulic and chemistry properties as
input to its irrigation and salt-leaching models. The v2 schema makes the
integration boundary explicit:

- `SoilPhysicsResult` exposes the canonical hydraulic outputs FlahaCalc
  needs: `fieldCapacity`, `wiltingPoint`, `plantAvailableWater`,
  `saturation`, `saturatedConductivity`, `bulkDensity`, `porosity`,
  `drainageClass`.
- `SoilChemistryResult` exposes `cec`, `esp`, and `sar` for FlahaCalc's
  salt-balance and leaching modules.
- `SoilInterpretation.warningsJson` and `overallSoilRating` give
  FlahaCalc a coarse risk gate without forcing it to re-derive the
  classifications.
- `SoilTest.id` is a stable foreign key suitable for FlahaCalc's own
  `IrrigationPlan` / `LeachingPlan` rows in a future Phase-7 schema.
- The top-level `prisma/` directory and segregated v2 client output
  (`./generated/v2-client`) keep the v2 namespace orthogonal to the
  legacy backend, so FlahaCalc can adopt the v2 client without inheriting
  any legacy models.

---

## 7. What is intentionally NOT implemented in Phase 3

The following are deliberately deferred:

1. **No User / Project / Organisation models.** `SoilSample.userId` and
   `SoilSample.projectId` are bare strings without a Prisma relation;
   the v2 user/auth model will be defined in a later phase.
2. **No subscription / tier / usage models.** Plan-tier enforcement
   stays in the legacy schema for the duration of the cutover.
3. **No `prisma migrate` invocation.** The schema is a static draft and
   has not been pushed to any database.
4. **No `prisma generate` invocation.** The `./generated/v2-client`
   output directory is reserved but not produced; nothing in the
   workspace imports a v2 client.
5. **No legacy schema edits.** `api-implementation/prisma/schema.prisma`
   and the `dev.db` sqlite file are untouched.
6. **No service / controller / route changes.** The `api-implementation/`
   and `public/` trees are byte-identical to their pre-Phase-3 state.
7. **No FlahaCalc tables.** Phase 3 prepares the soil side of the
   contract only; FlahaCalc-side models land in Phase 7.
8. **No cutover plan implementation.** The mapping from legacy
   `SoilAnalysis` rows into v2 `SoilSample` + `SoilTest` will be
   designed and run in the migration phase.
9. **No seed data.** All seed scripts continue to live under
   `api-implementation/prisma/`.

---

## 8. Model summary

| #     | Model                 | Purpose                                                            | Cardinality                  |
| ----- | --------------------- | ------------------------------------------------------------------ | ---------------------------- |
| 1     | `SoilSample`          | Physical sample (where + when).                                    | 1 → N `SoilTest`             |
| 2     | `SoilTest`            | One test event for a sample (lab + level + date).                  | N → 1 `SoilSample`           |
| 3     | `SoilTextureInput`    | Sand / silt / clay / OM / bulk density / gravel inputs.            | 1 ↔ 1 `SoilTest`             |
| 4     | `SoilChemistryInput`  | Lab/manual chemistry inputs (PRELIMINARY → ADVANCED).              | 1 ↔ 1 `SoilTest`             |
| 5     | `SoilPhysicsResult`   | Output of `@flaha/soil-physics`.                                   | 1 ↔ 1 `SoilTest`             |
| 6     | `SoilChemistryResult` | Output of `@flaha/soil-chemistry`.                                 | 1 ↔ 1 `SoilTest`             |
| 7     | `SoilInterpretation`  | Output of `@flaha/soil-interpretation`.                            | 1 ↔ 1 `SoilTest`             |
| 8     | `SoilReport`          | Generated artefact (PDF / HTML / JSON) for a test.                 | N → 1 `SoilTest`             |
| (sup) | `SoilLabValue`        | Per-field raw lab provenance (rawValue + unit + method).           | N → 1 `SoilTest`             |

Enums:

- `SoilTestLevel` — `PRELIMINARY` / `MODERATE` / `ADVANCED`
- `SoilValueSource` — `LAB` / `ESTIMATED` / `DEFAULT` / `CALCULATED`
- `SoilReportStatus` — `DRAFT` / `GENERATED` / `ARCHIVED`
- `SoilInterpretationRating` — `GOOD` / `FAIR` / `POOR`

Indexes (chosen for the most likely access patterns):

- `SoilSample`: `userId`, `projectId`, `sampleDate`
- `SoilTest`: `sampleId`, `testLevel`, `testDate`
- `SoilPhysicsResult`: `textureClass`
- `SoilChemistryResult`: `cec`, `esp`
- `SoilInterpretation`: `overallSoilRating`, `salinityRisk`, `sodiumRisk`
- `SoilReport`: `soilTestId`, `status`
- `SoilLabValue`: `soilTestId`, `fieldKey`

All FK relations cascade on delete from the `SoilTest` (and from
`SoilSample` to its tests), so removing a sample cleanly tears down its
entire derivation tree.

---

## 9. Readiness for Phase 4 — API Contracts

The v2 schema gives the API layer a stable shape to design against:

- request DTOs map cleanly onto `SoilTextureInput` + `SoilChemistryInput`;
- response DTOs map cleanly onto `SoilPhysicsResult` +
  `SoilChemistryResult` + `SoilInterpretation`;
- the `SoilTestLevel` enum is the single source of truth for which
  endpoints accept which fields;
- `SoilLabValue` lets the API accept multi-unit lab uploads without
  forcing a normalisation step on the client.

Phase 4 can begin without any further DB design work.
