/**
 * Salt Management Service for FlahaSoil DSS
 * Implements comprehensive leaching/drainage calculations for Gulf agricultural conditions
 * Based on FAO-29 methodology with regional adjustments
 *
 * @format
 */

class SaltManagementService {
	constructor() {
		this.constants = {
			// Gulf climate adjustment factors
			CLIMATE_FACTORS: {
				gcc_arid: 1.3, // High evaporation, extreme heat
				mena_mediterranean: 1.1, // Moderate adjustment
				temperate: 1.0, // Baseline (no adjustment)
			},

			// Seasonal adjustment factors for Gulf
			SEASONAL_FACTORS: {
				summer: 1.4, // May-September (extreme evaporation)
				winter: 0.8, // November-February (lower evaporation)
				transition: 1.0, // March-April, October (baseline)
			},

			// Salt tolerance classifications
			TOLERANCE_CLASSES: {
				very_sensitive: { min: 0.5, max: 1.5 },
				sensitive: { min: 1.5, max: 3.0 },
				moderate: { min: 3.0, max: 6.0 },
				tolerant: { min: 6.0, max: 10.0 },
				highly_tolerant: { min: 10.0, max: 18.0 },
				extremely_tolerant: { min: 18.0, max: 50.0 },
			},

			// Gulf suitability ratings
			GULF_SUITABILITY: {
				challenging: { threshold: 2.0, adjustment: 0.8 },
				moderate: { threshold: 4.0, adjustment: 0.9 },
				good: { threshold: 8.0, adjustment: 1.0 },
				very_good: { threshold: 12.0, adjustment: 1.1 },
				excellent: { threshold: 20.0, adjustment: 1.2 },
			},

			// Water costs in GCC ($/m³)
			WATER_COSTS: {
				desalinated: 2.5,
				treated_wastewater: 0.8,
				brackish_groundwater: 0.5,
			},

			// Drainage installation costs ($/ha)
			DRAINAGE_COSTS: {
				subsurface_tile: 3500,
				surface: 1000,
				mole: 800,
				combination: 2500,
			},
		};
	}

	/**
	 * Calculate leaching requirement using FAO-29 methodology with Gulf adjustments
	 * @param {Object} params - Calculation parameters
	 * @returns {Object} Leaching calculation results
	 */
	calculateLeachingRequirement(params) {
		const {
			soilEC,
			waterEC,
			cropThresholdEC,
			climateZone = "gcc_arid",
			season = "summer",
			evaporationRate = null,
			temperature = null,
			humidity = null,
		} = params;

		// Validate inputs
		this.validateLeachingInputs(params);

		// Step 1: Basic FAO-29 leaching fraction calculation
		const baseLF = waterEC / (5 * cropThresholdEC - waterEC);

		// Step 2: Apply Gulf climate adjustments
		const climateFactor = this.constants.CLIMATE_FACTORS[climateZone] || 1.0;
		const seasonalFactor = this.constants.SEASONAL_FACTORS[season] || 1.0;

		// Step 3: Environmental adjustments
		let environmentalFactor = 1.0;
		if (temperature && temperature > 35) {
			environmentalFactor *= 1.1; // High temperature stress
		}
		if (humidity && humidity < 20) {
			environmentalFactor *= 1.05; // Low humidity increases salt concentration
		}
		if (evaporationRate && evaporationRate > 8) {
			environmentalFactor *= 1.15; // High evaporation rate
		}

		// Step 4: Calculate adjusted leaching fraction
		const adjustedLF = Math.min(
			baseLF * climateFactor * seasonalFactor * environmentalFactor,
			0.5
		);

		// Step 5: Calculate leaching depth and water requirements
		const irrigationDepth = this.estimateIrrigationDepth(
			soilEC,
			cropThresholdEC
		);
		const leachingDepth = irrigationDepth * adjustedLF;
		const totalWaterNeed = irrigationDepth + leachingDepth;

		// Step 6: Determine leaching frequency
		const leachingFrequency = this.determineLeachingFrequency(adjustedLF);

		// Step 7: Economic analysis
		const economicAnalysis = this.calculateLeachingEconomics({
			totalWaterNeed,
			irrigationDepth,
			waterEC,
			climateZone,
		});

		// Step 8: Generate recommendations
		const recommendations = this.generateLeachingRecommendations({
			adjustedLF,
			soilEC,
			cropThresholdEC,
			season,
			economicAnalysis,
		});

		return {
			// Input parameters
			inputs: {
				soilEC,
				waterEC,
				cropThresholdEC,
				climateZone,
				season,
			},

			// Calculation steps
			calculations: {
				baseLF: Math.round(baseLF * 1000) / 1000,
				climateFactor,
				seasonalFactor,
				environmentalFactor: Math.round(environmentalFactor * 100) / 100,
				adjustedLF: Math.round(adjustedLF * 1000) / 1000,
			},

			// Results
			results: {
				leachingFraction: adjustedLF,
				leachingDepth: Math.round(leachingDepth * 10) / 10,
				irrigationDepth: Math.round(irrigationDepth * 10) / 10,
				totalWaterNeed: Math.round(totalWaterNeed * 10) / 10,
				leachingFrequency,
				waterIncrease: Math.round((totalWaterNeed / irrigationDepth - 1) * 100),
			},

			// Economic analysis
			economics: economicAnalysis,

			// Recommendations
			recommendations,

			// Metadata
			metadata: {
				calculationMethod: "fao29_gulf",
				calculationVersion: "1.0",
				timestamp: new Date().toISOString(),
				confidence: this.assessCalculationConfidence(params),
			},
		};
	}

	/**
	 * Assess drainage requirements for a field
	 * @param {Object} params - Field and soil parameters
	 * @returns {Object} Drainage assessment results
	 */
	assessDrainageRequirements(params) {
		const {
			soilData,
			fieldArea,
			fieldSlope = 0,
			groundwaterDepth = null,
			seasonalWaterTable = false,
			leachingRequirement = null,
		} = params;

		// Extract soil properties
		const { saturatedConductivity, textureClass, clay } = soilData;

		// Step 1: Classify drainage adequacy
		const drainageClass = this.classifyDrainageAdequacy(
			saturatedConductivity,
			clay
		);

		// Step 2: Calculate drainage capacity needed
		const drainageCapacity = this.calculateDrainageCapacity({
			leachingRequirement,
			fieldArea,
			saturatedConductivity,
		});

		// Step 3: Determine if drainage is required
		const drainageRequired = this.isDrainageRequired({
			drainageClass,
			groundwaterDepth,
			seasonalWaterTable,
			saturatedConductivity,
			leachingRequirement,
		});

		// Step 4: Recommend drainage system
		const systemRecommendation = this.recommendDrainageSystem({
			soilData,
			fieldSlope,
			fieldArea,
			drainageRequired,
		});

		// Step 5: Economic analysis
		const economicAnalysis = this.calculateDrainageEconomics({
			systemRecommendation,
			fieldArea,
			drainageRequired,
		});

		return {
			// Assessment results
			assessment: {
				drainageRequired,
				urgencyLevel: this.assessUrgency(
					drainageRequired,
					groundwaterDepth,
					seasonalWaterTable
				),
				drainageClass,
				drainageCapacity: Math.round(drainageCapacity * 100) / 100,
			},

			// System recommendations
			system: systemRecommendation,

			// Economic analysis
			economics: economicAnalysis,

			// Implementation plan
			implementation: this.generateImplementationPlan(systemRecommendation),

			// Metadata
			metadata: {
				assessmentMethod: "standard",
				assessmentVersion: "1.0",
				timestamp: new Date().toISOString(),
			},
		};
	}

	/**
	 * Calculate salt balance for field monitoring
	 * @param {Object} params - Salt balance parameters
	 * @returns {Object} Salt balance results
	 */
	calculateSaltBalance(params) {
		const {
			irrigationVolume,
			irrigationEC,
			fertilizerInputs = [],
			precipitationVolume = 0,
			leachingVolume = 0,
			drainageVolume = 0,
			cropUptake = 0,
			fieldArea,
			timeperiod = "monthly",
		} = params;

		// Step 1: Calculate salt inputs (kg/ha)
		const saltInputs = {
			irrigation: irrigationVolume * irrigationEC * 0.64, // conversion factor
			fertilizer: this.calculateFertilizerSalt(fertilizerInputs),
			atmospheric: this.estimateAtmosphericSalt(timeperiod), // Gulf dust deposition
			groundwater: this.estimateGroundwaterSalt(params),
		};

		// Step 2: Calculate salt outputs (kg/ha)
		const saltOutputs = {
			leaching: leachingVolume * irrigationEC * 0.8 * 0.64, // assume 80% salt removal efficiency
			drainage: drainageVolume * irrigationEC * 0.9 * 0.64, // assume 90% salt removal efficiency
			cropUptake: cropUptake,
			surfaceRunoff: precipitationVolume * 0.1 * irrigationEC * 0.64, // minimal runoff salt loss
		};

		// Step 3: Calculate net balance
		const totalInputs = Object.values(saltInputs).reduce(
			(sum, val) => sum + val,
			0
		);
		const totalOutputs = Object.values(saltOutputs).reduce(
			(sum, val) => sum + val,
			0
		);
		const netBalance = totalInputs - totalOutputs;

		// Step 4: Assess balance status
		const balanceStatus = this.assessSaltBalanceStatus(netBalance, timeperiod);

		// Step 5: Generate recommendations
		const recommendations = this.generateSaltBalanceRecommendations(
			balanceStatus,
			params
		);

		return {
			// Salt inputs and outputs
			saltInputs: this.roundSaltValues(saltInputs),
			saltOutputs: this.roundSaltValues(saltOutputs),

			// Balance calculation
			balance: {
				totalInputs: Math.round(totalInputs * 10) / 10,
				totalOutputs: Math.round(totalOutputs * 10) / 10,
				netBalance: Math.round(netBalance * 10) / 10,
				balanceStatus: balanceStatus.status,
				trend: balanceStatus.trend,
			},

			// Recommendations
			recommendations,

			// Metadata
			metadata: {
				timeperiod,
				fieldArea,
				calculationDate: new Date().toISOString(),
			},
		};
	}

	/**
	 * Calculate economic impact of leaching requirements
	 */
	calculateLeachingEconomics(params) {
		const { totalWaterNeed, irrigationDepth, waterEC, climateZone } = params;

		const extraWater = totalWaterNeed - irrigationDepth; // m³/ha
		const waterCost = this.constants.WATER_COSTS.desalinated; // Default to desalinated water
		const extraWaterCost = extraWater * waterCost;

		// Estimate salt damage cost if no leaching
		const saltDamageRisk = Math.min(waterEC / 10, 0.8); // 0-80% risk
		const avgYieldValue = 5000; // $/ha average crop value
		const potentialLoss = avgYieldValue * saltDamageRisk;

		const netBenefit = potentialLoss - extraWaterCost;
		const benefitCostRatio = potentialLoss / Math.max(extraWaterCost, 1);

		return {
			extraWaterCost: Math.round(extraWaterCost),
			potentialSaltDamage: Math.round(potentialLoss),
			netBenefit: Math.round(netBenefit),
			benefitCostRatio: Math.round(benefitCostRatio * 10) / 10,
			recommendation:
				netBenefit > 0 ? "economically_beneficial" : "monitor_closely",
		};
	}

	/**
	 * Generate leaching recommendations based on calculations
	 */
	generateLeachingRecommendations(params) {
		const { adjustedLF, soilEC, cropThresholdEC, season, economicAnalysis } =
			params;

		const recommendations = [];

		// Leaching frequency recommendation
		if (adjustedLF > 0.3) {
			recommendations.push({
				priority: "HIGH",
				category: "leaching",
				action: "Implement intensive leaching program",
				details: `Apply ${Math.round(
					adjustedLF * 100
				)}% extra water every irrigation`,
				timing: "immediate",
			});
		} else if (adjustedLF > 0.15) {
			recommendations.push({
				priority: "MEDIUM",
				category: "leaching",
				action: "Regular leaching schedule",
				details: `Apply ${Math.round(
					adjustedLF * 100
				)}% extra water every 2-3 irrigations`,
				timing: "within_week",
			});
		}

		// Seasonal adjustments
		if (season === "summer") {
			recommendations.push({
				priority: "HIGH",
				category: "timing",
				action: "Optimize leaching timing",
				details:
					"Apply leaching water during early morning (4-6 AM) to minimize evaporation",
				timing: "daily",
			});
		}

		// Economic recommendations
		if (economicAnalysis.benefitCostRatio < 1.5) {
			recommendations.push({
				priority: "MEDIUM",
				category: "economic",
				action: "Consider alternative strategies",
				details: "Evaluate crop switching or water treatment options",
				timing: "next_season",
			});
		}

		return recommendations;
	}

	/**
	 * Classify soil drainage adequacy
	 */
	classifyDrainageAdequacy(saturatedConductivity, clayContent) {
		if (saturatedConductivity > 25 && clayContent < 20) {
			return "well_drained";
		} else if (saturatedConductivity > 10 && clayContent < 35) {
			return "moderately_drained";
		} else if (saturatedConductivity > 2 && clayContent < 50) {
			return "somewhat_poorly_drained";
		} else {
			return "poorly_drained";
		}
	}

	/**
	 * Calculate required drainage capacity
	 */
	calculateDrainageCapacity(params) {
		const { leachingRequirement, fieldArea, saturatedConductivity } = params;

		let baseCapacity = 5; // mm/day base drainage requirement

		if (leachingRequirement && leachingRequirement.totalWaterNeed) {
			// Increase capacity based on leaching needs
			baseCapacity += leachingRequirement.totalWaterNeed * 0.1; // 10% of leaching water
		}

		// Adjust for soil permeability
		const permeabilityFactor = Math.min(saturatedConductivity / 10, 2.0);

		return baseCapacity * permeabilityFactor;
	}

	/**
	 * Determine if drainage is required
	 */
	isDrainageRequired(params) {
		const {
			drainageClass,
			groundwaterDepth,
			seasonalWaterTable,
			saturatedConductivity,
			leachingRequirement,
		} = params;

		// High priority conditions
		if (seasonalWaterTable || (groundwaterDepth && groundwaterDepth < 2)) {
			return true;
		}

		// Poor drainage conditions
		if (drainageClass === "poorly_drained" || saturatedConductivity < 2) {
			return true;
		}

		// High leaching requirements
		if (leachingRequirement && leachingRequirement.leachingFraction > 0.25) {
			return true;
		}

		return false;
	}

	/**
	 * Recommend appropriate drainage system
	 */
	recommendDrainageSystem(params) {
		const { soilData, fieldSlope, fieldArea, drainageRequired } = params;
		const { clay, saturatedConductivity } = soilData;

		if (!drainageRequired) {
			return {
				systemType: "none",
				reasoning: "Adequate natural drainage",
			};
		}

		let systemType, spacing, depth, material;

		if (clay > 40 && saturatedConductivity < 2) {
			// Heavy clay soils
			systemType = "subsurface_tile";
			spacing = "15-25m";
			depth = "1.2-1.5m";
			material = "perforated_pvc";
		} else if (fieldSlope > 2) {
			// Sloped fields
			systemType = "surface";
			spacing = "50-100m";
			depth = "0.3-0.5m";
			material = "graded_channels";
		} else if (saturatedConductivity < 5) {
			// Moderate drainage issues
			systemType = "mole";
			spacing = "20-40m";
			depth = "0.8-1.0m";
			material = "mole_channels";
		} else {
			// Combination system
			systemType = "combination";
			spacing = "30-50m";
			depth = "1.0-1.2m";
			material = "tile_and_surface";
		}

		return {
			systemType,
			specifications: {
				spacing,
				depth,
				material,
				suitability: this.assessSystemSuitability(systemType, soilData),
			},
			reasoning: this.generateSystemReasoning(systemType, soilData, fieldSlope),
		};
	}

	/**
	 * Calculate drainage system economics
	 */
	calculateDrainageEconomics(params) {
		const { systemRecommendation, fieldArea, drainageRequired } = params;

		if (!drainageRequired) {
			return {
				installationCost: 0,
				annualMaintenance: 0,
				paybackPeriod: 0,
				benefitCostRatio: 0,
			};
		}

		const systemType = systemRecommendation.systemType;
		const baseCost = this.constants.DRAINAGE_COSTS[systemType] || 2000;
		const installationCost = baseCost * fieldArea;
		const annualMaintenance = installationCost * 0.05; // 5% annual maintenance

		// Estimate benefits
		const yieldProtection = 0.25; // 25% yield protection
		const avgYieldValue = 5000; // $/ha
		const annualBenefit = avgYieldValue * yieldProtection;

		const paybackPeriod = installationCost / annualBenefit;
		const benefitCostRatio =
			annualBenefit / (installationCost / 10 + annualMaintenance); // 10-year analysis

		return {
			installationCost: Math.round(installationCost),
			annualMaintenance: Math.round(annualMaintenance),
			annualBenefit: Math.round(annualBenefit),
			paybackPeriod: Math.round(paybackPeriod * 10) / 10,
			benefitCostRatio: Math.round(benefitCostRatio * 10) / 10,
			recommendation:
				benefitCostRatio > 1.5 ? "highly_recommended" : "consider_alternatives",
		};
	}

	validateLeachingInputs(params) {
		const { soilEC, waterEC, cropThresholdEC } = params;

		if (soilEC < 0 || soilEC > 50) {
			throw new Error("Soil EC must be between 0 and 50 dS/m");
		}
		if (waterEC < 0 || waterEC > 25) {
			throw new Error("Water EC must be between 0 and 25 dS/m");
		}
		if (cropThresholdEC < 0 || cropThresholdEC > 25) {
			throw new Error("Crop threshold EC must be between 0 and 25 dS/m");
		}
		if (waterEC >= 5 * cropThresholdEC) {
			throw new Error(
				"Water EC too high for this crop - consider crop change or water treatment"
			);
		}
	}

	estimateIrrigationDepth(soilEC, cropThresholdEC) {
		// Estimate based on soil salinity and crop tolerance
		const baseDepth = 25; // mm base irrigation depth
		const salinityFactor = Math.max(1.0, soilEC / cropThresholdEC);
		return baseDepth * salinityFactor;
	}

	determineLeachingFrequency(leachingFraction) {
		if (leachingFraction < 0.1) return "every_5_irrigations";
		if (leachingFraction < 0.2) return "every_3_irrigations";
		if (leachingFraction < 0.3) return "every_2_irrigations";
		return "every_irrigation";
	}

	roundSaltValues(saltObject) {
		const rounded = {};
		for (const [key, value] of Object.entries(saltObject)) {
			rounded[key] = Math.round(value * 10) / 10;
		}
		return rounded;
	}

	// Additional helper methods
	assessCalculationConfidence(params) {
		const { soilEC, waterEC, cropThresholdEC } = params;

		// High confidence for well-established ranges
		if (waterEC < 4 && cropThresholdEC > 2) return "high";
		if (waterEC < 8 && cropThresholdEC > 1) return "medium";
		return "low";
	}

	assessUrgency(drainageRequired, groundwaterDepth, seasonalWaterTable) {
		if (!drainageRequired) return "none";
		if (seasonalWaterTable || (groundwaterDepth && groundwaterDepth < 1))
			return "high";
		if (groundwaterDepth && groundwaterDepth < 2) return "medium";
		return "low";
	}

	assessSystemSuitability(systemType, soilData) {
		const { clay, saturatedConductivity } = soilData;

		switch (systemType) {
			case "subsurface_tile":
				return clay > 30 ? "excellent" : "good";
			case "surface":
				return saturatedConductivity < 5 ? "excellent" : "moderate";
			case "mole":
				return clay > 20 && clay < 50 ? "excellent" : "moderate";
			default:
				return "good";
		}
	}

	generateSystemReasoning(systemType, soilData, fieldSlope) {
		const { clay, saturatedConductivity } = soilData;

		switch (systemType) {
			case "subsurface_tile":
				return `Heavy clay soil (${clay}% clay) with low permeability requires subsurface drainage`;
			case "surface":
				return `Field slope (${fieldSlope}%) allows effective surface drainage system`;
			case "mole":
				return `Moderate clay content suitable for mole drainage channels`;
			case "combination":
				return `Mixed soil conditions require combination drainage approach`;
			default:
				return "Standard drainage recommendation based on soil conditions";
		}
	}

	generateImplementationPlan(systemRecommendation) {
		const { systemType } = systemRecommendation;

		const basePlan = {
			phases: [
				{
					phase: 1,
					description: "Site survey and design",
					duration: "1-2 weeks",
				},
				{ phase: 2, description: "Material procurement", duration: "1 week" },
				{ phase: 3, description: "Installation", duration: "2-4 weeks" },
				{
					phase: 4,
					description: "Testing and commissioning",
					duration: "1 week",
				},
			],
			totalDuration: "5-8 weeks",
			seasonalConsiderations:
				"Install during dry season for optimal conditions",
			maintenanceSchedule: "Annual inspection and cleaning required",
		};

		// Add system-specific considerations
		if (systemType === "subsurface_tile") {
			basePlan.specialRequirements =
				"Laser leveling required for proper gradient";
		} else if (systemType === "surface") {
			basePlan.specialRequirements = "Proper grading essential for water flow";
		}

		return basePlan;
	}

	calculateFertilizerSalt(fertilizerInputs) {
		return fertilizerInputs.reduce((total, fertilizer) => {
			const saltContent = fertilizer.saltIndex || 0.1; // Default 10% salt content
			return total + fertilizer.amount * saltContent;
		}, 0);
	}

	estimateAtmosphericSalt(timeperiod) {
		// Gulf region atmospheric salt deposition (kg/ha)
		const monthlyDeposition = 4.2; // Average for Gulf coastal areas

		switch (timeperiod) {
			case "monthly":
				return monthlyDeposition;
			case "seasonal":
				return monthlyDeposition * 3;
			case "annual":
				return monthlyDeposition * 12;
			default:
				return monthlyDeposition;
		}
	}

	estimateGroundwaterSalt(params) {
		const { groundwaterDepth = 5, groundwaterEC = 8 } = params;

		// Estimate upward salt movement from groundwater
		if (groundwaterDepth > 3) return 0; // Minimal contribution

		const capillaryRise = Math.max(0, 2 - groundwaterDepth); // meters
		const saltContribution = capillaryRise * groundwaterEC * 0.3; // kg/ha

		return saltContribution;
	}

	assessSaltBalanceStatus(netBalance, timeperiod) {
		// Threshold values for salt accumulation (kg/ha)
		const thresholds = {
			monthly: { warning: 10, critical: 25 },
			seasonal: { warning: 30, critical: 75 },
			annual: { warning: 120, critical: 300 },
		};

		const threshold = thresholds[timeperiod] || thresholds.monthly;

		let status, trend;

		if (netBalance < 0) {
			status = "improving";
			trend = "decreasing";
		} else if (netBalance < threshold.warning) {
			status = "stable";
			trend = "stable";
		} else if (netBalance < threshold.critical) {
			status = "warning";
			trend = "increasing";
		} else {
			status = "critical";
			trend = "rapidly_increasing";
		}

		return { status, trend };
	}

	generateSaltBalanceRecommendations(balanceStatus, params) {
		const recommendations = [];
		const { status } = balanceStatus;

		if (status === "critical") {
			recommendations.push({
				priority: "URGENT",
				action: "Immediate leaching required",
				details:
					"Apply 150% normal irrigation depth to flush accumulated salts",
				timing: "within_24_hours",
			});
		} else if (status === "warning") {
			recommendations.push({
				priority: "HIGH",
				action: "Increase leaching frequency",
				details: "Apply leaching irrigation every 2-3 normal irrigations",
				timing: "within_week",
			});
		} else if (status === "improving") {
			recommendations.push({
				priority: "LOW",
				action: "Continue current management",
				details: "Salt balance is improving, maintain current practices",
				timing: "ongoing",
			});
		}

		return recommendations;
	}
}

module.exports = SaltManagementService;
