/**
 * Plan-based access control middleware for FlahaSoil API
 * Handles feature restrictions and usage limits based on user plans
 *
 * @format
 */

const jwt = require("jsonwebtoken");
const { prisma } = require("../config/database");

/**
 * Check if user has access to specific feature based on plan
 */
function requireFeature(featureName) {
	return async (req, res, next) => {
		try {
			// Check if user is authenticated
			const authHeader = req.headers.authorization;
			if (!authHeader || !authHeader.startsWith("Bearer ")) {
				return res.status(401).json({
					success: false,
					error: "Authentication required",
				});
			}

			const token = authHeader.substring(7);
			let decoded;
			try {
				decoded = jwt.verify(
					token,
					process.env.JWT_SECRET || "fallback-secret"
				);
			} catch (error) {
				return res.status(401).json({
					success: false,
					error: "Invalid token",
				});
			}

			// Get user from database
			const user = await prisma.user.findUnique({
				where: { id: decoded.userId },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					error: "User not found",
				});
			}

			// Check feature access
			const planFeatures = getPlanFeatures(user.tier);

			if (!planFeatures[featureName]) {
				return res.status(403).json({
					success: false,
					error: `This feature requires ${getRequiredPlanForFeature(
						featureName
					)} plan`,
					requiredPlan: getRequiredPlanForFeature(featureName),
					currentPlan: user.tier,
					upgradeRequired: true,
				});
			}

			req.user = user;
			req.planFeatures = planFeatures;
			next();
		} catch (error) {
			console.error("Feature access check error:", error);
			res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	};
}

/**
 * Check usage limits for user's plan
 */
function checkUsageLimit() {
	return async (req, res, next) => {
		try {
			// Check if user is authenticated
			const authHeader = req.headers.authorization;
			if (!authHeader || !authHeader.startsWith("Bearer ")) {
				return res.status(401).json({
					success: false,
					error: "Authentication required",
				});
			}

			const token = authHeader.substring(7);
			let decoded;
			try {
				decoded = jwt.verify(
					token,
					process.env.JWT_SECRET || "fallback-secret"
				);
			} catch (error) {
				return res.status(401).json({
					success: false,
					error: "Invalid token",
				});
			}

			// Get user from database
			const user = await prisma.user.findUnique({
				where: { id: decoded.userId },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					error: "User not found",
				});
			}

			// Check if usage period has reset
			const now = new Date();
			if (user.usageResetDate && now > user.usageResetDate) {
				// Reset usage count and set new reset date
				await prisma.user.update({
					where: { id: user.id },
					data: {
						usageCount: 0,
						usageResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
					},
				});
				user.usageCount = 0;
			}

			// Check usage limits
			const usageLimit = getPlanUsageLimit(user.tier);

			if (usageLimit !== -1 && user.usageCount >= usageLimit) {
				return res.status(403).json({
					success: false,
					error: "Usage limit exceeded for your plan",
					usageLimit: usageLimit,
					currentUsage: user.usageCount,
					upgradeRequired: true,
					resetDate: user.usageResetDate,
				});
			}

			req.user = user;
			req.usageLimit = usageLimit;
			next();
		} catch (error) {
			console.error("Usage limit check error:", error);
			res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	};
}

/**
 * Increment usage count for user
 */
function incrementUsage() {
	return async (req, res, next) => {
		try {
			if (req.user) {
				// Increment usage count
				await prisma.user.update({
					where: { id: req.user.id },
					data: {
						usageCount: req.user.usageCount + 1,
					},
				});
			}
			next();
		} catch (error) {
			console.error("Usage increment error:", error);
			// Don't fail the request if usage tracking fails
			next();
		}
	};
}

/**
 * Plan-specific rate limiting
 */
function planBasedRateLimit() {
	return (req, res, next) => {
		// This could implement different rate limits based on plan
		// For now, just pass through
		next();
	};
}

/**
 * Get plan usage limit based on tier
 */
function getPlanUsageLimit(tier) {
	switch (tier) {
		case "FREE":
			return 50;
		case "PROFESSIONAL":
			return -1; // Unlimited
		case "ENTERPRISE":
			return -1; // Unlimited
		default:
			return 50;
	}
}

/**
 * Get plan features based on tier
 */
function getPlanFeatures(tier) {
	switch (tier) {
		case "FREE":
			return {
				analysesPerMonth: 50,
				advancedCalculations: false,
				analysisHistory: false,
				exportCapabilities: false,
				prioritySupport: false,
				batchProcessing: false,
				apiAccess: false,
				whiteLabel: false,
				// Enhanced visualization features
				advancedVisualizations: false,
				profile3D: false,
				comparativeAnalysis: false,
				realtimeAdjustment: false,
				enhancedAnalysis: false,
				// Report and Print features
				reportGeneration: false,
				printFunctionality: false,
				pdfExport: false,
				customReports: false,
				brandedReports: false,
			};
		case "PROFESSIONAL":
			return {
				analysesPerMonth: -1, // Unlimited
				advancedCalculations: true,
				analysisHistory: true,
				exportCapabilities: true,
				prioritySupport: true,
				batchProcessing: true,
				apiAccess: false,
				whiteLabel: false,
				// Enhanced visualization features
				advancedVisualizations: true,
				profile3D: true,
				comparativeAnalysis: true,
				realtimeAdjustment: true,
				enhancedAnalysis: true,
				// Report and Print features
				reportGeneration: true,
				printFunctionality: true,
				pdfExport: true,
				customReports: false,
				brandedReports: false,
			};
		case "ENTERPRISE":
			return {
				analysesPerMonth: -1, // Unlimited
				advancedCalculations: true,
				analysisHistory: true,
				exportCapabilities: true,
				prioritySupport: true,
				batchProcessing: true,
				apiAccess: true,
				whiteLabel: true,
				// Enhanced visualization features
				advancedVisualizations: true,
				profile3D: true,
				comparativeAnalysis: true,
				realtimeAdjustment: true,
				enhancedAnalysis: true,
				// Report and Print features
				reportGeneration: true,
				printFunctionality: true,
				pdfExport: true,
				customReports: true,
				brandedReports: true,
			};
		default:
			return getPlanFeatures("FREE");
	}
}

/**
 * Get required plan for a specific feature
 */
function getRequiredPlanForFeature(featureName) {
	const featureRequirements = {
		advancedCalculations: "PROFESSIONAL",
		analysisHistory: "PROFESSIONAL",
		exportCapabilities: "PROFESSIONAL",
		prioritySupport: "PROFESSIONAL",
		batchProcessing: "PROFESSIONAL",
		apiAccess: "ENTERPRISE",
		whiteLabel: "ENTERPRISE",
		// Enhanced visualization features
		advancedVisualizations: "PROFESSIONAL",
		profile3D: "PROFESSIONAL",
		comparativeAnalysis: "PROFESSIONAL",
		realtimeAdjustment: "PROFESSIONAL",
		enhancedAnalysis: "PROFESSIONAL",
		// Report and Print features
		reportGeneration: "PROFESSIONAL",
		printFunctionality: "PROFESSIONAL",
		pdfExport: "PROFESSIONAL",
		customReports: "ENTERPRISE",
		brandedReports: "ENTERPRISE",
	};

	return featureRequirements[featureName] || "FREE";
}

module.exports = {
	requireFeature,
	checkUsageLimit,
	incrementUsage,
	planBasedRateLimit,
	getPlanUsageLimit,
	getPlanFeatures,
	getRequiredPlanForFeature,
};
