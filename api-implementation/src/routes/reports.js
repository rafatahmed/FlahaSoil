/** @format */

const express = require("express");
const router = express.Router();
const ReportService = require("../services/reportService");
const authMiddleware = require("../middleware/auth");
const { requireFeature } = require("../middleware/planAccess");

// Initialize report service
const reportService = new ReportService();

// Track active PDF generation requests to prevent duplicates
const activeGenerations = new Map();

/**
 * @route GET /api/v1/reports/capabilities
 * @desc Get user's report capabilities based on their plan
 * @access Private
 */
router.get("/capabilities", authMiddleware, async (req, res) => {
	try {
		const userPlan = req.user.tier || "FREE";

		const capabilities = {
			FREE: {
				reportGeneration: false,
				printFunctionality: false,
				pdfExport: false,
				customReports: false,
				brandedReports: false,
				message: "Upgrade to Professional to access report generation features",
			},
			PROFESSIONAL: {
				reportGeneration: true,
				printFunctionality: true,
				pdfExport: true,
				customReports: false,
				brandedReports: false,
				message: "Standard PDF reports and print functionality available",
			},
			ENTERPRISE: {
				reportGeneration: true,
				printFunctionality: true,
				pdfExport: true,
				customReports: true,
				brandedReports: true,
				message: "Full custom reporting with branding options available",
			},
		};

		res.json({
			success: true,
			plan: userPlan,
			capabilities: capabilities[userPlan] || capabilities.FREE,
		});
	} catch (error) {
		console.error("Report capabilities error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to get report capabilities",
		});
	}
});

/**
 * @route POST /api/v1/reports/generate/standard
 * @desc Generate standard PDF report (Professional+)
 * @access Private
 */
router.post(
	"/generate/standard",
	authMiddleware,
	requireFeature("reportGeneration"),
	async (req, res) => {
		try {
			console.log("📄 PDF Generation Request received");
			console.log("📄 User data:", req.user);
			console.log("📄 Request headers:", req.headers);
			console.log("📄 Request body keys:", Object.keys(req.body));

			// Check for concurrent requests from the same user
			const userId = req.user.userId || req.user.id;
			const requestKey = `${userId}-standard`;

			if (activeGenerations.has(requestKey)) {
				console.log("⚠️ Duplicate PDF generation request detected, rejecting");
				return res.status(429).json({
					success: false,
					error: "PDF generation already in progress. Please wait.",
				});
			}

			// Mark this request as active
			activeGenerations.set(requestKey, Date.now());

			// Set CORS headers explicitly
			res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
			res.header("Access-Control-Allow-Credentials", "true");
			res.header(
				"Access-Control-Expose-Headers",
				"Content-Disposition, Content-Length, Content-Type"
			);

			const { soilData } = req.body;

			if (!soilData) {
				return res.status(400).json({
					success: false,
					error: "Soil data is required for report generation",
				});
			}

			console.log(
				"🔧 Generating PDF with soil data keys:",
				Object.keys(soilData)
			);

			// Generate standard report
			const pdfBuffer = await reportService.generateStandardReport(
				soilData,
				req.user
			);

			console.log("✅ PDF generated successfully, size:", pdfBuffer.length);
			console.log("🔍 PDF buffer type:", typeof pdfBuffer);
			console.log("🔍 PDF buffer constructor:", pdfBuffer?.constructor?.name);
			console.log("🔍 Is Buffer:", Buffer.isBuffer(pdfBuffer));
			console.log("🔍 Is Uint8Array:", pdfBuffer instanceof Uint8Array);
			console.log("🔍 Has length property:", "length" in pdfBuffer);

			// Validate PDF buffer (Puppeteer returns Uint8Array, not Buffer)
			if (
				!pdfBuffer ||
				(!Buffer.isBuffer(pdfBuffer) && !(pdfBuffer instanceof Uint8Array))
			) {
				console.error("❌ Invalid PDF buffer type:", typeof pdfBuffer);
				console.error(
					"❌ PDF buffer constructor:",
					pdfBuffer?.constructor?.name
				);
				return res.status(500).json({
					success: false,
					error: "Invalid PDF buffer generated",
				});
			}

			// Convert Uint8Array to Buffer if needed
			const pdfBufferAsBuffer = Buffer.isBuffer(pdfBuffer)
				? pdfBuffer
				: Buffer.from(pdfBuffer);

			// Check PDF header
			const header = pdfBufferAsBuffer.slice(0, 4).toString();
			if (!header.startsWith("%PDF")) {
				console.error("❌ Invalid PDF header:", header);
				return res.status(500).json({
					success: false,
					error: "Generated PDF is corrupted",
				});
			}

			console.log("✅ PDF validation passed, sending response...");

			// Set response headers for PDF download
			res.setHeader("Content-Type", "application/pdf");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="FlahaSoil-Report-${Date.now()}.pdf"`
			);
			res.setHeader("Content-Length", pdfBufferAsBuffer.length);
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Accept-Ranges", "bytes");

			// Ensure we don't send the response multiple times
			if (res.headersSent) {
				console.log("⚠️ Headers already sent, skipping response");
				return;
			}

			// Send the PDF buffer as a single write operation
			res.writeHead(200);
			res.write(pdfBufferAsBuffer);
			res.end();

			console.log("📤 PDF response sent, size:", pdfBufferAsBuffer.length);
		} catch (error) {
			console.error("❌ Standard report generation error:", error);
			if (!res.headersSent) {
				res.status(500).json({
					success: false,
					error: "Failed to generate standard report: " + error.message,
				});
			}
		} finally {
			// Clean up active generation tracking
			const userId = req.user.userId || req.user.id;
			const requestKey = `${userId}-standard`;
			activeGenerations.delete(requestKey);
			console.log("🧹 Cleaned up active generation for:", requestKey);
		}
	}
);

/**
 * @route POST /api/v1/reports/generate/custom
 * @desc Generate custom branded PDF report (Enterprise only)
 * @access Private
 */
router.post(
	"/generate/custom",
	authMiddleware,
	requireFeature("customReports"),
	async (req, res) => {
		try {
			const { soilData, customOptions = {} } = req.body;

			if (!soilData) {
				return res.status(400).json({
					success: false,
					error: "Soil data is required for report generation",
				});
			}

			// Validate custom options for Enterprise users
			const validatedOptions = {
				companyName: customOptions.companyName || req.user.name,
				companyLogo: customOptions.companyLogo || "",
				primaryColor: customOptions.primaryColor || "#2E8B57",
				secondaryColor: customOptions.secondaryColor || "#4682B4",
				fontFamily: customOptions.fontFamily || "Arial",
				pageFormat: customOptions.pageFormat || "A4",
				includeRecommendations: customOptions.includeRecommendations !== false,
				margins: customOptions.margins || {
					top: "20mm",
					right: "15mm",
					bottom: "20mm",
					left: "15mm",
				},
			};

			// Generate custom report
			const pdfBuffer = await reportService.generateCustomReport(
				soilData,
				req.user,
				validatedOptions
			);

			// Set response headers for PDF download
			const filename = `${validatedOptions.companyName.replace(
				/[^a-zA-Z0-9]/g,
				"_"
			)}-SoilReport-${Date.now()}.pdf`;
			res.setHeader("Content-Type", "application/pdf");
			res.setHeader(
				"Content-Disposition",
				`attachment; filename="${filename}"`
			);
			res.setHeader("Content-Length", pdfBuffer.length);

			res.send(pdfBuffer);
		} catch (error) {
			console.error("Custom report generation error:", error);
			res.status(500).json({
				success: false,
				error: "Failed to generate custom report",
			});
		}
	}
);

/**
 * @route POST /api/v1/reports/preview/standard
 * @desc Generate HTML preview of standard report
 * @access Private
 */
router.post(
	"/preview/standard",
	authMiddleware,
	requireFeature("reportGeneration"),
	async (req, res) => {
		try {
			const { soilData } = req.body;

			if (!soilData) {
				return res.status(400).json({
					success: false,
					error: "Soil data is required for report preview",
				});
			}

			// Generate HTML preview
			const htmlContent = reportService.generateStandardReportHTML(
				soilData,
				req.user
			);

			res.setHeader("Content-Type", "text/html");
			res.send(htmlContent);
		} catch (error) {
			console.error("Standard report preview error:", error);
			res.status(500).json({
				success: false,
				error: "Failed to generate report preview",
			});
		}
	}
);

/**
 * @route POST /api/v1/reports/preview/custom
 * @desc Generate HTML preview of custom report
 * @access Private
 */
router.post(
	"/preview/custom",
	authMiddleware,
	requireFeature("customReports"),
	async (req, res) => {
		try {
			const { soilData, customOptions = {} } = req.body;

			if (!soilData) {
				return res.status(400).json({
					success: false,
					error: "Soil data is required for report preview",
				});
			}

			// Validate custom options
			const validatedOptions = {
				companyName: customOptions.companyName || req.user.name,
				companyLogo: customOptions.companyLogo || "",
				primaryColor: customOptions.primaryColor || "#2E8B57",
				secondaryColor: customOptions.secondaryColor || "#4682B4",
				fontFamily: customOptions.fontFamily || "Arial",
				includeRecommendations: customOptions.includeRecommendations !== false,
			};

			// Generate HTML preview
			const htmlContent = reportService.generateCustomReportHTML(
				soilData,
				req.user,
				validatedOptions
			);

			res.setHeader("Content-Type", "text/html");
			res.send(htmlContent);
		} catch (error) {
			console.error("Custom report preview error:", error);
			res.status(500).json({
				success: false,
				error: "Failed to generate custom report preview",
			});
		}
	}
);

/**
 * @route GET /api/v1/reports/templates
 * @desc Get available report templates (Enterprise only)
 * @access Private
 */
router.get(
	"/templates",
	authMiddleware,
	requireFeature("customReports"),
	async (req, res) => {
		try {
			const templates = [
				{
					id: "standard",
					name: "Standard Report",
					description: "Basic soil analysis report with all essential data",
					features: [
						"Soil composition",
						"Water characteristics",
						"Physical properties",
					],
				},
				{
					id: "detailed",
					name: "Detailed Analysis",
					description: "Comprehensive report with recommendations",
					features: [
						"Executive summary",
						"Detailed analysis",
						"Management recommendations",
						"Custom branding",
					],
				},
				{
					id: "executive",
					name: "Executive Summary",
					description: "High-level overview for decision makers",
					features: [
						"Key metrics",
						"Assessment summary",
						"Recommendations",
						"Custom branding",
					],
				},
			];

			res.json({
				success: true,
				templates,
			});
		} catch (error) {
			console.error("Report templates error:", error);
			res.status(500).json({
				success: false,
				error: "Failed to get report templates",
			});
		}
	}
);

/**
 * @route DELETE /api/v1/reports/cleanup
 * @desc Cleanup browser resources (admin only)
 * @access Private
 */
router.delete("/cleanup", authMiddleware, async (req, res) => {
	try {
		// Only allow admin users to cleanup
		if (req.user.tier !== "ENTERPRISE" && !req.user.admin) {
			return res.status(403).json({
				success: false,
				error: "Insufficient permissions",
			});
		}

		await reportService.closeBrowser();

		res.json({
			success: true,
			message: "Browser resources cleaned up successfully",
		});
	} catch (error) {
		console.error("Report cleanup error:", error);
		res.status(500).json({
			success: false,
			error: "Failed to cleanup browser resources",
		});
	}
});

module.exports = router;
