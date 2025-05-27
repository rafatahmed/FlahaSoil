/** @format */

const express = require("express");
const { body } = require("express-validator");
const SoilController = require("../controllers/soilController");
const authMiddleware = require("../middleware/auth");
const { freeTierLimit, professionalLimit } = require("../middleware/rateLimit");
const {
	requireFeature,
	checkUsageLimit,
	incrementUsage,
	planBasedRateLimit,
} = require("../middleware/planAccess");

const router = express.Router();

// Validation rules
const soilAnalysisValidation = [
	body("sand")
		.isFloat({ min: 0, max: 100 })
		.withMessage("Sand must be between 0 and 100"),
	body("clay")
		.isFloat({ min: 0, max: 100 })
		.withMessage("Clay must be between 0 and 100"),
	body("organicMatter")
		.optional()
		.isFloat({ min: 0, max: 10 })
		.withMessage("Organic matter must be between 0 and 10"),
	body("densityFactor")
		.optional()
		.isFloat({ min: 0.9, max: 1.2 })
		.withMessage("Density factor must be between 0.9 and 1.2"),
];

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

module.exports = router;
