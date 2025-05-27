/**
 * FlahaSoil Demo Page JavaScript
 * Interactive demo with API integration
 * @format
 */

// Demo state
let demoState = {
	isAuthenticated: false,
	userPlan: null,
	currentSample: null,
	analysisResults: null,
};

// Sample soil data for demo
const sampleSoils = [
	{
		id: "loam_sample",
		name: "Agricultural Loam",
		sand: 45,
		clay: 25,
		silt: 30,
		organicMatter: 3.2,
		ph: 6.8,
		region: "central",
	},
	{
		id: "clay_sample",
		name: "Heavy Clay",
		sand: 20,
		clay: 55,
		silt: 25,
		organicMatter: 2.8,
		ph: 7.2,
		region: "northern",
	},
	{
		id: "sandy_sample",
		name: "Sandy Soil",
		sand: 70,
		clay: 15,
		silt: 15,
		organicMatter: 1.5,
		ph: 6.5,
		region: "coastal",
	},
];

// Initialize demo when page loads
document.addEventListener("DOMContentLoaded", function () {
	initializeDemo();
	initializeAPIClient();
	setupEventListeners();
	loadInitialData();
});

/**
 * Initialize API client for demo
 */
function initializeAPIClient() {
	if (!window.flahaSoilAPI) {
		window.flahaSoilAPI = new FlahaSoilAPI();
	}

	// Check authentication status
	checkAuthStatus();
}

/**
 * Check if user is authenticated and their plan level
 */
async function checkAuthStatus() {
	try {
		const token = localStorage.getItem("token");
		if (token) {
			// Verify token and get user info
			const userInfo = await window.flahaSoilAPI.getCurrentUser();
			if (userInfo && userInfo.success) {
				demoState.isAuthenticated = true;
				demoState.userPlan = userInfo.data.plan;
				updateUIForAuthenticatedUser();
			}
		}
	} catch (error) {
		console.log("User not authenticated, showing demo mode");
		demoState.isAuthenticated = false;
	}

	updateDemoInterface();
}

/**
 * Initialize demo with default values
 */
function initializeDemo() {
	console.log("FlahaSoil Demo initialized");

	// Set default sample
	demoState.currentSample = sampleSoils[0];

	// Show demo notice if not authenticated
	if (!demoState.isAuthenticated) {
		showDemoNotice();
	}
}

/**
 * Setup event listeners for interactive demo
 */
function setupEventListeners() {
	// Sample selector
	const sampleSelector = document.getElementById("sampleSelector");
	if (sampleSelector) {
		sampleSelector.addEventListener("change", handleSampleChange);
	}

	// Calculate button
	const calculateBtn = document.querySelector(".btn-calculate-demo");
	if (calculateBtn) {
		calculateBtn.addEventListener("click", handleCalculateClick);
	}

	// Input fields (for authenticated users)
	const inputs = [
		"sandDemo",
		"clayDemo",
		"siltDemo",
		"organicMatterDemo",
		"phDemo",
	];
	inputs.forEach((inputId) => {
		const input = document.getElementById(inputId);
		if (input) {
			input.addEventListener("input", handleInputChange);
			if (!demoState.isAuthenticated) {
				input.addEventListener("focus", showUpgradePrompt);
			}
		}
	});
}

/**
 * Load initial demo data
 */
async function loadInitialData() {
	// Populate sample selector
	populateSampleSelector();

	// Load default sample data
	loadSampleData(demoState.currentSample);

	// If authenticated, try to load user's recent analysis
	if (demoState.isAuthenticated) {
		try {
			await loadUserRecentAnalysis();
		} catch (error) {
			console.log("No recent analysis found, using sample data");
		}
	}
}

/**
 * Populate the sample selector dropdown
 */
function populateSampleSelector() {
	const selector = document.getElementById("sampleSelector");
	if (!selector) return;

	selector.innerHTML = '<option value="">Select a soil sample...</option>';

	sampleSoils.forEach((sample) => {
		const option = document.createElement("option");
		option.value = sample.id;
		option.textContent = sample.name;
		selector.appendChild(option);
	});

	// Set default selection
	selector.value = demoState.currentSample.id;
}

/**
 * Handle sample selection change
 */
function handleSampleChange(event) {
	const selectedId = event.target.value;
	const sample = sampleSoils.find((s) => s.id === selectedId);

	if (sample) {
		demoState.currentSample = sample;
		loadSampleData(sample);
	}
}

/**
 * Load sample data into form inputs
 */
function loadSampleData(sample) {
	document.getElementById("sandDemo").value = sample.sand;
	document.getElementById("clayDemo").value = sample.clay;
	document.getElementById("siltDemo").value = sample.silt;

	if (document.getElementById("organicMatterDemo")) {
		document.getElementById("organicMatterDemo").value = sample.organicMatter;
	}

	if (document.getElementById("phDemo")) {
		document.getElementById("phDemo").value = sample.ph;
	}
}

/**
 * Handle input changes for authenticated users
 */
function handleInputChange(event) {
	if (!demoState.isAuthenticated) {
		event.target.blur();
		showUpgradePrompt();
		return;
	}

	// Update current sample with new values
	const inputId = event.target.id;
	const value = parseFloat(event.target.value) || 0;

	switch (inputId) {
		case "sandDemo":
			demoState.currentSample.sand = value;
			break;
		case "clayDemo":
			demoState.currentSample.clay = value;
			break;
		case "siltDemo":
			demoState.currentSample.silt = value;
			break;
		case "organicMatterDemo":
			demoState.currentSample.organicMatter = value;
			break;
		case "phDemo":
			demoState.currentSample.ph = value;
			break;
	}

	// Validate percentages add up to 100
	validatePercentages();
}

/**
 * Validate that sand, clay, silt percentages add up to 100
 */
function validatePercentages() {
	const total =
		demoState.currentSample.sand +
		demoState.currentSample.clay +
		demoState.currentSample.silt;
	const tolerance = 1; // Allow 1% tolerance

	const validationMessage = document.getElementById("validationMessage");
	if (validationMessage) {
		if (Math.abs(total - 100) > tolerance) {
			validationMessage.textContent = `Total: ${total.toFixed(
				1
			)}% (should be 100%)`;
			validationMessage.style.color = "#ff6b35";
		} else {
			validationMessage.textContent = `Total: ${total.toFixed(1)}% ✓`;
			validationMessage.style.color = "#28a745";
		}
	}
}

/**
 * Handle calculate button click
 */
async function handleCalculateClick() {
	const button = document.querySelector(".btn-calculate-demo");
	const originalText = button.textContent;

	// Show loading state
	button.textContent = "Analyzing...";
	button.disabled = true;

	try {
		if (demoState.isAuthenticated) {
			// Use real API for authenticated users
			await performRealAnalysis();
		} else {
			// Show demo results for non-authenticated users
			await performDemoAnalysis();
		}
	} catch (error) {
		console.error("Analysis failed:", error);
		showErrorMessage("Analysis failed. Please try again.");
	} finally {
		button.textContent = originalText;
		button.disabled = false;
	}
}

/**
 * Perform real API analysis for authenticated users
 */
async function performRealAnalysis() {
	try {
		const analysisData = {
			sand: demoState.currentSample.sand,
			clay: demoState.currentSample.clay,
			silt: demoState.currentSample.silt,
			organicMatter: demoState.currentSample.organicMatter,
			ph: demoState.currentSample.ph,
			region: demoState.currentSample.region,
		};

		// Call the enhanced analysis API
		const result = await window.flahaSoilAPI.performEnhancedAnalysis(
			analysisData
		);

		if (result && result.success) {
			demoState.analysisResults = result.data;
			displayAnalysisResults(result.data);

			// If user has professional/enterprise plan, show advanced visualizations
			if (
				demoState.userPlan === "PROFESSIONAL" ||
				demoState.userPlan === "ENTERPRISE"
			) {
				await loadAdvancedVisualizations(result.data.id);
			}
		} else {
			throw new Error(result?.message || "Analysis failed");
		}
	} catch (error) {
		console.error("Real analysis error:", error);
		// Fallback to demo analysis
		await performDemoAnalysis();
	}
}

/**
 * Perform demo analysis with simulated results
 */
async function performDemoAnalysis() {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 1500));

	// Generate demo results
	const demoResults = generateDemoResults(demoState.currentSample);
	demoState.analysisResults = demoResults;

	displayAnalysisResults(demoResults);
	generateDemoTriangle();
}

/**
 * Generate demo analysis results
 */
function generateDemoResults(sample) {
	const texture = classifySoilTexture(sample.sand, sample.clay, sample.silt);

	return {
		id: "demo_analysis",
		soilTexture: texture,
		recommendations: generateRecommendations(texture, sample),
		properties: {
			drainageRate: calculateDrainageRate(sample),
			waterHoldingCapacity: calculateWaterHolding(sample),
			nutrientRetention: calculateNutrientRetention(sample),
			workability: calculateWorkability(sample),
		},
		timestamp: new Date().toISOString(),
	};
}

/**
 * Classify soil texture based on sand, clay, silt percentages
 */
function classifySoilTexture(sand, clay, silt) {
	if (clay >= 40) return "Clay";
	if (clay >= 27 && clay < 40 && sand <= 45) return "Clay Loam";
	if (clay >= 27 && clay < 40 && sand > 45) return "Sandy Clay Loam";
	if (clay >= 20 && clay < 27 && silt >= 28 && sand <= 45)
		return "Silty Clay Loam";
	if (clay >= 7 && clay < 20 && silt >= 50) return "Silt Loam";
	if (clay >= 7 && clay < 20 && silt < 50 && sand >= 43) return "Sandy Loam";
	if (clay >= 20 && clay < 35 && silt < 28 && sand > 45) return "Sandy Clay";
	if (silt >= 80) return "Silt";
	if (sand >= 85) return "Sand";
	return "Loam";
}

/**
 * Calculate drainage rate based on soil composition
 */
function calculateDrainageRate(sample) {
	const sandFactor = sample.sand * 0.8;
	const clayFactor = sample.clay * 0.2;
	const rate = (sandFactor - clayFactor) / 100;
	return Math.max(0.1, Math.min(1.0, rate));
}

/**
 * Calculate water holding capacity
 */
function calculateWaterHolding(sample) {
	const clayFactor = sample.clay * 0.6;
	const siltFactor = sample.silt * 0.4;
	const organicFactor = sample.organicMatter * 5;
	const capacity = (clayFactor + siltFactor + organicFactor) / 100;
	return Math.max(0.1, Math.min(1.0, capacity));
}

/**
 * Calculate nutrient retention
 */
function calculateNutrientRetention(sample) {
	const clayFactor = sample.clay * 0.7;
	const organicFactor = sample.organicMatter * 8;
	const retention = (clayFactor + organicFactor) / 100;
	return Math.max(0.1, Math.min(1.0, retention));
}

/**
 * Calculate soil workability
 */
function calculateWorkability(sample) {
	const sandFactor = sample.sand * 0.5;
	const clayPenalty = sample.clay * 0.3;
	const workability = (sandFactor - clayPenalty + 30) / 100;
	return Math.max(0.1, Math.min(1.0, workability));
}

/**
 * Generate recommendations based on soil analysis
 */
function generateRecommendations(texture, sample) {
	const recommendations = [];

	// pH recommendations
	if (sample.ph < 6.0) {
		recommendations.push({
			type: "pH Management",
			priority: "High",
			action: "Apply lime to raise pH to 6.5-7.0 range",
			details: "Current pH is too acidic for most crops",
		});
	} else if (sample.ph > 8.0) {
		recommendations.push({
			type: "pH Management",
			priority: "Medium",
			action: "Consider sulfur application to lower pH",
			details: "High pH may limit nutrient availability",
		});
	}

	// Organic matter recommendations
	if (sample.organicMatter < 2.0) {
		recommendations.push({
			type: "Organic Matter",
			priority: "High",
			action: "Increase organic matter through compost or cover crops",
			details: "Low organic matter affects soil structure and fertility",
		});
	}

	// Texture-specific recommendations
	if (texture.includes("Clay")) {
		recommendations.push({
			type: "Soil Structure",
			priority: "Medium",
			action: "Improve drainage and avoid working when wet",
			details: "Clay soils are prone to compaction and poor drainage",
		});
	} else if (texture.includes("Sand")) {
		recommendations.push({
			type: "Water Management",
			priority: "Medium",
			action: "Increase irrigation frequency and add organic matter",
			details: "Sandy soils drain quickly and have low water retention",
		});
	}

	return recommendations;
}

/**
 * Display analysis results in the UI
 */
function displayAnalysisResults(results) {
	const resultsContainer = document.getElementById("demoResults");
	if (!resultsContainer) return;

	// Show results container
	resultsContainer.style.display = "block";
	resultsContainer.scrollIntoView({ behavior: "smooth" });

	// Update soil texture
	const textureElement = document.getElementById("soilTextureResult");
	if (textureElement) {
		textureElement.textContent = results.soilTexture;
	}

	// Update properties
	if (results.properties) {
		updatePropertyDisplay("drainageRate", results.properties.drainageRate);
		updatePropertyDisplay(
			"waterHoldingCapacity",
			results.properties.waterHoldingCapacity
		);
		updatePropertyDisplay(
			"nutrientRetention",
			results.properties.nutrientRetention
		);
		updatePropertyDisplay("workability", results.properties.workability);
	}

	// Update recommendations
	displayRecommendations(results.recommendations);

	// Add fade-in animation
	resultsContainer.style.animation = "fadeInUp 0.6s ease-out";
}

/**
 * Update property display with progress bars
 */
function updatePropertyDisplay(propertyId, value) {
	const container = document.getElementById(propertyId + "Container");
	if (!container) return;

	const percentage = Math.round(value * 100);
	const progressBar = container.querySelector(".progress-bar");
	const valueText = container.querySelector(".property-value");

	if (progressBar) {
		progressBar.style.width = percentage + "%";
		progressBar.style.backgroundColor = getColorForValue(value);
	}

	if (valueText) {
		valueText.textContent = percentage + "%";
	}
}

/**
 * Get color based on property value (green = good, yellow = medium, red = poor)
 */
function getColorForValue(value) {
	if (value >= 0.7) return "#28a745";
	if (value >= 0.4) return "#ffc107";
	return "#dc3545";
}

/**
 * Display recommendations list
 */
function displayRecommendations(recommendations) {
	const container = document.getElementById("recommendationsContainer");
	if (!container) return;

	container.innerHTML = "";

	if (!recommendations || recommendations.length === 0) {
		container.innerHTML =
			'<p class="text-muted">No specific recommendations at this time.</p>';
		return;
	}

	recommendations.forEach((rec) => {
		const recElement = document.createElement("div");
		recElement.className = "recommendation-item";
		recElement.innerHTML = `
			<div class="rec-header">
				<h5 class="rec-type">${rec.type}</h5>
				<span class="rec-priority priority-${rec.priority.toLowerCase()}">${
			rec.priority
		}</span>
			</div>
			<p class="rec-action"><strong>Action:</strong> ${rec.action}</p>
			<p class="rec-details">${rec.details}</p>
		`;
		container.appendChild(recElement);
	});
}

/**
 * Load advanced visualizations for professional/enterprise users
 */
async function loadAdvancedVisualizations(analysisId) {
	try {
		// Load moisture-tension curve
		const moistureCurve = await window.flahaSoilAPI.getMoistureTensionCurve(
			analysisId
		);
		if (moistureCurve.success) {
			renderMoistureTensionChart(moistureCurve.data);
		}

		// Load 3D soil profile
		const soilProfile = await window.flahaSoilAPI.get3DSoilProfile(analysisId);
		if (soilProfile.success) {
			render3DSoilProfile(soilProfile.data);
		}

		// Show advanced features notice
		showAdvancedFeaturesNotice();
	} catch (error) {
		console.error("Failed to load advanced visualizations:", error);
	}
}

/**
 * Render moisture-tension curve chart
 */
function renderMoistureTensionChart(data) {
	const container = document.getElementById("moistureTensionChart");
	if (!container) return;

	container.style.display = "block";

	// Clear existing content
	container.innerHTML =
		'<h4>Moisture-Tension Curve</h4><div id="moistureChart"></div>';

	const chartContainer = document.getElementById("moistureChart");
	const width = 400;
	const height = 300;
	const margin = { top: 20, right: 30, bottom: 40, left: 50 };

	const svg = d3
		.select("#moistureChart")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	// Create scales
	const xScale = d3
		.scaleLinear()
		.domain(d3.extent(data, (d) => d.tension))
		.range([margin.left, width - margin.right]);

	const yScale = d3
		.scaleLinear()
		.domain(d3.extent(data, (d) => d.moisture))
		.range([height - margin.bottom, margin.top]);

	// Create line generator
	const line = d3
		.line()
		.x((d) => xScale(d.tension))
		.y((d) => yScale(d.moisture))
		.curve(d3.curveMonotoneX);

	// Add axes
	svg
		.append("g")
		.attr("transform", `translate(0,${height - margin.bottom})`)
		.call(d3.axisBottom(xScale));

	svg
		.append("g")
		.attr("transform", `translate(${margin.left},0)`)
		.call(d3.axisLeft(yScale));

	// Add line
	svg
		.append("path")
		.datum(data)
		.attr("fill", "none")
		.attr("stroke", "#2D5430")
		.attr("stroke-width", 2)
		.attr("d", line);

	// Add points
	svg
		.selectAll(".point")
		.data(data)
		.enter()
		.append("circle")
		.attr("class", "point")
		.attr("cx", (d) => xScale(d.tension))
		.attr("cy", (d) => yScale(d.moisture))
		.attr("r", 3)
		.attr("fill", "#FF6B35");
}

/**
 * Render 3D soil profile visualization
 */
function render3DSoilProfile(data) {
	const container = document.getElementById("soilProfile3D");
	if (!container) return;

	container.style.display = "block";
	container.innerHTML = '<h4>3D Soil Profile</h4><div id="profile3D"></div>';

	// Simple 3D representation using CSS transforms
	const profileContainer = document.getElementById("profile3D");
	profileContainer.style.cssText = `
		height: 300px;
		perspective: 800px;
		display: flex;
		align-items: center;
		justify-content: center;
	`;

	data.horizons.forEach((horizon, index) => {
		const layer = document.createElement("div");
		layer.style.cssText = `
			width: 200px;
			height: ${horizon.thickness * 2}px;
			background: ${horizon.color};
			margin: 2px 0;
			border: 1px solid #333;
			transform: rotateX(60deg) rotateY(10deg);
			box-shadow: 0 0 10px rgba(0,0,0,0.3);
			display: flex;
			align-items: center;
			justify-content: center;
			color: white;
			font-weight: bold;
			text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
		`;
		layer.textContent = horizon.name;
		profileContainer.appendChild(layer);
	});
}

/**
 * Update UI for authenticated users
 */
function updateUIForAuthenticatedUser() {
	// Remove demo restrictions
	const inputs = document.querySelectorAll(".demo-input");
	inputs.forEach((input) => {
		input.classList.remove("demo-restricted");
		input.removeAttribute("readonly");
	});

	// Update buttons and labels
	const calculateBtn = document.querySelector(".btn-calculate-demo");
	if (calculateBtn) {
		calculateBtn.textContent = "Analyze Soil";
	}

	// Show authenticated features
	const authFeatures = document.querySelectorAll(".auth-only");
	authFeatures.forEach((feature) => {
		feature.style.display = "block";
	});
}

/**
 * Update demo interface based on authentication status
 */
function updateDemoInterface() {
	const demoNotice = document.querySelector(".demo-notice");

	if (demoState.isAuthenticated) {
		// Hide demo notice for authenticated users
		if (demoNotice) {
			demoNotice.style.display = "none";
		}

		// Enable full functionality
		enableFullFunctionality();
	} else {
		// Show demo notice for non-authenticated users
		if (demoNotice) {
			showDemoNotice();
		}

		// Apply demo restrictions
		applyDemoRestrictions();
	}
}

/**
 * Show demo limitation notice
 */
function showDemoNotice() {
	setTimeout(() => {
		const notice = document.querySelector(".demo-notice");
		if (notice) {
			notice.style.animation = "fadeIn 0.5s ease-in";
			notice.style.display = "block";
		}
	}, 500);
}

/**
 * Enable full functionality for authenticated users
 */
function enableFullFunctionality() {
	const inputs = document.querySelectorAll(".demo-input");
	inputs.forEach((input) => {
		input.removeAttribute("readonly");
		input.classList.remove("demo-restricted");
	});
}

/**
 * Apply demo restrictions for non-authenticated users
 */
function applyDemoRestrictions() {
	const inputs = document.querySelectorAll(".demo-input");
	inputs.forEach((input) => {
		input.addEventListener("focus", handleRestrictedInput);
		input.addEventListener("click", handleRestrictedInput);
	});
}

/**
 * Handle restricted input interactions
 */
function handleRestrictedInput(event) {
	if (!demoState.isAuthenticated) {
		event.target.blur();
		showUpgradePrompt();
	}
}

/**
 * Load user's recent analysis if available
 */
async function loadUserRecentAnalysis() {
	try {
		const recentAnalysis = await window.flahaSoilAPI.getRecentAnalyses();
		if (recentAnalysis.success && recentAnalysis.data.length > 0) {
			const latest = recentAnalysis.data[0];

			// Update current sample with user's data
			demoState.currentSample = {
				id: "user_recent",
				name: "Your Recent Analysis",
				sand: latest.sand,
				clay: latest.clay,
				silt: latest.silt,
				organicMatter: latest.organicMatter || 2.5,
				ph: latest.ph || 7.0,
				region: latest.region || "central",
			};

			loadSampleData(demoState.currentSample);
		}
	} catch (error) {
		console.log("Could not load recent analysis:", error);
	}
}

/**
 * Show advanced features notice for professional users
 */
function showAdvancedFeaturesNotice() {
	const notice = document.createElement("div");
	notice.className = "advanced-features-notice";
	notice.innerHTML = `
		<div class="notice-content">
			<h4>🚀 Advanced Features Active</h4>
			<p>You have access to moisture-tension curves, 3D soil profiles, and comparative analysis!</p>
			<button onclick="this.parentElement.parentElement.remove()" class="btn-close">×</button>
		</div>
	`;

	notice.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: linear-gradient(135deg, #2D5430, #4A7C59);
		color: white;
		padding: 15px;
		border-radius: 10px;
		box-shadow: 0 5px 15px rgba(0,0,0,0.3);
		z-index: 1000;
		max-width: 300px;
		animation: slideInRight 0.5s ease-out;
	`;

	document.body.appendChild(notice);

	// Auto remove after 5 seconds
	setTimeout(() => {
		if (notice.parentNode) {
			notice.remove();
		}
	}, 5000);
}

/**
 * Show error message
 */
function showErrorMessage(message) {
	const errorDiv = document.createElement("div");
	errorDiv.className = "error-message";
	errorDiv.textContent = message;
	errorDiv.style.cssText = `
		position: fixed;
		top: 20px;
		left: 50%;
		transform: translateX(-50%);
		background: #dc3545;
		color: white;
		padding: 10px 20px;
		border-radius: 5px;
		z-index: 1000;
		animation: fadeIn 0.3s ease-out;
	`;

	document.body.appendChild(errorDiv);

	setTimeout(() => {
		if (errorDiv.parentNode) {
			errorDiv.remove();
		}
	}, 3000);
}

/**
 * Generate demo soil triangle visualization
 */
function generateDemoTriangle() {
	const container = document.getElementById("soilTriangle");
	if (!container) return;

	// Clear any existing content
	container.innerHTML = "";

	// Create SVG
	const width = 400;
	const height = 350;

	const svg = d3
		.select("#soilTriangle")
		.append("svg")
		.attr("width", width)
		.attr("height", height)
		.style("background", "#FAFAFA");

	// Triangle points (equilateral triangle)
	const trianglePoints = [
		[width / 2, 50], // Top (Clay)
		[100, height - 50], // Bottom left (Sand)
		[width - 100, height - 50], // Bottom right (Silt)
	];

	// Draw triangle
	svg
		.append("polygon")
		.attr("points", trianglePoints.map((d) => d.join(",")).join(" "))
		.attr("fill", "none")
		.attr("stroke", "#2D5430")
		.attr("stroke-width", 2);

	// Add labels
	svg
		.append("text")
		.attr("x", trianglePoints[0][0])
		.attr("y", trianglePoints[0][1] - 10)
		.attr("text-anchor", "middle")
		.attr("font-weight", "bold")
		.attr("fill", "#2D5430")
		.text("CLAY");

	svg
		.append("text")
		.attr("x", trianglePoints[1][0] - 20)
		.attr("y", trianglePoints[1][1] + 20)
		.attr("text-anchor", "middle")
		.attr("font-weight", "bold")
		.attr("fill", "#2D5430")
		.text("SAND");

	svg
		.append("text")
		.attr("x", trianglePoints[2][0] + 20)
		.attr("y", trianglePoints[2][1] + 20)
		.attr("text-anchor", "middle")
		.attr("font-weight", "bold")
		.attr("fill", "#2D5430")
		.text("SILT");

	// Add demo point
	const sample = demoState.currentSample;
	const demoPoint = calculateTrianglePosition(
		sample.sand,
		sample.clay,
		sample.silt
	);

	svg
		.append("circle")
		.attr("cx", demoPoint.x)
		.attr("cy", demoPoint.y)
		.attr("r", 8)
		.attr("fill", "#FF6B35")
		.attr("stroke", "white")
		.attr("stroke-width", 2);

	// Add demo point label
	const texture = classifySoilTexture(sample.sand, sample.clay, sample.silt);
	svg
		.append("text")
		.attr("x", demoPoint.x)
		.attr("y", demoPoint.y - 15)
		.attr("text-anchor", "middle")
		.attr("font-weight", "bold")
		.attr("fill", "#FF6B35")
		.attr("font-size", "12px")
		.text(texture.toUpperCase());

	// Add percentage labels
	svg
		.append("text")
		.attr("x", demoPoint.x + 15)
		.attr("y", demoPoint.y + 5)
		.attr("font-size", "10px")
		.attr("fill", "#666")
		.text(`${sample.sand}% Sand, ${sample.clay}% Clay, ${sample.silt}% Silt`);
}

/**
 * Calculate position on triangle for given percentages
 */
function calculateTrianglePosition(sand, clay, silt) {
	const width = 400;
	const height = 350;

	// Triangle vertices
	const top = [width / 2, 50]; // Clay (top)
	const left = [100, height - 50]; // Sand (bottom left)
	const right = [width - 100, height - 50]; // Silt (bottom right)

	// Convert percentages to coordinates
	const clayRatio = clay / 100;
	const sandRatio = sand / 100;
	const siltRatio = silt / 100;

	// Calculate position using barycentric coordinates
	const x = left[0] * sandRatio + right[0] * siltRatio + top[0] * clayRatio;
	const y = left[1] * sandRatio + right[1] * siltRatio + top[1] * clayRatio;

	return { x, y };
}
/**
 * Show upgrade prompt when user tries to interact
 */
function showUpgradePrompt() {
	// Don't show if already authenticated
	if (demoState.isAuthenticated) return;

	// Create temporary notification
	const notification = document.createElement("div");
	notification.className = "upgrade-notification";
	notification.innerHTML = `
		<div class="notification-content">
			<h4>🔒 Demo Mode</h4>
			<p>Register to input your own soil data and access all features!</p>
			<div class="notification-buttons">
				<button onclick="window.location.href='./auth.html'" class="btn-primary">Register Now</button>
				<button onclick="this.closest('.upgrade-notification').remove()" class="btn-secondary">Continue Demo</button>
			</div>
		</div>
	`;

	document.body.appendChild(notification);

	// Add styles
	notification.style.cssText = `
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: white;
		padding: 25px;
		border-radius: 15px;
		box-shadow: 0 15px 40px rgba(0,0,0,0.3);
		z-index: 10000;
		text-align: center;
		border: 2px solid #FF6B35;
		animation: popIn 0.3s ease-out;
		max-width: 400px;
		min-width: 300px;
	`;

	// Auto remove after 5 seconds
	setTimeout(() => {
		if (notification.parentNode) {
			notification.remove();
		}
	}, 5000);

	// Add click outside to close
	const backdrop = document.createElement("div");
	backdrop.style.cssText = `
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0,0,0,0.5);
		z-index: 9999;
	`;
	backdrop.addEventListener("click", () => {
		notification.remove();
		backdrop.remove();
	});
	document.body.appendChild(backdrop);
}

/**
 * Navigate back to landing page
 */
function backToLanding() {
	window.location.href = "./landing.html";
}

/**
 * Navigate to advanced demo (for authenticated users)
 */
function goToAdvancedDemo() {
	if (
		demoState.isAuthenticated &&
		(demoState.userPlan === "PROFESSIONAL" ||
			demoState.userPlan === "ENTERPRISE")
	) {
		window.location.href = "./advanced-demo.html";
	} else {
		showUpgradePrompt();
	}
}

// Add CSS animations and styles
const style = document.createElement("style");
style.textContent = `
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}
	
	@keyframes fadeInUp {
		from { 
			opacity: 0; 
			transform: translateY(30px); 
		}
		to { 
			opacity: 1; 
			transform: translateY(0); 
		}
	}
	
	@keyframes popIn {
		from { 
			opacity: 0; 
			transform: translate(-50%, -50%) scale(0.8); 
		}
		to { 
			opacity: 1; 
			transform: translate(-50%, -50%) scale(1); 
		}
	}
	
	@keyframes slideInRight {
		from {
			opacity: 0;
			transform: translateX(100%);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}
	
	.upgrade-notification .notification-content h4 {
		margin: 0 0 10px 0;
		color: #FF6B35;
		font-size: 1.3em;
	}
	
	.upgrade-notification .notification-content p {
		margin: 0 0 20px 0;
		color: #666;
		line-height: 1.5;
	}
	
	.notification-buttons {
		display: flex;
		gap: 10px;
		justify-content: center;
		flex-wrap: wrap;
	}
	
	.btn-primary {
		background: #FF6B35;
		color: white;
		border: none;
		padding: 10px 20px;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 600;
		font-size: 14px;
		transition: background 0.3s ease;
	}
	
	.btn-primary:hover {
		background: #E55A2B;
	}
	
	.btn-secondary {
		background: transparent;
		color: #666;
		border: 1px solid #ddd;
		padding: 10px 20px;
		border-radius: 8px;
		cursor: pointer;
		font-weight: 500;
		font-size: 14px;
		transition: all 0.3s ease;
	}
	
	.btn-secondary:hover {
		background: #f8f9fa;
		border-color: #999;
	}
	
	.recommendation-item {
		background: #f8f9fa;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		padding: 15px;
		margin-bottom: 10px;
	}
	
	.rec-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 10px;
	}
	
	.rec-type {
		margin: 0;
		color: #2D5430;
		font-size: 1.1em;
	}
	
	.rec-priority {
		padding: 4px 12px;
		border-radius: 20px;
		font-size: 0.8em;
		font-weight: 600;
		text-transform: uppercase;
	}
	
	.priority-high {
		background: #dc3545;
		color: white;
	}
	
	.priority-medium {
		background: #ffc107;
		color: #333;
	}
	
	.priority-low {
		background: #28a745;
		color: white;
	}
	
	.rec-action {
		margin: 5px 0;
		color: #495057;
	}
	
	.rec-details {
		margin: 5px 0 0 0;
		color: #6c757d;
		font-style: italic;
		font-size: 0.9em;
	}
	
	.progress-bar {
		height: 100%;
		border-radius: 4px;
		transition: width 0.5s ease, background-color 0.3s ease;
	}
	
	.property-value {
		font-weight: 600;
		color: #2D5430;
	}
	
	.demo-restricted {
		background-color: #f8f9fa !important;
		cursor: not-allowed;
	}
	
	.auth-only {
		display: none;
	}
	
	.advanced-features-notice .notice-content {
		position: relative;
	}
	
	.btn-close {
		position: absolute;
		top: -10px;
		right: -10px;
		background: rgba(255,255,255,0.2);
		border: none;
		color: white;
		width: 25px;
		height: 25px;
		border-radius: 50%;
		cursor: pointer;
		font-size: 16px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.btn-close:hover {
		background: rgba(255,255,255,0.3);
	}
	
	.error-message {
		animation: fadeIn 0.3s ease-out;
	}
	
	#moistureTensionChart,
	#soilProfile3D {
		margin-top: 20px;
		padding: 15px;
		border: 1px solid #e9ecef;
		border-radius: 8px;
		background: white;
	}
	
	#validationMessage {
		font-size: 0.9em;
		margin-top: 5px;
		font-weight: 500;
	}
`;
document.head.appendChild(style);

// Export functions for global access
window.demoFunctions = {
	showUpgradePrompt,
	backToLanding,
	goToAdvancedDemo,
	handleCalculateClick,
};
