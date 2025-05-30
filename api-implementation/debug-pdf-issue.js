/**
 * Debug PDF Corruption Issue
 * Tests PDF generation with detailed logging and file analysis
 * @format
 */

const ReportService = require("./src/services/reportService");
const fs = require("fs").promises;
const path = require("path");

class PDFDebugger {
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
	 * Test PDF generation with detailed analysis
	 */
	async debugPDFGeneration() {
		console.log("🔍 PDF Corruption Debug Analysis");
		console.log("═".repeat(50));

		await this.ensureOutputDir();

		// Sample soil data for testing
		const testSoilData = {
			sand: 40,
			clay: 30,
			silt: 30,
			organicMatter: 2.5,
			bulkDensity: 1.3,
			gravel: 5,
			salinity: 0.2,
			fieldCapacity: 0.35,
			wiltingPoint: 0.15,
			plantAvailableWater: 0.2,
			saturatedConductivity: 25.5,
			airCapacity: 0.12,
			qualityScore: 85,
			textureClass: "Clay Loam",
			drainageClass: "Well Drained",
		};

		const testUser = {
			name: "Test User",
			email: "test@example.com",
			tier: "Professional",
		};

		try {
			console.log("📊 Test Data:");
			console.log("  - Soil Data Keys:", Object.keys(testSoilData));
			console.log("  - User Tier:", testUser.tier);
			console.log("");

			// Step 1: Generate HTML content first
			console.log("🔧 Step 1: Generating HTML content...");
			const htmlContent = this.reportService.generateStandardReportHTML(
				testSoilData,
				testUser
			);

			// Save HTML for inspection
			const htmlPath = path.join(
				this.testOutputDir,
				`debug-report-${Date.now()}.html`
			);
			await fs.writeFile(htmlPath, htmlContent);
			console.log(`✅ HTML saved: ${htmlPath}`);
			console.log(`📏 HTML size: ${htmlContent.length} characters`);
			console.log("");

			// Step 2: Generate PDF with monitoring
			console.log("🔧 Step 2: Generating PDF with monitoring...");
			const startTime = Date.now();
			const startMemory = process.memoryUsage();

			const pdfBuffer = await this.reportService.generateStandardReport(
				testSoilData,
				testUser
			);

			const endTime = Date.now();
			const endMemory = process.memoryUsage();

			console.log(`⏱️  Generation time: ${endTime - startTime}ms`);
			console.log(`📊 Memory usage:`);
			console.log(
				`   - RSS: ${(endMemory.rss - startMemory.rss) / 1024 / 1024} MB`
			);
			console.log(
				`   - Heap Used: ${
					(endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024
				} MB`
			);
			console.log(
				`📏 PDF size: ${pdfBuffer.length} bytes (${(
					pdfBuffer.length /
					1024 /
					1024
				).toFixed(2)} MB)`
			);
			console.log("");

			// Step 3: Analyze PDF buffer
			console.log("🔧 Step 3: Analyzing PDF buffer...");
			await this.analyzePDFBuffer(pdfBuffer);

			// Step 4: Save and validate PDF
			const pdfPath = path.join(
				this.testOutputDir,
				`debug-report-${Date.now()}.pdf`
			);
			await fs.writeFile(pdfPath, pdfBuffer);
			console.log(`✅ PDF saved: ${pdfPath}`);

			// Step 5: Validate PDF structure
			await this.validatePDFStructure(pdfBuffer);

			console.log("");
			console.log("🎯 Debug Summary:");
			console.log(
				`   - HTML size: ${(htmlContent.length / 1024).toFixed(2)} KB`
			);
			console.log(
				`   - PDF size: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB`
			);
			console.log(
				`   - Size ratio: ${(pdfBuffer.length / htmlContent.length).toFixed(
					2
				)}x`
			);

			if (pdfBuffer.length > 5 * 1024 * 1024) {
				// > 5MB
				console.log("⚠️  WARNING: PDF size is unusually large!");
				await this.investigateLargeSize(htmlContent, pdfBuffer);
			}
		} catch (error) {
			console.error("❌ PDF generation failed:", error);
			console.error("Stack trace:", error.stack);
		} finally {
			await this.reportService.closeBrowser();
		}
	}

	/**
	 * Analyze PDF buffer for corruption signs
	 */
	async analyzePDFBuffer(pdfBuffer) {
		console.log("🔍 PDF Buffer Analysis:");

		// Check PDF header properly
		const headerBytes = Array.from(pdfBuffer.slice(0, 8));
		const headerChars = headerBytes.map((b) => String.fromCharCode(b)).join("");
		const headerHex = pdfBuffer.slice(0, 8).toString("hex");

		console.log(`   - Header (chars): "${headerChars}"`);
		console.log(`   - Header (hex): ${headerHex}`);
		console.log(`   - Header (bytes): [${headerBytes.join(", ")}]`);

		// Check if it's a valid PDF header
		const isValidPDF = headerChars.startsWith("%PDF-");
		console.log(`   - Valid PDF header: ${isValidPDF}`);

		if (!isValidPDF) {
			console.log("❌ Invalid PDF header detected!");
			console.log("   - Expected: %PDF-");
			console.log(`   - Actual: "${headerChars}"`);
			return;
		}

		// Check PDF trailer
		const trailer = pdfBuffer.slice(-50).toString();
		console.log(`   - Trailer contains %%EOF: ${trailer.includes("%%EOF")}`);

		// Look for embedded images or large objects
		const bufferStr = pdfBuffer.toString("binary");
		const imageCount = (bufferStr.match(/\/Type\s*\/XObject/g) || []).length;
		const fontCount = (bufferStr.match(/\/Type\s*\/Font/g) || []).length;

		console.log(`   - Embedded images: ${imageCount}`);
		console.log(`   - Fonts: ${fontCount}`);

		// Check for repeated patterns that might indicate corruption
		const chunks = [];
		for (let i = 0; i < pdfBuffer.length; i += 1024) {
			chunks.push(pdfBuffer.slice(i, i + 1024).toString("hex"));
		}

		const uniqueChunks = new Set(chunks);
		const duplicateRatio = (chunks.length - uniqueChunks.size) / chunks.length;
		console.log(
			`   - Duplicate chunks ratio: ${(duplicateRatio * 100).toFixed(2)}%`
		);

		if (duplicateRatio > 0.5) {
			console.log("⚠️  High duplicate content detected - possible corruption!");
		}
	}

	/**
	 * Validate PDF structure
	 */
	async validatePDFStructure(pdfBuffer) {
		console.log("🔍 PDF Structure Validation:");

		try {
			const bufferStr = pdfBuffer.toString("binary");

			// Check for essential PDF elements
			const hasXref = bufferStr.includes("xref");
			const hasTrailer = bufferStr.includes("trailer");
			const hasStartxref = bufferStr.includes("startxref");

			console.log(`   - Has xref table: ${hasXref}`);
			console.log(`   - Has trailer: ${hasTrailer}`);
			console.log(`   - Has startxref: ${hasStartxref}`);

			if (!hasXref || !hasTrailer || !hasStartxref) {
				console.log("❌ PDF structure appears corrupted!");
			} else {
				console.log("✅ PDF structure appears valid");
			}
		} catch (error) {
			console.log("❌ Error validating PDF structure:", error.message);
		}
	}

	/**
	 * Investigate causes of large PDF size
	 */
	async investigateLargeSize(htmlContent, pdfBuffer) {
		console.log("🔍 Investigating Large PDF Size:");

		// Check for potential causes in HTML
		const hasLargeImages =
			htmlContent.includes("data:image") &&
			htmlContent.match(/data:image[^"]{1000,}/);
		const hasComplexCSS =
			htmlContent.includes("background:") && htmlContent.length > 100000;
		const hasRepeatedContent = this.checkRepeatedContent(htmlContent);

		console.log(`   - Large embedded images: ${!!hasLargeImages}`);
		console.log(`   - Complex CSS: ${!!hasComplexCSS}`);
		console.log(`   - Repeated content: ${hasRepeatedContent}`);

		// Suggest optimizations
		console.log("💡 Optimization suggestions:");
		if (hasLargeImages) {
			console.log("   - Optimize or remove large embedded images");
		}
		if (hasComplexCSS) {
			console.log("   - Simplify CSS styles");
		}
		if (hasRepeatedContent) {
			console.log("   - Remove duplicate content sections");
		}
	}

	/**
	 * Check for repeated content in HTML
	 */
	checkRepeatedContent(htmlContent) {
		const lines = htmlContent.split("\n");
		const lineCount = {};

		lines.forEach((line) => {
			const trimmed = line.trim();
			if (trimmed.length > 50) {
				// Only check substantial lines
				lineCount[trimmed] = (lineCount[trimmed] || 0) + 1;
			}
		});

		const repeatedLines = Object.values(lineCount).filter((count) => count > 3);
		return repeatedLines.length > 0;
	}
}

// Run the debug analysis
async function runDebug() {
	const pdfDebugger = new PDFDebugger();
	await pdfDebugger.debugPDFGeneration();
	process.exit(0);
}

if (require.main === module) {
	runDebug().catch(console.error);
}

module.exports = PDFDebugger;
