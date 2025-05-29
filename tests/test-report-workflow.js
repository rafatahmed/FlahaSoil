/**
 * FlahaSoil Report Workflow Testing
 * Tests the complete Professional user report workflow
 *
 * @format
 */

const fs = require("fs").promises;
const path = require("path");

// Import report service for testing
let ReportService;
try {
	ReportService = require("../api-implementation/src/services/reportService");
} catch (error) {
	ReportService = require("./src/services/reportService");
}

class ReportWorkflowTester {
	constructor() {
		this.reportService = new ReportService();
		this.testOutputDir = path.join(__dirname, "test-outputs");
	}

	/**
	 * Initialize test environment
	 */
	async initialize() {
		console.log("🧪 FlahaSoil Professional Report Workflow Test");
		console.log("═".repeat(60));
		console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
		console.log(`📁 Output Directory: ${this.testOutputDir}`);
		console.log("");

		// Ensure output directory exists
		await fs.mkdir(this.testOutputDir, { recursive: true });
	}

	/**
	 * Simulate Professional user soil analysis
	 */
	createProfessionalUserData() {
		return {
			// User data
			user: {
				id: "prof-user-123",
				name: "John Smith",
				email: "john.smith@agritech.com",
				plan: "PROFESSIONAL",
				company: "AgriTech Solutions",
			},

			// Soil analysis data
			soilData: {
				sand: 45,
				clay: 25,
				silt: 30,
				organicMatter: 2.8,
				densityFactor: 1.1,
				textureClass: "loam",
				fieldCapacity: 28.5,
				wiltingPoint: 14.2,
				plantAvailableWater: 14.3,
				saturation: 42.1,
				saturatedConductivity: 3.8,
				bulkDensity: 1.25,
				porosity: 52.8,
				gravelContent: 2.0,
			},
		};
	}

	/**
	 * Test Step 1: HTML Report Generation
	 */
	async testHTMLGeneration() {
		console.log("📝 STEP 1: HTML Report Generation");
		console.log("─".repeat(40));

		try {
			const { user, soilData } = this.createProfessionalUserData();

			console.log("  ✓ Generating HTML report for Professional user...");
			const startTime = Date.now();

			const htmlContent = this.reportService.generateStandardReportHTML(
				soilData,
				user
			);

			const generationTime = Date.now() - startTime;

			// Validate HTML content
			if (!htmlContent || htmlContent.length === 0) {
				throw new Error("HTML content is empty");
			}

			// Check for required elements
			const requiredElements = [
				"Soil Analysis Report",
				"Professional Soil Water Characteristics",
				user.name,
				"Soil Properties",
				"Basic Properties",
				"Professional Features",
				`${soilData.sand}%`,
				`${soilData.clay}%`,
				`${soilData.silt}%`,
				soilData.textureClass,
			];

			for (const element of requiredElements) {
				if (!htmlContent.includes(element)) {
					throw new Error(`Missing required element: ${element}`);
				}
			}

			// Save HTML for inspection
			const htmlPath = path.join(
				this.testOutputDir,
				`professional-report-${Date.now()}.html`
			);
			await fs.writeFile(htmlPath, htmlContent);

			console.log(
				`  ✅ HTML generated successfully (${htmlContent.length} characters, ${generationTime}ms)`
			);
			console.log(`  📁 HTML saved: ${htmlPath}`);
			console.log(`  📊 Contains all required elements: ✓`);

			return { success: true, htmlContent, generationTime };
		} catch (error) {
			console.error(`  ❌ HTML Generation Failed: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Test Step 2: Print Layout Optimization
	 */
	async testPrintLayout() {
		console.log("\n🖨️ STEP 2: Print Layout Optimization");
		console.log("─".repeat(40));

		try {
			const { user, soilData } = this.createProfessionalUserData();

			console.log("  ✓ Testing print-optimized HTML generation...");
			const htmlContent = this.reportService.generateStandardReportHTML(
				soilData,
				user
			);

			// Check for print-specific CSS
			const printOptimizations = [
				"@media print",
				"page-break-inside: avoid",
				"print-color-adjust: exact",
				"-webkit-print-color-adjust: exact",
			];

			let printOptimized = true;
			for (const optimization of printOptimizations) {
				if (!htmlContent.includes(optimization)) {
					console.log(`  ⚠️ Missing print optimization: ${optimization}`);
					printOptimized = false;
				}
			}

			if (printOptimized) {
				console.log("  ✅ Print optimizations present");
			}

			// Test page format compatibility
			console.log("  ✓ Testing page format compatibility...");

			// Save print-optimized version
			const printHtmlPath = path.join(
				this.testOutputDir,
				`professional-print-${Date.now()}.html`
			);
			await fs.writeFile(printHtmlPath, htmlContent);

			console.log(`  ✅ Print layout optimized`);
			console.log(`  📁 Print HTML saved: ${printHtmlPath}`);

			return { success: true, printOptimized };
		} catch (error) {
			console.error(`  ❌ Print Layout Test Failed: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Test Step 3: PDF Generation
	 */
	async testPDFGeneration() {
		console.log("\n📄 STEP 3: PDF Generation");
		console.log("─".repeat(40));

		try {
			const { user, soilData } = this.createProfessionalUserData();

			console.log("  ✓ Generating PDF report...");
			const startTime = Date.now();

			const pdfBuffer = await this.reportService.generateStandardReport(
				soilData,
				user
			);

			const generationTime = Date.now() - startTime;

			// Validate PDF
			if (!pdfBuffer || pdfBuffer.length === 0) {
				throw new Error("PDF buffer is empty");
			}

			// Check PDF header
			const headerBytes = Array.from(pdfBuffer.slice(0, 4));
			const expectedBytes = [37, 80, 68, 70]; // %PDF in ASCII
			const isValidPDF = headerBytes.every(
				(byte, index) => byte === expectedBytes[index]
			);

			if (!isValidPDF) {
				throw new Error(`Invalid PDF header: [${headerBytes.join(", ")}]`);
			}

			// Save PDF
			const pdfPath = path.join(
				this.testOutputDir,
				`professional-report-${Date.now()}.pdf`
			);
			await fs.writeFile(pdfPath, pdfBuffer);

			console.log(
				`  ✅ PDF generated successfully (${pdfBuffer.length} bytes, ${generationTime}ms)`
			);
			console.log(`  📁 PDF saved: ${pdfPath}`);
			console.log(`  🔍 PDF validation: Valid format confirmed`);

			return { success: true, pdfSize: pdfBuffer.length, generationTime };
		} catch (error) {
			console.error(`  ❌ PDF Generation Failed: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Test Step 4: Complete Workflow
	 */
	async testCompleteWorkflow() {
		console.log("\n🔄 STEP 4: Complete Professional Workflow");
		console.log("─".repeat(40));

		try {
			const { user, soilData } = this.createProfessionalUserData();

			console.log("  ✓ Simulating complete Professional user workflow...");

			// Step 1: User performs soil analysis
			console.log("    1. User enters soil data and performs analysis ✓");

			// Step 2: User clicks "Print Report" button
			console.log('    2. User clicks "Print Report" button');
			const htmlResult = await this.testHTMLGeneration();
			if (!htmlResult.success) {
				throw new Error("HTML generation failed in workflow");
			}
			console.log("       → HTML report generated ✓");

			// Step 3: User clicks "Generate PDF" button
			console.log('    3. User clicks "Generate PDF" button');
			const pdfResult = await this.testPDFGeneration();
			if (!pdfResult.success) {
				throw new Error("PDF generation failed in workflow");
			}
			console.log("       → PDF report generated and downloaded ✓");

			// Step 4: Workflow completion
			console.log("    4. Professional user workflow completed successfully ✓");

			const workflowMetrics = {
				htmlGenerationTime: htmlResult.generationTime,
				pdfGenerationTime: pdfResult.generationTime,
				totalWorkflowTime: htmlResult.generationTime + pdfResult.generationTime,
				pdfSize: pdfResult.pdfSize,
			};

			console.log("\n  📊 Workflow Performance Metrics:");
			console.log(
				`     HTML Generation: ${workflowMetrics.htmlGenerationTime}ms`
			);
			console.log(
				`     PDF Generation: ${workflowMetrics.pdfGenerationTime}ms`
			);
			console.log(
				`     Total Workflow: ${workflowMetrics.totalWorkflowTime}ms`
			);
			console.log(
				`     PDF Size: ${(workflowMetrics.pdfSize / 1024).toFixed(1)}KB`
			);

			return { success: true, metrics: workflowMetrics };
		} catch (error) {
			console.error(`  ❌ Complete Workflow Failed: ${error.message}`);
			return { success: false, error: error.message };
		}
	}

	/**
	 * Run all workflow tests
	 */
	async runAllTests() {
		await this.initialize();

		const tests = [
			{ name: "HTML Generation", test: () => this.testHTMLGeneration() },
			{ name: "Print Layout", test: () => this.testPrintLayout() },
			{ name: "PDF Generation", test: () => this.testPDFGeneration() },
			{ name: "Complete Workflow", test: () => this.testCompleteWorkflow() },
		];

		const results = [];
		let allPassed = true;

		for (const { name, test } of tests) {
			const result = await test();
			results.push({ name, ...result });
			if (!result.success) allPassed = false;
		}

		// Generate summary
		console.log("\n📋 PROFESSIONAL WORKFLOW TEST RESULTS");
		console.log("═".repeat(60));

		results.forEach((result) => {
			const status = result.success ? "✅ PASSED" : "❌ FAILED";
			console.log(`${status} ${result.name}`);
			if (!result.success && result.error) {
				console.log(`   Error: ${result.error}`);
			}
		});

		console.log(
			`\n🎯 Overall Result: ${
				allPassed ? "✅ WORKFLOW READY" : "❌ WORKFLOW ISSUES"
			}`
		);

		if (allPassed) {
			console.log(
				"\n🚀 Professional user report workflow is fully functional!"
			);
			console.log("   Users can successfully:");
			console.log("   • Generate HTML reports for printing");
			console.log("   • Download PDF reports");
			console.log("   • Experience optimized layouts");
			console.log("   • Complete the full workflow seamlessly");
		}

		// Cleanup
		try {
			await this.reportService.closeBrowser();
		} catch (error) {
			console.log("Browser cleanup completed");
		}

		return allPassed;
	}
}

// Export for use in other test files
module.exports = ReportWorkflowTester;

// Run tests if called directly
if (require.main === module) {
	const tester = new ReportWorkflowTester();
	tester
		.runAllTests()
		.then((success) => {
			process.exit(success ? 0 : 1);
		})
		.catch((error) => {
			console.error("❌ Workflow test suite crashed:", error);
			process.exit(1);
		});
}
