/** @format */

// Create the USDA soil textural triangle
function createSoilTriangle() {
	// Set up SVG
	const width = 800;
	const height = 700;
	const margin = { top: 100, right: 100, bottom: 100, left: 100 };

	// Clear any existing SVG
	d3.select("#chart-container").html("");

	// Create SVG
	const svg = d3
		.select("#chart-container")
		.append("svg")
		.attr("width", width)
		.attr("height", height);

	// Define triangle points (upward triangle)
	const triangleHeight =
		(Math.sqrt(3) / 2) * (width - margin.left - margin.right);
	const points = [
		[width / 2, margin.top], // Top (Clay 100%)
		[margin.left, height - margin.bottom], // Bottom left (Sand 100%)
		[width - margin.right, height - margin.bottom], // Bottom right (Silt 100%)
	];

	// Draw triangle
	svg
		.append("path")
		.attr(
			"d",
			`M${points[0][0]},${points[0][1]} L${points[1][0]},${points[1][1]} L${points[2][0]},${points[2][1]} Z`
		)
		.attr("stroke", "black")
		.attr("fill", "none")
		.attr("stroke-width", 2);

	// Add vertex labels
	svg
		.append("text")
		.attr("x", points[0][0])
		.attr("y", points[0][1] - 20)
		.attr("text-anchor", "middle")
		.text("100% Clay");

	svg
		.append("text")
		.attr("x", points[1][0] - 20)
		.attr("y", points[1][1] + 20)
		.attr("text-anchor", "end")
		.text("100% Sand");

	svg
		.append("text")
		.attr("x", points[2][0] + 20)
		.attr("y", points[2][1] + 20)
		.attr("text-anchor", "start")
		.text("100% Silt");

	// Define arrowhead marker
	svg
		.append("defs")
		.append("marker")
		.attr("id", "arrowhead")
		.attr("viewBox", "0 -5 10 10")
		.attr("refX", 8)
		.attr("refY", 0)
		.attr("markerWidth", 6)
		.attr("markerHeight", 6)
		.attr("orient", "auto")
		.append("path")
		.attr("d", "M0,-5L10,0L0,5")
		.attr("fill", "black");

	// Add side labels with arrows
	// Left side - Clay percentage (bottom to top)
	const leftMidpoint = [
		(points[0][0] + points[1][0]) / 2,
		(points[0][1] + points[1][1]) / 2,
	];
	svg
		.append("text")
		.attr("x", leftMidpoint[0] - 40)
		.attr("y", leftMidpoint[1])
		.attr("text-anchor", "end")
		.attr(
			"transform",
			`rotate(-60, ${leftMidpoint[0] - 40}, ${leftMidpoint[1]})`
		)
		.text("Clay Separate, %");

	// Add arrow for Clay (aligned with left side, pointing upward)
	const leftSideAngle = Math.atan2(
		points[0][1] - points[1][1],
		points[0][0] - points[1][0]
	);
	const leftArrowLength = 60;
	const leftOffset = 20; // Space between arrow and triangle side
	const leftOffsetX = leftOffset * Math.sin(leftSideAngle);
	const leftOffsetY = -leftOffset * Math.cos(leftSideAngle);

	svg
		.append("path")
		.attr(
			"d",
			`M${
				leftMidpoint[0] -
				(leftArrowLength / 2) * Math.cos(leftSideAngle) +
				leftOffsetX
			},
                 ${
										leftMidpoint[1] -
										(leftArrowLength / 2) * Math.sin(leftSideAngle) +
										leftOffsetY
									}
                 L${
										leftMidpoint[0] +
										(leftArrowLength / 2) * Math.cos(leftSideAngle) +
										leftOffsetX
									},
                 ${
										leftMidpoint[1] +
										(leftArrowLength / 2) * Math.sin(leftSideAngle) +
										leftOffsetY
									}`
		)
		.attr("stroke", "black")
		.attr("marker-end", "url(#arrowhead)");

	// Bottom side - Sand percentage (right to left)
	const bottomMidpoint = [
		(points[1][0] + points[2][0]) / 2,
		(points[1][1] + points[2][1]) / 2,
	];
	svg
		.append("text")
		.attr("x", bottomMidpoint[0])
		.attr("y", bottomMidpoint[1] + 40)
		.attr("text-anchor", "middle")
		.text("Sand Separate, %");

	// Add arrow for Sand (aligned with bottom side, pointing left)
	const bottomArrowLength = 60;
	const bottomOffset = 20; // Space between arrow and triangle side

	svg
		.append("path")
		.attr(
			"d",
			`M${bottomMidpoint[0] + bottomArrowLength / 2},${
				bottomMidpoint[1] + bottomOffset
			}
                 L${bottomMidpoint[0] - bottomArrowLength / 2},${
				bottomMidpoint[1] + bottomOffset
			}`
		)
		.attr("stroke", "black")
		.attr("marker-end", "url(#arrowhead)");

	// Right side - Silt percentage (top to bottom)
	const rightMidpoint = [
		(points[0][0] + points[2][0]) / 2,
		(points[0][1] + points[2][1]) / 2,
	];
	svg
		.append("text")
		.attr("x", rightMidpoint[0] + 40)
		.attr("y", rightMidpoint[1])
		.attr("text-anchor", "start")
		.attr(
			"transform",
			`rotate(60, ${rightMidpoint[0] + 40}, ${rightMidpoint[1]})`
		)
		.text("Silt Separate, %");

	// Add arrow for Silt (aligned with right side, pointing downward)
	const rightSideAngle = Math.atan2(
		points[2][1] - points[0][1],
		points[2][0] - points[0][0]
	);
	const rightArrowLength = 60;
	const rightOffset = 20; // Space between arrow and triangle side
	const rightOffsetX = rightOffset * Math.sin(rightSideAngle);
	const rightOffsetY = -rightOffset * Math.cos(rightSideAngle);

	svg
		.append("path")
		.attr(
			"d",
			`M${
				rightMidpoint[0] -
				(rightArrowLength / 2) * Math.cos(rightSideAngle) +
				rightOffsetX
			},
                 ${
										rightMidpoint[1] -
										(rightArrowLength / 2) * Math.sin(rightSideAngle) +
										rightOffsetY
									}
                 L${
										rightMidpoint[0] +
										(rightArrowLength / 2) * Math.cos(rightSideAngle) +
										rightOffsetX
									},
                 ${
										rightMidpoint[1] +
										(rightArrowLength / 2) * Math.sin(rightSideAngle) +
										rightOffsetY
									}`
		)
		.attr("stroke", "black")
		.attr("marker-end", "url(#arrowhead)");

	// Function to convert percentages to x,y coordinates
	function percentToPoint(clay, sand, silt) {
		// Ensure percentages sum to 100
		const sum = clay + sand + silt;
		const normalizedClay = clay / sum;
		const normalizedSand = sand / sum;
		const normalizedSilt = silt / sum;

		// Calculate position using barycentric coordinates
		const x =
			points[0][0] * normalizedClay +
			points[1][0] * normalizedSand +
			points[2][0] * normalizedSilt;
		const y =
			points[0][1] * normalizedClay +
			points[1][1] * normalizedSand +
			points[2][1] * normalizedSilt;

		return [x, y];
	}

	// Add soil texture regions
	// Load soil texture data
	d3.json("./assets/data/data.json")
		.then(function (soilData) {
			// Define color scale for soil textures
			const colors = d3.schemeCategory10;
			let colorIndex = 0;

			// Create a group for soil regions
			const soilRegions = svg.append("g").attr("class", "soil-regions");

			// Add each soil texture region
			Object.entries(soilData).forEach(([texture, points]) => {
				// Create path for the soil texture region
				const pathData = points
					.map((p) => {
						const [x, y] = percentToPoint(p.clay, p.sand, p.silt);
						return `${x},${y}`;
					})
					.join(" L");

				// Draw the polygon
				soilRegions
					.append("path")
					.attr("d", `M${pathData} Z`)
					.attr("class", "soil-region")
					.attr("fill", colors[colorIndex % colors.length])
					.attr("fill-opacity", 0.6)
					.attr("stroke", "#333")
					.attr("stroke-width", 1)
					.attr("data-texture", texture)
					.on("mouseover", function () {
						d3.select("#soil-texture-display").text(texture.toUpperCase());
					})
					.on("mouseout", function () {
						// Find texture at current point position
						updateSoilTextureDisplay(currentClay, currentSand, currentSilt);
					});

				// Add texture label at centroid
				const centroid = calculateCentroid(points);
				const [cx, cy] = percentToPoint(
					centroid.clay,
					centroid.sand,
					centroid.silt
				);

				soilRegions
					.append("text")
					.attr("x", cx)
					.attr("y", cy)
					.attr("text-anchor", "middle")
					.attr("font-size", "10px")
					.attr("fill", "black")
					.text(texture);

				colorIndex++;
			});

			// Store soil data for later use
			window.soilData = soilData;

			// Initialize with default point
			updateSoilTextureDisplay(33, 33, 34);
		})
		.catch((error) => {
			console.error("Error loading soil data:", error);
		});

	// Function to calculate centroid of a soil texture region
	function calculateCentroid(points) {
		const n = points.length;
		let claySum = 0,
			sandSum = 0,
			siltSum = 0;

		points.forEach((p) => {
			claySum += p.clay;
			sandSum += p.sand;
			siltSum += p.silt;
		});

		return {
			clay: claySum / n,
			sand: sandSum / n,
			silt: siltSum / n,
		};
	}

	// Function to determine soil texture based on percentages
	function getSoilTexture(clay, sand, silt) {
		if (!window.soilData) return "Unknown";

		// Check each soil texture region
		for (const [texture, points] of Object.entries(window.soilData)) {
			if (isPointInPolygon(clay, sand, silt, points)) {
				return texture;
			}
		}

		return "Unknown";
	}

	// Function to check if a point is inside a polygon
	function isPointInPolygon(clay, sand, silt, polygonPoints) {
		// Convert polygon points to 2D coordinates for easier calculation
		// We'll use clay and sand as our 2D coordinates
		const polygon = polygonPoints.map((p) => [p.clay, p.sand]);

		// Ray casting algorithm
		let inside = false;
		for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
			const xi = polygon[i][0],
				yi = polygon[i][1];
			const xj = polygon[j][0],
				yj = polygon[j][1];

			const intersect =
				yi > sand !== yj > sand &&
				clay < ((xj - xi) * (sand - yi)) / (yj - yi) + xi;
			if (intersect) inside = !inside;
		}

		return inside;
	}

	// Add grid lines
	const gridValues = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

	// Clay grid lines (horizontal)
	gridValues.forEach((value) => {
		if (value > 0 && value < 100) {
			const startPoint = percentToPoint(value, 100 - value, 0);
			const endPoint = percentToPoint(value, 0, 100 - value);

			svg
				.append("line")
				.attr("x1", startPoint[0])
				.attr("y1", startPoint[1])
				.attr("x2", endPoint[0])
				.attr("y2", endPoint[1])
				.attr("stroke", "#ccc")
				.attr("stroke-width", 1);
		}
	});

	// Sand grid lines (bottom-left to top-right)
	gridValues.forEach((value) => {
		if (value > 0 && value < 100) {
			const startPoint = percentToPoint(0, value, 100 - value);
			const endPoint = percentToPoint(100 - value, value, 0);

			svg
				.append("line")
				.attr("x1", startPoint[0])
				.attr("y1", startPoint[1])
				.attr("x2", endPoint[0])
				.attr("y2", endPoint[1])
				.attr("stroke", "#ccc")
				.attr("stroke-width", 1);
		}
	});

	// Silt grid lines (top-right to bottom-left)
	gridValues.forEach((value) => {
		if (value > 0 && value < 100) {
			const startPoint = percentToPoint(0, 100 - value, value);
			const endPoint = percentToPoint(100 - value, 0, value);

			svg
				.append("line")
				.attr("x1", startPoint[0])
				.attr("y1", startPoint[1])
				.attr("x2", endPoint[0])
				.attr("y2", endPoint[1])
				.attr("stroke", "#ccc")
				.attr("stroke-width", 1);
		}
	});

	// Track current values
	let currentClay = 33;
	let currentSand = 33;
	let currentSilt = 34;

	// Add interactive point
	const point = svg
		.append("circle")
		.attr("r", 6)
		.attr("fill", "red")
		.attr("stroke", "black")
		.attr("stroke-width", 1)
		.attr("cx", percentToPoint(currentClay, currentSand, currentSilt)[0])
		.attr("cy", percentToPoint(currentClay, currentSand, currentSilt)[1]);

	// Update coordinates display
	function updateCoordinates(clay, sand, silt) {
		d3.select("#coordinates").text(
			`Clay: ${Math.round(clay)}%, Sand: ${Math.round(
				sand
			)}%, Silt: ${Math.round(silt)}%`
		);

		// Update input fields
		document.getElementById("clay-input").value = Math.round(clay);
		document.getElementById("sand-input").value = Math.round(sand);
		document.getElementById("silt-input").value = Math.round(silt);

		// Get current OM and density values
		const om = parseFloat(document.getElementById("om-input").value);
		const densityFactor = parseFloat(
			document.getElementById("density-input").value
		);

		// Update water characteristics
		updateWaterCharacteristics(
			Math.round(clay),
			Math.round(sand),
			om,
			densityFactor
		);

		// Update soil texture display
		const texture = getSoilTexture(clay, sand, silt);
		d3.select("#soil-texture-display").text(
			`Soil Texture: ${texture.toUpperCase()}`
		);
	}

	// Update soil texture display
	function updateSoilTextureDisplay(clay, sand, silt) {
		const texture = getSoilTexture(clay, sand, silt);
		d3.select("#soil-texture-display").text(
			`Soil Texture: ${texture.toUpperCase()}`
		);
	}

	// Initialize coordinates display
	updateCoordinates(currentClay, currentSand, currentSilt);

	// Add drag behavior
	const drag = d3.drag().on("drag", function (event) {
		// Find closest valid point in triangle
		const [x, y] = [event.x, event.y];

		// Convert to barycentric coordinates
		// This is a simplified approach and may not be perfectly accurate
		const dx1 = x - points[0][0];
		const dy1 = y - points[0][1];
		const dx2 = x - points[1][0];
		const dy2 = y - points[1][1];
		const dx3 = x - points[2][0];
		const dy3 = y - points[2][1];

		// Calculate areas of subtriangles
		const totalArea = Math.abs(
			(points[1][0] - points[0][0]) * (points[2][1] - points[0][1]) -
				(points[2][0] - points[0][0]) * (points[1][1] - points[0][1])
		);

		const area1 = Math.abs(
			(points[1][0] - x) * (points[2][1] - y) -
				(points[2][0] - x) * (points[1][1] - y)
		);
		const area2 = Math.abs(
			(points[0][0] - x) * (points[2][1] - y) -
				(points[2][0] - x) * (points[0][1] - y)
		);
		const area3 = Math.abs(
			(points[0][0] - x) * (points[1][1] - y) -
				(points[1][0] - x) * (points[0][1] - y)
		);

		// Convert to percentages
		const clay = (area1 / totalArea) * 100;
		const sand = (area2 / totalArea) * 100;
		const silt = (area3 / totalArea) * 100;

		// Check if point is inside triangle
		if (
			clay >= 0 &&
			sand >= 0 &&
			silt >= 0 &&
			clay <= 100 &&
			sand <= 100 &&
			silt <= 100 &&
			Math.abs(clay + sand + silt - 100) < 1
		) {
			point.attr("cx", x).attr("cy", y);
			updateCoordinates(clay, sand, silt);
		}
	});

	point.call(drag);

	// Set up input field handlers
	function setupInputHandlers() {
		// Update point from input fields
		document
			.getElementById("update-point")
			.addEventListener("click", function () {
				const clayValue = parseFloat(
					document.getElementById("clay-input").value
				);
				const sandValue = parseFloat(
					document.getElementById("sand-input").value
				);

				// Calculate silt as the remainder
				const siltValue = 100 - clayValue - sandValue;

				// Validate inputs
				if (
					clayValue < 0 ||
					clayValue > 100 ||
					sandValue < 0 ||
					sandValue > 100 ||
					siltValue < 0
				) {
					alert(
						"Invalid values. Clay and sand must be between 0-100, and their sum must not exceed 100."
					);
					return;
				}

				// Update silt input
				document.getElementById("silt-input").value = Math.round(siltValue);

				// Update point position
				const [x, y] = percentToPoint(clayValue, sandValue, siltValue);
				point.attr("cx", x).attr("cy", y);

				// Update coordinates display
				updateCoordinates(clayValue, sandValue, siltValue);
			});

		// Auto-calculate silt when clay or sand changes
		const updateSilt = function () {
			const clayValue =
				parseFloat(document.getElementById("clay-input").value) || 0;
			const sandValue =
				parseFloat(document.getElementById("sand-input").value) || 0;
			const siltValue = 100 - clayValue - sandValue;

			document.getElementById("silt-input").value = Math.max(
				0,
				Math.round(siltValue)
			);
		};

		document.getElementById("clay-input").addEventListener("input", updateSilt);
		document.getElementById("sand-input").addEventListener("input", updateSilt);
	}

	// Set up input handlers when DOM is loaded
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", setupInputHandlers);
	} else {
		setupInputHandlers();
	}
}

// Call the function to create the soil triangle when the page loads
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", createSoilTriangle);
} else {
	createSoilTriangle();
}

// Enhanced function to update water characteristics with advanced parameters
async function updateWaterCharacteristics(clay, sand, om, densityFactor) {
	// Calculate silt
	const silt = 100 - clay - sand;

	// Show loading state
	showLoadingState();

	try {
		// Get all advanced parameters
		const advancedParams = getAdvancedParameters();

		// Check user plan and show plan-specific UI
		const userPlan = window.flahaSoilAPI?.userPlan || "FREE";
		const token = window.flahaSoilAPI?.token;

		// Update plan status in UI
		updatePlanStatusUI(userPlan, token);

		// Prepare calculation parameters
		const calculationParams = {
			sand: sand,
			clay: clay,
			organicMatter: om,
			densityFactor: densityFactor,
			gravelContent: advancedParams.gravelContent,
			electricalConductivity: advancedParams.electricalConductivity,
		};

		// Use API for all calculations
		const response = await window.flahaSoilAPI.analyzeSoil(calculationParams);

		if (!response.success) {
			// Handle different types of errors
			if (response.upgradeRequired) {
				showPlanUpgradePrompt(
					response.error,
					response.requiredPlan,
					response.currentPlan
				);
				return;
			}

			if (response.usageLimitReached) {
				showUsageLimitPrompt(response.error, response.resetDate);
				return;
			}

			if (response.showUpgrade) {
				showUpgradePrompt(response.error);
				return;
			}

			if (response.requiresConnection || response.networkError) {
				showConnectionError(response.error);
				return;
			}

			throw new Error(response.error);
		}

		const waterCharacteristics = response.data;

		// Update usage display
		if (response.usage) {
			updateUsageDisplay(response.usage, userPlan);
		}

		// Show usage information
		if (response.message) {
			showUsageInfo(response.message, response.source);
		}

		// Update all display elements with enhanced data
		updateDisplayElements(waterCharacteristics, userPlan);

		// Update plan-specific sections
		updatePlanSpecificSections(userPlan, waterCharacteristics);

		// Show plan-specific notifications
		showPlanSpecificNotifications(userPlan, response);
	} catch (error) {
		console.error("Error updating water characteristics:", error);
		showErrorMessage(
			"Failed to calculate soil characteristics. Please try again."
		);
	}
}

/**
 * Get advanced parameters from input fields
 * @returns {Object} Advanced parameters
 */
function getAdvancedParameters() {
	return {
		gravelContent: parseFloat(
			document.getElementById("gravel-input")?.value || 0
		),
		electricalConductivity: parseFloat(
			document.getElementById("ec-input")?.value || 0.5
		),
		soilTemperature: parseFloat(
			document.getElementById("soil-temp-input")?.value || 20
		),
		climateZone:
			document.getElementById("climate-zone-input")?.value || "temperate",
		aggregateStability: parseFloat(
			document.getElementById("aggregate-stability-input")?.value || 75
		),
		slope: parseFloat(document.getElementById("slope-input")?.value || 2),
	};
}

/**
 * Update plan status in UI header
 * @param {string} userPlan - Current user plan
 * @param {string} token - Authentication token
 */
function updatePlanStatusUI(userPlan, token) {
	// Update plan badge in header
	let planBadge = document.getElementById("planBadge");
	if (!planBadge && token) {
		planBadge = document.createElement("span");
		planBadge.id = "planBadge";
		planBadge.className = "plan-badge";
		const userSection = document.getElementById("userSection");
		if (userSection) {
			userSection.appendChild(planBadge);
		}
	}

	if (planBadge && token) {
		planBadge.textContent = userPlan;
		planBadge.className = `plan-badge plan-${userPlan.toLowerCase()}`;
	} else if (planBadge && !token) {
		planBadge.remove();
	}

	// Show/hide advanced demo link based on user plan
	const advancedDemoLink = document.getElementById("advancedDemoLink");
	if (advancedDemoLink) {
		if (token && (userPlan === "PROFESSIONAL" || userPlan === "ENTERPRISE")) {
			advancedDemoLink.style.display = "inline-block";
		} else {
			advancedDemoLink.style.display = "none";
		}
	}

	// Update usage counter
	updateUsageCounter();
}

/**
 * Update usage counter display
 */
function updateUsageCounter() {
	const remaining = window.flahaSoilAPI?.getRemainingFreeCalculations();
	const token = window.flahaSoilAPI?.token;

	let usageCounter = document.getElementById("usageCounter");
	if (!usageCounter && !token) {
		usageCounter = document.createElement("div");
		usageCounter.id = "usageCounter";
		usageCounter.className = "usage-counter";
		const authSection = document.getElementById("authSection");
		if (authSection) {
			authSection.appendChild(usageCounter);
		}
	}

	if (usageCounter && !token) {
		if (typeof remaining === "number") {
			usageCounter.innerHTML = `
				<span class="usage-text">Free calculations remaining: <strong>${remaining}</strong></span>
				${remaining <= 10 ? '<span class="usage-warning">⚠️ Low usage</span>' : ""}
			`;
		} else {
			usageCounter.innerHTML = `<span class="usage-text">Free calculations: <strong>Unlimited</strong></span>`;
		}
	} else if (usageCounter && token) {
		usageCounter.remove();
	}
}

/**
 * Update usage display for authenticated users
 * @param {Object} usage - Usage information from API
 * @param {string} userPlan - Current user plan
 */
function updateUsageDisplay(usage, userPlan) {
	let usageDisplay = document.getElementById("usageDisplay");
	if (!usageDisplay) {
		usageDisplay = document.createElement("div");
		usageDisplay.id = "usageDisplay";
		usageDisplay.className = "usage-display";
		const userSection = document.getElementById("userSection");
		if (userSection) {
			userSection.appendChild(usageDisplay);
		}
	}

	if (usage.unlimited) {
		usageDisplay.innerHTML = `
			<span class="usage-text">
				<i class="fas fa-infinity"></i> Unlimited analyses
			</span>
		`;
	} else {
		const percentage = (usage.current / usage.limit) * 100;
		const warningClass = percentage > 80 ? "usage-warning" : "";

		usageDisplay.innerHTML = `
			<div class="usage-info ${warningClass}">
				<span class="usage-text">Usage: ${usage.current}/${usage.limit}</span>
				<div class="usage-bar">
					<div class="usage-progress" style="width: ${percentage}%"></div>
				</div>
				${
					percentage > 80
						? '<span class="usage-warning-text">⚠️ Usage limit approaching</span>'
						: ""
				}
			</div>
		`;
	}
}

/**
 * Show plan-specific upgrade prompt
 * @param {string} message - Error message
 * @param {string} requiredPlan - Required plan for feature
 * @param {string} currentPlan - Current user plan
 */
function showPlanUpgradePrompt(message, requiredPlan, currentPlan) {
	const modal = document.createElement("div");
	modal.className = "upgrade-modal plan-upgrade-modal";

	const planFeatures = {
		PROFESSIONAL: [
			"✓ 1,000 analyses per month",
			"✓ Advanced soil calculations",
			"✓ Analysis history & export",
			"✓ Batch processing",
			"✓ Priority support",
		],
		ENTERPRISE: [
			"✓ Unlimited analyses",
			"✓ All Professional features",
			"✓ API access",
			"✓ Custom integrations",
			"✓ Dedicated support",
		],
	};

	modal.innerHTML = `
		<div class="modal-content upgrade-content">
			<div class="modal-header">
				<h3>Upgrade to ${requiredPlan}</h3>
				<button class="modal-close" onclick="closePlanUpgradeModal()">&times;</button>
			</div>
			<div class="modal-body">
				<p class="upgrade-message">${message}</p>
				<div class="current-plan">
					<span class="plan-label">Current: ${currentPlan}</span>
				</div>
				<div class="upgrade-benefits">
					<h4>With ${requiredPlan} Plan:</h4>
					<ul class="feature-list">
						${(planFeatures[requiredPlan] || [])
							.map((feature) => `<li>${feature}</li>`)
							.join("")}
					</ul>
				</div>
				<div class="pricing-info">
					<div class="price">
						${requiredPlan === "PROFESSIONAL" ? "$19/month" : "Contact us"}
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn-primary" onclick="handlePlanUpgrade('${requiredPlan}')">
					Upgrade to ${requiredPlan}
				</button>
				<button class="btn-secondary" onclick="closePlanUpgradeModal()">
					Continue with ${currentPlan}
				</button>
			</div>
		</div>
	`;

	document.body.appendChild(modal);
}

/**
 * Show usage limit reached prompt
 * @param {string} message - Error message
 * @param {string} resetDate - When usage resets
 */
function showUsageLimitPrompt(message, resetDate) {
	const modal = document.createElement("div");
	modal.className = "upgrade-modal usage-limit-modal";

	const resetDateFormatted = resetDate
		? new Date(resetDate).toLocaleDateString()
		: "next month";

	modal.innerHTML = `
		<div class="modal-content">
			<div class="modal-header">
				<h3>Usage Limit Reached</h3>
				<button class="modal-close" onclick="closeUsageLimitModal()">&times;</button>
			</div>
			<div class="modal-body">
				<div class="limit-icon">📊</div>
				<p class="limit-message">${message}</p>
				<p class="reset-info">Your usage will reset on <strong>${resetDateFormatted}</strong></p>
				<div class="upgrade-options">
					<h4>Get unlimited access:</h4>
					<div class="option-cards">
						<div class="option-card">
							<h5>Professional</h5>
							<div class="option-price">$19/month</div>
							<ul>
								<li>1,000 analyses/month</li>
								<li>Advanced features</li>
								<li>Analysis history</li>
							</ul>
							<button class="btn-outline" onclick="handlePlanUpgrade('PROFESSIONAL')">
								Choose Professional
							</button>
						</div>
						<div class="option-card featured">
							<h5>Enterprise</h5>
							<div class="option-price">Contact us</div>
							<ul>
								<li>Unlimited analyses</li>
								<li>API access</li>
								<li>Priority support</li>
							</ul>
							<button class="btn-primary" onclick="handlePlanUpgrade('ENTERPRISE')">
								Choose Enterprise
							</button>
						</div>
					</div>
				</div>
			</div>
			<div class="modal-footer">
				<button class="btn-secondary" onclick="closeUsageLimitModal()">
					Continue (Limited Access)
				</button>
			</div>
		</div>
	`;

	document.body.appendChild(modal);
}

/**
 * Handle plan upgrade process
 * @param {string} newPlan - Plan to upgrade to
 */
async function handlePlanUpgrade(newPlan) {
	try {
		if (!window.flahaSoilAPI?.token) {
			// User not logged in, show signup with plan selection
			showSignupWithPlan(newPlan);
			return;
		}

		// For existing users, handle upgrade
		const result = await window.flahaSoilAPI.upgradePlan(newPlan);

		if (result.success) {
			showUpgradeSuccessMessage(newPlan);
			closePlanUpgradeModal();
			closeUsageLimitModal();

			// Refresh the page to update UI
			setTimeout(() => {
				location.reload();
			}, 2000);
		} else {
			alert(result.error || "Upgrade failed. Please try again.");
		}
	} catch (error) {
		console.error("Upgrade error:", error);
		alert("Upgrade failed. Please try again.");
	}
}

/**
 * Show signup modal with plan preselected
 * @param {string} selectedPlan - Plan to preselect
 */
function showSignupWithPlan(selectedPlan) {
	closePlanUpgradeModal();
	closeUsageLimitModal();

	const modal = document.createElement("div");
	modal.className = "signup-modal plan-signup-modal";
	modal.innerHTML = `
		<div class="modal-content">
			<h3>Sign Up for FlahaSoil ${selectedPlan}</h3>
			<p>Get started with ${selectedPlan} plan features!</p>
			<form id="signup-form">
				<input type="email" name="email" placeholder="Email" required>
				<input type="password" name="password" placeholder="Password" required>
				<input type="text" name="name" placeholder="Full Name" required>
				<input type="hidden" name="plan" value="${selectedPlan}">
				<button type="submit">Sign Up for ${selectedPlan}</button>
			</form>
			<p><a href="#" onclick="showLoginModal(); closeSignupModal()">Already have an account? Login</a></p>
			<button onclick="closeSignupModal()">Close</button>
		</div>
	`;

	document.body.appendChild(modal);

	// Handle form submission with plan selection
	document
		.getElementById("signup-form")
		.addEventListener("submit", async (e) => {
			e.preventDefault();
			const formData = new FormData(e.target);
			const userData = {
				email: formData.get("email"),
				password: formData.get("password"),
				name: formData.get("name"),
				tier: formData.get("plan"),
			};

			const result = await window.flahaSoilAPI.register(userData);
			if (result.success) {
				showUpgradeSuccessMessage(selectedPlan);
				closeSignupModal();
				setTimeout(() => {
					location.reload();
				}, 2000);
			} else {
				alert(result.error || "Registration failed");
			}
		});
}

/**
 * Show upgrade success message
 * @param {string} newPlan - New plan name
 */
function showUpgradeSuccessMessage(newPlan) {
	const successMessage = document.createElement("div");
	successMessage.className = "success-toast";
	successMessage.innerHTML = `
		<div class="toast-content">
			<span class="toast-icon">🎉</span>
			<span class="toast-message">Successfully upgraded to ${newPlan}!</span>
		</div>
	`;

	document.body.appendChild(successMessage);

	setTimeout(() => {
		successMessage.remove();
	}, 3000);
}

/**
 * Close plan upgrade modal
 */
function closePlanUpgradeModal() {
	const modal = document.querySelector(".plan-upgrade-modal");
	if (modal) modal.remove();
}

/**
 * Close usage limit modal
 */
function closeUsageLimitModal() {
	const modal = document.querySelector(".usage-limit-modal");
	if (modal) modal.remove();
}

/**
 * Update plan-specific sections visibility and content
 * @param {string} userPlan - User plan
 * @param {Object} waterCharacteristics - Calculation results
 */
function updatePlanSpecificSections(userPlan, waterCharacteristics) {
	// Show/hide professional features
	const professionalSection = document.getElementById("professionalFeatures");
	const professionalResults = document.getElementById("professionalResults");

	if (userPlan === "PROFESSIONAL" || userPlan === "ENTERPRISE") {
		if (professionalSection) professionalSection.style.display = "block";
		if (professionalResults) {
			professionalResults.style.display = "block";

			// Update professional results
			if (waterCharacteristics.airEntryTension) {
				document.getElementById("air-entry-tension").textContent =
					waterCharacteristics.airEntryTension;
			}
			if (waterCharacteristics.bulkDensity) {
				document.getElementById("bulk-density").textContent =
					waterCharacteristics.bulkDensity;
			}
			if (waterCharacteristics.lambda) {
				document.getElementById("lambda-value").textContent =
					waterCharacteristics.lambda;
			}
		}
	} else {
		// Hide professional features for free users
		if (professionalSection) professionalSection.style.display = "none";
		if (professionalResults) professionalResults.style.display = "none";
	}

	// Show/hide enterprise features
	const enterpriseResults = document.getElementById("enterpriseResults");
	if (userPlan === "ENTERPRISE" && enterpriseResults) {
		enterpriseResults.style.display = "block";

		// Update enterprise results
		if (waterCharacteristics.plantAvailableWaterBulk) {
			document.getElementById("bulk-paw").textContent =
				waterCharacteristics.plantAvailableWaterBulk;
		}
		if (waterCharacteristics.bulkConductivity) {
			document.getElementById("bulk-conductivity").textContent =
				waterCharacteristics.bulkConductivity;
		}
		if (waterCharacteristics.osmoticPotential) {
			document.getElementById("osmotic-potential").textContent =
				waterCharacteristics.osmoticPotential;
		}
	} else if (enterpriseResults) {
		enterpriseResults.style.display = "none";
	}

	// Add upgrade prompts for disabled features
	addUpgradePrompts(userPlan);
}

/**
 * Add upgrade prompts for features not available in current plan
 * @param {string} userPlan - Current user plan
 */
function addUpgradePrompts(userPlan) {
	// Remove existing upgrade prompts
	document
		.querySelectorAll(".feature-upgrade-prompt")
		.forEach((el) => el.remove());

	if (userPlan === "FREE") {
		// Add prompts for professional features
		const professionalSection = document.getElementById("professionalFeatures");
		if (professionalSection) {
			const prompt = document.createElement("div");
			prompt.className = "feature-upgrade-prompt";
			prompt.innerHTML = `
				<div class="upgrade-overlay">
					<h4>🔒 Professional Features</h4>
					<p>Advanced soil calculations, analysis history, and export capabilities</p>
					<button class="btn-upgrade" onclick="showPlanUpgradePrompt('Unlock Professional features for advanced soil analysis', 'PROFESSIONAL', 'FREE')">
						Upgrade to Professional
					</button>
				</div>
			`;
			professionalSection.appendChild(prompt);
		}

		// Add prompts for enterprise features
		const enterpriseSection = document.getElementById("enterpriseResults");
		if (enterpriseSection) {
			const prompt = document.createElement("div");
			prompt.className = "feature-upgrade-prompt";
			prompt.innerHTML = `
				<div class="upgrade-overlay">
					<h4>🏢 Enterprise Features</h4>
					<p>API access, unlimited analyses, and priority support</p>
					<button class="btn-upgrade" onclick="showPlanUpgradePrompt('Unlock Enterprise features for unlimited access', 'ENTERPRISE', 'FREE')">
						Upgrade to Enterprise
					</button>
				</div>
			`;
			enterpriseSection.appendChild(prompt);
		}
	} else if (userPlan === "PROFESSIONAL") {
		// Add prompts for enterprise features
		const enterpriseSection = document.getElementById("enterpriseResults");
		if (enterpriseSection) {
			const prompt = document.createElement("div");
			prompt.className = "feature-upgrade-prompt";
			prompt.innerHTML = `
				<div class="upgrade-overlay">
					<h4>🏢 Enterprise Only</h4>
					<p>API access and unlimited analyses</p>
					<button class="btn-upgrade" onclick="showPlanUpgradePrompt('Upgrade to Enterprise for unlimited access and API features', 'ENTERPRISE', 'PROFESSIONAL')">
						Upgrade to Enterprise
					</button>
				</div>
			`;
			enterpriseSection.appendChild(prompt);
		}
	}
}

/**
 * Show plan-specific notifications
 * @param {string} userPlan - User plan
 * @param {Object} response - API response
 */
function showPlanSpecificNotifications(userPlan, response) {
	// Show notifications based on plan and response
	if (userPlan === "FREE" && response.usage) {
		const remaining = response.usage.limit - response.usage.current;
		if (remaining <= 10 && remaining > 0) {
			showPlanNotification(
				`⚠️ Only ${remaining} free analyses remaining this month. Upgrade for unlimited access.`,
				"warning",
				() =>
					showPlanUpgradePrompt(
						"Upgrade for unlimited analyses",
						"PROFESSIONAL",
						"FREE"
					)
			);
		}
	}
}

/**
 * Show plan notification banner
 * @param {string} message - Notification message
 * @param {string} type - Notification type (info, warning, success)
 * @param {Function} action - Optional action function
 */
function showPlanNotification(message, type = "info", action = null) {
	// Remove existing notifications
	document.querySelectorAll(".plan-notification").forEach((el) => el.remove());

	const notification = document.createElement("div");
	notification.className = `plan-notification notification-${type}`;
	notification.innerHTML = `
		<div class="notification-content">
			<span class="notification-message">${message}</span>
			${action ? '<button class="notification-action">Learn More</button>' : ""}
			<button class="notification-close">&times;</button>
		</div>
	`;

	// Insert at top of main content
	const mainContent =
		document.querySelector(".results-container") || document.body;
	mainContent.insertBefore(notification, mainContent.firstChild);

	// Add event listeners
	if (action) {
		notification
			.querySelector(".notification-action")
			.addEventListener("click", action);
	}

	notification
		.querySelector(".notification-close")
		.addEventListener("click", () => {
			notification.remove();
		});

	// Auto-hide after 10 seconds
	setTimeout(() => {
		if (notification.parentNode) {
			notification.remove();
		}
	}, 10000);
}

// ...existing code...
