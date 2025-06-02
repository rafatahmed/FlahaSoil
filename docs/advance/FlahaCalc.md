<!-- @format -->

# **FlahaCalc**

FlahaCalc already generates high-quality, FAO-56–compliant ET₀ calculations, with all the key meteorological, astronomical, and radiation parameters documented in the output. This makes integrating FlahaSoil + FlahaCalc into a **combined Decision Support System** even more powerful, as you can deliver “closed loop” recommendations:

- **Soil Water Holding** (from FlahaSoil)
- **Crop and System Parameters** (user input, library)
- **Reference ET₀** (from FlahaCalc, Penman-Monteith, multi-option support)
- **Final: Daily/Seasonal Water Requirement, System Design, and Schedule**

---

## **How to Integrate FlahaSoil + FlahaCalc in the DSS**

### **1. Data Flow Overview**

#### **A. User Inputs / Sources**

- Soil analysis report (FlahaSoil)
- ET₀ calculation (FlahaCalc) — user can import PDF, paste value, or use API call
- Crop type, growth stage, and area

#### **B. Core Calculation Sequence**

1. **Soil Module:**

   - Extracts Plant Available Water (PAW), infiltration rate, Ksat, bulk density.

2. **ET₀ Module:**

   - Supplies daily/seasonal reference evapotranspiration.

3. **Crop Module:**

   - Looks up or lets user input crop coefficient (Kc), rooting depth.

4. **Irrigation Schedule Engine:**

   - Computes crop evapotranspiration:
     **ETc = ET₀ × Kc**
   - Calculates irrigation volume per event:
     **Irrigation Depth = (Depletion fraction × PAW × Root depth) / Application efficiency**
   - Schedules frequency and checks not to exceed infiltration rate.

#### **C. Outputs**

- Water requirement per day/season
- Custom irrigation schedule (event frequency and amount)
- Maximum system application rate
- “Warnings” if application rate exceeds infiltration, or if water storage is at risk

---

## **Example DSS Dashboard Data Flow**

1. **Upload Soil Report** (auto-populates texture, PAW, Ksat)
2. **Select or Upload ET₀ Report** (or link FlahaCalc value directly)
3. **Choose Crop / Enter Kc** (from database or user-defined)
4. **System Output Block:**

   - Daily ETc, irrigation depth, optimal interval, max irrigation rate (system design), warnings
   - Downloadable PDF report

---

## **Sample DSS Output Block**

| Parameter                       | Value                | Source       |
| ------------------------------- | -------------------- | ------------ |
| Soil Type                       | Clay                 | FlahaSoil    |
| PAW (mm/m)                      | 170                  | FlahaSoil    |
| Infiltration Rate (mm/hr)       | 1.2                  | FlahaSoil    |
| Reference ET₀ (mm/day)          | 25.0                 | FlahaCalc    |
| Crop                            | Tomato               | User/Crop DB |
| Kc (mid-season)                 | 1.15                 | User/Crop DB |
| ETc (mm/day)                    | 28.8                 | Calc         |
| Max Irrigation Depth per Event  | 20                   | Calc         |
| Min. Interval (days)            | 0.7                  | Calc         |
| System Application Rate Allowed | ≤1.2 mm/hr           | Check        |
| Schedule Notes                  | Use split/cycle-soak | DSS engine   |

---

## **Backend/API Integration Suggestion**

- Build a REST or GraphQL endpoint to pull the latest ET₀ from FlahaCalc directly into FlahaSoil’s DSS (or vice versa).
- Use a common JSON data structure for passing reports between apps.
  https://evapotran.flaha.org/calculator.html

---
