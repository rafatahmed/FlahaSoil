/**
 * Dynamic Content Sizing Service for FlahaSoil Reports
 * Intelligently adapts content layout based on available space
 * Prevents overflow while maintaining professional quality
 *
 * @format
 */

class DynamicSizingService {
	constructor() {
		// A4 page dimensions in mm (minus margins)
		this.pageConstraints = {
			width: 180, // 210mm - 30mm margins
			height: 267, // 297mm - 30mm margins
			marginTop: 15,
			marginBottom: 15,
			marginLeft: 15,
			marginRight: 15,
		};

		// Content sizing rules
		this.sizingRules = {
			// Minimum sizes to maintain readability
			minFontSize: 9,
			minLineHeight: 1.2,
			minPadding: 4,
			minMargin: 6,

			// Maximum content per page
			maxSectionsPerPage: 3,
			maxDataItemsPerGrid: 6,
			maxChartHeight: 120,

			// Responsive breakpoints
			contentDensity: {
				low: 0.6, // 60% page fill
				medium: 0.75, // 75% page fill
				high: 0.9, // 90% page fill
			},
		};

		// Content priority levels
		this.contentPriority = {
			critical: ["title", "userInfo", "soilComposition", "textureClass"],
			important: ["waterCharacteristics", "recommendations", "charts"],
			optional: ["appendices", "methodology", "branding"],
		};
	}

	/**
	 * Analyze content and determine optimal sizing strategy
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @returns {Object} Sizing strategy and layout configuration
	 */
	analyzePage(soilData, userInfo) {
		const contentAnalysis = this.analyzeContentComplexity(soilData);
		const sizingStrategy = this.determineSizingStrategy(contentAnalysis);

		return {
			strategy: sizingStrategy,
			pageLayout: this.generatePageLayout(contentAnalysis, sizingStrategy),
			cssVariables: this.generateResponsiveCSSVariables(sizingStrategy),
			contentDistribution: this.distributeContentAcrossPages(contentAnalysis),
		};
	}

	/**
	 * Analyze content complexity to determine space requirements
	 * @param {Object} soilData - Soil analysis data
	 * @returns {Object} Content complexity analysis
	 */
	analyzeContentComplexity(soilData) {
		const analysis = {
			dataPoints: 0,
			textLength: 0,
			hasCharts: false,
			hasRecommendations: false,
			complexityScore: 0,
		};

		// Count data points
		const dataFields = [
			"sand",
			"clay",
			"silt",
			"organicMatter",
			"bulkDensity",
			"fieldCapacity",
			"wiltingPoint",
			"saturation",
		];
		analysis.dataPoints = dataFields.filter(
			(field) => soilData[field] !== undefined
		).length;

		// Estimate text content length
		analysis.textLength = this.estimateTextLength(soilData);

		// Check for charts and visualizations
		analysis.hasCharts = true; // USDA triangle always present

		// Check for recommendations
		analysis.hasRecommendations = this.hasRecommendationContent(soilData);

		// Calculate complexity score (0-100)
		analysis.complexityScore = this.calculateComplexityScore(analysis);

		return analysis;
	}

	/**
	 * Determine optimal sizing strategy based on content analysis
	 * @param {Object} contentAnalysis - Content complexity analysis
	 * @returns {string} Sizing strategy: 'compact', 'balanced', 'spacious'
	 */
	determineSizingStrategy(contentAnalysis) {
		const { complexityScore, dataPoints, textLength } = contentAnalysis;

		if (complexityScore > 80 || dataPoints > 12 || textLength > 2000) {
			return "compact";
		} else if (complexityScore > 50 || dataPoints > 8 || textLength > 1200) {
			return "balanced";
		} else {
			return "spacious";
		}
	}

	/**
	 * Generate responsive CSS variables based on sizing strategy
	 * @param {string} strategy - Sizing strategy
	 * @returns {Object} CSS variables for dynamic sizing
	 */
	generateResponsiveCSSVariables(strategy) {
		const strategies = {
			compact: {
				"--page-padding": "6mm",
				"--section-margin": "4mm", // Reduced from 8mm to 4mm (50% reduction)
				"--section-padding": "3mm", // Reduced from 6mm to 3mm (50% reduction)
				"--font-size-base": "11pt",
				"--font-size-h1": "18pt",
				"--font-size-h2": "14pt",
				"--font-size-h3": "12pt",
				"--line-height": "1.3",
				"--chart-main-height": "80mm",
				"--chart-secondary-height": "40mm",
				"--data-grid-gap": "3mm", // Reduced from 6mm to 3mm (50% reduction)
				"--logo-height": "20mm",
			},
			balanced: {
				"--page-padding": "8mm",
				"--section-margin": "6mm", // Reduced from 12mm to 6mm (50% reduction)
				"--section-padding": "4mm", // Reduced from 8mm to 4mm (50% reduction)
				"--font-size-base": "12pt",
				"--font-size-h1": "20pt",
				"--font-size-h2": "15pt",
				"--font-size-h3": "13pt",
				"--line-height": "1.4",
				"--chart-main-height": "100mm",
				"--chart-secondary-height": "50mm",
				"--data-grid-gap": "4mm", // Reduced from 8mm to 4mm (50% reduction)
				"--logo-height": "25mm",
			},
			spacious: {
				"--page-padding": "10mm",
				"--section-margin": "7.5mm", // Reduced from 15mm to 7.5mm (50% reduction)
				"--section-padding": "5mm", // Reduced from 10mm to 5mm (50% reduction)
				"--font-size-base": "12pt",
				"--font-size-h1": "22pt",
				"--font-size-h2": "16pt",
				"--font-size-h3": "14pt",
				"--line-height": "1.5",
				"--chart-main-height": "120mm",
				"--chart-secondary-height": "60mm",
				"--data-grid-gap": "5mm", // Reduced from 10mm to 5mm (50% reduction)
				"--logo-height": "30mm",
			},
		};

		return strategies[strategy] || strategies.balanced;
	}

	/**
	 * Generate page layout configuration
	 * @param {Object} contentAnalysis - Content analysis
	 * @param {string} strategy - Sizing strategy
	 * @returns {Object} Page layout configuration
	 */
	generatePageLayout(contentAnalysis, strategy) {
		return {
			pages: this.calculateOptimalPageCount(contentAnalysis, strategy),
			sectionsPerPage: this.calculateSectionsPerPage(strategy),
			contentFlow: this.optimizeContentFlow(contentAnalysis, strategy),
			breakpoints: this.defineContentBreakpoints(strategy),
		};
	}

	/**
	 * Distribute content intelligently across pages
	 * @param {Object} contentAnalysis - Content analysis
	 * @returns {Array} Page distribution plan
	 */
	distributeContentAcrossPages(contentAnalysis) {
		const distribution = [
			{
				pageNumber: 1,
				sections: ["cover", "userInfo"],
				estimatedHeight: "200mm",
				priority: "critical",
			},
			{
				pageNumber: 2,
				sections: ["tableOfContents"],
				estimatedHeight: "180mm",
				priority: "important",
			},
			{
				pageNumber: 3,
				sections: ["soilProperties", "composition"],
				estimatedHeight: "240mm",
				priority: "critical",
			},
			{
				pageNumber: 4,
				sections: ["textureClassification", "usda-triangle"],
				estimatedHeight: "220mm",
				priority: "critical",
			},
			{
				pageNumber: 5,
				sections: ["analysisResults", "waterCharacteristics"],
				estimatedHeight: "250mm",
				priority: "important",
			},
			{
				pageNumber: 6,
				sections: ["recommendations", "management"],
				estimatedHeight: "230mm",
				priority: "important",
			},
			{
				pageNumber: 7,
				sections: ["ecosystem", "contact"],
				estimatedHeight: "180mm",
				priority: "optional",
			},
		];

		return this.optimizeDistribution(distribution, contentAnalysis);
	}

	/**
	 * Helper methods for content analysis
	 */
	estimateTextLength(soilData) {
		let length = 0;

		// Base content length
		length += 500; // Headers and labels

		// Variable content based on data
		if (soilData.textureClass) length += soilData.textureClass.length * 10;
		if (soilData.organicMatter > 3) length += 200; // More detailed OM analysis
		if (soilData.clay > 40) length += 150; // Clay-specific recommendations
		if (soilData.sand > 60) length += 150; // Sandy soil recommendations

		return length;
	}

	hasRecommendationContent(soilData) {
		return (
			soilData.textureClass &&
			(soilData.fieldCapacity || soilData.plantAvailableWater)
		);
	}

	calculateComplexityScore(analysis) {
		let score = 0;

		// Data point complexity (0-40 points)
		score += Math.min(analysis.dataPoints * 3, 40);

		// Text length complexity (0-30 points)
		score += Math.min(analysis.textLength / 50, 30);

		// Feature complexity (0-30 points)
		if (analysis.hasCharts) score += 15;
		if (analysis.hasRecommendations) score += 15;

		return Math.min(score, 100);
	}

	calculateOptimalPageCount(contentAnalysis, strategy) {
		const basePages = 7;

		if (strategy === "compact" && contentAnalysis.complexityScore > 90) {
			return basePages + 1; // Add overflow page if needed
		}

		return basePages;
	}

	calculateSectionsPerPage(strategy) {
		const limits = {
			compact: 4,
			balanced: 3,
			spacious: 2,
		};

		return limits[strategy] || 3;
	}

	optimizeContentFlow(contentAnalysis, strategy) {
		// Define content flow optimization based on strategy
		return {
			allowSectionSplitting: strategy === "compact",
			prioritizeReadability: strategy === "spacious",
			compactDataGrids: strategy === "compact",
			expandCharts: strategy === "spacious",
		};
	}

	defineContentBreakpoints(strategy) {
		return {
			maxSectionHeight: strategy === "compact" ? "80mm" : "120mm",
			maxChartHeight: strategy === "compact" ? "70mm" : "100mm",
			maxDataGridRows: strategy === "compact" ? 3 : 2,
		};
	}

	optimizeDistribution(distribution, contentAnalysis) {
		// Adjust distribution based on content complexity
		if (contentAnalysis.complexityScore > 80) {
			// Redistribute content for high complexity
			return this.redistributeForHighComplexity(distribution);
		}

		return distribution;
	}

	redistributeForHighComplexity(distribution) {
		// Split dense pages and redistribute content
		return distribution.map((page) => {
			if (page.estimatedHeight > "240mm") {
				page.sections = page.sections.slice(
					0,
					Math.ceil(page.sections.length / 2)
				);
				page.estimatedHeight = "220mm";
			}
			return page;
		});
	}
}

module.exports = DynamicSizingService;
