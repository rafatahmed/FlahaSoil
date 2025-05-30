/**
 * Report and Print Manager for FlahaSoil
 * Handles tier-based report generation and printing functionality
 *
 * @format
 */

class ReportManager {
	constructor() {
		this.currentSoilData = null;
		this.reportCapabilities = null;
		this.isGeneratingPDF = false; // Prevent concurrent requests
		this.initializeReportManager();
	}

	/**
	 * Initialize the report manager
	 */
	async initializeReportManager() {
		try {
			console.log("🔧 Initializing Report Manager...");
			await this.loadReportCapabilities();
			this.updateReportUI();
			console.log("✅ Report Manager initialized successfully");
		} catch (error) {
			console.error("❌ Failed to initialize report manager:", error);
		}
	}

	/**
	 * Load user's report capabilities from API
	 */
	async loadReportCapabilities() {
		try {
			const token = localStorage.getItem("flahasoil_token");
			const userStr = localStorage.getItem("flahasoil_user");

			if (!token || !userStr) {
				console.log("No authentication found, setting demo capabilities");
				this.reportCapabilities = {
					reportGeneration: false,
					printFunctionality: false,
					pdfExport: false,
					customReports: false,
					brandedReports: false,
					message: "Login required for report features",
				};
				return;
			}

			// Parse user data to get tier
			const user = JSON.parse(userStr);
			const userTier = user.tier || "FREE";

			console.log("Loading report capabilities for tier:", userTier);

			// Try to fetch from API first
			try {
				const response = await fetch(
					"http://localhost:3001/api/v1/reports/capabilities",
					{
						method: "GET",
						headers: {
							Authorization: `Bearer ${token}`,
							"Content-Type": "application/json",
						},
					}
				);

				if (response.ok) {
					const data = await response.json();
					this.reportCapabilities = data.capabilities;
					console.log(
						"Report capabilities loaded from API:",
						this.reportCapabilities
					);
					return;
				} else {
					console.warn("API capabilities endpoint failed, using fallback");
				}
			} catch (apiError) {
				console.warn(
					"API capabilities request failed, using fallback:",
					apiError.message
				);
			}

			// Fallback: Set capabilities based on user tier
			this.reportCapabilities = this.getCapabilitiesForTier(userTier);
			console.log(
				"Using fallback capabilities for tier",
				userTier,
				":",
				this.reportCapabilities
			);
		} catch (error) {
			console.error("Error loading report capabilities:", error);
			this.reportCapabilities = {
				reportGeneration: false,
				printFunctionality: false,
				pdfExport: false,
				customReports: false,
				brandedReports: false,
				message: "Error loading report capabilities",
			};
		}
	}

	/**
	 * Get capabilities based on user tier (fallback method)
	 */
	getCapabilitiesForTier(tier) {
		switch (tier.toUpperCase()) {
			case "PROFESSIONAL":
				return {
					reportGeneration: true,
					printFunctionality: true,
					pdfExport: true,
					customReports: false,
					brandedReports: false,
					message: "Professional tier capabilities",
				};
			case "ENTERPRISE":
				return {
					reportGeneration: true,
					printFunctionality: true,
					pdfExport: true,
					customReports: true,
					brandedReports: true,
					message: "Enterprise tier capabilities",
				};
			case "FREE":
			default:
				return {
					reportGeneration: false,
					printFunctionality: false,
					pdfExport: false,
					customReports: false,
					brandedReports: false,
					message: "Upgrade to Professional for report features",
				};
		}
	}

	/**
	 * Update the report UI based on user capabilities
	 */
	updateReportUI() {
		const reportControls = document.getElementById("reportControls");
		const printBtn = document.getElementById("print-btn");
		const generateReportBtn = document.getElementById("generate-report-btn");
		const customReportBtn = document.getElementById("custom-report-btn");

		if (!reportControls) return;

		// Initially hide all report controls until analysis is done
		reportControls.style.display = "none";

		// Hide all buttons initially - they will be shown in sequence
		if (printBtn) printBtn.style.display = "none";
		if (generateReportBtn) generateReportBtn.style.display = "none";
		if (customReportBtn) customReportBtn.style.display = "none";

		console.log("Report UI initialized - buttons hidden until analysis");
	}

	/**
	 * Show report controls after successful soil analysis
	 */
	showReportControlsAfterAnalysis() {
		console.log("🎯 showReportControlsAfterAnalysis called");
		console.log("📊 Current capabilities:", this.reportCapabilities);

		const reportControls = document.getElementById("reportControls");
		const generateReportBtn = document.getElementById("generate-report-btn");
		const customReportBtn = document.getElementById("custom-report-btn");

		console.log("🔍 DOM elements found:");
		console.log("  reportControls:", !!reportControls);
		console.log("  generateReportBtn:", !!generateReportBtn);
		console.log("  customReportBtn:", !!customReportBtn);

		if (!this.reportCapabilities) {
			console.log("❌ No report capabilities available");
			return;
		}

		if (!reportControls) {
			console.log("❌ Report controls container not found");
			return;
		}

		// Show the report controls container
		if (
			this.reportCapabilities.pdfExport ||
			this.reportCapabilities.customReports
		) {
			reportControls.style.display = "block";
			console.log("✅ Report controls container shown");
		} else {
			console.log(
				"❌ User doesn't have PDF export or custom report capabilities"
			);
		}

		// Show PDF generation button first (step 2 in sequence)
		if (generateReportBtn && this.reportCapabilities.pdfExport) {
			generateReportBtn.style.display = "flex";
			generateReportBtn.disabled = false;
			console.log("✅ Generate PDF button shown and enabled");
		} else {
			console.log("❌ Generate PDF button not shown:", {
				buttonExists: !!generateReportBtn,
				hasCapability: this.reportCapabilities.pdfExport,
			});
		}

		// Show custom report button for Enterprise users
		if (customReportBtn && this.reportCapabilities.customReports) {
			customReportBtn.style.display = "flex";
			customReportBtn.disabled = false;
			console.log("✅ Custom report button shown and enabled");
		}
	}

	/**
	 * Show print button after successful PDF generation
	 */
	showPrintButtonAfterPDF() {
		const printBtn = document.getElementById("print-btn");

		if (printBtn && this.reportCapabilities.printFunctionality) {
			printBtn.style.display = "flex";
			printBtn.disabled = false;
			console.log("Print button shown after PDF generation");
		}
	}

	/**
	 * Update current soil data for reports
	 */
	updateSoilData(soilData) {
		this.currentSoilData = soilData;
		// Show report controls after successful analysis (step 2 in sequence)
		this.showReportControlsAfterAnalysis();
	}

	/**
	 * Refresh report capabilities and UI (useful after login/tier changes)
	 */
	async refreshReportCapabilities() {
		await this.loadReportCapabilities();
		this.updateReportUI();
	}

	/**
	 * Update report button states based on data availability
	 */
	updateReportButtonStates() {
		const hasData =
			this.currentSoilData && Object.keys(this.currentSoilData).length > 0;

		const printBtn = document.getElementById("print-btn");
		const generateReportBtn = document.getElementById("generate-report-btn");
		const customReportBtn = document.getElementById("custom-report-btn");

		if (printBtn) printBtn.disabled = !hasData;
		if (generateReportBtn) generateReportBtn.disabled = !hasData;
		if (customReportBtn) customReportBtn.disabled = !hasData;
	}

	/**
	 * Print the current soil analysis report
	 * First generates HTML report, then triggers print
	 */
	async printReport() {
		if (!this.reportCapabilities.printFunctionality) {
			this.showUpgradePrompt("Print functionality requires Professional plan");
			return;
		}

		if (!this.currentSoilData) {
			this.showErrorMessage("No soil analysis data available for printing");
			return;
		}

		try {
			this.showLoadingState("Preparing report for printing...");

			// First generate the HTML report
			const htmlReport = await this.generateHTMLReport();

			// Create printable content with the generated HTML
			this.createPrintableContent(htmlReport);

			// Small delay to ensure content is rendered
			setTimeout(() => {
				this.hideLoadingState();
				window.print();
			}, 500);
		} catch (error) {
			console.error("Print error:", error);
			this.showErrorMessage("Failed to print report");
			this.hideLoadingState();
		}
	}

	/**
	 * Generate and download PDF report
	 */
	async generateReport() {
		if (!this.reportCapabilities.pdfExport) {
			this.showUpgradePrompt("PDF generation requires Professional plan");
			return;
		}

		if (!this.currentSoilData) {
			this.showErrorMessage(
				"No soil analysis data available for report generation"
			);
			return;
		}

		// Prevent concurrent requests
		if (this.isGeneratingPDF) {
			console.log("🔄 PDF generation already in progress, ignoring request");
			return;
		}

		try {
			this.isGeneratingPDF = true; // Set flag
			this.showLoadingState("Generating PDF report...");

			const token = localStorage.getItem("flahasoil_token");
			console.log(
				"🔧 Making PDF request with token:",
				token ? "Present" : "Missing"
			);
			console.log("🔧 Soil data for PDF:", this.currentSoilData);

			// Test if backend is reachable first
			console.log("🔧 Testing backend connectivity...");
			try {
				const healthCheck = await fetch("http://localhost:3001/health");
				console.log("✅ Backend health check:", healthCheck.status);
			} catch (healthError) {
				console.error("❌ Backend not reachable:", healthError);
				throw new Error(
					"Backend server is not reachable. Please ensure the API server is running on port 3001."
				);
			}

			// Create AbortController for timeout
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

			console.log("🔧 Making PDF generation request...");
			const response = await fetch(
				"http://localhost:3001/api/v1/reports/generate/standard",
				{
					method: "POST",
					mode: "cors",
					credentials: "include",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						soilData: this.currentSoilData,
					}),
					signal: controller.signal,
				}
			);

			clearTimeout(timeoutId);

			console.log("🔧 PDF Response:", {
				status: response.status,
				statusText: response.statusText,
				ok: response.ok,
				headers: Object.fromEntries(response.headers.entries()),
			});

			if (response.ok) {
				const blob = await response.blob();
				console.log("✅ PDF Blob received:", {
					size: blob.size,
					type: blob.type,
				});

				this.downloadFile(
					blob,
					`FlahaSoil-Report-${Date.now()}.pdf`,
					"application/pdf"
				);
				this.showSuccessMessage("PDF report generated successfully!");

				// Show print button after successful PDF generation (step 3 in sequence)
				this.showPrintButtonAfterPDF();
			} else {
				// Handle non-JSON error responses
				let errorMessage = "Failed to generate report";
				try {
					const errorData = await response.json();
					errorMessage = errorData.error || errorMessage;
				} catch (jsonError) {
					// If response is not JSON, use status text
					errorMessage = `Server error: ${response.status} ${response.statusText}`;
				}
				throw new Error(errorMessage);
			}
		} catch (error) {
			console.error("❌ Report generation error:", error);

			let errorMessage = "Failed to generate report";
			if (error.name === "AbortError") {
				errorMessage = "Request timed out. Please try again.";
			} else if (error.message.includes("NetworkError")) {
				errorMessage =
					"Network error. Please check your connection and try again.";
			} else if (error.message.includes("CORS")) {
				errorMessage =
					"Connection error. Please refresh the page and try again.";
			} else {
				errorMessage = `Failed to generate report: ${error.message}`;
			}

			this.showErrorMessage(errorMessage);
		} finally {
			this.isGeneratingPDF = false; // Reset flag
			this.hideLoadingState();
		}
	}

	/**
	 * Generate and download custom branded report (Enterprise only)
	 */
	async generateCustomReport() {
		if (!this.reportCapabilities.customReports) {
			this.showUpgradePrompt("Custom reports require Enterprise plan");
			return;
		}

		if (!this.currentSoilData) {
			this.showErrorMessage(
				"No soil analysis data available for custom report generation"
			);
			return;
		}

		// Show custom report options modal
		this.showCustomReportModal();
	}

	/**
	 * Generate HTML report content
	 */
	async generateHTMLReport() {
		try {
			const token = localStorage.getItem("flahasoil_token");
			const response = await fetch(
				"http://localhost:3001/api/v1/reports/preview/standard",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						soilData: this.currentSoilData,
					}),
				}
			);

			if (response.ok) {
				return await response.text();
			} else {
				throw new Error("Failed to generate HTML report");
			}
		} catch (error) {
			console.error("HTML report generation error:", error);
			// Fallback to client-side generation
			return this.generateClientSideHTML();
		}
	}

	/**
	 * Generate client-side HTML report as fallback
	 */
	generateClientSideHTML() {
		const currentDate = new Date().toLocaleDateString();
		const currentUser = JSON.parse(
			localStorage.getItem("flahasoil_user") || "{}"
		);

		return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<title>FlahaSoil Analysis Report</title>
			<style>
				body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
				.header { background: linear-gradient(135deg, #2E8B57 0%, #4682B4 100%); color: white; padding: 30px; text-align: center; margin-bottom: 30px; border-radius: 8px; }
				.header h1 { margin: 0; font-size: 28px; }
				.section { margin-bottom: 30px; border-bottom: 1px solid #eee; padding-bottom: 20px; }
				.section h2 { color: #2E8B57; font-size: 20px; margin-bottom: 15px; border-left: 4px solid #2E8B57; padding-left: 15px; }
				.data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
				.data-item { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 3px solid #4682B4; }
				.data-item label { font-weight: bold; color: #555; display: block; margin-bottom: 5px; }
				.data-item .value { font-size: 18px; color: #2E8B57; font-weight: bold; }
				.metadata { background: #e8f4f8; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
				.footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #eee; margin-top: 30px; }
				@media print {
					body { margin: 0; padding: 15px; }
					.header { page-break-inside: avoid; }
					.section { page-break-inside: avoid; }
				}
			</style>
		</head>
		<body>
			<div class="header">
				<h1>FlahaSoil Analysis Report</h1>
				<p>Professional Soil Water Characteristics Analysis</p>
			</div>

			<div class="metadata">
				<p><strong>Generated for:</strong> ${
					currentUser.name || "Professional User"
				}</p>
				<p><strong>Report Date:</strong> ${currentDate}</p>
				<p><strong>Analysis Type:</strong> Professional Plan</p>
			</div>

			<div class="section">
				<h2>Soil Composition</h2>
				<div class="data-grid">
					<div class="data-item">
						<label>Sand Content</label>
						<span class="value">${this.currentSoilData.sand || 0}%</span>
					</div>
					<div class="data-item">
						<label>Clay Content</label>
						<span class="value">${this.currentSoilData.clay || 0}%</span>
					</div>
					<div class="data-item">
						<label>Silt Content</label>
						<span class="value">${this.currentSoilData.silt || 0}%</span>
					</div>
					<div class="data-item">
						<label>Organic Matter</label>
						<span class="value">${this.currentSoilData.organicMatter || 0}%</span>
					</div>
				</div>
			</div>

			<div class="section">
				<h2>Water Characteristics</h2>
				<div class="data-grid">
					<div class="data-item">
						<label>Field Capacity</label>
						<span class="value">${this.currentSoilData.fieldCapacity || 0}%</span>
					</div>
					<div class="data-item">
						<label>Wilting Point</label>
						<span class="value">${this.currentSoilData.wiltingPoint || 0}%</span>
					</div>
					<div class="data-item">
						<label>Plant Available Water</label>
						<span class="value">${this.currentSoilData.plantAvailableWater || 0}%</span>
					</div>
					<div class="data-item">
						<label>Saturation</label>
						<span class="value">${this.currentSoilData.saturation || 0}%</span>
					</div>
				</div>
			</div>

			<div class="section">
				<h2>Physical Properties</h2>
				<div class="data-grid">
					<div class="data-item">
						<label>Texture Class</label>
						<span class="value">${this.currentSoilData.textureClass || "Unknown"}</span>
					</div>
					<div class="data-item">
						<label>Saturated Conductivity</label>
						<span class="value">${
							this.currentSoilData.saturatedConductivity || 0
						} mm/hr</span>
					</div>
					<div class="data-item">
						<label>Bulk Density Factor</label>
						<span class="value">${this.currentSoilData.densityFactor || 1.0} g/cm³</span>
					</div>
					<div class="data-item">
						<label>Gravel Content</label>
						<span class="value">${this.currentSoilData.gravelContent || 0}%</span>
					</div>
				</div>
			</div>

			<div class="footer">
				<p>Generated by FlahaSoil Professional Analysis System</p>
				<p>Based on Saxton & Rawls (2006) Soil Water Characteristics methodology</p>
				<p>© ${new Date().getFullYear()} Flaha PA. All rights reserved.</p>
			</div>
		</body>
		</html>
		`;
	}

	/**
	 * Create printable content with generated HTML
	 */
	createPrintableContent(htmlContent) {
		// Remove existing print content
		const existingPrintContent = document.querySelector(".print-content");
		if (existingPrintContent) {
			existingPrintContent.remove();
		}

		// Create new print content container
		const printContent = document.createElement("div");
		printContent.className = "print-content";
		printContent.style.display = "none";

		if (htmlContent) {
			// Extract body content from HTML
			const parser = new DOMParser();
			const doc = parser.parseFromString(htmlContent, "text/html");
			const bodyContent = doc.body.innerHTML;
			printContent.innerHTML = bodyContent;
		} else {
			// Fallback to current page content
			printContent.innerHTML = `
				<h1>FlahaSoil Analysis Report</h1>
				<p>Generated on ${new Date().toLocaleDateString()} - Professional Soil Analysis</p>
				<div class="report-content">
					${document.querySelector("main")?.innerHTML || "No content available"}
				</div>
			`;
		}

		document.body.appendChild(printContent);

		// Mark main content as printable
		const mainContent = document.querySelector("main");
		if (mainContent) {
			mainContent.classList.add("printable-content");
		}
	}

	/**
	 * Show custom report modal for Enterprise users
	 */
	showCustomReportModal() {
		// Create modal HTML
		const modalHTML = `
            <div class="modal-overlay" id="customReportModal" style="display: flex;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2>Custom Report Options</h2>
                        <button class="modal-close" onclick="reportManager.hideCustomReportModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <form id="customReportForm">
                            <div class="input-group">
                                <label for="companyName">Company Name:</label>
                                <input type="text" id="companyName" name="companyName" placeholder="Your Company Name">
                            </div>
                            <div class="input-group">
                                <label for="primaryColor">Primary Color:</label>
                                <input type="color" id="primaryColor" name="primaryColor" value="#2E8B57">
                            </div>
                            <div class="input-group">
                                <label for="secondaryColor">Secondary Color:</label>
                                <input type="color" id="secondaryColor" name="secondaryColor" value="#4682B4">
                            </div>
                            <div class="input-group">
                                <label for="includeRecommendations">
                                    <input type="checkbox" id="includeRecommendations" name="includeRecommendations" checked>
                                    Include Management Recommendations
                                </label>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="reportManager.hideCustomReportModal()">Cancel</button>
                        <button type="button" class="btn-primary" onclick="reportManager.generateCustomReportWithOptions()">Generate Custom Report</button>
                    </div>
                </div>
            </div>
        `;

		// Add modal to page
		document.body.insertAdjacentHTML("beforeend", modalHTML);
	}

	/**
	 * Hide custom report modal
	 */
	hideCustomReportModal() {
		const modal = document.getElementById("customReportModal");
		if (modal) {
			modal.remove();
		}
	}

	/**
	 * Generate custom report with user options
	 */
	async generateCustomReportWithOptions() {
		try {
			const form = document.getElementById("customReportForm");
			const formData = new FormData(form);

			const customOptions = {
				companyName: formData.get("companyName") || "Your Company",
				primaryColor: formData.get("primaryColor") || "#2E8B57",
				secondaryColor: formData.get("secondaryColor") || "#4682B4",
				includeRecommendations: formData.get("includeRecommendations") === "on",
			};

			this.hideCustomReportModal();
			this.showLoadingState("Generating custom report...");

			const token = localStorage.getItem("flahasoil_token");
			const response = await fetch(
				"http://localhost:3001/api/v1/reports/generate/custom",
				{
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						soilData: this.currentSoilData,
						customOptions: customOptions,
					}),
				}
			);

			if (response.ok) {
				const blob = await response.blob();
				const filename = `${customOptions.companyName.replace(
					/[^a-zA-Z0-9]/g,
					"_"
				)}-SoilReport-${Date.now()}.pdf`;
				this.downloadFile(blob, filename, "application/pdf");
				this.showSuccessMessage("Custom report generated successfully!");
			} else {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to generate custom report");
			}
		} catch (error) {
			console.error("Custom report generation error:", error);
			this.showErrorMessage(
				`Failed to generate custom report: ${error.message}`
			);
		} finally {
			this.hideLoadingState();
		}
	}

	/**
	 * Download file helper
	 */
	downloadFile(blob, filename, mimeType) {
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		window.URL.revokeObjectURL(url);
		document.body.removeChild(a);
	}

	/**
	 * Show upgrade prompt
	 */
	showUpgradePrompt(message) {
		if (typeof showFeatureUpgradePrompt === "function") {
			showFeatureUpgradePrompt("Report Generation", message);
		} else {
			alert(message + "\n\nPlease upgrade your plan to access this feature.");
		}
	}

	/**
	 * Show error message
	 */
	showErrorMessage(message) {
		if (typeof showErrorMessage === "function") {
			showErrorMessage(message);
		} else {
			alert("Error: " + message);
		}
	}

	/**
	 * Show success message
	 */
	showSuccessMessage(message) {
		if (typeof showSuccessMessage === "function") {
			showSuccessMessage(message);
		} else {
			console.log("Success: " + message);
		}
	}

	/**
	 * Show loading state
	 */
	showLoadingState(message = "Processing...") {
		if (typeof showLoadingState === "function") {
			showLoadingState(message);
		} else {
			console.log("Loading: " + message);
		}
	}

	/**
	 * Hide loading state
	 */
	hideLoadingState() {
		if (typeof hideLoadingState === "function") {
			hideLoadingState();
		}
	}
}

// Global functions for button onclick handlers
function printReport() {
	if (window.reportManager) {
		window.reportManager.printReport();
	}
}

function generateReport() {
	if (window.reportManager) {
		window.reportManager.generateReport();
	}
}

function generateCustomReport() {
	if (window.reportManager) {
		window.reportManager.generateCustomReport();
	}
}

// Initialize report manager when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	window.reportManager = new ReportManager();
});
