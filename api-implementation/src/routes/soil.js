/** @format */

const express = require("express");
const { body } = require("express-validator");
const SoilController = require("../controllers/soilController");
const EnhancedSoilController = require("../controllers/enhancedSoilController");
const ReportService = require("../services/reportService");
const authMiddleware = require("../middleware/auth");
const { freeTierLimit, professionalLimit } = require("../middleware/rateLimit");
const {
	requireFeature,
	checkUsageLimit,
	incrementUsage,
	planBasedRateLimit,
} = require("../middleware/planAccess");

const router = express.Router();

// Enhanced validation rules for Saxton & Rawls (2006) 24-equation system
const soilAnalysisValidation = [
	body("sand")
		.isFloat({ min: 0, max: 100 })
		.withMessage("Sand must be between 0 and 100"),
	body("clay")
		.isFloat({ min: 0, max: 100 })
		.withMessage("Clay must be between 0 and 100"),
	body("organicMatter")
		.optional()
		.isFloat({ min: 0, max: 8 })
		.withMessage("Organic matter must be between 0 and 8%"),
	body("densityFactor")
		.optional()
		.isFloat({ min: 0.9, max: 1.8 })
		.withMessage("Bulk density must be between 0.9 and 1.8 g/cm³"),
	body("gravelContent")
		.optional()
		.isFloat({ min: 0, max: 80 })
		.withMessage("Gravel content must be between 0 and 80%"),
	body("electricalConductivity")
		.optional()
		.isFloat({ min: 0, max: 20 })
		.withMessage("Electrical conductivity must be between 0 and 20 dS/m"),
	// Custom validation to ensure sand + clay <= 100
	body().custom((value) => {
		const sand = parseFloat(value.sand) || 0;
		const clay = parseFloat(value.clay) || 0;
		if (sand + clay > 100) {
			throw new Error("Sand + Clay cannot exceed 100%");
		}
		return true;
	}),
];

// DEMO ENDPOINTS (No authentication required for testing)
// Basic demo analysis endpoint - for testing without authentication
router.post(
	"/demo/analyze",
	soilAnalysisValidation,
	SoilController.analyzeSoilDemo
);

// Enhanced demo analysis endpoint - for testing advanced features
router.post(
	"/demo/analyze/enhanced",
	soilAnalysisValidation,
	EnhancedSoilController.createEnhancedAnalysisDemo
);

// Demo visualization data endpoints
router.get(
	"/demo/moisture-tension/:demoData",
	EnhancedSoilController.getMoistureTensionCurveDemo
);

router.get(
	"/demo/profile-3d/:demoData",
	EnhancedSoilController.getSoilProfile3DDemo
);

// Basic soil analysis endpoint (requires authentication and usage check)
router.post(
	"/analyze",
	authMiddleware,
	checkUsageLimit(),
	incrementUsage(),
	soilAnalysisValidation,
	SoilController.analyzeSoil
);

// Advanced soil analysis endpoint (requires Professional+ plan)
router.post(
	"/analyze/advanced",
	authMiddleware,
	requireFeature("advancedCalculations"),
	checkUsageLimit(),
	incrementUsage(),
	soilAnalysisValidation,
	SoilController.analyzeSoilAdvanced
);

// Batch analysis endpoint (requires Professional+ plan)
router.post(
	"/analyze/batch",
	authMiddleware,
	requireFeature("batchProcessing"),
	checkUsageLimit(),
	soilAnalysisValidation,
	SoilController.analyzeBatch
);

// Analysis history endpoint (requires Professional+ plan)
router.get(
	"/history",
	authMiddleware,
	requireFeature("analysisHistory"),
	SoilController.getAnalysisHistory
);

// Export analysis data (requires Professional+ plan)
router.get(
	"/export/:format",
	authMiddleware,
	requireFeature("exportCapabilities"),
	SoilController.exportAnalysis
);

// Crop recommendations endpoint (available to all authenticated users)
router.post(
	"/recommendations",
	authMiddleware,
	checkUsageLimit(),
	SoilController.getCropRecommendations
);

// API endpoint for enterprise users
router.post(
	"/api/analyze",
	authMiddleware,
	requireFeature("apiAccess"),
	planBasedRateLimit(),
	soilAnalysisValidation,
	SoilController.apiAnalyzeSoil
);

// ENHANCED VISUALIZATION ENDPOINTS (Professional+ features)

// Get moisture-tension curve data for visualization
router.get(
	"/moisture-tension/:analysisId",
	authMiddleware,
	requireFeature("advancedVisualizations"),
	EnhancedSoilController.getMoistureTensionCurve
);

// Get 3D soil profile visualization data
router.get(
	"/profile-3d/:analysisId",
	authMiddleware,
	requireFeature("profile3D"),
	EnhancedSoilController.getSoilProfile3D
);

// Comparative analysis between multiple soil samples
router.post(
	"/compare",
	authMiddleware,
	requireFeature("comparativeAnalysis"),
	checkUsageLimit(),
	EnhancedSoilController.compareAnalyses
);

// Real-time parameter adjustment for interactive visualization
router.post(
	"/adjust-realtime",
	authMiddleware,
	requireFeature("realtimeAdjustment"),
	EnhancedSoilController.adjustParametersRealtime
);

// Regional soil data lookup
router.get(
	"/regional-data/:regionId",
	authMiddleware,
	EnhancedSoilController.getRegionalSoilData
);

// List available regions for soil analysis
router.get(
	"/regions",
	authMiddleware,
	EnhancedSoilController.getAvailableRegions
);

// Enhanced analysis with regional context
router.post(
	"/analyze/enhanced",
	authMiddleware,
	requireFeature("enhancedAnalysis"),
	checkUsageLimit(),
	incrementUsage(),
	soilAnalysisValidation,
	EnhancedSoilController.createEnhancedAnalysis
);

// REPORT GENERATION ENDPOINTS

// Generate professional PDF report (Professional+ users only)
router.post(
	"/report",
	authMiddleware,
	requireFeature("reportGeneration"),
	async (req, res) => {
		try {
			const soilData = req.body;
			const userInfo = {
				name: req.user.name,
				email: req.user.email,
				tier: req.user.plan || "PROFESSIONAL",
			};

			console.log(
				"📄 Generating professional report for:",
				userInfo.email,
				`(${userInfo.tier})`
			);

			const reportService = new ReportService();
			const pdfBuffer = await reportService.generateStandardReport(
				soilData,
				userInfo
			);

			res.setHeader("Content-Type", "application/pdf");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="FlahaSoil-Professional-Report-${
					new Date().toISOString().split("T")[0]
				}.pdf"`
			);
			res.send(pdfBuffer);

			console.log("✅ Professional report generated successfully");
		} catch (error) {
			console.error("❌ Error generating professional report:", error);
			res.status(500).json({
				error: "Failed to generate professional report",
				details: error.message,
			});
		}
	}
);

// Generate custom branded PDF report (Enterprise users only)
router.post(
	"/report/custom",
	authMiddleware,
	requireFeature("customReports"),
	async (req, res) => {
		try {
			const { soilData, customOptions } = req.body;
			const userInfo = {
				name: req.user.name,
				email: req.user.email,
				tier: req.user.plan || "ENTERPRISE",
			};

			console.log(
				"🏢 Generating custom report for:",
				userInfo.email,
				`(${userInfo.tier})`
			);

			const reportService = new ReportService();
			const pdfBuffer = await reportService.generateCustomReport(
				soilData,
				userInfo,
				customOptions
			);

			res.setHeader("Content-Type", "application/pdf");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="FlahaSoil-Custom-Report-${
					new Date().toISOString().split("T")[0]
				}.pdf"`
			);
			res.send(pdfBuffer);

			console.log("✅ Custom report generated successfully");
		} catch (error) {
			console.error("❌ Error generating custom report:", error);
			res.status(500).json({
				error: "Failed to generate custom report",
				details: error.message,
			});
		}
	}
);

module.exports = router;
