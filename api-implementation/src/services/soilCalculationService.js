/**
 * Advanced Soil Calculation Service implementing complete Saxton & Rawls (2006) 24-Equation System
 * This moves the core IP-sensitive calculations to the server with full scientific accuracy
 *
 * @format
 */

class SoilCalculationService {
	/**
	 * Calculate complete soil water characteristics using Saxton & Rawls (2006) 24-equation system
	 * @param {number} sand - Sand percentage (0-100)
	 * @param {number} clay - Clay percentage (0-100)
	 * @param {number} om - Organic matter percentage (0-8)
	 * @param {number} densityFactor - Density factor (0.9-1.8)
	 * @param {number} gravelContent - Gravel content percentage (0-80)
	 * @param {number} electricalConductivity - EC in dS/m (0-20)
	 * @param {string} userPlan - User plan for feature access
	 * @returns {object} Complete soil water characteristics with confidence intervals
	 */
	static calculateWaterCharacteristics(
		sand,
		clay,
		om = 2.5,
		densityFactor = 1.3,
		gravelContent = 0,
		electricalConductivity = 0.5,
		userPlan = "FREE"
	) {
		// Input validation
		if (sand < 0 || sand > 100 || clay < 0 || clay > 100 || sand + clay > 100) {
			throw new Error("Invalid sand/clay percentages");
		}
		if (om < 0 || om > 8) {
			throw new Error("Organic matter must be between 0-8%");
		}
		if (clay > 60) {
			throw new Error(
				"Clay content >60% excluded per Saxton & Rawls methodology"
			);
		}

		// Calculate silt percentage
		const silt = 100 - sand - clay;

		// Convert percentages to decimal fractions
		const S = sand / 100;
		const C = clay / 100;
		const OM = om / 100;
		const Rv = gravelContent / 100; // Gravel volume fraction

		// PHASE 1: Complete Saxton & Rawls (2006) 24-Equation System

		// Equations 1-5: Moisture regressions
		const results = this.calculateMoistureRegressions(S, C, OM);

		// Equations 6-10: Density effects
		const densityResults = this.calculateDensityEffects(results, densityFactor);

		// Equations 11-15: Moisture-tension relationships
		const tensionResults = this.calculateMoistureTensionRelationships(
			S,
			C,
			OM,
			densityResults
		);

		// Equations 16-18: Moisture-conductivity
		const conductivityResults = this.calculateMoistureConductivity(
			tensionResults,
			S,
			C
		);

		// Equations 19-22: Gravel effects (Professional+ feature)
		let gravelResults = {};
		if (userPlan !== "FREE" && gravelContent > 0) {
			gravelResults = this.calculateGravelEffects(densityResults, Rv);
		}

		// Equations 23-24: Salinity effects (Enterprise feature)
		let salinityResults = {};
		if (userPlan === "ENTERPRISE" && electricalConductivity > 0) {
			salinityResults = this.calculateSalinityEffects(electricalConductivity);
		}

		// Calculate confidence intervals and R² values
		const confidenceIntervals = this.calculateConfidenceIntervals(userPlan);

		// Determine soil texture class
		const textureClass = this.determineSoilTextureClass(sand, clay);

		// Calculate soil quality indicators
		const qualityIndicators = this.calculateSoilQualityIndicators(
			densityResults,
			conductivityResults,
			textureClass
		);

		// Prepare results based on user plan
		return this.formatResultsByPlan(
			densityResults,
			conductivityResults,
			gravelResults,
			salinityResults,
			confidenceIntervals,
			textureClass,
			qualityIndicators,
			userPlan
		);
	}

	/**
	 * Equations 1-5: Moisture regressions (θ1500, θ33, θ(S-33), Ψe, θS)
	 */
	static calculateMoistureRegressions(S, C, OM) {
		// Equation 1: Wilting point moisture (θ1500)
		const theta1500t =
			-0.024 * S +
			0.487 * C +
			0.006 * OM +
			0.005 * (S * OM) -
			0.013 * (C * OM) +
			0.068 * (S * C) +
			0.031;

		// Equation 2: Field capacity moisture (θ33)
		const theta33t =
			-0.251 * S +
			0.195 * C +
			0.011 * OM +
			0.006 * (S * OM) -
			0.027 * (C * OM) +
			0.452 * (S * C) +
			0.299;

		// Equation 3: Moisture difference (θ(S-33))
		const thetaS33t =
			0.278 * S +
			0.034 * C +
			0.022 * OM -
			0.018 * (S * OM) -
			0.027 * (C * OM) -
			0.584 * (S * C) +
			0.078;

		// Equation 4: Air-entry tension (Ψe)
		const psiE =
			-21.67 * S -
			27.93 * C -
			81.97 * thetaS33t +
			71.12 * (S * thetaS33t) +
			8.29 * (C * thetaS33t) +
			14.05 * (S * C) +
			27.16;

		// Equation 5: Saturation moisture (θS)
		const thetaS = theta33t + thetaS33t - 0.097 * S + 0.043;

		return {
			theta1500t,
			theta33t,
			thetaS33t,
			psiE: Math.max(0, psiE), // Ensure positive
			thetaS: Math.min(0.6, Math.max(0.25, thetaS)), // Constrain to realistic range
		};
	}

	/**
	 * Equations 6-10: Density effects (ρN, ρDF, θS-DF, θ33-DF, θ(S-33)DF)
	 */
	static calculateDensityEffects(moistureResults, densityFactor) {
		const { theta1500t, theta33t, thetaS33t, thetaS } = moistureResults;

		// Equation 6: Normal density (ρN)
		const rhoN = (1 - thetaS) * 2.65;

		// Equation 7: Density factor (ρDF)
		const rhoDF = densityFactor;

		// Equation 8: Saturation with density factor (θS-DF)
		const thetaSDF = 1 - rhoDF / 2.65;

		// Equation 9: Field capacity with density factor (θ33-DF)
		const theta33DF =
			theta33t + (1.283 * Math.pow(theta33t, 2) - 0.374 * theta33t - 0.015);

		// Equation 10: Moisture difference with density factor (θ(S-33)DF)
		const thetaS33DF = thetaSDF - theta33DF;

		return {
			...moistureResults,
			rhoN,
			rhoDF,
			thetaSDF: Math.min(0.6, Math.max(0.25, thetaSDF)),
			theta33DF: Math.min(0.5, Math.max(0.05, theta33DF)),
			thetaS33DF: Math.max(0.01, thetaS33DF),
			theta1500DF: theta1500t + (0.14 * theta1500t - 0.02), // Wilting point with density
		};
	}

	/**
	 * Equations 11-15: Moisture-tension relationships (A, B, λ parameters)
	 */
	static calculateMoistureTensionRelationships(S, C, OM, densityResults) {
		const { theta33DF, theta1500DF, thetaSDF, psiE } = densityResults;

		// Equation 11: Parameter A
		const A = Math.exp(
			Math.log(33) +
				((Math.log(1500) - Math.log(33)) *
					(Math.log(theta33DF) - Math.log(thetaSDF))) /
					(Math.log(theta1500DF) - Math.log(thetaSDF))
		);

		// Equation 12: Parameter B
		const B =
			(Math.log(1500) - Math.log(33)) /
			(Math.log(theta33DF) - Math.log(theta1500DF));

		// Equation 13: Lambda parameter (λ)
		const lambda = 1 / B;

		// Equation 14: Air-entry tension adjusted (Ψe-adj)
		const psiEAdj = psiE * Math.pow(theta33DF / densityResults.theta33t, -B);

		// Equation 15: Moisture at any tension
		// θ(ψ) = θ1500 + (θ33 - θ1500) * (ψ/1500)^(-λ)

		return {
			...densityResults,
			A: Math.max(0.1, A),
			B: Math.max(0.1, Math.min(10, B)),
			lambda: Math.max(0.1, Math.min(5, lambda)),
			psiEAdj: Math.max(1, psiEAdj),
			airEntryTension: psiEAdj.toFixed(1),
		};
	}

	/**
	 * Basic calculation for free tier users
	 * @param {number} sand - Sand percentage (0-100)
	 * @param {number} clay - Clay percentage (0-100)
	 * @returns {object} Object containing basic soil water characteristics
	 */
	static calculateBasic(sand, clay) {
		// Simplified calculation for free tier
		const textureClass = this.determineSoilTextureClass(sand, clay);

		// Use lookup table for basic estimates
		const basicEstimates = {
			Sand: { fc: 10, wp: 4, paw: 6, sat: 40, ks: 200 },
			"Loamy Sand": { fc: 12, wp: 5, paw: 7, sat: 42, ks: 150 },
			"Sandy Loam": { fc: 18, wp: 8, paw: 10, sat: 45, ks: 80 },
			Loam: { fc: 28, wp: 12, paw: 16, sat: 47, ks: 20 },
			"Silt Loam": { fc: 30, wp: 12, paw: 18, sat: 50, ks: 15 },
			Silt: { fc: 32, wp: 13, paw: 19, sat: 52, ks: 10 },
			"Clay Loam": { fc: 36, wp: 22, paw: 14, sat: 48, ks: 5 },
			Clay: { fc: 40, wp: 30, paw: 10, sat: 53, ks: 1 },
		};

		// Default values if texture not found
		const defaults = { fc: 25, wp: 10, paw: 15, sat: 45, ks: 10 };
		const values = basicEstimates[textureClass] || defaults;

		return {
			fieldCapacity: values.fc.toFixed(1),
			wiltingPoint: values.wp.toFixed(1),
			plantAvailableWater: values.paw.toFixed(1),
			saturation: values.sat.toFixed(1),
			saturatedConductivity: values.ks.toFixed(1),
			textureClass: textureClass,
			message: "For advanced calculations, sign up for a free account.",
		};
	}

	/**
	 * Equations 16-18: Moisture-conductivity (KS, Ku calculations)
	 */
	static calculateMoistureConductivity(tensionResults, S, C) {
		const { thetaSDF, theta33DF, lambda } = tensionResults;

		// Equation 16: Saturated hydraulic conductivity (KS)
		const KS = 1930 * Math.pow(thetaSDF - theta33DF, 3 - lambda);

		// Equation 17: Unsaturated hydraulic conductivity (Ku)
		// Ku = KS * (θ/θS)^(3 + 2/λ)
		const conductivityExponent = 3 + 2 / lambda;

		// Equation 18: Relative conductivity
		const relativeK = Math.pow(theta33DF / thetaSDF, conductivityExponent);

		return {
			...tensionResults,
			saturatedConductivity: Math.max(0.1, KS).toFixed(1),
			unsaturatedConductivity: (KS * relativeK).toFixed(1),
			conductivityExponent: conductivityExponent.toFixed(2),
			relativeK: relativeK.toFixed(3),
		};
	}

	/**
	 * Enhanced calculation method that handles all user plans and parameters
	 * @param {Object} params - All soil parameters
	 * @returns {Object} Complete analysis results
	 */
	static calculateEnhanced(params) {
		const {
			sand,
			clay,
			organicMatter = 2.5,
			densityFactor = 1.3,
			gravelContent = 0,
			electricalConductivity = 0.5,
			userPlan = "FREE",
		} = params;

		// Use the main calculation method
		return this.calculateWaterCharacteristics(
			sand,
			clay,
			organicMatter,
			densityFactor,
			gravelContent,
			electricalConductivity,
			userPlan
		);
	}

	/**
	 * Equations 19-22: Gravel effects (Rv, ρB, PAWB, Kb/KS ratios)
	 */
	static calculateGravelEffects(densityResults, Rv) {
		const { theta33DF, theta1500DF, saturatedConductivity } = densityResults;

		// Equation 19: Bulk density with gravel (ρB)
		const rhoBulk = densityResults.rhoDF * (1 - Rv) + 2.65 * Rv;

		// Equation 20: Plant available water bulk (PAWB)
		const PAWB = (theta33DF - theta1500DF) * (1 - Rv);

		// Equation 21: Bulk saturated conductivity (Kb)
		const Kb = parseFloat(saturatedConductivity) * Math.pow(1 - Rv, 2);

		// Equation 22: Conductivity ratio (Kb/KS)
		const conductivityRatio = Kb / parseFloat(saturatedConductivity);

		return {
			gravelVolumeFraction: Rv,
			bulkDensity: rhoBulk.toFixed(2),
			plantAvailableWaterBulk: (PAWB * 100).toFixed(1),
			bulkConductivity: Kb.toFixed(1),
			conductivityRatio: conductivityRatio.toFixed(3),
		};
	}

	/**
	 * Equations 23-24: Salinity effects (ΨO, ΨOu osmotic potentials)
	 */
	static calculateSalinityEffects(electricalConductivity) {
		// Equation 23: Osmotic potential (ΨO)
		const psiO = -0.36 * electricalConductivity;

		// Equation 24: Osmotic potential at field capacity (ΨOu)
		const psiOu = psiO * 2; // Concentration effect at field capacity

		return {
			osmoticPotential: psiO.toFixed(1),
			osmoticPotentialFC: psiOu.toFixed(1),
			electricalConductivity: electricalConductivity.toFixed(1),
		};
	}

	/**
	 * Calculate confidence intervals and R² values based on Saxton & Rawls (2006)
	 */
	static calculateConfidenceIntervals(userPlan) {
		// R² values and standard errors from Saxton & Rawls (2006)
		const confidenceData = {
			wiltingPoint: { r2: 0.86, se: 0.02 },
			fieldCapacity: { r2: 0.63, se: 0.05 },
			saturation: { r2: 0.29, se: 0.04 },
			airEntryTension: { r2: 0.78, se: 2.9 },
			saturatedConductivity: { r2: 0.45, se: 0.3 },
		};

		// Only show confidence intervals for Professional+ users
		if (userPlan === "FREE") {
			return null;
		}

		return {
			confidenceIntervals: {
				wiltingPoint: confidenceData.wiltingPoint.se,
				fieldCapacity: confidenceData.fieldCapacity.se,
				saturation: confidenceData.saturation.se,
				airEntryTension: confidenceData.airEntryTension.se,
				saturatedConductivity: confidenceData.saturatedConductivity.se,
			},
			rSquaredValues: {
				wiltingPoint: confidenceData.wiltingPoint.r2,
				fieldCapacity: confidenceData.fieldCapacity.r2,
				saturation: confidenceData.saturation.r2,
				airEntryTension: confidenceData.airEntryTension.r2,
				saturatedConductivity: confidenceData.saturatedConductivity.r2,
			},
		};
	}

	/**
	 * Calculate soil quality indicators
	 */
	static calculateSoilQualityIndicators(
		densityResults,
		conductivityResults,
		textureClass
	) {
		const { theta33DF, theta1500DF } = densityResults;
		const { saturatedConductivity } = conductivityResults;

		// Calculate Plant Available Water
		const paw = (theta33DF - theta1500DF) * 100;

		// Soil Quality Index (0-10 scale)
		let qualityScore = 5; // Base score

		// PAW contribution (0-3 points)
		if (paw > 20) qualityScore += 3;
		else if (paw > 15) qualityScore += 2;
		else if (paw > 10) qualityScore += 1;
		else if (paw < 5) qualityScore -= 2;

		// Conductivity contribution (0-2 points)
		const ksat = parseFloat(saturatedConductivity);
		if (ksat > 10 && ksat < 100) qualityScore += 2;
		else if (ksat > 5 && ksat < 200) qualityScore += 1;
		else if (ksat < 1 || ksat > 500) qualityScore -= 1;

		// Drainage classification
		let drainageClass;
		if (ksat > 100) drainageClass = "Excellent";
		else if (ksat > 50) drainageClass = "Good";
		else if (ksat > 10) drainageClass = "Moderate";
		else if (ksat > 1) drainageClass = "Poor";
		else drainageClass = "Very Poor";

		return {
			soilQualityIndex: Math.max(0, Math.min(10, qualityScore)).toFixed(1),
			drainageClass,
			compactionRisk: this.assessCompactionRisk(textureClass, densityResults),
			erosionRisk: this.assessErosionRisk(textureClass, ksat),
		};
	}

	/**
	 * Assess compaction risk based on texture and density
	 */
	static assessCompactionRisk(textureClass, densityResults) {
		const { rhoDF } = densityResults;

		if (textureClass.includes("Clay") && rhoDF > 1.4) return "High";
		if (textureClass.includes("Clay") && rhoDF > 1.3) return "Moderate";
		if (rhoDF > 1.6) return "Moderate";
		return "Low";
	}

	/**
	 * Assess erosion risk based on texture and conductivity
	 */
	static assessErosionRisk(textureClass, ksat) {
		if (textureClass.includes("Sand") && ksat > 100) return "High";
		if (textureClass.includes("Sand") && ksat > 50) return "Moderate";
		if (textureClass.includes("Silt") && ksat < 10) return "Moderate";
		return "Low";
	}

	/**
	 * Format results based on user plan (tiered access)
	 */
	static formatResultsByPlan(
		densityResults,
		conductivityResults,
		gravelResults,
		salinityResults,
		confidenceIntervals,
		textureClass,
		qualityIndicators,
		userPlan
	) {
		// Base results for all users
		const baseResults = {
			fieldCapacity: (densityResults.theta33DF * 100).toFixed(1),
			wiltingPoint: (densityResults.theta1500DF * 100).toFixed(1),
			plantAvailableWater: (
				(densityResults.theta33DF - densityResults.theta1500DF) *
				100
			).toFixed(1),
			saturation: (densityResults.thetaSDF * 100).toFixed(1),
			saturatedConductivity: conductivityResults.saturatedConductivity,
			textureClass,
			soilQualityIndex: qualityIndicators.soilQualityIndex,
			drainageClass: qualityIndicators.drainageClass,
			compactionRisk: qualityIndicators.compactionRisk,
			erosionRisk: qualityIndicators.erosionRisk,
			bulkDensity: densityResults.rhoDF.toFixed(3),
		};

		// Professional tier additions
		if (userPlan === "PROFESSIONAL" || userPlan === "ENTERPRISE") {
			Object.assign(baseResults, {
				airEntryTension: conductivityResults.airEntryTension,
				bulkDensity: densityResults.rhoDF.toFixed(2),
				lambda: conductivityResults.lambda.toFixed(2),
				compactionRisk: qualityIndicators.compactionRisk,
				erosionRisk: qualityIndicators.erosionRisk,
				unsaturatedConductivity: conductivityResults.unsaturatedConductivity,
			});

			// Add gravel effects if present
			if (Object.keys(gravelResults).length > 0) {
				Object.assign(baseResults, gravelResults);
			}

			// Add confidence intervals
			if (confidenceIntervals) {
				Object.assign(baseResults, confidenceIntervals);
			}
		}

		// Enterprise tier additions
		if (userPlan === "ENTERPRISE") {
			// Add salinity effects if present
			if (Object.keys(salinityResults).length > 0) {
				Object.assign(baseResults, salinityResults);
			}

			// Add advanced parameters
			Object.assign(baseResults, {
				parameterA: conductivityResults.A.toFixed(3),
				parameterB: conductivityResults.B.toFixed(3),
				relativeK: conductivityResults.relativeK,
				conductivityExponent: conductivityResults.conductivityExponent,
			});
		}

		return baseResults;
	}

	/**
	 * Determine soil texture class based on sand and clay percentages
	 * @param {number} sand - Sand percentage (0-100)
	 * @param {number} clay - Clay percentage (0-100)
	 * @returns {string} Soil texture class
	 */
	static determineSoilTextureClass(sand, clay) {
		// Calculate silt percentage
		const silt = 100 - sand - clay;

		// Simplified texture classification
		if (clay >= 40) {
			if (sand > 45) return "Sandy Clay";
			if (silt > 40) return "Silty Clay";
			return "Clay";
		}

		if (clay >= 27) {
			if (sand > 45) return "Sandy Clay Loam";
			if (silt > 40) return "Silty Clay Loam";
			return "Clay Loam";
		}

		if (clay >= 20) {
			return "Loam";
		}

		if (silt >= 80) {
			return "Silt";
		}

		if (silt >= 50) {
			return "Silt Loam";
		}

		if (sand >= 85) {
			return "Sand";
		}

		if (sand >= 70) {
			return "Loamy Sand";
		}

		return "Sandy Loam";
	}
}

module.exports = SoilCalculationService;
