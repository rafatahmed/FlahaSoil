/**
 * Advanced Demo JavaScript
 * Handles the advanced visualization demo page functionality including moisture-tension curves,
 * 3D soil profiles, comparative analysis charts, and real-time parameter adjustment
 *
 * @format
 */

// Global variables
let apiClient = null;
let visualizationManager = null;
let currentUser = null;
let demoData = null;

// Demo soil samples
const DEMO_SAMPLES = {
	"agricultural-loam": {
		name: "Agricultural Loam",
		sand: 40,
		silt: 40,
		clay: 20,
		om: 3.5,
		bulkDensity: 1.35,
		rockFragments: 5,
		soilDepth: 100,
		description:
			"Balanced agricultural soil with good water retention and drainage",
	},
	"sandy-soil": {
		name: "Sandy Soil",
		sand: 85,
		silt: 10,
		clay: 5,
		om: 1.2,
		bulkDensity: 1.55,
		rockFragments: 3,
		soilDepth: 120,
		description: "High drainage, low water retention, quick warming in spring",
	},
	"heavy-clay": {
		name: "Heavy Clay",
		sand: 15,
		silt: 15,
		clay: 70,
		om: 2.8,
		bulkDensity: 1.45,
		rockFragments: 2,
		soilDepth: 80,
		description: "Slow drainage, high nutrient retention, prone to compaction",
	},
};

// Initialize demo on page load
document.addEventListener("DOMContentLoaded", function () {
	initializeDemo();
});

/**
 * Initialize the advanced demo page
 */
async function initializeDemo() {
	// Initialize API client
	apiClient = new FlahaSoilAPI();

	// Initialize visualization manager
	visualizationManager = new VisualizationManager(apiClient);

	// Check authentication status
	checkAuthStatus();

	// Set default demo data
	setDemoSample("agricultural-loam");

	// Set up event listeners
	setupEventListeners();
}

/**
 * Check if user is authenticated
 */
function checkAuthStatus() {
	const token = localStorage.getItem("flahasoil_token");
	const user = localStorage.getItem("flahasoil_user");
	if (token && user) {
		try {
			currentUser = JSON.parse(user);
			updateUserInterface(true);
			// Token is automatically read by FlahaSoilAPI from localStorage
		} catch (error) {
			console.error("Error parsing user data:", error);
			currentUser = null;
			updateUserInterface(false);
		}
	} else {
		updateUserInterface(false);
	}
}

/**
 * Update UI based on authentication status
 */
function updateUserInterface(isAuthenticated) {
	const userInfo = document.getElementById("user-info");
	const authBtn = document.getElementById("auth-btn");
	const planStatus = document.getElementById("plan-status");

	if (isAuthenticated && currentUser) {
		// Update user info display
		userInfo.textContent = currentUser.email;
		authBtn.textContent = "Sign Out";
		authBtn.onclick = handleSignOut;

		// Update plan status
		if (currentUser.plan && currentUser.plan.toLowerCase() === "professional") {
			planStatus.innerHTML = `
                <div class="container">
                    <div class="plan-info plan-pro">
                        <span class="plan-badge">Professional</span>
                        <p>You have access to all advanced visualization features!</p>
                    </div>
                </div>
            `;
		} else {
			planStatus.innerHTML = `
                <div class="container">
                    <div class="plan-info plan-basic">
                        <span class="plan-badge">Basic</span>
                        <p>Upgrade to Professional to access these advanced features!</p>
                        <button id="upgrade-btn" class="btn btn-highlight">Upgrade Now</button>
                    </div>
                </div>
            `;
			// Add upgrade button listener
			document
				.getElementById("upgrade-btn")
				.addEventListener("click", function () {
					window.location.href = "profile.html#upgrade";
				});
		}
	} else {
		// Not authenticated
		userInfo.textContent = "";
		authBtn.textContent = "Sign In";
		authBtn.onclick = handleSignIn;

		// Update plan status for demo
		planStatus.innerHTML = `
            <div class="container">
                <div class="plan-info">
                    <span class="plan-badge">Demo Mode</span>
                    <p>Create an account and upgrade to Professional to save analyses and access advanced features!</p>
                    <div class="demo-buttons">
                        <button id="register-btn" class="btn btn-highlight">Create Account</button>
                        <button id="login-btn" class="btn btn-secondary">Sign In</button>
                    </div>
                </div>
            </div>
        `;

		// Add demo mode button listeners
		document
			.getElementById("register-btn")
			.addEventListener("click", function () {
				window.location.href = "landing.html#register";
			});
		document.getElementById("login-btn").addEventListener("click", function () {
			window.location.href = "landing.html#login";
		});
	}
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
	// Tab switching
	document.querySelectorAll(".tab-btn").forEach((btn) => {
		btn.addEventListener("click", function () {
			switchTab(this.getAttribute("data-tab"));
		});
	});

	// Sample selection
	document
		.getElementById("soil-type-select")
		.addEventListener("change", function () {
			setDemoSample(this.value);
		});

	// Analysis button
	document.getElementById("analyze-btn").addEventListener("click", function () {
		runEnhancedAnalysis();
	});

	// Compare button
	document.getElementById("compare-btn").addEventListener("click", function () {
		runComparativeAnalysis();
	});
}

/**
 * Set the demo sample data
 */
function setDemoSample(sampleKey) {
	demoData = DEMO_SAMPLES[sampleKey];

	// Update sample display
	document.getElementById("sample-name").textContent = demoData.name;
	document.getElementById("sand-value").textContent = `${demoData.sand}%`;
	document.getElementById("clay-value").textContent = `${demoData.clay}%`;
	document.getElementById("silt-value").textContent = `${demoData.silt}%`;
	document.getElementById("om-value").textContent = `${demoData.om}%`;
	document.getElementById(
		"bulk-density-value"
	).textContent = `${demoData.bulkDensity} g/cm³`;
	document.getElementById("sample-description").textContent =
		demoData.description;

	// Clear visualizations
	clearVisualizations();
}

/**
 * Clear all visualization containers
 */
function clearVisualizations() {
	document.getElementById("moisture-tension-chart").innerHTML = "";
	document.getElementById("soil-profile-3d").innerHTML = "";
	document.getElementById("comparison-chart").innerHTML = "";
	document.getElementById("realtime-adjustment").innerHTML = "";
}

/**
 * Run enhanced soil analysis with visualizations
 */
async function runEnhancedAnalysis() {
	// Show loading state
	showLoadingState();

	try {
		// Encode sample data for API
		const encodedData = btoa(JSON.stringify(demoData));

		// Generate moisture tension curve
		await generateMoistureTensionCurve(encodedData);

		// Generate 3D soil profile
		await generate3DSoilProfile(encodedData);

		// Setup real-time adjustment
		setupRealtimeAdjustment();
	} catch (error) {
		console.error("Error running enhanced analysis:", error);
		alert("Error running enhanced analysis. Please try again.");
	} finally {
		// Hide loading state
		hideLoadingState();
	}
}

/**
 * Run comparative soil analysis
 */
async function runComparativeAnalysis() {
	// Show loading state
	showLoadingState();

	try {
		// Generate comparison chart using all demo samples
		const samples = Object.values(DEMO_SAMPLES);
		await generateComparisonChart(samples);

		// Switch to comparison tab
		switchTab("comparison");
	} catch (error) {
		console.error("Error running comparative analysis:", error);
		alert("Error running comparative analysis. Please try again.");
	} finally {
		// Hide loading state
		hideLoadingState();
	}
}

/**
 * Generate moisture-tension curve visualization
 */
async function generateMoistureTensionCurve(encodedData) {
	const container = document.getElementById("moisture-tension-chart");
	container.innerHTML = '<canvas id="moisture-tension-canvas"></canvas>';
	try {
		// Call API for moisture tension data (demo endpoint)
		const response = await apiClient.getMoistureTensionCurveDemo(encodedData);

		if (response && response.data) {
			// Transform API response data for Chart.js
			const tensions = response.data.map((point) => point.tension);
			const moistureContents = response.data.map(
				(point) => point.moistureContent
			);

			const ctx = document
				.getElementById("moisture-tension-canvas")
				.getContext("2d");

			// Create chart
			new Chart(ctx, {
				type: "line",
				data: {
					labels: tensions,
					datasets: [
						{
							label: "Volumetric Water Content",
							data: moistureContents,
							borderColor: "rgba(54, 162, 235, 1)",
							backgroundColor: "rgba(54, 162, 235, 0.2)",
							borderWidth: 2,
							fill: true,
							tension: 0.4,
						},
					],
				},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					scales: {
						x: {
							title: {
								display: true,
								text: "Matric Potential (kPa)",
							},
							type: "logarithmic",
						},
						y: {
							title: {
								display: true,
								text: "Volumetric Water Content (%)",
							},
							min: 0,
							max: 60,
						},
					},
					plugins: {
						tooltip: {
							callbacks: {
								label: function (context) {
									return `Water content: ${context.raw.toFixed(2)}%`;
								},
							},
						},
						annotation: {
							annotations: {
								fcLine: {
									type: "line",
									xMin: response.data.fieldCapacity,
									xMax: response.data.fieldCapacity,
									borderColor: "rgba(46, 204, 113, 1)",
									borderWidth: 2,
									label: {
										content: "Field Capacity",
										enabled: true,
									},
								},
								wpLine: {
									type: "line",
									xMin: response.data.wiltingPoint,
									xMax: response.data.wiltingPoint,
									borderColor: "rgba(231, 76, 60, 1)",
									borderWidth: 2,
									label: {
										content: "Wilting Point",
										enabled: true,
									},
								},
							},
						},
					},
				},
			});

			// Switch to moisture curve tab
			switchTab("moisture-curve");
		}
	} catch (error) {
		console.error("Error generating moisture tension curve:", error);
		container.innerHTML =
			'<div class="error-message">Failed to generate moisture tension curve</div>';
	}
}

/**
 * Generate 3D soil profile visualization
 */
async function generate3DSoilProfile(encodedData) {
	const container = document.getElementById("soil-profile-3d");
	container.innerHTML = "";
	try {
		// Call API for 3D profile data (demo endpoint)
		const response = await apiClient.getSoilProfile3DDemo(encodedData);

		if (response && response.data) {
			// Create Three.js scene
			const width = container.clientWidth;
			const height = 400;

			const scene = new THREE.Scene();
			scene.background = new THREE.Color(0xf5f5f5);

			const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
			camera.position.set(0, 10, 20);

			const renderer = new THREE.WebGLRenderer({ antialias: true });
			renderer.setSize(width, height);
			container.appendChild(renderer.domElement);

			// Add lights
			const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
			scene.add(ambientLight);

			const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
			directionalLight.position.set(10, 20, 10);
			scene.add(directionalLight);

			// Add controls
			const controls = new THREE.OrbitControls(camera, renderer.domElement);
			controls.enableDamping = true;
			controls.dampingFactor = 0.25;

			// Create soil layers from API data
			const layers = response.data.layers;
			const totalDepth = response.data.totalDepth;
			const layerGroup = new THREE.Group();

			let currentDepth = 0;
			layers.forEach((layer) => {
				const layerHeight = (layer.thickness / totalDepth) * 15; // Scale to 15 units
				const layerGeometry = new THREE.BoxGeometry(10, layerHeight, 10);

				// Convert color from hex string to THREE color
				const layerMaterial = new THREE.MeshLambertMaterial({
					color: new THREE.Color(layer.color),
					transparent: true,
					opacity: 0.9,
				});

				const layerMesh = new THREE.Mesh(layerGeometry, layerMaterial);

				// Position layer (y is up in Three.js)
				layerMesh.position.y = -currentDepth - layerHeight / 2;
				currentDepth += layerHeight;

				// Add metadata for tooltip
				layerMesh.userData = {
					name: layer.name,
					depth: layer.depth,
					organic: layer.organicMatter,
					texture: layer.texture,
				};

				layerGroup.add(layerMesh);
			});

			// Center layers in scene
			layerGroup.position.y = currentDepth / 2;
			scene.add(layerGroup);

			// Add grid helper
			const gridHelper = new THREE.GridHelper(20, 20);
			scene.add(gridHelper);

			// Animation loop
			function animate() {
				requestAnimationFrame(animate);
				controls.update();
				renderer.render(scene, camera);
			}

			animate();

			// Handle window resize
			window.addEventListener("resize", () => {
				const newWidth = container.clientWidth;
				camera.aspect = newWidth / height;
				camera.updateProjectionMatrix();
				renderer.setSize(newWidth, height);
			});
		}
	} catch (error) {
		console.error("Error generating 3D soil profile:", error);
		container.innerHTML =
			'<div class="error-message">Failed to generate 3D soil profile</div>';
	}
}

/**
 * Generate comparison chart for multiple soil samples
 */
async function generateComparisonChart(samples) {
	const container = document.getElementById("comparison-chart");
	container.innerHTML = '<canvas id="comparison-canvas"></canvas>';

	try {
		// Prepare data for chart
		const labels = [
			"Water Retention",
			"Drainage",
			"Nutrient Capacity",
			"Workability",
			"Organic Matter",
		];

		const datasets = samples.map((sample, index) => {
			// Generate properties based on sample composition
			const waterRetention = calculateWaterRetention(sample);
			const drainage = calculateDrainage(sample);
			const nutrients = calculateNutrientCapacity(sample);
			const workability = calculateWorkability(sample);
			const organicMatter = sample.om;

			// Colors for different datasets
			const colors = [
				"rgba(54, 162, 235, 0.7)",
				"rgba(255, 99, 132, 0.7)",
				"rgba(75, 192, 192, 0.7)",
			];

			return {
				label: sample.name,
				data: [waterRetention, drainage, nutrients, workability, organicMatter],
				backgroundColor: colors[index % colors.length],
				borderColor: colors[index % colors.length].replace("0.7", "1"),
				borderWidth: 1,
			};
		});

		// Create radar chart
		const ctx = document.getElementById("comparison-canvas").getContext("2d");
		new Chart(ctx, {
			type: "radar",
			data: {
				labels: labels,
				datasets: datasets,
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					r: {
						min: 0,
						max: 10,
						ticks: {
							stepSize: 2,
						},
					},
				},
			},
		});
	} catch (error) {
		console.error("Error generating comparison chart:", error);
		container.innerHTML =
			'<div class="error-message">Failed to generate comparison chart</div>';
	}
}

/**
 * Setup real-time parameter adjustment interface
 */
function setupRealtimeAdjustment() {
	const container = document.getElementById("realtime-adjustment");

	// Create adjustment interface
	container.innerHTML = `
        <div class="parameter-sliders">
            <div class="slider-group">
                <label for="sand-slider">Sand: <span id="sand-slider-value">${demoData.sand}%</span></label>
                <input type="range" id="sand-slider" min="0" max="100" value="${demoData.sand}">
            </div>
            <div class="slider-group">
                <label for="clay-slider">Clay: <span id="clay-slider-value">${demoData.clay}%</span></label>
                <input type="range" id="clay-slider" min="0" max="100" value="${demoData.clay}">
            </div>
            <div class="slider-group">
                <label for="om-slider">Organic Matter: <span id="om-slider-value">${demoData.om}%</span></label>
                <input type="range" id="om-slider" min="0" max="10" step="0.1" value="${demoData.om}">
            </div>
            <div class="slider-group">
                <label for="bd-slider">Bulk Density: <span id="bd-slider-value">${demoData.bulkDensity} g/cm³</span></label>
                <input type="range" id="bd-slider" min="1.0" max="2.0" step="0.05" value="${demoData.bulkDensity}">
            </div>
        </div>
        <div class="realtime-results">
            <div id="texture-class" class="result-item">
                <h4>Soil Texture Class</h4>
                <div id="texture-value">Loading...</div>
            </div>
            <div id="water-capacity" class="result-item">
                <h4>Available Water</h4>
                <div id="water-value">Loading...</div>
            </div>
            <div id="infiltration" class="result-item">
                <h4>Infiltration Rate</h4>
                <div id="infiltration-value">Loading...</div>
            </div>
        </div>
    `;

	// Add event listeners to sliders
	const sandSlider = document.getElementById("sand-slider");
	const claySlider = document.getElementById("clay-slider");
	const omSlider = document.getElementById("om-slider");
	const bdSlider = document.getElementById("bd-slider");

	// Debounced update function
	const updateResults = debounce(function () {
		// Update display values
		document.getElementById(
			"sand-slider-value"
		).textContent = `${sandSlider.value}%`;
		document.getElementById(
			"clay-slider-value"
		).textContent = `${claySlider.value}%`;
		document.getElementById(
			"om-slider-value"
		).textContent = `${omSlider.value}%`;
		document.getElementById(
			"bd-slider-value"
		).textContent = `${bdSlider.value} g/cm³`;

		// Calculate silt (ensuring components sum to 100%)
		const sand = parseInt(sandSlider.value);
		const clay = parseInt(claySlider.value);
		let silt = 100 - sand - clay;

		// Validate components
		if (silt < 0) {
			alert("Invalid combination: Sand + Clay cannot exceed 100%");
			return;
		}

		// Create adjusted soil data
		const adjustedData = {
			...demoData,
			sand: sand,
			clay: clay,
			silt: silt,
			om: parseFloat(omSlider.value),
			bulkDensity: parseFloat(bdSlider.value),
		};

		// Update results
		updateRealtimeResults(adjustedData);
	}, 300);

	// Add event listeners
	sandSlider.addEventListener("input", updateResults);
	claySlider.addEventListener("input", updateResults);
	omSlider.addEventListener("input", updateResults);
	bdSlider.addEventListener("input", updateResults);

	// Initial update
	updateResults();
}

/**
 * Update realtime results based on adjusted parameters
 */
async function updateRealtimeResults(soilData) {
	try {
		// Calculate texture class
		const textureClass = calculateTextureClass(soilData.sand, soilData.clay);
		document.getElementById("texture-value").textContent = textureClass;

		// Calculate available water
		const awc = calculateAvailableWater(soilData);
		document.getElementById("water-value").textContent = `${awc.toFixed(
			2
		)} cm³/cm³`;

		// Calculate infiltration rate
		const infiltration = calculateInfiltrationRate(soilData);
		document.getElementById(
			"infiltration-value"
		).textContent = `${infiltration.toFixed(2)} mm/hr`;
	} catch (error) {
		console.error("Error updating realtime results:", error);
	}
}

/**
 * Calculate soil texture class based on USDA classification
 */
function calculateTextureClass(sand, clay) {
	const silt = 100 - sand - clay;

	// Basic USDA classification
	if (sand >= 85) return "Sand";
	if (sand >= 70 && clay <= 15) return "Loamy Sand";
	if (sand >= 50 && clay >= 35) return "Sandy Clay";
	if (clay >= 40) return "Clay";
	if (clay >= 27 && silt >= 40) return "Silty Clay";
	if (silt >= 80) return "Silt";
	if (clay >= 20 && sand <= 45 && silt >= 40) return "Silty Clay Loam";
	if (clay >= 27 && sand >= 20 && sand <= 45) return "Clay Loam";
	if (clay >= 20 && sand >= 45) return "Sandy Clay Loam";
	if (clay <= 27 && silt >= 50) return "Silt Loam";
	if (clay >= 7 && clay <= 27 && silt >= 28 && silt <= 50 && sand <= 52)
		return "Loam";
	if (clay <= 20 && silt <= 50 && sand >= 43) return "Sandy Loam";

	return "Unknown";
}

/**
 * Calculate available water capacity
 */
function calculateAvailableWater(soilData) {
	// Simplified AWC calculation
	const sand = soilData.sand / 100;
	const clay = soilData.clay / 100;
	const om = soilData.om / 100;
	const bd = soilData.bulkDensity;

	const awc = 0.35 * clay + 0.15 * sand + 2.5 * om - 0.15 * bd;
	return Math.max(0.05, Math.min(0.35, awc));
}

/**
 * Calculate infiltration rate
 */
function calculateInfiltrationRate(soilData) {
	// Simplified infiltration rate based on soil composition
	const sand = soilData.sand / 100;
	const clay = soilData.clay / 100;
	const om = soilData.om / 100;
	const bd = soilData.bulkDensity;

	const baseRate = 15 * sand - 10 * clay + 30 * om - 5 * bd;
	return Math.max(2, Math.min(120, baseRate));
}

/**
 * Calculate water retention score (0-10)
 */
function calculateWaterRetention(soilData) {
	// Higher clay and OM increases water retention
	return Math.min(10, soilData.clay * 0.08 + soilData.om * 0.7 + 2);
}

/**
 * Calculate drainage score (0-10)
 */
function calculateDrainage(soilData) {
	// Higher sand increases drainage
	return Math.min(10, soilData.sand * 0.08 + soilData.om * 0.3 + 2);
}

/**
 * Calculate nutrient capacity score (0-10)
 */
function calculateNutrientCapacity(soilData) {
	// Higher clay and OM increases nutrient capacity
	return Math.min(10, soilData.clay * 0.05 + soilData.om * 0.8 + 2);
}

/**
 * Calculate workability score (0-10)
 */
function calculateWorkability(soilData) {
	// Higher sand and OM increases workability, clay decreases
	return Math.min(
		10,
		soilData.sand * 0.05 + soilData.om * 0.5 - soilData.clay * 0.04 + 5
	);
}

/**
 * Handle sign in button click
 */
function handleSignIn() {
	window.location.href = "landing.html#login";
}

/**
 * Handle sign out button click
 */
function handleSignOut() {
	localStorage.removeItem("flahasoil_token");
	localStorage.removeItem("flahasoil_user");
	currentUser = null;
	updateUserInterface(false);
}

/**
 * Switch between tabs
 */
function switchTab(tabId) {
	// Update tab buttons
	document.querySelectorAll(".tab-btn").forEach((btn) => {
		btn.classList.remove("active");
	});
	document.querySelector(`[data-tab="${tabId}"]`).classList.add("active");

	// Update tab content
	document.querySelectorAll(".tab-content").forEach((content) => {
		content.classList.remove("active");
	});
	document.getElementById(tabId).classList.add("active");
}

/**
 * Show loading state while processing
 */
function showLoadingState() {
	// Disable buttons
	document.getElementById("analyze-btn").disabled = true;
	document.getElementById("compare-btn").disabled = true;
	document.getElementById("soil-type-select").disabled = true;

	// Show loading indicator (assuming there's a loading-indicator element)
	const loadingIndicator = document.createElement("div");
	loadingIndicator.className = "loading-indicator";
	loadingIndicator.innerHTML =
		'<div class="spinner"></div><p>Processing...</p>';
	document.querySelector(".demo-controls").appendChild(loadingIndicator);
}

/**
 * Hide loading state after processing
 */
function hideLoadingState() {
	// Re-enable buttons
	document.getElementById("analyze-btn").disabled = false;
	document.getElementById("compare-btn").disabled = false;
	document.getElementById("soil-type-select").disabled = false;

	// Remove loading indicator
	const loadingIndicator = document.querySelector(".loading-indicator");
	if (loadingIndicator) {
		loadingIndicator.remove();
	}
}

/**
 * Debounce function for limiting frequent updates
 */
function debounce(func, wait) {
	let timeout;
	return function (...args) {
		clearTimeout(timeout);
		timeout = setTimeout(() => func.apply(this, args), wait);
	};
}
