/** @format */

const express = require("express");
const router = express.Router();
const dssController = require("../controllers/dssController");
const auth = require("../middleware/auth");
const planAccess = require("../middleware/planAccess");
const { professionalLimit, freeTierLimit } = require("../middleware/rateLimit");

/**
 * DSS (Decision Support System) Routes
 * Provides irrigation calculation and recommendation endpoints
 */

// Public routes (no authentication required for basic crop data)
router.get("/crops", professionalLimit, dssController.getCrops);
router.get(
	"/crops/:cropId/stages",
	professionalLimit,
	dssController.getCropStages
);
router.get("/crops/:cropId/kc", professionalLimit, dssController.getCropKc);

// Protected routes (require authentication)
router.use(auth);

// Basic DSS calculations (available to all authenticated users)
router.post(
	"/calculate",
	freeTierLimit, // Basic rate limiting for calculations
	dssController.calculateIrrigation
);

// User-specific calculation history
router.get(
	"/calculations",
	professionalLimit,
	dssController.getCalculationHistory
);

router.get(
	"/calculations/:calculationId",
	professionalLimit,
	dssController.getCalculation
);

// Professional tier features (require Professional or Enterprise plan)
router.use(planAccess.requireFeature("advancedCalculations"));

// Advanced DSS features for Professional+ users
router.post(
	"/calculate/advanced",
	professionalLimit, // Higher limit for paid users
	dssController.calculateIrrigation // Same endpoint but with advanced features enabled
);

// Batch calculations for multiple fields (Enterprise only)
router.use("/batch", planAccess.requireFeature("batchProcessing"));

router.post(
	"/batch/calculate",
	professionalLimit, // Limited batch operations
	async (req, res) => {
		try {
			const { calculations } = req.body;

			if (!Array.isArray(calculations) || calculations.length === 0) {
				return res.status(400).json({
					success: false,
					error: "calculations array is required",
				});
			}

			if (calculations.length > 10) {
				return res.status(400).json({
					success: false,
					error: "Maximum 10 calculations per batch",
				});
			}

			const results = [];
			for (const calc of calculations) {
				try {
					// Simulate individual calculation
					req.body = calc;
					const result = await dssController.calculateIrrigation(req, {
						json: (data) => data, // Mock response object
					});
					results.push({ success: true, data: result });
				} catch (error) {
					results.push({
						success: false,
						error: error.message,
						input: calc,
					});
				}
			}

			res.json({
				success: true,
				data: results,
				summary: {
					total: calculations.length,
					successful: results.filter((r) => r.success).length,
					failed: results.filter((r) => !r.success).length,
				},
			});
		} catch (error) {
			console.error("Batch calculation error:", error);
			res.status(500).json({
				success: false,
				error: "Batch calculation failed",
				details: error.message,
			});
		}
	}
);

// Export routes for integration with main server
module.exports = router;
