# FlahaSOIL — Legacy Calculation Samples (Phase 0 Freeze)

These samples were produced by running the existing
`SoilCalculationService.calculateWaterCharacteristics()` engine in
`api-implementation/src/services/soilCalculationService.js` with no
modifications. Each sample was executed for `userPlan` ∈ {`FREE`,
`PROFESSIONAL`, `ENTERPRISE`}; only the fields that change between tiers are
called out separately.

Units
* `fieldCapacity`, `wiltingPoint`, `plantAvailableWater`, `saturation`,
  `porosity` — percent (% by volume).
* `saturatedConductivity`, `unsaturatedConductivity` — mm/h.
* `airEntryTension`, `osmoticPotential`, `osmoticPotentialFC` — kPa.
* `bulkDensity`, `inputBulkDensity` — g/cm³.
* `electricalConductivity` — dS/m.
* `soilQualityIndex` — 0–10 dimensionless.

> Common Professional+ additions for every sample (identical numerically
> across samples): `confidenceIntervals = {wiltingPoint: 0.02, fieldCapacity:
> 0.05, saturation: 0.04, airEntryTension: 2.9, saturatedConductivity: 0.3}`,
> `rSquaredValues = {wiltingPoint: 0.86, fieldCapacity: 0.63, saturation:
> 0.29, airEntryTension: 0.78, saturatedConductivity: 0.45}`,
> `unsaturatedConductivity = "0.0"`.

---

## Sample 1 — Sandy Soil

Inputs: `sand=85, silt=10, clay=5, organicMatter=1.0, densityFactor=1.50,
electricalConductivity=0.5, gravelContent=0`.

| Field | FREE | PROFESSIONAL | ENTERPRISE |
|---|---|---|---|
| textureClass | `Sand` | `Sand` | `Sand` |
| fieldCapacity (%) | 7.4 | 7.4 | 7.4 |
| wiltingPoint (%) | 2.3 | 2.3 | 2.3 |
| plantAvailableWater (%) | 5.0 | 5.0 | 5.0 |
| saturation (%) | 43.4 | 43.4 | 43.4 |
| saturatedConductivity (mm/h) | 122.9 | 122.9 | 122.9 |
| bulkDensity (g/cm³) | 1.679 | 1.68 | 1.68 |
| porosity (%) | 43.4 | 43.4 | 43.4 |
| voidRatio | 0.767 | 0.767 | 0.767 |
| soilQualityIndex | 6.0 | 6.0 | 6.0 |
| drainageClass | Excellent | Excellent | Excellent |
| compactionRisk | Low | Low | Low |
| erosionRisk | High | High | High |
| airEntryTension (kPa) | – | 7.8 | 7.8 |
| lambda | – | 0.30 | 0.30 |
| osmoticPotential / FC (kPa) | – | – | -0.2 / -0.4 |
| parameterA / parameterB | – | – | 332.935 / 3.307 |
| relativeK / conductivityExponent | – | – | 0.000 / 9.61 |

## Sample 2 — Loam Soil

Inputs: `sand=40, silt=40, clay=20, organicMatter=2.5, densityFactor=1.30,
electricalConductivity=0.8, gravelContent=0`.

| Field | FREE | PROFESSIONAL | ENTERPRISE |
|---|---|---|---|
| textureClass | `Loam` | `Loam` | `Loam` |
| fieldCapacity (%) | 25.3 | 25.3 | 25.3 |
| wiltingPoint (%) | 12.2 | 12.2 | 12.2 |
| plantAvailableWater (%) | 13.1 | 13.1 | 13.1 |
| saturation (%) | 50.9 | 50.9 | 50.9 |
| saturatedConductivity (mm/h) | 42.3 | 42.3 | 42.3 |
| bulkDensity (g/cm³) | 1.517 | 1.52 | 1.52 |
| porosity (%) | 50.9 | 50.9 | 50.9 |
| voidRatio | 1.038 | 1.038 | 1.038 |
| soilQualityIndex | 8.0 | 8.0 | 8.0 |
| drainageClass | Moderate | Moderate | Moderate |
| compactionRisk | Low | Low | Low |
| erosionRisk | Low | Low | Low |
| airEntryTension (kPa) | – | 9.6 | 9.6 |
| lambda | – | 0.19 | 0.19 |
| osmoticPotential / FC (kPa) | – | – | -0.3 / -0.6 |
| parameterA / parameterB | – | – | 213.884 / 5.226 |
| relativeK / conductivityExponent | – | – | 0.000 / 13.45 |

## Sample 3 — Clay Soil

Inputs: `sand=20, silt=30, clay=50, organicMatter=2.0, densityFactor=1.25,
electricalConductivity=1.2, gravelContent=0`.

| Field | FREE | PROFESSIONAL | ENTERPRISE |
|---|---|---|---|
| textureClass | `Clay` | `Clay` | `Clay` |
| fieldCapacity (%) | 42.7 | 42.7 | 42.7 |
| wiltingPoint (%) | 29.5 | 29.5 | 29.5 |
| plantAvailableWater (%) | 13.1 | 13.1 | 13.1 |
| saturation (%) | 52.8 | 52.8 | 52.8 |
| saturatedConductivity (mm/h) | 2.5 | 2.5 | 2.5 |
| bulkDensity (g/cm³) | 1.305 | 1.31 | 1.31 |
| porosity (%) | 52.8 | 52.8 | 52.8 |
| voidRatio | 1.120 | 1.120 | 1.120 |
| soilQualityIndex | 6.0 | 6.0 | 6.0 |
| drainageClass | Poor | Poor | Poor |
| compactionRisk | Low | Low | Low |
| erosionRisk | Low | Low | Low |
| airEntryTension (kPa) | – | 1.8 | 1.8 |
| lambda | – | 0.10 | 0.10 |
| osmoticPotential / FC (kPa) | – | – | -0.4 / -0.9 |
| parameterA / parameterB | – | – | 133.963 / 10.000 |
| relativeK / conductivityExponent | – | – | 0.007 / 23.00 |

## Sample 4 — High Organic Matter Soil

Inputs: `sand=35, silt=35, clay=30, organicMatter=6.0, densityFactor=1.10,
electricalConductivity=0.6, gravelContent=0`.

| Field | FREE | PROFESSIONAL | ENTERPRISE |
|---|---|---|---|
| textureClass | `Clay Loam` | `Clay Loam` | `Clay Loam` |
| fieldCapacity (%) | 31.3 | 31.3 | 31.3 |
| wiltingPoint (%) | 18.1 | 18.1 | 18.1 |
| plantAvailableWater (%) | 13.2 | 13.2 | 13.2 |
| saturation (%) | 58.5 | 58.5 | 58.5 |
| saturatedConductivity (mm/h) | 46.8 | 46.8 | 46.8 |
| bulkDensity (g/cm³) | 1.455 | 1.45 | 1.45 |
| porosity (%) | 58.5 | 58.5 | 58.5 |
| voidRatio | 1.409 | 1.409 | 1.409 |
| soilQualityIndex | 8.0 | 8.0 | 8.0 |
| drainageClass | Moderate | Moderate | Moderate |
| compactionRisk | Low | Low | Low |
| erosionRisk | Low | Low | Low |
| airEntryTension (kPa) | – | 6.5 | 6.5 |
| lambda | – | 0.14 | 0.14 |
| osmoticPotential / FC (kPa) | – | – | -0.2 / -0.4 |
| parameterA / parameterB | – | – | 251.833 / 6.951 |
| relativeK / conductivityExponent | – | – | 0.000 / 16.90 |

## Sample 5 — Saline Soil

Inputs: `sand=45, silt=30, clay=25, organicMatter=2.0, densityFactor=1.30,
electricalConductivity=6.0, gravelContent=0`.

| Field | FREE | PROFESSIONAL | ENTERPRISE |
|---|---|---|---|
| textureClass | `Loam` | `Loam` | `Loam` |
| fieldCapacity (%) | 26.9 | 26.9 | 26.9 |
| wiltingPoint (%) | 15.1 | 15.1 | 15.1 |
| plantAvailableWater (%) | 11.8 | 11.8 | 11.8 |
| saturation (%) | 50.9 | 50.9 | 50.9 |
| saturatedConductivity (mm/h) | 33.4 | 33.4 | 33.4 |
| bulkDensity (g/cm³) | 1.507 | 1.51 | 1.51 |
| porosity (%) | 50.9 | 50.9 | 50.9 |
| voidRatio | 1.038 | 1.038 | 1.038 |
| soilQualityIndex | 8.0 | 8.0 | 8.0 |
| drainageClass | Moderate | Moderate | Moderate |
| compactionRisk | Low | Low | Low |
| erosionRisk | Low | Low | Low |
| airEntryTension (kPa) | – | 7.5 | 7.5 |
| lambda | – | 0.15 | 0.15 |
| osmoticPotential / FC (kPa) | – | – | -2.2 / -4.3 |
| parameterA / parameterB | – | – | 244.859 / 6.597 |
| relativeK / conductivityExponent | – | – | 0.000 / 16.19 |

---

## Notes / observations from execution

* For all five samples the FREE-tier numeric outputs are produced regardless of
  EC (salinity equations only fire on `userPlan === "ENTERPRISE"` and
  `EC > 0`, per `soilCalculationService.js` lines 79–81). EC is therefore
  visible in the result payload as an echo only, not as a moisture-curve
  modifier.
* `bulkDensity` is rendered with **3 decimals** for FREE
  (`densityResults.rhoN.toFixed(3)`) and **2 decimals** for Professional+
  (`densityResults.rhoN.toFixed(2)`). The numeric value is identical (the
  calculated ρN from Eq. 6); only the formatting differs.
* `unsaturatedConductivity` returns the string `"0.0"` for every sample at the
  default tension. This is the value the engine emits today; verifying whether
  this represents a real K(ψ) = 0 or a formatter rounding artifact is
  out-of-scope for Phase 0.
* `relativeK = "0.000"` and `conductivityExponent` between 9.6 and 23.0 are
  the raw Enterprise outputs from `calculateMoistureConductivity`.
* No salinity outputs are emitted for FREE / PROFESSIONAL tiers, matching the
  gating logic.
* No CEC, base-saturation, Ca/Mg/K/Na, ESP or SAR fields appear in any sample —
  the engine has no code path producing them.
