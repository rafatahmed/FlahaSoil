/**
 * UI Update Functions for FlahaSoil
 * Handles updating quality overview, visualization, and recommendations containers
 *
 * @format
 */

/**
 * Update quality overview section
 * @param {Object} waterCharacteristics - Soil analysis results
 */
function updateQualityOverview(waterCharacteristics) {
	try {
		// Calculate soil quality score (0-10)
		const qualityScore = calculateSoilQualityScore(waterCharacteristics);

		// Update quality score display
		const scoreElement = document.getElementById("soil-quality-score");
		if (scoreElement) {
			scoreElement.textContent = qualityScore.toFixed(1);
		}

		// Update quality indicators
		updateQualityIndicator(
			"drainage-class",
			getDrainageClass(waterCharacteristics)
		);
		updateQualityIndicator(
			"compaction-risk",
			getCompactionRisk(waterCharacteristics)
		);
		updateQualityIndicator(
			"erosion-risk",
			getErosionRisk(waterCharacteristics)
		);
	} catch (error) {
		console.error("Error updating quality overview:", error);
	}
}

/**
 * Update visualization container with water levels
 * @param {Object} waterCharacteristics - Soil analysis results
 */
function updateVisualizationContainer(waterCharacteristics) {
	try {
		const container = document.querySelector(".visualization-container");
		if (!container) return;

		// Update water level positions based on calculated values
		const saturation = parseFloat(waterCharacteristics.saturation) || 0;
		const fieldCapacity = parseFloat(waterCharacteristics.fieldCapacity) || 0;
		const wiltingPoint = parseFloat(waterCharacteristics.wiltingPoint) || 0;

		// Update water level elements
		updateWaterLevel("saturation-level", saturation);
		updateWaterLevel("field-capacity-level", fieldCapacity);
		updateWaterLevel("wilting-point-level", wiltingPoint);

		// Update water zones
		updateWaterZones(saturation, fieldCapacity, wiltingPoint);
	} catch (error) {
		console.error("Error updating visualization container:", error);
	}
}

/**
 * Update recommendations container
 * @param {Object} waterCharacteristics - Soil analysis results
 */
function updateRecommendationsContainer(waterCharacteristics) {
	try {
		// Generate recommendations based on soil characteristics
		const recommendations = generateSoilRecommendations(waterCharacteristics);

		// Update suitable crops list
		updateRecommendationList(
			"suitable-crops-list",
			recommendations.suitableCrops
		);

		// Update limitations list
		updateRecommendationList("limitations-list", recommendations.limitations);

		// Update management tips list
		updateRecommendationList(
			"management-tips-list",
			recommendations.managementTips
		);
	} catch (error) {
		console.error("Error updating recommendations container:", error);
	}
}

/**
 * Calculate soil quality score based on water characteristics
 * @param {Object} waterCharacteristics - Soil analysis results
 * @returns {number} Quality score (0-10)
 */
function calculateSoilQualityScore(waterCharacteristics) {
	const paw = parseFloat(waterCharacteristics.plantAvailableWater) || 0;
	const conductivity =
		parseFloat(waterCharacteristics.saturatedConductivity) || 0;

	// Simple scoring algorithm (can be enhanced)
	let score = 5; // Base score

	// PAW contribution (0-4 points)
	if (paw > 15) score += 2;
	else if (paw > 10) score += 1;
	else if (paw < 5) score -= 1;

	// Conductivity contribution (0-3 points)
	if (conductivity > 10 && conductivity < 100) score += 1.5;
	else if (conductivity < 1 || conductivity > 500) score -= 1;

	return Math.max(0, Math.min(10, score));
}

/**
 * Get drainage class based on soil characteristics
 * @param {Object} waterCharacteristics - Soil analysis results
 * @returns {string} Drainage class
 */
function getDrainageClass(waterCharacteristics) {
	const conductivity =
		parseFloat(waterCharacteristics.saturatedConductivity) || 0;

	if (conductivity > 100) return "Excellent";
	if (conductivity > 50) return "Good";
	if (conductivity > 10) return "Moderate";
	if (conductivity > 1) return "Poor";
	return "Very Poor";
}

/**
 * Get compaction risk based on soil characteristics
 * @param {Object} waterCharacteristics - Soil analysis results
 * @returns {string} Compaction risk level
 */
function getCompactionRisk(waterCharacteristics) {
	const clay = parseFloat(document.getElementById("clay-input")?.value) || 0;
	const om = parseFloat(document.getElementById("om-input")?.value) || 0;

	if (clay > 40 && om < 2) return "High";
	if (clay > 30 && om < 3) return "Moderate";
	return "Low";
}

/**
 * Get erosion risk based on soil characteristics
 * @param {Object} waterCharacteristics - Soil analysis results
 * @returns {string} Erosion risk level
 */
function getErosionRisk(waterCharacteristics) {
	const sand = parseFloat(document.getElementById("sand-input")?.value) || 0;
	const om = parseFloat(document.getElementById("om-input")?.value) || 0;

	if (sand > 70 && om < 2) return "High";
	if (sand > 50 && om < 3) return "Moderate";
	return "Low";
}

/**
 * Update quality indicator display
 * @param {string} elementId - Element ID
 * @param {string} value - Indicator value
 */
function updateQualityIndicator(elementId, value) {
	const element = document.getElementById(elementId);
	if (element) {
		element.textContent = value;
		element.className = `indicator-value ${value
			.toLowerCase()
			.replace(" ", "-")}`;
	}
}

/**
 * Update water level display
 * @param {string} className - Water level class name
 * @param {number} percentage - Water percentage
 */
function updateWaterLevel(className, percentage) {
	const element = document.querySelector(`.${className}`);
	if (element) {
		// Update position based on percentage (simplified)
		const position = Math.max(10, Math.min(90, 100 - percentage));
		element.style.bottom = `${position}%`;
	}
}

/**
 * Update water zones display
 * @param {number} saturation - Saturation percentage
 * @param {number} fieldCapacity - Field capacity percentage
 * @param {number} wiltingPoint - Wilting point percentage
 */
function updateWaterZones(saturation, fieldCapacity, wiltingPoint) {
	// Update gravitational zone
	const gravitationalZone = document.querySelector(".gravitational-zone");
	if (gravitationalZone) {
		const height = Math.max(0, saturation - fieldCapacity);
		gravitationalZone.style.height = `${height}%`;
	}

	// Update available zone
	const availableZone = document.querySelector(".available-zone");
	if (availableZone) {
		const height = Math.max(0, fieldCapacity - wiltingPoint);
		availableZone.style.height = `${height}%`;
	}

	// Update unavailable zone
	const unavailableZone = document.querySelector(".unavailable-zone");
	if (unavailableZone) {
		unavailableZone.style.height = `${wiltingPoint}%`;
	}
}

/**
 * Generate soil recommendations based on characteristics
 * @param {Object} waterCharacteristics - Soil analysis results
 * @returns {Object} Recommendations object
 */
function generateSoilRecommendations(waterCharacteristics) {
	const textureClass = waterCharacteristics.textureClass || "Unknown";
	const paw = parseFloat(waterCharacteristics.plantAvailableWater) || 0;

	const recommendations = {
		suitableCrops: [],
		limitations: [],
		managementTips: [],
	};

	// Generate recommendations based on texture class
	switch (textureClass.toLowerCase()) {
		case "clay":
		case "clay loam":
			recommendations.suitableCrops = ["Rice", "Wheat", "Soybeans", "Cotton"];
			recommendations.limitations = [
				"Poor drainage",
				"Compaction risk",
				"Slow water infiltration",
			];
			recommendations.managementTips = [
				"Add organic matter",
				"Avoid working when wet",
				"Install drainage",
			];
			break;
		case "sand":
		case "sandy loam":
			recommendations.suitableCrops = [
				"Carrots",
				"Potatoes",
				"Peanuts",
				"Watermelon",
			];
			recommendations.limitations = [
				"Low water retention",
				"Nutrient leaching",
				"Erosion risk",
			];
			recommendations.managementTips = [
				"Frequent irrigation",
				"Cover crops",
				"Organic amendments",
			];
			break;
		case "loam":
		case "silt loam":
			recommendations.suitableCrops = [
				"Corn",
				"Tomatoes",
				"Beans",
				"Most vegetables",
			];
			recommendations.limitations = ["Generally good soil"];
			recommendations.managementTips = [
				"Maintain organic matter",
				"Regular soil testing",
				"Crop rotation",
			];
			break;
		default:
			recommendations.suitableCrops = ["Consult local extension service"];
			recommendations.limitations = ["Soil analysis needed"];
			recommendations.managementTips = ["Get detailed soil test"];
	}

	return recommendations;
}

/**
 * Update recommendation list display
 * @param {string} listId - List element ID
 * @param {Array} items - List items
 */
function updateRecommendationList(listId, items) {
	const listElement = document.getElementById(listId);
	if (listElement && items.length > 0) {
		listElement.innerHTML = items.map((item) => `<li>${item}</li>`).join("");
	}
}

/**
 * Main function to update all display elements with calculated values
 * This was missing from the transition to backend-only API
 * @param {Object} waterCharacteristics - Soil analysis results from API
 * @param {string} userPlan - Current user plan
 */
function updateDisplayElements(waterCharacteristics, userPlan) {
	try {
		// Update basic water characteristics
		const elements = {
			"field-capacity": waterCharacteristics.fieldCapacity,
			"wilting-point": waterCharacteristics.wiltingPoint,
			"plant-available-water": waterCharacteristics.plantAvailableWater,
			saturation: waterCharacteristics.saturation,
			"saturated-conductivity": waterCharacteristics.saturatedConductivity,
		};

		// Update basic elements
		Object.entries(elements).forEach(([id, value]) => {
			const element = document.getElementById(id);
			if (element) {
				element.textContent = value || "-";
			}
		});

		// Update progress bars if they exist
		updateProgressBars(waterCharacteristics);

		// Update soil texture display
		if (waterCharacteristics.textureClass) {
			const textureDisplay = document.getElementById("soil-texture-display");
			if (textureDisplay) {
				textureDisplay.innerHTML = `
					<div class="texture-result">
						<h4>Soil Texture Classification</h4>
						<div class="texture-class">${waterCharacteristics.textureClass}</div>
					</div>
				`;
			}
		}

		// Update the problematic divs that were mentioned
		updateQualityOverview(waterCharacteristics);
		updateVisualizationContainer(waterCharacteristics);
		updateRecommendationsContainer(waterCharacteristics);

		// Update results grid
		updateResultsGrid(waterCharacteristics);

		// Update confidence intervals for expert mode if enabled
		const expertMode = document.getElementById("expertMode");
		if (expertMode && expertMode.checked) {
			showConfidenceIntervals(waterCharacteristics);
		}
	} catch (error) {
		console.error("Error updating display elements:", error);
	}
}

/**
 * Update progress bars with water characteristics
 * @param {Object} waterCharacteristics - Soil analysis results
 */
function updateProgressBars(waterCharacteristics) {
	try {
		const progressBars = [
			{ id: "fc-progress", value: waterCharacteristics.fieldCapacity, max: 50 },
			{ id: "wp-progress", value: waterCharacteristics.wiltingPoint, max: 30 },
			{
				id: "paw-progress",
				value: waterCharacteristics.plantAvailableWater,
				max: 25,
			},
			{ id: "sat-progress", value: waterCharacteristics.saturation, max: 60 },
			{
				id: "ksat-progress",
				value: waterCharacteristics.saturatedConductivity,
				max: 100,
			},
		];

		progressBars.forEach(({ id, value, max }) => {
			const progressBar = document.getElementById(id);
			if (progressBar && value !== undefined) {
				const percentage = Math.min((parseFloat(value) / max) * 100, 100);
				progressBar.style.width = `${percentage}%`;
				progressBar.setAttribute("aria-valuenow", percentage);
			}
		});
	} catch (error) {
		console.error("Error updating progress bars:", error);
	}
}

/**
 * Update results grid with calculated values
 * @param {Object} waterCharacteristics - Soil analysis results
 */
function updateResultsGrid(waterCharacteristics) {
	try {
		const resultsGrid = document.querySelector(".results-grid");
		if (!resultsGrid) return;

		// Ensure results grid is visible
		resultsGrid.style.display = "grid";

		// Update individual result cards
		const resultCards = [
			{
				selector: ".result-card.field-capacity",
				value: waterCharacteristics.fieldCapacity,
				unit: "%",
			},
			{
				selector: ".result-card.wilting-point",
				value: waterCharacteristics.wiltingPoint,
				unit: "%",
			},
			{
				selector: ".result-card.available-water",
				value: waterCharacteristics.plantAvailableWater,
				unit: "%",
			},
			{
				selector: ".result-card.saturation",
				value: waterCharacteristics.saturation,
				unit: "%",
			},
			{
				selector: ".result-card.conductivity",
				value: waterCharacteristics.saturatedConductivity,
				unit: "mm/hr",
			},
		];

		resultCards.forEach(({ selector, value, unit }) => {
			const card = document.querySelector(selector);
			if (card && value !== undefined) {
				const valueElement = card.querySelector(".result-value");
				const unitElement = card.querySelector(".result-unit");

				if (valueElement) {
					valueElement.textContent = parseFloat(value).toFixed(2);
				}
				if (unitElement) {
					unitElement.textContent = unit;
				}
			}
		});
	} catch (error) {
		console.error("Error updating results grid:", error);
	}
}

/**
 * Show confidence intervals for expert mode
 * @param {Object} waterCharacteristics - Soil analysis results
 */
function showConfidenceIntervals(waterCharacteristics) {
	try {
		// Only show if we have confidence interval data
		if (!waterCharacteristics.confidenceIntervals) return;

		const ciContainer = document.getElementById("confidence-intervals");
		if (ciContainer) {
			ciContainer.style.display = "block";

			// Update confidence interval values
			Object.entries(waterCharacteristics.confidenceIntervals).forEach(
				([param, ci]) => {
					const element = document.getElementById(`ci-${param}`);
					if (element && ci) {
						element.textContent = `±${ci.toFixed(2)}`;
					}
				}
			);
		}
	} catch (error) {
		console.error("Error showing confidence intervals:", error);
	}
}
