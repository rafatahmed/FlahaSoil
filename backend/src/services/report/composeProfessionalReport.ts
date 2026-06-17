/**
 * FlahaSOIL v2 API — ProfessionalReportDTO composer (Phase 8D B.1 + B.2).
 *
 * Pure (no I/O) assembly of the `ProfessionalReportDTO` snapshot from
 * the rows already loaded by the report generator. The composer never
 * re-invokes the scientific engines — it only re-shapes already
 * persisted values into the immutable presentation contract.
 *
 * Inputs:
 *   - `envelope`   — the `SoilReportEnvelope` produced by report.service.
 *   - `sampleRow`  — raw `SoilSample` Prisma row (for cover location).
 *   - `projectRow` — raw `Project` Prisma row (for cover project info).
 *   - `userRow`    — owning `User` row (consultant on cover).
 *   - `chemistryInputRow` / `textureInputRow` — raw lab inputs, used for
 *     nutrients that are not exposed on `SoilChemistryResultDTO`.
 *   - `meta`       — generator-provided cover overrides + numbering.
 *
 * Output: `ProfessionalReportDTO` with `schemaVersion: "1.0"`.
 */
import {
	computeScientificCoverage,
	SoilTestLevel,
	type BulkDensityTrace,
	type CecSource,
	type CompletenessSection,
	type ProfessionalReportDTO,
	type RecommendationSetDTO,
	type SoilReportEnvelope,
} from "@flaha/shared-types";
import { STRUCTURE_TRIANGLE_DISCLAIMER } from "@flaha/soil-chemistry";

import { runRecommendations } from "./recommendations";

export interface ComposeReportArgs {
	envelope: SoilReportEnvelope;
	sampleRow: Record<string, unknown>;
	projectRow: Record<string, unknown> | null;
	userRow: Record<string, unknown> | null;
	chemistryInputRow: Record<string, unknown> | null;
	textureInputRow: Record<string, unknown> | null;
	meta: {
		reportNumber: string;
		reportTitle: string;
		reportDate: string;
		coverOverrides?: {
			clientName?: string;
			consultantName?: string;
			consultantRole?: string;
		};
	};
}

export function composeProfessionalReport(
	args: ComposeReportArgs
): ProfessionalReportDTO {
	const { envelope, sampleRow, projectRow, userRow, meta } = args;

	const cover = buildCover(args);
	const texture = buildTexture(envelope, args.textureInputRow);
	const physics = buildPhysics(envelope);
	const chemistry = buildChemistry(envelope, args.chemistryInputRow);
	const salinity = buildSalinity(envelope, args.chemistryInputRow);
	const sodicity = buildSodicity(envelope);
	const irrigation = buildIrrigation(envelope);
	const agronomic = buildAgronomic(envelope);
	const recommendations: RecommendationSetDTO = runRecommendations({
		envelope,
		chemistryInput: args.chemistryInputRow,
		textureInput: args.textureInputRow,
	});
	const notes = buildNotes(envelope);
	const appendix = buildAppendix(envelope, args);
	const executiveSummary = buildExecutiveSummary(
		envelope,
		recommendations,
		texture
	);
	const completeness = buildCompleteness(args);

	return {
		schemaVersion: "1.0",
		cover,
		executiveSummary,
		texture,
		physics,
		chemistry,
		salinity,
		sodicity,
		irrigation,
		agronomic,
		recommendations,
		notes,
		appendix,
		completeness,
		source: envelope,
	};

	function buildCover(a: ComposeReportArgs): ProfessionalReportDTO["cover"] {
		void a; // closure parameter for readability
		const projectName =
			(projectRow?.["name"] as string | undefined) ?? "(Unassigned project)";
		const projectCode = (projectRow?.["code"] as string | null | undefined) ?? null;
		const location = (sampleRow["locationName"] as string | null | undefined) ?? null;
		const lat = sampleRow["latitude"] as number | null | undefined;
		const lon = sampleRow["longitude"] as number | null | undefined;
		const consultant =
			meta.coverOverrides?.consultantName ??
			(userRow?.["displayName"] as string | undefined) ??
			null;
		const consultantRole =
			meta.coverOverrides?.consultantRole ??
			(userRow?.["role"] as string | undefined) ??
			null;
		const clientName =
			meta.coverOverrides?.clientName ??
			(projectRow?.["clientName"] as string | undefined) ??
			null;
		return {
			projectName,
			projectCode,
			clientName,
			consultantName: consultant,
			consultantRole,
			location,
			latitude: typeof lat === "number" ? lat : null,
			longitude: typeof lon === "number" ? lon : null,
			sampleId: envelope.sample.id,
			sampleCode: (sampleRow["sampleCode"] as string | null | undefined) ?? null,
			reportNumber: meta.reportNumber,
			reportTitle: meta.reportTitle,
			reportDate: meta.reportDate,
			testLevel: envelope.metadata.testLevel,
		};
	}
}

// ---------------------------------------------------------------------------
// Section builders (pure, file-private)
// ---------------------------------------------------------------------------

function num(value: unknown): number | null {
	if (typeof value === "number" && Number.isFinite(value)) return value;
	if (typeof value === "string") {
		const n = parseFloat(value);
		return Number.isFinite(n) ? n : null;
	}
	return null;
}

function buildTexture(
	env: SoilReportEnvelope,
	textureRow: Record<string, unknown> | null
): ProfessionalReportDTO["texture"] {
	return {
		usdaClass: env.physics?.textureClass ?? null,
		sandPercent: textureRow ? num(textureRow["sandPercent"]) : null,
		siltPercent: textureRow ? num(textureRow["siltPercent"]) : null,
		clayPercent: textureRow ? num(textureRow["clayPercent"]) : null,
		organicMatterPercent: textureRow
			? num(textureRow["organicMatterPercent"])
			: null,
	};
}

function buildPhysics(env: SoilReportEnvelope): ProfessionalReportDTO["physics"] {
	const p = env.physics;
	const bulkDensityTrace = extractBulkDensityTrace(p);
	return {
		fieldCapacity: p?.fieldCapacity ?? null,
		wiltingPoint: p?.wiltingPoint ?? null,
		plantAvailableWater: p?.plantAvailableWater ?? null,
		bulkDensity: p?.bulkDensity ?? null,
		porosity: p?.porosity ?? null,
		saturation: p?.saturation ?? null,
		saturatedConductivity: p?.saturatedConductivity ?? null,
		// Phase 10A.7 (B2) — water-content fields are persisted as % v/v
		// (the engine multiplies θ by 100 in `formatResultsByPlan`). The
		// renderer now labels them honestly instead of the previous
		// "cm³/cm³" mis-label which was off by a factor of 100.
		units: {
			moisture: "% v/v",
			bulkDensity: "g/cm³",
			conductivity: "mm/h",
			porosity: "% v/v",
			saturation: "% v/v",
		},
		bulkDensityTrace,
	};
}

/**
 * Phase 10A.7 (B3) — extract the predicted / used / source trio from
 * the persisted `calculationTraceJson`. When trace is missing (older
 * snapshots or `includeTrace=false`) we fall back to echoing the stored
 * scalar `bulkDensity` as both predicted and used with source UNKNOWN
 * so the renderer never reports a fictional provenance.
 */
function extractBulkDensityTrace(
	p: SoilReportEnvelope["physics"]
): BulkDensityTrace {
	const stored = p?.bulkDensity ?? null;
	const trace = (p?.calculationTraceJson as Record<string, unknown> | null) ?? null;
	if (!trace) {
		return { predicted: stored, used: stored, source: "UNKNOWN", unit: "g/cm³" };
	}
	const predicted = num(trace["predictedBulkDensity"]) ?? stored;
	const used = num(trace["bulkDensityUsed"]) ?? stored;
	const rawSource = trace["bulkDensitySource"];
	const source: BulkDensityTrace["source"] =
		rawSource === "USER_INPUT" || rawSource === "DEFAULT"
			? rawSource
			: "UNKNOWN";
	return { predicted, used, source, unit: "g/cm³" };
}

function buildChemistry(
	env: SoilReportEnvelope,
	chemInput: Record<string, unknown> | null
): ProfessionalReportDTO["chemistry"] {
	const c = env.chemistry;
	const ph = chemInput ? num(chemInput["pH"]) : null;
	const ec = chemInput ? num(chemInput["ecDsM"]) : null;
	const om = chemInput ? num(chemInput["organicMatter"]) : null;
	// Phase 10A.7 (B4) — Ca/Mg/K/Na in the chemistry input row are
	// EXCHANGEABLE cations stored in cmol(+)/kg (see
	// `packages/soil-chemistry/src/types.ts`). The fertility
	// "secondary nutrients" column carries only S (mg/kg); Ca and Mg
	// must NEVER appear under the mg/kg block since the magnitudes
	// would mis-lead by ≈ a factor of 100.
	const ca = chemInput ? num(chemInput["ca"]) : null;
	const mg = chemInput ? num(chemInput["mg"]) : null;
	const k = chemInput ? num(chemInput["k"]) : null;
	const na = chemInput ? num(chemInput["na"]) : null;
	// Phase 10A.7 R2 (B6) — macronutrient K (mg/kg, plant-available)
	// must NOT be mirrored from the exchangeable K column. The
	// chemistry input row stores `k` as exchangeable K in cmol(+)/kg
	// (see `packages/soil-chemistry/src/types.ts`); promoting it into
	// the mg/kg macronutrient cell drops the unit and mis-leads by a
	// factor of ~390 (cmol(+)/kg × 391 → mg/kg of K). A dedicated
	// `kMgKg` field on the chemistry input row would unlock this cell;
	// until then the report renders it as missing.
	const kMgKg = chemInput ? num(chemInput["kMgKg"]) : null;
	// Phase 10A.7 (WS5 — R3) — include the Bear/Albrecht (BCSR) disclaimer
	// whenever at least the three primary exchangeable cations are supplied
	// so the report PDF always shows the Kopittke & Menzies caveat alongside
	// the cation data.
	const hasExchangeable = ca !== null || mg !== null || k !== null;
	return {
		pH: ph,
		ece: ec,
		organicMatter: om,
		cec: c?.cec ?? null,
		cecSource: deriveCecSource(c, chemInput),
		macroNutrients: {
			n: chemInput ? num(chemInput["n"]) : null,
			p: chemInput ? num(chemInput["p"]) : null,
			k: kMgKg,
		},
		secondaryNutrients: {
			ca: null,
			mg: null,
			s: chemInput ? num(chemInput["s"]) : null,
		},
		exchangeableCations: { ca, mg, k, na, unit: "cmol(+)/kg" },
		micronutrients: {
			fe: chemInput ? num(chemInput["fe"]) : null,
			mn: chemInput ? num(chemInput["mn"]) : null,
			zn: chemInput ? num(chemInput["zn"]) : null,
			cu: chemInput ? num(chemInput["cu"]) : null,
			b: chemInput ? num(chemInput["b"]) : null,
		},
		calculationMode: c?.calculationMode === "LAB"
			? "LAB"
			: c?.calculationMode === "ESTIMATED"
			? "ESTIMATED"
			: null,
		...(hasExchangeable ? { structureDisclaimer: STRUCTURE_TRIANGLE_DISCLAIMER } : {}),
	};
}

/**
 * Phase 10A.7 (B5) — CEC provenance derivation. We do NOT silently
 * promote a derived cation-sum CEC to a "lab CEC"; the report renders
 * an explicit "Provisional" badge whenever the value did not come from
 * a lab measurement.
 */
function deriveCecSource(
	chem: SoilReportEnvelope["chemistry"],
	chemInput: Record<string, unknown> | null
): CecSource {
	if (!chem) return "MISSING";
	if (chem.calculationMode === "ESTIMATED") return "ESTIMATED";
	const labCec = chemInput ? num(chemInput["cec"]) : null;
	return labCec !== null ? "LAB" : "DERIVED_CATION_SUM";
}

function buildSalinity(
	env: SoilReportEnvelope,
	chemInput: Record<string, unknown> | null
): ProfessionalReportDTO["salinity"] {
	const severity = (env.interpretation?.salinitySeverity ?? "None") as
		ProfessionalReportDTO["salinity"]["severity"];
	const riskLabel = env.interpretation?.salinityRisk ?? "Not assessed";
	const ec = chemInput ? num(chemInput["ecDsM"]) : null;
	const rec =
		severity === "Severe" || severity === "Strong"
			? "Leach with low-EC water; switch to salt-tolerant species."
			: severity === "Moderate"
			? "Monitor EC quarterly; favour salt-tolerant cultivars."
			: "No salinity action required at this stage.";
	return { severity, riskLabel, recommendation: rec, ece: ec };
}

function buildSodicity(
	env: SoilReportEnvelope
): ProfessionalReportDTO["sodicity"] {
	const severity = (env.interpretation?.sodicitySeverity ?? "None") as
		ProfessionalReportDTO["sodicity"]["severity"];
	const riskLabel = env.interpretation?.sodiumRisk ?? "Not assessed";
	const sar = env.chemistry?.sar ?? null;
	const esp = env.chemistry?.esp ?? null;
	const rec =
		severity === "Severe" || severity === "Strong"
			? "Apply gypsum at agronomic rate; remediate structure before replanting."
			: severity === "Moderate"
			? "Spot-apply gypsum where infiltration declines; re-test after one season."
			: "No sodicity action required at this stage.";
	return { severity, riskLabel, sar, esp, recommendation: rec };
}

function buildIrrigation(
	env: SoilReportEnvelope
): ProfessionalReportDTO["irrigation"] {
	const notes: string[] = [];
	const drainage = env.interpretation?.drainageClass ?? null;
	const infil = env.interpretation?.infiltrationClass ?? null;
	const whc = env.interpretation?.waterHoldingClass ?? null;
	if (drainage === "Very Poor" || drainage === "Poor") {
		notes.push("Drainage limits root aeration — favour raised beds or tile drainage.");
	}
	if (infil === "Very Slow" || infil === "Slow") {
		notes.push("Reduce instantaneous application rate to avoid runoff.");
	}
	if (whc === "Low" || whc === "Very Low") {
		notes.push("Plan more frequent, lighter irrigations.");
	}
	return {
		infiltrationClass: infil,
		drainageClass: drainage,
		waterHoldingClass: whc,
		leachingRequirement: null,
		notes,
	};
}

function buildAgronomic(
	env: SoilReportEnvelope
): ProfessionalReportDTO["agronomic"] {
	const interp = env.interpretation;
	const rating = mapOverallRating(interp?.overallSoilRating ?? "FAIR");
	const categories: ProfessionalReportDTO["agronomic"]["categories"] = [];
	const push = (label: string, value: string | null | undefined) => {
		if (!value) return;
		categories.push({
			label,
			value,
			status: ratingFromCategory(label, value),
		});
	};
	push("pH", interp?.phCategory ?? null);
	push("Salinity", interp?.salinityRisk ?? null);
	push("CEC", interp?.cecLevel ?? null);
	push("Base saturation", interp?.baseSaturationCategory ?? null);
	push("Cation balance", interp?.cationBalance ?? null);
	push("Sodium risk", interp?.sodiumRisk ?? null);
	push("Water holding", interp?.waterHoldingClass ?? null);
	push("Drainage", interp?.drainageClass ?? null);
	push("Organic matter", interp?.organicMatterCategory ?? null);
	push("Compaction risk", interp?.compactionRisk ?? null);
	const suitability: ProfessionalReportDTO["agronomic"]["suitability"] = {};
	const matrix = interp?.textureSuitabilityJson;
	if (matrix) {
		suitability.turfgrass = matrix.turfgrass;
		suitability.landscape = matrix.landscape;
		suitability.agriculture = matrix.agriculture;
		suitability.irrigation = matrix.irrigation;
	}
	return {
		overallSoilRating: rating,
		categories,
		suitability,
	};
}

function buildNotes(env: SoilReportEnvelope): ProfessionalReportDTO["notes"] {
	// Phase 10A.7 R2 (B8) — `missingValues` enumerates ONLY
	// engine-output gaps (physics / chemistry / interpretation modules
	// that failed to produce a result). Evidence-level coverage
	// (declared SoilTestLevel vs submitted lab fields) is reported in
	// the dedicated Evidence Completeness section and must not be
	// duplicated here. `calculationWarnings` retains engine-emitted
	// warning records verbatim so the two surfaces never collide.
	const missing: string[] = [];
	const estimated: string[] = [];
	if (!env.chemistry) missing.push("Chemistry engine output");
	if (!env.physics) missing.push("Physics engine output");
	if (!env.interpretation) missing.push("Interpretation output");
	if (env.metadata.calculationMode === "ESTIMATED") {
		estimated.push("Chemistry values derived in ESTIMATED mode from texture + organic matter.");
	}
	return {
		missingValues: missing,
		estimatedValues: estimated,
		calculationWarnings: env.warningDetails,
	};
}

function buildAppendix(
	env: SoilReportEnvelope,
	args: ComposeReportArgs
): ProfessionalReportDTO["appendix"] {
	const calcVersion = env.metadata.version;
	const lines = [
		`Calculation engine version: ${calcVersion}.`,
		`Test level: ${env.metadata.testLevel}.`,
	];
	if (env.metadata.calculationMode) {
		lines.push(`Chemistry mode: ${env.metadata.calculationMode}.`);
	}
	return {
		calculationSummary: lines.join(" "),
		inputs: {
			texture: args.textureInputRow ?? null,
			chemistry: args.chemistryInputRow ?? null,
		},
	};
}

function buildExecutiveSummary(
	env: SoilReportEnvelope,
	recs: RecommendationSetDTO,
	texture: ProfessionalReportDTO["texture"]
): ProfessionalReportDTO["executiveSummary"] {
	const findings: string[] = [];
	if (texture.usdaClass) {
		findings.push(`USDA texture class: ${texture.usdaClass}.`);
	}
	if (env.interpretation?.salinitySeverity) {
		findings.push(
			`Salinity severity: ${env.interpretation.salinitySeverity}.`
		);
	}
	if (env.interpretation?.sodicitySeverity) {
		findings.push(
			`Sodicity severity: ${env.interpretation.sodicitySeverity}.`
		);
	}
	if (env.interpretation?.organicMatterCategory) {
		findings.push(
			`Organic matter: ${env.interpretation.organicMatterCategory}.`
		);
	}
	if (env.interpretation?.waterHoldingClass) {
		findings.push(
			`Water holding capacity: ${env.interpretation.waterHoldingClass}.`
		);
	}
	const flat = [...recs.short, ...recs.medium, ...recs.long];
	const actionCount = flat.filter(
		(r) => r.severity === "ACTION" || r.severity === "CRITICAL"
	).length;
	return {
		overallRating: mapOverallRating(
			env.interpretation?.overallSoilRating ?? "FAIR"
		),
		headlineFindings: findings.slice(0, 5),
		actionItemCount: actionCount,
	};
}

function mapOverallRating(
	rating: string
): ProfessionalReportDTO["executiveSummary"]["overallRating"] {
	const r = rating.toUpperCase();
	if (r === "GOOD") return "Good";
	if (r === "POOR") return "Poor";
	if (r === "EXCELLENT") return "Excellent";
	if (r === "CRITICAL") return "Critical";
	return "Fair";
}

function ratingFromCategory(
	label: string,
	value: string
): "good" | "fair" | "poor" {
	const v = value.toLowerCase();
	if (label === "pH") {
		if (v.includes("neutral") || v.includes("slightly")) return "good";
		if (v.includes("strongly") || v.includes("very")) return "poor";
		return "fair";
	}
	if (label === "Salinity" || label === "Sodium risk") {
		if (v.includes("none") || v.includes("low")) return "good";
		if (v.includes("severe") || v.includes("strong") || v.includes("high"))
			return "poor";
		return "fair";
	}
	if (label === "CEC" || label === "Water holding") {
		if (v.includes("high") || v.includes("adequate")) return "good";
		if (v.includes("very low")) return "poor";
		return "fair";
	}
	if (label === "Compaction risk") {
		return v === "high" ? "poor" : v === "moderate" ? "fair" : "good";
	}
	return "fair";
}

// ---------------------------------------------------------------------------
// Phase 10A.7 (Correction) — SoilTestLevel-anchored evidence coverage
// ---------------------------------------------------------------------------

/**
 * Builds the evidence-completeness section anchored on the
 * `SoilTestLevel` declared on the SoilTest row. The composer delegates
 * to the canonical `computeScientificCoverage()` so the report, the
 * `/scientific-analysis` API, and the frontend all read the same DTOs.
 *
 * The composer NEVER silently downgrades: the declared level is
 * preserved verbatim; missing modules are reported through the level
 * statement and per-module status.
 */
function buildCompleteness(args: ComposeReportArgs): CompletenessSection {
	const declaredLevel = readDeclaredLevel(args.envelope.metadata.testLevel);
	const coverage = computeScientificCoverage(declaredLevel, {
		texture: args.textureInputRow,
		chemistry: args.chemistryInputRow,
	});
	return { level: coverage.level, modules: coverage.modules };
}

function readDeclaredLevel(value: unknown): SoilTestLevel {
	if (value === SoilTestLevel.ADVANCED || value === SoilTestLevel.MODERATE) {
		return value;
	}
	return SoilTestLevel.PRELIMINARY;
}
