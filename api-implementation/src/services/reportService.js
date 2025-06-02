/** @format */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs").promises;
const { generateSoilTriangleSVG } = require("../utils/soilTriangleGenerator");
const Professional7PageReportService = require("./reportService_7page");
const Professional7PageDynamicReportService = require("./reportService_7page_dynamic");

class ReportService {
	constructor() {
		this.browser = null;
		this.professional7PageService = new Professional7PageReportService();
		this.professional7PageDynamicService =
			new Professional7PageDynamicReportService();
	}

	/**
	 * Initialize browser instance
	 */
	async initBrowser() {
		if (!this.browser) {
			this.browser = await puppeteer.launch({
				headless: true,
				args: ["--no-sandbox", "--disable-setuid-sandbox"],
			});
		}
		return this.browser;
	}

	/**
	 * Close browser instance
	 */
	async closeBrowser() {
		if (this.browser) {
			await this.browser.close();
			this.browser = null;
		}
	}

	/**
	 * Generate 7-page professional PDF report with dynamic sizing
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @returns {Buffer} PDF buffer
	 */
	async generateDynamicReport(soilData, userInfo) {
		const browser = await this.initBrowser();
		const page = await browser.newPage();

		try {
			// Generate 7-page professional HTML content with dynamic sizing
			const htmlContent =
				this.professional7PageDynamicService.generateProfessional7PageHTML(
					soilData,
					userInfo
				);

			// Set content and wait for it to load
			await page.setContent(htmlContent, { waitUntil: "networkidle0" });

			// Wait for chart ready marker to ensure SVG is fully rendered
			try {
				await page.waitForSelector("#chart-ready-marker", { timeout: 5000 });
				console.log(
					"📊 Chart ready marker found - SVG triangle rendered successfully"
				);
			} catch (error) {
				console.warn(
					"⚠️ Chart ready marker not found, proceeding with PDF generation"
				);
			}

			// Add a small delay to ensure all rendering is complete
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// Generate PDF with A4 format
			const pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				margin: {
					top: "15mm",
					right: "15mm",
					bottom: "15mm",
					left: "15mm",
				},
				preferCSSPageSize: true,
			});

			await page.close();
			return pdfBuffer;
		} catch (error) {
			console.error("Error generating dynamic report:", error);
			await page.close();
			throw error;
		}
	}

	/**
	 * Generate 7-page professional PDF report for Professional+ users (Legacy)
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @returns {Buffer} PDF buffer
	 */
	async generateStandardReport(soilData, userInfo) {
		const browser = await this.initBrowser();
		const page = await browser.newPage();

		try {
			// Generate 7-page professional HTML content
			const htmlContent =
				this.professional7PageService.generateProfessional7PageHTML(
					soilData,
					userInfo
				);

			// Set content and wait for it to load
			await page.setContent(htmlContent, { waitUntil: "networkidle0" });

			// Wait for chart ready marker to ensure SVG is fully rendered
			try {
				await page.waitForSelector("#chart-ready-marker", { timeout: 5000 });
				/* eslint-disable */ console.log(
					...oo_oo(
						`3776604300_102_4_104_5_4`,
						"📊 Chart ready marker found - SVG triangle rendered successfully"
					)
				);
			} catch (error) {
				console.warn(
					"⚠️ Chart ready marker not found, proceeding with PDF generation"
				);
			}

			// Add a small delay to ensure all rendering is complete
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				margin: {
					top: "15mm",
					right: "15mm",
					bottom: "15mm",
					left: "15mm",
				},
			});

			console.log(
				`📄 7-Page Professional PDF generated successfully: ${pdfBuffer.length} bytes`
			);
			return pdfBuffer;
		} finally {
			await page.close();
		}
	}

	/**
	 * Generate custom branded PDF report for Enterprise users
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @param {Object} customOptions - Custom branding options
	 * @returns {Buffer} PDF buffer
	 */
	async generateCustomReport(soilData, userInfo, customOptions = {}) {
		const browser = await this.initBrowser();
		const page = await browser.newPage();

		try {
			// Generate HTML content with custom branding
			const htmlContent = this.generateCustomReportHTML(
				soilData,
				userInfo,
				customOptions
			);

			await page.setContent(htmlContent, { waitUntil: "networkidle0" });

			// Wait for chart ready marker to ensure SVG is fully rendered
			try {
				await page.waitForSelector("#chart-ready-marker", { timeout: 5000 });
				/* eslint-disable */ console.log(
					...oo_oo(
						`3776604300_156_4_156_60_4`,
						"📊 Custom report chart ready marker found"
					)
				);
			} catch (error) {
				console.warn("⚠️ Custom report chart ready marker not found");
			}

			// Add a small delay to ensure all rendering is complete
			await new Promise((resolve) => setTimeout(resolve, 1000));

			const pdfBuffer = await page.pdf({
				format: customOptions.pageFormat || "A4",
				printBackground: true,
				margin: customOptions.margins || {
					top: "20mm",
					right: "15mm",
					bottom: "20mm",
					left: "15mm",
				},
			});

			/* eslint-disable */ console.log(
				...oo_oo(
					`3776604300_175_3_177_4_4`,
					`📄 Custom PDF generated successfully: ${pdfBuffer.length} bytes`
				)
			);
			return pdfBuffer;
		} finally {
			await page.close();
		}
	}

	/**
	 * Generate report ID
	 * @returns {string} Report ID in format FLH-XXX-DDMMYYYY
	 */
	generateReportID() {
		const now = new Date();
		const day = String(now.getDate()).padStart(2, "0");
		const month = String(now.getMonth() + 1).padStart(2, "0");
		const year = now.getFullYear();
		const reportNumber = Math.floor(Math.random() * 999) + 1;

		return `FLH-${String(reportNumber).padStart(3, "0")}-${day}${month}${year}`;
	}

	/**
	 * Generate soil triangle SVG for reports
	 * @param {Object} soilData - Soil composition data
	 * @returns {string} SVG markup
	 */
	generateSoilTriangleSVG(soilData) {
		try {
			// Use the SVG generator utility
			const svgMarkup = generateSoilTriangleSVG({
				sand: parseFloat(soilData.sand) || 0,
				clay: parseFloat(soilData.clay) || 0,
				silt: parseFloat(soilData.silt) || 0,
			});

			/* eslint-disable */ console.log(
				...oo_oo(
					`3776604300_212_3_212_61_4`,
					"📊 Soil triangle SVG generated successfully"
				)
			);
			return svgMarkup;
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(
					`3776604300_215_3_215_64_11`,
					"❌ Error generating soil triangle SVG:",
					error
				)
			);

			// Return fallback SVG with error message
			return `
				<svg width="500" height="450" viewBox="0 0 500 450" xmlns="http://www.w3.org/2000/svg">
					<rect width="500" height="450" fill="#f8f8f8" stroke="#cccccc"/>
					<text x="250" y="200" fill="#cc0000" font-size="16" font-family="Arial, sans-serif" text-anchor="middle" font-weight="bold">Error Generating Triangle</text>
					<text x="250" y="230" fill="#666" font-size="14" font-family="Arial, sans-serif" text-anchor="middle">Please check soil composition data</text>
					<text x="250" y="260" fill="#666" font-size="12" font-family="Arial, sans-serif" text-anchor="middle">Sand: ${soilData.sand}% | Clay: ${soilData.clay}% | Silt: ${soilData.silt}%</text>
					<g id="chart-ready-marker" style="display: none;">READY</g>
				</svg>
			`;
		}
	}

	/**
	 * Generate standard report HTML
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @returns {string} HTML content
	 */
	generateStandardReportHTML(soilData, userInfo) {
		const currentDate = new Date().toLocaleDateString("en-GB");
		const reportID = this.generateReportID();

		return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>FlahaSoil Analysis Report - ${userInfo.name}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }

                body {
                    font-family: 'Arial', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    background: white;
                }

                /* Page Layout */
                .page {
                    min-height: 100vh;
                    padding: 20px;
                    page-break-after: always;
                    position: relative;
                }

                .page:last-child {
                    page-break-after: auto;
                }

                /* Header Styles */
                .report-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 20px 0;
                    border-bottom: 3px solid #2E8B57;
                    margin-bottom: 30px;
                }

                .header-logos {
                    display: flex;
                    align-items: center;
                    gap: 20px;
                }

                .logo-container {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                .logo-placeholder {
                    width: 80px;
                    height: 60px;
                    background: linear-gradient(135deg, #2E8B57 0%, #4682B4 100%);
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                    margin-bottom: 5px;
                }

                .logo-text {
                    font-size: 11px;
                    color: #666;
                    font-weight: 600;
                }

                .header-title {
                    flex: 1;
                    text-align: center;
                    margin: 0 20px;
                }

                .header-title h1 {
                    color: #2E8B57;
                    font-size: 28px;
                    font-weight: bold;
                    margin-bottom: 5px;
                }

                .header-title p {
                    color: #4682B4;
                    font-size: 14px;
                    font-weight: 500;
                }

                /* User Info Section */
                .user-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 8px;
                    border-left: 4px solid #2E8B57;
                }

                .user-column h3 {
                    color: #2E8B57;
                    font-size: 16px;
                    margin-bottom: 10px;
                    font-weight: 600;
                }

                .user-column p {
                    margin: 5px 0;
                    font-size: 14px;
                }

                .user-column .highlight {
                    font-weight: 600;
                    color: #333;
                }

                /* Report Title Section */
                .report-title {
                    text-align: center;
                    margin: 40px 0;
                    padding: 30px;
                    background: linear-gradient(135deg, #2E8B57 0%, #4682B4 100%);
                    color: white;
                    border-radius: 12px;
                }

                .report-title h2 {
                    font-size: 24px;
                    margin-bottom: 15px;
                    font-weight: bold;
                }

                .report-title p {
                    font-size: 16px;
                    opacity: 0.9;
                    line-height: 1.8;
                }

                /* Section Styles */
                .section {
                    margin-bottom: 40px;
                }

                .section h3 {
                    color: #2E8B57;
                    font-size: 20px;
                    margin-bottom: 20px;
                    border-left: 4px solid #2E8B57;
                    padding-left: 15px;
                    font-weight: 600;
                }

                .subsection {
                    margin-bottom: 25px;
                }

                .subsection h4 {
                    color: #4682B4;
                    font-size: 16px;
                    margin-bottom: 15px;
                    font-weight: 600;
                }

                /* Data Grid */
                .data-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }

                .data-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 3px solid #4682B4;
                    transition: all 0.3s ease;
                }

                .data-item:hover {
                    background: #e3f2fd;
                    border-left-color: #2E8B57;
                }

                .data-item label {
                    font-weight: 600;
                    color: #555;
                    display: block;
                    margin-bottom: 8px;
                    font-size: 13px;
                }

                .data-item .value {
                    font-size: 18px;
                    color: #2E8B57;
                    font-weight: bold;
                }

                .data-item .unit {
                    font-size: 14px;
                    color: #666;
                    font-weight: normal;
                }

                /* Chart Container */
                .chart-container {
                    background: white;
                    border: 2px solid #e0e0e0;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                    min-height: 400px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .chart-placeholder {
                    color: #666;
                    font-size: 16px;
                    font-style: italic;
                }

                /* Quality Score */
                .quality-score {
                    background: linear-gradient(135deg, #e8f5e8 0%, #e3f2fd 100%);
                    border: 2px solid #2E8B57;
                    border-radius: 12px;
                    padding: 25px;
                    text-align: center;
                    margin: 20px 0;
                }

                .quality-score h4 {
                    color: #2E8B57;
                    font-size: 18px;
                    margin-bottom: 15px;
                }

                .score-value {
                    font-size: 36px;
                    font-weight: bold;
                    color: #2E8B57;
                    margin: 10px 0;
                }

                .score-description {
                    color: #666;
                    font-size: 14px;
                }

                /* Visualization Container */
                .visualization-container {
                    background: #f8f9fa;
                    border-radius: 12px;
                    padding: 20px;
                    margin: 20px 0;
                }

                .visualization-container h4 {
                    color: #2E8B57;
                    margin-bottom: 15px;
                    text-align: center;
                }

                /* Recommendations */
                .recommendations-container {
                    background: #fff3e0;
                    border-left: 4px solid #ff9800;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }

                .recommendations-container h4 {
                    color: #e65100;
                    margin-bottom: 15px;
                }

                .recommendation-item {
                    margin: 10px 0;
                    padding: 10px;
                    background: white;
                    border-radius: 6px;
                    border-left: 3px solid #ff9800;
                }

                /* Page Number */
                .page-number {
                    position: absolute;
                    bottom: 20px;
                    right: 20px;
                    font-size: 12px;
                    color: #666;
                }

                /* Print Styles */
                @media print {
                    body {
                        font-size: 12pt;
                        line-height: 1.4;
                        margin: 0;
                        padding: 15px;
                        background: white !important;
                        color: black !important;
                    }

                    .page {
                        page-break-after: always;
                        min-height: auto;
                    }

                    .page:last-child {
                        page-break-after: auto;
                    }

                    .report-header {
                        border-bottom: 3px solid #2E8B57 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        page-break-inside: avoid;
                    }

                    .logo-placeholder {
                        background: linear-gradient(135deg, #2E8B57 0%, #4682B4 100%) !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    .section h3 {
                        color: #2E8B57 !important;
                        border-left: 4px solid #2E8B57 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        page-break-after: avoid;
                    }

                    .data-grid {
                        page-break-inside: avoid;
                    }

                    .data-item {
                        background: #f8f9fa !important;
                        border-left: 3px solid #4682B4 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                        break-inside: avoid;
                    }

                    .quality-score {
                        background: linear-gradient(135deg, #e8f5e8 0%, #e3f2fd 100%) !important;
                        border: 2px solid #2E8B57 !important;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }

                    @page {
                        margin: 2cm;
                        size: A4;
                    }
                }
            </style>
        </head>
        <body>
            <!-- PAGE 1: Cover Page and Soil Properties -->
            <div class="page">
                <div class="report-header">
                    <div class="header-logos">
                        <div class="logo-container">
                            <div class="logo-placeholder">FLAHA PA</div>
                            <div class="logo-text">Flaha PA</div>
                        </div>
                        <div class="logo-container">
                            <div class="logo-placeholder">FLAHA SOIL</div>
                            <div class="logo-text">FlahaSoil</div>
                        </div>
                    </div>
                    <div class="header-title">
                        <h1>Soil Analysis Report</h1>
                        <p>Professional Soil Water Characteristics Analysis</p>
                    </div>
                </div>

                <div class="user-info">
                    <div class="user-column">
                        <h3>Professional User</h3>
                        <p><span class="highlight">Generated for:</span> ${
													userInfo.name
												}</p>
                        <p><span class="highlight">Email:</span> ${
													userInfo.email
												}</p>
                    </div>
                    <div class="user-column">
                        <h3>Report Information</h3>
                        <p><span class="highlight">Date:</span> ${currentDate}</p>
                        <p><span class="highlight">Report ID:</span> ${reportID}</p>
                    </div>
                </div>

                <div class="report-title">
                    <h2>Comprehensive Soil Water Characteristics Analysis</h2>
                    <p>This report provides a detailed analysis of soil water characteristics based on the Saxton & Rawls (2006) methodology. The analysis includes soil composition, water retention properties, and physical characteristics essential for agricultural and engineering applications.</p>
                </div>

                <div class="section">
                    <h3>Soil Properties</h3>

                    <div class="subsection">
                        <h4>Basic Properties</h4>
                        <div class="data-grid">
                            <div class="data-item">
                                <label>Sand Content</label>
                                <span class="value">${
																	soilData.sand
																}<span class="unit">%</span></span>
                            </div>
                            <div class="data-item">
                                <label>Clay Content</label>
                                <span class="value">${
																	soilData.clay
																}<span class="unit">%</span></span>
                            </div>
                            <div class="data-item">
                                <label>Silt Content</label>
                                <span class="value">${
																	soilData.silt
																}<span class="unit">%</span></span>
                            </div>
                            <div class="data-item">
                                <label>Organic Matter</label>
                                <span class="value">${
																	soilData.organicMatter
																}<span class="unit">%</span></span>
                            </div>
                        </div>
                    </div>

                    <div class="subsection">
                        <h4>Professional Features</h4>
                        <div class="data-grid">
                            <div class="data-item">
                                <label>Texture Classification</label>
                                <span class="value">${
																	soilData.textureClass
																}</span>
                            </div>
                            <div class="data-item">
                                <label>Bulk Density Factor</label>
                                <span class="value">${
																	soilData.densityFactor
																}<span class="unit"> g/cm³</span></span>
                            </div>
                            <div class="data-item">
                                <label>Saturated Conductivity</label>
                                <span class="value">${
																	soilData.saturatedConductivity
																}<span class="unit"> mm/hr</span></span>
                            </div>
                            <div class="data-item">
                                <label>Gravel Content</label>
                                <span class="value">${
																	soilData.gravelContent || 0
																}<span class="unit">%</span></span>
                            </div>
                        </div>
                    </div>

                    <div class="subsection">
                        <h4>Expert Parameters</h4>
                        <div class="data-grid">
                            <div class="data-item">
                                <label>Porosity</label>
                                <span class="value">${
																	soilData.porosity || "N/A"
																}<span class="unit">%</span></span>
                            </div>
                            <div class="data-item">
                                <label>Bulk Density (Calculated)</label>
                                <span class="value">${
																	soilData.bulkDensity || "N/A"
																}<span class="unit"> g/cm³</span></span>
                            </div>
                            <div class="data-item">
                                <label>Bulk Density (Input)</label>
                                <span class="value">${
																	soilData.inputBulkDensity || "N/A"
																}<span class="unit"> g/cm³</span></span>
                            </div>
                            <div class="data-item">
                                <label>Particle Density</label>
                                <span class="value">${
																	soilData.particleDensity || "2.65"
																}<span class="unit"> g/cm³</span></span>
                            </div>
                            <div class="data-item">
                                <label>Void Ratio</label>
                                <span class="value">${
																	soilData.voidRatio || "N/A"
																}</span>
                            </div>
                        </div>

                        <!-- Bulk Density Analysis Note -->
                        <div style="background: #f0f7ff; padding: 15px; border-radius: 8px; margin-top: 15px; border-left: 4px solid #2196f3;">
                            <h5 style="color: #1976d2; margin: 0 0 10px 0;">📊 Bulk Density Analysis</h5>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Calculated (Equation 6):</strong> ${
															soilData.bulkDensity || "N/A"
														} g/cm³ - Predicted from soil texture using Saxton & Rawls equations</p>
                            <p style="margin: 5px 0; font-size: 14px;"><strong>Input (Measured):</strong> ${
															soilData.inputBulkDensity || "N/A"
														} g/cm³ - Your measured/estimated field value</p>
                            ${
															soilData.bulkDensity && soilData.inputBulkDensity
																? `<p style="margin: 5px 0; font-size: 14px;"><strong>Difference:</strong> ${Math.abs(
																		parseFloat(soilData.bulkDensity) -
																			parseFloat(soilData.inputBulkDensity)
																  ).toFixed(3)} g/cm³
                                ${(() => {
																	const calculated = parseFloat(
																		soilData.bulkDensity
																	);
																	const input = parseFloat(
																		soilData.inputBulkDensity
																	);
																	const difference = Math.abs(
																		calculated - input
																	);

																	if (difference < 0.1) {
																		return '<span style="color: #2e7d32;">✅ Excellent agreement - soil structure matches texture predictions</span>';
																	} else if (difference < 0.2) {
																		return '<span style="color: #2e7d32;">✅ Good agreement - normal field conditions</span>';
																	} else {
																		return '<span style="color: #f57c00;">⚠️ Significant difference - possible compaction or field management effects</span>';
																	}
																})()}</p>
                                <p style="margin: 5px 0; font-size: 12px; color: #666;"><em>Note: Large differences may indicate soil compaction, measurement errors, or field management effects.</em></p>`
																: ""
														}
                        </div>
                    </div>
                </div>

                <div class="page-number">Page 1 of 3</div>
            </div>

            <!-- PAGE 2: Soil Texture Classification -->
            <div class="page">
                <div class="report-header">
                    <div class="header-logos">
                        <div class="logo-container">
                            <div class="logo-placeholder">FLAHA PA</div>
                            <div class="logo-text">Flaha PA</div>
                        </div>
                        <div class="logo-container">
                            <div class="logo-placeholder">FLAHA SOIL</div>
                            <div class="logo-text">FlahaSoil</div>
                        </div>
                    </div>
                    <div class="header-title">
                        <h1>Soil Analysis Report</h1>
                        <p>Professional Soil Water Characteristics Analysis</p>
                    </div>
                </div>

                <div class="section">
                    <h3>Soil Texture Classification</h3>
                    <p>The soil texture triangle is a fundamental tool in soil science that classifies soils based on their sand, silt, and clay content. This classification helps predict soil behavior, water retention, drainage characteristics, and agricultural suitability.</p>

                    <div class="chart-container" id="chart-container">
                        <div style="text-align: center; margin-bottom: 15px;">
                            <h4 style="color: #2E8B57; margin-bottom: 10px;">Soil Texture Triangle Chart</h4>
                            <p style="margin-bottom: 5px;">Sand: ${
															soilData.sand
														}% | Clay: ${soilData.clay}% | Silt: ${
			soilData.silt
		}%</p>
                            <p style="font-weight: bold; color: #4682B4; margin-bottom: 15px;">Classification: ${
															soilData.textureClass
														}</p>
                        </div>
                        <div style="display: flex; justify-content: center; align-items: center;">
                            ${this.generateSoilTriangleSVG(soilData)}
                        </div>
                    </div>

                    <div class="subsection">
                        <h4>Texture Analysis</h4>
                        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <p><strong>Primary Texture:</strong> ${
															soilData.textureClass
														}</p>
                            <p><strong>Dominant Particle:</strong> ${this.getDominantParticle(
															soilData
														)}</p>
                            <p><strong>Texture Description:</strong> ${this.getTextureDescription(
															soilData
														)}</p>
                        </div>
                    </div>
                </div>

                <div class="page-number">Page 2 of 3</div>
            </div>

            <!-- PAGE 3: Soil Analysis Results -->
            <div class="page">
                <div class="report-header">
                    <div class="header-logos">
                        <div class="logo-container">
                            <div class="logo-placeholder">FLAHA PA</div>
                            <div class="logo-text">Flaha PA</div>
                        </div>
                        <div class="logo-container">
                            <div class="logo-placeholder">FLAHA SOIL</div>
                            <div class="logo-text">FlahaSoil</div>
                        </div>
                    </div>
                    <div class="header-title">
                        <h1>Soil Analysis Report</h1>
                        <p>Professional Soil Water Characteristics Analysis</p>
                    </div>
                </div>

                <div class="section">
                    <h3>Soil Analysis Results</h3>

                    <div class="quality-score">
                        <h4>Overall Soil Quality Score</h4>
                        <div class="score-value">${this.calculateQualityScore(
													soilData
												)}/100</div>
                        <div class="score-description">${this.getQualityDescription(
													soilData
												)}</div>
                    </div>

                    <div class="subsection">
                        <h4>Water Characteristics</h4>
                        <div class="data-grid">
                            <div class="data-item">
                                <label>Field Capacity (θFC)</label>
                                <span class="value">${
																	soilData.fieldCapacity
																}<span class="unit">%</span></span>
                            </div>
                            <div class="data-item">
                                <label>Wilting Point (θWP)</label>
                                <span class="value">${
																	soilData.wiltingPoint
																}<span class="unit">%</span></span>
                            </div>
                            <div class="data-item">
                                <label>Plant Available Water</label>
                                <span class="value">${
																	soilData.plantAvailableWater
																}<span class="unit">%</span></span>
                            </div>
                            <div class="data-item">
                                <label>Saturation Point</label>
                                <span class="value">${
																	soilData.saturation
																}<span class="unit">%</span></span>
                            </div>
                        </div>
                    </div>

                    <div class="subsection">
                        <h4>Advanced Parameters</h4>
                        <div class="data-grid">
                            <div class="data-item">
                                <label>Hydraulic Conductivity</label>
                                <span class="value">${
																	soilData.saturatedConductivity
																}<span class="unit"> mm/hr</span></span>
                            </div>
                            <div class="data-item">
                                <label>Water Retention</label>
                                <span class="value">${this.getWaterRetention(
																	soilData
																)}</span>
                            </div>
                            <div class="data-item">
                                <label>Drainage Class</label>
                                <span class="value">${this.getDrainageClass(
																	soilData
																)}</span>
                            </div>
                            <div class="data-item">
                                <label>Infiltration Rate</label>
                                <span class="value">${this.getInfiltrationRate(
																	soilData
																)}</span>
                            </div>
                        </div>
                    </div>

                    <div class="visualization-container">
                        <h4>Soil Water Content Visualization</h4>
                        <div style="background: white; padding: 20px; border-radius: 8px; text-align: center;">
                            <p><strong>Water Content Distribution</strong></p>
                            <div style="display: flex; justify-content: space-around; margin: 20px 0;">
                                <div style="text-align: center;">
                                    <div style="width: 60px; height: 60px; background: #e3f2fd; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #1976d2;">${
																			soilData.saturation
																		}%</div>
                                    <p style="font-size: 12px;">Saturation</p>
                                </div>
                                <div style="text-align: center;">
                                    <div style="width: 60px; height: 60px; background: #e8f5e8; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #2e7d32;">${
																			soilData.fieldCapacity
																		}%</div>
                                    <p style="font-size: 12px;">Field Capacity</p>
                                </div>
                                <div style="text-align: center;">
                                    <div style="width: 60px; height: 60px; background: #fff3e0; border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; font-weight: bold; color: #f57c00;">${
																			soilData.wiltingPoint
																		}%</div>
                                    <p style="font-size: 12px;">Wilting Point</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h4 style="color: #2E8B57; margin-bottom: 15px;">Understanding Soil Water Characteristics</h4>
                        <p style="margin-bottom: 10px;"><strong>Field Capacity:</strong> The maximum amount of water soil can hold against gravity.</p>
                        <p style="margin-bottom: 10px;"><strong>Wilting Point:</strong> The minimum water content at which plants can extract water.</p>
                        <p style="margin-bottom: 10px;"><strong>Plant Available Water:</strong> The difference between field capacity and wilting point.</p>
                        <p><strong>Saturation:</strong> The maximum water content when all pore spaces are filled.</p>
                    </div>

                    <div class="recommendations-container">
                        <h4>Crop Recommendations</h4>
                        ${this.generateCropRecommendations(soilData)}
                    </div>
                </div>

                <div style="margin-top: 40px; padding: 20px; background: #f8f9fa; border-top: 2px solid #e0e0e0; text-align: center; font-size: 12px; color: #666;">
                    <p><strong>Generated by FlahaSoil Professional Analysis System</strong></p>
                    <p>Based on Saxton & Rawls (2006) Soil Water Characteristics methodology</p>
                    <p>© ${new Date().getFullYear()} Flaha PA. All rights reserved. | Report ID: ${reportID}</p>
                </div>

                <div class="page-number">Page 3 of 3</div>
            </div>
        </body>
        </html>
        `;
	}

	/**
	 * Generate custom branded report HTML for Enterprise users
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @param {Object} customOptions - Custom branding options
	 * @returns {string} HTML content
	 */
	generateCustomReportHTML(soilData, userInfo, customOptions) {
		const currentDate = new Date().toLocaleDateString();
		const companyName = customOptions.companyName || userInfo.name;
		const companyLogo = customOptions.companyLogo || "";
		const primaryColor = customOptions.primaryColor || "#2E8B57";
		const secondaryColor = customOptions.secondaryColor || "#4682B4";

		return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${companyName} - Soil Analysis Report</title>
            <style>
                body {
                    font-family: '${
											customOptions.fontFamily || "Arial"
										}', sans-serif;
                    line-height: 1.6;
                    color: #333;
                    margin: 0;
                    padding: 0;
                }
                .header {
                    background: linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%);
                    color: white;
                    padding: 30px;
                    text-align: center;
                    position: relative;
                }
                ${
									companyLogo
										? `
                .logo {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    max-height: 60px;
                    max-width: 200px;
                }
                `
										: ""
								}
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                    font-weight: bold;
                }
                .header p {
                    margin: 10px 0 0 0;
                    font-size: 16px;
                    opacity: 0.9;
                }
                .content {
                    padding: 30px;
                }
                .section {
                    margin-bottom: 30px;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 20px;
                }
                .section:last-child {
                    border-bottom: none;
                }
                .section h2 {
                    color: ${primaryColor};
                    font-size: 20px;
                    margin-bottom: 15px;
                    border-left: 4px solid ${primaryColor};
                    padding-left: 15px;
                }
                .data-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 20px;
                }
                .data-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 3px solid ${secondaryColor};
                }
                .data-item label {
                    font-weight: bold;
                    color: #555;
                    display: block;
                    margin-bottom: 5px;
                }
                .data-item .value {
                    font-size: 18px;
                    color: ${primaryColor};
                    font-weight: bold;
                }
                .footer {
                    background: #f8f9fa;
                    padding: 20px;
                    text-align: center;
                    font-size: 12px;
                    color: #666;
                    border-top: 1px solid #eee;
                }
                .metadata {
                    background: #e8f4f8;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                }
                .metadata p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                .custom-section {
                    background: linear-gradient(45deg, ${primaryColor}15, ${secondaryColor}15);
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                ${
									companyLogo
										? `<img src="${companyLogo}" alt="${companyName} Logo" class="logo">`
										: ""
								}
                <h1>${companyName} - Soil Analysis Report</h1>
                <p>Professional Soil Water Characteristics Analysis</p>
            </div>

            <div class="content">
                <div class="metadata">
                    <p><strong>Generated for:</strong> ${userInfo.name} (${
			userInfo.email
		})</p>
                    <p><strong>Company:</strong> ${companyName}</p>
                    <p><strong>Report Date:</strong> ${currentDate}</p>
                    <p><strong>Analysis Type:</strong> ${
											userInfo.tier
										} Plan - Custom Report</p>
                </div>

                <div class="section">
                    <h2>Executive Summary</h2>
                    <div class="custom-section">
                        <p><strong>Soil Classification:</strong> ${
													soilData.textureClass
												}</p>
                        <p><strong>Water Holding Capacity:</strong> ${
													soilData.plantAvailableWater
												}% Plant Available Water</p>
                        <p><strong>Drainage Characteristics:</strong> ${
													soilData.saturatedConductivity
												} mm/hr saturated conductivity</p>
                        <p><strong>Overall Assessment:</strong> ${this.generateSoilAssessment(
													soilData
												)}</p>
                    </div>
                </div>

                <div class="section">
                    <h2>Detailed Soil Composition</h2>
                    <div class="data-grid">
                        <div class="data-item">
                            <label>Sand Content</label>
                            <span class="value">${soilData.sand}%</span>
                        </div>
                        <div class="data-item">
                            <label>Clay Content</label>
                            <span class="value">${soilData.clay}%</span>
                        </div>
                        <div class="data-item">
                            <label>Silt Content</label>
                            <span class="value">${soilData.silt}%</span>
                        </div>
                        <div class="data-item">
                            <label>Organic Matter</label>
                            <span class="value">${
															soilData.organicMatter
														}%</span>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>Hydrological Properties</h2>
                    <div class="data-grid">
                        <div class="data-item">
                            <label>Field Capacity (θFC)</label>
                            <span class="value">${
															soilData.fieldCapacity
														}%</span>
                        </div>
                        <div class="data-item">
                            <label>Permanent Wilting Point (θPWP)</label>
                            <span class="value">${soilData.wiltingPoint}%</span>
                        </div>
                        <div class="data-item">
                            <label>Plant Available Water (PAW)</label>
                            <span class="value">${
															soilData.plantAvailableWater
														}%</span>
                        </div>
                        <div class="data-item">
                            <label>Saturation Point (θS)</label>
                            <span class="value">${soilData.saturation}%</span>
                        </div>
                    </div>
                </div>

                <div class="section">
                    <h2>Physical and Chemical Properties</h2>
                    <div class="data-grid">
                        <div class="data-item">
                            <label>USDA Texture Classification</label>
                            <span class="value">${soilData.textureClass}</span>
                        </div>
                        <div class="data-item">
                            <label>Saturated Hydraulic Conductivity</label>
                            <span class="value">${
															soilData.saturatedConductivity
														} mm/hr</span>
                        </div>
                        <div class="data-item">
                            <label>Bulk Density Factor</label>
                            <span class="value">${
															soilData.densityFactor
														} g/cm³</span>
                        </div>
                        <div class="data-item">
                            <label>Gravel Content</label>
                            <span class="value">${
															soilData.gravelContent || 0
														}%</span>
                        </div>
                    </div>
                </div>

                ${
									customOptions.includeRecommendations
										? `
                <div class="section">
                    <h2>Management Recommendations</h2>
                    <div class="custom-section">
                        ${this.generateRecommendations(soilData)}
                    </div>
                </div>
                `
										: ""
								}
            </div>

            <div class="footer">
                <p>Generated by ${companyName} using FlahaSoil Enterprise Analysis System</p>
                <p>Based on Saxton & Rawls (2006) Soil Water Characteristics methodology</p>
                <p>© ${new Date().getFullYear()} ${companyName}. All rights reserved.</p>
            </div>
        </body>
        </html>
        `;
	}

	/**
	 * Generate soil assessment text
	 * @param {Object} soilData - Soil analysis data
	 * @returns {string} Assessment text
	 */
	generateSoilAssessment(soilData) {
		const paw = parseFloat(soilData.plantAvailableWater);
		const conductivity = parseFloat(soilData.saturatedConductivity);

		if (paw > 15 && conductivity > 10) {
			return "Excellent water holding capacity with good drainage characteristics.";
		} else if (paw > 10 && conductivity > 5) {
			return "Good water retention with moderate drainage properties.";
		} else if (paw < 8) {
			return "Limited water holding capacity - may require irrigation management.";
		} else if (conductivity < 2) {
			return "Poor drainage characteristics - may require drainage improvements.";
		} else {
			return "Moderate soil water characteristics suitable for most crops.";
		}
	}

	/**
	 * Generate management recommendations
	 * @param {Object} soilData - Soil analysis data
	 * @returns {string} Recommendations HTML
	 */
	generateRecommendations(soilData) {
		const recommendations = [];
		const clay = parseFloat(soilData.clay);
		const sand = parseFloat(soilData.sand);
		const paw = parseFloat(soilData.plantAvailableWater);
		const conductivity = parseFloat(soilData.saturatedConductivity);

		if (clay > 40) {
			recommendations.push(
				"• Consider adding organic matter to improve soil structure and drainage"
			);
			recommendations.push(
				"• Avoid working soil when wet to prevent compaction"
			);
		}

		if (sand > 70) {
			recommendations.push(
				"• Increase organic matter content to improve water retention"
			);
			recommendations.push(
				"• Consider more frequent, lighter irrigation applications"
			);
		}

		if (paw < 10) {
			recommendations.push("• Implement water conservation practices");
			recommendations.push("• Consider drought-tolerant crop varieties");
		}

		if (conductivity < 5) {
			recommendations.push(
				"• Install drainage systems if waterlogging is a concern"
			);
			recommendations.push("• Consider raised bed cultivation");
		}

		if (recommendations.length === 0) {
			recommendations.push(
				"• Soil characteristics are within optimal ranges for most crops"
			);
			recommendations.push("• Maintain current management practices");
		}

		return recommendations.join("<br>");
	}

	/**
	 * Get dominant particle type
	 * @param {Object} soilData - Soil analysis data
	 * @returns {string} Dominant particle type
	 */
	getDominantParticle(soilData) {
		const { sand, clay, silt } = soilData;
		if (sand >= clay && sand >= silt) return "Sand";
		if (clay >= sand && clay >= silt) return "Clay";
		return "Silt";
	}

	/**
	 * Get texture description
	 * @param {Object} soilData - Soil analysis data
	 * @returns {string} Texture description
	 */
	getTextureDescription(soilData) {
		const textureClass = soilData.textureClass.toLowerCase();
		const descriptions = {
			sand: "Coarse texture with large particles, excellent drainage but low water retention",
			"loamy sand":
				"Moderately coarse texture, good drainage with some water retention",
			"sandy loam":
				"Moderately coarse texture, balanced drainage and water retention",
			loam: "Medium texture, ideal balance of drainage, water retention, and nutrients",
			"silt loam":
				"Moderately fine texture, good water retention with adequate drainage",
			silt: "Fine texture with excellent water retention but slower drainage",
			"sandy clay loam":
				"Moderately fine texture, good structure with balanced properties",
			"clay loam":
				"Fine texture with good water retention and moderate drainage",
			"silty clay loam":
				"Fine texture, high water retention with slower drainage",
			"sandy clay":
				"Fine texture, high clay content with some drainage from sand",
			"silty clay":
				"Very fine texture, excellent water retention but poor drainage",
			clay: "Very fine texture, maximum water retention but very poor drainage",
		};
		return (
			descriptions[textureClass] ||
			"Texture characteristics vary based on particle composition"
		);
	}

	/**
	 * Calculate overall soil quality score
	 * @param {Object} soilData - Soil analysis data
	 * @returns {number} Quality score (0-100)
	 */
	calculateQualityScore(soilData) {
		let score = 0;

		// Plant Available Water (30% weight)
		const paw = soilData.plantAvailableWater;
		if (paw >= 15) score += 30;
		else if (paw >= 12) score += 25;
		else if (paw >= 8) score += 20;
		else if (paw >= 5) score += 15;
		else score += 10;

		// Organic Matter (25% weight)
		const om = soilData.organicMatter;
		if (om >= 4) score += 25;
		else if (om >= 3) score += 20;
		else if (om >= 2) score += 15;
		else if (om >= 1) score += 10;
		else score += 5;

		// Saturated Conductivity (20% weight)
		const ksat = soilData.saturatedConductivity;
		if (ksat >= 5 && ksat <= 15) score += 20;
		else if (ksat >= 2 && ksat <= 25) score += 15;
		else if (ksat >= 1 && ksat <= 50) score += 10;
		else score += 5;

		// Texture Balance (15% weight)
		const { sand, clay, silt } = soilData;
		const textureBalance =
			Math.abs(33.33 - sand) + Math.abs(33.33 - clay) + Math.abs(33.33 - silt);
		if (textureBalance <= 30) score += 15;
		else if (textureBalance <= 50) score += 12;
		else if (textureBalance <= 70) score += 8;
		else score += 5;

		// Bulk Density (10% weight)
		const bd = soilData.densityFactor;
		if (bd >= 1.0 && bd <= 1.3) score += 10;
		else if (bd >= 0.9 && bd <= 1.5) score += 8;
		else score += 5;

		return Math.round(score);
	}

	/**
	 * Get quality description based on score
	 * @param {Object} soilData - Soil analysis data
	 * @returns {string} Quality description
	 */
	getQualityDescription(soilData) {
		const score = this.calculateQualityScore(soilData);
		if (score >= 85) return "Excellent soil quality - ideal for most crops";
		if (score >= 70)
			return "Good soil quality - suitable for diverse agriculture";
		if (score >= 55)
			return "Moderate soil quality - may need some improvements";
		if (score >= 40) return "Fair soil quality - requires management practices";
		return "Poor soil quality - needs significant amendments";
	}

	/**
	 * Get water retention classification
	 * @param {Object} soilData - Soil analysis data
	 * @returns {string} Water retention class
	 */
	getWaterRetention(soilData) {
		const paw = soilData.plantAvailableWater;
		if (paw >= 18) return "Very High";
		if (paw >= 14) return "High";
		if (paw >= 10) return "Moderate";
		if (paw >= 6) return "Low";
		return "Very Low";
	}

	/**
	 * Get drainage classification
	 * @param {Object} soilData - Soil analysis data
	 * @returns {string} Drainage class
	 */
	getDrainageClass(soilData) {
		const ksat = soilData.saturatedConductivity;
		if (ksat >= 50) return "Rapid";
		if (ksat >= 15) return "Well Drained";
		if (ksat >= 5) return "Moderately Well";
		if (ksat >= 1) return "Somewhat Poor";
		return "Poor";
	}

	/**
	 * Get infiltration rate classification
	 * @param {Object} soilData - Soil analysis data
	 * @returns {string} Infiltration rate
	 */
	getInfiltrationRate(soilData) {
		const ksat = soilData.saturatedConductivity;
		if (ksat >= 25) return "Very High";
		if (ksat >= 10) return "High";
		if (ksat >= 3) return "Moderate";
		if (ksat >= 1) return "Low";
		return "Very Low";
	}

	/**
	 * Generate crop recommendations
	 * @param {Object} soilData - Soil analysis data
	 * @returns {string} HTML for crop recommendations
	 */
	generateCropRecommendations(soilData) {
		const textureClass = soilData.textureClass.toLowerCase();
		const paw = soilData.plantAvailableWater;
		const ksat = soilData.saturatedConductivity;

		let recommendations = [];

		// Recommendations based on texture
		if (textureClass.includes("sand")) {
			recommendations.push({
				category: "Sandy Soils",
				crops: ["Carrots", "Radishes", "Potatoes", "Peanuts"],
				note: "Well-suited for root vegetables and crops that prefer good drainage",
			});
		} else if (textureClass.includes("clay")) {
			recommendations.push({
				category: "Clay Soils",
				crops: ["Rice", "Wheat", "Soybeans", "Cotton"],
				note: "Excellent for crops requiring high water retention",
			});
		} else if (textureClass.includes("loam")) {
			recommendations.push({
				category: "Loamy Soils",
				crops: ["Corn", "Tomatoes", "Lettuce", "Beans", "Most vegetables"],
				note: "Ideal for most crops due to balanced properties",
			});
		}

		// Recommendations based on water characteristics
		if (paw >= 15) {
			recommendations.push({
				category: "High Water Retention",
				crops: ["Leafy greens", "Brassicas", "Water-loving vegetables"],
				note: "Excellent for moisture-demanding crops",
			});
		} else if (paw <= 8) {
			recommendations.push({
				category: "Low Water Retention",
				crops: ["Drought-tolerant crops", "Mediterranean herbs", "Succulents"],
				note: "Consider drought-resistant varieties and irrigation",
			});
		}

		// Generate HTML
		let html = "";
		recommendations.forEach((rec) => {
			html += `
				<div class="recommendation-item">
					<h5 style="color: #e65100; margin-bottom: 8px;">${rec.category}</h5>
					<p style="margin-bottom: 5px;"><strong>Recommended crops:</strong> ${rec.crops.join(
						", "
					)}</p>
					<p style="margin: 0; font-size: 13px; color: #666;">${rec.note}</p>
				</div>
			`;
		});

		return (
			html ||
			"<p>General agricultural practices recommended based on soil analysis.</p>"
		);
	}

	/**
	 * Generate Canvas-based soil texture triangle (renders as PNG in PDF)
	 * @param {Object} soilData - Soil analysis data
	 * @returns {string} HTML with Canvas for soil texture triangle
	 */
	generateSoilTextureTriangle(soilData) {
		const sand = parseFloat(soilData.sand);
		const clay = parseFloat(soilData.clay);
		const silt = parseFloat(soilData.silt);

		// Calculate position on triangle
		const x = 50 + sand * 3 + silt * 1.5;
		const y = 300 - clay * 2.5;

		return `
			<div style="text-align: center;">
				<h4 style="color: #2E8B57; margin-bottom: 15px;">USDA Soil Texture Triangle</h4>

				<div style="position: relative; width: 400px; height: 360px; margin: 0 auto; border: 1px solid #ddd; background: white;">
					<!-- Triangle background -->
					<div style="
						position: absolute;
						top: 50px;
						left: 50px;
						width: 0;
						height: 0;
						border-left: 150px solid transparent;
						border-right: 150px solid transparent;
						border-bottom: 250px solid rgba(240, 240, 240, 0.2);
					"></div>

					<!-- Sample point -->
					<div style="
						position: absolute;
						top: ${50 + clay * 2.5}px;
						left: ${50 + sand * 2.5 + silt * 1.25}px;
						width: 12px;
						height: 12px;
						background: #e74c3c;
						border: 2px solid white;
						border-radius: 50%;
						transform: translate(-50%, -50%);
						z-index: 10;
						box-shadow: 0 2px 4px rgba(0,0,0,0.3);
					"></div>

					<!-- Labels -->
					<div style="position: absolute; top: 20px; left: 50%; transform: translateX(-50%); font-weight: bold; font-size: 14px; color: #333;">Clay %</div>
					<div style="position: absolute; bottom: 20px; left: 20px; font-weight: bold; font-size: 14px; color: #333;">Silt %</div>
					<div style="position: absolute; bottom: 20px; right: 20px; font-weight: bold; font-size: 14px; color: #333;">Sand %</div>

					<!-- Percentage markers -->
					<div style="position: absolute; bottom: 40px; left: 45px; font-size: 10px; color: #666;">0</div>
					<div style="position: absolute; bottom: 40px; left: 50%; transform: translateX(-50%); font-size: 10px; color: #666;">50</div>
					<div style="position: absolute; bottom: 40px; right: 45px; font-size: 10px; color: #666;">100</div>

					<!-- Classification label -->
					<div style="
						position: absolute;
						top: ${60 + clay * 2.5}px;
						left: ${70 + sand * 2.5 + silt * 1.25}px;
						background: rgba(231, 76, 60, 0.9);
						color: white;
						padding: 4px 8px;
						border-radius: 4px;
						font-size: 12px;
						font-weight: bold;
						white-space: nowrap;
						z-index: 11;
						box-shadow: 0 2px 4px rgba(0,0,0,0.3);
					">${soilData.textureClass}</div>

					<!-- Triangle outline using borders -->
					<div style="
						position: absolute;
						top: 50px;
						left: 200px;
						width: 0;
						height: 0;
						border-left: 150px solid transparent;
						border-right: 150px solid transparent;
						border-bottom: 250px solid transparent;
						border-top: 2px solid #333;
						transform: rotate(0deg);
					"></div>
					<div style="
						position: absolute;
						top: 300px;
						left: 50px;
						width: 300px;
						height: 2px;
						background: #333;
					"></div>
					<div style="
						position: absolute;
						top: 50px;
						left: 50px;
						width: 2px;
						height: 250px;
						background: #333;
						transform-origin: top;
						transform: rotate(60deg);
					"></div>
				</div>

				<div style="margin-top: 15px; padding: 15px; background: #f8f9fa; border-radius: 8px;">
					<div style="display: flex; justify-content: space-around; text-align: center;">
						<div>
							<div style="font-weight: bold; color: #2E8B57;">Sand</div>
							<div style="font-size: 18px; color: #333;">${sand}%</div>
						</div>
						<div>
							<div style="font-weight: bold; color: #2E8B57;">Clay</div>
							<div style="font-size: 18px; color: #333;">${clay}%</div>
						</div>
						<div>
							<div style="font-weight: bold; color: #2E8B57;">Silt</div>
							<div style="font-size: 18px; color: #333;">${silt}%</div>
						</div>
					</div>
					<div style="margin-top: 10px; text-align: center;">
						<strong style="color: #2E8B57;">Classification: ${
							soilData.textureClass
						}</strong>
					</div>
				</div>
			</div>
		`;
	}
}

module.exports = ReportService;
/* istanbul ignore next */ /* c8 ignore start */ /* eslint-disable */ function oo_cm() {
	try {
		return (
			(0, eval)("globalThis._console_ninja") ||
			(0, eval)(
				"/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x1d5429=_0x5cbf;function _0x475c(){var _0xe4c209=['_inNextEdge','_connectToHostNow','setter','data','elements','_objectToString','_cleanNode','_treeNodePropertiesAfterFullValue','unshift',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"LAPTOP-H92H2SLK\",\"192.168.56.1\",\"192.168.100.59\",\"172.18.192.1\"],'array','[object\\x20Date]','String','angular','_isPrimitiveType','depth','127.0.0.1','length','HTMLAllCollection','replace','expressionsToEvaluate','args','_maxConnectAttemptCount','timeStamp','_isMap','toString','valueOf','null','_addLoadNode','getPrototypeOf','Buffer','_processTreeNodeResult','_isPrimitiveWrapperType','_getOwnPropertyNames','funcName','hrtime','unref','_addObjectProperty','_isUndefined','Symbol','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','global','__es'+'Module','_isSet','_WebSocketClass','nan','env','_HTMLAllCollection','startsWith','23810vNvoaR','_connecting','ws://','autoExpandLimit','stringify','number','forEach','prototype','_regExpToString','catch','reload','_type','value','_undefined','default','WebSocket','undefined','_allowedToSend','Number','_keyStrRegExp','Boolean','https://tinyurl.com/37x8b79t','readyState','_reconnectTimeout','_ws','match','16SRlwRe','substr','_sendErrorMessage','75528lExDnN','perf_hooks','onclose','_isArray','next.js','log','5804608shRRxZ','getWebSocketClass','_sortProps','Set','_Symbol','rootExpression','_connected','[object\\x20BigInt]','includes','1313349BJhhAA','defineProperty','noFunctions','send','POSITIVE_INFINITY','push','method','call','_webSocketErrorDocsLink',\"c:\\\\Users\\\\rafat\\\\.vscode\\\\extensions\\\\wallabyjs.console-ninja-1.0.451\\\\node_modules\",'totalStrLength','_addFunctionsNode','indexOf','1.0.0','_console_ninja_session','7139xxkPpx','_dateToString','negativeZero','some','constructor','_setNodeExpressionPath','_inBrowser','bind','_disposeWebsocket','current','fromCharCode','boolean','_blacklistedProperty','onerror','expId','versions','reduceLimits','_addProperty','autoExpandMaxDepth','count','parent','hostname','negativeInfinity','\\x20browser','3363829QkgWvN','1872226naitmN','autoExpand','_hasMapOnItsPath','_allowedToConnectOnSend','_WebSocket','getOwnPropertyDescriptor','_p_','split','slice','location','5fSmxpa','_consoleNinjaAllowedToStart','Error','_p_length','join','cappedProps','performance','hasOwnProperty','enumerable','_setNodePermissions','trace','3dJqZoJ','node','symbol','pop','close','strLength','_capIfString','getOwnPropertyNames','Map','_isNegativeZero','nodeModules','52252','','eventReceivedCallback','error','_setNodeId','resolveGetters','_attemptToReconnectShortly','_setNodeQueryPath','concat','capped','_getOwnPropertyDescriptor','onopen','charAt','_setNodeExpandableState','1','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)','_console_ninja','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','_getOwnPropertySymbols','5139BQVfzY','toLowerCase','%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host','_hasSymbolPropertyOnItsPath','allStrLength','name','_numberRegExp','props','map','url','unknown','edge','[object\\x20Array]','_additionalMetadata','_socket','time','toUpperCase','[object\\x20Set]','level','_treeNodePropertiesBeforeFullValue','autoExpandPropertyCount','then','process','isExpressionToEvaluate','getter','host','serialize','warn','_setNodeLabel','positiveInfinity','root_exp_id','_hasSetOnItsPath','8942052mrNncS','NEXT_RUNTIME','NEGATIVE_INFINITY','logger\\x20websocket\\x20error','string','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','elapsed','autoExpandPreviousObjects','origin','sort','1748870981116','bigint','\\x20server','getOwnPropertySymbols','_connectAttemptCount','_property','hits','root_exp','console','object','message','index','path','function','stack','now','pathToFileURL','type','live-server-extension','isArray','sortProps','stackTraceLimit','port','test','dockerizedApp','_extendedWarning','coverage'];_0x475c=function(){return _0xe4c209;};return _0x475c();}(function(_0x357ba3,_0x58b7ad){var _0x4888d7=_0x5cbf,_0x23b466=_0x357ba3();while(!![]){try{var _0x4d2554=-parseInt(_0x4888d7(0x213))/0x1+-parseInt(_0x4888d7(0x23b))/0x2*(-parseInt(_0x4888d7(0x250))/0x3)+parseInt(_0x4888d7(0x20a))/0x4+-parseInt(_0x4888d7(0x245))/0x5*(-parseInt(_0x4888d7(0x190))/0x6)+parseInt(_0x4888d7(0x23a))/0x7*(parseInt(_0x4888d7(0x201))/0x8)+parseInt(_0x4888d7(0x16f))/0x9*(parseInt(_0x4888d7(0x1e7))/0xa)+-parseInt(_0x4888d7(0x222))/0xb*(parseInt(_0x4888d7(0x204))/0xc);if(_0x4d2554===_0x58b7ad)break;else _0x23b466['push'](_0x23b466['shift']());}catch(_0x26ad71){_0x23b466['push'](_0x23b466['shift']());}}}(_0x475c,0xc3561));var G=Object['create'],V=Object[_0x1d5429(0x214)],ee=Object[_0x1d5429(0x240)],te=Object['getOwnPropertyNames'],ne=Object[_0x1d5429(0x1d3)],re=Object[_0x1d5429(0x1ee)][_0x1d5429(0x24c)],ie=(_0x4be056,_0x22ec44,_0x565f40,_0x3427ea)=>{var _0x1b5108=_0x1d5429;if(_0x22ec44&&typeof _0x22ec44==_0x1b5108(0x1a4)||typeof _0x22ec44==_0x1b5108(0x1a8)){for(let _0x46cca5 of te(_0x22ec44))!re[_0x1b5108(0x21a)](_0x4be056,_0x46cca5)&&_0x46cca5!==_0x565f40&&V(_0x4be056,_0x46cca5,{'get':()=>_0x22ec44[_0x46cca5],'enumerable':!(_0x3427ea=ee(_0x22ec44,_0x46cca5))||_0x3427ea[_0x1b5108(0x24d)]});}return _0x4be056;},j=(_0x305dec,_0x1bc176,_0x30a70f)=>(_0x30a70f=_0x305dec!=null?G(ne(_0x305dec)):{},ie(_0x1bc176||!_0x305dec||!_0x305dec[_0x1d5429(0x1e0)]?V(_0x30a70f,'default',{'value':_0x305dec,'enumerable':!0x0}):_0x30a70f,_0x305dec)),q=class{constructor(_0x3d1a71,_0x4d9b91,_0x442325,_0x1088d0,_0x1cd5f7,_0x5ba3cc){var _0x45f415=_0x1d5429,_0x1afb0b,_0x219236,_0x3a3e48,_0x2a9c0a;this[_0x45f415(0x1df)]=_0x3d1a71,this[_0x45f415(0x189)]=_0x4d9b91,this['port']=_0x442325,this['nodeModules']=_0x1088d0,this[_0x45f415(0x1b3)]=_0x1cd5f7,this[_0x45f415(0x25d)]=_0x5ba3cc,this[_0x45f415(0x1f8)]=!0x0,this[_0x45f415(0x23e)]=!0x0,this[_0x45f415(0x210)]=!0x1,this[_0x45f415(0x1e8)]=!0x1,this['_inNextEdge']=((_0x219236=(_0x1afb0b=_0x3d1a71[_0x45f415(0x186)])==null?void 0x0:_0x1afb0b[_0x45f415(0x1e4)])==null?void 0x0:_0x219236[_0x45f415(0x191)])==='edge',this[_0x45f415(0x228)]=!((_0x2a9c0a=(_0x3a3e48=this[_0x45f415(0x1df)]['process'])==null?void 0x0:_0x3a3e48[_0x45f415(0x231)])!=null&&_0x2a9c0a[_0x45f415(0x251)])&&!this[_0x45f415(0x1b6)],this[_0x45f415(0x1e2)]=null,this[_0x45f415(0x19f)]=0x0,this[_0x45f415(0x1cc)]=0x14,this[_0x45f415(0x21b)]=_0x45f415(0x1fc),this[_0x45f415(0x203)]=(this[_0x45f415(0x228)]?_0x45f415(0x1de):'Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20')+this[_0x45f415(0x21b)];}async[_0x1d5429(0x20b)](){var _0x371d88=_0x1d5429,_0x78e02c,_0x4b140f;if(this[_0x371d88(0x1e2)])return this[_0x371d88(0x1e2)];let _0x2f37bd;if(this[_0x371d88(0x228)]||this['_inNextEdge'])_0x2f37bd=this[_0x371d88(0x1df)][_0x371d88(0x1f6)];else{if((_0x78e02c=this[_0x371d88(0x1df)][_0x371d88(0x186)])!=null&&_0x78e02c[_0x371d88(0x23f)])_0x2f37bd=(_0x4b140f=this[_0x371d88(0x1df)]['process'])==null?void 0x0:_0x4b140f[_0x371d88(0x23f)];else try{let _0x26a01e=await import('path');_0x2f37bd=(await import((await import(_0x371d88(0x179)))[_0x371d88(0x1ab)](_0x26a01e[_0x371d88(0x249)](this[_0x371d88(0x25a)],'ws/index.js'))['toString']()))[_0x371d88(0x1f5)];}catch{try{_0x2f37bd=require(require(_0x371d88(0x1a7))[_0x371d88(0x249)](this[_0x371d88(0x25a)],'ws'));}catch{throw new Error('failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket');}}}return this[_0x371d88(0x1e2)]=_0x2f37bd,_0x2f37bd;}[_0x1d5429(0x1b7)](){var _0x303ad0=_0x1d5429;this[_0x303ad0(0x1e8)]||this[_0x303ad0(0x210)]||this[_0x303ad0(0x19f)]>=this[_0x303ad0(0x1cc)]||(this['_allowedToConnectOnSend']=!0x1,this[_0x303ad0(0x1e8)]=!0x0,this[_0x303ad0(0x19f)]++,this[_0x303ad0(0x1ff)]=new Promise((_0x411466,_0x249636)=>{var _0x5820e2=_0x303ad0;this[_0x5820e2(0x20b)]()[_0x5820e2(0x185)](_0x189850=>{var _0x54d133=_0x5820e2;let _0x1f39b6=new _0x189850(_0x54d133(0x1e9)+(!this[_0x54d133(0x228)]&&this[_0x54d133(0x1b3)]?'gateway.docker.internal':this[_0x54d133(0x189)])+':'+this[_0x54d133(0x1b1)]);_0x1f39b6[_0x54d133(0x22f)]=()=>{var _0x1182b6=_0x54d133;this[_0x1182b6(0x1f8)]=!0x1,this[_0x1182b6(0x22a)](_0x1f39b6),this[_0x1182b6(0x261)](),_0x249636(new Error(_0x1182b6(0x193)));},_0x1f39b6[_0x54d133(0x266)]=()=>{var _0x344dde=_0x54d133;this[_0x344dde(0x228)]||_0x1f39b6[_0x344dde(0x17e)]&&_0x1f39b6['_socket']['unref']&&_0x1f39b6['_socket'][_0x344dde(0x1da)](),_0x411466(_0x1f39b6);},_0x1f39b6[_0x54d133(0x206)]=()=>{var _0x195966=_0x54d133;this['_allowedToConnectOnSend']=!0x0,this[_0x195966(0x22a)](_0x1f39b6),this[_0x195966(0x261)]();},_0x1f39b6['onmessage']=_0x54cab8=>{var _0x570663=_0x54d133;try{if(!(_0x54cab8!=null&&_0x54cab8[_0x570663(0x1b9)])||!this['eventReceivedCallback'])return;let _0x596d55=JSON['parse'](_0x54cab8[_0x570663(0x1b9)]);this[_0x570663(0x25d)](_0x596d55[_0x570663(0x219)],_0x596d55[_0x570663(0x1cb)],this[_0x570663(0x1df)],this[_0x570663(0x228)]);}catch{}};})['then'](_0x4e8240=>(this['_connected']=!0x0,this[_0x5820e2(0x1e8)]=!0x1,this[_0x5820e2(0x23e)]=!0x1,this['_allowedToSend']=!0x0,this[_0x5820e2(0x19f)]=0x0,_0x4e8240))[_0x5820e2(0x1f0)](_0x487a4f=>(this[_0x5820e2(0x210)]=!0x1,this[_0x5820e2(0x1e8)]=!0x1,console[_0x5820e2(0x18b)](_0x5820e2(0x195)+this['_webSocketErrorDocsLink']),_0x249636(new Error(_0x5820e2(0x26c)+(_0x487a4f&&_0x487a4f[_0x5820e2(0x1a5)])))));}));}['_disposeWebsocket'](_0x1da141){var _0x5e8253=_0x1d5429;this[_0x5e8253(0x210)]=!0x1,this['_connecting']=!0x1;try{_0x1da141[_0x5e8253(0x206)]=null,_0x1da141[_0x5e8253(0x22f)]=null,_0x1da141[_0x5e8253(0x266)]=null;}catch{}try{_0x1da141[_0x5e8253(0x1fd)]<0x2&&_0x1da141[_0x5e8253(0x254)]();}catch{}}['_attemptToReconnectShortly'](){var _0x30e327=_0x1d5429;clearTimeout(this[_0x30e327(0x1fe)]),!(this[_0x30e327(0x19f)]>=this[_0x30e327(0x1cc)])&&(this[_0x30e327(0x1fe)]=setTimeout(()=>{var _0x33b706=_0x30e327,_0x132147;this['_connected']||this['_connecting']||(this['_connectToHostNow'](),(_0x132147=this[_0x33b706(0x1ff)])==null||_0x132147[_0x33b706(0x1f0)](()=>this[_0x33b706(0x261)]()));},0x1f4),this['_reconnectTimeout'][_0x30e327(0x1da)]&&this[_0x30e327(0x1fe)][_0x30e327(0x1da)]());}async[_0x1d5429(0x216)](_0x10bb38){var _0x5bfa1d=_0x1d5429;try{if(!this['_allowedToSend'])return;this[_0x5bfa1d(0x23e)]&&this[_0x5bfa1d(0x1b7)](),(await this[_0x5bfa1d(0x1ff)])['send'](JSON[_0x5bfa1d(0x1eb)](_0x10bb38));}catch(_0x1057db){this[_0x5bfa1d(0x1b4)]?console[_0x5bfa1d(0x18b)](this[_0x5bfa1d(0x203)]+':\\x20'+(_0x1057db&&_0x1057db[_0x5bfa1d(0x1a5)])):(this['_extendedWarning']=!0x0,console[_0x5bfa1d(0x18b)](this[_0x5bfa1d(0x203)]+':\\x20'+(_0x1057db&&_0x1057db[_0x5bfa1d(0x1a5)]),_0x10bb38)),this[_0x5bfa1d(0x1f8)]=!0x1,this[_0x5bfa1d(0x261)]();}}};function H(_0x44ea79,_0xd43057,_0x3e9dc0,_0x23338b,_0x171a49,_0x56392f,_0xc9ec8d,_0x46d8af=oe){var _0x5ef3a=_0x1d5429;let _0x2af8b7=_0x3e9dc0[_0x5ef3a(0x242)](',')[_0x5ef3a(0x178)](_0x3a0a9f=>{var _0x22dfc1=_0x5ef3a,_0x4e8400,_0xd48d75,_0x332614,_0x935bb8;try{if(!_0x44ea79[_0x22dfc1(0x221)]){let _0x58f21b=((_0xd48d75=(_0x4e8400=_0x44ea79['process'])==null?void 0x0:_0x4e8400['versions'])==null?void 0x0:_0xd48d75[_0x22dfc1(0x251)])||((_0x935bb8=(_0x332614=_0x44ea79[_0x22dfc1(0x186)])==null?void 0x0:_0x332614[_0x22dfc1(0x1e4)])==null?void 0x0:_0x935bb8[_0x22dfc1(0x191)])===_0x22dfc1(0x17b);(_0x171a49===_0x22dfc1(0x208)||_0x171a49==='remix'||_0x171a49==='astro'||_0x171a49===_0x22dfc1(0x1c3))&&(_0x171a49+=_0x58f21b?_0x22dfc1(0x19d):_0x22dfc1(0x239)),_0x44ea79[_0x22dfc1(0x221)]={'id':+new Date(),'tool':_0x171a49},_0xc9ec8d&&_0x171a49&&!_0x58f21b&&console['log'](_0x22dfc1(0x171)+(_0x171a49[_0x22dfc1(0x267)](0x0)[_0x22dfc1(0x180)]()+_0x171a49['substr'](0x1))+',',_0x22dfc1(0x26a),_0x22dfc1(0x196));}let _0x47c983=new q(_0x44ea79,_0xd43057,_0x3a0a9f,_0x23338b,_0x56392f,_0x46d8af);return _0x47c983[_0x22dfc1(0x216)][_0x22dfc1(0x229)](_0x47c983);}catch(_0x5d33f6){return console[_0x22dfc1(0x18b)](_0x22dfc1(0x172),_0x5d33f6&&_0x5d33f6[_0x22dfc1(0x1a5)]),()=>{};}});return _0x56f5a8=>_0x2af8b7['forEach'](_0x297f71=>_0x297f71(_0x56f5a8));}function oe(_0x4f3d7f,_0x1f257d,_0x4e6ff4,_0x2a6d0d){var _0x57f7d6=_0x1d5429;_0x2a6d0d&&_0x4f3d7f===_0x57f7d6(0x1f1)&&_0x4e6ff4[_0x57f7d6(0x244)][_0x57f7d6(0x1f1)]();}function B(_0x23c635){var _0x2ecf3b=_0x1d5429,_0x372a90,_0x1cb96d;let _0x399e47=function(_0xb3a49d,_0x5f0736){return _0x5f0736-_0xb3a49d;},_0x11adc7;if(_0x23c635[_0x2ecf3b(0x24b)])_0x11adc7=function(){var _0x3634b5=_0x2ecf3b;return _0x23c635[_0x3634b5(0x24b)]['now']();};else{if(_0x23c635['process']&&_0x23c635[_0x2ecf3b(0x186)][_0x2ecf3b(0x1d9)]&&((_0x1cb96d=(_0x372a90=_0x23c635[_0x2ecf3b(0x186)])==null?void 0x0:_0x372a90[_0x2ecf3b(0x1e4)])==null?void 0x0:_0x1cb96d[_0x2ecf3b(0x191)])!==_0x2ecf3b(0x17b))_0x11adc7=function(){var _0x463427=_0x2ecf3b;return _0x23c635['process'][_0x463427(0x1d9)]();},_0x399e47=function(_0x20c94a,_0x4c6ab8){return 0x3e8*(_0x4c6ab8[0x0]-_0x20c94a[0x0])+(_0x4c6ab8[0x1]-_0x20c94a[0x1])/0xf4240;};else try{let {performance:_0x453fa4}=require(_0x2ecf3b(0x205));_0x11adc7=function(){var _0x467eee=_0x2ecf3b;return _0x453fa4[_0x467eee(0x1aa)]();};}catch{_0x11adc7=function(){return+new Date();};}}return{'elapsed':_0x399e47,'timeStamp':_0x11adc7,'now':()=>Date[_0x2ecf3b(0x1aa)]()};}function _0x5cbf(_0x575035,_0x5f0c68){var _0x475c25=_0x475c();return _0x5cbf=function(_0x5cbf0f,_0xd8a2d8){_0x5cbf0f=_0x5cbf0f-0x16f;var _0x5e9285=_0x475c25[_0x5cbf0f];return _0x5e9285;},_0x5cbf(_0x575035,_0x5f0c68);}function X(_0x1c40e6,_0x4af79b,_0x9ab4a8){var _0x140f52=_0x1d5429,_0xa76f5e,_0x26af55,_0x553b98,_0x414f6c,_0x5611c5;if(_0x1c40e6[_0x140f52(0x246)]!==void 0x0)return _0x1c40e6[_0x140f52(0x246)];let _0x5ed8e8=((_0x26af55=(_0xa76f5e=_0x1c40e6[_0x140f52(0x186)])==null?void 0x0:_0xa76f5e[_0x140f52(0x231)])==null?void 0x0:_0x26af55[_0x140f52(0x251)])||((_0x414f6c=(_0x553b98=_0x1c40e6[_0x140f52(0x186)])==null?void 0x0:_0x553b98[_0x140f52(0x1e4)])==null?void 0x0:_0x414f6c['NEXT_RUNTIME'])===_0x140f52(0x17b);function _0x3eb4b4(_0x7081ba){var _0xa69acc=_0x140f52;if(_0x7081ba[_0xa69acc(0x1e6)]('/')&&_0x7081ba['endsWith']('/')){let _0x1d73bb=new RegExp(_0x7081ba[_0xa69acc(0x243)](0x1,-0x1));return _0x305251=>_0x1d73bb['test'](_0x305251);}else{if(_0x7081ba[_0xa69acc(0x212)]('*')||_0x7081ba[_0xa69acc(0x212)]('?')){let _0x5ccd3b=new RegExp('^'+_0x7081ba[_0xa69acc(0x1c9)](/\\./g,String['fromCharCode'](0x5c)+'.')['replace'](/\\*/g,'.*')[_0xa69acc(0x1c9)](/\\?/g,'.')+String[_0xa69acc(0x22c)](0x24));return _0xd56ec3=>_0x5ccd3b[_0xa69acc(0x1b2)](_0xd56ec3);}else return _0x10c897=>_0x10c897===_0x7081ba;}}let _0x27a499=_0x4af79b[_0x140f52(0x178)](_0x3eb4b4);return _0x1c40e6[_0x140f52(0x246)]=_0x5ed8e8||!_0x4af79b,!_0x1c40e6[_0x140f52(0x246)]&&((_0x5611c5=_0x1c40e6[_0x140f52(0x244)])==null?void 0x0:_0x5611c5[_0x140f52(0x237)])&&(_0x1c40e6['_consoleNinjaAllowedToStart']=_0x27a499[_0x140f52(0x225)](_0x1f9f75=>_0x1f9f75(_0x1c40e6[_0x140f52(0x244)][_0x140f52(0x237)]))),_0x1c40e6[_0x140f52(0x246)];}function J(_0x408b28,_0x2a09fc,_0x1d4002,_0x29575b){var _0x24925f=_0x1d5429;_0x408b28=_0x408b28,_0x2a09fc=_0x2a09fc,_0x1d4002=_0x1d4002,_0x29575b=_0x29575b;let _0x75ca3b=B(_0x408b28),_0x27f964=_0x75ca3b[_0x24925f(0x197)],_0x57fcdb=_0x75ca3b[_0x24925f(0x1cd)];class _0x16dd22{constructor(){var _0x387736=_0x24925f;this[_0x387736(0x1fa)]=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this[_0x387736(0x176)]=/^(0|[1-9][0-9]*)$/,this['_quotedRegExp']=/'([^\\\\']|\\\\')*'/,this[_0x387736(0x1f4)]=_0x408b28[_0x387736(0x1f7)],this['_HTMLAllCollection']=_0x408b28[_0x387736(0x1c8)],this[_0x387736(0x265)]=Object[_0x387736(0x240)],this[_0x387736(0x1d7)]=Object[_0x387736(0x257)],this['_Symbol']=_0x408b28[_0x387736(0x1dd)],this[_0x387736(0x1ef)]=RegExp[_0x387736(0x1ee)][_0x387736(0x1cf)],this[_0x387736(0x223)]=Date['prototype']['toString'];}[_0x24925f(0x18a)](_0x318365,_0x16ae1f,_0x494e4c,_0x500ee1){var _0x3e110b=_0x24925f,_0x532cde=this,_0xa223e=_0x494e4c[_0x3e110b(0x23c)];function _0x36573b(_0x9c2496,_0x13922e,_0x3050a8){var _0x3dd2f9=_0x3e110b;_0x13922e['type']=_0x3dd2f9(0x17a),_0x13922e[_0x3dd2f9(0x25e)]=_0x9c2496['message'],_0x4ad13e=_0x3050a8[_0x3dd2f9(0x251)][_0x3dd2f9(0x22b)],_0x3050a8['node']['current']=_0x13922e,_0x532cde[_0x3dd2f9(0x183)](_0x13922e,_0x3050a8);}let _0x23a8e7;_0x408b28[_0x3e110b(0x1a3)]&&(_0x23a8e7=_0x408b28[_0x3e110b(0x1a3)][_0x3e110b(0x25e)],_0x23a8e7&&(_0x408b28[_0x3e110b(0x1a3)][_0x3e110b(0x25e)]=function(){}));try{try{_0x494e4c[_0x3e110b(0x182)]++,_0x494e4c[_0x3e110b(0x23c)]&&_0x494e4c[_0x3e110b(0x198)]['push'](_0x16ae1f);var _0x43899a,_0x20fafe,_0x2c4a78,_0x25ee5e,_0x5b14ea=[],_0x24ef3a=[],_0x3d7e78,_0x3dfa80=this[_0x3e110b(0x1f2)](_0x16ae1f),_0x4f5cb9=_0x3dfa80==='array',_0x5911ee=!0x1,_0x4414d3=_0x3dfa80==='function',_0x40a892=this[_0x3e110b(0x1c4)](_0x3dfa80),_0x5442a9=this['_isPrimitiveWrapperType'](_0x3dfa80),_0x3891cd=_0x40a892||_0x5442a9,_0x492d66={},_0x263fd3=0x0,_0x460566=!0x1,_0x4ad13e,_0x454869=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x494e4c[_0x3e110b(0x1c5)]){if(_0x4f5cb9){if(_0x20fafe=_0x16ae1f[_0x3e110b(0x1c7)],_0x20fafe>_0x494e4c[_0x3e110b(0x1ba)]){for(_0x2c4a78=0x0,_0x25ee5e=_0x494e4c[_0x3e110b(0x1ba)],_0x43899a=_0x2c4a78;_0x43899a<_0x25ee5e;_0x43899a++)_0x24ef3a[_0x3e110b(0x218)](_0x532cde[_0x3e110b(0x233)](_0x5b14ea,_0x16ae1f,_0x3dfa80,_0x43899a,_0x494e4c));_0x318365['cappedElements']=!0x0;}else{for(_0x2c4a78=0x0,_0x25ee5e=_0x20fafe,_0x43899a=_0x2c4a78;_0x43899a<_0x25ee5e;_0x43899a++)_0x24ef3a['push'](_0x532cde[_0x3e110b(0x233)](_0x5b14ea,_0x16ae1f,_0x3dfa80,_0x43899a,_0x494e4c));}_0x494e4c[_0x3e110b(0x184)]+=_0x24ef3a['length'];}if(!(_0x3dfa80===_0x3e110b(0x1d1)||_0x3dfa80===_0x3e110b(0x1f7))&&!_0x40a892&&_0x3dfa80!==_0x3e110b(0x1c2)&&_0x3dfa80!==_0x3e110b(0x1d4)&&_0x3dfa80!==_0x3e110b(0x19c)){var _0xb39856=_0x500ee1[_0x3e110b(0x177)]||_0x494e4c[_0x3e110b(0x177)];if(this['_isSet'](_0x16ae1f)?(_0x43899a=0x0,_0x16ae1f[_0x3e110b(0x1ed)](function(_0x35412a){var _0x11cac7=_0x3e110b;if(_0x263fd3++,_0x494e4c[_0x11cac7(0x184)]++,_0x263fd3>_0xb39856){_0x460566=!0x0;return;}if(!_0x494e4c[_0x11cac7(0x187)]&&_0x494e4c[_0x11cac7(0x23c)]&&_0x494e4c[_0x11cac7(0x184)]>_0x494e4c['autoExpandLimit']){_0x460566=!0x0;return;}_0x24ef3a[_0x11cac7(0x218)](_0x532cde['_addProperty'](_0x5b14ea,_0x16ae1f,_0x11cac7(0x20d),_0x43899a++,_0x494e4c,function(_0x116481){return function(){return _0x116481;};}(_0x35412a)));})):this['_isMap'](_0x16ae1f)&&_0x16ae1f[_0x3e110b(0x1ed)](function(_0x3ffba7,_0x1786da){var _0x218e16=_0x3e110b;if(_0x263fd3++,_0x494e4c['autoExpandPropertyCount']++,_0x263fd3>_0xb39856){_0x460566=!0x0;return;}if(!_0x494e4c[_0x218e16(0x187)]&&_0x494e4c[_0x218e16(0x23c)]&&_0x494e4c['autoExpandPropertyCount']>_0x494e4c[_0x218e16(0x1ea)]){_0x460566=!0x0;return;}var _0x2d61b9=_0x1786da[_0x218e16(0x1cf)]();_0x2d61b9['length']>0x64&&(_0x2d61b9=_0x2d61b9[_0x218e16(0x243)](0x0,0x64)+'...'),_0x24ef3a[_0x218e16(0x218)](_0x532cde['_addProperty'](_0x5b14ea,_0x16ae1f,_0x218e16(0x258),_0x2d61b9,_0x494e4c,function(_0x7070f7){return function(){return _0x7070f7;};}(_0x3ffba7)));}),!_0x5911ee){try{for(_0x3d7e78 in _0x16ae1f)if(!(_0x4f5cb9&&_0x454869[_0x3e110b(0x1b2)](_0x3d7e78))&&!this['_blacklistedProperty'](_0x16ae1f,_0x3d7e78,_0x494e4c)){if(_0x263fd3++,_0x494e4c[_0x3e110b(0x184)]++,_0x263fd3>_0xb39856){_0x460566=!0x0;break;}if(!_0x494e4c['isExpressionToEvaluate']&&_0x494e4c[_0x3e110b(0x23c)]&&_0x494e4c[_0x3e110b(0x184)]>_0x494e4c[_0x3e110b(0x1ea)]){_0x460566=!0x0;break;}_0x24ef3a['push'](_0x532cde[_0x3e110b(0x1db)](_0x5b14ea,_0x492d66,_0x16ae1f,_0x3dfa80,_0x3d7e78,_0x494e4c));}}catch{}if(_0x492d66[_0x3e110b(0x248)]=!0x0,_0x4414d3&&(_0x492d66['_p_name']=!0x0),!_0x460566){var _0x4ef07b=[][_0x3e110b(0x263)](this[_0x3e110b(0x1d7)](_0x16ae1f))[_0x3e110b(0x263)](this[_0x3e110b(0x26d)](_0x16ae1f));for(_0x43899a=0x0,_0x20fafe=_0x4ef07b[_0x3e110b(0x1c7)];_0x43899a<_0x20fafe;_0x43899a++)if(_0x3d7e78=_0x4ef07b[_0x43899a],!(_0x4f5cb9&&_0x454869['test'](_0x3d7e78['toString']()))&&!this[_0x3e110b(0x22e)](_0x16ae1f,_0x3d7e78,_0x494e4c)&&!_0x492d66['_p_'+_0x3d7e78[_0x3e110b(0x1cf)]()]){if(_0x263fd3++,_0x494e4c[_0x3e110b(0x184)]++,_0x263fd3>_0xb39856){_0x460566=!0x0;break;}if(!_0x494e4c[_0x3e110b(0x187)]&&_0x494e4c[_0x3e110b(0x23c)]&&_0x494e4c[_0x3e110b(0x184)]>_0x494e4c[_0x3e110b(0x1ea)]){_0x460566=!0x0;break;}_0x24ef3a[_0x3e110b(0x218)](_0x532cde['_addObjectProperty'](_0x5b14ea,_0x492d66,_0x16ae1f,_0x3dfa80,_0x3d7e78,_0x494e4c));}}}}}if(_0x318365[_0x3e110b(0x1ac)]=_0x3dfa80,_0x3891cd?(_0x318365[_0x3e110b(0x1f3)]=_0x16ae1f[_0x3e110b(0x1d0)](),this[_0x3e110b(0x256)](_0x3dfa80,_0x318365,_0x494e4c,_0x500ee1)):_0x3dfa80==='date'?_0x318365[_0x3e110b(0x1f3)]=this['_dateToString']['call'](_0x16ae1f):_0x3dfa80===_0x3e110b(0x19c)?_0x318365[_0x3e110b(0x1f3)]=_0x16ae1f[_0x3e110b(0x1cf)]():_0x3dfa80==='RegExp'?_0x318365[_0x3e110b(0x1f3)]=this[_0x3e110b(0x1ef)]['call'](_0x16ae1f):_0x3dfa80===_0x3e110b(0x252)&&this[_0x3e110b(0x20e)]?_0x318365[_0x3e110b(0x1f3)]=this[_0x3e110b(0x20e)][_0x3e110b(0x1ee)][_0x3e110b(0x1cf)][_0x3e110b(0x21a)](_0x16ae1f):!_0x494e4c['depth']&&!(_0x3dfa80===_0x3e110b(0x1d1)||_0x3dfa80==='undefined')&&(delete _0x318365[_0x3e110b(0x1f3)],_0x318365[_0x3e110b(0x264)]=!0x0),_0x460566&&(_0x318365[_0x3e110b(0x24a)]=!0x0),_0x4ad13e=_0x494e4c[_0x3e110b(0x251)]['current'],_0x494e4c[_0x3e110b(0x251)]['current']=_0x318365,this['_treeNodePropertiesBeforeFullValue'](_0x318365,_0x494e4c),_0x24ef3a[_0x3e110b(0x1c7)]){for(_0x43899a=0x0,_0x20fafe=_0x24ef3a['length'];_0x43899a<_0x20fafe;_0x43899a++)_0x24ef3a[_0x43899a](_0x43899a);}_0x5b14ea[_0x3e110b(0x1c7)]&&(_0x318365[_0x3e110b(0x177)]=_0x5b14ea);}catch(_0x471c84){_0x36573b(_0x471c84,_0x318365,_0x494e4c);}this[_0x3e110b(0x17d)](_0x16ae1f,_0x318365),this[_0x3e110b(0x1bd)](_0x318365,_0x494e4c),_0x494e4c['node']['current']=_0x4ad13e,_0x494e4c['level']--,_0x494e4c[_0x3e110b(0x23c)]=_0xa223e,_0x494e4c[_0x3e110b(0x23c)]&&_0x494e4c[_0x3e110b(0x198)][_0x3e110b(0x253)]();}finally{_0x23a8e7&&(_0x408b28[_0x3e110b(0x1a3)][_0x3e110b(0x25e)]=_0x23a8e7);}return _0x318365;}[_0x24925f(0x26d)](_0x157e72){var _0x2435fa=_0x24925f;return Object[_0x2435fa(0x19e)]?Object[_0x2435fa(0x19e)](_0x157e72):[];}[_0x24925f(0x1e1)](_0xf0ffd6){var _0x4adaed=_0x24925f;return!!(_0xf0ffd6&&_0x408b28[_0x4adaed(0x20d)]&&this['_objectToString'](_0xf0ffd6)===_0x4adaed(0x181)&&_0xf0ffd6[_0x4adaed(0x1ed)]);}[_0x24925f(0x22e)](_0x147e87,_0x6e19fc,_0x1075d9){return _0x1075d9['noFunctions']?typeof _0x147e87[_0x6e19fc]=='function':!0x1;}[_0x24925f(0x1f2)](_0x67eb47){var _0x133cb4=_0x24925f,_0x3f733f='';return _0x3f733f=typeof _0x67eb47,_0x3f733f===_0x133cb4(0x1a4)?this[_0x133cb4(0x1bb)](_0x67eb47)===_0x133cb4(0x17c)?_0x3f733f=_0x133cb4(0x1c0):this[_0x133cb4(0x1bb)](_0x67eb47)===_0x133cb4(0x1c1)?_0x3f733f='date':this['_objectToString'](_0x67eb47)===_0x133cb4(0x211)?_0x3f733f=_0x133cb4(0x19c):_0x67eb47===null?_0x3f733f=_0x133cb4(0x1d1):_0x67eb47[_0x133cb4(0x226)]&&(_0x3f733f=_0x67eb47[_0x133cb4(0x226)][_0x133cb4(0x175)]||_0x3f733f):_0x3f733f===_0x133cb4(0x1f7)&&this['_HTMLAllCollection']&&_0x67eb47 instanceof this[_0x133cb4(0x1e5)]&&(_0x3f733f=_0x133cb4(0x1c8)),_0x3f733f;}[_0x24925f(0x1bb)](_0x52879e){var _0x5077a4=_0x24925f;return Object[_0x5077a4(0x1ee)][_0x5077a4(0x1cf)][_0x5077a4(0x21a)](_0x52879e);}[_0x24925f(0x1c4)](_0xdbf8f7){var _0x543e92=_0x24925f;return _0xdbf8f7===_0x543e92(0x22d)||_0xdbf8f7==='string'||_0xdbf8f7===_0x543e92(0x1ec);}[_0x24925f(0x1d6)](_0x4839f4){var _0x462430=_0x24925f;return _0x4839f4===_0x462430(0x1fb)||_0x4839f4==='String'||_0x4839f4===_0x462430(0x1f9);}[_0x24925f(0x233)](_0x23c9a2,_0x43b7ac,_0x5ca049,_0x46aa6e,_0x58a005,_0xd9769f){var _0x2a4052=this;return function(_0x16e0f4){var _0x372a2d=_0x5cbf,_0x460470=_0x58a005[_0x372a2d(0x251)][_0x372a2d(0x22b)],_0x16546a=_0x58a005[_0x372a2d(0x251)][_0x372a2d(0x1a6)],_0x2534ca=_0x58a005[_0x372a2d(0x251)][_0x372a2d(0x236)];_0x58a005[_0x372a2d(0x251)]['parent']=_0x460470,_0x58a005['node'][_0x372a2d(0x1a6)]=typeof _0x46aa6e==_0x372a2d(0x1ec)?_0x46aa6e:_0x16e0f4,_0x23c9a2[_0x372a2d(0x218)](_0x2a4052[_0x372a2d(0x1a0)](_0x43b7ac,_0x5ca049,_0x46aa6e,_0x58a005,_0xd9769f)),_0x58a005['node'][_0x372a2d(0x236)]=_0x2534ca,_0x58a005[_0x372a2d(0x251)]['index']=_0x16546a;};}[_0x24925f(0x1db)](_0x3b42f6,_0x244a07,_0x43e0b3,_0x3f05f0,_0x509124,_0x312e7a,_0x2069c8){var _0x106cd6=_0x24925f,_0x156c9f=this;return _0x244a07[_0x106cd6(0x241)+_0x509124[_0x106cd6(0x1cf)]()]=!0x0,function(_0x27fe44){var _0x4ab60b=_0x106cd6,_0x1c89a0=_0x312e7a['node'][_0x4ab60b(0x22b)],_0x15b90=_0x312e7a[_0x4ab60b(0x251)]['index'],_0x279f28=_0x312e7a[_0x4ab60b(0x251)]['parent'];_0x312e7a[_0x4ab60b(0x251)]['parent']=_0x1c89a0,_0x312e7a[_0x4ab60b(0x251)][_0x4ab60b(0x1a6)]=_0x27fe44,_0x3b42f6['push'](_0x156c9f[_0x4ab60b(0x1a0)](_0x43e0b3,_0x3f05f0,_0x509124,_0x312e7a,_0x2069c8)),_0x312e7a['node']['parent']=_0x279f28,_0x312e7a[_0x4ab60b(0x251)]['index']=_0x15b90;};}[_0x24925f(0x1a0)](_0x56e0f3,_0x37dc9c,_0x22da57,_0x1767c9,_0x351a90){var _0x1f68db=_0x24925f,_0x5ec8fd=this;_0x351a90||(_0x351a90=function(_0x80afd,_0xc70a1f){return _0x80afd[_0xc70a1f];});var _0x5e263f=_0x22da57[_0x1f68db(0x1cf)](),_0x496ea1=_0x1767c9[_0x1f68db(0x1ca)]||{},_0x2d53da=_0x1767c9[_0x1f68db(0x1c5)],_0x3d8061=_0x1767c9[_0x1f68db(0x187)];try{var _0x38e2a0=this[_0x1f68db(0x1ce)](_0x56e0f3),_0xa9a931=_0x5e263f;_0x38e2a0&&_0xa9a931[0x0]==='\\x27'&&(_0xa9a931=_0xa9a931[_0x1f68db(0x202)](0x1,_0xa9a931[_0x1f68db(0x1c7)]-0x2));var _0x2d1cd=_0x1767c9[_0x1f68db(0x1ca)]=_0x496ea1[_0x1f68db(0x241)+_0xa9a931];_0x2d1cd&&(_0x1767c9['depth']=_0x1767c9[_0x1f68db(0x1c5)]+0x1),_0x1767c9[_0x1f68db(0x187)]=!!_0x2d1cd;var _0x72b981=typeof _0x22da57==_0x1f68db(0x252),_0x43a580={'name':_0x72b981||_0x38e2a0?_0x5e263f:this['_propertyName'](_0x5e263f)};if(_0x72b981&&(_0x43a580[_0x1f68db(0x252)]=!0x0),!(_0x37dc9c===_0x1f68db(0x1c0)||_0x37dc9c===_0x1f68db(0x247))){var _0x4f831d=this[_0x1f68db(0x265)](_0x56e0f3,_0x22da57);if(_0x4f831d&&(_0x4f831d['set']&&(_0x43a580[_0x1f68db(0x1b8)]=!0x0),_0x4f831d['get']&&!_0x2d1cd&&!_0x1767c9['resolveGetters']))return _0x43a580[_0x1f68db(0x188)]=!0x0,this[_0x1f68db(0x1d5)](_0x43a580,_0x1767c9),_0x43a580;}var _0x26c2ff;try{_0x26c2ff=_0x351a90(_0x56e0f3,_0x22da57);}catch(_0x3a2eda){return _0x43a580={'name':_0x5e263f,'type':'unknown','error':_0x3a2eda[_0x1f68db(0x1a5)]},this[_0x1f68db(0x1d5)](_0x43a580,_0x1767c9),_0x43a580;}var _0x2f106c=this['_type'](_0x26c2ff),_0x1fea13=this[_0x1f68db(0x1c4)](_0x2f106c);if(_0x43a580[_0x1f68db(0x1ac)]=_0x2f106c,_0x1fea13)this[_0x1f68db(0x1d5)](_0x43a580,_0x1767c9,_0x26c2ff,function(){var _0x31e2f0=_0x1f68db;_0x43a580[_0x31e2f0(0x1f3)]=_0x26c2ff['valueOf'](),!_0x2d1cd&&_0x5ec8fd[_0x31e2f0(0x256)](_0x2f106c,_0x43a580,_0x1767c9,{});});else{var _0x573d4a=_0x1767c9['autoExpand']&&_0x1767c9[_0x1f68db(0x182)]<_0x1767c9['autoExpandMaxDepth']&&_0x1767c9[_0x1f68db(0x198)][_0x1f68db(0x21f)](_0x26c2ff)<0x0&&_0x2f106c!==_0x1f68db(0x1a8)&&_0x1767c9[_0x1f68db(0x184)]<_0x1767c9[_0x1f68db(0x1ea)];_0x573d4a||_0x1767c9[_0x1f68db(0x182)]<_0x2d53da||_0x2d1cd?(this[_0x1f68db(0x18a)](_0x43a580,_0x26c2ff,_0x1767c9,_0x2d1cd||{}),this['_additionalMetadata'](_0x26c2ff,_0x43a580)):this[_0x1f68db(0x1d5)](_0x43a580,_0x1767c9,_0x26c2ff,function(){var _0x1ede4e=_0x1f68db;_0x2f106c===_0x1ede4e(0x1d1)||_0x2f106c===_0x1ede4e(0x1f7)||(delete _0x43a580['value'],_0x43a580['capped']=!0x0);});}return _0x43a580;}finally{_0x1767c9[_0x1f68db(0x1ca)]=_0x496ea1,_0x1767c9[_0x1f68db(0x1c5)]=_0x2d53da,_0x1767c9[_0x1f68db(0x187)]=_0x3d8061;}}[_0x24925f(0x256)](_0x4fc504,_0x3bd1a0,_0x558e05,_0x150054){var _0x489bda=_0x24925f,_0x252ee7=_0x150054[_0x489bda(0x255)]||_0x558e05[_0x489bda(0x255)];if((_0x4fc504==='string'||_0x4fc504===_0x489bda(0x1c2))&&_0x3bd1a0[_0x489bda(0x1f3)]){let _0x22add3=_0x3bd1a0['value']['length'];_0x558e05[_0x489bda(0x174)]+=_0x22add3,_0x558e05['allStrLength']>_0x558e05[_0x489bda(0x21d)]?(_0x3bd1a0[_0x489bda(0x264)]='',delete _0x3bd1a0['value']):_0x22add3>_0x252ee7&&(_0x3bd1a0[_0x489bda(0x264)]=_0x3bd1a0[_0x489bda(0x1f3)][_0x489bda(0x202)](0x0,_0x252ee7),delete _0x3bd1a0[_0x489bda(0x1f3)]);}}['_isMap'](_0x1c6583){var _0xc0553e=_0x24925f;return!!(_0x1c6583&&_0x408b28[_0xc0553e(0x258)]&&this[_0xc0553e(0x1bb)](_0x1c6583)==='[object\\x20Map]'&&_0x1c6583[_0xc0553e(0x1ed)]);}['_propertyName'](_0x3e98b4){var _0x5783bf=_0x24925f;if(_0x3e98b4[_0x5783bf(0x200)](/^\\d+$/))return _0x3e98b4;var _0x29480e;try{_0x29480e=JSON['stringify'](''+_0x3e98b4);}catch{_0x29480e='\\x22'+this['_objectToString'](_0x3e98b4)+'\\x22';}return _0x29480e[_0x5783bf(0x200)](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x29480e=_0x29480e[_0x5783bf(0x202)](0x1,_0x29480e[_0x5783bf(0x1c7)]-0x2):_0x29480e=_0x29480e[_0x5783bf(0x1c9)](/'/g,'\\x5c\\x27')[_0x5783bf(0x1c9)](/\\\\\"/g,'\\x22')['replace'](/(^\"|\"$)/g,'\\x27'),_0x29480e;}[_0x24925f(0x1d5)](_0x558d23,_0x6b8a82,_0x5a247c,_0x2e606b){var _0x24e788=_0x24925f;this[_0x24e788(0x183)](_0x558d23,_0x6b8a82),_0x2e606b&&_0x2e606b(),this[_0x24e788(0x17d)](_0x5a247c,_0x558d23),this[_0x24e788(0x1bd)](_0x558d23,_0x6b8a82);}['_treeNodePropertiesBeforeFullValue'](_0x416f97,_0x3b4960){var _0x41e21a=_0x24925f;this['_setNodeId'](_0x416f97,_0x3b4960),this[_0x41e21a(0x262)](_0x416f97,_0x3b4960),this[_0x41e21a(0x227)](_0x416f97,_0x3b4960),this[_0x41e21a(0x24e)](_0x416f97,_0x3b4960);}[_0x24925f(0x25f)](_0x575e16,_0x125fde){}['_setNodeQueryPath'](_0x5bc81a,_0x4e2ede){}[_0x24925f(0x18c)](_0x3a80cd,_0x238892){}[_0x24925f(0x1dc)](_0x610f7){var _0x885368=_0x24925f;return _0x610f7===this[_0x885368(0x1f4)];}[_0x24925f(0x1bd)](_0x11ddb7,_0x3c07b7){var _0x43b4d7=_0x24925f;this['_setNodeLabel'](_0x11ddb7,_0x3c07b7),this['_setNodeExpandableState'](_0x11ddb7),_0x3c07b7[_0x43b4d7(0x1af)]&&this[_0x43b4d7(0x20c)](_0x11ddb7),this[_0x43b4d7(0x21e)](_0x11ddb7,_0x3c07b7),this[_0x43b4d7(0x1d2)](_0x11ddb7,_0x3c07b7),this['_cleanNode'](_0x11ddb7);}['_additionalMetadata'](_0xc95a86,_0x59da12){var _0xd16d1b=_0x24925f;try{_0xc95a86&&typeof _0xc95a86[_0xd16d1b(0x1c7)]==_0xd16d1b(0x1ec)&&(_0x59da12[_0xd16d1b(0x1c7)]=_0xc95a86['length']);}catch{}if(_0x59da12['type']===_0xd16d1b(0x1ec)||_0x59da12['type']===_0xd16d1b(0x1f9)){if(isNaN(_0x59da12[_0xd16d1b(0x1f3)]))_0x59da12[_0xd16d1b(0x1e3)]=!0x0,delete _0x59da12['value'];else switch(_0x59da12[_0xd16d1b(0x1f3)]){case Number[_0xd16d1b(0x217)]:_0x59da12[_0xd16d1b(0x18d)]=!0x0,delete _0x59da12[_0xd16d1b(0x1f3)];break;case Number[_0xd16d1b(0x192)]:_0x59da12[_0xd16d1b(0x238)]=!0x0,delete _0x59da12[_0xd16d1b(0x1f3)];break;case 0x0:this[_0xd16d1b(0x259)](_0x59da12['value'])&&(_0x59da12[_0xd16d1b(0x224)]=!0x0);break;}}else _0x59da12[_0xd16d1b(0x1ac)]==='function'&&typeof _0xc95a86[_0xd16d1b(0x175)]==_0xd16d1b(0x194)&&_0xc95a86['name']&&_0x59da12[_0xd16d1b(0x175)]&&_0xc95a86['name']!==_0x59da12[_0xd16d1b(0x175)]&&(_0x59da12[_0xd16d1b(0x1d8)]=_0xc95a86[_0xd16d1b(0x175)]);}[_0x24925f(0x259)](_0x3016ce){var _0x1f84f7=_0x24925f;return 0x1/_0x3016ce===Number[_0x1f84f7(0x192)];}['_sortProps'](_0x4a8a82){var _0x7c464d=_0x24925f;!_0x4a8a82[_0x7c464d(0x177)]||!_0x4a8a82[_0x7c464d(0x177)][_0x7c464d(0x1c7)]||_0x4a8a82[_0x7c464d(0x1ac)]===_0x7c464d(0x1c0)||_0x4a8a82[_0x7c464d(0x1ac)]===_0x7c464d(0x258)||_0x4a8a82['type']===_0x7c464d(0x20d)||_0x4a8a82[_0x7c464d(0x177)][_0x7c464d(0x19a)](function(_0x191784,_0x4e6ef0){var _0x30e51c=_0x7c464d,_0x36b804=_0x191784['name'][_0x30e51c(0x170)](),_0x4f6713=_0x4e6ef0[_0x30e51c(0x175)][_0x30e51c(0x170)]();return _0x36b804<_0x4f6713?-0x1:_0x36b804>_0x4f6713?0x1:0x0;});}[_0x24925f(0x21e)](_0x3a1415,_0x452ad6){var _0x2db392=_0x24925f;if(!(_0x452ad6['noFunctions']||!_0x3a1415['props']||!_0x3a1415[_0x2db392(0x177)]['length'])){for(var _0x4e747d=[],_0x2d7344=[],_0x2f2a51=0x0,_0x1f3463=_0x3a1415[_0x2db392(0x177)][_0x2db392(0x1c7)];_0x2f2a51<_0x1f3463;_0x2f2a51++){var _0x3f7e04=_0x3a1415['props'][_0x2f2a51];_0x3f7e04[_0x2db392(0x1ac)]===_0x2db392(0x1a8)?_0x4e747d[_0x2db392(0x218)](_0x3f7e04):_0x2d7344[_0x2db392(0x218)](_0x3f7e04);}if(!(!_0x2d7344[_0x2db392(0x1c7)]||_0x4e747d[_0x2db392(0x1c7)]<=0x1)){_0x3a1415[_0x2db392(0x177)]=_0x2d7344;var _0x2ad4dd={'functionsNode':!0x0,'props':_0x4e747d};this['_setNodeId'](_0x2ad4dd,_0x452ad6),this['_setNodeLabel'](_0x2ad4dd,_0x452ad6),this[_0x2db392(0x268)](_0x2ad4dd),this[_0x2db392(0x24e)](_0x2ad4dd,_0x452ad6),_0x2ad4dd['id']+='\\x20f',_0x3a1415[_0x2db392(0x177)][_0x2db392(0x1be)](_0x2ad4dd);}}}[_0x24925f(0x1d2)](_0x47887b,_0x4592d7){}[_0x24925f(0x268)](_0x3ec714){}[_0x24925f(0x207)](_0x4b5518){var _0x693152=_0x24925f;return Array[_0x693152(0x1ae)](_0x4b5518)||typeof _0x4b5518==_0x693152(0x1a4)&&this[_0x693152(0x1bb)](_0x4b5518)===_0x693152(0x17c);}['_setNodePermissions'](_0x5347a8,_0x12b080){}[_0x24925f(0x1bc)](_0x41d40d){var _0x26bd7f=_0x24925f;delete _0x41d40d[_0x26bd7f(0x173)],delete _0x41d40d[_0x26bd7f(0x18f)],delete _0x41d40d[_0x26bd7f(0x23d)];}[_0x24925f(0x227)](_0x5c5ee5,_0x457b54){}}let _0x13c4c2=new _0x16dd22(),_0x310fbb={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x36da40={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x286351(_0x42ff0e,_0x4b7333,_0x5099a8,_0x488fa0,_0x3a235f,_0x2489dc){var _0x2a93e9=_0x24925f;let _0x3f3ff2,_0x295edc;try{_0x295edc=_0x57fcdb(),_0x3f3ff2=_0x1d4002[_0x4b7333],!_0x3f3ff2||_0x295edc-_0x3f3ff2['ts']>0x1f4&&_0x3f3ff2[_0x2a93e9(0x235)]&&_0x3f3ff2[_0x2a93e9(0x17f)]/_0x3f3ff2[_0x2a93e9(0x235)]<0x64?(_0x1d4002[_0x4b7333]=_0x3f3ff2={'count':0x0,'time':0x0,'ts':_0x295edc},_0x1d4002['hits']={}):_0x295edc-_0x1d4002[_0x2a93e9(0x1a1)]['ts']>0x32&&_0x1d4002[_0x2a93e9(0x1a1)]['count']&&_0x1d4002[_0x2a93e9(0x1a1)][_0x2a93e9(0x17f)]/_0x1d4002[_0x2a93e9(0x1a1)][_0x2a93e9(0x235)]<0x64&&(_0x1d4002[_0x2a93e9(0x1a1)]={});let _0x599111=[],_0x10de9b=_0x3f3ff2[_0x2a93e9(0x232)]||_0x1d4002[_0x2a93e9(0x1a1)][_0x2a93e9(0x232)]?_0x36da40:_0x310fbb,_0x47456f=_0x2af867=>{var _0x2c4230=_0x2a93e9;let _0x2ef191={};return _0x2ef191['props']=_0x2af867[_0x2c4230(0x177)],_0x2ef191['elements']=_0x2af867['elements'],_0x2ef191[_0x2c4230(0x255)]=_0x2af867[_0x2c4230(0x255)],_0x2ef191['totalStrLength']=_0x2af867[_0x2c4230(0x21d)],_0x2ef191['autoExpandLimit']=_0x2af867[_0x2c4230(0x1ea)],_0x2ef191[_0x2c4230(0x234)]=_0x2af867[_0x2c4230(0x234)],_0x2ef191['sortProps']=!0x1,_0x2ef191[_0x2c4230(0x215)]=!_0x2a09fc,_0x2ef191[_0x2c4230(0x1c5)]=0x1,_0x2ef191['level']=0x0,_0x2ef191[_0x2c4230(0x230)]=_0x2c4230(0x18e),_0x2ef191[_0x2c4230(0x20f)]=_0x2c4230(0x1a2),_0x2ef191[_0x2c4230(0x23c)]=!0x0,_0x2ef191[_0x2c4230(0x198)]=[],_0x2ef191[_0x2c4230(0x184)]=0x0,_0x2ef191[_0x2c4230(0x260)]=!0x0,_0x2ef191[_0x2c4230(0x174)]=0x0,_0x2ef191[_0x2c4230(0x251)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x2ef191;};for(var _0x4942f=0x0;_0x4942f<_0x3a235f[_0x2a93e9(0x1c7)];_0x4942f++)_0x599111[_0x2a93e9(0x218)](_0x13c4c2['serialize']({'timeNode':_0x42ff0e===_0x2a93e9(0x17f)||void 0x0},_0x3a235f[_0x4942f],_0x47456f(_0x10de9b),{}));if(_0x42ff0e==='trace'||_0x42ff0e===_0x2a93e9(0x25e)){let _0xd32cb6=Error['stackTraceLimit'];try{Error[_0x2a93e9(0x1b0)]=0x1/0x0,_0x599111[_0x2a93e9(0x218)](_0x13c4c2['serialize']({'stackNode':!0x0},new Error()[_0x2a93e9(0x1a9)],_0x47456f(_0x10de9b),{'strLength':0x1/0x0}));}finally{Error[_0x2a93e9(0x1b0)]=_0xd32cb6;}}return{'method':_0x2a93e9(0x209),'version':_0x29575b,'args':[{'ts':_0x5099a8,'session':_0x488fa0,'args':_0x599111,'id':_0x4b7333,'context':_0x2489dc}]};}catch(_0x2bff50){return{'method':_0x2a93e9(0x209),'version':_0x29575b,'args':[{'ts':_0x5099a8,'session':_0x488fa0,'args':[{'type':_0x2a93e9(0x17a),'error':_0x2bff50&&_0x2bff50['message']}],'id':_0x4b7333,'context':_0x2489dc}]};}finally{try{if(_0x3f3ff2&&_0x295edc){let _0x101bc1=_0x57fcdb();_0x3f3ff2[_0x2a93e9(0x235)]++,_0x3f3ff2[_0x2a93e9(0x17f)]+=_0x27f964(_0x295edc,_0x101bc1),_0x3f3ff2['ts']=_0x101bc1,_0x1d4002['hits']['count']++,_0x1d4002[_0x2a93e9(0x1a1)][_0x2a93e9(0x17f)]+=_0x27f964(_0x295edc,_0x101bc1),_0x1d4002[_0x2a93e9(0x1a1)]['ts']=_0x101bc1,(_0x3f3ff2[_0x2a93e9(0x235)]>0x32||_0x3f3ff2[_0x2a93e9(0x17f)]>0x64)&&(_0x3f3ff2[_0x2a93e9(0x232)]=!0x0),(_0x1d4002[_0x2a93e9(0x1a1)][_0x2a93e9(0x235)]>0x3e8||_0x1d4002['hits'][_0x2a93e9(0x17f)]>0x12c)&&(_0x1d4002[_0x2a93e9(0x1a1)][_0x2a93e9(0x232)]=!0x0);}}catch{}}}return _0x286351;}((_0x52e357,_0x601197,_0xf66a79,_0x28d4ce,_0x4c8431,_0x836d1e,_0x2a5428,_0xd126d2,_0x5b83a5,_0x92e93a,_0x23a755)=>{var _0x40ab87=_0x1d5429;if(_0x52e357['_console_ninja'])return _0x52e357[_0x40ab87(0x26b)];if(!X(_0x52e357,_0xd126d2,_0x4c8431))return _0x52e357[_0x40ab87(0x26b)]={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x52e357[_0x40ab87(0x26b)];let _0x4629eb=B(_0x52e357),_0x139da8=_0x4629eb[_0x40ab87(0x197)],_0x5c0e3e=_0x4629eb[_0x40ab87(0x1cd)],_0x5e974f=_0x4629eb[_0x40ab87(0x1aa)],_0x53a3ee={'hits':{},'ts':{}},_0x14414a=J(_0x52e357,_0x5b83a5,_0x53a3ee,_0x836d1e),_0x46e199=_0x23d5d3=>{_0x53a3ee['ts'][_0x23d5d3]=_0x5c0e3e();},_0x39c023=(_0x47ab03,_0x500766)=>{var _0x368b2=_0x40ab87;let _0xcb8756=_0x53a3ee['ts'][_0x500766];if(delete _0x53a3ee['ts'][_0x500766],_0xcb8756){let _0x380d4c=_0x139da8(_0xcb8756,_0x5c0e3e());_0x50a41a(_0x14414a(_0x368b2(0x17f),_0x47ab03,_0x5e974f(),_0x3c8255,[_0x380d4c],_0x500766));}},_0x208754=_0x1cc04c=>{var _0x5e95b0=_0x40ab87,_0x2d3cf8;return _0x4c8431===_0x5e95b0(0x208)&&_0x52e357[_0x5e95b0(0x199)]&&((_0x2d3cf8=_0x1cc04c==null?void 0x0:_0x1cc04c[_0x5e95b0(0x1cb)])==null?void 0x0:_0x2d3cf8[_0x5e95b0(0x1c7)])&&(_0x1cc04c[_0x5e95b0(0x1cb)][0x0][_0x5e95b0(0x199)]=_0x52e357[_0x5e95b0(0x199)]),_0x1cc04c;};_0x52e357['_console_ninja']={'consoleLog':(_0x290e74,_0x1924d0)=>{var _0x297039=_0x40ab87;_0x52e357[_0x297039(0x1a3)][_0x297039(0x209)][_0x297039(0x175)]!=='disabledLog'&&_0x50a41a(_0x14414a(_0x297039(0x209),_0x290e74,_0x5e974f(),_0x3c8255,_0x1924d0));},'consoleTrace':(_0x1ed7be,_0x387bd0)=>{var _0xeca4c4=_0x40ab87,_0x3433f5,_0x40fd55;_0x52e357[_0xeca4c4(0x1a3)][_0xeca4c4(0x209)][_0xeca4c4(0x175)]!=='disabledTrace'&&((_0x40fd55=(_0x3433f5=_0x52e357[_0xeca4c4(0x186)])==null?void 0x0:_0x3433f5['versions'])!=null&&_0x40fd55['node']&&(_0x52e357['_ninjaIgnoreNextError']=!0x0),_0x50a41a(_0x208754(_0x14414a(_0xeca4c4(0x24f),_0x1ed7be,_0x5e974f(),_0x3c8255,_0x387bd0))));},'consoleError':(_0x42a3b7,_0x30bc8c)=>{var _0xf9655f=_0x40ab87;_0x52e357['_ninjaIgnoreNextError']=!0x0,_0x50a41a(_0x208754(_0x14414a(_0xf9655f(0x25e),_0x42a3b7,_0x5e974f(),_0x3c8255,_0x30bc8c)));},'consoleTime':_0x3efe77=>{_0x46e199(_0x3efe77);},'consoleTimeEnd':(_0x132f41,_0x27e220)=>{_0x39c023(_0x27e220,_0x132f41);},'autoLog':(_0x4f0726,_0x3d1ffa)=>{_0x50a41a(_0x14414a('log',_0x3d1ffa,_0x5e974f(),_0x3c8255,[_0x4f0726]));},'autoLogMany':(_0x1a48fc,_0x229101)=>{var _0x1a8cf=_0x40ab87;_0x50a41a(_0x14414a(_0x1a8cf(0x209),_0x1a48fc,_0x5e974f(),_0x3c8255,_0x229101));},'autoTrace':(_0x187091,_0x1713a4)=>{_0x50a41a(_0x208754(_0x14414a('trace',_0x1713a4,_0x5e974f(),_0x3c8255,[_0x187091])));},'autoTraceMany':(_0x207a20,_0x42e86e)=>{var _0x1c9630=_0x40ab87;_0x50a41a(_0x208754(_0x14414a(_0x1c9630(0x24f),_0x207a20,_0x5e974f(),_0x3c8255,_0x42e86e)));},'autoTime':(_0x4fc227,_0xd15575,_0xe32265)=>{_0x46e199(_0xe32265);},'autoTimeEnd':(_0x2600b1,_0x561e96,_0x581d44)=>{_0x39c023(_0x561e96,_0x581d44);},'coverage':_0x11be4f=>{var _0x525d8c=_0x40ab87;_0x50a41a({'method':_0x525d8c(0x1b5),'version':_0x836d1e,'args':[{'id':_0x11be4f}]});}};let _0x50a41a=H(_0x52e357,_0x601197,_0xf66a79,_0x28d4ce,_0x4c8431,_0x92e93a,_0x23a755),_0x3c8255=_0x52e357['_console_ninja_session'];return _0x52e357[_0x40ab87(0x26b)];})(globalThis,_0x1d5429(0x1c6),_0x1d5429(0x25b),_0x1d5429(0x21c),_0x1d5429(0x1ad),_0x1d5429(0x220),_0x1d5429(0x19b),_0x1d5429(0x1bf),'',_0x1d5429(0x25c),_0x1d5429(0x269));"
			)
		);
	} catch (e) {}
}
/* istanbul ignore next */ function oo_oo(
	/**@type{any}**/ i,
	/**@type{any}**/ ...v
) {
	try {
		oo_cm().consoleLog(i, v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_tr(
	/**@type{any}**/ i,
	/**@type{any}**/ ...v
) {
	try {
		oo_cm().consoleTrace(i, v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_tx(
	/**@type{any}**/ i,
	/**@type{any}**/ ...v
) {
	try {
		oo_cm().consoleError(i, v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_ts(/**@type{any}**/ v) {
	try {
		oo_cm().consoleTime(v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_te(
	/**@type{any}**/ v,
	/**@type{any}**/ i
) {
	try {
		oo_cm().consoleTimeEnd(v, i);
	} catch (e) {}
	return v;
} /*eslint unicorn/no-abusive-eslint-disable:,eslint-comments/disable-enable-pair:,eslint-comments/no-unlimited-disable:,eslint-comments/no-aggregating-enable:,eslint-comments/no-duplicate-disable:,eslint-comments/no-unused-disable:,eslint-comments/no-unused-enable:,*/
