/**
 * Salt Management API Routes for FlahaSoil DSS
 * Provides comprehensive leaching/drainage calculations and recommendations
 *
 * @format
 */

const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const SaltManagementService = require("../services/saltManagementService");
const auth = require("../middleware/auth");
const planAccess = require("../middleware/planAccess");
const { validateRequest } = require("../middleware/validation");
const { professionalLimit } = require("../middleware/rateLimit");

const prisma = new PrismaClient();
const saltService = new SaltManagementService();

// Apply authentication to all salt management routes
router.use(auth);

// Apply professional tier requirement for salt management features
router.use(planAccess.requireFeature("advancedCalculations"));

/**
 * POST /api/v1/salt-management/leaching-requirement
 * Calculate leaching requirements for given conditions
 */
router.post(
	"/leaching-requirement",
	professionalLimit,
	validateRequest({
		body: {
			soilEC: { type: "number", min: 0, max: 50, required: true },
			waterEC: { type: "number", min: 0, max: 25, required: true },
			cropThresholdEC: { type: "number", min: 0, max: 25, required: true },
			climateZone: {
				type: "string",
				enum: ["gcc_arid", "mena_mediterranean", "temperate"],
				default: "gcc_arid",
			},
			season: {
				type: "string",
				enum: ["summer", "winter", "transition"],
				default: "summer",
			},
			soilAnalysisId: { type: "string", required: true },
			evaporationRate: { type: "number", min: 0, max: 20, required: false },
			temperature: { type: "number", min: 0, max: 60, required: false },
			humidity: { type: "number", min: 0, max: 100, required: false },
		},
	}),
	async (req, res) => {
		try {
			const userId = req.user.id;
			const {
				soilEC,
				waterEC,
				cropThresholdEC,
				climateZone,
				season,
				soilAnalysisId,
				evaporationRate,
				temperature,
				humidity,
			} = req.body;

			// Verify soil analysis belongs to user
			const soilAnalysis = await prisma.soilAnalysis.findFirst({
				where: {
					id: soilAnalysisId,
					userId: userId,
				},
			});

			if (!soilAnalysis) {
				return res.status(404).json({
					success: false,
					error: "Soil analysis not found or access denied",
				});
			}

			// Calculate leaching requirement
			const leachingResult = saltService.calculateLeachingRequirement({
				soilEC,
				waterEC,
				cropThresholdEC,
				climateZone,
				season,
				evaporationRate,
				temperature,
				humidity,
			});

			// Save calculation to database
			const savedCalculation = await prisma.leachingCalculation.create({
				data: {
					userId: userId,
					soilAnalysisId: soilAnalysisId,
					soilEC: soilEC,
					waterEC: waterEC,
					cropThresholdEC: cropThresholdEC,
					climateZone: climateZone,
					evaporationRate: evaporationRate,
					temperature: temperature,
					humidity: humidity,
					season: season,
					leachingFraction: leachingResult.results.leachingFraction,
					leachingDepth: leachingResult.results.leachingDepth,
					totalWaterNeed: leachingResult.results.totalWaterNeed,
					leachingFrequency: leachingResult.results.leachingFrequency,
					climateFactor: leachingResult.calculations.climateFactor,
					seasonalFactor: leachingResult.calculations.seasonalFactor,
					adjustedLF: leachingResult.calculations.adjustedLF,
					extraWaterCost: leachingResult.economics.extraWaterCost,
					saltDamageRisk: leachingResult.economics.potentialSaltDamage / 5000, // Normalize to 0-1
					recommendedAction: leachingResult.economics.recommendation,
					calculationMethod: leachingResult.metadata.calculationMethod,
					calculationVersion: leachingResult.metadata.calculationVersion,
					detailedResults: JSON.stringify(leachingResult),
					recommendations: JSON.stringify(leachingResult.recommendations),
				},
			});

			res.json({
				success: true,
				data: {
					calculationId: savedCalculation.id,
					...leachingResult,
				},
			});
		} catch (error) {
			console.error("Leaching calculation error:", error);
			res.status(500).json({
				success: false,
				error: "Failed to calculate leaching requirement",
				details: error.message,
			});
		}
	}
);

/**
 * POST /api/v1/salt-management/drainage-assessment
 * Assess drainage requirements for a field
 */
router.post(
	"/drainage-assessment",
	professionalLimit,
	validateRequest({
		body: {
			soilAnalysisId: { type: "string", required: true },
			fieldArea: { type: "number", min: 0.1, max: 10000, required: true },
			fieldSlope: { type: "number", min: 0, max: 50, default: 0 },
			groundwaterDepth: { type: "number", min: 0, max: 20, required: false },
			seasonalWaterTable: { type: "boolean", default: false },
			leachingCalculationId: { type: "string", required: false },
		},
	}),
	async (req, res) => {
		try {
			const userId = req.user.id;
			const {
				soilAnalysisId,
				fieldArea,
				fieldSlope,
				groundwaterDepth,
				seasonalWaterTable,
				leachingCalculationId,
			} = req.body;

			// Verify soil analysis belongs to user
			const soilAnalysis = await prisma.soilAnalysis.findFirst({
				where: {
					id: soilAnalysisId,
					userId: userId,
				},
			});

			if (!soilAnalysis) {
				return res.status(404).json({
					success: false,
					error: "Soil analysis not found or access denied",
				});
			}

			// Get leaching requirement if provided
			let leachingRequirement = null;
			if (leachingCalculationId) {
				const leachingCalc = await prisma.leachingCalculation.findFirst({
					where: {
						id: leachingCalculationId,
						userId: userId,
					},
				});

				if (leachingCalc) {
					leachingRequirement = {
						leachingFraction: leachingCalc.leachingFraction,
						totalWaterNeed: leachingCalc.totalWaterNeed,
					};
				}
			}

			// Prepare soil data
			const soilData = {
				saturatedConductivity: soilAnalysis.saturatedConductivity,
				textureClass: soilAnalysis.textureClass,
				clay: soilAnalysis.clay,
			};

			// Assess drainage requirements
			const drainageResult = saltService.assessDrainageRequirements({
				soilData,
				fieldArea,
				fieldSlope,
				groundwaterDepth,
				seasonalWaterTable,
				leachingRequirement,
			});

			// Save assessment to database
			const savedAssessment = await prisma.drainageAssessment.create({
				data: {
					userId: userId,
					soilAnalysisId: soilAnalysisId,
					leachingCalcId: leachingCalculationId,
					fieldArea: fieldArea,
					fieldSlope: fieldSlope,
					groundwaterDepth: groundwaterDepth,
					seasonalWaterTable: seasonalWaterTable,
					drainageClass: drainageResult.assessment.drainageClass,
					infiltrationRate: soilData.saturatedConductivity,
					drainageRequired: drainageResult.assessment.drainageRequired,
					urgencyLevel: drainageResult.assessment.urgencyLevel,
					drainageCapacity: drainageResult.assessment.drainageCapacity,
					primarySystem: drainageResult.system.systemType,
					systemSpacing: drainageResult.system.specifications?.spacing,
					systemDepth: drainageResult.system.specifications?.depth,
					materialType: drainageResult.system.specifications?.material,
					installationCost: drainageResult.economics.installationCost,
					maintenanceCost: drainageResult.economics.annualMaintenance,
					expectedLifespan: 15, // Default 15 years
					installationTime: drainageResult.implementation.totalDuration,
					costBenefitRatio: drainageResult.economics.benefitCostRatio,
					paybackPeriod: drainageResult.economics.paybackPeriod,
					yieldProtection: 0.25, // Default 25% yield protection
					assessmentMethod: drainageResult.metadata.assessmentMethod,
					assessmentVersion: drainageResult.metadata.assessmentVersion,
					technicalSpecs: JSON.stringify(drainageResult.system),
					installationPlan: JSON.stringify(drainageResult.implementation),
				},
			});

			res.json({
				success: true,
				data: {
					assessmentId: savedAssessment.id,
					...drainageResult,
				},
			});
		} catch (error) {
			console.error("Drainage assessment error:", error);
			res.status(500).json({
				success: false,
				error: "Failed to assess drainage requirements",
				details: error.message,
			});
		}
	}
);

/**
 * POST /api/v1/salt-management/salt-balance
 * Calculate salt balance for field monitoring
 */
router.post(
	"/salt-balance",
	professionalLimit,
	validateRequest({
		body: {
			soilAnalysisId: { type: "string", required: true },
			irrigationVolume: { type: "number", min: 0, max: 1000, required: true },
			irrigationEC: { type: "number", min: 0, max: 25, required: true },
			fertilizerInputs: { type: "array", default: [] },
			precipitationVolume: { type: "number", min: 0, max: 500, default: 0 },
			leachingVolume: { type: "number", min: 0, max: 500, default: 0 },
			drainageVolume: { type: "number", min: 0, max: 500, default: 0 },
			cropUptake: { type: "number", min: 0, max: 100, default: 0 },
			fieldArea: { type: "number", min: 0.1, max: 10000, required: true },
			timeperiod: {
				type: "string",
				enum: ["monthly", "seasonal", "annual"],
				default: "monthly",
			},
			monitoringDate: { type: "string", required: false },
			season: {
				type: "string",
				enum: ["spring", "summer", "fall", "winter"],
				required: false,
			},
			cropGrowthStage: { type: "string", required: false },
		},
	}),
	async (req, res) => {
		try {
			const userId = req.user.id;
			const {
				soilAnalysisId,
				irrigationVolume,
				irrigationEC,
				fertilizerInputs,
				precipitationVolume,
				leachingVolume,
				drainageVolume,
				cropUptake,
				fieldArea,
				timeperiod,
				monitoringDate,
				season,
				cropGrowthStage,
			} = req.body;

			// Verify soil analysis belongs to user
			const soilAnalysis = await prisma.soilAnalysis.findFirst({
				where: {
					id: soilAnalysisId,
					userId: userId,
				},
			});

			if (!soilAnalysis) {
				return res.status(404).json({
					success: false,
					error: "Soil analysis not found or access denied",
				});
			}

			// Calculate salt balance
			const saltBalanceResult = saltService.calculateSaltBalance({
				irrigationVolume,
				irrigationEC,
				fertilizerInputs,
				precipitationVolume,
				leachingVolume,
				drainageVolume,
				cropUptake,
				fieldArea,
				timeperiod,
			});

			// Save salt balance record to database
			const savedRecord = await prisma.saltBalanceRecord.create({
				data: {
					userId: userId,
					soilAnalysisId: soilAnalysisId,
					monitoringDate: monitoringDate
						? new Date(monitoringDate)
						: new Date(),
					season: season,
					cropGrowthStage: cropGrowthStage,
					irrigationSalt: saltBalanceResult.saltInputs.irrigation,
					fertilizerSalt: saltBalanceResult.saltInputs.fertilizer,
					atmosphericSalt: saltBalanceResult.saltInputs.atmospheric,
					groundwaterSalt: saltBalanceResult.saltInputs.groundwater,
					leachingSalt: saltBalanceResult.saltOutputs.leaching,
					drainageSalt: saltBalanceResult.saltOutputs.drainage,
					cropUptakeSalt: saltBalanceResult.saltOutputs.cropUptake,
					surfaceRunoffSalt: saltBalanceResult.saltOutputs.surfaceRunoff,
					totalSaltInput: saltBalanceResult.balance.totalInputs,
					totalSaltOutput: saltBalanceResult.balance.totalOutputs,
					netSaltBalance: saltBalanceResult.balance.netBalance,
					soilSalinityTrend: saltBalanceResult.balance.trend,
					alertLevel: saltBalanceResult.balance.balanceStatus,
					actionRequired:
						saltBalanceResult.balance.balanceStatus === "critical" ||
						saltBalanceResult.balance.balanceStatus === "warning",
					recommendedActions: JSON.stringify(saltBalanceResult.recommendations),
					nextMonitoringDate: new Date(
						Date.now() +
							(timeperiod === "monthly"
								? 30
								: timeperiod === "seasonal"
								? 90
								: 365) *
								24 *
								60 *
								60 *
								1000
					),
					dataSource: "calculated",
				},
			});

			res.json({
				success: true,
				data: {
					recordId: savedRecord.id,
					...saltBalanceResult,
				},
			});
		} catch (error) {
			console.error("Salt balance calculation error:", error);
			res.status(500).json({
				success: false,
				error: "Failed to calculate salt balance",
				details: error.message,
			});
		}
	}
);

module.exports = router;
