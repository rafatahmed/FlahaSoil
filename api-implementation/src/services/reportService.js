/** @format */

const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs").promises;

class ReportService {
	constructor() {
		this.browser = null;
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
	 * Generate standard PDF report for Professional users
	 * @param {Object} soilData - Soil analysis data
	 * @param {Object} userInfo - User information
	 * @returns {Buffer} PDF buffer
	 */
	async generateStandardReport(soilData, userInfo) {
		const browser = await this.initBrowser();
		const page = await browser.newPage();

		try {
			// Generate HTML content for the report
			const htmlContent = this.generateStandardReportHTML(soilData, userInfo);

			// Set content and generate PDF
			await page.setContent(htmlContent, { waitUntil: "networkidle0" });

			const pdfBuffer = await page.pdf({
				format: "A4",
				printBackground: true,
				margin: {
					top: "20mm",
					right: "15mm",
					bottom: "20mm",
					left: "15mm",
				},
			});

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
                                <label>Bulk Density</label>
                                <span class="value">${
																	soilData.bulkDensity || "N/A"
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
                        <div class="chart-placeholder">
                            <p><strong>Soil Texture Triangle Chart</strong></p>
                            <p>Sand: ${soilData.sand}% | Clay: ${
			soilData.clay
		}% | Silt: ${soilData.silt}%</p>
                            <p><strong>Classification: ${
															soilData.textureClass
														}</strong></p>
                            <p style="margin-top: 20px; font-size: 14px; color: #888;">
                                Chart visualization would appear here in the interactive version
                            </p>
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
