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

// Add this function to update the water characteristics display
async function updateWaterCharacteristics(clay, sand, om, densityFactor) {
	// Calculate silt
	const silt = 100 - clay - sand;

	// Show loading state
	showLoadingState();

	try {
		// Use API client for calculations
		const response = await window.flahaSoilAPI.analyzeSoil({
			sand: sand,
			clay: clay,
			organicMatter: om,
			densityFactor: densityFactor,
		});

		if (!response.success) {
			// Handle usage limit exceeded
			if (response.showUpgrade) {
				showUpgradePrompt(response.error);
				return;
			}
			throw new Error(response.error);
		}

		const waterCharacteristics = response.data;

		// Show usage information
		if (response.message) {
			showUsageInfo(response.message, response.source);
		}

		// Update display values
		document.getElementById("field-capacity").textContent =
			waterCharacteristics.fieldCapacity;
		document.getElementById("wilting-point").textContent =
			waterCharacteristics.wiltingPoint;
		document.getElementById("plant-available-water").textContent =
			waterCharacteristics.plantAvailableWater;
		document.getElementById("saturation").textContent =
			waterCharacteristics.saturation;
		document.getElementById("saturated-conductivity").textContent =
			waterCharacteristics.saturatedConductivity;

		// Update progress bars
		// Convert string values to numbers
		const fcValue = parseFloat(waterCharacteristics.fieldCapacity);
		const wpValue = parseFloat(waterCharacteristics.wiltingPoint);
		const pawValue = parseFloat(waterCharacteristics.plantAvailableWater);
		const satValue = parseFloat(waterCharacteristics.saturation);
		const ksValue = parseFloat(waterCharacteristics.saturatedConductivity);

		// Set max values for scaling the progress bars
		const maxFC = 50; // Maximum expected field capacity (%)
		const maxWP = 30; // Maximum expected wilting point (%)
		const maxPAW = 30; // Maximum expected plant available water (%)
		const maxSat = 60; // Maximum expected saturation (%)
		const maxKs = 100; // Maximum expected saturated conductivity (mm/hr)

		// Update progress bar widths
		document.getElementById("field-capacity-bar").style.width = `${Math.min(
			100,
			(fcValue / maxFC) * 100
		)}%`;
		document.getElementById("wilting-point-bar").style.width = `${Math.min(
			100,
			(wpValue / maxWP) * 100
		)}%`;
		document.getElementById(
			"plant-available-water-bar"
		).style.width = `${Math.min(100, (pawValue / maxPAW) * 100)}%`;
		document.getElementById("saturation-bar").style.width = `${Math.min(
			100,
			(satValue / maxSat) * 100
		)}%`;
		document.getElementById(
			"saturated-conductivity-bar"
		).style.width = `${Math.min(100, (ksValue / maxKs) * 100)}%`;

		// Update water visualization
		// Position the water levels based on the values (inverted, since lower in the container = higher percentage)
		const containerHeight = 300; // Height of the water container in pixels

		// Calculate positions (from top of container)
		// We invert the percentages because in the visualization, 0% is at the bottom
		const satPosition =
			containerHeight * (1 - satValue / 100) * 0.9 + containerHeight * 0.1;
		const fcPosition =
			containerHeight * (1 - fcValue / 100) * 0.9 + containerHeight * 0.1;
		const wpPosition =
			containerHeight * (1 - wpValue / 100) * 0.9 + containerHeight * 0.1;

		// Update positions of water levels
		document.querySelector(".saturation-level").style.top = `${satPosition}px`;
		document.querySelector(
			".field-capacity-level"
		).style.top = `${fcPosition}px`;
		document.querySelector(
			".wilting-point-level"
		).style.top = `${wpPosition}px`;

		// Update positions of water zones
		document.querySelector(
			".gravitational-zone"
		).style.top = `${satPosition}px`;
		document.querySelector(".gravitational-zone").style.height = `${
			fcPosition - satPosition
		}px`;

		document.querySelector(".available-zone").style.top = `${fcPosition}px`;
		document.querySelector(".available-zone").style.height = `${
			wpPosition - fcPosition
		}px`;

		document.querySelector(".unavailable-zone").style.top = `${wpPosition}px`;
		document.querySelector(".unavailable-zone").style.height = `${
			containerHeight - wpPosition
		}px`;

		// Update soil water tip based on soil texture
		const soilTip = document.getElementById("soil-water-tip");
		const textureClass = waterCharacteristics.textureClass.toLowerCase();

		if (textureClass.includes("sand") && !textureClass.includes("loam")) {
			soilTip.textContent =
				"Sandy soils drain quickly and hold less plant-available water. Consider more frequent irrigation.";
		} else if (textureClass.includes("clay")) {
			soilTip.textContent =
				"Clay soils hold more total water but may have less plant-available water. Avoid overwatering.";
		} else if (textureClass.includes("silt") || textureClass === "loam") {
			soilTip.textContent =
				"Loamy soils typically have the most plant-available water, providing good growing conditions.";
		} else {
			soilTip.textContent =
				"Balance between sand, silt, and clay affects how much water is available to plants.";
		}

		// Get crop recommendations using API
		const recommendationsResponse =
			await window.flahaSoilAPI.getCropRecommendations({
				textureClass: waterCharacteristics.textureClass,
				paw: parseFloat(waterCharacteristics.plantAvailableWater),
				om: om,
			});

		const recommendations = recommendationsResponse.data;

		// Update the recommendations lists
		const suitableCropsList = document.getElementById("suitable-crops-list");
		const limitationsList = document.getElementById("limitations-list");
		const managementTipsList = document.getElementById("management-tips-list");

		// Clear existing items
		suitableCropsList.innerHTML = "";
		limitationsList.innerHTML = "";
		managementTipsList.innerHTML = "";

		// Add new items
		recommendations.suitableCrops.forEach((crop) => {
			const li = document.createElement("li");
			li.textContent = crop;
			suitableCropsList.appendChild(li);
		});

		recommendations.limitations.forEach((limitation) => {
			const li = document.createElement("li");
			li.textContent = limitation;
			limitationsList.appendChild(li);
		});

		recommendations.managementTips.forEach((tip) => {
			const li = document.createElement("li");
			li.textContent = tip;
			managementTipsList.appendChild(li);
		});
	} catch (error) {
		console.error("Error updating water characteristics:", error);
		// Show error message to user
		showErrorMessage(
			"Failed to calculate soil characteristics. Please try again."
		);
	}
}

// Add event listeners for the new inputs
document.addEventListener("DOMContentLoaded", function () {
	// Existing code...

	// Add event listeners for OM and density inputs
	document.getElementById("om-input").addEventListener("input", function () {
		const clayValue = parseFloat(document.getElementById("clay-input").value);
		const sandValue = parseFloat(document.getElementById("sand-input").value);
		const siltValue = 100 - clayValue - sandValue;
		const om = parseFloat(this.value);
		const densityFactor = parseFloat(
			document.getElementById("density-input").value
		);

		updateWaterCharacteristics(clayValue, sandValue, om, densityFactor);
	});

	document
		.getElementById("density-input")
		.addEventListener("input", function () {
			const clayValue = parseFloat(document.getElementById("clay-input").value);
			const sandValue = parseFloat(document.getElementById("sand-input").value);
			const siltValue = 100 - clayValue - sandValue;
			const om = parseFloat(document.getElementById("om-input").value);
			const densityFactor = parseFloat(this.value);

			updateWaterCharacteristics(clayValue, sandValue, om, densityFactor);
		});

	// Initialize water characteristics display
	const initialClay = 33;
	const initialSand = 33;
	const initialOM = 2.5;
	const initialDensity = 1.0;
	updateWaterCharacteristics(
		initialClay,
		initialSand,
		initialOM,
		initialDensity
	);
});

// Helper functions for API integration
function showLoadingState() {
	const loadingElements = [
		"field-capacity",
		"wilting-point",
		"plant-available-water",
		"saturation",
		"saturated-conductivity",
	];

	loadingElements.forEach((id) => {
		document.getElementById(id).textContent = "...";
	});
}

function showUsageInfo(message, source) {
	// Create or update usage info display
	let usageInfo = document.getElementById("usage-info");
	if (!usageInfo) {
		usageInfo = document.createElement("div");
		usageInfo.id = "usage-info";
		usageInfo.className = "usage-info";
		document
			.querySelector(".results-container")
			.insertBefore(
				usageInfo,
				document.querySelector(".results-container").firstChild
			);
	}

	const sourceIcon = source === "client-side" ? "🔄" : "☁️";
	usageInfo.innerHTML = `
    <div class="usage-message">
      ${sourceIcon} ${message}
      ${
				!window.flahaSoilAPI.isAuthenticated()
					? '<a href="#" onclick="showSignupModal()">Sign up for unlimited calculations</a>'
					: ""
			}
    </div>
  `;
}

function showUpgradePrompt(message) {
	// Create upgrade modal
	const modal = document.createElement("div");
	modal.className = "upgrade-modal";
	modal.innerHTML = `
    <div class="modal-content">
      <h3>Upgrade Required</h3>
      <p>${message}</p>
      <div class="modal-buttons">
        <button onclick="showSignupModal(); closeUpgradeModal()">Sign Up Free</button>
        <button onclick="closeUpgradeModal()">Continue with Limited Access</button>
      </div>
    </div>
  `;

	document.body.appendChild(modal);
}

function closeUpgradeModal() {
	const modal = document.querySelector(".upgrade-modal");
	if (modal) {
		modal.remove();
	}
}

function showSignupModal() {
	// Create signup modal
	const modal = document.createElement("div");
	modal.className = "signup-modal";
	modal.innerHTML = `
    <div class="modal-content">
      <h3>Sign Up for FlahaSoil</h3>
      <p>Get unlimited soil analysis calculations and advanced features!</p>
      <form id="signup-form">
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Password" required>
        <input type="text" name="name" placeholder="Full Name" required>
        <button type="submit">Sign Up Free</button>
      </form>
      <p><a href="#" onclick="showLoginModal(); closeSignupModal()">Already have an account? Login</a></p>
      <button onclick="closeSignupModal()">Close</button>
    </div>
  `;

	document.body.appendChild(modal);

	// Handle form submission
	document
		.getElementById("signup-form")
		.addEventListener("submit", async (e) => {
			e.preventDefault();
			const formData = new FormData(e.target);
			const userData = {
				email: formData.get("email"),
				password: formData.get("password"),
				name: formData.get("name"),
			};

			const result = await window.flahaSoilAPI.register(userData);
			if (result.success) {
				alert("Registration successful! Please login.");
				closeSignupModal();
				showLoginModal();
			} else {
				alert(result.error || "Registration failed");
			}
		});
}

function closeSignupModal() {
	const modal = document.querySelector(".signup-modal");
	if (modal) {
		modal.remove();
	}
}

function showLoginModal() {
	// Create login modal
	const modal = document.createElement("div");
	modal.className = "login-modal";
	modal.innerHTML = `
    <div class="modal-content">
      <h3>Login to FlahaSoil</h3>
      <form id="login-form">
        <input type="email" name="email" placeholder="Email" required>
        <input type="password" name="password" placeholder="Password" required>
        <button type="submit">Login</button>
      </form>
      <p><a href="#" onclick="showSignupModal(); closeLoginModal()">Don't have an account? Sign up</a></p>
      <button onclick="closeLoginModal()">Close</button>
    </div>
  `;

	document.body.appendChild(modal);

	// Handle form submission
	document
		.getElementById("login-form")
		.addEventListener("submit", async (e) => {
			e.preventDefault();
			const formData = new FormData(e.target);

			const result = await window.flahaSoilAPI.login(
				formData.get("email"),
				formData.get("password")
			);

			if (result.success) {
				alert("Login successful!");
				closeLoginModal();
				location.reload(); // Refresh to update UI
			} else {
				alert(result.error || "Login failed");
			}
		});
}

function closeLoginModal() {
	const modal = document.querySelector(".login-modal");
	if (modal) {
		modal.remove();
	}
}

function showErrorMessage(message) {
	// Create or update error message display
	let errorInfo = document.getElementById("error-info");
	if (!errorInfo) {
		errorInfo = document.createElement("div");
		errorInfo.id = "error-info";
		errorInfo.className = "error-info";
		document
			.querySelector(".results-container")
			.insertBefore(
				errorInfo,
				document.querySelector(".results-container").firstChild
			);
	}

	errorInfo.innerHTML = `
		<div class="error-message">
			⚠️ ${message}
		</div>
	`;

	// Auto-hide after 5 seconds
	setTimeout(() => {
		if (errorInfo) {
			errorInfo.remove();
		}
	}, 5000);
}
