/**
 * Localization Controller - Week 6 Implementation
 * Handles localized API endpoints for crop database and DSS system
 *
 * @format
 */

const { PrismaClient } = require("@prisma/client");
const LocalizationService = require("../services/localizationService");

const prisma = new PrismaClient();

class LocalizationController {
	constructor() {
		this.localizationService = new LocalizationService();

		// Bind methods to preserve 'this' context
		this.getLocalizedCrops = this.getLocalizedCrops.bind(this);
		this.getLocalizedCropDetails = this.getLocalizedCropDetails.bind(this);
		this.getLocalizedBBCHStages = this.getLocalizedBBCHStages.bind(this);
		this.getDSSInterfaceTerms = this.getDSSInterfaceTerms.bind(this);
		this.getSupportedLanguages = this.getSupportedLanguages.bind(this);
		this.getLocalizationPackage = this.getLocalizationPackage.bind(this);
		this.translateText = this.translateText.bind(this);
	}

	/**
	 * Get localized crop list
	 * GET /api/v1/localization/crops?lang=ar
	 */
	async getLocalizedCrops(req, res) {
		try {
			const { lang = "en" } = req.query;

			// Get crops from database
			const crops = await prisma.crop.findMany({
				orderBy: { name: "asc" },
			});

			// Translate crops
			const localizedCrops = this.localizationService.translateCropList(
				crops,
				lang
			);

			res.json({
				success: true,
				data: localizedCrops,
				language: lang,
				metadata: this.localizationService.getLanguageMetadata(lang),
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error fetching localized crops:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch localized crops",
				details: error.message,
			});
		}
	}

	/**
	 * Get localized crop details with BBCH stages
	 * GET /api/v1/localization/crops/:id?lang=ar
	 */
	async getLocalizedCropDetails(req, res) {
		try {
			const { id } = req.params;
			const { lang = "en" } = req.query;

			// Get crop with BBCH stages and Kc periods
			const crop = await prisma.crop.findUnique({
				where: { id },
				include: {
					bbchStages: {
						orderBy: { typicalDaysFromSowing: "asc" },
					},
					kcPeriods: {
						orderBy: { periodStartDays: "asc" },
					},
				},
			});

			if (!crop) {
				return res.status(404).json({
					success: false,
					error: "Crop not found",
				});
			}

			// Translate crop information
			const cropTranslation = this.localizationService.getCropTranslation(
				crop.name,
				lang
			);
			const localizedBBCHStages = this.localizationService.translateBBCHStages(
				crop.bbchStages,
				lang
			);

			const localizedCrop = {
				...crop,
				localizedName: cropTranslation.name,
				localizedDescription: cropTranslation.description,
				localizedCategory: cropTranslation.category,
				bbchStages: localizedBBCHStages,
				language: lang,
			};

			res.json({
				success: true,
				data: localizedCrop,
				language: lang,
				metadata: this.localizationService.getLanguageMetadata(lang),
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error fetching localized crop details:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch localized crop details",
				details: error.message,
			});
		}
	}

	/**
	 * Get localized BBCH stages
	 * GET /api/v1/localization/bbch-stages?lang=ar
	 */
	async getLocalizedBBCHStages(req, res) {
		try {
			const { lang = "en", cropId } = req.query;

			let bbchStages;
			if (cropId) {
				// Get BBCH stages for specific crop
				bbchStages = await prisma.bBCHStage.findMany({
					where: { cropId },
					include: { crop: true },
					orderBy: { typicalDaysFromSowing: "asc" },
				});
			} else {
				// Get all BBCH stages
				bbchStages = await prisma.bBCHStage.findMany({
					include: { crop: true },
					orderBy: [
						{ crop: { name: "asc" } },
						{ typicalDaysFromSowing: "asc" },
					],
				});
			}

			// Translate BBCH stages
			const localizedStages = this.localizationService.translateBBCHStages(
				bbchStages,
				lang
			);

			res.json({
				success: true,
				data: localizedStages,
				language: lang,
				metadata: this.localizationService.getLanguageMetadata(lang),
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error fetching localized BBCH stages:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch localized BBCH stages",
				details: error.message,
			});
		}
	}

	/**
	 * Get localized DSS interface terms
	 * GET /api/v1/localization/dss-terms?lang=ar
	 */
	async getDSSInterfaceTerms(req, res) {
		try {
			const { lang = "en" } = req.query;

			const interfaceTerms =
				this.localizationService.getDSSInterfaceTerms(lang);

			res.json({
				success: true,
				data: interfaceTerms,
				language: lang,
				metadata: this.localizationService.getLanguageMetadata(lang),
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error fetching DSS interface terms:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch DSS interface terms",
				details: error.message,
			});
		}
	}

	/**
	 * Get supported languages
	 * GET /api/v1/localization/languages
	 */
	getSupportedLanguages(req, res) {
		try {
			const supportedLanguages =
				this.localizationService.getSupportedLanguages();
			const languageDetails = supportedLanguages.map((lang) => ({
				code: lang,
				...this.localizationService.getLanguageMetadata(lang),
			}));

			res.json({
				success: true,
				data: {
					languages: languageDetails,
					defaultLanguage: "en",
					totalSupported: supportedLanguages.length,
				},
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error fetching supported languages:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch supported languages",
				details: error.message,
			});
		}
	}

	/**
	 * Get complete localization package
	 * GET /api/v1/localization/package?lang=ar
	 */
	async getLocalizationPackage(req, res) {
		try {
			const { lang = "en" } = req.query;

			const localizationPackage =
				this.localizationService.getLocalizationPackage(lang);

			res.json({
				success: true,
				data: localizationPackage,
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error fetching localization package:", error);
			res.status(500).json({
				success: false,
				error: "Failed to fetch localization package",
				details: error.message,
			});
		}
	}

	/**
	 * Translate specific text
	 * POST /api/v1/localization/translate
	 */
	async translateText(req, res) {
		try {
			const { text, type, lang = "en" } = req.body;

			if (!text || !type) {
				return res.status(400).json({
					success: false,
					error: "Missing required parameters: text, type",
				});
			}

			let translation;
			switch (type) {
				case "crop":
					translation = this.localizationService.getCropTranslation(text, lang);
					break;
				case "bbch":
					translation = this.localizationService.getBBCHStageTranslation(
						text,
						lang
					);
					break;
				case "term":
					translation = this.localizationService.getAgriculturalTerm(
						text,
						lang
					);
					break;
				default:
					return res.status(400).json({
						success: false,
						error: "Invalid translation type. Use: crop, bbch, or term",
					});
			}

			res.json({
				success: true,
				data: {
					original: text,
					translation,
					type,
					language: lang,
				},
				timestamp: new Date().toISOString(),
			});
		} catch (error) {
			console.error("Error translating text:", error);
			res.status(500).json({
				success: false,
				error: "Failed to translate text",
				details: error.message,
			});
		}
	}
}

module.exports = new LocalizationController();
