/**
 * FlahaSOIL v2 API — Recommendation rule registry (Phase 8D D.2).
 *
 * The single source of truth for all recommendation copy + trigger
 * logic. Adding a new rule means appending one entry to
 * `RECOMMENDATION_RULES` — no changes to callers.
 *
 * Rule code convention: `REC-<DOMAIN>-<NNN>`
 *   SAL — salinity            SOD — sodicity
 *   PH  — acidity / alkalinity OM — organic matter
 *   TEX — texture / structure  CEC — cation exchange / fertility
 *   DRN — drainage / infiltration COMP — compaction
 */

import type {
	RecommendationCategory,
	RecommendationHorizon,
	RecommendationSeverity,
	SoilReportEnvelope,
} from "@flaha/shared-types";

export interface RecommendationContext {
	envelope: SoilReportEnvelope;
	chemistryInput: Record<string, unknown>;
	textureInput: Record<string, unknown>;
	num(value: unknown): number | undefined;
	str(value: unknown): string | undefined;
}

export interface RuleMatch {
	/** Optional override of the rule's default `body` for dynamic text. */
	body?: string;
	context?: Record<string, unknown>;
}

export interface RecommendationRule {
	code: string;
	severity: RecommendationSeverity;
	horizon: RecommendationHorizon;
	category: RecommendationCategory;
	title: string;
	body: string;
	bullets?: string[];
	/** Returns `null` when the rule does not apply. */
	evaluate(ctx: RecommendationContext): RuleMatch | null;
}

export const RECOMMENDATION_RULES: RecommendationRule[] = [
	{
		code: "REC-SAL-001",
		severity: "ACTION",
		horizon: "SHORT",
		category: "IRRIGATION",
		title: "Leach salts with low-EC irrigation",
		body: "Soil salinity is high enough to limit most field and ornamental species. Plan a leaching irrigation with water below 1 dS/m, sufficient to displace the upper root zone.",
		bullets: [
			"Target a leaching fraction of 0.15–0.25 depending on species tolerance.",
			"Re-test EC 4 weeks after leaching to confirm reduction.",
		],
		evaluate(ctx) {
			const sev = ctx.envelope.interpretation?.salinitySeverity;
			if (sev === "Strong" || sev === "Severe") {
				const ec = ctx.num(ctx.chemistryInput["ecDsM"]);
				return { context: ec !== undefined ? { ecDsM: ec } : undefined };
			}
			return null;
		},
	},
	{
		code: "REC-SAL-002",
		severity: "WATCH",
		horizon: "MEDIUM",
		category: "AGRONOMY",
		title: "Favour salt-tolerant species",
		body: "Moderate salinity will reduce yield of sensitive crops. Select salt-tolerant cultivars (e.g. barley, paspalum, bermuda turf) where rotation allows.",
		evaluate(ctx) {
			return ctx.envelope.interpretation?.salinitySeverity === "Moderate"
				? {}
				: null;
		},
	},
	{
		code: "REC-SOD-001",
		severity: "ACTION",
		horizon: "SHORT",
		category: "AMENDMENT",
		title: "Apply gypsum to displace exchangeable sodium",
		body: "Sodicity is high enough to degrade soil structure and infiltration. Apply agricultural gypsum at the rate calculated from the gypsum requirement (ESP/SAR target ≤ 6 / 13).",
		bullets: [
			"Incorporate gypsum into the top 15 cm.",
			"Follow with a leaching irrigation to flush displaced Na.",
		],
		evaluate(ctx) {
			const sev = ctx.envelope.interpretation?.sodicitySeverity;
			return sev === "Strong" || sev === "Severe"
				? { context: { sar: ctx.envelope.chemistry?.sar ?? null, esp: ctx.envelope.chemistry?.esp ?? null } }
				: null;
		},
	},
	{
		code: "REC-PH-001",
		severity: "ACTION",
		horizon: "MEDIUM",
		category: "AMENDMENT",
		title: "Lime to raise soil pH",
		body: "Soil is strongly acidic. Apply agricultural lime to raise pH to 6.0–6.5, improving nutrient availability and microbial activity.",
		evaluate(ctx) {
			const cat = ctx.envelope.interpretation?.phCategory ?? "";
			return /strongly acid/i.test(cat) || /very acid/i.test(cat) ? {} : null;
		},
	},
	{
		code: "REC-PH-002",
		severity: "WATCH",
		horizon: "MEDIUM",
		category: "FERTILITY",
		title: "Manage micronutrient availability under alkalinity",
		body: "Alkaline soil reduces Fe, Mn, Zn, and B availability. Plan chelated micronutrient foliar applications and monitor leaf tissue.",
		evaluate(ctx) {
			const cat = ctx.envelope.interpretation?.phCategory ?? "";
			return /strongly alkaline|very alkaline/i.test(cat) ? {} : null;
		},
	},
	{
		code: "REC-OM-001",
		severity: "WATCH",
		horizon: "LONG",
		category: "AMENDMENT",
		title: "Build organic matter",
		body: "Organic matter is below the productive threshold for this soil. Incorporate well-decomposed compost (10–20 t/ha) or establish a cover-crop rotation.",
		evaluate(ctx) {
			const om = ctx.envelope.interpretation?.organicMatterCategory ?? "";
			return /very low|low/i.test(om) ? {} : null;
		},
	},
	{
		code: "REC-TEX-001",
		severity: "WATCH",
		horizon: "MEDIUM",
		category: "AGRONOMY",
		title: "Manage clay-rich soil aeration",
		body: "Heavy clay restricts aeration and slows infiltration. Use deep tillage on transition years and add organic amendments to improve structure.",
		evaluate(ctx) {
			const tex = ctx.envelope.physics?.textureClass ?? "";
			return /clay/i.test(tex) && !/loam/i.test(tex) ? {} : null;
		},
	},
	{
		code: "REC-TEX-002",
		severity: "INFO",
		horizon: "SHORT",
		category: "IRRIGATION",
		title: "Schedule frequent, lighter irrigations on sandy soils",
		body: "Sandy texture retains little water and leaches nutrients quickly. Move to higher-frequency, lower-volume irrigation events and split nitrogen applications.",
		evaluate(ctx) {
			const tex = ctx.envelope.physics?.textureClass ?? "";
			return /sand/i.test(tex) && !/loam|clay/i.test(tex) ? {} : null;
		},
	},
	{
		code: "REC-CEC-001",
		severity: "WATCH",
		horizon: "MEDIUM",
		category: "FERTILITY",
		title: "Split fertiliser on low-CEC soil",
		body: "Low cation exchange capacity limits nutrient retention. Split fertiliser applications across the season and prefer slow-release formulations.",
		evaluate(ctx) {
			const cec = ctx.envelope.interpretation?.cecLevel ?? "";
			return /very low|low/i.test(cec) ? {} : null;
		},
	},
	{
		code: "REC-DRN-001",
		severity: "ACTION",
		horizon: "LONG",
		category: "DRAINAGE",
		title: "Install or improve subsurface drainage",
		body: "Poor drainage will limit root depth and increase disease pressure. Investigate tile drainage, raised beds, or a French drain network depending on site scale.",
		evaluate(ctx) {
			const drn = ctx.envelope.interpretation?.drainageClass ?? "";
			return /very poor|poor/i.test(drn) ? {} : null;
		},
	},
	{
		code: "REC-COMP-001",
		severity: "WATCH",
		horizon: "MEDIUM",
		category: "AGRONOMY",
		title: "Address compaction risk",
		body: "Bulk density and texture indicate elevated compaction risk. Avoid heavy traffic on wet soil and consider subsoiling on compacted areas.",
		evaluate(ctx) {
			return ctx.envelope.interpretation?.compactionRisk === "High" ? {} : null;
		},
	},
	{
		code: "REC-MON-001",
		severity: "INFO",
		horizon: "MEDIUM",
		category: "MONITORING",
		title: "Re-test soil annually",
		body: "Establish an annual soil-testing cadence to track salinity, nutrient drawdown, and structural changes over time.",
		evaluate() {
			return {};
		},
	},
];
