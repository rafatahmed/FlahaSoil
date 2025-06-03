/**
 * DSS Calculation Service - Enhanced for Week 2
 * Implements FAO-56 methodology with advanced features:
 * - Enhanced soil-crop compatibility analysis
 * - Regional climate data integration (GCC/MENA)
 * - Advanced Kc coefficient adjustments
 * - Irrigation scheduling optimization
 * - Complete water balance calculations
 * - Salt management integration (leaching and drainage)
 *
 * @format
 */

const SaltManagementServiceEnhanced = require("./saltManagementServiceEnhanced");

class DSSCalculationService {
	constructor() {
		// Initialize salt management service
		this.saltManagementService = new SaltManagementServiceEnhanced();

		// Enhanced constants for Week 2 features
		this.constants = {
			DEFAULT_APPLICATION_EFFICIENCY: 0.85, // 85% application efficiency
			DEFAULT_DEPLETION_FRACTION: 0.5, // 50% depletion before irrigation
			WATER_COST_PER_M3: 2.5, // $/m³ (regional average)
			SYSTEM_COSTS: {
				drip: 3500, // $/hectare
				sprinkler: 2000, // $/hectare
				surface: 800, // $/hectare
			},
			// Week 2: Regional climate adjustments for GCC/MENA
			CLIMATE_ADJUSTMENTS: {
				gcc_arid: { kcMultiplier: 1.15, etAdjustment: 1.2 },
				mena_mediterranean: { kcMultiplier: 1.05, etAdjustment: 1.1 },
				gulf_coastal: { kcMultiplier: 1.1, etAdjustment: 1.15 },
				temperate: { kcMultiplier: 1.0, etAdjustment: 1.0 },
				arid: { kcMultiplier: 1.05, etAdjustment: 1.1 },
				humid: { kcMultiplier: 0.95, etAdjustment: 0.9 },
			},
			// Week 2: Soil-crop compatibility matrix
			SOIL_CROP_COMPATIBILITY: {
				sandy: { vegetables: 0.8, cereals: 0.6, legumes: 0.7 },
				loamy: { vegetables: 1.0, cereals: 1.0, legumes: 1.0 },
				clayey: { vegetables: 0.7, cereals: 0.9, legumes: 0.8 },
			},
		};
	}

	/**
	 * Week 2 Enhancement: Enhanced soil-crop compatibility analysis
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} cropData - Crop information
	 * @returns {Object} Compatibility analysis results
	 */
	analyzeSoilCropCompatibility(soilData, cropData) {
		const { sand, clay, silt } = soilData;
		const cropType = cropData.type?.toLowerCase() || "vegetables";

		// Determine soil texture class
		let soilTexture = "loamy"; // default
		if (sand > 70) soilTexture = "sandy";
		else if (clay > 40) soilTexture = "clayey";
		else if (sand > 50 && clay < 20) soilTexture = "sandy";

		// Get compatibility score
		const compatibilityMatrix =
			this.constants.SOIL_CROP_COMPATIBILITY[soilTexture] ||
			this.constants.SOIL_CROP_COMPATIBILITY.loamy;

		const compatibilityScore =
			compatibilityMatrix[cropType] || compatibilityMatrix.vegetables;

		// Generate recommendations
		const recommendations = [];
		if (compatibilityScore < 0.8) {
			recommendations.push({
				type: "soil_amendment",
				priority: "high",
				message: `Consider soil amendments to improve ${cropType} compatibility`,
				suggestions: this.getSoilAmendmentSuggestions(soilTexture, cropType),
			});
		}

		return {
			soilTexture,
			compatibilityScore,
			suitabilityRating: this.getCompatibilityRating(compatibilityScore),
			recommendations,
			adjustmentFactor: compatibilityScore,
		};
	}

	/**
	 * Main calculation method for irrigation recommendations - Enhanced for Week 2
	 * @param {Object} params - Calculation parameters
	 * @returns {Object} Comprehensive irrigation recommendations
	 */
	async calculateIrrigationRecommendations(params) {
		const { soilData, cropData, fieldConfig, environmentalData } = params;

		try {
			// Week 2 Step 1: Enhanced soil-crop compatibility analysis
			const compatibilityResults = this.analyzeSoilCropCompatibility(
				soilData,
				cropData
			);

			// Step 2: Calculate crop evapotranspiration (ETc) with regional adjustments
			const etcResults = this.calculateETcEnhanced(
				environmentalData,
				cropData,
				compatibilityResults
			);

			// Step 2: Calculate irrigation requirements
			const irrigationResults = this.calculateIrrigationRequirements(
				soilData,
				etcResults,
				fieldConfig,
				environmentalData
			);

			// Step 3: System design recommendations
			const systemResults = this.recommendIrrigationSystem(
				soilData,
				irrigationResults,
				fieldConfig
			);

			// Step 4: Economic analysis
			const economicResults = this.calculateEconomicAnalysis(
				systemResults,
				irrigationResults,
				fieldConfig
			);

			// Step 5: Generate irrigation schedule
			const scheduleResults = this.generateIrrigationSchedule(
				irrigationResults,
				environmentalData
			);

			// Week 4 Step 6: Enhanced system recommendations with detailed analysis
			const systemRecommendationsEnhanced = this.generateSystemRecommendations(
				soilData,
				irrigationResults,
				fieldConfig,
				compatibilityResults
			);

			// Week 4 Step 7: Enhanced economic analysis basic
			const economicAnalysisBasic = this.calculateEconomicAnalysisBasic(
				systemRecommendationsEnhanced,
				irrigationResults,
				fieldConfig
			);

			// Step 8: Salt management calculations (leaching and drainage)
			const saltManagementResults = await this.calculateSaltManagement(
				soilData,
				irrigationResults,
				environmentalData,
				fieldConfig
			);

			// Combine all results
			return {
				// Core calculations
				etcCalculated: etcResults.etc,
				irrigationDepth: irrigationResults.irrigationDepth,
				irrigationFrequency: irrigationResults.frequency,
				maxApplicationRate: irrigationResults.maxApplicationRate,

				// System recommendations
				systemRecommendation: systemResults.recommendedSystem,
				systemEfficiency: systemResults.efficiency,
				systemCost: systemResults.estimatedCost,

				// Economic analysis
				economicROI: economicResults.roi,
				paybackPeriod: economicResults.paybackPeriod,
				annualWaterSavings: economicResults.annualWaterSavings,
				annualCostSavings: economicResults.annualCostSavings,

				// Week 4: Enhanced system recommendations
				systemRecommendationsEnhanced:
					systemRecommendationsEnhanced.recommendedSystem,
				systemAnalysis: systemRecommendationsEnhanced.systemAnalysis,
				systemComparison: systemRecommendationsEnhanced.systemComparison,
				implementationPlan: systemRecommendationsEnhanced.implementationPlan,
				maintenanceSchedule: systemRecommendationsEnhanced.maintenanceSchedule,
				performanceMetrics: systemRecommendationsEnhanced.performanceMetrics,

				// Week 4: Enhanced economic analysis
				economicAnalysisBasic: economicAnalysisBasic.summary,
				roiCalculation: economicAnalysisBasic.roiCalculation,
				paybackAnalysis: economicAnalysisBasic.paybackAnalysis,
				waterSavingsAnalysis: economicAnalysisBasic.waterSavings,
				costBenefitAnalysis: economicAnalysisBasic.costBenefitAnalysis,

				// Salt management results
				saltManagement: saltManagementResults,

				// Detailed breakdown
				detailedResults: {
					etcBreakdown: etcResults,
					irrigationBreakdown: irrigationResults,
					systemBreakdown: systemResults,
					economicBreakdown: economicResults,
					// Week 4 additions
					systemRecommendationsDetailed: systemRecommendationsEnhanced,
					economicAnalysisDetailed: economicAnalysisBasic,
				},

				// Recommendations
				recommendations: this.generateRecommendations(
					irrigationResults,
					systemResults,
					economicResults
				),

				// Schedule data
				scheduleData: scheduleResults,
			};
		} catch (error) {
			console.error("Error in DSS calculations:", error);
			throw new Error(`DSS calculation failed: ${error.message}`);
		}
	}

	/**
	 * Week 2 Enhancement: Helper methods for soil-crop compatibility
	 */
	getSoilAmendmentSuggestions(soilTexture, cropType) {
		const suggestions = {
			sandy: ["Add organic matter", "Use mulching", "Consider drip irrigation"],
			clayey: [
				"Improve drainage",
				"Add sand/compost",
				"Raised beds recommended",
			],
			loamy: ["Maintain organic matter", "Regular soil testing"],
		};
		return suggestions[soilTexture] || suggestions.loamy;
	}

	getCompatibilityRating(score) {
		if (score >= 0.9) return "Excellent";
		if (score >= 0.8) return "Good";
		if (score >= 0.7) return "Fair";
		return "Poor";
	}

	/**
	 * Week 2 Enhancement: Enhanced ETc calculation following FAO-56 methodology
	 * ETc = ET₀ × Kc (where ET₀ comes from FlahaCalc API)
	 *
	 * @param {Object} environmentalData - Environmental conditions including FlahaCalc ET₀
	 * @param {Object} cropData - Crop information with Kc periods
	 * @param {Object} compatibilityResults - Soil-crop compatibility analysis results
	 * @returns {Object} Enhanced ETc calculation results following FAO-56
	 */
	calculateETcEnhanced(environmentalData, cropData, compatibilityResults) {
		const {
			et0, // From FlahaCalc API (e.g., 16.29 mm/day for Doha, Qatar)
			climateZone,
			irrigationMethod,
			growthStage,
			// Additional FlahaCalc data for enhanced calculations
			temperature,
			windSpeed,
			relativeHumidity,
			location,
		} = environmentalData;

		// Step 1: Find appropriate Kc value for growth stage (FAO-56 methodology)
		let baseKcValue = 1.0; // Default fallback
		let kcPeriodUsed = null;

		if (cropData.kcPeriods && cropData.kcPeriods.length > 0) {
			// Find Kc for current growth stage based on BBCH stages
			kcPeriodUsed =
				cropData.kcPeriods.find((period) =>
					period.periodName.toLowerCase().includes(growthStage.toLowerCase())
				) || cropData.kcPeriods[0]; // Fallback to first period

			baseKcValue = kcPeriodUsed.kcValue;
		}

		// Step 2: Apply Week 2 enhanced regional climate adjustments for GCC/MENA
		const climateAdjustment =
			this.constants.CLIMATE_ADJUSTMENTS[climateZone] ||
			this.constants.CLIMATE_ADJUSTMENTS.temperate;

		let adjustedKc = baseKcValue * climateAdjustment.kcMultiplier;

		// Step 3: Apply irrigation method adjustments (FAO-56 Table 17)
		let irrigationAdjustmentFactor = 1.0;
		if (irrigationMethod === "drip") {
			irrigationAdjustmentFactor = 0.9; // 10% reduction for drip irrigation
		} else if (irrigationMethod === "sprinkler") {
			irrigationAdjustmentFactor = 1.0; // No adjustment for sprinkler
		} else if (irrigationMethod === "surface") {
			irrigationAdjustmentFactor = 1.05; // 5% increase for surface irrigation
		}

		adjustedKc *= irrigationAdjustmentFactor;

		// Step 4: Apply soil-crop compatibility adjustment (Week 2 enhancement)
		adjustedKc *= compatibilityResults.adjustmentFactor;

		// Step 5: Additional environmental adjustments based on FlahaCalc data (Week 2)
		let environmentalAdjustments = {
			temperatureBoost: 1.0,
			windSpeedBoost: 1.0,
			humidityBoost: 1.0,
		};

		if (temperature && windSpeed && relativeHumidity) {
			// High temperature adjustment (>35°C) - increases ET demand
			if (temperature > 35) {
				environmentalAdjustments.temperatureBoost = 1.05;
				adjustedKc *= 1.05;
			}

			// High wind speed adjustment (>5 m/s) - increases ET demand
			if (windSpeed > 5) {
				environmentalAdjustments.windSpeedBoost = 1.03;
				adjustedKc *= 1.03;
			}

			// Low humidity adjustment (<20%) - increases ET demand
			if (relativeHumidity < 20) {
				environmentalAdjustments.humidityBoost = 1.08;
				adjustedKc *= 1.08;
			}
		}

		// Step 6: Calculate ETc using FAO-56 formula: ETc = ET₀ × Kc
		const etc = (et0 || 5.0) * adjustedKc;

		return {
			// Core FAO-56 calculation
			etc: Math.round(etc * 100) / 100,
			et0Used: et0 || 5.0,
			kcUsed: Math.round(adjustedKc * 100) / 100,

			// Detailed breakdown for transparency
			baseKc: Math.round(baseKcValue * 100) / 100,
			kcPeriodUsed: kcPeriodUsed?.periodName || "default",

			// Week 2 enhancements
			climateAdjustment: {
				zone: climateZone,
				multiplier: climateAdjustment.kcMultiplier,
			},
			irrigationAdjustment: {
				method: irrigationMethod,
				factor: irrigationAdjustmentFactor,
			},
			compatibilityAdjustment: compatibilityResults.adjustmentFactor,
			environmentalAdjustments,

			// FlahaCalc integration data
			flahacalcData: {
				temperature,
				windSpeed,
				relativeHumidity,
				location,
				dataSource: "FlahaCalc API",
			},

			// Methodology reference
			methodology:
				"FAO-56 (Allen et al., 1998) with GCC/MENA regional adjustments",
		};
	}

	/**
	 * Legacy method for backward compatibility - Enhanced for Week 2
	 * Now uses enhanced calculation with default compatibility
	 */
	calculateETc(environmentalData, cropData) {
		// Use enhanced method with default compatibility for backward compatibility
		const defaultCompatibility = {
			adjustmentFactor: 1.0,
			soilTexture: "loamy",
			compatibilityScore: 1.0,
			suitabilityRating: "Good",
		};
		return this.calculateETcEnhanced(
			environmentalData,
			cropData,
			defaultCompatibility
		);
	}

	/**
	 * Calculate irrigation requirements based on soil water characteristics
	 */
	calculateIrrigationRequirements(
		soilData,
		etcResults,
		fieldConfig,
		environmentalData
	) {
		const { fieldCapacity, wiltingPoint, saturatedConductivity } = soilData;
		const { etc } = etcResults;
		const { area } = fieldConfig;

		// Calculate plant available water (PAW)
		const paw = fieldCapacity - wiltingPoint; // % by volume

		// Assume root depth based on crop (default 1.0m)
		const rootDepth = 1000; // mm (1 meter)

		// Calculate total available water in root zone
		const totalAvailableWater = (paw / 100) * rootDepth; // mm

		// Calculate irrigation depth (50% depletion)
		const irrigationDepth =
			totalAvailableWater * this.constants.DEFAULT_DEPLETION_FRACTION;

		// Calculate irrigation frequency
		const frequency = Math.max(1, Math.round(irrigationDepth / etc));

		// Maximum application rate (limited by infiltration rate)
		const maxApplicationRate = Math.min(saturatedConductivity, 25); // mm/hr limit

		// Calculate application time
		const applicationTime = irrigationDepth / maxApplicationRate; // hours

		return {
			irrigationDepth: Math.round(irrigationDepth * 10) / 10,
			frequency: frequency,
			maxApplicationRate: Math.round(maxApplicationRate * 10) / 10,
			applicationTime: Math.round(applicationTime * 10) / 10,
			totalAvailableWater: Math.round(totalAvailableWater * 10) / 10,
			pawUsed: Math.round(paw * 10) / 10,
			rootDepthUsed: rootDepth,
		};
	}

	/**
	 * Recommend irrigation system based on soil and field characteristics
	 */
	recommendIrrigationSystem(soilData, irrigationResults, fieldConfig) {
		const { textureClass, saturatedConductivity } = soilData;
		const { area } = fieldConfig;
		const { maxApplicationRate } = irrigationResults;

		let recommendedSystem = "sprinkler";
		let efficiency = 0.75;
		let reasoning = [];

		// Decision logic based on soil characteristics
		if (
			textureClass.toLowerCase().includes("sand") &&
			saturatedConductivity > 25
		) {
			recommendedSystem = "drip";
			efficiency = 0.9;
			reasoning.push(
				"Sandy soil with high infiltration rate - drip irrigation recommended"
			);
		} else if (saturatedConductivity < 5) {
			recommendedSystem = "surface";
			efficiency = 0.6;
			reasoning.push("Low infiltration rate - surface irrigation suitable");
		} else if (area > 10) {
			recommendedSystem = "sprinkler";
			efficiency = 0.75;
			reasoning.push("Large field area - sprinkler system efficient");
		} else {
			recommendedSystem = "drip";
			efficiency = 0.85;
			reasoning.push(
				"Medium field with moderate infiltration - drip system optimal"
			);
		}

		// Calculate estimated cost
		const costPerHectare = this.constants.SYSTEM_COSTS[recommendedSystem];
		const estimatedCost = costPerHectare * area;

		return {
			recommendedSystem,
			efficiency,
			estimatedCost: Math.round(estimatedCost),
			costPerHectare,
			reasoning,
			alternatives: this.getAlternativeSystems(recommendedSystem, area),
		};
	}

	/**
	 * Calculate economic analysis and ROI
	 */
	calculateEconomicAnalysis(systemResults, irrigationResults, fieldConfig) {
		const { estimatedCost, efficiency } = systemResults;
		const { irrigationDepth, frequency } = irrigationResults;
		const { area } = fieldConfig;

		// Calculate annual water usage
		const irrigationsPerYear = Math.round(365 / frequency);
		const annualWaterUse =
			(irrigationDepth / 1000) * area * 10000 * irrigationsPerYear; // m³/year

		// Calculate water savings compared to less efficient system
		const baselineEfficiency = 0.6; // Surface irrigation baseline
		const waterSavings =
			annualWaterUse *
			(1 - baselineEfficiency) *
			(efficiency - baselineEfficiency);

		// Calculate cost savings
		const annualWaterCostSavings =
			waterSavings * this.constants.WATER_COST_PER_M3;

		// Estimate yield increase (5-15% typical)
		const yieldIncrease = 0.1; // 10% yield increase
		const estimatedYieldValue = area * 2000; // $2000/hectare baseline yield value
		const annualYieldIncrease = estimatedYieldValue * yieldIncrease;

		// Total annual savings
		const totalAnnualSavings = annualWaterCostSavings + annualYieldIncrease;

		// Calculate ROI metrics
		const paybackPeriod = estimatedCost / totalAnnualSavings;
		const roi =
			((totalAnnualSavings * 10 - estimatedCost) / estimatedCost) * 100; // 10-year ROI

		return {
			annualWaterSavings: Math.round(waterSavings),
			annualCostSavings: Math.round(totalAnnualSavings),
			paybackPeriod: Math.round(paybackPeriod * 10) / 10,
			roi: Math.round(roi),
			waterCostSavings: Math.round(annualWaterCostSavings),
			yieldValueIncrease: Math.round(annualYieldIncrease),
			annualWaterUse: Math.round(annualWaterUse),
		};
	}

	/**
	 * Generate irrigation schedule recommendations
	 */
	generateIrrigationSchedule(irrigationResults, environmentalData) {
		const { irrigationDepth, frequency } = irrigationResults;
		const { etc } = environmentalData;

		// Generate weekly schedule
		const schedule = [];
		for (let week = 1; week <= 4; week++) {
			const irrigationDay = Math.round(frequency * (week - 1)) % 7 || 7;
			schedule.push({
				week,
				irrigationDay,
				dayName: [
					"Sunday",
					"Monday",
					"Tuesday",
					"Wednesday",
					"Thursday",
					"Friday",
					"Saturday",
				][irrigationDay - 1],
				depth: irrigationDepth,
				duration: Math.round((irrigationDepth / 10) * 60), // minutes (assuming 10mm/hr rate)
				notes: `Apply ${irrigationDepth}mm irrigation`,
			});
		}

		return {
			schedule,
			frequency: `Every ${frequency} days`,
			optimalTiming: "Early morning (6-8 AM) for best efficiency",
			seasonalAdjustments:
				"Increase frequency by 20% in summer, decrease by 30% in winter",
		};
	}

	/**
	 * Generate text recommendations
	 */
	generateRecommendations(irrigationResults, systemResults, economicResults) {
		const recommendations = [];

		// Irrigation recommendations
		recommendations.push({
			category: "Irrigation Management",
			priority: "High",
			title: `Apply ${irrigationResults.irrigationDepth}mm every ${irrigationResults.frequency} days`,
			description: `Based on soil water holding capacity and crop water requirements, irrigate when 50% of available water is depleted.`,
			implementation:
				"Monitor soil moisture and adjust timing based on weather conditions.",
		});

		// System recommendations
		recommendations.push({
			category: "System Design",
			priority: "High",
			title: `${
				systemResults.recommendedSystem.charAt(0).toUpperCase() +
				systemResults.recommendedSystem.slice(1)
			} irrigation system recommended`,
			description: `This system offers ${Math.round(
				systemResults.efficiency * 100
			)}% efficiency and is optimal for your soil conditions.`,
			implementation: `Estimated investment: $${systemResults.estimatedCost.toLocaleString()}`,
		});

		// Economic recommendations
		if (economicResults.roi > 50) {
			recommendations.push({
				category: "Economic",
				priority: "Medium",
				title: `Excellent ROI potential: ${economicResults.roi}%`,
				description: `Investment will pay back in ${
					economicResults.paybackPeriod
				} years with annual savings of $${economicResults.annualCostSavings.toLocaleString()}.`,
				implementation:
					"Consider financing options to accelerate implementation.",
			});
		}

		return recommendations;
	}

	/**
	 * Get alternative irrigation systems
	 */
	getAlternativeSystems(recommended, area) {
		const systems = ["drip", "sprinkler", "surface"];
		return systems
			.filter((system) => system !== recommended)
			.map((system) => ({
				type: system,
				efficiency:
					system === "drip" ? 0.9 : system === "sprinkler" ? 0.75 : 0.6,
				estimatedCost: this.constants.SYSTEM_COSTS[system] * area,
				suitability: this.getSystemSuitability(system, area),
			}));
	}

	/**
	 * Get system suitability rating
	 */
	getSystemSuitability(system, area) {
		if (system === "drip") {
			return area < 5 ? "High" : area < 20 ? "Medium" : "Low";
		} else if (system === "sprinkler") {
			return area > 2 ? "High" : "Medium";
		} else {
			return area > 10 ? "Medium" : "Low";
		}
	}

	/**
	 * Week 4: Enhanced System Recommendations with detailed analysis
	 * Provides comprehensive irrigation system recommendations with comparison
	 */
	generateSystemRecommendations(
		soilData,
		irrigationResults,
		fieldConfig,
		compatibilityResults
	) {
		const { sand, clay, silt, textureClass, saturatedConductivity } = soilData;
		const { area, slope = 0, elevation = 0 } = fieldConfig;
		const { irrigationDepth, maxApplicationRate, frequency } =
			irrigationResults;

		// Analyze all three main irrigation systems
		const systemAnalysis = {
			drip: this.analyzeDripSystem(soilData, irrigationResults, fieldConfig),
			sprinkler: this.analyzeSprinklerSystem(
				soilData,
				irrigationResults,
				fieldConfig
			),
			surface: this.analyzeSurfaceSystem(
				soilData,
				irrigationResults,
				fieldConfig
			),
		};

		// Determine best system based on comprehensive scoring
		const systemScores = this.calculateSystemScores(
			systemAnalysis,
			compatibilityResults
		);
		const recommendedSystem = this.selectOptimalSystem(systemScores);

		// Generate detailed comparison
		const systemComparison = this.generateSystemComparison(
			systemAnalysis,
			systemScores
		);

		return {
			recommendedSystem: recommendedSystem.type,
			recommendedDetails: recommendedSystem,
			systemAnalysis,
			systemComparison,
			implementationPlan: this.generateImplementationPlan(
				recommendedSystem,
				fieldConfig
			),
			maintenanceSchedule: this.generateMaintenanceSchedule(
				recommendedSystem.type
			),
			performanceMetrics: this.calculatePerformanceMetrics(
				recommendedSystem,
				irrigationResults
			),
		};
	}

	/**
	 * Week 4: Analyze Drip Irrigation System
	 */
	analyzeDripSystem(soilData, irrigationResults, fieldConfig) {
		const { area, slope = 0 } = fieldConfig;
		const { saturatedConductivity } = soilData;

		const efficiency = 0.9; // 90% efficiency for drip
		const costPerHectare = this.constants.SYSTEM_COSTS.drip;
		const totalCost = costPerHectare * area;

		// Drip system advantages/disadvantages
		const advantages = [
			"Highest water use efficiency (90%)",
			"Precise water application",
			"Reduced weed growth",
			"Lower labor requirements",
			"Suitable for irregular terrain",
		];

		const disadvantages = [
			"Higher initial investment",
			"Requires filtration system",
			"Potential for clogging",
			"Limited to row crops",
		];

		// Suitability scoring
		let suitabilityScore = 70; // Base score

		// Soil texture bonus
		if (soilData.sand > 60) suitabilityScore += 15; // Sandy soils benefit from drip
		if (soilData.clay > 40) suitabilityScore -= 10; // Clay soils less ideal

		// Field size consideration
		if (area < 5) suitabilityScore += 10; // Small fields ideal for drip
		if (area > 20) suitabilityScore -= 5; // Large fields less cost-effective

		// Slope consideration
		if (slope > 5) suitabilityScore += 5; // Drip handles slopes well

		return {
			type: "drip",
			efficiency,
			costPerHectare,
			totalCost,
			advantages,
			disadvantages,
			suitabilityScore: Math.min(100, Math.max(0, suitabilityScore)),
			technicalSpecs: {
				emitterSpacing: "30-60 cm",
				operatingPressure: "1.0-2.5 bar",
				flowRate: "2-8 L/hr per emitter",
				filterRequirement: "Essential (120-200 mesh)",
			},
		};
	}

	/**
	 * Week 4: Analyze Sprinkler Irrigation System
	 */
	analyzeSprinklerSystem(soilData, irrigationResults, fieldConfig) {
		const { area, slope = 0 } = fieldConfig;
		const { maxApplicationRate } = irrigationResults;

		const efficiency = 0.75; // 75% efficiency for sprinkler
		const costPerHectare = this.constants.SYSTEM_COSTS.sprinkler;
		const totalCost = costPerHectare * area;

		const advantages = [
			"Good water distribution uniformity",
			"Suitable for most crops",
			"Moderate investment cost",
			"Easy automation",
			"Good for large areas",
		];

		const disadvantages = [
			"Wind affects distribution",
			"Higher energy requirements",
			"Water loss to evaporation",
			"Not suitable for very sandy soils",
		];

		// Suitability scoring
		let suitabilityScore = 75; // Base score

		// Soil texture consideration
		if (soilData.sand > 70) suitabilityScore -= 15; // Very sandy soils problematic
		if (soilData.clay > 30 && soilData.clay < 50) suitabilityScore += 10; // Good for medium clay

		// Field size bonus
		if (area > 5 && area < 50) suitabilityScore += 15; // Optimal size range

		// Application rate check
		if (maxApplicationRate < 10) suitabilityScore -= 10; // Low infiltration problematic

		return {
			type: "sprinkler",
			efficiency,
			costPerHectare,
			totalCost,
			advantages,
			disadvantages,
			suitabilityScore: Math.min(100, Math.max(0, suitabilityScore)),
			technicalSpecs: {
				sprinklerSpacing: "12-18 m",
				operatingPressure: "2.5-4.0 bar",
				applicationRate: "10-25 mm/hr",
				windLimitation: "Max 15 km/hr",
			},
		};
	}

	/**
	 * Week 4: Analyze Surface Irrigation System
	 */
	analyzeSurfaceSystem(soilData, irrigationResults, fieldConfig) {
		const { area, slope = 0 } = fieldConfig;
		const { saturatedConductivity } = soilData;

		const efficiency = 0.6; // 60% efficiency for surface
		const costPerHectare = this.constants.SYSTEM_COSTS.surface;
		const totalCost = costPerHectare * area;

		const advantages = [
			"Lowest initial investment",
			"Simple operation",
			"No energy requirements",
			"Suitable for large fields",
			"Good for clay soils",
		];

		const disadvantages = [
			"Lowest water use efficiency",
			"High labor requirements",
			"Uneven water distribution",
			"Requires land leveling",
			"Water logging risk",
		];

		// Suitability scoring
		let suitabilityScore = 50; // Base score

		// Soil texture consideration
		if (soilData.clay > 40) suitabilityScore += 20; // Clay soils ideal
		if (soilData.sand > 60) suitabilityScore -= 20; // Sandy soils problematic

		// Field size consideration
		if (area > 10) suitabilityScore += 15; // Large fields benefit

		// Slope consideration
		if (slope > 2) suitabilityScore -= 15; // Steep slopes problematic
		if (slope < 0.5) suitabilityScore += 10; // Flat fields ideal

		return {
			type: "surface",
			efficiency,
			costPerHectare,
			totalCost,
			advantages,
			disadvantages,
			suitabilityScore: Math.min(100, Math.max(0, suitabilityScore)),
			technicalSpecs: {
				fieldSlope: "0.1-2.0%",
				furrowLength: "100-400 m",
				infiltrationRate: "5-50 mm/hr",
				landLeveling: "Required (±2 cm)",
			},
		};
	}

	/**
	 * Week 4: Calculate comprehensive system scores
	 */
	calculateSystemScores(systemAnalysis, compatibilityResults) {
		const scores = {};

		Object.keys(systemAnalysis).forEach((systemType) => {
			const system = systemAnalysis[systemType];

			// Multi-criteria scoring (0-100 scale)
			const criteria = {
				suitability: system.suitabilityScore * 0.3, // 30% weight
				efficiency: system.efficiency * 100 * 0.25, // 25% weight
				costEffectiveness: this.calculateCostEffectiveness(system) * 0.25, // 25% weight
				maintenance: this.getMaintenanceScore(systemType) * 0.2, // 20% weight
			};

			const totalScore = Object.values(criteria).reduce(
				(sum, score) => sum + score,
				0
			);

			scores[systemType] = {
				totalScore: Math.round(totalScore),
				criteria,
				ranking: 0, // Will be set after comparison
				recommendation: this.getScoreRecommendation(totalScore),
			};
		});

		// Set rankings
		const sortedSystems = Object.entries(scores).sort(
			(a, b) => b[1].totalScore - a[1].totalScore
		);
		sortedSystems.forEach(([systemType, score], index) => {
			scores[systemType].ranking = index + 1;
		});

		return scores;
	}

	/**
	 * Week 4: Calculate cost effectiveness score
	 */
	calculateCostEffectiveness(system) {
		// Lower cost per unit efficiency = higher score
		const costPerEfficiency = system.costPerHectare / (system.efficiency * 100);

		// Normalize to 0-100 scale (lower cost = higher score)
		if (costPerEfficiency < 50) return 100;
		if (costPerEfficiency < 100) return 80;
		if (costPerEfficiency < 200) return 60;
		if (costPerEfficiency < 300) return 40;
		return 20;
	}

	/**
	 * Week 4: Get maintenance complexity score
	 */
	getMaintenanceScore(systemType) {
		const maintenanceScores = {
			surface: 90, // Low maintenance
			sprinkler: 70, // Medium maintenance
			drip: 50, // High maintenance (filtration, clogging)
		};
		return maintenanceScores[systemType] || 70;
	}

	/**
	 * Week 4: Get score-based recommendation
	 */
	getScoreRecommendation(score) {
		if (score >= 80) return "Highly Recommended";
		if (score >= 70) return "Recommended";
		if (score >= 60) return "Suitable";
		if (score >= 50) return "Consider with Caution";
		return "Not Recommended";
	}

	/**
	 * Week 4: Select optimal system based on scores
	 */
	selectOptimalSystem(systemScores) {
		const bestSystem = Object.entries(systemScores).sort(
			(a, b) => b[1].totalScore - a[1].totalScore
		)[0];

		return {
			type: bestSystem[0],
			score: bestSystem[1],
			confidence: this.calculateConfidence(bestSystem[1].totalScore),
			reasoning: this.generateSelectionReasoning(bestSystem[0], bestSystem[1]),
		};
	}

	/**
	 * Week 4: Calculate confidence level
	 */
	calculateConfidence(score) {
		if (score >= 85) return "Very High";
		if (score >= 75) return "High";
		if (score >= 65) return "Medium";
		if (score >= 55) return "Low";
		return "Very Low";
	}

	/**
	 * Week 4: Generate selection reasoning
	 */
	generateSelectionReasoning(systemType, scoreData) {
		const reasons = [];

		if (scoreData.criteria.suitability > 25) {
			reasons.push("Excellent soil-system compatibility");
		}
		if (scoreData.criteria.efficiency > 20) {
			reasons.push("High water use efficiency");
		}
		if (scoreData.criteria.costEffectiveness > 20) {
			reasons.push("Good cost-effectiveness ratio");
		}
		if (scoreData.criteria.maintenance > 15) {
			reasons.push("Low maintenance requirements");
		}

		return reasons.length > 0
			? reasons
			: ["Selected based on overall performance"];
	}

	/**
	 * Week 4: Generate comprehensive system comparison
	 */
	generateSystemComparison(systemAnalysis, systemScores) {
		const comparison = {
			summary: {
				totalSystems: Object.keys(systemAnalysis).length,
				bestSystem: Object.entries(systemScores).sort(
					(a, b) => b[1].totalScore - a[1].totalScore
				)[0][0],
				scoreRange: {
					highest: Math.max(
						...Object.values(systemScores).map((s) => s.totalScore)
					),
					lowest: Math.min(
						...Object.values(systemScores).map((s) => s.totalScore)
					),
				},
			},
			detailedComparison: {},
			recommendations: [],
		};

		// Create detailed comparison matrix
		Object.keys(systemAnalysis).forEach((systemType) => {
			const system = systemAnalysis[systemType];
			const score = systemScores[systemType];

			comparison.detailedComparison[systemType] = {
				...system,
				score: score.totalScore,
				ranking: score.ranking,
				recommendation: score.recommendation,
				pros: system.advantages.slice(0, 3), // Top 3 advantages
				cons: system.disadvantages.slice(0, 3), // Top 3 disadvantages
				bestFor: this.getBestUseCase(systemType),
				investmentLevel: this.getInvestmentLevel(system.costPerHectare),
			};
		});

		// Generate comparison recommendations
		comparison.recommendations = this.generateComparisonRecommendations(
			systemAnalysis,
			systemScores
		);

		return comparison;
	}

	/**
	 * Week 4: Get best use case for each system
	 */
	getBestUseCase(systemType) {
		const useCases = {
			drip: "Small to medium fields with high-value crops",
			sprinkler: "Medium to large fields with uniform terrain",
			surface: "Large fields with clay soils and low slopes",
		};
		return useCases[systemType] || "General irrigation applications";
	}

	/**
	 * Week 4: Get investment level classification
	 */
	getInvestmentLevel(costPerHectare) {
		if (costPerHectare < 2000) return "Low";
		if (costPerHectare < 5000) return "Medium";
		if (costPerHectare < 8000) return "High";
		return "Very High";
	}

	/**
	 * Week 4: Generate comparison recommendations
	 */
	generateComparisonRecommendations(systemAnalysis, systemScores) {
		const recommendations = [];
		const sortedSystems = Object.entries(systemScores).sort(
			(a, b) => b[1].totalScore - a[1].totalScore
		);

		// Primary recommendation
		const bestSystem = sortedSystems[0];
		recommendations.push({
			type: "primary",
			title: `${
				bestSystem[0].charAt(0).toUpperCase() + bestSystem[0].slice(1)
			} System Recommended`,
			description: `Score: ${bestSystem[1].totalScore}/100 - ${bestSystem[1].recommendation}`,
			reasoning: bestSystem[1].criteria,
		});

		// Alternative recommendation if scores are close
		if (sortedSystems.length > 1) {
			const secondBest = sortedSystems[1];
			const scoreDifference =
				bestSystem[1].totalScore - secondBest[1].totalScore;

			if (scoreDifference < 10) {
				recommendations.push({
					type: "alternative",
					title: `Consider ${
						secondBest[0].charAt(0).toUpperCase() + secondBest[0].slice(1)
					} as Alternative`,
					description: `Score: ${secondBest[1].totalScore}/100 - Only ${scoreDifference} points difference`,
					reasoning: "Close scoring suggests both systems are viable options",
				});
			}
		}

		// Budget consideration
		const lowestCost = Math.min(
			...Object.values(systemAnalysis).map((s) => s.totalCost)
		);
		const lowestCostSystem = Object.entries(systemAnalysis).find(
			([_, system]) => system.totalCost === lowestCost
		);

		if (lowestCostSystem && lowestCostSystem[0] !== bestSystem[0]) {
			recommendations.push({
				type: "budget",
				title: `Budget Option: ${
					lowestCostSystem[0].charAt(0).toUpperCase() +
					lowestCostSystem[0].slice(1)
				}`,
				description: `Lowest cost: $${lowestCost.toLocaleString()}`,
				reasoning: "Consider if budget constraints are primary concern",
			});
		}

		return recommendations;
	}

	/**
	 * Week 4: Generate implementation plan
	 */
	generateImplementationPlan(recommendedSystem, fieldConfig) {
		const { area } = fieldConfig;
		const systemType = recommendedSystem.type;

		const phases = [];

		// Phase 1: Planning and Design
		phases.push({
			phase: 1,
			title: "Planning and Design",
			duration: "2-4 weeks",
			tasks: [
				"Detailed site survey and soil analysis",
				"System design and component specification",
				"Permit applications and approvals",
				"Contractor selection and quotes",
			],
			cost: recommendedSystem.score.criteria.costEffectiveness * 100, // Rough estimate
			deliverables: [
				"System design drawings",
				"Component specifications",
				"Installation timeline",
			],
		});

		// Phase 2: Site Preparation
		phases.push({
			phase: 2,
			title: "Site Preparation",
			duration: this.getSitePreparationDuration(systemType, area),
			tasks: this.getSitePreparationTasks(systemType),
			cost: area * 200, // $200 per hectare for site prep
			deliverables: ["Prepared installation site", "Infrastructure ready"],
		});

		// Phase 3: Installation
		phases.push({
			phase: 3,
			title: "System Installation",
			duration: this.getInstallationDuration(systemType, area),
			tasks: this.getInstallationTasks(systemType),
			cost: recommendedSystem.score.totalScore * 50, // Based on system complexity
			deliverables: ["Installed irrigation system", "Initial system testing"],
		});

		// Phase 4: Testing and Commissioning
		phases.push({
			phase: 4,
			title: "Testing and Commissioning",
			duration: "1-2 weeks",
			tasks: [
				"System pressure testing",
				"Flow rate calibration",
				"Automation setup and testing",
				"Operator training",
			],
			cost: 1000, // Fixed cost for testing
			deliverables: [
				"Commissioned system",
				"Training documentation",
				"Warranty activation",
			],
		});

		const totalDuration = this.calculateTotalDuration(phases);
		const totalCost = phases.reduce((sum, phase) => sum + phase.cost, 0);

		return {
			phases,
			summary: {
				totalDuration,
				totalCost: Math.round(totalCost),
				criticalPath: this.identifyCriticalPath(phases),
				riskFactors: this.identifyRiskFactors(systemType, area),
			},
		};
	}

	/**
	 * Week 4: Enhanced Economic Analysis Basic
	 */
	calculateEconomicAnalysisBasic(
		systemRecommendations,
		irrigationResults,
		fieldConfig
	) {
		const { area } = fieldConfig;
		const { recommendedDetails } = systemRecommendations;

		// Basic ROI Calculator
		const roiCalculation = this.calculateBasicROI(recommendedDetails, area);

		// Payback Period Estimation
		const paybackAnalysis = this.calculatePaybackPeriod(
			recommendedDetails,
			roiCalculation
		);

		// Water Cost Savings Calculator
		const waterSavings = this.calculateWaterCostSavings(
			recommendedDetails,
			irrigationResults,
			area
		);

		// Cost-Benefit Display
		const costBenefitAnalysis = this.generateCostBenefitDisplay(
			roiCalculation,
			waterSavings,
			paybackAnalysis
		);

		return {
			roiCalculation,
			paybackAnalysis,
			waterSavings,
			costBenefitAnalysis,
			summary: {
				totalInvestment: recommendedDetails.totalCost,
				annualSavings: roiCalculation.annualSavings,
				paybackYears: paybackAnalysis.paybackPeriod,
				roi10Year: roiCalculation.roi10Year,
				recommendation: this.getEconomicRecommendation(
					roiCalculation,
					paybackAnalysis
				),
			},
		};
	}

	/**
	 * Week 4: Calculate Basic ROI
	 */
	calculateBasicROI(systemDetails, area) {
		const { totalCost, efficiency } = systemDetails;

		// Annual water savings (compared to 60% efficient baseline)
		const baselineEfficiency = 0.6;
		const waterSavingsPercent =
			(efficiency - baselineEfficiency) / baselineEfficiency;

		// Estimated annual water cost (baseline)
		const annualWaterCostBaseline = area * 500; // $500 per hectare baseline
		const annualWaterSavings = annualWaterCostBaseline * waterSavingsPercent;

		// Yield improvement (5-15% typical for efficient irrigation)
		const yieldImprovement = 0.1; // 10% average
		const annualYieldValue = area * 2000; // $2000 per hectare baseline yield
		const annualYieldIncrease = annualYieldValue * yieldImprovement;

		// Labor savings (especially for drip systems)
		const laborSavingsPercent =
			systemDetails.type === "drip"
				? 0.3
				: systemDetails.type === "sprinkler"
				? 0.2
				: 0.1;
		const annualLaborCost = area * 300; // $300 per hectare baseline
		const annualLaborSavings = annualLaborCost * laborSavingsPercent;

		// Total annual savings
		const totalAnnualSavings =
			annualWaterSavings + annualYieldIncrease + annualLaborSavings;

		// ROI calculations
		const roi1Year = ((totalAnnualSavings - totalCost) / totalCost) * 100;
		const roi5Year = ((totalAnnualSavings * 5 - totalCost) / totalCost) * 100;
		const roi10Year = ((totalAnnualSavings * 10 - totalCost) / totalCost) * 100;

		return {
			totalInvestment: totalCost,
			annualSavings: Math.round(totalAnnualSavings),
			waterSavings: Math.round(annualWaterSavings),
			yieldIncrease: Math.round(annualYieldIncrease),
			laborSavings: Math.round(annualLaborSavings),
			roi1Year: Math.round(roi1Year),
			roi5Year: Math.round(roi5Year),
			roi10Year: Math.round(roi10Year),
			breakdownPercentages: {
				water: Math.round((annualWaterSavings / totalAnnualSavings) * 100),
				yield: Math.round((annualYieldIncrease / totalAnnualSavings) * 100),
				labor: Math.round((annualLaborSavings / totalAnnualSavings) * 100),
			},
		};
	}

	/**
	 * Week 4: Calculate Payback Period
	 */
	calculatePaybackPeriod(systemDetails, roiCalculation) {
		const { totalCost } = systemDetails;
		const { annualSavings } = roiCalculation;

		// Simple payback period
		const simplePayback = totalCost / annualSavings;

		// Discounted payback (assuming 5% discount rate)
		const discountRate = 0.05;
		let discountedPayback = 0;
		let cumulativeDiscountedSavings = 0;

		for (let year = 1; year <= 20; year++) {
			const discountedSavings =
				annualSavings / Math.pow(1 + discountRate, year);
			cumulativeDiscountedSavings += discountedSavings;

			if (cumulativeDiscountedSavings >= totalCost) {
				discountedPayback = year;
				break;
			}
		}

		return {
			paybackPeriod: Math.round(simplePayback * 10) / 10,
			discountedPayback: discountedPayback || 20, // Max 20 years
			monthsToPayback: Math.round(simplePayback * 12),
			paybackRating: this.getPaybackRating(simplePayback),
			cashFlowProjection: this.generateCashFlowProjection(
				totalCost,
				annualSavings,
				10
			),
		};
	}

	/**
	 * Week 4: Calculate Water Cost Savings
	 */
	calculateWaterCostSavings(systemDetails, irrigationResults, area) {
		const { efficiency } = systemDetails;
		const { irrigationDepth, frequency } = irrigationResults;

		// Annual water usage calculation
		const irrigationsPerYear = Math.round(365 / frequency);
		const annualWaterDepth = irrigationDepth * irrigationsPerYear; // mm/year
		const annualWaterVolume = (annualWaterDepth / 1000) * area * 10000; // m³/year

		// Water cost savings compared to baseline (60% efficiency)
		const baselineEfficiency = 0.6;
		const baselineWaterVolume =
			(annualWaterVolume / efficiency) * baselineEfficiency;
		const waterSaved = baselineWaterVolume - annualWaterVolume; // m³/year

		// Cost calculations
		const waterCostPerM3 = this.constants.WATER_COST_PER_M3 || 0.5; // $0.50 per m³
		const annualWaterCostSavings = waterSaved * waterCostPerM3;

		// 10-year projection
		const waterCostInflation = 0.03; // 3% annual inflation
		let cumulativeWaterSavings = 0;
		const yearlyProjection = [];

		for (let year = 1; year <= 10; year++) {
			const inflatedCost =
				waterCostPerM3 * Math.pow(1 + waterCostInflation, year - 1);
			const yearlySavings = waterSaved * inflatedCost;
			cumulativeWaterSavings += yearlySavings;

			yearlyProjection.push({
				year,
				waterSaved: Math.round(waterSaved),
				costPerM3: Math.round(inflatedCost * 100) / 100,
				annualSavings: Math.round(yearlySavings),
				cumulativeSavings: Math.round(cumulativeWaterSavings),
			});
		}

		return {
			annualWaterSaved: Math.round(waterSaved),
			annualCostSavings: Math.round(annualWaterCostSavings),
			cumulativeSavings10Year: Math.round(cumulativeWaterSavings),
			efficiencyImprovement: Math.round(
				(efficiency - baselineEfficiency) * 100
			),
			yearlyProjection,
			waterConservationImpact: {
				dailyWaterSaved: Math.round(waterSaved / 365),
				percentageReduction: Math.round(
					((baselineWaterVolume - annualWaterVolume) / baselineWaterVolume) *
						100
				),
				environmentalBenefit:
					"Reduced groundwater depletion and energy consumption",
			},
		};
	}

	// Week 4: Helper methods for implementation planning and economic analysis

	getSitePreparationDuration(systemType, area) {
		const baseDuration =
			systemType === "surface"
				? "3-6 weeks"
				: systemType === "sprinkler"
				? "2-4 weeks"
				: "1-3 weeks";
		return area > 10
			? baseDuration.replace(/(\d+)/g, (match) => parseInt(match) + 1)
			: baseDuration;
	}

	getSitePreparationTasks(systemType) {
		const commonTasks = [
			"Site survey and marking",
			"Utility location and marking",
		];

		if (systemType === "drip") {
			return [
				...commonTasks,
				"Filtration system installation",
				"Main line trenching",
			];
		} else if (systemType === "sprinkler") {
			return [
				...commonTasks,
				"Pump station preparation",
				"Main pipeline installation",
			];
		} else {
			return [
				...commonTasks,
				"Land leveling and grading",
				"Channel construction",
			];
		}
	}

	getInstallationDuration(systemType, area) {
		const baseWeeks =
			systemType === "drip" ? 2 : systemType === "sprinkler" ? 3 : 4;
		const additionalWeeks = Math.floor(area / 5); // 1 week per 5 hectares
		return `${baseWeeks + additionalWeeks}-${
			baseWeeks + additionalWeeks + 2
		} weeks`;
	}

	getInstallationTasks(systemType) {
		if (systemType === "drip") {
			return [
				"Drip line installation",
				"Emitter placement and testing",
				"Control valve installation",
				"System pressure testing",
			];
		} else if (systemType === "sprinkler") {
			return [
				"Sprinkler head installation",
				"Lateral line connection",
				"Control system setup",
				"Coverage pattern testing",
			];
		} else {
			return [
				"Channel lining installation",
				"Gate and control structure installation",
				"Drainage system setup",
				"Flow measurement setup",
			];
		}
	}

	calculateTotalDuration(phases) {
		// Simplified calculation - assumes some overlap
		const totalWeeks = phases.reduce((sum, phase) => {
			const weeks = parseInt(
				phase.duration.split("-")[1] || phase.duration.split("-")[0]
			);
			return sum + weeks;
		}, 0);
		return `${Math.round(totalWeeks * 0.8)}-${totalWeeks} weeks`; // 20% overlap
	}

	identifyCriticalPath(phases) {
		return phases.map((phase) => phase.title).join(" → ");
	}

	identifyRiskFactors(systemType, area) {
		const risks = [];

		if (systemType === "drip") {
			risks.push("Water quality and filtration requirements");
			risks.push("Emitter clogging potential");
		} else if (systemType === "sprinkler") {
			risks.push("Wind interference with distribution");
			risks.push("Energy cost fluctuations");
		} else {
			risks.push("Soil erosion and runoff");
			risks.push("Uneven water distribution");
		}

		if (area > 20) {
			risks.push("Large scale coordination challenges");
		}

		return risks;
	}

	getPaybackRating(paybackPeriod) {
		if (paybackPeriod < 3) return "Excellent";
		if (paybackPeriod < 5) return "Good";
		if (paybackPeriod < 8) return "Fair";
		return "Poor";
	}

	generateCashFlowProjection(initialCost, annualSavings, years) {
		const projection = [];
		let cumulativeCashFlow = -initialCost;

		for (let year = 1; year <= years; year++) {
			cumulativeCashFlow += annualSavings;
			projection.push({
				year,
				annualSavings,
				cumulativeCashFlow: Math.round(cumulativeCashFlow),
				breakEven: cumulativeCashFlow >= 0,
			});
		}

		return projection;
	}

	generateCostBenefitDisplay(roiCalculation, waterSavings, paybackAnalysis) {
		return {
			investmentSummary: {
				totalInvestment: roiCalculation.totalInvestment,
				annualSavings: roiCalculation.annualSavings,
				paybackPeriod: paybackAnalysis.paybackPeriod,
				roi10Year: roiCalculation.roi10Year,
			},
			benefitBreakdown: {
				waterSavings: {
					annual: waterSavings.annualCostSavings,
					percentage: roiCalculation.breakdownPercentages.water,
				},
				yieldIncrease: {
					annual: roiCalculation.yieldIncrease,
					percentage: roiCalculation.breakdownPercentages.yield,
				},
				laborSavings: {
					annual: roiCalculation.laborSavings,
					percentage: roiCalculation.breakdownPercentages.labor,
				},
			},
			riskAssessment: {
				paybackRisk: paybackAnalysis.paybackRating,
				waterPriceRisk: "Medium - subject to inflation",
				yieldRisk: "Low - conservative estimates used",
			},
		};
	}

	getEconomicRecommendation(roiCalculation, paybackAnalysis) {
		const { roi10Year } = roiCalculation;
		const { paybackPeriod } = paybackAnalysis;

		if (roi10Year > 100 && paybackPeriod < 5) {
			return "Highly Recommended - Excellent financial returns";
		} else if (roi10Year > 50 && paybackPeriod < 7) {
			return "Recommended - Good financial returns";
		} else if (roi10Year > 20 && paybackPeriod < 10) {
			return "Consider - Moderate financial returns";
		} else {
			return "Evaluate Carefully - Limited financial returns";
		}
	}

	generateMaintenanceSchedule(systemType) {
		const schedules = {
			drip: {
				daily: ["Visual inspection of emitters"],
				weekly: ["Filter cleaning check", "Pressure monitoring"],
				monthly: ["System flushing", "Emitter flow rate check"],
				seasonal: ["Complete filter replacement", "Line inspection"],
				annual: ["System overhaul", "Component replacement planning"],
			},
			sprinkler: {
				daily: ["Visual inspection of sprinklers"],
				weekly: ["Pressure check", "Coverage pattern verification"],
				monthly: ["Nozzle cleaning", "Timer programming check"],
				seasonal: ["Winterization/startup", "Sprinkler head adjustment"],
				annual: ["Pump maintenance", "System efficiency audit"],
			},
			surface: {
				daily: ["Channel inspection"],
				weekly: ["Gate operation check", "Flow measurement"],
				monthly: ["Channel cleaning", "Structure maintenance"],
				seasonal: ["Major repairs", "Sediment removal"],
				annual: [
					"System redesign evaluation",
					"Efficiency improvement planning",
				],
			},
		};

		return schedules[systemType] || schedules.sprinkler;
	}

	calculatePerformanceMetrics(recommendedSystem, irrigationResults) {
		const { efficiency } = recommendedSystem.score
			? { efficiency: recommendedSystem.score.criteria.efficiency / 100 }
			: recommendedSystem;

		return {
			waterUseEfficiency: Math.round(efficiency * 100),
			applicationEfficiency: Math.round(efficiency * 95), // Slightly lower than WUE
			distributionUniformity: this.getDistributionUniformity(
				recommendedSystem.type
			),
			energyEfficiency: this.getEnergyEfficiency(recommendedSystem.type),
			laborEfficiency: this.getLaborEfficiency(recommendedSystem.type),
			overallScore: Math.round(
				(efficiency * 100 +
					this.getDistributionUniformity(recommendedSystem.type) +
					this.getEnergyEfficiency(recommendedSystem.type) +
					this.getLaborEfficiency(recommendedSystem.type)) /
					4
			),
		};
	}

	getDistributionUniformity(systemType) {
		const uniformity = { drip: 90, sprinkler: 85, surface: 70 };
		return uniformity[systemType] || 80;
	}

	getEnergyEfficiency(systemType) {
		const efficiency = { drip: 85, sprinkler: 70, surface: 95 };
		return efficiency[systemType] || 80;
	}

	getLaborEfficiency(systemType) {
		const efficiency = { drip: 90, sprinkler: 80, surface: 60 };
		return efficiency[systemType] || 75;
	}

	/**
	 * Calculate salt management requirements (leaching and drainage)
	 * Integrates with enhanced salt management service
	 */
	async calculateSaltManagement(
		soilData,
		irrigationResults,
		environmentalData,
		fieldConfig
	) {
		try {
			// Extract relevant data for salt management calculations
			const { electricalConductivity, saturatedConductivity, clay } = soilData;
			const { irrigationDepth } = irrigationResults;
			const { climateZone } = environmentalData;
			const { area } = fieldConfig;

			// Estimate soil and water EC values if not provided
			const soilEC = electricalConductivity || 2.0; // Default moderate salinity
			const waterEC = 1.5; // Default irrigation water EC
			const cropThresholdEC = 2.5; // Default crop tolerance

			// Calculate leaching requirements
			const leachingParams = {
				soilEC,
				waterEC,
				cropThresholdEC,
				climateZone: climateZone || "gcc_arid",
				season: "summer",
				temperature: 42,
				humidity: 25,
				evaporationRate: 12,
			};

			const leachingResults =
				this.saltManagementService.calculateLeachingRequirement(leachingParams);

			// Calculate drainage requirements
			const drainageParams = {
				soilData: {
					saturatedConductivity: saturatedConductivity || 10,
					textureClass: "loam",
					clay: clay || 25,
				},
				fieldArea: area,
				fieldSlope: 1.5,
				groundwaterDepth: 3.0,
				seasonalWaterTable: false,
				leachingRequirement: leachingResults.results,
			};

			const drainageResults =
				this.saltManagementService.assessDrainageRequirements(drainageParams);

			// Calculate salt balance
			const saltBalanceParams = {
				irrigationVolume: irrigationDepth,
				irrigationEC: waterEC,
				fertilizerInputs: [{ amount: 200, saltIndex: 0.15 }],
				precipitationVolume: 5,
				leachingVolume: leachingResults.results.leachingDepth.value || 0,
				drainageVolume: 5,
				cropUptake: 2.0,
				fieldArea: area,
				timeperiod: "monthly",
			};

			const saltBalanceResults =
				this.saltManagementService.calculateSaltBalance(saltBalanceParams);

			return {
				leaching: {
					required: leachingResults.results.leachingFraction > 0.1,
					leachingFraction: leachingResults.results.leachingFraction,
					leachingDepth: leachingResults.results.leachingDepth,
					totalWaterNeed: leachingResults.results.totalWaterNeed,
					frequency: leachingResults.results.leachingFrequency,
					economics: leachingResults.economics,
					recommendations: leachingResults.recommendations,
				},
				drainage: {
					required: drainageResults.assessment.drainageRequired,
					urgency: drainageResults.assessment.urgencyLevel,
					systemType: drainageResults.system.systemType,
					costEstimate: drainageResults.system.costEstimate,
					timeframe: drainageResults.system.timeframe,
					economics: drainageResults.economics,
					recommendations: drainageResults.recommendations,
				},
				saltBalance: {
					status: saltBalanceResults.balance.balanceStatus,
					netBalance: saltBalanceResults.balance.netBalance,
					trend: saltBalanceResults.balance.trend,
					inputs: saltBalanceResults.saltInputs,
					outputs: saltBalanceResults.saltOutputs,
					recommendations: saltBalanceResults.recommendations,
				},
				summary: {
					overallRisk: this.assessOverallSaltRisk(
						leachingResults,
						drainageResults,
						saltBalanceResults
					),
					priorityActions: this.getPrioritySaltActions(
						leachingResults,
						drainageResults,
						saltBalanceResults
					),
					economicImpact: this.calculateSaltEconomicImpact(
						leachingResults,
						drainageResults,
						area
					),
				},
			};
		} catch (error) {
			console.error("Error in salt management calculations:", error);
			// Return default/safe values if calculation fails
			return {
				leaching: { required: false, recommendations: [] },
				drainage: { required: false, recommendations: [] },
				saltBalance: { status: "stable", recommendations: [] },
				summary: {
					overallRisk: "low",
					priorityActions: ["Monitor soil salinity regularly"],
					economicImpact: { totalCost: 0, benefit: 0 },
				},
			};
		}
	}

	/**
	 * Assess overall salt management risk
	 */
	assessOverallSaltRisk(leachingResults, drainageResults, saltBalanceResults) {
		let riskScore = 0;

		// Leaching risk
		if (leachingResults.results.leachingFraction > 0.3) riskScore += 3;
		else if (leachingResults.results.leachingFraction > 0.2) riskScore += 2;
		else if (leachingResults.results.leachingFraction > 0.1) riskScore += 1;

		// Drainage risk
		if (drainageResults.assessment.urgencyLevel === "high") riskScore += 3;
		else if (drainageResults.assessment.urgencyLevel === "medium")
			riskScore += 2;
		else if (drainageResults.assessment.urgencyLevel === "low") riskScore += 1;

		// Salt balance risk
		if (saltBalanceResults.balance.balanceStatus === "critical") riskScore += 3;
		else if (saltBalanceResults.balance.balanceStatus === "warning")
			riskScore += 2;
		else if (saltBalanceResults.balance.balanceStatus === "stable")
			riskScore += 0;

		if (riskScore >= 7) return "high";
		if (riskScore >= 4) return "medium";
		return "low";
	}

	/**
	 * Get priority salt management actions
	 */
	getPrioritySaltActions(leachingResults, drainageResults, saltBalanceResults) {
		const actions = [];

		// Priority based on urgency
		if (drainageResults.assessment.urgencyLevel === "high") {
			actions.push("Install drainage system immediately");
		}

		if (leachingResults.results.leachingFraction > 0.25) {
			actions.push("Implement intensive leaching program");
		}

		if (saltBalanceResults.balance.balanceStatus === "critical") {
			actions.push("Apply emergency salt flushing irrigation");
		}

		// Add monitoring recommendations
		actions.push("Monitor soil EC monthly");
		actions.push("Test irrigation water quality quarterly");

		return actions.slice(0, 5); // Limit to top 5 actions
	}

	/**
	 * Calculate economic impact of salt management
	 */
	calculateSaltEconomicImpact(leachingResults, drainageResults, fieldArea) {
		const leachingCost = leachingResults.economics?.extraWaterCost || 0;
		const drainageCost = drainageResults.economics?.installationCost || 0;

		const leachingBenefit = leachingResults.economics?.netBenefit || 0;
		const drainageBenefit = drainageResults.economics?.annualBenefit || 0;

		return {
			totalCost: leachingCost + drainageCost,
			totalBenefit: leachingBenefit + drainageBenefit,
			netBenefit:
				leachingBenefit + drainageBenefit - (leachingCost + drainageCost),
			costPerHectare: (leachingCost + drainageCost) / fieldArea,
			benefitCostRatio:
				(leachingBenefit + drainageBenefit) /
				Math.max(leachingCost + drainageCost, 1),
		};
	}
}

module.exports = DSSCalculationService;
