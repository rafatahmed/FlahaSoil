/** @format */

const SoilCalculationService = require("../services/soilCalculationService");
const { validationResult } = require("express-validator");
const { prisma } = require("../config/database");

class SoilController {
	/**
	 * Analyze soil composition and return water characteristics
	 */
	static async analyzeSoil(req, res) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({ errors: errors.array() });
			}

			const { sand, clay, organicMatter = 2.5, densityFactor = 1.0 } = req.body;

			// Get user tier and features
			const userTier = req.user?.tier || "FREE";
			const planFeatures = req.planFeatures || {};

			// Calculate soil characteristics
			const result = SoilCalculationService.calculateWaterCharacteristics(
				sand,
				clay,
				organicMatter,
				densityFactor
			);

			// Log usage for analytics
			await SoilController.logUsage(req.user?.id, req.body, req);

			// Save to history if user has access
			if (req.user && planFeatures.analysisHistory) {
				await SoilController.saveAnalysisToHistory(
					req.user.id,
					req.body,
					result
				);
			}

			res.json({
				success: true,
				data: result,
				tier: userTier,
				features: planFeatures,
				usage: {
					current: req.user?.usageCount || 0,
					limit: req.usageLimit || 50,
					unlimited: req.usageLimit === -1,
				},
			});
		} catch (error) {
			console.error("Soil analysis error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Advanced soil analysis with additional features
	 */
	static async analyzeSoilAdvanced(req, res) {
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
				additionalParameters = {},
			} = req.body;

			// Calculate advanced soil characteristics
			const result = SoilCalculationService.calculateAdvanced(
				sand,
				clay,
				organicMatter,
				densityFactor,
				additionalParameters
			);

			// Log usage and save to history
			await SoilController.logUsage(req.user.id, req.body, req);
			await SoilController.saveAnalysisToHistory(req.user.id, req.body, result);

			res.json({
				success: true,
				data: result,
				tier: req.user.tier,
				analysisType: "advanced",
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Advanced soil analysis error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Batch analysis for multiple soil samples
	 */
	static async analyzeBatch(req, res) {
		try {
			const { samples } = req.body;

			if (!Array.isArray(samples) || samples.length === 0) {
				return res.status(400).json({
					error: "Samples array is required",
				});
			}

			if (samples.length > 100) {
				return res.status(400).json({
					error: "Maximum 100 samples per batch",
				});
			}

			const results = [];

			for (const sample of samples) {
				const {
					sand,
					clay,
					organicMatter = 2.5,
					densityFactor = 1.0,
					id,
				} = sample;

				const result = SoilCalculationService.calculateWaterCharacteristics(
					sand,
					clay,
					organicMatter,
					densityFactor
				);

				results.push({
					id: id || results.length + 1,
					...result,
				});

				// Save each analysis to history
				await SoilController.saveAnalysisToHistory(req.user.id, sample, result);
			}

			// Log batch usage
			await SoilController.logUsage(
				req.user.id,
				{ batchSize: samples.length },
				req
			);

			res.json({
				success: true,
				data: results,
				batchSize: samples.length,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Batch analysis error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Get analysis history for user
	 */
	static async getAnalysisHistory(req, res) {
		try {
			const {
				page = 1,
				limit = 50,
				sortBy = "createdAt",
				order = "desc",
			} = req.query;

			const analyses = await prisma.soilAnalysis.findMany({
				where: { userId: req.user.id },
				orderBy: { [sortBy]: order },
				skip: (page - 1) * limit,
				take: parseInt(limit),
				select: {
					id: true,
					sand: true,
					clay: true,
					silt: true,
					organicMatter: true,
					densityFactor: true,
					fieldCapacity: true,
					wiltingPoint: true,
					plantAvailableWater: true,
					textureClass: true,
					createdAt: true,
				},
			});

			const total = await prisma.soilAnalysis.count({
				where: { userId: req.user.id },
			});

			res.json({
				success: true,
				data: analyses,
				pagination: {
					page: parseInt(page),
					limit: parseInt(limit),
					total,
					pages: Math.ceil(total / limit),
				},
			});
		} catch (error) {
			console.error("Analysis history error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Export analysis data
	 */
	static async exportAnalysis(req, res) {
		try {
			const { format } = req.params;
			const { startDate, endDate } = req.query;

			const whereClause = { userId: req.user.id };

			if (startDate || endDate) {
				whereClause.createdAt = {};
				if (startDate) whereClause.createdAt.gte = new Date(startDate);
				if (endDate) whereClause.createdAt.lte = new Date(endDate);
			}

			const analyses = await prisma.soilAnalysis.findMany({
				where: whereClause,
				orderBy: { createdAt: "desc" },
			});

			if (format === "csv") {
				const csv = SoilController.generateCSV(analyses);
				res.setHeader("Content-Type", "text/csv");
				res.setHeader(
					"Content-Disposition",
					"attachment; filename=soil-analyses.csv"
				);
				res.send(csv);
			} else if (format === "json") {
				res.json({
					success: true,
					data: analyses,
					exportDate: new Date().toISOString(),
				});
			} else {
				res.status(400).json({ error: "Unsupported format" });
			}
		} catch (error) {
			console.error("Export error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * API endpoint for enterprise users
	 */
	static async apiAnalyzeSoil(req, res) {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(400).json({
					error: "Validation failed",
					details: errors.array(),
				});
			}

			const { sand, clay, organicMatter = 2.5, densityFactor = 1.0 } = req.body;

			const result = SoilCalculationService.calculateWaterCharacteristics(
				sand,
				clay,
				organicMatter,
				densityFactor
			);

			// Log API usage
			await SoilController.logUsage(req.user.id, req.body, req, "api");

			res.json({
				success: true,
				data: result,
				apiVersion: "1.0",
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("API analysis error:", error);
			res.status(500).json({
				error: "Internal server error",
				code: "ANALYSIS_ERROR",
			});
		}
	}

	/**
	 * Save analysis to history
	 */
	static async saveAnalysisToHistory(userId, inputData, result) {
		try {
			const silt = 100 - inputData.sand - inputData.clay;

			await prisma.soilAnalysis.create({
				data: {
					userId,
					sand: inputData.sand,
					clay: inputData.clay,
					silt,
					organicMatter: inputData.organicMatter || 2.5,
					densityFactor: inputData.densityFactor || 1.0,
					fieldCapacity: result.fieldCapacity,
					wiltingPoint: result.wiltingPoint,
					plantAvailableWater: result.plantAvailableWater,
					saturation: result.saturation,
					saturatedConductivity: result.saturatedConductivity,
					textureClass: result.textureClass,
					calculationSource: "web",
				},
			});
		} catch (error) {
			console.error("Error saving analysis to history:", error);
		}
	}

	/**
	 * Generate CSV from analysis data
	 */
	static generateCSV(analyses) {
		const headers = [
			"Date",
			"Sand (%)",
			"Clay (%)",
			"Silt (%)",
			"Organic Matter (%)",
			"Field Capacity (%)",
			"Wilting Point (%)",
			"Available Water (%)",
			"Texture Class",
		];

		const rows = analyses.map((analysis) => [
			analysis.createdAt.toISOString(),
			analysis.sand,
			analysis.clay,
			analysis.silt,
			analysis.organicMatter,
			analysis.fieldCapacity,
			analysis.wiltingPoint,
			analysis.plantAvailableWater,
			analysis.textureClass,
		]);

		return [headers, ...rows].map((row) => row.join(",")).join("\n");
	}

	/**
	 * Get crop recommendations based on soil properties
	 */
	static async getCropRecommendations(req, res) {
		try {
			const { textureClass, paw, om } = req.body;

			// Default recommendations
			let recommendations = {
				suitableCrops: [],
				limitations: [],
				managementTips: [],
			};

			// Determine suitable crops based on texture class
			const texture = textureClass.toLowerCase();

			if (texture.includes("sand") && !texture.includes("clay")) {
				recommendations.suitableCrops = [
					"Carrots",
					"Potatoes",
					"Radishes",
					"Peanuts",
				];
				recommendations.limitations = [
					"Low water retention",
					"Low nutrient holding capacity",
				];
				recommendations.managementTips = [
					"Frequent irrigation",
					"Regular organic matter addition",
				];
			} else if (texture.includes("clay")) {
				recommendations.suitableCrops = [
					"Rice",
					"Wheat",
					"Cabbage",
					"Broccoli",
				];
				recommendations.limitations = [
					"Poor drainage",
					"Slow warming in spring",
				];
				recommendations.managementTips = [
					"Avoid working when wet",
					"Add organic matter to improve structure",
				];
			} else if (texture.includes("silt") || texture === "loam") {
				recommendations.suitableCrops = [
					"Corn",
					"Soybeans",
					"Most vegetables",
					"Small grains",
				];
				recommendations.limitations = [
					"Possible crusting",
					"Moderate drainage",
				];
				recommendations.managementTips = [
					"Maintain organic matter",
					"Use cover crops",
				];
			}

			res.json({
				success: true,
				data: recommendations,
			});
		} catch (error) {
			console.error("Crop recommendation error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
	}

	/**
	 * Log usage for analytics and billing
	 */
	static async logUsage(userId, analysisData, req, source = "web") {
		try {
			// Create usage record
			await prisma.usageRecord.create({
				data: {
					userId: userId || null,
					endpoint: `soil/${source}`,
					requestData: JSON.stringify(analysisData),
					ipAddress: req?.ip || req?.connection?.remoteAddress,
					userAgent: req?.get("User-Agent"),
					source,
				},
			});

			// Also save soil analysis to history if user is logged in
			if (userId && analysisData.sand && analysisData.clay) {
				const silt = 100 - analysisData.sand - analysisData.clay;

				// Calculate results for storage
				const result = SoilCalculationService.calculateWaterCharacteristics(
					analysisData.sand,
					analysisData.clay,
					analysisData.organicMatter || 2.5,
					analysisData.densityFactor || 1.0
				);

				await prisma.soilAnalysis.create({
					data: {
						userId,
						sand: analysisData.sand,
						clay: analysisData.clay,
						silt,
						organicMatter: analysisData.organicMatter || 2.5,
						densityFactor: analysisData.densityFactor || 1.0,
						fieldCapacity: result.fieldCapacity,
						wiltingPoint: result.wiltingPoint,
						plantAvailableWater: result.plantAvailableWater,
						saturation: result.saturation,
						saturatedConductivity: result.saturatedConductivity,
						textureClass: result.textureClass,
						calculationSource: "api",
						ipAddress: req?.ip || req?.connection?.remoteAddress,
					},
				});
			}

			console.log(
				`${
					userId ? `User ${userId}` : "Anonymous user"
				} performed soil analysis via ${source}`
			);
		} catch (error) {
			console.error("Error logging usage:", error);
			// Don't fail the request if logging fails
		}
	}
}

module.exports = SoilController;
