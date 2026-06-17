/**
 * @flaha/soil-interpretation — FLAHA_DEFAULT method metadata.
 *
 * One {@link CalibrationMethod} per scientific method currently wired
 * into the FlahaSOIL v2 pipeline. This is a provenance audit, not a set
 * of executable thresholds — the live thresholds remain in `rules.ts`
 * (interpretation), `@flaha/soil-physics`, and `@flaha/soil-chemistry`.
 *
 * `peerReviewed: true`  → source is a recognised standard / publication.
 * `peerReviewed: false` → FlahaSOIL house convention pending citation.
 *
 * Threshold values are documented in `rules.ts`; do not duplicate them
 * here. Keep this list in lock-step with the engine implementations.
 */

import type { CalibrationMethod } from "./calibrationTypes";

export const FLAHA_DEFAULT_METHODS: CalibrationMethod[] = [
	// --- Calculation engines (formulas, peer-reviewed) ---------------------
	{
		key: "soil_water_physics",
		name: "Soil-water retention & conductivity (FC, WP, PAW, Ksat)",
		domain: "PHYSICS",
		source: "Saxton & Rawls (2006), Soil Sci. Soc. Am. J. 70:1569-1578",
		peerReviewed: true,
		notes:
			"Pure-function port in @flaha/soil-physics. Phase 10B added a Ksat domain guard (BUG-10B-01).",
	},
	{
		key: "soil_chemistry",
		name: "CEC, base saturation, cation %, ESP, SAR",
		domain: "CHEMISTRY",
		source: "Standard soil-chemistry equations (USDA NRCS / Sparks 2003)",
		peerReviewed: true,
		notes: "Calculation only in @flaha/soil-chemistry; no interpretation.",
	},

	// --- Interpretation thresholds (rules.ts) ------------------------------
	{
		key: "ph_classification",
		name: "pH category",
		domain: "CHEMISTRY",
		source: "FlahaSOIL Phase-2.3 house thresholds",
		peerReviewed: false,
		notes: "Project convention; not yet cited to a peer-reviewed source.",
	},
	{
		key: "salinity_risk",
		name: "Salinity risk (EC dS/m)",
		domain: "CHEMISTRY",
		source: "FlahaSOIL Phase-2.3 house thresholds",
		peerReviewed: false,
	},
	{
		key: "salinity_severity",
		name: "Salinity severity (ECe)",
		domain: "CHEMISTRY",
		source: "FAO-29 (Ayers & Westcot 1985)",
		peerReviewed: true,
	},
	{
		key: "sodicity_severity",
		name: "Sodicity severity (SAR / ESP)",
		domain: "CHEMISTRY",
		source: "FAO-29 (Ayers & Westcot 1985)",
		peerReviewed: true,
		notes: "ESP takes precedence over SAR when both are supplied.",
	},
	{
		key: "cec_level",
		name: "CEC level",
		domain: "CHEMISTRY",
		source: "FlahaSOIL Phase-2.3 house thresholds",
		peerReviewed: false,
	},
	{
		key: "base_saturation",
		name: "Base saturation category",
		domain: "CHEMISTRY",
		source: "FlahaSOIL Phase-2.3 house thresholds",
		peerReviewed: false,
	},
	{
		key: "sodium_risk_esp",
		name: "Sodium risk (ESP)",
		domain: "CHEMISTRY",
		source: "FlahaSOIL Phase-2.3 house thresholds",
		peerReviewed: false,
	},
	{
		key: "cation_balance",
		name: "Cation balance (Ca / Mg / K windows)",
		domain: "CHEMISTRY",
		source: "Base cation saturation ratio (BCSR) windows — project convention",
		peerReviewed: false,
	},
	{
		key: "water_holding",
		name: "Water-holding class (PAW %v/v)",
		domain: "PHYSICS",
		source: "Brady & Weil (14th ed.) Table 5.3; USDA NRCS Soil Survey Manual",
		peerReviewed: true,
		notes: "Phase 10A.7 corrected thresholds to volumetric % (10 / 15).",
	},
	{
		key: "organic_matter",
		name: "Organic-matter category (% mass)",
		domain: "CHEMISTRY",
		source: "FlahaSOIL house thresholds",
		peerReviewed: false,
	},
	{
		key: "drainage_from_ksat",
		name: "Drainage class (Ksat mm/h)",
		domain: "PHYSICS",
		source: "NRCS-aligned house thresholds",
		peerReviewed: false,
		notes: "Aligned to NRCS guidance but values are a project convention.",
	},
	{
		key: "infiltration",
		name: "Infiltration class (Ksat mm/h)",
		domain: "PHYSICS",
		source: "USDA-style house buckets",
		peerReviewed: false,
	},
	{
		key: "compaction_risk",
		name: "Compaction risk (bulk density by texture)",
		domain: "PHYSICS",
		source: "NRCS bulk-density guidance (house thresholds)",
		peerReviewed: false,
	},
	{
		key: "texture_suitability",
		name: "Texture suitability matrix (4 land uses)",
		domain: "PHYSICS",
		source: "FlahaSOIL house suitability matrix",
		peerReviewed: false,
		notes: "Downgraded by salinity / sodicity / drainage findings.",
	},
];
