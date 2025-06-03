/**
 * Enhanced Salt Management Service for FlahaSoil DSS
 * Implements comprehensive leaching/drainage calculations with improved clarity and traceability
 * Based on FAO-29 methodology with regional adjustments and enhanced reporting
 *
 * @format
 */

const crypto = require("crypto");

class SaltManagementServiceEnhanced {
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
	 * Calculate leaching requirement with enhanced clarity and traceability
	 * @param {Object} params - Calculation parameters
	 * @returns {Object} Enhanced leaching calculation results
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

		// Step 8: Generate enhanced recommendations
		const recommendations = this.generateEnhancedLeachingRecommendations({
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

			// Enhanced results with clear units and time basis
			results: {
				leachingFraction: adjustedLF,
				leachingDepth: {
					value: Math.round(leachingDepth * 10) / 10,
					unit: "mm",
					basis: "per irrigation event",
					description: "Additional water depth required for salt leaching",
				},
				irrigationDepth: {
					value: Math.round(irrigationDepth * 10) / 10,
					unit: "mm",
					basis: "per irrigation event",
					description: "Normal irrigation water depth",
				},
				totalWaterNeed: {
					value: Math.round(totalWaterNeed * 10) / 10,
					unit: "mm",
					basis: "per irrigation event",
					description: "Total water requirement (irrigation + leaching)",
				},
				leachingFrequency: {
					value: leachingFrequency,
					description: this.getFrequencyDescription(leachingFrequency),
				},
				waterIncrease: {
					value: Math.round((totalWaterNeed / irrigationDepth - 1) * 100),
					unit: "%",
					description: "Additional water required above normal irrigation",
				},
			},

			// Enhanced economic analysis with clear units and time basis
			economics: {
				...economicAnalysis,
				units: {
					extraWaterCost: "$/ha/season",
					potentialSaltDamage: "$/ha/year",
					netBenefit: "$/ha/season",
					timeBasis: "seasonal average (4-month growing period)",
					analysisNote: "Based on GCC water costs and regional crop values",
				},
			},

			// Enhanced recommendations with sample actions
			recommendations: recommendations,

			// Enhanced metadata with traceability
			metadata: {
				calculationMethod: "fao29_gulf_enhanced",
				calculationVersion: "1.1",
				timestamp: new Date().toISOString(),
				testRunId: this.generateTestRunId(),
				confidence: this.assessCalculationConfidence(params),
				traceability: {
					inputHash: this.generateInputHash(params),
					calculationId: `LR-${Date.now()}-${Math.random()
						.toString(36)
						.substr(2, 9)}`,
					sessionId: this.generateSessionId(),
				},
				qualityFlags: this.assessQualityFlags(params, {
					adjustedLF,
					economicAnalysis,
				}),
			},
		};
	}

	/**
	 * Generate enhanced leaching recommendations with sample actions
	 */
	generateEnhancedLeachingRecommendations(params) {
		const { adjustedLF, soilEC, cropThresholdEC, season, economicAnalysis } =
			params;

		const recommendations = [];

		// Leaching frequency recommendation with sample action
		if (adjustedLF > 0.3) {
			recommendations.push({
				priority: "HIGH",
				category: "leaching",
				action: "Implement intensive leaching program",
				details: `Apply ${Math.round(
					adjustedLF * 100
				)}% extra water every irrigation`,
				sampleAction: `Increase leaching fraction to 0.35 if EC rises above ${
					Math.round(soilEC * 1.1 * 10) / 10
				} dS/m`,
				timing: "immediate",
				expectedOutcome:
					"Reduce soil salinity by 15-25% within 2-3 irrigation cycles",
			});
		} else if (adjustedLF > 0.15) {
			recommendations.push({
				priority: "MEDIUM",
				category: "leaching",
				action: "Regular leaching schedule",
				details: `Apply ${Math.round(
					adjustedLF * 100
				)}% extra water every 2-3 irrigations`,
				sampleAction: `Monitor soil EC weekly; apply leaching if EC exceeds ${
					Math.round(cropThresholdEC * 1.2 * 10) / 10
				} dS/m`,
				timing: "within_week",
				expectedOutcome: "Maintain soil salinity within acceptable range",
			});
		}

		// Seasonal adjustments with specific guidance
		if (season === "summer") {
			recommendations.push({
				priority: "HIGH",
				category: "timing",
				action: "Optimize leaching timing for summer conditions",
				details:
					"Apply leaching water during early morning (4-6 AM) to minimize evaporation",
				sampleAction:
					"Schedule leaching irrigations between 4-6 AM when evaporation rate is <6 mm/day",
				timing: "daily",
				expectedOutcome:
					"Reduce water loss by 20-30% compared to midday application",
			});
		}

		// Economic recommendations with alternatives
		if (economicAnalysis.benefitCostRatio < 1.5) {
			recommendations.push({
				priority: "MEDIUM",
				category: "economic",
				action: "Consider cost-effective alternatives",
				details: "Evaluate crop switching or water treatment options",
				sampleAction:
					"Switch to salt-tolerant crops (barley, date palm) or install water treatment system",
				timing: "next_season",
				expectedOutcome: "Improve economic viability by 25-40%",
			});
		}

		return recommendations;
	}

	/**
	 * Enhanced drainage assessment with improved clarity
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

		// Assessment steps with enhanced reporting
		const drainageClass = this.classifyDrainageAdequacy(
			saturatedConductivity,
			clay
		);
		const drainageCapacity = this.calculateDrainageCapacity({
			leachingRequirement,
			fieldArea,
			saturatedConductivity,
		});

		const drainageRequired = this.isDrainageRequired({
			drainageClass,
			groundwaterDepth,
			seasonalWaterTable,
			saturatedConductivity,
			leachingRequirement,
		});

		const systemRecommendation = this.recommendDrainageSystem({
			soilData,
			fieldSlope,
			fieldArea,
			drainageRequired,
		});

		const economicAnalysis = this.calculateEnhancedDrainageEconomics({
			systemRecommendation,
			fieldArea,
			drainageRequired,
		});

		return {
			// Enhanced assessment results
			assessment: {
				drainageRequired,
				urgencyLevel: this.assessUrgency(
					drainageRequired,
					groundwaterDepth,
					seasonalWaterTable
				),
				drainageClass,
				drainageCapacity: {
					value: Math.round(drainageCapacity * 100) / 100,
					unit: "mm/day",
					description: "Required drainage capacity for field conditions",
				},
			},

			// Enhanced system recommendations
			system: {
				...systemRecommendation,
				costEstimate: economicAnalysis.installationCost,
				timeframe: this.getInstallationTimeframe(
					systemRecommendation.systemType
				),
			},

			// Enhanced economic analysis with time basis
			economics: {
				...economicAnalysis,
				units: {
					installationCost: "$/total project",
					annualMaintenance: "$/year",
					paybackPeriod: "years (based on seasonal crop cycles)",
					benefitCostRatio: "ratio over 10-year analysis period",
				},
			},

			// Implementation plan
			implementation: this.generateImplementationPlan(systemRecommendation),

			// Enhanced metadata
			metadata: {
				assessmentMethod: "enhanced_standard",
				assessmentVersion: "1.1",
				timestamp: new Date().toISOString(),
				traceability: {
					assessmentId: `DA-${Date.now()}-${Math.random()
						.toString(36)
						.substr(2, 9)}`,
					inputHash: this.generateInputHash(params),
				},
			},
		};
	}

	/**
	 * Enhanced salt balance calculation with quality flags
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

		// Calculate salt inputs and outputs
		const saltInputs = {
			irrigation: irrigationVolume * irrigationEC * 0.64,
			fertilizer: this.calculateFertilizerSalt(fertilizerInputs),
			atmospheric: this.estimateAtmosphericSalt(timeperiod),
			groundwater: this.estimateGroundwaterSalt(params),
		};

		const saltOutputs = {
			leaching: leachingVolume * irrigationEC * 0.8 * 0.64,
			drainage: drainageVolume * irrigationEC * 0.9 * 0.64,
			cropUptake: cropUptake,
			surfaceRunoff: precipitationVolume * 0.1 * irrigationEC * 0.64,
		};

		const totalInputs = Object.values(saltInputs).reduce(
			(sum, val) => sum + val,
			0
		);
		const totalOutputs = Object.values(saltOutputs).reduce(
			(sum, val) => sum + val,
			0
		);
		const netBalance = totalInputs - totalOutputs;

		const balanceStatus = this.assessSaltBalanceStatus(netBalance, timeperiod);
		const recommendations = this.generateEnhancedSaltBalanceRecommendations(
			balanceStatus,
			params
		);

		// Quality flags for unusual conditions
		const qualityFlags = this.assessSaltBalanceQualityFlags(
			saltInputs,
			saltOutputs,
			params
		);

		return {
			// Enhanced salt inputs and outputs with units
			saltInputs: {
				...this.roundSaltValues(saltInputs),
				units: "kg/ha",
				timeframe: timeperiod,
				qualityFlags: qualityFlags.inputs,
			},
			saltOutputs: {
				...this.roundSaltValues(saltOutputs),
				units: "kg/ha",
				timeframe: timeperiod,
				qualityFlags: qualityFlags.outputs,
			},

			// Enhanced balance calculation
			balance: {
				totalInputs: {
					value: Math.round(totalInputs * 10) / 10,
					unit: "kg/ha",
					timeframe: timeperiod,
				},
				totalOutputs: {
					value: Math.round(totalOutputs * 10) / 10,
					unit: "kg/ha",
					timeframe: timeperiod,
				},
				netBalance: {
					value: Math.round(netBalance * 10) / 10,
					unit: "kg/ha",
					timeframe: timeperiod,
					interpretation: this.interpretNetBalance(netBalance, timeperiod),
				},
				balanceStatus: balanceStatus.status,
				trend: balanceStatus.trend,
			},

			// Enhanced recommendations with sample actions
			recommendations: recommendations,

			// Enhanced metadata with traceability
			metadata: {
				timeperiod,
				fieldArea,
				calculationDate: new Date().toISOString(),
				traceability: {
					recordId: `SB-${Date.now()}-${Math.random()
						.toString(36)
						.substr(2, 9)}`,
					inputHash: this.generateInputHash(params),
				},
				qualityAssessment: qualityFlags.overall,
			},
		};
	}

	// Enhanced helper methods
	generateTestRunId() {
		return `TR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	generateSessionId() {
		return `SS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	}

	generateInputHash(params) {
		const inputString = JSON.stringify(params, Object.keys(params).sort());
		return crypto
			.createHash("md5")
			.update(inputString)
			.digest("hex")
			.substr(0, 8);
	}

	getFrequencyDescription(frequency) {
		const descriptions = {
			every_irrigation: "Apply leaching water with every irrigation cycle",
			every_2_irrigations: "Apply leaching water every second irrigation",
			every_3_irrigations: "Apply leaching water every third irrigation",
			every_5_irrigations: "Apply leaching water every fifth irrigation",
		};
		return (
			descriptions[frequency] || "Apply as needed based on soil monitoring"
		);
	}

	assessQualityFlags(params, results) {
		const flags = [];

		if (results.adjustedLF > 0.4) {
			flags.push({
				type: "warning",
				message: "Very high leaching requirement - consider crop alternatives",
				code: "HIGH_LF",
			});
		}

		if (results.economicAnalysis.benefitCostRatio < 1.0) {
			flags.push({
				type: "caution",
				message: "Leaching may not be economically viable",
				code: "LOW_BCR",
			});
		}

		return flags;
	}

	assessSaltBalanceQualityFlags(saltInputs, saltOutputs, params) {
		const flags = {
			inputs: [],
			outputs: [],
			overall: [],
		};

		// Check for unusual fertilizer contribution
		const totalInputs = Object.values(saltInputs).reduce(
			(sum, val) => sum + val,
			0
		);
		if (saltInputs.fertilizer / totalInputs > 0.25) {
			flags.inputs.push({
				type: "warning",
				message: "Fertilizer salts contributing >25% of total salt input",
				recommendation:
					"Consider reducing fertilizer application or switching to low-salt alternatives",
			});
		}

		// Check for unusually low crop uptake
		if (saltOutputs.cropUptake < 1.0) {
			flags.outputs.push({
				type: "caution",
				message: "Crop uptake unusually low - verify crop growth stage",
				recommendation:
					"Monitor crop health and adjust uptake estimates based on growth stage",
			});
		}

		return flags;
	}

	interpretNetBalance(netBalance, timeperiod) {
		const thresholds = {
			monthly: { low: 5, moderate: 15, high: 30 },
			seasonal: { low: 15, moderate: 45, high: 90 },
			annual: { low: 60, moderate: 180, high: 360 },
		};

		const threshold = thresholds[timeperiod] || thresholds.monthly;

		if (netBalance < 0) {
			return "Salt levels decreasing - good management";
		} else if (netBalance < threshold.low) {
			return "Acceptable salt accumulation rate";
		} else if (netBalance < threshold.moderate) {
			return "Moderate salt accumulation - monitor closely";
		} else if (netBalance < threshold.high) {
			return "High salt accumulation - action required";
		} else {
			return "Critical salt accumulation - immediate intervention needed";
		}
	}

	// Additional enhanced methods
	calculateEnhancedDrainageEconomics(params) {
		const { systemRecommendation, fieldArea, drainageRequired } = params;

		if (!drainageRequired) {
			return {
				installationCost: 0,
				annualMaintenance: 0,
				paybackPeriod: 0,
				benefitCostRatio: 0,
				recommendation: "no_drainage_needed",
			};
		}

		const systemType = systemRecommendation.systemType;
		const baseCost = this.constants.DRAINAGE_COSTS[systemType] || 2000;
		const installationCost = baseCost * fieldArea;
		const annualMaintenance = installationCost * 0.05;

		const yieldProtection = 0.25;
		const avgYieldValue = 5000;
		const annualBenefit = avgYieldValue * yieldProtection;

		const paybackPeriod = installationCost / annualBenefit;
		const benefitCostRatio =
			annualBenefit / (installationCost / 10 + annualMaintenance);

		return {
			installationCost: Math.round(installationCost),
			annualMaintenance: Math.round(annualMaintenance),
			annualBenefit: Math.round(annualBenefit),
			paybackPeriod: {
				value: Math.round(paybackPeriod * 10) / 10,
				unit: "years",
				basis: "seasonal crop cycles",
			},
			benefitCostRatio: {
				value: Math.round(benefitCostRatio * 10) / 10,
				basis: "10-year analysis period",
			},
			recommendation:
				benefitCostRatio > 1.5 ? "highly_recommended" : "consider_alternatives",
		};
	}

	getInstallationTimeframe(systemType) {
		const timeframes = {
			subsurface_tile: "6-8 weeks",
			surface: "3-4 weeks",
			mole: "2-3 weeks",
			combination: "8-10 weeks",
			none: "N/A",
		};
		return timeframes[systemType] || "4-6 weeks";
	}

	generateEnhancedSaltBalanceRecommendations(balanceStatus, params) {
		const recommendations = [];
		const { status } = balanceStatus;

		if (status === "critical") {
			recommendations.push({
				priority: "URGENT",
				action: "Immediate leaching required",
				details:
					"Apply 150% normal irrigation depth to flush accumulated salts",
				sampleAction:
					"Apply 75mm leaching irrigation within 24 hours if normal irrigation is 50mm",
				timing: "within_24_hours",
				expectedOutcome: "Reduce soil salinity by 30-40% within one week",
			});
		} else if (status === "warning") {
			recommendations.push({
				priority: "HIGH",
				action: "Increase leaching frequency",
				details: "Apply leaching irrigation every 2-3 normal irrigations",
				sampleAction:
					"Schedule leaching every Tuesday and Friday if normal irrigation is Monday/Wednesday/Friday",
				timing: "within_week",
				expectedOutcome: "Stabilize salt accumulation within 2-3 weeks",
			});
		} else if (status === "improving") {
			recommendations.push({
				priority: "LOW",
				action: "Continue current management",
				details: "Salt balance is improving, maintain current practices",
				sampleAction:
					"Monitor soil EC monthly and maintain current irrigation schedule",
				timing: "ongoing",
				expectedOutcome: "Continued improvement in soil salinity levels",
			});
		}

		return recommendations;
	}

	// Import existing helper methods from original service
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
		const baseDepth = 25;
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

	assessCalculationConfidence(params) {
		const { soilEC, waterEC, cropThresholdEC } = params;

		if (waterEC < 4 && cropThresholdEC > 2) return "high";
		if (waterEC < 8 && cropThresholdEC > 1) return "medium";
		return "low";
	}

	calculateLeachingEconomics(params) {
		const { totalWaterNeed, irrigationDepth, waterEC, climateZone } = params;

		const extraWater = totalWaterNeed - irrigationDepth;
		const waterCost = this.constants.WATER_COSTS.desalinated;
		const extraWaterCost = extraWater * waterCost;

		const saltDamageRisk = Math.min(waterEC / 10, 0.8);
		const avgYieldValue = 5000;
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

	// Additional helper methods for completeness
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

	calculateDrainageCapacity(params) {
		const { leachingRequirement, fieldArea, saturatedConductivity } = params;

		let baseCapacity = 5;

		if (leachingRequirement && leachingRequirement.totalWaterNeed) {
			baseCapacity += leachingRequirement.totalWaterNeed * 0.1;
		}

		const permeabilityFactor = Math.min(saturatedConductivity / 10, 2.0);

		return baseCapacity * permeabilityFactor;
	}

	isDrainageRequired(params) {
		const {
			drainageClass,
			groundwaterDepth,
			seasonalWaterTable,
			saturatedConductivity,
			leachingRequirement,
		} = params;

		if (seasonalWaterTable || (groundwaterDepth && groundwaterDepth < 2)) {
			return true;
		}

		if (drainageClass === "poorly_drained" || saturatedConductivity < 2) {
			return true;
		}

		if (leachingRequirement && leachingRequirement.leachingFraction > 0.25) {
			return true;
		}

		return false;
	}

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
			systemType = "subsurface_tile";
			spacing = "15-25m";
			depth = "1.2-1.5m";
			material = "perforated_pvc";
		} else if (fieldSlope > 2) {
			systemType = "surface";
			spacing = "50-100m";
			depth = "0.3-0.5m";
			material = "graded_channels";
		} else if (saturatedConductivity < 5) {
			systemType = "mole";
			spacing = "20-40m";
			depth = "0.8-1.0m";
			material = "mole_channels";
		} else {
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
			const saltContent = fertilizer.saltIndex || 0.1;
			return total + fertilizer.amount * saltContent;
		}, 0);
	}

	estimateAtmosphericSalt(timeperiod) {
		const monthlyDeposition = 4.2;

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

		if (groundwaterDepth > 3) return 0;

		const capillaryRise = Math.max(0, 2 - groundwaterDepth);
		const saltContribution = capillaryRise * groundwaterEC * 0.3;

		return saltContribution;
	}

	assessSaltBalanceStatus(netBalance, timeperiod) {
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
}

module.exports = SaltManagementServiceEnhanced;
