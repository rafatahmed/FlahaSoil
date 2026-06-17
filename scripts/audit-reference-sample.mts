/**
 * Phase 10S-4 — Scientific Calculation Audit driver.
 *
 * Runs the canonical reference sample (Sand 60, Silt 25, Clay 15, OM 2.5,
 * CEC 18, Ca 11, Mg 3, K 0.6, Na 0.4, pH 7.2, EC 1.0) through every
 * production engine and prints a structured trace so the audit report
 * can be derived from real, in-tree numbers (no hand-recomputed values).
 *
 * Read-only: imports from the workspace source, never writes to disk
 * or the database.
 */

// Use dynamic imports to avoid the ESM static-link issue caused by
// `export *` re-exports in the workspace package index files.
const physMod = await import("@flaha/soil-physics");
const chemMod = await import("@flaha/soil-chemistry");
const interpMod = await import("@flaha/soil-interpretation");

const calculateSoilPhysics = physMod.calculateSoilPhysics;
const buildWaterRetentionCurve = physMod.buildWaterRetentionCurve;
const classifyTexture = physMod.classifyTexture;
const normalizeTextureFractions = physMod.normalizeTextureFractions;
const calculateSoilChemistry = chemMod.calculateSoilChemistry;
const classifyCationStructure = chemMod.classifyCationStructure;
const interpretSoil = interpMod.interpretSoil;

const SAMPLE = {
	sand: 60,
	silt: 25,
	clay: 15,
	organicMatter: 2.5,
	cec: 18,
	ca: 11,
	mg: 3,
	k: 0.6,
	na: 0.4,
	pH: 7.2,
	ec: 1.0,
};

console.log("=".repeat(78));
console.log("PHASE 10S-4 — REFERENCE SAMPLE AUDIT TRACE");
console.log("Sample:", JSON.stringify(SAMPLE));
console.log("=".repeat(78));

// ---------- TEXTURE ----------
const tex = normalizeTextureFractions(SAMPLE.sand, SAMPLE.silt, SAMPLE.clay);
const cls = classifyTexture(tex.sand, tex.silt, tex.clay);
console.log("\n[A] USDA TEXTURE (textureTriangle.ts)");
console.log("    normalized:", tex);
console.log("    classifyTexture →", cls.className, "matched=", cls.matched);

// ---------- PHYSICS (PROFESSIONAL, BD default 1.3) ----------
const physPro = calculateSoilPhysics({
	sand: SAMPLE.sand,
	clay: SAMPLE.clay,
	organicMatter: SAMPLE.organicMatter,
	electricalConductivity: SAMPLE.ec,
	userPlan: "PROFESSIONAL",
});
console.log("\n[B] PHYSICS — PROFESSIONAL (calculateSoilPhysics.ts, BD default 1.3)");
for (const k of Object.keys(physPro)) {
	console.log(`    ${k}:`, (physPro as Record<string, unknown>)[k]);
}

// ---------- PHYSICS (FREE) ----------
const physFree = calculateSoilPhysics({
	sand: SAMPLE.sand,
	clay: SAMPLE.clay,
	organicMatter: SAMPLE.organicMatter,
	electricalConductivity: SAMPLE.ec,
	userPlan: "FREE",
});
console.log("\n[B'] PHYSICS — FREE tier (3-decimal BD branch)");
console.log("    bulkDensity(FREE):", physFree.bulkDensity);
console.log("    bulkDensity(PRO ):", physPro.bulkDensity);
console.log("    bulkDensityFactor:", (physPro as Record<string, unknown>).bulkDensityFactor);
console.log("    inputBulkDensity :", (physPro as Record<string, unknown>).inputBulkDensity);

// ---------- WATER RETENTION CURVE ----------
const curve = buildWaterRetentionCurve({
	sand: SAMPLE.sand,
	clay: SAMPLE.clay,
	organicMatter: SAMPLE.organicMatter,
});
console.log("\n[C] WATER RETENTION CURVE (waterRetentionCurve.ts)");
console.log("    method:", curve.method);
console.log("    textureClass:", curve.textureClass);
console.log("    parameterA(kPa):", curve.parameterA.toFixed(3));
console.log("    parameterB:", curve.parameterB.toFixed(3));
console.log("    airEntryTensionKpa:", curve.airEntryTensionKpa.toFixed(2));
console.log("    saturation %vol:", curve.saturation.waterContentVolPercent.toFixed(2));
console.log("    FC @33 kPa %vol:", curve.fieldCapacity.waterContentVolPercent.toFixed(2));
console.log("    WP @1500 kPa %vol:", curve.wiltingPoint.waterContentVolPercent.toFixed(2));
console.log("    PAW %vol:", curve.plantAvailableWater.toFixed(2));
console.log("    MAD trigger kPa:", curve.irrigationThreshold.tensionKpa.toFixed(2));
console.log("    curve points:");
for (const p of curve.points) {
	console.log(
		`      pF=${p.pF.toFixed(2)}  ψ=${p.tensionKpa.toFixed(2)} kPa  θ=${p.waterContentVolPercent.toFixed(2)} %vol`
	);
}

// ---------- CHEMISTRY LAB ----------
const chemLab = calculateSoilChemistry({
	mode: "LAB",
	cec: SAMPLE.cec,
	ca: SAMPLE.ca,
	mg: SAMPLE.mg,
	k: SAMPLE.k,
	na: SAMPLE.na,
	ph: SAMPLE.pH,
	ec: SAMPLE.ec,
});
console.log("\n[D] CHEMISTRY — LAB (calculateSoilChemistry.ts)");
for (const k of Object.keys(chemLab)) {
	console.log(`    ${k}:`, (chemLab as Record<string, unknown>)[k]);
}
console.log("    SUM(ca+mg+k+na):", SAMPLE.ca + SAMPLE.mg + SAMPLE.k + SAMPLE.na);

// ---------- CHEMISTRY ESTIMATED ----------
const chemEst = calculateSoilChemistry({
	mode: "ESTIMATED",
	clay: SAMPLE.clay,
	organicMatter: SAMPLE.organicMatter,
});
console.log("\n[D'] CHEMISTRY — ESTIMATED (clay×0.5 + OM×2)");
console.log("    cec(estimated):", chemEst.cec, " expected:", SAMPLE.clay * 0.5 + SAMPLE.organicMatter * 2);

// ---------- STRUCTURE TRIANGLE ----------
const struct = classifyCationStructure({
	ca: SAMPLE.ca,
	mg: SAMPLE.mg,
	k: SAMPLE.k,
	na: SAMPLE.na,
	cec: SAMPLE.cec,
});
console.log("\n[E] STRUCTURE TRIANGLE (structureTriangle.ts)");
console.log("    normalized Ca/Mg/K %:", struct.normalized);
console.log("    classification:", struct.classification);
console.log("    Ca:Mg ratio:", struct.caMgRatio.toFixed(2));
console.log("    Ca:K  ratio:", struct.caKRatio.toFixed(2));
console.log("    Mg:K  ratio:", struct.mgKRatio.toFixed(2));
console.log("    basesTotal cmol(+)/kg:", struct.basesTotal);

// ---------- INTERPRETATION (mirrors backend calculation.service.ts) ----------
const interp = interpretSoil({
	physics: physPro as unknown as Record<string, unknown>,
	chemistry: chemLab as unknown as Record<string, unknown>,
});
console.log("\n[F] INTERPRETATION (interpretSoil.ts)");
for (const k of Object.keys(interp)) {
	console.log(`    ${k}:`, JSON.stringify((interp as Record<string, unknown>)[k]));
}

console.log("\n" + "=".repeat(78));
console.log("END TRACE");
console.log("=".repeat(78));
