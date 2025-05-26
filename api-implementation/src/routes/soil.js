/** @format */

const express = require("express");
const { body } = require("express-validator");
const SoilController = require("../controllers/soilController");
const authMiddleware = require("../middleware/auth");
const { freeTierLimit, professionalLimit } = require("../middleware/rateLimit");

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

// Public endpoint with rate limiting
router.post("/analyze", freeTierLimit, SoilController.analyzeSoil);

// Protected endpoint for authenticated users
router.post(
	"/analyze/advanced",
	authMiddleware,
	professionalLimit,
	SoilController.analyzeSoil
);

// Crop recommendations endpoint
router.post("/recommendations", SoilController.getCropRecommendations);

module.exports = router;
