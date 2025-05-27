/**
 * Advanced Visualization Manager for FlahaSoil
 * Handles interactive charts and 3D visualizations for Professional+ users
 *
 * @format
 */

class VisualizationManager {
	constructor(apiClient) {
		this.apiClient = apiClient;
		this.charts = new Map();
		this.isChartJSLoaded = false;
		this.loadChartJS();
	}

	/**
	 * Load Chart.js library dynamically
	 */
	async loadChartJS() {
		if (window.Chart) {
			this.isChartJSLoaded = true;
			return;
		}

		try {
			// Load Chart.js from CDN
			const script = document.createElement("script");
			script.src =
				"https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.min.js";
			script.onload = () => {
				this.isChartJSLoaded = true;
				console.log("Chart.js loaded successfully");
			};
			script.onerror = () => {
				console.error("Failed to load Chart.js");
			};
			document.head.appendChild(script);
		} catch (error) {
			console.error("Error loading Chart.js:", error);
		}
	}

	/**
	 * Wait for Chart.js to be loaded
	 */
	async waitForChartJS() {
		while (!this.isChartJSLoaded || !window.Chart) {
			await new Promise((resolve) => setTimeout(resolve, 100));
		}
	}

	/**
	 * Create moisture-tension curve visualization
	 * @param {string} containerId - Container element ID
	 * @param {string} analysisId - Analysis ID
	 * @param {Object} options - Chart options
	 */
	async createMoistureTensionCurve(containerId, analysisId, options = {}) {
		try {
			// Check user access
			if (!this.apiClient.hasAdvancedVisualizationAccess()) {
				this.showUpgradePrompt(containerId, "Moisture-Tension Curves");
				return;
			}

			await this.waitForChartJS();

			// Fetch curve data
			const response = await this.apiClient.getMoistureTensionCurve(analysisId);
			if (!response.success) {
				this.showError(containerId, response.error);
				return;
			}

			const { curveData, metadata } = response.data;

			// Prepare chart data
			const chartData = {
				labels: curveData.map((point) => point.tension),
				datasets: [
					{
						label: "Moisture Content (%)",
						data: curveData.map((point) => ({
							x: point.tension,
							y: point.moisture,
						})),
						borderColor: "#3b82f6",
						backgroundColor: "rgba(59, 130, 246, 0.1)",
						borderWidth: 2,
						fill: true,
						tension: 0.4,
						pointBackgroundColor: "#1d4ed8",
						pointBorderColor: "#ffffff",
						pointBorderWidth: 2,
						pointRadius: 4,
					},
				],
			};

			const chartOptions = {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: `Moisture-Tension Curve - ${metadata.textureClass}`,
						font: { size: 16, weight: "bold" },
					},
					legend: {
						display: true,
						position: "top",
					},
					tooltip: {
						mode: "nearest",
						intersect: false,
						callbacks: {
							label: (context) => {
								return `Tension: ${
									context.parsed.x
								} kPa, Moisture: ${context.parsed.y.toFixed(1)}%`;
							},
						},
					},
				},
				scales: {
					x: {
						type: "logarithmic",
						display: true,
						title: {
							display: true,
							text: "Soil Water Tension (kPa)",
							font: { size: 14, weight: "bold" },
						},
						grid: {
							color: "rgba(0, 0, 0, 0.1)",
						},
					},
					y: {
						display: true,
						title: {
							display: true,
							text: "Volumetric Water Content (%)",
							font: { size: 14, weight: "bold" },
						},
						grid: {
							color: "rgba(0, 0, 0, 0.1)",
						},
						min: 0,
						max: Math.max(...curveData.map((p) => p.moisture)) * 1.1,
					},
				},
				interaction: {
					intersect: false,
					mode: "index",
				},
				...options,
			};

			// Create chart
			const canvas = document.createElement("canvas");
			const container = document.getElementById(containerId);
			container.innerHTML = "";
			container.appendChild(canvas);

			const chart = new Chart(canvas, {
				type: "line",
				data: chartData,
				options: chartOptions,
			});

			// Store chart reference
			this.charts.set(containerId, chart);

			// Add key points annotations
			this.addKeyPointsInfo(container, metadata);
		} catch (error) {
			console.error("Error creating moisture-tension curve:", error);
			this.showError(containerId, "Failed to create moisture-tension curve");
		}
	}

	/**
	 * Create 3D soil profile visualization
	 * @param {string} containerId - Container element ID
	 * @param {string} analysisId - Analysis ID
	 * @param {Object} options - Visualization options
	 */
	async createSoilProfile3D(containerId, analysisId, options = {}) {
		try {
			// Check user access
			if (!this.apiClient.hasAdvancedVisualizationAccess()) {
				this.showUpgradePrompt(containerId, "3D Soil Profiles");
				return;
			}

			// Fetch 3D profile data
			const response = await this.apiClient.getSoilProfile3D(analysisId);
			if (!response.success) {
				this.showError(containerId, response.error);
				return;
			}

			const { profileData, metadata } = response.data;

			// Create 3D visualization container
			const container = document.getElementById(containerId);
			container.innerHTML = "";
			container.className = "soil-profile-3d";

			// Create horizon layers visualization
			const profileContainer = document.createElement("div");
			profileContainer.className = "profile-container";

			// Add title
			const title = document.createElement("h3");
			title.textContent = `3D Soil Profile - ${metadata.textureClass}`;
			title.className = "profile-title";
			container.appendChild(title);

			// Create horizon visualization
			profileData.horizons.forEach((horizon, index) => {
				const horizonElement = document.createElement("div");
				horizonElement.className = "horizon-layer";
				horizonElement.style.height = `${
					(horizon.thickness / profileData.maxDepth) * 300
				}px`;
				horizonElement.style.backgroundColor = this.getHorizonColor(
					horizon.name,
					horizon.organicMatter
				);

				const horizonInfo = document.createElement("div");
				horizonInfo.className = "horizon-info";
				horizonInfo.innerHTML = `
					<strong>${horizon.name} Horizon</strong><br>
					${horizon.depthStart}-${horizon.depthEnd}cm<br>
					OM: ${horizon.organicMatter.toFixed(1)}%<br>
					FC: ${horizon.properties.fieldCapacity}%<br>
					WP: ${horizon.properties.wiltingPoint}%
				`;

				horizonElement.appendChild(horizonInfo);
				profileContainer.appendChild(horizonElement);
			});

			container.appendChild(profileContainer);

			// Add summary information
			this.addProfileSummary(container, profileData);
		} catch (error) {
			console.error("Error creating 3D soil profile:", error);
			this.showError(containerId, "Failed to create 3D soil profile");
		}
	}

	/**
	 * Create comparative analysis chart
	 * @param {string} containerId - Container element ID
	 * @param {Array} analysisIds - Array of analysis IDs to compare
	 * @param {string} comparisonType - Type of comparison
	 */
	async createComparativeAnalysis(
		containerId,
		analysisIds,
		comparisonType = "basic"
	) {
		try {
			// Check user access
			if (!this.apiClient.hasAdvancedVisualizationAccess()) {
				this.showUpgradePrompt(containerId, "Comparative Analysis");
				return;
			}

			await this.waitForChartJS();

			// Fetch comparison data
			const response = await this.apiClient.compareAnalyses(
				analysisIds,
				comparisonType
			);
			if (!response.success) {
				this.showError(containerId, response.error);
				return;
			}

			const { comparisonData, chartData } = response.data;

			// Create radar chart for comparison
			const radarData = {
				labels: chartData.parameters,
				datasets: chartData.datasets.map((dataset, index) => ({
					label: dataset.label,
					data: dataset.values,
					borderColor: this.getComparisonColor(index),
					backgroundColor: this.getComparisonColor(index, 0.2),
					borderWidth: 2,
					pointBackgroundColor: this.getComparisonColor(index),
					pointBorderColor: "#ffffff",
					pointBorderWidth: 2,
				})),
			};

			const radarOptions = {
				responsive: true,
				maintainAspectRatio: false,
				plugins: {
					title: {
						display: true,
						text: "Soil Properties Comparison",
						font: { size: 16, weight: "bold" },
					},
					legend: {
						display: true,
						position: "top",
					},
				},
				scales: {
					r: {
						beginAtZero: true,
						max: 100,
						ticks: {
							stepSize: 20,
						},
						grid: {
							color: "rgba(0, 0, 0, 0.1)",
						},
					},
				},
			};

			// Create chart
			const canvas = document.createElement("canvas");
			const container = document.getElementById(containerId);
			container.innerHTML = "";
			container.appendChild(canvas);

			const chart = new Chart(canvas, {
				type: "radar",
				data: radarData,
				options: radarOptions,
			});

			this.charts.set(containerId, chart);

			// Add comparison table
			this.addComparisonTable(container, comparisonData);
		} catch (error) {
			console.error("Error creating comparative analysis:", error);
			this.showError(containerId, "Failed to create comparative analysis");
		}
	}

	/**
	 * Create real-time parameter adjustment interface
	 * @param {string} containerId - Container element ID
	 * @param {string} analysisId - Base analysis ID
	 */
	async createRealtimeAdjustment(containerId, analysisId) {
		try {
			// Check user access
			if (!this.apiClient.hasAdvancedVisualizationAccess()) {
				this.showUpgradePrompt(containerId, "Real-time Parameter Adjustment");
				return;
			}

			const container = document.getElementById(containerId);
			container.innerHTML = "";
			container.className = "realtime-adjustment";

			// Create adjustment controls
			const controlsContainer = document.createElement("div");
			controlsContainer.className = "adjustment-controls";
			controlsContainer.innerHTML = `
				<h3>Real-time Parameter Adjustment</h3>
				<div class="parameter-controls">
					<div class="control-group">
						<label for="sand-slider">Sand (%)</label>
						<input type="range" id="sand-slider" min="0" max="100" value="50" class="parameter-slider">
						<span id="sand-value">50</span>
					</div>
					<div class="control-group">
						<label for="clay-slider">Clay (%)</label>
						<input type="range" id="clay-slider" min="0" max="100" value="25" class="parameter-slider">
						<span id="clay-value">25</span>
					</div>
					<div class="control-group">
						<label for="om-slider">Organic Matter (%)</label>
						<input type="range" id="om-slider" min="0" max="10" step="0.1" value="2.5" class="parameter-slider">
						<span id="om-value">2.5</span>
					</div>
					<div class="control-group">
						<label for="density-slider">Bulk Density (g/cm³)</label>
						<input type="range" id="density-slider" min="0.8" max="1.8" step="0.1" value="1.3" class="parameter-slider">
						<span id="density-value">1.3</span>
					</div>
				</div>
			`;

			// Create results display
			const resultsContainer = document.createElement("div");
			resultsContainer.className = "adjustment-results";
			resultsContainer.innerHTML = `
				<div id="live-results">
					<h4>Live Results</h4>
					<div class="result-grid">
						<div class="result-item">
							<span class="result-label">Field Capacity:</span>
							<span id="fc-result" class="result-value">--</span>
						</div>
						<div class="result-item">
							<span class="result-label">Wilting Point:</span>
							<span id="wp-result" class="result-value">--</span>
						</div>
						<div class="result-item">
							<span class="result-label">Available Water:</span>
							<span id="paw-result" class="result-value">--</span>
						</div>
						<div class="result-item">
							<span class="result-label">Texture Class:</span>
							<span id="texture-result" class="result-value">--</span>
						</div>
					</div>
				</div>
			`;

			container.appendChild(controlsContainer);
			container.appendChild(resultsContainer);

			// Add event listeners for real-time updates
			this.setupRealtimeControls(analysisId);
		} catch (error) {
			console.error("Error creating real-time adjustment:", error);
			this.showError(
				containerId,
				"Failed to create real-time adjustment interface"
			);
		}
	}

	/**
	 * Setup real-time control event listeners
	 * @param {string} analysisId - Base analysis ID
	 */
	setupRealtimeControls(analysisId) {
		const sliders = document.querySelectorAll(".parameter-slider");
		let updateTimeout;

		sliders.forEach((slider) => {
			slider.addEventListener("input", (e) => {
				// Update display value
				const valueSpan = document.getElementById(
					e.target.id.replace("-slider", "-value")
				);
				valueSpan.textContent = e.target.value;

				// Debounce API calls
				clearTimeout(updateTimeout);
				updateTimeout = setTimeout(() => {
					this.updateRealtimeResults(analysisId);
				}, 300);
			});
		});

		// Initial calculation
		this.updateRealtimeResults(analysisId);
	}

	/**
	 * Update real-time calculation results
	 * @param {string} analysisId - Base analysis ID
	 */
	async updateRealtimeResults(analysisId) {
		try {
			const adjustments = {
				sand: parseFloat(document.getElementById("sand-slider").value),
				clay: parseFloat(document.getElementById("clay-slider").value),
				organicMatter: parseFloat(document.getElementById("om-slider").value),
				densityFactor: parseFloat(
					document.getElementById("density-slider").value
				),
			};

			const response = await this.apiClient.adjustParametersRealtime(
				analysisId,
				adjustments
			);
			if (response.success) {
				const results = response.data.calculations;
				document.getElementById(
					"fc-result"
				).textContent = `${results.fieldCapacity}%`;
				document.getElementById(
					"wp-result"
				).textContent = `${results.wiltingPoint}%`;
				document.getElementById(
					"paw-result"
				).textContent = `${results.plantAvailableWater}%`;
				document.getElementById("texture-result").textContent =
					results.textureClass;
			}
		} catch (error) {
			console.error("Real-time update error:", error);
		}
	}

	/**
	 * Helper methods
	 */

	getHorizonColor(horizonName, organicMatter) {
		const colors = {
			O: `rgba(139, 69, 19, ${Math.min(1, organicMatter / 10)})`, // Brown with OM intensity
			A: `rgba(101, 67, 33, ${Math.min(0.8, organicMatter / 5)})`, // Dark brown
			B: "#CD853F", // Sandy brown
			C: "#D2B48C", // Tan
		};
		return colors[horizonName] || "#DDD";
	}

	getComparisonColor(index, alpha = 1) {
		const colors = [
			`rgba(59, 130, 246, ${alpha})`, // Blue
			`rgba(16, 185, 129, ${alpha})`, // Green
			`rgba(245, 101, 101, ${alpha})`, // Red
			`rgba(251, 191, 36, ${alpha})`, // Yellow
			`rgba(139, 92, 246, ${alpha})`, // Purple
		];
		return colors[index % colors.length];
	}

	addKeyPointsInfo(container, metadata) {
		const infoDiv = document.createElement("div");
		infoDiv.className = "key-points-info";
		infoDiv.innerHTML = `
			<h4>Key Water Retention Points</h4>
			<div class="key-points-grid">
				<div class="key-point">
					<span class="point-label">Saturation:</span>
					<span class="point-value">${metadata.saturation}%</span>
				</div>
				<div class="key-point">
					<span class="point-label">Field Capacity:</span>
					<span class="point-value">${metadata.fieldCapacity}%</span>
				</div>
				<div class="key-point">
					<span class="point-label">Wilting Point:</span>
					<span class="point-value">${metadata.wiltingPoint}%</span>
				</div>
				<div class="key-point">
					<span class="point-label">Available Water:</span>
					<span class="point-value">${metadata.plantAvailableWater}%</span>
				</div>
			</div>
		`;
		container.appendChild(infoDiv);
	}

	addProfileSummary(container, profileData) {
		const summaryDiv = document.createElement("div");
		summaryDiv.className = "profile-summary";
		summaryDiv.innerHTML = `
			<h4>Profile Summary</h4>
			<div class="summary-grid">
				<div class="summary-item">
					<span class="summary-label">Total Depth:</span>
					<span class="summary-value">${profileData.summary.totalDepth} cm</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">Root Zone:</span>
					<span class="summary-value">${profileData.summary.rootZoneDepth} cm</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">Avg. Field Capacity:</span>
					<span class="summary-value">${profileData.summary.averageFieldCapacity}%</span>
				</div>
				<div class="summary-item">
					<span class="summary-label">Avg. Available Water:</span>
					<span class="summary-value">${profileData.summary.averagePlantAvailableWater}%</span>
				</div>
			</div>
		`;
		container.appendChild(summaryDiv);
	}

	addComparisonTable(container, comparisonData) {
		const tableDiv = document.createElement("div");
		tableDiv.className = "comparison-table";

		let tableHTML = `
			<h4>Detailed Comparison</h4>
			<table class="comparison-data-table">
				<thead>
					<tr>
						<th>Parameter</th>
		`;

		comparisonData.analyses.forEach((analysis) => {
			tableHTML += `<th>${analysis.label}</th>`;
		});
		tableHTML += "</tr></thead><tbody>";

		const parameters = [
			"fieldCapacity",
			"wiltingPoint",
			"plantAvailableWater",
			"bulkDensity",
		];
		parameters.forEach((param) => {
			tableHTML += `<tr><td>${this.formatParameterName(param)}</td>`;
			comparisonData.analyses.forEach((analysis) => {
				tableHTML += `<td>${analysis[param] || "--"}</td>`;
			});
			tableHTML += "</tr>";
		});

		tableHTML += "</tbody></table>";
		tableDiv.innerHTML = tableHTML;
		container.appendChild(tableDiv);
	}

	formatParameterName(param) {
		const names = {
			fieldCapacity: "Field Capacity (%)",
			wiltingPoint: "Wilting Point (%)",
			plantAvailableWater: "Available Water (%)",
			bulkDensity: "Bulk Density (g/cm³)",
		};
		return names[param] || param;
	}

	showUpgradePrompt(containerId, featureName) {
		const container = document.getElementById(containerId);
		container.innerHTML = `
			<div class="upgrade-prompt">
				<div class="upgrade-content">
					<h3>🚀 ${featureName}</h3>
					<p>This advanced visualization feature is available for Professional+ users.</p>
					<button class="upgrade-btn" onclick="window.location.href='profile.html#upgrade'">
						Upgrade to Professional
					</button>
				</div>
			</div>
		`;
	}

	showError(containerId, message) {
		const container = document.getElementById(containerId);
		container.innerHTML = `
			<div class="error-message">
				<p>❌ ${message}</p>
			</div>
		`;
	}

	/**
	 * Destroy chart and cleanup
	 * @param {string} containerId - Container element ID
	 */
	destroyChart(containerId) {
		if (this.charts.has(containerId)) {
			this.charts.get(containerId).destroy();
			this.charts.delete(containerId);
		}
	}

	/**
	 * Cleanup all charts
	 */
	cleanup() {
		this.charts.forEach((chart) => chart.destroy());
		this.charts.clear();
	}
}

// Export for global use
window.VisualizationManager = VisualizationManager;
