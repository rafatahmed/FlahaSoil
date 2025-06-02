 <!-- @format -->

# **Kc Estimation: Scientific References and Methodology**

## **1. FAO and Methodology Guidelines**

- **FAO 56 Standard:**
  **Allen, R.G.; Pereira, L.S.; Raes, D.; Smith, M.** (1998). _Crop Evapotranspiration Guidelines for Computing Crop Water Requirements._ FAO, Rome, Italy.
  — _This is the global reference for ET₀ and Kc methodology and calculation standards, widely used in irrigation science._

- **Soil Water Balance and Kc Models:**
  **Pereira, L.; Paredes, P.; Jovanovic, N.** (2020). Soil water balance models for determining crop water and irrigation requirements and irrigation scheduling focusing on the FAO56 method and the dual Kc approach. _Agric. Water Manag._, 241, 106357.

---

## **2. Lysimeter/ET Measurement and Model Comparison**

- **Reference ET Model Comparison:**
  **Liu, X.; Xu, C.; Zhong, X.; Li, Y.; Yuan, X.; Cao, J.** (2017). Comparison of 16 models for reference crop evapotranspiration against weighing lysimeter measurement. _Agric. Water Manag._, 184, 145–155.

- **Lysimeter Data Application:**
  **Anapalli, S.S.; Ahuja, L.R.; Gowda, P.H.; Ma, L.; Marek, G.; Evett, S.R.; Howell, T.A.** (2016). Simulation of crop evapotranspiration and crop coefficients with data in weighing lysimeters. _Agric. Water Manag._, 177, 274–283.

---

## **3. Crop- and Region-Specific Studies (Wheat, Maize, Oat, etc.)**

- **Wheat and Maize in Semi-Arid Regions:**
  **Shahrokhnia, M.H.; Sepaskhah, A.R.** (2013). Single and dual crop coefficients and crop evapotranspiration for wheat and maize in a semi-arid region. _Theor. Appl. Climatol._, 114, 495–510.

- **Wheat Yield Forecasting (Pakistan):**
  **Abid, S.** (2019). Forecasting wheat production using time series models in Pakistan. _Asian J. Agric. Rural. Dev._, 8, 172–177.

- **Wheat CWR in Egypt:**
  **Mahmoud, M.; El-Bably, A.** (2017). Crop water requirements and irrigation efficiencies in Egypt. In _Conventional Water Resources and Agriculture in Egypt_; Springer: Cham, Switzerland; pp. 471–487.

- **Maize CWR (Pakistan & Asia):**
  **Abideen, Z.U.** (2014). Comparison of Crop Water Requirements of Maize Varieties Under Irrigated Condition in Semi-Arid Environment. _J. Environ. Earth Sci._, 4, 2224–2226.

- **Maize/Oat/Grain Systems (China):**
  **Sun, H.; Zhang, X.; Liu, X.; Liu, X.; Shao, L.; Chen, S.; Wang, J.; Dong, X.** (2019). Impact of different cropping systems and irrigation schedules on evapotranspiration, grain yield and groundwater level in the North China Plain. _Agric. Water Manag._, 211, 202–209.

- **Water Management (Textbook):**
  **Ali, M.H.** (2010). _Fundamentals of Irrigation and On-Farm Water Management_; Springer: Heidelberg, Germany; Volume 1, pp. 453–487.

---

## **4. Irrigation Efficiency, Scheduling, and Practice Reviews**

- **Irrigation Scheduling/Cabbage:**
  **Beshir, S.** (2017). Review on estimation of crop water requirement, irrigation frequency and water use efficiency of cabbage production. _J. Geosci. Environ. Prot._, 5, 59.

- **Cropping System Scheduling, Earth Observation:**
  **D’Urso, G.; Calera Belmonte, A.** (2006). Operative approaches to determine crop water requirements from Earth Observation data: Methodologies and applications. _AIP Conf. Proc._, 14, 852.

---

## **5. Miscellaneous and Novel Practices**

- **Biodegradable Mulch for Kc Reduction:**
  **da Silva, G.H.** (2020). Biodegradable mulch of recycled paper reduces water consumption and crop coefficient of pak choi. _Sci. Hortic._, 267, 109315.

- **Regional ETc for Crops (India):**
  **Mehta, R.; Pandey, V.** (2016). Crop water requirement (ETc) of different crops of middle Gujarat. _J. Agrometeorol._, 18, 83–87.

---

## **Equations and Parameters**

Each equation as applied in the article, in calculation order:

### **1. Depth of Water Required for Irrigation**

$$
d = \frac{(FC - MC)}{100} \times RZ
$$

- **d:** depth of water required for irrigation (mm)
- **FC:** field capacity (%)
- **MC:** current soil moisture content (%)
- **RZ:** root zone depth of the crop (mm)

---

### **2. Adjusted Depth with Irrigation Efficiency**

$$
D = \frac{d}{E}
$$

- **D:** actual depth required (mm)
- **d:** depth from above (mm)
- **E:** application efficiency (assumed 0.7 or 70% in the study)

---

### **3. Time Required for Irrigation**

$$
T = \frac{A \times d}{Q}
$$

- **T:** time required for irrigation (hours or minutes)
- **A:** area of lysimeter (m²)
- **d:** depth required (mm, converted to m if needed)
- **Q:** discharge of pump (m³/h or L/h)

---

### **4. Crop Water Requirement (CWR)**

$$
CWR = TAW + Re
$$

- **CWR:** crop water requirement (mm)
- **TAW:** total applied water (mm)
- **Re:** effective rainfall (mm)

---

### **5. Effective Rainfall (FAO Formulas)**

- If **P > 75 mm**:

  $$
  Pe = 0.8P - 25
  $$

- If **P < 75 mm**:

  $$
  Pe = 0.6P - 10
  $$

- **Pe:** effective rainfall (mm)
- **P:** total precipitation (mm)

---

### **6. Crop Evapotranspiration (ETc)**

$$
ETc = ETo \times Kc
$$

- **ETc:** crop evapotranspiration (mm)
- **ETo:** reference evapotranspiration (mm)
- **Kc:** crop coefficient

---

### **7. Crop Coefficient (Kc) Calculation**

$$
Kc = \frac{ETc}{ETo}
$$

---

## **Algorithm: Stepwise Workflow**

Here’s a **logical algorithm** for the process as implemented in the article:

---

### **Algorithm for Estimating CWR and Kc Using Lysimeter Data**

**Inputs Required:**

- Field capacity (FC), soil moisture (MC), root zone depth (RZ)
- Lysimeter area (A)
- Pump discharge (Q)
- Irrigation application efficiency (E)
- Daily or monthly precipitation (P)
- Effective rainfall formula parameters (from FAO)
- ETo (from weather station/met data)
- Growth period of crop

---

### **Step 1: Irrigation Depth Calculation**

For each irrigation event:

- Calculate depth of water required:
  `d = ((FC - MC)/100) * RZ`
- Adjust for irrigation efficiency:
  `D = d / E`

---

### **Step 2: Irrigation Timing**

- For each irrigation:
  `T = (A * d) / Q`
- Schedule irrigation when soil moisture drops to threshold (e.g., 15%).

---

### **Step 3: Effective Rainfall Calculation (Monthly)**

- For each month:

  - If `P > 75 mm`: `Pe = 0.8P - 25`
  - Else: `Pe = 0.6P - 10`

---

### **Step 4: Crop Water Requirement (CWR)**

- Sum all irrigation water applied during crop growth:
  `TAW = sum(D for all irrigations)`
- Sum all effective rainfall over season:
  `Re = sum(Pe over season)`
- Calculate total crop water requirement:
  `CWR = TAW + Re`

---

### **Step 5: Crop Evapotranspiration (ETc)**

- For each stage or overall:
  `ETc = CWR`
  (or use lysimeter ET data if available)

---

### **Step 6: Crop Coefficient (Kc) Calculation**

- For each period (e.g., growth stage, month):

  - Obtain `ETo` from met data
  - Calculate:
    `Kc = ETc / ETo`

---

### **Step 7: Reporting**

- Tabulate/plot CWR and Kc over crop growth period for each crop.
- Compare Kc values to FAO recommended ranges for validation.

---

### **Pseudocode Representation**

```python
for crop in crops:
    for irrigation_event in crop.irrigation_events:
        d = ((FC - MC) / 100) * RZ
        D = d / E
        T = (A * d) / Q
        record_applied_water(D)

    for month in crop.growth_period_months:
        if P[month] > 75:
            Pe = 0.8 * P[month] - 25
        else:
            Pe = 0.6 * P[month] - 10
        record_effective_rainfall(Pe)

    TAW = sum(applied_water for crop_season)
    Re = sum(effective_rainfall for crop_season)
    CWR = TAW + Re

    for period in crop.periods:
        ETo = get_ETo(period)
        ETc = calculate_ETc(period)  # or ETc = CWR if season total
        Kc = ETc / ETo
        record_Kc(Kc)
```

---

**This algorithm follows the exact process and sequence used in the study, and can be directly adapted into code or a calculation worksheet. If you need code for a specific platform (Python, Excel, etc.), just ask!**
