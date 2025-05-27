/**
 * Enhanced Soil Controller for Advanced Visualization Features
 * Extends the base soil controller with regional data and advanced visualization endpoints
 *
 * @format
 */

const SoilController = require("./soilController");
const EnhancedSoilCalculationService = require("../services/enhancedSoilCalculationService");
const { validationResult } = require("express-validator");
const { prisma } = require("../config/database");

class EnhancedSoilController extends SoilController {
	/**
	 * Get moisture-tension curve data for visualization
	 * Professional+ feature for interactive moisture-tension graphs
	 */
	static async getMoistureTensionCurve(req, res) {
		try {
			const { analysisId } = req.params;
			const { includeRegional = false } = req.query;

			// Get the base analysis
			const analysis = await prisma.soilAnalysis.findUnique({
				where: { id: analysisId },
				include: {
					enhancedAnalysis: {
						include: {
							region: true,
							moistureTensionPoints: true,
						},
					},
					user: {
						select: { id: true, tier: true },
					},
				},
			});

			if (!analysis) {
				return res.status(404).json({ error: "Analysis not found" });
			}

			// Check user permissions
			if (analysis.userId !== req.user.id && req.user.tier !== "ENTERPRISE") {
				return res.status(403).json({ error: "Access denied" });
			}

			let curveData;

			// Check if we have cached curve data
			if (analysis.enhancedAnalysis?.moistureTensionPoints?.length > 0) {
				curveData = analysis.enhancedAnalysis.moistureTensionPoints.map(
					(point) => ({
						tension: point.tension,
						moistureContent: point.moistureContent,
						tensionLog: Math.log10(point.tension || 0.1),
					})
				);
			} else {
				// Generate new curve data
				const regionId =
					includeRegional && analysis.enhancedAnalysis?.regionId
						? analysis.enhancedAnalysis.regionId
						: null;

				curveData = EnhancedSoilCalculationService.generateMoistureTensionCurve(
					analysis.sand,
					analysis.clay,
					analysis.organicMatter,
					analysis.densityFactor,
					regionId
				);

				// Cache the curve data if enhanced analysis exists
				if (analysis.enhancedAnalysis) {
					await this.cacheMoistureTensionPoints(
						analysis.enhancedAnalysis.id,
						curveData
					);
				}
			}

			// Add key points for annotation
			const keyPoints = this.identifyKeyMoisturePoints(curveData, analysis);

			res.json({
				success: true,
				data: {
					analysisId,
					curveData,
					keyPoints,
					metadata: {
						sand: analysis.sand,
						clay: analysis.clay,
						organicMatter: analysis.organicMatter,
						textureClass: analysis.textureClass,
						region: analysis.enhancedAnalysis?.region?.regionName || null,
					},
				},
			});
		} catch (error) {
			console.error("Moisture-tension curve error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Get 3D soil profile data for visualization
	 * Professional+ feature for 3D soil profile visualization
	 */
	static async getSoilProfile3D(req, res) {
		try {
			const { analysisId } = req.params;
			const { maxDepth = 100, includeHorizons = true } = req.query;

			const analysis = await prisma.soilAnalysis.findUnique({
				where: { id: analysisId },
				include: {
					enhancedAnalysis: {
						include: { region: true },
					},
					user: { select: { id: true, tier: true } },
				},
			});

			if (!analysis) {
				return res.status(404).json({ error: "Analysis not found" });
			}

			if (analysis.userId !== req.user.id && req.user.tier !== "ENTERPRISE") {
				return res.status(403).json({ error: "Access denied" });
			}

			// Generate 3D profile data
			const profileData = EnhancedSoilCalculationService.calculateSoilProfile3D(
				analysis.sand,
				analysis.clay,
				analysis.organicMatter,
				analysis.densityFactor,
				parseInt(maxDepth)
			);

			// Add regional context if available
			if (analysis.enhancedAnalysis?.region) {
				profileData.regionalContext = {
					regionName: analysis.enhancedAnalysis.region.regionName,
					climateZone: analysis.enhancedAnalysis.region.climateZone,
					avgRainfall: analysis.enhancedAnalysis.region.avgAnnualRainfall,
				};
			}

			// Cache the profile data
			if (analysis.enhancedAnalysis) {
				await this.cacheProfileData(analysis.enhancedAnalysis.id, profileData);
			}

			res.json({
				success: true,
				data: {
					analysisId,
					profileData,
					visualizationSettings: {
						maxDepth: parseInt(maxDepth),
						includeHorizons: includeHorizons === "true",
						colorScheme: "soil_horizon",
						units: "metric",
					},
				},
			});
		} catch (error) {
			console.error("3D profile error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Compare multiple soil analyses
	 * Professional+ feature for comparative analysis charts
	 */
	static async compareAnalyses(req, res) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const {
				analysisIds,
				comparisonType = "general",
				name,
				description,
			} = req.body;

			if (!Array.isArray(analysisIds) || analysisIds.length < 2) {
				return res.status(400).json({
					error: "At least two analysis IDs required for comparison",
				});
			}

			if (analysisIds.length > 10) {
				return res.status(400).json({
					error: "Maximum 10 analyses can be compared at once",
				});
			}

			// Fetch all analyses
			const analyses = await prisma.soilAnalysis.findMany({
				where: {
					id: { in: analysisIds },
					OR: [
						{ userId: req.user.id },
						{ user: { tier: "ENTERPRISE" } }, // Enterprise users can compare any analyses
					],
				},
				include: {
					enhancedAnalysis: {
						include: { region: true },
					},
				},
			});

			if (analyses.length !== analysisIds.length) {
				return res.status(404).json({
					error: "Some analyses not found or access denied",
				});
			}

			// Perform comparative analysis
			const comparisonResults =
				EnhancedSoilCalculationService.performComparativeAnalysis(
					analyses,
					comparisonType
				);

			// Save comparison if requested
			let comparisonRecord = null;
			if (name) {
				comparisonRecord = await prisma.comparativeAnalysis.create({
					data: {
						name,
						description:
							description || `Comparison of ${analyses.length} soil analyses`,
						analysisType: comparisonType,
						userId: req.user.id,
						analysisIds: JSON.stringify(analysisIds),
						comparisonResults: JSON.stringify(comparisonResults),
						visualizationData: JSON.stringify(comparisonResults.chartData),
					},
				});
			}

			res.json({
				success: true,
				data: {
					comparison: comparisonResults,
					analysesInfo: analyses.map((a) => ({
						id: a.id,
						textureClass: a.textureClass,
						createdAt: a.createdAt,
						region: a.enhancedAnalysis?.region?.regionName || null,
					})),
					comparisonId: comparisonRecord?.id || null,
				},
			});
		} catch (error) {
			console.error("Comparative analysis error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Real-time parameter adjustment for interactive visualization
	 * Professional+ feature for dynamic parameter changes
	 */
	static async adjustParametersRealtime(req, res) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const {
				sand,
				clay,
				organicMatter = 2.5,
				densityFactor = 1.0,
				visualizationType,
				regionId = null,
			} = req.body;

			// Calculate updated results
			const baseResults =
				EnhancedSoilCalculationService.calculateWaterCharacteristics(
					sand,
					clay,
					organicMatter,
					densityFactor
				);

			let visualizationData = {};

			// Generate specific visualization data based on type
			switch (visualizationType) {
				case "moisture-tension":
					visualizationData.curveData =
						EnhancedSoilCalculationService.generateMoistureTensionCurve(
							sand,
							clay,
							organicMatter,
							densityFactor,
							regionId
						);
					break;

				case "3d-profile":
					visualizationData.profileData =
						EnhancedSoilCalculationService.calculateSoilProfile3D(
							sand,
							clay,
							organicMatter,
							densityFactor
						);
					break;

				case "seasonal":
					visualizationData.seasonalData =
						EnhancedSoilCalculationService.calculateSeasonalVariation(
							baseResults,
							regionId
						);
					break;

				default:
					// Return base results only
					break;
			}

			// Don't save to database for real-time adjustments
			res.json({
				success: true,
				data: {
					baseResults,
					visualizationData,
					parameters: { sand, clay, organicMatter, densityFactor },
					isRealtime: true,
					timestamp: new Date().toISOString(),
				},
			});
		} catch (error) {
			console.error("Real-time adjustment error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Get regional soil data for location-based adjustments
	 */
	static async getRegionalSoilData(req, res) {
		try {
			const { regionId } = req.params;
			const { includeAdjustments = false } = req.query;

			const region = await prisma.soilRegion.findUnique({
				where: { id: regionId },
				include: {
					enhancedAnalyses:
						includeAdjustments === "true"
							? {
									take: 5,
									orderBy: { createdAt: "desc" },
									select: {
										id: true,
										baseAnalysis: {
											select: {
												sand: true,
												clay: true,
												organicMatter: true,
												textureClass: true,
											},
										},
									},
							  }
							: false,
				},
			});

			if (!region) {
				return res.status(404).json({ error: "Region not found" });
			}

			const responseData = {
				region: {
					id: region.id,
					name: region.regionName,
					country: region.country,
					climateZone: region.climateZone,
					environmental: {
						avgRainfall: region.avgAnnualRainfall,
						avgTemperature: region.avgAnnualTemperature,
						frostFreeDays: region.frostFreeDays,
					},
					typicalSoil: {
						sandRange: region.typicalSandRange,
						clayRange: region.typicalClayRange,
						omRange: region.typicalOMRange,
					},
				},
			};

			// Add adjustment factors if available
			if (region.seasonalFactors) {
				try {
					responseData.adjustmentFactors = {
						seasonal: JSON.parse(region.seasonalFactors),
						climate: region.climateAdjustments
							? JSON.parse(region.climateAdjustments)
							: null,
					};
				} catch (e) {
					console.warn("Error parsing regional adjustment factors:", e);
				}
			}

			// Add recent analyses for context
			if (includeAdjustments === "true" && region.enhancedAnalyses) {
				responseData.recentAnalyses = region.enhancedAnalyses;
			}

			res.json({
				success: true,
				data: responseData,
			});
		} catch (error) {
			console.error("Regional data error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Get seasonal variation data for an analysis
	 */
	static async getSeasonalVariation(req, res) {
		try {
			const { analysisId } = req.params;

			const analysis = await prisma.soilAnalysis.findUnique({
				where: { id: analysisId },
				include: {
					enhancedAnalysis: {
						include: { region: true },
					},
					user: { select: { id: true, tier: true } },
				},
			});

			if (!analysis) {
				return res.status(404).json({ error: "Analysis not found" });
			}

			if (analysis.userId !== req.user.id && req.user.tier !== "ENTERPRISE") {
				return res.status(403).json({ error: "Access denied" });
			}

			const baseResults = {
				fieldCapacity: analysis.fieldCapacity,
				wiltingPoint: analysis.wiltingPoint,
				plantAvailableWater: analysis.plantAvailableWater,
				saturation: analysis.saturation,
			};

			const regionId = analysis.enhancedAnalysis?.regionId || null;
			const seasonalData =
				EnhancedSoilCalculationService.calculateSeasonalVariation(
					baseResults,
					regionId
				);

			res.json({
				success: true,
				data: {
					analysisId,
					seasonalVariation: seasonalData,
					regionContext: analysis.enhancedAnalysis?.region
						? {
								name: analysis.enhancedAnalysis.region.regionName,
								climateZone: analysis.enhancedAnalysis.region.climateZone,
						  }
						: null,
				},
			});
		} catch (error) {
			console.error("Seasonal variation error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Create or update enhanced analysis record
	 */
	static async createEnhancedAnalysis(req, res) {
		try {
			const {
				baseAnalysisId,
				regionId,
				latitude,
				longitude,
				elevation,
				siteDescription,
				additionalParameters = {},
			} = req.body;

			// Verify base analysis exists and belongs to user
			const baseAnalysis = await prisma.soilAnalysis.findUnique({
				where: { id: baseAnalysisId },
				include: { user: { select: { id: true } } },
			});

			if (!baseAnalysis) {
				return res.status(404).json({ error: "Base analysis not found" });
			}

			if (baseAnalysis.userId !== req.user.id) {
				return res.status(403).json({ error: "Access denied" });
			}

			// Create or update enhanced analysis
			const enhancedAnalysis = await prisma.enhancedSoilAnalysis.upsert({
				where: { baseAnalysisId },
				update: {
					regionId,
					latitude,
					longitude,
					elevation,
					siteDescription,
					...additionalParameters,
					hasVisualizationData: true,
					lastVisualizationCalc: new Date(),
				},
				create: {
					baseAnalysisId,
					regionId,
					latitude,
					longitude,
					elevation,
					siteDescription,
					...additionalParameters,
					hasVisualizationData: true,
					lastVisualizationCalc: new Date(),
				},
				include: {
					region: true,
					baseAnalysis: true,
				},
			});

			res.json({
				success: true,
				data: enhancedAnalysis,
			});
		} catch (error) {
			console.error("Enhanced analysis creation error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	// Helper methods

	/**
	 * Cache moisture tension points in database
	 */
	static async cacheMoistureTensionPoints(enhancedAnalysisId, curveData) {
		try {
			// Delete existing points
			await prisma.moistureTensionPoint.deleteMany({
				where: { enhancedAnalysisId },
			});

			// Insert new points
			const pointsToInsert = curveData.map((point) => ({
				enhancedAnalysisId,
				tension: point.tension,
				moistureContent: point.moistureContent,
				isCalculated: true,
				calculationMethod: "Saxton-Rawls-Enhanced",
			}));

			await prisma.moistureTensionPoint.createMany({
				data: pointsToInsert,
			});
		} catch (error) {
			console.error("Error caching moisture tension points:", error);
		}
	}

	/**
	 * Cache 3D profile data
	 */
	static async cacheProfileData(enhancedAnalysisId, profileData) {
		try {
			await prisma.enhancedSoilAnalysis.update({
				where: { id: enhancedAnalysisId },
				data: {
					soilHorizons: JSON.stringify(profileData.horizons),
					hasVisualizationData: true,
					lastVisualizationCalc: new Date(),
				},
			});
		} catch (error) {
			console.error("Error caching profile data:", error);
		}
	}

	/**
	 * Get available regions for soil analysis
	 */
	static async getAvailableRegions(req, res) {
		try {
			const regions = await prisma.soilRegion.findMany({
				where: { isActive: true },
				select: {
					id: true,
					regionName: true,
					country: true,
					state: true,
					climateZone: true,
					avgAnnualRainfall: true,
					avgAnnualTemperature: true,
					typicalSandRange: true,
					typicalClayRange: true,
					typicalOMRange: true,
				},
				orderBy: [{ country: "asc" }, { regionName: "asc" }],
			});

			res.json({
				success: true,
				data: {
					regions,
					count: regions.length,
				},
			});
		} catch (error) {
			console.error("Get available regions error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Identify key moisture points for annotation
	 */
	static identifyKeyMoisturePoints(curveData, analysis) {
		const keyPoints = [];

		// Find field capacity point (33 kPa)
		const fcPoint = curveData.find((p) => p.tension === 33);
		if (fcPoint) {
			keyPoints.push({
				tension: 33,
				moisture: fcPoint.moistureContent,
				label: "Field Capacity",
				color: "#2196F3",
				description: "Water held after drainage",
			});
		}

		// Find wilting point (1500 kPa)
		const wpPoint = curveData.find((p) => p.tension === 1500);
		if (wpPoint) {
			keyPoints.push({
				tension: 1500,
				moisture: wpPoint.moistureContent,
				label: "Wilting Point",
				color: "#FF9800",
				description: "Lower limit of plant available water",
			});
		}

		// Find saturation point (0-1 kPa range)
		const satPoint = curveData.find((p) => p.tension <= 1);
		if (satPoint) {
			keyPoints.push({
				tension: satPoint.tension,
				moisture: satPoint.moistureContent,
				label: "Saturation",
				color: "#4CAF50",
				description: "Maximum water content",
			});
		}

		return keyPoints;
	}
}

module.exports = EnhancedSoilController;
