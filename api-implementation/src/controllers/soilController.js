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

			// Check user tier for advanced features
			const userTier = req.user?.tier || "free";

			let result;
			if (userTier === "free" && !req.user) {
				// Basic calculation for anonymous users
				result = SoilCalculationService.calculateBasic(sand, clay);
			} else {
				// Full calculation with advanced parameters for logged-in users
				result = SoilCalculationService.calculateWaterCharacteristics(
					sand,
					clay,
					organicMatter,
					densityFactor
				);
			}

			// Log usage for analytics
			await SoilController.logUsage(req.user?.id, req.body, req);

			res.json({
				success: true,
				data: result,
				tier: userTier,
			});
		} catch (error) {
			console.error("Soil analysis error:", error);
			res.status(500).json({ error: "Internal server error" });
		}
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
	static async logUsage(userId, analysisData, req) {
		try {
			// Log to database for analytics
			await prisma.usageRecord.create({
				data: {
					userId: userId || null,
					endpoint: "soil/analyze",
					requestData: analysisData,
					ipAddress: req?.ip || req?.connection?.remoteAddress,
					userAgent: req?.get("User-Agent"),
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
				} performed soil analysis`
			);
		} catch (error) {
			console.error("Error logging usage:", error);
			// Don't fail the request if logging fails
		}
	}
}

module.exports = SoilController;
