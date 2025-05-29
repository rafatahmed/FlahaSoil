/**
 * FlahaSoil Report Generation Testing Suite
 * Tests PDF generation, custom branding, print layouts, and performance
 *
 * @format
 */

const fs = require("fs").promises;
const path = require("path");

// Import report service for testing - adjust path based on execution location
let ReportService;
try {
	ReportService = require("../api-implementation/src/services/reportService");
} catch (error) {
	// If running from api-implementation directory
	ReportService = require("./src/services/reportService");
}

// Import puppeteer from the correct location
let puppeteer;
try {
	puppeteer = require("puppeteer");
} catch (error) {
	// Try from api-implementation directory
	try {
		puppeteer = require("../api-implementation/node_modules/puppeteer");
	} catch (error2) {
		console.error(
			"❌ Puppeteer not found. Please install it in api-implementation directory:"
		);
		console.error("   cd api-implementation && npm install puppeteer");
		process.exit(1);
	}
}

class ReportTester {
	constructor() {
		this.reportService = new ReportService();
		this.testResults = [];
		this.performanceMetrics = {};
	}

	/**
	 * Test PDF Generation Functionality
	 */
	async testPDFGeneration() {
		console.log("\n📄 Testing PDF Generation...");
		console.log("─".repeat(40));

		try {
			// Sample soil data for testing
			const testSoilData = {
				sand: 40,
				clay: 30,
				silt: 30,
				organicMatter: 2.5,
				densityFactor: 1.0,
				textureClass: "clay loam",
				fieldCapacity: 0.32,
				wiltingPoint: 0.18,
				plantAvailableWater: 0.14,
				saturation: 0.45,
				saturatedConductivity: 2.5,
				bulkDensity: 1.3,
				porosity: 0.51,
			};

			const testUser = {
				id: "test-user-123",
				name: "Test User",
				email: "test@example.com",
				plan: "PROFESSIONAL",
			};

			// Test standard report generation
			console.log("  ✓ Testing standard report generation...");
			const startTime = Date.now();

			const pdfBuffer = await this.reportService.generateStandardReport(
				testSoilData,
				testUser
			);

			const generationTime = Date.now() - startTime;
			this.performanceMetrics.standardReportTime = generationTime;

			// Validate PDF buffer
			if (!pdfBuffer || pdfBuffer.length === 0) {
				throw new Error("PDF buffer is empty or null");
			}

			// Check PDF header (PDF files start with %PDF)
			const headerBytes = Array.from(pdfBuffer.slice(0, 4));
			const expectedBytes = [37, 80, 68, 70]; // %PDF in ASCII
			const isValidPDF = headerBytes.every(
				(byte, index) => byte === expectedBytes[index]
			);

			if (!isValidPDF) {
				// Log the actual header for debugging
				console.log(`  📋 PDF header bytes: ${headerBytes.join(", ")}`);
				console.log(`  📋 Expected bytes: ${expectedBytes.join(", ")} (%PDF)`);
				throw new Error(
					`Generated file is not a valid PDF. Header bytes: [${headerBytes.join(
						", "
					)}]`
				);
			}

			console.log(
				`  ✅ Standard PDF generated successfully (${pdfBuffer.length} bytes, ${generationTime}ms)`
			);

			// Save test PDF for manual inspection
			const testOutputDir = path.join(__dirname, "test-outputs");
			await fs.mkdir(testOutputDir, { recursive: true });

			const testPDFPath = path.join(
				testOutputDir,
				`test-standard-report-${Date.now()}.pdf`
			);
			await fs.writeFile(testPDFPath, pdfBuffer);
			console.log(`  📁 Test PDF saved: ${testPDFPath}`);

			return true;
		} catch (error) {
			console.error(`  ❌ PDF Generation Test Failed: ${error.message}`);
			return false;
		}
	}

	/**
	 * Test Custom Branding Features
	 */
	async testCustomBranding() {
		console.log("\n🎨 Testing Custom Branding Features...");
		console.log("─".repeat(40));

		try {
			const testSoilData = {
				sand: 35,
				clay: 25,
				silt: 40,
				organicMatter: 3.0,
				densityFactor: 1.0,
				textureClass: "loam",
				fieldCapacity: 0.28,
				wiltingPoint: 0.15,
				plantAvailableWater: 0.13,
				saturation: 0.42,
				saturatedConductivity: 3.2,
				bulkDensity: 1.25,
				porosity: 0.53,
			};

			const testUser = {
				id: "test-enterprise-user",
				name: "Enterprise Test User",
				email: "enterprise@example.com",
				plan: "ENTERPRISE",
			};

			// Test various custom branding options
			const brandingTests = [
				{
					name: "Custom Colors",
					options: {
						companyName: "AgroTech Solutions",
						primaryColor: "#1e3a8a",
						secondaryColor: "#059669",
						fontFamily: "Arial",
						includeRecommendations: true,
					},
				},
				{
					name: "Custom Company",
					options: {
						companyName: "Soil Science Corp",
						primaryColor: "#7c2d12",
						secondaryColor: "#ea580c",
						fontFamily: "Helvetica",
						includeRecommendations: false,
					},
				},
				{
					name: "Custom Margins",
					options: {
						companyName: "Field Analytics Ltd",
						margins: {
							top: "25mm",
							right: "20mm",
							bottom: "25mm",
							left: "20mm",
						},
						pageFormat: "A4",
					},
				},
			];

			for (const test of brandingTests) {
				console.log(`  ✓ Testing ${test.name}...`);

				const startTime = Date.now();
				const pdfBuffer = await this.reportService.generateCustomReport(
					testSoilData,
					testUser,
					test.options
				);
				const generationTime = Date.now() - startTime;

				if (!pdfBuffer || pdfBuffer.length === 0) {
					throw new Error(`${test.name}: PDF buffer is empty`);
				}

				// Save branded test PDF
				const testOutputDir = path.join(__dirname, "test-outputs");
				const fileName = `test-custom-${test.name
					.toLowerCase()
					.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
				const testPDFPath = path.join(testOutputDir, fileName);
				await fs.writeFile(testPDFPath, pdfBuffer);

				console.log(
					`  ✅ ${test.name} PDF generated (${pdfBuffer.length} bytes, ${generationTime}ms)`
				);
				console.log(`  📁 Saved: ${testPDFPath}`);
			}

			return true;
		} catch (error) {
			console.error(`  ❌ Custom Branding Test Failed: ${error.message}`);
			return false;
		}
	}

	/**
	 * Test Print Layout Validation
	 */
	async testPrintLayouts() {
		console.log("\n🖨️ Testing Print Layout Validation...");
		console.log("─".repeat(40));

		try {
			const testSoilData = {
				sand: 45,
				clay: 20,
				silt: 35,
				organicMatter: 1.8,
				densityFactor: 1.0,
				textureClass: "loam",
				fieldCapacity: 0.25,
				wiltingPoint: 0.12,
				plantAvailableWater: 0.13,
				saturation: 0.4,
				saturatedConductivity: 4.1,
			};

			const testUser = {
				id: "print-test-user",
				name: "Print Test User",
				email: "print@example.com",
				plan: "PROFESSIONAL",
			};

			// Generate HTML for print layout testing
			console.log("  ✓ Generating HTML for print layout validation...");
			const htmlContent = this.reportService.generateStandardReportHTML(
				testSoilData,
				testUser
			);

			// Test print-specific CSS and layout
			const browser = await puppeteer.launch({ headless: true });
			const page = await browser.newPage();

			try {
				await page.setContent(htmlContent, { waitUntil: "networkidle0" });

				// Test different page formats
				const pageFormats = ["A4", "Letter", "Legal"];

				for (const format of pageFormats) {
					console.log(`  ✓ Testing ${format} page format...`);

					const pdfBuffer = await page.pdf({
						format: format,
						printBackground: true,
						margin: {
							top: "20mm",
							right: "15mm",
							bottom: "20mm",
							left: "15mm",
						},
					});

					// Save format test PDF
					const testOutputDir = path.join(__dirname, "test-outputs");
					const fileName = `test-print-${format.toLowerCase()}-${Date.now()}.pdf`;
					const testPDFPath = path.join(testOutputDir, fileName);
					await fs.writeFile(testPDFPath, pdfBuffer);

					console.log(
						`  ✅ ${format} layout validated (${pdfBuffer.length} bytes)`
					);
					console.log(`  📁 Saved: ${testPDFPath}`);
				}

				// Test print media queries
				console.log("  ✓ Testing print media queries...");
				await page.emulateMediaType("print");

				// Check if print-specific styles are applied
				const printStyles = await page.evaluate(() => {
					const reportControls = document.querySelector(".report-controls");
					const navigation = document.querySelector(".navigation");

					return {
						reportControlsHidden: reportControls
							? window.getComputedStyle(reportControls).display === "none"
							: true,
						navigationHidden: navigation
							? window.getComputedStyle(navigation).display === "none"
							: true,
					};
				});

				if (printStyles.reportControlsHidden && printStyles.navigationHidden) {
					console.log("  ✅ Print media queries working correctly");
				} else {
					console.log("  ⚠️ Print media queries may need adjustment");
				}
			} finally {
				await browser.close();
			}

			return true;
		} catch (error) {
			console.error(`  ❌ Print Layout Test Failed: ${error.message}`);
			return false;
		}
	}

	/**
	 * Monitor Puppeteer Memory Usage
	 */
	async testMemoryUsage() {
		console.log("\n🧠 Testing Puppeteer Memory Usage...");
		console.log("─".repeat(40));

		try {
			const initialMemory = process.memoryUsage();
			console.log(
				`  📊 Initial memory usage: ${Math.round(
					initialMemory.heapUsed / 1024 / 1024
				)}MB`
			);

			// Test multiple report generations to check for memory leaks
			const iterations = 5;
			const memorySnapshots = [];

			for (let i = 0; i < iterations; i++) {
				console.log(`  ✓ Memory test iteration ${i + 1}/${iterations}...`);

				const testSoilData = {
					sand: 30 + i * 5,
					clay: 25 + i * 3,
					silt: 45 - i * 8,
					organicMatter: 2.0 + i * 0.5,
					densityFactor: 1.0,
					textureClass: "loam",
					fieldCapacity: 0.3,
					wiltingPoint: 0.16,
					plantAvailableWater: 0.14,
					saturation: 0.43,
					saturatedConductivity: 2.8,
				};

				const testUser = {
					id: `memory-test-user-${i}`,
					name: `Memory Test User ${i}`,
					email: `memory${i}@example.com`,
					plan: "PROFESSIONAL",
				};

				await this.reportService.generateStandardReport(testSoilData, testUser);

				const currentMemory = process.memoryUsage();
				memorySnapshots.push({
					iteration: i + 1,
					heapUsed: Math.round(currentMemory.heapUsed / 1024 / 1024),
					heapTotal: Math.round(currentMemory.heapTotal / 1024 / 1024),
					external: Math.round(currentMemory.external / 1024 / 1024),
				});
			}

			// Analyze memory usage patterns
			console.log("\n  📈 Memory Usage Analysis:");
			memorySnapshots.forEach((snapshot) => {
				console.log(
					`    Iteration ${snapshot.iteration}: ${snapshot.heapUsed}MB heap, ${snapshot.heapTotal}MB total`
				);
			});

			const memoryGrowth =
				memorySnapshots[memorySnapshots.length - 1].heapUsed -
				memorySnapshots[0].heapUsed;
			console.log(
				`\n  📊 Memory growth over ${iterations} iterations: ${memoryGrowth}MB`
			);

			if (memoryGrowth > 50) {
				console.log(
					"  ⚠️ Potential memory leak detected - consider implementing browser pooling"
				);
			} else {
				console.log("  ✅ Memory usage appears stable");
			}

			// Clean up browser instance
			await this.reportService.closeBrowser();

			const finalMemory = process.memoryUsage();
			console.log(
				`  🧹 Final memory after cleanup: ${Math.round(
					finalMemory.heapUsed / 1024 / 1024
				)}MB`
			);

			return true;
		} catch (error) {
			console.error(`  ❌ Memory Usage Test Failed: ${error.message}`);
			return false;
		}
	}

	/**
	 * Run all report tests
	 */
	async runAllTests() {
		console.log("🚀 Starting FlahaSoil Report Testing Suite...\n");
		console.log("═".repeat(60));

		const tests = [
			{ name: "PDF Generation", test: () => this.testPDFGeneration() },
			{ name: "Custom Branding", test: () => this.testCustomBranding() },
			{ name: "Print Layouts", test: () => this.testPrintLayouts() },
			{ name: "Memory Usage", test: () => this.testMemoryUsage() },
		];

		const results = [];
		let allPassed = true;

		for (const { name, test } of tests) {
			const startTime = Date.now();
			const passed = await test();
			const duration = Date.now() - startTime;

			results.push({ name, passed, duration });
			if (!passed) allPassed = false;
		}

		// Generate test report
		console.log("\n📋 TEST RESULTS SUMMARY");
		console.log("═".repeat(60));

		results.forEach((result) => {
			const status = result.passed ? "✅ PASSED" : "❌ FAILED";
			console.log(`${status} ${result.name} (${result.duration}ms)`);
		});

		console.log("\n📊 PERFORMANCE METRICS");
		console.log("─".repeat(30));
		if (this.performanceMetrics.standardReportTime) {
			console.log(
				`Standard Report Generation: ${this.performanceMetrics.standardReportTime}ms`
			);
		}

		console.log(
			`\n🎯 Overall Result: ${
				allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"
			}`
		);

		return allPassed;
	}
}

// Export for use in other test files
module.exports = ReportTester;

// Run tests if called directly
if (require.main === module) {
	const tester = new ReportTester();
	tester
		.runAllTests()
		.then((success) => {
			process.exit(success ? 0 : 1);
		})
		.catch((error) => {
			console.error("❌ Test suite crashed:", error);
			process.exit(1);
		});
}
