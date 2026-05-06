<!-- @format -->

# FlahaSOIL v2 — Phase 7A Real Runtime Verification

> Companion to `docs/v2-e2e-wiring.md`. Captures the evidence collected
> while running the v2 stack against a real PostgreSQL database
> (`flahasoil_v2_dev`) on the fixed development ports.

---

## Fixed development ports (mandatory)

| Service        | Host                       | Status during verification |
| -------------- | -------------------------- | -------------------------- |
| Backend API    | `http://localhost:3002`    | listening                  |
| API base URL   | `http://localhost:3002/api/v2` | reachable              |
| Frontend (Vite)| `http://localhost:5173`    | listening                  |
| PostgreSQL     | `localhost:5432`           | PG 16 running              |

Vite was tightened to `strictPort: true` so it fails loudly instead of
silently picking a different port if 5173 is in use.

---

## Database

- Database: `flahasoil_v2_dev`
- Connection (password redacted):
  `postgresql://postgres:***@localhost:5432/flahasoil_v2_dev?schema=public`
- Variable used: **`DATABASE_URL_V2`** only. Legacy `DATABASE_URL` is
  unset for the v2 stack.

### Schema sync

Ran from the repository root:

```powershell
npm run prisma:generate:v2 --workspace @flaha/api
npm run prisma:db:push:v2  --workspace @flaha/api
```

`prisma db push` was used (not `migrate deploy`) so no production
migration history is created. Output confirmed
`Your database is now in sync with your Prisma schema.`

After push, `\dt public.*` returned the nine v2 tables:
`soil_chemistry_inputs`, `soil_chemistry_results`, `soil_interpretations`,
`soil_lab_values`, `soil_physics_results`, `soil_reports`, `soil_samples`,
`soil_tests`, `soil_texture_inputs`.

---

## Backend health check

```
GET http://localhost:3002/health
→ {"status":"ok","service":"flaha-soil-v2-api","env":"development"}
```

Backend launched via `npm run dev --workspace @flaha/api` which now uses
`tsx watch --env-file=.env src/server.ts`, so `PORT=3002` and
`DATABASE_URL_V2` are loaded from `backend/.env` at startup.

---

## Frontend real-API mode

Vite served `/src/services/apiClientProvider.ts` with the env block
inlined:

```
import.meta.env = {
  "VITE_API_BASE_URL": "http://localhost:3002/api/v2",
  "VITE_DEV_PORT":     "5173",
  "VITE_USE_MOCK_API": "false",
  "MODE": "development", "DEV": true, "PROD": false
}
```

Cross-origin sanity check from `Origin: http://localhost:5173` to
`http://localhost:3002/api/v2/.../flahacalc-export`:

- `OPTIONS` preflight → `204` with `Access-Control-Allow-Origin: *`.
- `GET` → `200` with `Content-Type: application/json` and the expected
  payload (see §Results).

---

## Real soil-test created (Doha Test Plot)

Sample (`POST /api/v2/soil-samples`) with the prescribed inputs
(`locationName: "Doha Test Plot"`, depths 0–30 cm) and a MODERATE soil
test (`POST /api/v2/soil-texts`) with the prescribed texture (40/40/20,
OM 2.5, BD 1.3) and chemistry (pH 7.4, EC 1.2, CEC 15, Ca 9, Mg 3,
K 0.6, Na 0.8, N 30, P 15) were created against the live API. The
calculation step ran physics, chemistry, and interpretation in `LAB`
mode.

| Resource    | id                              |
| ----------- | ------------------------------- |
| `SoilSample`| `cmot62t2c0000kdq6x24gxoj3`     |
| `SoilTest`  | `cmot62t4c0002kdq624lpfeo3`     |

---

## Database row verification

```
soil_samples           = 1
soil_tests             = 1
soil_texture_inputs    = 1
soil_chemistry_inputs  = 1
soil_physics_results   = 1
soil_chemistry_results = 1
soil_interpretations   = 1
soil_reports           = 0   (none requested)
```

Legacy SQLite (`api-implementation/prisma/dev.db`) timestamp unchanged
(last write 2025-06-04). v2 traffic did **not** touch the legacy
datasource.

---

## Results observed

Physics (`SoilPhysicsResult`):
`textureClass=Loam`, `fieldCapacity=25.3`, `wiltingPoint=12.2`,
`plantAvailableWater=13.1`, `saturation=50.9`,
`saturatedConductivity=42.3`, `bulkDensity=1.52`, `porosity=50.9`,
`drainageClass=Moderate`, `compactionRisk=Low`, `erosionRisk=Low`,
`calculationVersion=v2.0.0`.

Chemistry (`SoilChemistryResult`):
`cec=15`, `baseSaturation=89.33`, `caPercent=60`, `mgPercent=20`,
`kPercent=4`, `naPercent=5.33`, `esp=5.33`, `sar=0.327`,
`calculationMode=LAB`.

Interpretation (`SoilInterpretation`):
`phCategory=Neutral`, `salinityRisk=Low`, `cecLevel=Moderate`,
`baseSaturationCategory=High`, `cationBalance=Balanced`,
`sodiumRisk=Low`, `waterHoldingClass=Low`, `drainageClass=Moderate`,
`overallSoilRating=FAIR`, `warnings=[]`.

These fields populate the React physics/chemistry/interpretation cards
in `SoilTestDetailPage` via the real `apiV2Client` (mock disabled).

---

## FlahaCalc export verification

`GET /api/v2/soil-tests/cmot62t4c0002kdq624lpfeo3/flahacalc-export` →

```json
{
  "soilTestId": "cmot62t4c0002kdq624lpfeo3",
  "textureClass": "Loam",
  "fieldCapacity": 25.3, "wiltingPoint": 12.2,
  "plantAvailableWater": 13.1, "saturation": 50.9,
  "saturatedConductivity": 42.3,
  "cec": 15, "salinityRisk": "Low", "sodiumRisk": "Low",
  "warnings": []
}
```

All required contract fields present.

---

## Automated test results

| Command                                    | Result                                    |
| ------------------------------------------ | ----------------------------------------- |
| `typecheck @flaha/api`                     | ✅ pass                                   |
| `build @flaha/api`                         | ✅ pass                                   |
| `test @flaha/api`                          | ✅ 19 passed, 1 skipped (E2E gated)       |
| `typecheck @flaha/web`                     | ✅ pass                                   |
| `build @flaha/web`                         | ✅ pass (Vite, 950 modules, 437.85 kB)    |

The skipped test is `soilTest.e2e.test.ts`. By design it requires
`DATABASE_URL_V2` to **contain the substring `test`** before it will
run or clean a database. `flahasoil_v2_dev` deliberately does not match
that gate, so the integration test stays skipped — the same flow it
covers was instead exercised manually against the live dev DB and is
documented above. Safety rule was not weakened.

---

## Known limitations

- The frontend UI flow (browser pointing at `http://localhost:5173`)
  was verified by (a) confirming Vite serves the SPA on the fixed
  port, (b) confirming `VITE_USE_MOCK_API="false"` is inlined into the
  served bundle, and (c) confirming the same cross-origin GET the
  React pages use returns 200 with the expected payload. A click-by-click
  manual UI walk-through is not part of this automated report.
- `POST /api/v2/soil-tests/:id/reports` was not exercised — report
  generation is Phase 8 scope.
- DB push, not `migrate deploy`. Migration history will be introduced
  in Phase 8 production hardening.
