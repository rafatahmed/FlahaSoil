/**
 * Debug HTML Content Size and PDF Generation
 * Analyzes the exact HTML content being generated to find bloat sources
 * @format
 */

const ReportService = require("./src/services/reportService");
const fs = require("fs").promises;
const path = require("path");

class HTMLSizeDebugger {
	constructor() {
		this.reportService = new ReportService();
		this.testOutputDir = path.join(__dirname, "debug-outputs");
	}

	async ensureOutputDir() {
		try {
			await fs.mkdir(this.testOutputDir, { recursive: true });
		} catch (error) {
			// Directory already exists
		}
	}

	/**
	 * Analyze HTML content for size issues
	 */
	async analyzeHTMLContent() {
		console.log("🔍 HTML Content Size Analysis");
		console.log("═".repeat(50));

		await this.ensureOutputDir();

		// Sample soil data with all possible fields
		const testSoilData = {
			sand: 40,
			clay: 30,
			silt: 30,
			organicMatter: 2.5,
			bulkDensity: 1.3,
			densityFactor: 1.3,
			gravel: 5,
			gravelContent: 5,
			salinity: 0.2,
			electricalConductivity: 0.2,
			fieldCapacity: 35.1,
			wiltingPoint: 15.2,
			plantAvailableWater: 19.9,
			saturation: 45.8,
			saturatedConductivity: 25.5,
			airCapacity: 0.12,
			qualityScore: 85,
			soilQualityIndex: 85,
			textureClass: "Clay Loam",
			drainageClass: "Well Drained",
			compactionRisk: "Low",
			erosionRisk: "Moderate",
			airEntryTension: 2.1,
			lambda: 0.15,
			unsaturatedConductivity: 12.3,
			confidenceIntervals: {
				fieldCapacity: { lower: 33.5, upper: 36.7 },
				wiltingPoint: { lower: 14.1, upper: 16.3 },
			},
			rSquaredValues: {
				fieldCapacity: 0.92,
				wiltingPoint: 0.89,
			},
		};

		const testUser = {
			name: "Test User",
			email: "test@example.com",
			tier: "Professional",
		};

		try {
			console.log("📊 Generating HTML content...");
			const htmlContent = this.reportService.generateStandardReportHTML(
				testSoilData,
				testUser
			);

			console.log(`📏 Total HTML size: ${htmlContent.length} characters`);
			console.log(
				`📏 Total HTML size: ${(htmlContent.length / 1024).toFixed(2)} KB`
			);

			// Save HTML for inspection
			const htmlPath = path.join(
				this.testOutputDir,
				`size-analysis-${Date.now()}.html`
			);
			await fs.writeFile(htmlPath, htmlContent);
			console.log(`💾 HTML saved: ${htmlPath}`);

			// Analyze HTML sections
			await this.analyzeHTMLSections(htmlContent);

			// Test PDF generation with different settings
			await this.testPDFSettings(testSoilData, testUser);
		} catch (error) {
			console.error("❌ Analysis failed:", error);
		}
	}

	/**
	 * Analyze different sections of HTML
	 */
	async analyzeHTMLSections(htmlContent) {
		console.log("\n🔍 HTML Section Analysis:");

		// Split by major sections
		const sections = {
			"CSS Styles": this.extractSection(htmlContent, "<style>", "</style>"),
			"Page 1": this.extractSection(
				htmlContent,
				"<!-- PAGE 1:",
				"<!-- PAGE 2:"
			),
			"Page 2": this.extractSection(
				htmlContent,
				"<!-- PAGE 2:",
				"<!-- PAGE 3:"
			),
			"Page 3": this.extractSection(htmlContent, "<!-- PAGE 3:", "</body>"),
		};

		Object.entries(sections).forEach(([name, content]) => {
			if (content) {
				console.log(
					`   - ${name}: ${content.length} chars (${(
						content.length / 1024
					).toFixed(2)} KB)`
				);

				// Check for repeated patterns
				const lines = content.split("\n");
				const lineCount = {};
				lines.forEach((line) => {
					const trimmed = line.trim();
					if (trimmed.length > 20) {
						lineCount[trimmed] = (lineCount[trimmed] || 0) + 1;
					}
				});

				const repeatedLines = Object.entries(lineCount).filter(
					([line, count]) => count > 2
				);
				if (repeatedLines.length > 0) {
					console.log(
						`     ⚠️  Found ${repeatedLines.length} repeated patterns in ${name}`
					);
					repeatedLines.slice(0, 3).forEach(([line, count]) => {
						console.log(
							`       - "${line.substring(0, 50)}..." (${count} times)`
						);
					});
				}
			}
		});
	}

	/**
	 * Extract section between markers
	 */
	extractSection(content, startMarker, endMarker) {
		const startIndex = content.indexOf(startMarker);
		if (startIndex === -1) return null;

		const endIndex = endMarker
			? content.indexOf(endMarker, startIndex)
			: content.length;
		if (endIndex === -1) return content.substring(startIndex);

		return content.substring(startIndex, endIndex);
	}

	/**
	 * Test PDF generation with different settings
	 */
	async testPDFSettings(soilData, userInfo) {
		console.log("\n🔧 Testing PDF Generation Settings:");

		const browser = await this.reportService.initBrowser();
		const page = await browser.newPage();

		try {
			const htmlContent = this.reportService.generateStandardReportHTML(
				soilData,
				userInfo
			);
			await page.setContent(htmlContent, { waitUntil: "networkidle0" });

			// Test different PDF settings
			const settings = [
				{
					name: "Standard",
					options: {
						format: "A4",
						printBackground: true,
						margin: {
							top: "20mm",
							right: "15mm",
							bottom: "20mm",
							left: "15mm",
						},
					},
				},
				{
					name: "Compressed",
					options: {
						format: "A4",
						printBackground: false,
						margin: {
							top: "10mm",
							right: "10mm",
							bottom: "10mm",
							left: "10mm",
						},
						preferCSSPageSize: true,
					},
				},
				{
					name: "High Quality",
					options: {
						format: "A4",
						printBackground: true,
						margin: {
							top: "20mm",
							right: "15mm",
							bottom: "20mm",
							left: "15mm",
						},
						displayHeaderFooter: false,
						scale: 1.0,
					},
				},
			];

			for (const setting of settings) {
				console.log(`  📄 Testing ${setting.name} settings...`);

				const startTime = Date.now();
				const pdfBuffer = await page.pdf(setting.options);
				const endTime = Date.now();

				console.log(
					`     - Size: ${pdfBuffer.length} bytes (${(
						pdfBuffer.length /
						1024 /
						1024
					).toFixed(2)} MB)`
				);
				console.log(`     - Time: ${endTime - startTime}ms`);

				// Save PDF for comparison
				const pdfPath = path.join(
					this.testOutputDir,
					`test-${setting.name.toLowerCase()}-${Date.now()}.pdf`
				);
				await fs.writeFile(pdfPath, pdfBuffer);
				console.log(`     - Saved: ${pdfPath}`);

				// Check if size is abnormal
				if (pdfBuffer.length > 2 * 1024 * 1024) {
					// > 2MB
					console.log(
						`     ⚠️  WARNING: ${setting.name} PDF is unusually large!`
					);
				}
			}
		} finally {
			await page.close();
			await this.reportService.closeBrowser();
		}
	}
}

// Run the analysis
async function runAnalysis() {
	const htmlDebugger = new HTMLSizeDebugger();
	await htmlDebugger.analyzeHTMLContent();
	process.exit(0);
}

if (require.main === module) {
	runAnalysis().catch(console.error);
}

module.exports = HTMLSizeDebugger;
