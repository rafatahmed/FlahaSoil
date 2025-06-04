/** @format */

const { PrismaClient } = require("@prisma/client");
const DSSCalculationService = require("../services/dssCalculationService");

const prisma = new PrismaClient();

class DSSController {
	/**
	 * Get all available crops for DSS
	 */
	async getCrops(req, res) {
		try {
			const crops = await prisma.crop.findMany({
				where: { isActive: true },
				select: {
					id: true,
					name: true,
					scientificName: true,
					type: true,
					category: true,
					growthPeriodMin: true,
					growthPeriodMax: true,
					rootDepthMax: true,
					climateZones: true,
					soilPreferences: true,
				},
				orderBy: { name: "asc" },
			});

			// Parse JSON fields
			const cropsWithParsedData = crops.map((crop) => ({
				...crop,
				climateZones: crop.climateZones ? JSON.parse(crop.climateZones) : [],
				soilPreferences: crop.soilPreferences
					? JSON.parse(crop.soilPreferences)
					: {},
			}));

			res.json({
				success: true,
				data: cropsWithParsedData,
				count: cropsWithParsedData.length,
			});
		} catch (error) {
			console.error("Error fetching crops:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch crops",
				details: error.message,
			});
		}
	}

	/**
	 * Get BBCH stages for a specific crop
	 */
	async getCropStages(req, res) {
		try {
			const { cropId } = req.params;

			const stages = await prisma.bBCHStage.findMany({
				where: { cropId },
				orderBy: { stageCode: "asc" },
			});

			if (stages.length === 0) {
				return res.status(404).json({
					success: false,
					error: "No stages found for this crop",
				});
			}

			res.json({
				success: true,
				data: stages,
				count: stages.length,
			});
		} catch (error) {
			console.error("Error fetching crop stages:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch crop stages",
				details: error.message,
			});
		}
	}

	/**
	 * Get Kc coefficients for a specific crop
	 */
	async getCropKc(req, res) {
		try {
			const { cropId } = req.params;
			const { climateZone = "temperate", irrigationMethod = "sprinkler" } =
				req.query;

			const kcPeriods = await prisma.kcPeriod.findMany({
				where: {
					cropId,
					climateZone,
					irrigationMethod,
				},
				orderBy: { periodStartDays: "asc" },
			});

			if (kcPeriods.length === 0) {
				// Fallback to default values if specific combination not found
				const fallbackKc = await prisma.kcPeriod.findMany({
					where: { cropId },
					orderBy: { periodStartDays: "asc" },
					take: 4, // Get first 4 periods as fallback
				});

				return res.json({
					success: true,
					data: fallbackKc,
					count: fallbackKc.length,
					note: "Using fallback Kc values - specific climate/irrigation combination not available",
				});
			}

			res.json({
				success: true,
				data: kcPeriods,
				count: kcPeriods.length,
			});
		} catch (error) {
			console.error("Error fetching crop Kc:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch crop Kc coefficients",
				details: error.message,
			});
		}
	}

	/**
	 * Calculate irrigation recommendations
	 */
	async calculateIrrigation(req, res) {
		try {
			const {
				soilAnalysisId,
				cropId,
				fieldArea,
				fieldSlope,
				fieldElevation,
				et0Value,
				et0Source = "manual", // 'manual', 'flahacalc', 'weather_api'
				weatherSource = "manual",
				climateZone = "temperate",
				irrigationMethod = "sprinkler",
				growthStage = "mid",
				// Location data for FlahaCalc API
				latitude,
				longitude,
				calculationDate,
			} = req.body;

			// Validate required fields
			if (!soilAnalysisId || !cropId || !fieldArea) {
				return res.status(400).json({
					success: false,
					error: "Missing required fields: soilAnalysisId, cropId, fieldArea",
				});
			}

			// Validate ET₀ source and required parameters
			if (et0Source === "manual" && (!et0Value || et0Value <= 0)) {
				return res.status(400).json({
					success: false,
					error:
						"Manual ET₀ source requires a valid et0Value (mm/day) greater than 0",
				});
			}

			if (et0Source === "flahacalc" && (!latitude || !longitude)) {
				return res.status(400).json({
					success: false,
					error:
						"FlahaCalc ET₀ source requires latitude and longitude coordinates",
				});
			}

			// Get soil analysis data
			const soilAnalysis = await prisma.soilAnalysis.findUnique({
				where: { id: soilAnalysisId },
			});

			if (!soilAnalysis) {
				return res.status(404).json({
					success: false,
					error: "Soil analysis not found",
				});
			}

			// Get crop data
			const crop = await prisma.crop.findUnique({
				where: { id: cropId },
				include: {
					kcPeriods: {
						where: {
							climateZone,
							irrigationMethod,
						},
					},
				},
			});

			if (!crop) {
				return res.status(404).json({
					success: false,
					error: "Crop not found",
				});
			}

			// Process ET₀ value based on source
			let finalET0Value = et0Value;
			let et0Metadata = {
				source: et0Source,
				value: et0Value,
				unit: "mm/day",
			};

			if (et0Source === "flahacalc") {
				try {
					const WeatherService = require("../services/weatherService");
					const weatherService = new WeatherService();

					const et0Data = await weatherService.getFlahaCalcET0(
						parseFloat(latitude),
						parseFloat(longitude),
						calculationDate
					);

					finalET0Value = et0Data.et0;
					et0Metadata = {
						source: "flahacalc",
						value: et0Data.et0,
						unit: "mm/day",
						dataSource: et0Data.dataSource,
						calculationMethod: et0Data.calculationMethod,
						location: et0Data.location,
						date: et0Data.date,
						temperature: et0Data.temperature,
						humidity: et0Data.humidity,
						windSpeed: et0Data.windSpeed,
					};

					console.log(`FlahaCalc ET₀ retrieved: ${finalET0Value} mm/day`);
				} catch (error) {
					console.error("FlahaCalc ET₀ retrieval failed:", error.message);

					// Fallback to manual value if provided, otherwise use regional average
					if (et0Value && et0Value > 0) {
						finalET0Value = et0Value;
						et0Metadata.note = "FlahaCalc failed, using provided manual value";
					} else {
						// Use regional average as last resort
						const weatherService =
							new (require("../services/weatherService"))();
						finalET0Value = weatherService.getRegionalET0Average(
							parseFloat(latitude),
							parseFloat(longitude),
							calculationDate || new Date().toISOString().split("T")[0]
						);
						et0Metadata = {
							source: "regional_average",
							value: finalET0Value,
							unit: "mm/day",
							note: "FlahaCalc failed, using regional average",
						};
					}
				}
			}

			// Perform DSS calculations
			const calculationService = new DSSCalculationService();
			const results =
				await calculationService.calculateIrrigationRecommendations({
					soilData: soilAnalysis,
					cropData: crop,
					fieldConfig: {
						area: fieldArea,
						slope: fieldSlope,
						elevation: fieldElevation,
					},
					environmentalData: {
						et0: finalET0Value,
						climateZone,
						irrigationMethod,
						growthStage,
					},
				});

			// Save calculation to database
			const savedCalculation = await prisma.dSSCalculation.create({
				data: {
					userId: req.user?.id,
					soilAnalysisId,
					cropId,
					fieldArea,
					fieldSlope,
					fieldElevation,
					et0Value: finalET0Value,
					weatherSource: et0Source, // Store the ET₀ source instead of weather source
					climateZone,
					etcCalculated: results.etcCalculated,
					irrigationDepth: results.irrigationDepth,
					irrigationFrequency: results.irrigationFrequency,
					maxApplicationRate: results.maxApplicationRate,
					systemRecommendation: results.systemRecommendation,
					systemEfficiency: results.systemEfficiency,
					systemCost: results.systemCost,
					economicROI: results.economicROI,
					paybackPeriod: results.paybackPeriod,
					annualWaterSavings: results.annualWaterSavings,
					annualCostSavings: results.annualCostSavings,
					calculationMethod: "fao56",
					calculationVersion: "1.0",
					detailedResults: JSON.stringify({
						...results.detailedResults,
						et0Metadata, // Include ET₀ metadata in detailed results
					}),
					recommendations: JSON.stringify(results.recommendations),
					scheduleData: JSON.stringify(results.scheduleData),
				},
			});

			res.json({
				success: true,
				data: {
					calculationId: savedCalculation.id,
					...results,
					et0Metadata, // Include ET₀ metadata in response
				},
			});
		} catch (error) {
			console.error("Error calculating irrigation:", error);
			res.status(500).json({
				success: false,
				error: "Failed to calculate irrigation recommendations",
				details: error.message,
			});
		}
	}

	/**
	 * Get DSS calculation history for a user
	 */
	async getCalculationHistory(req, res) {
		try {
			const userId = req.user?.id;
			const { page = 1, limit = 10 } = req.query;

			const calculations = await prisma.dSSCalculation.findMany({
				where: { userId },
				include: {
					crop: {
						select: { name: true, type: true },
					},
					soilAnalysis: {
						select: { textureClass: true, createdAt: true },
					},
				},
				orderBy: { createdAt: "desc" },
				skip: (page - 1) * limit,
				take: parseInt(limit),
			});

			const total = await prisma.dSSCalculation.count({
				where: { userId },
			});

			res.json({
				success: true,
				data: calculations,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					pages: Math.ceil(total / limit),
				},
			});
		} catch (error) {
			console.error("Error fetching calculation history:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch calculation history",
				details: error.message,
			});
		}
	}

	/**
	 * Get a specific DSS calculation by ID
	 */
	async getCalculation(req, res) {
		try {
			const { calculationId } = req.params;
			const userId = req.user?.id;

			const calculation = await prisma.dSSCalculation.findFirst({
				where: {
					id: calculationId,
					userId, // Ensure user can only access their own calculations
				},
				include: {
					crop: true,
					soilAnalysis: true,
				},
			});

			if (!calculation) {
				return res.status(404).json({
					success: false,
					error: "Calculation not found",
				});
			}

			// Parse JSON fields
			const calculationWithParsedData = {
				...calculation,
				detailedResults: calculation.detailedResults
					? JSON.parse(calculation.detailedResults)
					: null,
				recommendations: calculation.recommendations
					? JSON.parse(calculation.recommendations)
					: null,
				scheduleData: calculation.scheduleData
					? JSON.parse(calculation.scheduleData)
					: null,
			};

			res.json({
				success: true,
				data: calculationWithParsedData,
			});
		} catch (error) {
			console.error("Error fetching calculation:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch calculation",
				details: error.message,
			});
		}
	}

	/**
	 * Save DSS calculation for Recent Analyses
	 */
	async saveCalculation(req, res) {
		try {
			const { type, userLevel, soilData, calculation, timestamp } = req.body;

			// Validate required fields
			if (!type || !userLevel || !calculation) {
				return res.status(400).json({
					success: false,
					error: "Missing required fields: type, userLevel, calculation",
				});
			}

			// Create a simplified calculation record for Recent Analyses
			const savedCalculation = await prisma.dSSCalculation.create({
				data: {
					userId: req.user?.id,
					soilAnalysisId: soilData?.id || null,
					cropId: calculation.cropId || null,
					fieldArea: calculation.fieldArea || 1.0,
					et0Value: calculation.et0 || 5.0,
					climateZone: calculation.climateZone || "temperate",
					irrigationMethod: calculation.irrigationMethod || "drip",
					growthStage: calculation.growthStage || "mid",
					etcCalculated: calculation.etc || 0,
					irrigationDepth: calculation.irrigationRequirement || 0,
					irrigationFrequency: calculation.irrigationFrequency || 0,
					maxApplicationRate: calculation.applicationRate || 0,
					systemEfficiency: calculation.systemEfficiency || 0.9,
					systemRecommendation: calculation.systemRecommendation || "drip",
					calculationMethod: "dss_frontend",
					calculationVersion: "1.0",
					detailedResults: JSON.stringify(calculation),
					recommendations: JSON.stringify(calculation.recommendations || {}),
					metadata: JSON.stringify({
						userLevel,
						type,
						timestamp: timestamp || new Date().toISOString(),
						soilTexture: soilData?.textureClass || "Unknown",
						cropName: calculation.cropName || "Unknown",
					}),
				},
			});

			res.json({
				success: true,
				data: {
					calculationId: savedCalculation.id,
					message: "Calculation saved successfully to Recent Analyses",
				},
			});
		} catch (error) {
			console.error("Error saving DSS calculation:", error);
			res.status(500).json({
				success: false,
				error: "Failed to save calculation",
				details: error.message,
			});
		}
	}
}

module.exports = new DSSController();
