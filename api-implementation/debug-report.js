/**
 * Debug Report Manager State
 *
 * @format
 */

const puppeteer = require("puppeteer");

async function debugReportManager() {
	console.log("🔍 FlahaSoil Report Manager Debug");
	console.log("════════════════════════════════════════════════════════════");

	const browser = await puppeteer.launch({
		headless: false,
		defaultViewport: { width: 1200, height: 800 },
	});

	try {
		const page = await browser.newPage();

		// Navigate to the app
		await page.goto("http://localhost:3000/index.html");

		console.log("📱 Setting up Professional User");

		// Set up Professional user in localStorage
		await page.evaluate(() => {
			const testUser = {
				id: "test-user-123",
				name: "Test Professional User",
				email: "test@professional.com",
				tier: "PROFESSIONAL",
			};
			const testToken = "test-token-professional-123";

			localStorage.setItem("flahasoil_user", JSON.stringify(testUser));
			localStorage.setItem("flahasoil_token", testToken);
		});

		// Reload to apply user settings
		await page.reload();
		await new Promise((resolve) => setTimeout(resolve, 3000));

		console.log("\n🔍 Checking Report Manager State");

		// Check report manager state
		const reportManagerState = await page.evaluate(() => {
			return {
				reportManagerExists: !!window.reportManager,
				reportCapabilities: window.reportManager
					? window.reportManager.reportCapabilities
					: null,
				currentSoilData: window.reportManager
					? window.reportManager.currentSoilData
					: null,
				reportControlsElement: !!document.getElementById("reportControls"),
				generateBtnElement: !!document.getElementById("generate-report-btn"),
				printBtnElement: !!document.getElementById("print-btn"),
				reportControlsVisible: document.getElementById("reportControls")
					? document.getElementById("reportControls").style.display
					: "not found",
				generateBtnVisible: document.getElementById("generate-report-btn")
					? document.getElementById("generate-report-btn").style.display
					: "not found",
				printBtnVisible: document.getElementById("print-btn")
					? document.getElementById("print-btn").style.display
					: "not found",
			};
		});

		console.log("Report Manager State:");
		console.log("  Exists:", reportManagerState.reportManagerExists);
		console.log("  Capabilities:", reportManagerState.reportCapabilities);
		console.log("  Current Soil Data:", !!reportManagerState.currentSoilData);
		console.log("  DOM Elements:");
		console.log(
			"    reportControls element exists:",
			reportManagerState.reportControlsElement
		);
		console.log(
			"    generateBtn element exists:",
			reportManagerState.generateBtnElement
		);
		console.log(
			"    printBtn element exists:",
			reportManagerState.printBtnElement
		);
		console.log("  Visibility:");
		console.log(
			"    reportControls display:",
			reportManagerState.reportControlsVisible
		);
		console.log(
			"    generateBtn display:",
			reportManagerState.generateBtnVisible
		);
		console.log("    printBtn display:", reportManagerState.printBtnVisible);

		console.log("\n⚡ Triggering Soil Analysis");

		// Click the update analysis button
		await page.click("#update-point-btn");
		console.log('  ✓ Clicked "Update Analysis" button');

		// Wait for analysis to complete
		await new Promise((resolve) => setTimeout(resolve, 5000));

		console.log("\n🔍 Checking State After Analysis");

		// Check state after analysis
		const afterAnalysisState = await page.evaluate(() => {
			return {
				reportCapabilities: window.reportManager
					? window.reportManager.reportCapabilities
					: null,
				currentSoilData: window.reportManager
					? !!window.reportManager.currentSoilData
					: false,
				reportControlsVisible: document.getElementById("reportControls")
					? document.getElementById("reportControls").style.display
					: "not found",
				generateBtnVisible: document.getElementById("generate-report-btn")
					? document.getElementById("generate-report-btn").style.display
					: "not found",
				printBtnVisible: document.getElementById("print-btn")
					? document.getElementById("print-btn").style.display
					: "not found",
				generateBtnDisabled: document.getElementById("generate-report-btn")
					? document.getElementById("generate-report-btn").disabled
					: "not found",
			};
		});

		console.log("After Analysis State:");
		console.log("  Capabilities:", afterAnalysisState.reportCapabilities);
		console.log("  Has Soil Data:", afterAnalysisState.currentSoilData);
		console.log("  Visibility:");
		console.log(
			"    reportControls display:",
			afterAnalysisState.reportControlsVisible
		);
		console.log(
			"    generateBtn display:",
			afterAnalysisState.generateBtnVisible
		);
		console.log("    printBtn display:", afterAnalysisState.printBtnVisible);
		console.log(
			"    generateBtn disabled:",
			afterAnalysisState.generateBtnDisabled
		);

		// Get console logs from the page
		console.log("\n📋 Browser Console Logs:");
		const logs = await page.evaluate(() => {
			// Return any console logs that were captured
			return window.debugLogs || "No debug logs captured";
		});

		console.log(
			"\n🎯 Debug completed! Browser left open for manual inspection."
		);

		// Keep browser open for manual testing
		await new Promise((resolve) => setTimeout(resolve, 30000));
	} catch (error) {
		console.error("❌ Debug failed:", error);
	} finally {
		await browser.close();
	}
}

// Run the debug
debugReportManager().catch(console.error);
