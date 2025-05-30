/**
 * Soil Texture Triangle SVG Generator
 * Generates static SVG markup for soil texture triangles in reports
 * No client-side dependencies - pure server-side generation
 *
 * @format
 */

class SoilTriangleGenerator {
	constructor() {
		// Triangle dimensions and positioning
		this.config = {
			width: 500,
			height: 450,
			triangle: {
				topVertex: { x: 250, y: 50 }, // Clay vertex
				leftVertex: { x: 50, y: 400 }, // Sand vertex
				rightVertex: { x: 450, y: 400 }, // Silt vertex
				height: 350,
				base: 400,
			},
			colors: {
				triangleOutline: "#333333",
				gridLines: "#cccccc",
				samplePoint: "#ff0000",
				textLabels: "#000000",
				background: "transparent",
			},
			styles: {
				triangleStroke: 2,
				gridStroke: 1,
				pointRadius: 6,
				fontSize: 12,
				fontFamily: "Arial, sans-serif",
			},
		};

		// Soil texture classification boundaries
		this.textureClasses = {
			clay: { minClay: 40 },
			"silty clay": { minClay: 40, minSilt: 40 },
			"sandy clay": { minClay: 35, maxSilt: 20 },
			"clay loam": { minClay: 27, maxClay: 40 },
			"silty clay loam": { minClay: 27, minSilt: 40 },
			"sandy clay loam": { minClay: 20, maxSilt: 28, minSand: 45 },
			loam: {
				minClay: 7,
				maxClay: 27,
				minSilt: 28,
				maxSilt: 50,
				minSand: 23,
				maxSand: 52,
			},
			"silt loam": { maxClay: 27, minSilt: 50, maxSand: 50 },
			"sandy loam": { maxClay: 20, minSand: 43, maxSilt: 50 },
			silt: { maxClay: 12, minSilt: 80 },
			"loamy sand": { maxClay: 15, minSand: 70, maxSand: 90 },
			sand: { maxClay: 10, minSand: 85 },
		};
	}

	/**
	 * Generate complete SVG markup for soil texture triangle
	 * @param {Object} soilData - Soil composition data
	 * @param {number} soilData.sand - Sand percentage (0-100)
	 * @param {number} soilData.clay - Clay percentage (0-100)
	 * @param {number} soilData.silt - Silt percentage (0-100)
	 * @returns {string} Complete SVG markup
	 */
	generateTriangleSVG(soilData) {
		try {
			// Validate input data
			const validatedData = this.validateSoilData(soilData);

			// Calculate sample point coordinates
			const samplePoint = this.calculateSamplePoint(validatedData);

			// Determine texture classification
			const textureClass = this.classifyTexture(validatedData);

			// Generate SVG components
			const svgElements = {
				background: this.generateBackground(),
				triangleOutline: this.generateTriangleOutline(),
				gridLines: this.generateGridLines(),
				axisLabels: this.generateAxisLabels(),
				samplePoint: this.generateSamplePoint(samplePoint),
				textureLabel: this.generateTextureLabel(textureClass, samplePoint),
				legend: this.generateLegend(),
			};

			// Assemble complete SVG
			return this.assembleSVG(svgElements);
		} catch (error) {
			console.error("Error generating soil triangle SVG:", error);
			return this.generateErrorSVG(error.message);
		}
	}

	/**
	 * Validate and normalize soil data
	 * @param {Object} soilData - Raw soil data
	 * @returns {Object} Validated soil data
	 */
	validateSoilData(soilData) {
		if (!soilData || typeof soilData !== "object") {
			throw new Error("Invalid soil data: must be an object");
		}

		const { sand, clay, silt } = soilData;

		// Check for required properties
		if (sand === undefined || clay === undefined || silt === undefined) {
			throw new Error(
				"Missing required soil composition data (sand, clay, silt)"
			);
		}

		// Convert to numbers and validate range
		const sandNum = Number(sand);
		const clayNum = Number(clay);
		const siltNum = Number(silt);

		if (isNaN(sandNum) || isNaN(clayNum) || isNaN(siltNum)) {
			throw new Error("Soil composition values must be numbers");
		}

		if (sandNum < 0 || clayNum < 0 || siltNum < 0) {
			throw new Error("Soil composition values cannot be negative");
		}

		if (sandNum > 100 || clayNum > 100 || siltNum > 100) {
			throw new Error("Soil composition values cannot exceed 100%");
		}

		// Check if values sum to approximately 100%
		const total = sandNum + clayNum + siltNum;
		if (Math.abs(total - 100) > 2) {
			// Allow 2% tolerance for rounding
			console.warn(`Soil composition total is ${total}%, normalizing to 100%`);

			// Normalize to 100%
			const factor = 100 / total;
			return {
				sand: Math.round(sandNum * factor * 10) / 10,
				clay: Math.round(clayNum * factor * 10) / 10,
				silt: Math.round(siltNum * factor * 10) / 10,
			};
		}

		return {
			sand: Math.round(sandNum * 10) / 10,
			clay: Math.round(clayNum * 10) / 10,
			silt: Math.round(siltNum * 10) / 10,
		};
	}

	/**
	 * Calculate sample point coordinates within triangle
	 * @param {Object} soilData - Validated soil data
	 * @returns {Object} Point coordinates {x, y}
	 */
	calculateSamplePoint(soilData) {
		const { sand, clay, silt } = soilData;
		const { triangle } = this.config;

		// Convert percentages to coordinates using barycentric coordinates
		// Triangle vertices: Clay (top), Sand (bottom-left), Silt (bottom-right)

		// Normalize percentages to fractions
		const clayFraction = clay / 100;
		const sandFraction = sand / 100;
		const siltFraction = silt / 100;

		// Calculate coordinates using weighted average of triangle vertices
		const x =
			clayFraction * triangle.topVertex.x +
			sandFraction * triangle.leftVertex.x +
			siltFraction * triangle.rightVertex.x;

		const y =
			clayFraction * triangle.topVertex.y +
			sandFraction * triangle.leftVertex.y +
			siltFraction * triangle.rightVertex.y;

		return {
			x: Math.round(x * 10) / 10,
			y: Math.round(y * 10) / 10,
		};
	}

	/**
	 * Classify soil texture based on composition
	 * @param {Object} soilData - Soil composition data
	 * @returns {string} Texture classification
	 */
	classifyTexture(soilData) {
		const { sand, clay, silt } = soilData;

		// Check each texture class in order of specificity
		for (const [className, criteria] of Object.entries(this.textureClasses)) {
			if (this.matchesTextureCriteria(sand, clay, silt, criteria)) {
				return className;
			}
		}

		// Default fallback
		return "unclassified";
	}

	/**
	 * Check if soil composition matches texture criteria
	 * @param {number} sand - Sand percentage
	 * @param {number} clay - Clay percentage
	 * @param {number} silt - Silt percentage
	 * @param {Object} criteria - Texture class criteria
	 * @returns {boolean} Whether composition matches criteria
	 */
	matchesTextureCriteria(sand, clay, silt, criteria) {
		// Check clay constraints
		if (criteria.minClay !== undefined && clay < criteria.minClay) return false;
		if (criteria.maxClay !== undefined && clay > criteria.maxClay) return false;

		// Check sand constraints
		if (criteria.minSand !== undefined && sand < criteria.minSand) return false;
		if (criteria.maxSand !== undefined && sand > criteria.maxSand) return false;

		// Check silt constraints
		if (criteria.minSilt !== undefined && silt < criteria.minSilt) return false;
		if (criteria.maxSilt !== undefined && silt > criteria.maxSilt) return false;

		return true;
	}

	/**
	 * Generate background element
	 * @returns {string} SVG background markup
	 */
	generateBackground() {
		return `<rect width="${this.config.width}" height="${this.config.height}" fill="${this.config.colors.background}"/>`;
	}

	/**
	 * Generate triangle outline
	 * @returns {string} SVG triangle outline markup
	 */
	generateTriangleOutline() {
		const { triangle, colors, styles } = this.config;
		const points = `${triangle.topVertex.x},${triangle.topVertex.y} ${triangle.leftVertex.x},${triangle.leftVertex.y} ${triangle.rightVertex.x},${triangle.rightVertex.y}`;

		return `<polygon points="${points}" fill="none" stroke="${colors.triangleOutline}" stroke-width="${styles.triangleStroke}"/>`;
	}

	/**
	 * Generate grid lines for percentage guidelines
	 * Grid lines removed for cleaner appearance
	 * @returns {string} Empty string (no grid lines)
	 */
	generateGridLines() {
		// Grid lines removed - return empty string for cleaner triangle
		return "";
	}

	/**
	 * Generate axis labels
	 * @returns {string} SVG axis labels markup
	 */
	generateAxisLabels() {
		const { triangle, colors, styles } = this.config;
		let labels = "";

		// Clay axis labels (left side)
		for (let i = 0; i <= 100; i += 20) {
			const y = triangle.leftVertex.y - (i / 100) * triangle.height;
			const x = triangle.leftVertex.x - 20;
			labels += `<text x="${x}" y="${y + 5}" fill="${
				colors.textLabels
			}" font-size="${styles.fontSize}" font-family="${
				styles.fontFamily
			}" text-anchor="middle">${i}</text>`;
		}

		// Sand axis labels (bottom)
		for (let i = 0; i <= 100; i += 20) {
			const x = triangle.leftVertex.x + (i / 100) * triangle.base;
			const y = triangle.leftVertex.y + 25;
			labels += `<text x="${x}" y="${y}" fill="${colors.textLabels}" font-size="${styles.fontSize}" font-family="${styles.fontFamily}" text-anchor="middle">${i}</text>`;
		}

		// Silt axis labels (right side)
		for (let i = 0; i <= 100; i += 20) {
			const x = triangle.rightVertex.x + 20;
			const y = triangle.rightVertex.y - (i / 100) * triangle.height;
			labels += `<text x="${x}" y="${y + 5}" fill="${
				colors.textLabels
			}" font-size="${styles.fontSize}" font-family="${
				styles.fontFamily
			}" text-anchor="middle">${i}</text>`;
		}

		// Axis titles
		labels += `<text x="${triangle.topVertex.x}" y="${
			triangle.topVertex.y - 15
		}" fill="${colors.textLabels}" font-size="${
			styles.fontSize + 2
		}" font-family="${
			styles.fontFamily
		}" text-anchor="middle" font-weight="bold">Clay %</text>`;
		labels += `<text x="${triangle.leftVertex.x - 40}" y="${
			triangle.leftVertex.y + 40
		}" fill="${colors.textLabels}" font-size="${
			styles.fontSize + 2
		}" font-family="${
			styles.fontFamily
		}" text-anchor="middle" font-weight="bold">Sand %</text>`;
		labels += `<text x="${triangle.rightVertex.x + 40}" y="${
			triangle.rightVertex.y + 40
		}" fill="${colors.textLabels}" font-size="${
			styles.fontSize + 2
		}" font-family="${
			styles.fontFamily
		}" text-anchor="middle" font-weight="bold">Silt %</text>`;

		return labels;
	}

	/**
	 * Generate sample point
	 * @param {Object} point - Point coordinates {x, y}
	 * @returns {string} SVG sample point markup
	 */
	generateSamplePoint(point) {
		const { colors, styles } = this.config;
		return `<circle cx="${point.x}" cy="${point.y}" r="${styles.pointRadius}" fill="${colors.samplePoint}" stroke="#ffffff" stroke-width="2"/>`;
	}

	/**
	 * Generate texture classification label
	 * @param {string} textureClass - Texture classification
	 * @param {Object} point - Point coordinates for positioning
	 * @returns {string} SVG texture label markup
	 */
	generateTextureLabel(textureClass, point) {
		const { colors, styles } = this.config;
		const labelY = point.y - 15;
		const capitalizedClass =
			textureClass.charAt(0).toUpperCase() + textureClass.slice(1);

		return `<text x="${point.x}" y="${labelY}" fill="${
			colors.textLabels
		}" font-size="${styles.fontSize + 1}" font-family="${
			styles.fontFamily
		}" text-anchor="middle" font-weight="bold">${capitalizedClass}</text>`;
	}

	/**
	 * Generate legend
	 * @returns {string} SVG legend markup
	 */
	generateLegend() {
		const { colors, styles } = this.config;
		const legendX = 20;
		const legendY = 20;

		let legend = `<g id="legend">`;
		legend += `<text x="${legendX}" y="${legendY}" fill="${colors.textLabels}" font-size="${styles.fontSize}" font-family="${styles.fontFamily}" font-weight="bold">Soil Texture Triangle</text>`;
		legend += `<circle cx="${legendX + 10}" cy="${legendY + 20}" r="${
			styles.pointRadius
		}" fill="${colors.samplePoint}" stroke="#ffffff" stroke-width="2"/>`;
		legend += `<text x="${legendX + 25}" y="${legendY + 25}" fill="${
			colors.textLabels
		}" font-size="${styles.fontSize - 1}" font-family="${
			styles.fontFamily
		}">Sample Point</text>`;
		legend += `</g>`;

		return legend;
	}

	/**
	 * Assemble complete SVG markup
	 * @param {Object} svgElements - Generated SVG elements
	 * @returns {string} Complete SVG markup
	 */
	assembleSVG(svgElements) {
		const { width, height } = this.config;

		let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
		svg += `<defs>`;
		svg += `<style>`;
		svg += `.triangle-text { font-family: ${this.config.styles.fontFamily}; }`;
		svg += `.triangle-grid { stroke-dasharray: 2,2; }`;
		svg += `</style>`;
		svg += `</defs>`;

		// Add all SVG elements in order
		svg += svgElements.background;
		svg += svgElements.triangleOutline;
		svg += svgElements.gridLines;
		svg += svgElements.axisLabels;
		svg += svgElements.samplePoint;
		svg += svgElements.textureLabel;
		svg += svgElements.legend;

		// Add ready marker for Puppeteer
		svg += `<g id="chart-ready-marker" style="display: none;">READY</g>`;

		svg += `</svg>`;

		return svg;
	}

	/**
	 * Generate error SVG when generation fails
	 * @param {string} errorMessage - Error message to display
	 * @returns {string} Error SVG markup
	 */
	generateErrorSVG(errorMessage) {
		const { width, height, colors, styles } = this.config;

		let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;
		svg += `<rect width="${width}" height="${height}" fill="#f8f8f8" stroke="#cccccc"/>`;
		svg += `<text x="${width / 2}" y="${
			height / 2 - 20
		}" fill="#cc0000" font-size="${styles.fontSize + 4}" font-family="${
			styles.fontFamily
		}" text-anchor="middle" font-weight="bold">Error Generating Triangle</text>`;
		svg += `<text x="${width / 2}" y="${height / 2 + 10}" fill="${
			colors.textLabels
		}" font-size="${styles.fontSize}" font-family="${
			styles.fontFamily
		}" text-anchor="middle">${errorMessage}</text>`;
		svg += `</svg>`;

		return svg;
	}

	/**
	 * Generate test SVG with sample data for validation
	 * @returns {string} Test SVG markup
	 */
	generateTestSVG() {
		const testData = {
			sand: 40,
			clay: 30,
			silt: 30,
		};

		return this.generateTriangleSVG(testData);
	}

	/**
	 * Validate SVG output for basic structure
	 * @param {string} svgMarkup - Generated SVG markup
	 * @returns {boolean} Whether SVG is valid
	 */
	validateSVG(svgMarkup) {
		if (!svgMarkup || typeof svgMarkup !== "string") {
			return false;
		}

		// Check for required SVG elements
		const requiredElements = [
			"<svg",
			"</svg>",
			"<polygon", // Triangle outline
			"<circle", // Sample point
			"chart-ready-marker", // Ready marker
		];

		return requiredElements.every((element) => svgMarkup.includes(element));
	}
}

// Export singleton instance
const soilTriangleGenerator = new SoilTriangleGenerator();

module.exports = {
	SoilTriangleGenerator,
	generateSoilTriangleSVG: (soilData) =>
		soilTriangleGenerator.generateTriangleSVG(soilData),
	generateTestSVG: () => soilTriangleGenerator.generateTestSVG(),
	validateSVG: (svgMarkup) => soilTriangleGenerator.validateSVG(svgMarkup),
};
