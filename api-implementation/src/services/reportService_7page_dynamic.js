/**
 * Professional 7-Page A4 Report Service with Dynamic Sizing
 * Implements intelligent content adaptation and responsive layout
 * Prevents overflow while maintaining professional quality
 *
 * @format
 */

const DynamicSizingService = require("./dynamicSizingService");

class Professional7PageDynamicReportService {
	constructor() {
		this.dynamicSizing = new DynamicSizingService();
	}

	/**
	 * Generate professional 7-page A4 report HTML with dynamic sizing
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @returns {string} HTML content with dynamic sizing
	 */
	generateProfessional7PageHTML(soilData, userInfo) {
		// Analyze content and determine optimal sizing strategy
		const sizingAnalysis = this.dynamicSizing.analyzePage(soilData, userInfo);
		const cssVariables = sizingAnalysis.cssVariables;
		const contentDistribution = sizingAnalysis.contentDistribution;

		const currentDate = new Date().toLocaleDateString("en-GB");
		const reportID = `FLH-Analysis${Math.floor(
			Math.random() * 1000
		)}-${new Date().toLocaleDateString("en-GB").replace(/\//g, "")}`;

		return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>FlahaSoil Professional Analysis Report</title>
            <style>
                /* Dynamic CSS Variables - Automatically adjusted based on content */
                :root {
                    /* Flaha PA Brand Colors */
                    --flaha-green: #3d7a42;
                    --tech-blue: #1e5f8c;
                    --pa-accent: #2196f3;
                    --earth-brown: #8c6d4f;
                    --neutral-gray: #bcbec0;
                    --light-gray: #f5f5f5;
                    --white: #ffffff;
                    --text-dark: #2c3e50;
                    
                    /* Dynamic Sizing Variables - Adjusted by content analysis */
                    ${Object.entries(cssVariables)
											.map(([key, value]) => `${key}: ${value};`)
											.join("\n                    ")}
                }

                /* A4 Page Setup with Dynamic Constraints */
                @page {
                    size: A4;
                    margin: 15mm;
                }

                /* Print-specific styles with dynamic sizing */
                @media print {
                    .page {
                        height: 267mm;
                        width: 180mm;
                        margin: 0;
                        padding: var(--page-padding);
                        page-break-after: always;
                        page-break-inside: avoid;
                        overflow: hidden;
                        box-sizing: border-box;
                        position: relative;
                    }

                    .page:last-child {
                        page-break-after: avoid;
                    }

                    /* Dynamic content fitting - Ultra Optimized */
                    .section-box {
                        page-break-inside: avoid;
                        margin-bottom: calc(var(--section-margin) * 0.5);  /* Reduced margin by 50% */
                        padding: calc(var(--section-padding) * 0.25);  /* Reduced padding by 50% */
                        max-height: calc(267mm - var(--page-padding) * 2 - 40mm); /* Reserve space for headers */
                        overflow: hidden;
                    }

                    .chart-main, .chart-secondary {
                        page-break-inside: avoid;
                    }

                    /* Responsive text sizing */
                    .dynamic-text {
                        font-size: var(--font-size-base);
                        line-height: var(--line-height);
                    }

                    /* Auto-adjust data grids */
                    .data-grid {
                        gap: var(--data-grid-gap);
                    }

                    /* Flexible chart sizing */
                    .chart-main {
                        height: var(--chart-main-height);
                        max-height: var(--chart-main-height);
                    }

                    .chart-secondary {
                        height: var(--chart-secondary-height);
                        max-height: var(--chart-secondary-height);
                    }
                }

                /* Screen preview with dynamic sizing */
                @media screen {
                    .page {
                        min-height: 267mm;
                        max-height: 267mm;
                        width: 180mm;
                        margin: 0 auto 20mm auto;
                        padding: var(--page-padding);
                        border: 1px solid #ddd;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        background: white;
                        overflow: hidden;
                        box-sizing: border-box;
                        position: relative;
                    }

                    /* Content overflow indicator for preview */
                    .page::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 2px;
                        background: linear-gradient(90deg, transparent, #ff6b6b, transparent);
                        opacity: 0;
                        transition: opacity 0.3s;
                    }

                    .page.overflow-warning::after {
                        opacity: 1;
                    }
                }

                /* Typography with dynamic sizing */
                body {
                    font-family: 'Arial', 'Helvetica', sans-serif;
                    line-height: var(--line-height);
                    color: var(--text-dark);
                    margin: 0;
                    padding: 0;
                    font-size: var(--font-size-base);
                }

                h1 {
                    font-size: var(--font-size-h1);
                    font-weight: bold;
                    color: var(--flaha-green);
                    margin: 0;
                    line-height: 1.2;
                }

                h2 {
                    font-size: var(--font-size-h2);
                    font-weight: 600;
                    color: var(--flaha-green);
                    margin-top: calc(var(--section-margin) * 0.8);
                    margin-bottom: calc(var(--section-margin) * 0.4);
                    line-height: 1.3;
                }

                h3 {
                    font-size: var(--font-size-h3);
                    font-weight: 600;
                    color: var(--text-dark);
                    margin-top: calc(var(--section-margin) * 0.6);
                    margin-bottom: calc(var(--section-margin) * 0.3);
                    line-height: 1.3;
                }

                p {
                    margin-bottom: calc(var(--section-margin) * 0.4);
                    font-size: var(--font-size-base);
                    line-height: var(--line-height);
                }

                /* Dynamic Section Boxes - Ultra Optimized */
                .section-box {
                    max-width: 180mm;
                    padding: calc(var(--section-padding) * 0.25);  /* Further reduced from 0.5 to 0.25 (50% reduction) */
                    background: linear-gradient(135deg, rgba(61, 122, 66, 0.03) 0%, rgba(30, 95, 140, 0.02) 100%);
                    border: 1px solid var(--flaha-green);
                    border-radius: 4mm;
                    margin-bottom: calc(var(--section-margin) * 0.5);  /* Reduced bottom margin by 50% */
                    box-sizing: border-box;
                }

                /* Responsive Chart Containers */
                .chart-container {
                    text-align: center;
                    margin: calc(var(--section-margin) * 0.5) 0;
                }

                .chart-main {
                    width: calc(180mm - var(--page-padding) * 2);
                    max-width: 140mm;
                    height: var(--chart-main-height);
                    margin: 0 auto;
                    background: var(--light-gray);
                    border: 1px solid var(--neutral-gray);
                    border-radius: 4mm;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--neutral-gray);
                    font-style: italic;
                    box-sizing: border-box;
                }

                .chart-secondary {
                    width: calc(140mm - var(--page-padding));
                    max-width: 120mm;
                    height: var(--chart-secondary-height);
                    margin: 0 auto;
                    background: var(--light-gray);
                    border: 1px solid var(--neutral-gray);
                    border-radius: 4mm;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: var(--neutral-gray);
                    font-style: italic;
                    box-sizing: border-box;
                }

                /* Dynamic Data Grid Layout - Ultra Optimized */
                .data-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: calc(var(--data-grid-gap) * 0.5);  /* Reduced gap by 50% */
                    margin: calc(var(--section-margin) * 0.25) 0;  /* Reduced margin by 50% */
                }

                /* Auto-adjust grid for compact mode */
                .data-grid.compact {
                    grid-template-columns: 1fr 1fr 1fr;
                    gap: calc(var(--data-grid-gap) * 0.35);  /* Further reduced gap */
                }

                .data-item {
                    background: var(--white);
                    padding: calc(var(--section-padding) * 0.35);
                    border-radius: 3mm;
                    border-left: 3px solid var(--pa-accent);
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                    box-sizing: border-box;
                }

                .data-item label {
                    font-weight: 600;
                    color: var(--text-dark);
                    display: block;
                    margin-bottom: 4pt;
                    font-size: calc(var(--font-size-base) * 0.9);
                }

                .data-item .value {
                    font-size: calc(var(--font-size-base) * 1.1);
                    color: var(--flaha-green);
                    font-weight: 500;
                }

                /* Dynamic Logo Sizing */
                .logo-container {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: calc(var(--section-margin) * 1.5);
                }

                .logo-box {
                    width: calc(var(--logo-height) * 2);
                    height: var(--logo-height);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4mm;
                    font-weight: bold;
                    color: white;
                    font-size: calc(var(--font-size-base) * 1.2);
                }

                .flaha-pa-logo {
                    background: var(--flaha-green);
                }

                .flahasoil-logo {
                    background: var(--tech-blue);
                }

                /* Content Density Indicators - Ultra Optimized */
                .content-density-high .section-box {
                    padding: calc(var(--section-padding) * 0.25 * 0.8);  /* Ultra compact padding */
                    margin-bottom: calc(var(--section-margin) * 0.5 * 0.8);  /* Ultra compact margin */
                }

                .content-density-low .section-box {
                    padding: calc(var(--section-padding) * 0.25 * 1.2);  /* Slightly more padding */
                    margin-bottom: calc(var(--section-margin) * 0.5 * 1.2);  /* Slightly more margin */
                }

                /* Overflow prevention utilities */
                .text-truncate {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .content-fit {
                    max-height: 100%;
                    overflow: hidden;
                }

                /* Dynamic spacing utilities */
                .spacing-compact { margin: calc(var(--section-margin) * 0.5) 0; }
                .spacing-normal { margin: var(--section-margin) 0; }
                .spacing-relaxed { margin: calc(var(--section-margin) * 1.5) 0; }

                /* Modern Stylish Footer */
                .page-footer {
                    position: absolute;
                    bottom: 8mm;
                    left: 0;
                    right: 0;
                    height: 12mm;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 var(--page-padding);
                    background: linear-gradient(90deg,
                        rgba(61, 122, 66, 0.08) 0%,
                        rgba(30, 95, 140, 0.05) 50%,
                        rgba(61, 122, 66, 0.08) 100%);
                    border-top: 1px solid rgba(61, 122, 66, 0.2);
                    border-radius: 0 0 4mm 4mm;
                    font-size: calc(var(--font-size-base) * 0.8);
                    color: var(--neutral-gray);
                    box-sizing: border-box;
                }

                .footer-left {
                    display: flex;
                    align-items: center;
                    gap: 8pt;
                }

                .footer-center {
                    text-align: center;
                    font-weight: 500;
                    color: var(--flaha-green);
                }

                .footer-right {
                    display: flex;
                    align-items: center;
                    gap: 8pt;
                    font-weight: 500;
                }

                .footer-logo {
                    width: 8mm;
                    height: 8mm;
                    background: var(--flaha-green);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 6pt;
                    font-weight: bold;
                }

                .page-number {
                    background: var(--tech-blue);
                    color: white;
                    padding: 2pt 6pt;
                    border-radius: 2mm;
                    font-weight: bold;
                    font-size: calc(var(--font-size-base) * 0.85);
                }

                /* Debug helpers for development */
                .debug-mode .page {
                    border: 2px solid red;
                    position: relative;
                }

                .debug-mode .page::before {
                    content: 'Page Height: 267mm | Strategy: ${
											sizingAnalysis.strategy
										}';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    font-size: 8pt;
                    color: red;
                    background: white;
                    padding: 2px;
                    z-index: 1000;
                }
            </style>
        </head>
        <body class="content-density-${sizingAnalysis.strategy}">
            <!-- Content will be generated with dynamic sizing applied -->
            ${this.generateDynamicPageContent(
							soilData,
							userInfo,
							sizingAnalysis
						)}
        </body>
        </html>
        `;
	}

	/**
	 * Generate page content with dynamic sizing applied
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @param {Object} sizingAnalysis - Sizing analysis results
	 * @returns {string} HTML content for pages
	 */
	generateDynamicPageContent(soilData, userInfo, sizingAnalysis) {
		const { strategy, contentDistribution } = sizingAnalysis;
		const currentDate = new Date().toLocaleDateString("en-GB");
		const reportID = `FLH-Analysis${Math.floor(
			Math.random() * 1000
		)}-${currentDate.replace(/\//g, "")}`;

		// Generate pages based on content distribution
		let pagesHTML = "";

		contentDistribution.forEach((pageConfig, index) => {
			pagesHTML += this.generateDynamicPage(pageConfig, soilData, userInfo, {
				currentDate,
				reportID,
				strategy,
				pageNumber: index + 1,
				totalPages: contentDistribution.length,
			});
		});

		return pagesHTML;
	}

	/**
	 * Generate individual page with dynamic content
	 * @param {Object} pageConfig - Page configuration
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @param {Object} context - Generation context
	 * @returns {string} HTML for the page
	 */
	generateDynamicPage(pageConfig, soilData, userInfo, context) {
		const { pageNumber, sections, priority } = pageConfig;
		const { strategy, currentDate, reportID, totalPages } = context;

		// Apply content density class based on strategy
		const densityClass =
			strategy === "compact"
				? "content-density-high"
				: strategy === "spacious"
				? "content-density-low"
				: "";

		let pageContent = `
            <!-- PAGE ${pageNumber}: ${sections.join(", ").toUpperCase()} -->
            <div class="page ${densityClass}" data-page="${pageNumber}" data-priority="${priority}">
        `;

		// Generate content based on page sections
		sections.forEach((section) => {
			pageContent += this.generateSectionContent(
				section,
				soilData,
				userInfo,
				context
			);
		});

		// Add modern stylish footer to each page
		pageContent += this.generatePageFooter(
			pageNumber,
			totalPages,
			currentDate,
			reportID
		);

		pageContent += `
            </div>
        `;

		return pageContent;
	}

	/**
	 * Generate modern stylish footer for each page
	 * @param {number} pageNumber - Current page number
	 * @param {number} totalPages - Total number of pages
	 * @param {string} currentDate - Current date
	 * @param {string} reportID - Report ID
	 * @returns {string} HTML for the footer
	 */
	generatePageFooter(pageNumber, totalPages, currentDate, reportID) {
		return `
            <div class="page-footer">
                <div class="footer-left">
                    <div class="footer-logo">F</div>
                    <span>FlahaSoil Professional</span>
                </div>
                <div class="footer-center">
                    ${reportID}
                </div>
                <div class="footer-right">
                    <span>${currentDate}</span>
                    <div class="page-number">${pageNumber}/${totalPages}</div>
                </div>
            </div>
        `;
	}

	/**
	 * Generate content for specific sections with dynamic sizing
	 * @param {string} section - Section type
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @param {Object} context - Generation context
	 * @returns {string} HTML for the section
	 */
	generateSectionContent(section, soilData, userInfo, context) {
		const { strategy, currentDate, reportID } = context;

		switch (section) {
			case "cover":
				return this.generateCoverSection(
					userInfo,
					currentDate,
					reportID,
					strategy
				);
			case "userInfo":
				return this.generateUserInfoSection(userInfo, strategy);
			case "tableOfContents":
				return this.generateTOCSection(strategy);
			case "soilProperties":
				return this.generateSoilPropertiesSection(soilData, strategy);
			case "composition":
				return this.generateCompositionSection(soilData, strategy);
			case "textureClassification":
				return this.generateTextureSection(soilData, strategy);
			case "usda-triangle":
				return this.generateUSDATriangleSection(soilData, strategy);
			case "analysisResults":
				return this.generateAnalysisResultsSection(soilData, strategy);
			case "waterCharacteristics":
				return this.generateWaterCharacteristicsSection(soilData, strategy);
			case "recommendations":
				return this.generateRecommendationsSection(soilData, strategy);
			case "management":
				return this.generateManagementSection(soilData, strategy);
			case "ecosystem":
				return this.generateEcosystemSection(strategy);
			case "contact":
				return this.generateContactSection(strategy);
			default:
				return "";
		}
	}

	// Section generation methods will be implemented in the next part...
	generateCoverSection(userInfo, currentDate, reportID, strategy) {
		const spacingClass =
			strategy === "compact"
				? "spacing-compact"
				: strategy === "spacious"
				? "spacing-relaxed"
				: "spacing-normal";

		return `
            <div style="text-align: center;" class="${spacingClass}">
                <div class="logo-container">
                    <div class="logo-box flaha-pa-logo">FLAHA PA</div>
                    <div class="logo-box flahasoil-logo">FLAHASOIL</div>
                </div>

                <h1 style="margin-bottom: 8pt;">SOIL ANALYSIS REPORT</h1>
                <p style="font-size: calc(var(--font-size-base) * 1.2); color: var(--tech-blue); margin-bottom: var(--section-margin);">
                    Professional Water Characteristics Analysis
                </p>

                <div class="section-box" style="text-align: left; max-width: 120mm; margin: 0 auto;">
                    <h3 style="margin-top: 0; color: var(--flaha-green);">GENERATED FOR:</h3>
                    <p style="font-size: calc(var(--font-size-base) * 1.2); font-weight: 500; margin-bottom: 16pt;">
                        ${userInfo.name}
                    </p>

                    <h3 style="color: var(--flaha-green);">EMAIL:</h3>
                    <p style="font-size: calc(var(--font-size-base) * 1.1); margin-bottom: 16pt;">
                        ${userInfo.email}
                    </p>

                    <h3 style="color: var(--flaha-green);">REPORT INFORMATION:</h3>
                    <p><strong>Date:</strong> ${currentDate}</p>
                    <p><strong>Report ID:</strong> ${reportID}</p>
                    <p><strong>Plan:</strong> ${userInfo.tier}</p>
                </div>

                <div style="margin-top: var(--section-margin); padding: var(--section-padding); background: rgba(61, 122, 66, 0.05); border-radius: 4mm;">
                    <p style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray); margin: 0;">
                        Based on Saxton & Rawls (2006) Methodology
                    </p>
                    <p style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray); margin: 0;">
                        Professional Soil Water Characteristics Analysis
                    </p>
                </div>
            </div>
        `;
	}

	generateUserInfoSection(userInfo, strategy) {
		return ""; // User info is included in cover section
	}

	generateTOCSection(strategy) {
		const spacingClass =
			strategy === "compact" ? "spacing-compact" : "spacing-normal";

		return `
            <h1 style="text-align: center; margin-bottom: var(--section-margin);">TABLE OF CONTENTS</h1>

            <div style="font-size: calc(var(--font-size-base) * 1.1); line-height: 1.8;" class="${spacingClass}">
                <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted var(--neutral-gray); margin-bottom: 12pt; padding-bottom: 8pt;">
                    <span><strong>1. Soil Properties</strong></span>
                    <span><strong>3</strong></span>
                </div>
                <div style="margin-left: 20pt; margin-bottom: 8pt; display: flex; justify-content: space-between; font-size: var(--font-size-base);">
                    <span>• Composition Analysis</span>
                    <span>3</span>
                </div>
                <div style="margin-left: 20pt; margin-bottom: 8pt; display: flex; justify-content: space-between; font-size: var(--font-size-base);">
                    <span>• Physical Characteristics</span>
                    <span>3</span>
                </div>

                <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted var(--neutral-gray); margin-bottom: 12pt; padding-bottom: 8pt;">
                    <span><strong>2. Soil Texture Classification</strong></span>
                    <span><strong>4</strong></span>
                </div>
                <div style="margin-left: 20pt; margin-bottom: 8pt; display: flex; justify-content: space-between; font-size: var(--font-size-base);">
                    <span>• USDA Triangle Classification</span>
                    <span>4</span>
                </div>

                <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted var(--neutral-gray); margin-bottom: 12pt; padding-bottom: 8pt;">
                    <span><strong>3. Soil Analysis Results</strong></span>
                    <span><strong>5</strong></span>
                </div>
                <div style="margin-left: 20pt; margin-bottom: 8pt; display: flex; justify-content: space-between; font-size: var(--font-size-base);">
                    <span>• Water Characteristics</span>
                    <span>5</span>
                </div>

                <div style="display: flex; justify-content: space-between; border-bottom: 1px dotted var(--neutral-gray); margin-bottom: 12pt; padding-bottom: 8pt;">
                    <span><strong>4. Crop Recommendations</strong></span>
                    <span><strong>6</strong></span>
                </div>
            </div>
        `;
	}

	generateSoilPropertiesSection(soilData, strategy) {
		const gridClass =
			strategy === "compact" ? "data-grid compact" : "data-grid";

		return `
            <h1>1. SOIL PROPERTIES</h1>

            <h2>COMPOSITION ANALYSIS</h2>
            <div class="section-box">
                <div class="${gridClass}">
                    <div class="data-item">
                        <label>Sand Content</label>
                        <span class="value">${
													soilData.sand
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                    <div class="data-item">
                        <label>Clay Content</label>
                        <span class="value">${
													soilData.clay
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                    <div class="data-item">
                        <label>Silt Content</label>
                        <span class="value">${
													soilData.silt
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                    <div class="data-item">
                        <label>Organic Matter</label>
                        <span class="value">${
													soilData.organicMatter
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                </div>
            </div>

            <h2>BULK DENSITY ANALYSIS</h2>
            <div class="section-box">
                <div class="${gridClass}">
                    <div class="data-item">
                        <label>Bulk Density</label>
                        <span class="value">${
													soilData.bulkDensity || "N/A"
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);"> g/cm³</span></span>
                    </div>
                    <div class="data-item">
                        <label>Porosity</label>
                        <span class="value">${
													soilData.porosity || "N/A"
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                    <div class="data-item">
                        <label>Void Ratio</label>
                        <span class="value">${this.calculateVoidRatio(
													soilData
												)}</span>
                    </div>
                    <div class="data-item">
                        <label>Texture Class</label>
                        <span class="value">${soilData.textureClass}</span>
                    </div>
                </div>

                <div style="margin-top: calc(var(--section-margin) * 0.25); padding: calc(var(--section-padding) * 0.35); background: rgba(61, 122, 66, 0.05); border-radius: 3mm;">
                    <p style="margin: 0; font-size: calc(var(--font-size-base) * 0.9); color: var(--text-dark);">
                        <strong>Analysis:</strong> ${this.getBulkDensityAnalysis(
													soilData.bulkDensity
												)}
                    </p>
                </div>
            </div>
        `;
	}

	generateCompositionSection(soilData, strategy) {
		return ""; // Included in soil properties
	}

	generateTextureSection(soilData, strategy) {
		const gridClass =
			strategy === "compact" ? "data-grid compact" : "data-grid";

		return `
            <h1>2. SOIL TEXTURE CLASSIFICATION</h1>

            <h2>USDA TRIANGLE CLASSIFICATION</h2>
            <div class="section-box">
                <div class="chart-main">
                    <div id="soil-triangle-container">
                        USDA Soil Triangle Chart<br>
                        Your Soil: ${soilData.textureClass}<br>
                        Coordinates: (${soilData.sand}%, ${soilData.clay}%, ${
			soilData.silt
		}%)
                    </div>
                </div>
                <div style="margin-top: calc(var(--section-margin) * 0.25);">
                    <div class="data-grid">
                        <div class="data-item">
                            <label>Classification</label>
                            <span class="value">${soilData.textureClass}</span>
                        </div>
                        <div class="data-item">
                            <label>Confidence Level</label>
                            <span class="value">High</span>
                        </div>
                    </div>
                </div>
            </div>

            <h2>PARTICLE SIZE DISTRIBUTION</h2>
            <div class="section-box">
                <div class="${gridClass}">
                    <div class="data-item">
                        <label>Sand Particles (0.05-2.0 mm)</label>
                        <span class="value">${
													soilData.sand
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                    <div class="data-item">
                        <label>Silt Particles (0.002-0.05 mm)</label>
                        <span class="value">${
													soilData.silt
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                    <div class="data-item">
                        <label>Clay Particles (&lt;0.002 mm)</label>
                        <span class="value">${
													soilData.clay
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                    <div class="data-item">
                        <label>Dominant Particle</label>
                        <span class="value">${this.getDominantParticle(
													soilData
												)}</span>
                    </div>
                </div>

                <div style="margin-top: calc(var(--section-margin) * 0.25); padding: calc(var(--section-padding) * 0.35); background: rgba(30, 95, 140, 0.05); border-radius: 3mm;">
                    <p style="margin: 0; font-size: calc(var(--font-size-base) * 0.9); color: var(--text-dark);">
                        <strong>Distribution Analysis:</strong> ${this.getParticleSizeAnalysis(
													soilData
												)}
                    </p>
                </div>
            </div>
        `;
	}

	generateUSDATriangleSection(soilData, strategy) {
		return ""; // Included in texture section
	}

	generateAnalysisResultsSection(soilData, strategy) {
		const gridClass =
			strategy === "compact" ? "data-grid compact" : "data-grid";

		return `
            <h1>3. SOIL ANALYSIS RESULTS</h1>

            <h2>WATER CHARACTERISTICS</h2>
            <div class="section-box">
                <div class="${gridClass}">
                    <div class="data-item">
                        <label>Field Capacity</label>
                        <span class="value">${
													soilData.fieldCapacity || "N/A"
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                    <div class="data-item">
                        <label>Wilting Point</label>
                        <span class="value">${
													soilData.wiltingPoint || "N/A"
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                    <div class="data-item">
                        <label>Plant Available Water</label>
                        <span class="value">${
													soilData.plantAvailableWater || "N/A"
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                    <div class="data-item">
                        <label>Saturation</label>
                        <span class="value">${
													soilData.saturation || "N/A"
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">%</span></span>
                    </div>
                </div>
            </div>

            <h2>HYDRAULIC PROPERTIES</h2>
            <div class="section-box">
                <div class="${gridClass}">
                    <div class="data-item">
                        <label>Saturated Conductivity</label>
                        <span class="value">${
													soilData.saturatedConductivity || "N/A"
												}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);"> mm/hr</span></span>
                    </div>
                    <div class="data-item">
                        <label>Infiltration Rate</label>
                        <span class="value">${this.calculateInfiltrationRate(
													soilData
												)}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);"> mm/hr</span></span>
                    </div>
                    <div class="data-item">
                        <label>Drainage Class</label>
                        <span class="value">${this.getDrainageClass(
													soilData
												)}</span>
                    </div>
                    <div class="data-item">
                        <label>Permeability</label>
                        <span class="value">${this.getPermeabilityClass(
													soilData
												)}</span>
                    </div>
                </div>

                <div style="margin-top: calc(var(--section-margin) * 0.25); padding: calc(var(--section-padding) * 0.35); background: rgba(33, 150, 243, 0.05); border-radius: 3mm;">
                    <p style="margin: 0; font-size: calc(var(--font-size-base) * 0.9); color: var(--text-dark);">
                        <strong>Hydraulic Analysis:</strong> ${this.getHydraulicAnalysis(
													soilData
												)}
                    </p>
                </div>
            </div>

            <h2>QUALITY INDICATORS</h2>
            <div class="section-box">
                <div class="${gridClass}">
                    <div class="data-item">
                        <label>Overall Quality Score</label>
                        <span class="value">${this.calculateQualityScore(
													soilData
												)}<span style="font-size: calc(var(--font-size-base) * 0.9); color: var(--neutral-gray);">/100</span></span>
                    </div>
                    <div class="data-item">
                        <label>Water Retention</label>
                        <span class="value">${this.getWaterRetentionRating(
													soilData
												)}</span>
                    </div>
                    <div class="data-item">
                        <label>Nutrient Holding</label>
                        <span class="value">${this.getNutrientHoldingRating(
													soilData
												)}</span>
                    </div>
                    <div class="data-item">
                        <label>Agricultural Suitability</label>
                        <span class="value">${this.getAgriculturalSuitability(
													soilData
												)}</span>
                    </div>
                </div>

                <div style="margin-top: calc(var(--section-margin) * 0.25); padding: calc(var(--section-padding) * 0.35); background: rgba(61, 122, 66, 0.05); border-radius: 3mm;">
                    <p style="margin: 0; font-size: calc(var(--font-size-base) * 0.9); color: var(--text-dark);">
                        <strong>Quality Assessment:</strong> ${this.getQualityAssessment(
													soilData
												)}
                    </p>
                </div>
            </div>
        `;
	}

	generateWaterCharacteristicsSection(soilData, strategy) {
		return ""; // Included in analysis results
	}

	generateRecommendationsSection(soilData, strategy) {
		const recommendations = this.generateCropRecommendations(soilData);

		return `
            <h1>4. CROP RECOMMENDATIONS</h1>

            <div class="section-box">
                <h2>SUITABLE CROPS</h2>
                <div style="font-size: var(--font-size-base); line-height: var(--line-height);">
                    ${recommendations}
                </div>
            </div>
        `;
	}

	generateManagementSection(soilData, strategy) {
		return ""; // Included in recommendations
	}

	generateEcosystemSection(strategy) {
		return `
            <div style="text-align: center; margin-top: calc(var(--section-margin) * 1.5);">
                <!-- Flaha Agri Tech Main Logo -->
                <div style="margin-bottom: calc(var(--section-margin) * 1.5);">
                    <div style="width: 80mm; height: 25mm; background: linear-gradient(135deg, var(--flaha-green) 0%, var(--tech-blue) 100%); color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto; border-radius: 4mm; font-weight: bold; font-size: calc(var(--font-size-base) * 1.3); box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
                        FLAHA AGRI TECH
                    </div>
                </div>

                <!-- Three Product Boxes Horizontally -->
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: calc(var(--data-grid-gap) * 0.8); margin: calc(var(--section-margin) * 1.2) 0;">
                    <!-- Flaha PA Box -->
                    <div style="text-align: center; padding: calc(var(--section-padding) * 0.8); background: linear-gradient(135deg, rgba(61, 122, 66, 0.05) 0%, rgba(30, 95, 140, 0.03) 100%); border-radius: 4mm; border: 1px solid var(--flaha-green);">
                        <div style="width: 35mm; height: 18mm; background: var(--flaha-green); color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 8pt auto; border-radius: 3mm; font-weight: bold; font-size: calc(var(--font-size-base) * 0.9);">
                            FLAHA PA
                        </div>
                        <p style="font-size: calc(var(--font-size-base) * 0.8); color: var(--text-dark); font-weight: 500; margin: 0; line-height: 1.3;">Flaha Precision Agriculture</p>
                    </div>

                    <!-- Flaha AG Box -->
                    <div style="text-align: center; padding: calc(var(--section-padding) * 0.8); background: linear-gradient(135deg, rgba(61, 122, 66, 0.05) 0%, rgba(30, 95, 140, 0.03) 100%); border-radius: 4mm; border: 1px solid var(--tech-blue);">
                        <div style="width: 35mm; height: 18mm; background: var(--tech-blue); color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 8pt auto; border-radius: 3mm; font-weight: bold; font-size: calc(var(--font-size-base) * 0.9);">
                            FLAHA AG
                        </div>
                        <p style="font-size: calc(var(--font-size-base) * 0.8); color: var(--text-dark); font-weight: 500; margin: 0; line-height: 1.3;">Flaha Agriculture</p>
                    </div>

                    <!-- Flaha LA Box -->
                    <div style="text-align: center; padding: calc(var(--section-padding) * 0.8); background: linear-gradient(135deg, rgba(61, 122, 66, 0.05) 0%, rgba(30, 95, 140, 0.03) 100%); border-radius: 4mm; border: 1px solid var(--earth-brown);">
                        <div style="width: 35mm; height: 18mm; background: var(--earth-brown); color: white; display: flex; align-items: center; justify-content: center; margin: 0 auto 8pt auto; border-radius: 3mm; font-weight: bold; font-size: calc(var(--font-size-base) * 0.9);">
                            FLAHA LA
                        </div>
                        <p style="font-size: calc(var(--font-size-base) * 0.8); color: var(--text-dark); font-weight: 500; margin: 0; line-height: 1.3;">Flaha Landscape</p>
                    </div>
                </div>
            </div>
        `;
	}

	generateContactSection(strategy) {
		return `
            <div style="margin-top: calc(var(--section-margin) * 1.5); padding-top: 20pt; border-top: 2px solid var(--flaha-green); text-align: center;">
                <p style="font-size: calc(var(--font-size-base) * 0.9); color: var(--text-dark); margin: 12pt 0; font-weight: 500;">© 2025 Flaha Agri Tech</p>
                <p style="font-size: calc(var(--font-size-base) * 0.9); color: var(--text-dark); margin: 8pt 0; font-weight: 500;">All Rights Reserved</p>
                <p style="font-size: calc(var(--font-size-base) * 0.85); color: var(--neutral-gray); margin: 16pt 0 8pt 0;">Report generated by FlahaSoil v2.0</p>
                <p style="font-size: calc(var(--font-size-base) * 0.85); color: var(--neutral-gray); margin: 0;">Based on Saxton & Rawls (2006) Methodology</p>
            </div>
        `;
	}

	generateCropRecommendations(soilData) {
		const clay = parseFloat(soilData.clay) || 0;
		const sand = parseFloat(soilData.sand) || 0;
		const textureClass = soilData.textureClass || "";

		if (clay > 40) {
			return `
                <p><strong>Clay-Rich Soils:</strong> Excellent for crops requiring good water retention.</p>
                <p><strong>Recommended:</strong> Rice, Wheat, Soybeans, Alfalfa</p>
                <p><strong>Management:</strong> Improve drainage, avoid compaction, deep tillage when dry.</p>
            `;
		} else if (sand > 60) {
			return `
                <p><strong>Sandy Soils:</strong> Well-draining, suitable for root crops and quick-growing vegetables.</p>
                <p><strong>Recommended:</strong> Carrots, Potatoes, Radishes, Lettuce, Beans</p>
                <p><strong>Management:</strong> Frequent irrigation, organic matter addition, nutrient management.</p>
            `;
		} else {
			return `
                <p><strong>Loamy Soils:</strong> Ideal balanced soil for most agricultural crops.</p>
                <p><strong>Recommended:</strong> Corn, Tomatoes, Most vegetables, Fruit trees</p>
                <p><strong>Management:</strong> Standard practices, maintain organic matter, balanced fertilization.</p>
            `;
		}
	}

	// Helper methods for new sections
	calculateVoidRatio(soilData) {
		const porosity = parseFloat(soilData.porosity) || 0;
		if (porosity === 0) return "N/A";
		const voidRatio = porosity / (100 - porosity);
		return voidRatio.toFixed(2);
	}

	getBulkDensityAnalysis(bulkDensity) {
		const bd = parseFloat(bulkDensity) || 0;
		if (bd === 0) return "Bulk density data not available for analysis.";

		if (bd < 1.0)
			return "Very low bulk density - highly porous soil, excellent for root penetration.";
		if (bd < 1.3)
			return "Low to moderate bulk density - good soil structure with adequate pore space.";
		if (bd < 1.6)
			return "Moderate bulk density - typical for most agricultural soils.";
		if (bd < 1.8)
			return "High bulk density - may restrict root growth and water infiltration.";
		return "Very high bulk density - compacted soil requiring management intervention.";
	}

	getDominantParticle(soilData) {
		const sand = parseFloat(soilData.sand) || 0;
		const clay = parseFloat(soilData.clay) || 0;
		const silt = parseFloat(soilData.silt) || 0;

		if (sand >= clay && sand >= silt) return "Sand";
		if (clay >= sand && clay >= silt) return "Clay";
		return "Silt";
	}

	getParticleSizeAnalysis(soilData) {
		const dominant = this.getDominantParticle(soilData);

		if (dominant === "Sand") {
			return `Sand-dominated texture promotes drainage and aeration but may require frequent irrigation and nutrient management.`;
		} else if (dominant === "Clay") {
			return `Clay-dominated texture provides excellent nutrient retention and water holding capacity but may have drainage limitations.`;
		} else {
			return `Silt-dominated texture offers balanced properties with good nutrient retention and moderate drainage characteristics.`;
		}
	}

	calculateInfiltrationRate(soilData) {
		const conductivity = parseFloat(soilData.saturatedConductivity) || 0;
		if (conductivity === 0) return "N/A";
		return conductivity.toFixed(1);
	}

	getDrainageClass(soilData) {
		const conductivity = parseFloat(soilData.saturatedConductivity) || 0;
		if (conductivity === 0) return "Unknown";

		if (conductivity > 10) return "Rapid";
		if (conductivity > 3) return "Moderate";
		if (conductivity > 1) return "Slow";
		return "Very Slow";
	}

	getPermeabilityClass(soilData) {
		const conductivity = parseFloat(soilData.saturatedConductivity) || 0;
		if (conductivity === 0) return "Unknown";

		if (conductivity > 15) return "High";
		if (conductivity > 5) return "Moderate";
		if (conductivity > 1) return "Low";
		return "Very Low";
	}

	getHydraulicAnalysis(soilData) {
		const conductivity = parseFloat(soilData.saturatedConductivity) || 0;

		if (conductivity === 0)
			return "Hydraulic properties require saturated conductivity data for analysis.";

		if (conductivity > 10) {
			return "High hydraulic conductivity indicates excellent drainage and rapid water movement through soil.";
		} else if (conductivity > 3) {
			return "Moderate hydraulic conductivity provides balanced drainage suitable for most crops.";
		} else {
			return "Low hydraulic conductivity may cause waterlogging issues and requires drainage management.";
		}
	}

	calculateQualityScore(soilData) {
		let score = 0;
		const paw = parseFloat(soilData.plantAvailableWater) || 0;
		const om = parseFloat(soilData.organicMatter) || 0;
		const conductivity = parseFloat(soilData.saturatedConductivity) || 0;

		// Plant Available Water (0-30 points)
		if (paw > 0.15) score += 30;
		else if (paw > 0.1) score += 20;
		else if (paw > 0.05) score += 10;

		// Organic Matter (0-25 points)
		if (om > 3) score += 25;
		else if (om > 2) score += 20;
		else if (om > 1) score += 10;

		// Hydraulic Conductivity (0-25 points)
		if (conductivity > 3 && conductivity < 15) score += 25;
		else if (conductivity > 1 && conductivity < 20) score += 15;
		else if (conductivity > 0) score += 5;

		// Texture Balance (0-20 points)
		const textureClass = soilData.textureClass || "";
		if (textureClass.includes("loam")) score += 20;
		else if (textureClass.includes("sandy") || textureClass.includes("clay"))
			score += 10;

		return Math.min(score, 100);
	}

	getWaterRetentionRating(soilData) {
		const fc = parseFloat(soilData.fieldCapacity) || 0;
		const clay = parseFloat(soilData.clay) || 0;

		if (fc > 0.35 || clay > 40) return "Excellent";
		if (fc > 0.25 || clay > 25) return "Good";
		if (fc > 0.15 || clay > 15) return "Moderate";
		return "Poor";
	}

	getNutrientHoldingRating(soilData) {
		const clay = parseFloat(soilData.clay) || 0;
		const om = parseFloat(soilData.organicMatter) || 0;

		if ((clay > 30 && om > 2.5) || om > 4) return "Excellent";
		if ((clay > 20 && om > 1.5) || om > 2.5) return "Good";
		if (clay > 15 || om > 1) return "Moderate";
		return "Poor";
	}

	getAgriculturalSuitability(soilData) {
		const qualityScore = this.calculateQualityScore(soilData);

		if (qualityScore >= 80) return "Excellent";
		if (qualityScore >= 65) return "Good";
		if (qualityScore >= 50) return "Moderate";
		if (qualityScore >= 35) return "Fair";
		return "Poor";
	}

	getQualityAssessment(soilData) {
		const qualityScore = this.calculateQualityScore(soilData);
		const textureClass = soilData.textureClass || "";

		if (qualityScore >= 80) {
			return `Excellent soil quality with optimal characteristics for diverse agricultural applications. ${textureClass} texture provides ideal growing conditions.`;
		} else if (qualityScore >= 65) {
			return `Good soil quality suitable for most crops. ${textureClass} texture offers favorable growing conditions with minor limitations.`;
		} else if (qualityScore >= 50) {
			return `Moderate soil quality with some limitations. Management practices can improve productivity for ${textureClass} soils.`;
		} else {
			return `Soil quality requires improvement through targeted management practices. ${textureClass} texture presents challenges that need addressing.`;
		}
	}
}

module.exports = Professional7PageDynamicReportService;
