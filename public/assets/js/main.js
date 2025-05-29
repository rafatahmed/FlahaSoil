/** @format */

// Initialize global API client
let flahaSoilAPI = null;

// Initialize API client when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	// Initialize API client
	flahaSoilAPI = new FlahaSoilAPI();

	// Make it available globally for compatibility
	window.flahaSoilAPI = flahaSoilAPI;

	// Check authentication status and update UI
	checkAuthenticationStatus();
});

/**
 * Check authentication status and update UI
 */
function checkAuthenticationStatus() {
	const token = localStorage.getItem("flahasoil_token");
	const userStr = localStorage.getItem("flahasoil_user");

	if (token && userStr) {
		try {
			const user = JSON.parse(userStr);
			// Update API client with user data
			if (window.flahaSoilAPI) {
				window.flahaSoilAPI.setAuth(
					token,
					user.tier,
					window.flahaSoilAPI.usageCount
				);
			}
			showAuthenticatedUI(user);
		} catch (error) {
			/* eslint-disable */ console.error(
				...oo_tx(`1837270240_38_3_38_51_11`, "Error parsing user data:", error)
			);
			showUnauthenticatedUI();
		}
	} else {
		showUnauthenticatedUI();
	}
}

/**
 * Show UI for authenticated users
 */
function showAuthenticatedUI(user) {
	// Hide auth section, show user section
	const authSection = document.getElementById("authSection");
	const userSection = document.getElementById("userSection");
	const profileLink = document.getElementById("profileLink");
	const headerUserName = document.getElementById("headerUserName");

	if (authSection) authSection.style.display = "none";
	if (userSection) userSection.style.display = "block";
	if (profileLink) profileLink.style.display = "block";
	if (headerUserName) headerUserName.textContent = user.name;

	// Update plan badge
	updatePlanStatusUI(user.tier, true);
}

/**
 * Show UI for unauthenticated users
 */
function showUnauthenticatedUI() {
	// Show auth section, hide user section
	const authSection = document.getElementById("authSection");
	const userSection = document.getElementById("userSection");
	const profileLink = document.getElementById("profileLink");

	if (authSection) authSection.style.display = "block";
	if (userSection) userSection.style.display = "none";
	if (profileLink) profileLink.style.display = "none";

	// Update usage counter for free users
	updateUsageCounter();
}

/**
 * Logout user
 */
async function logout() {
	try {
		// Show loading state
		const logoutBtn = document.querySelector('[onclick="logout()"]');
		if (logoutBtn) {
			logoutBtn.textContent = "Logging out...";
			logoutBtn.disabled = true;
		}

		// Call API logout
		if (window.flahaSoilAPI) {
			const result = await window.flahaSoilAPI.logout();
			if (result.success) {
				/* eslint-disable */ console.log(
					...oo_oo(`1837270240_98_4_98_36_4`, "Logout successful")
				);
			}
		}

		// Clear all local storage data
		localStorage.removeItem("flahasoil_token");
		localStorage.removeItem("flahasoil_user");
		localStorage.removeItem("flahasoil_user_plan");
		localStorage.removeItem("flahasoil_usage_count");

		// Update UI
		showUnauthenticatedUI();

		// Show success message
		showSuccessMessage("Logout successful! Redirecting...");

		// Redirect to landing page after a short delay
		setTimeout(() => {
			window.location.href = "./landing.html";
		}, 1000);
	} catch (error) {
		/* eslint-disable */ console.error(
			...oo_tx(`1837270240_119_2_119_39_11`, "Logout error:", error)
		);
		// Even if there's an error, still clear local data and redirect
		localStorage.clear();
		window.location.href = "./landing.html";
	}
}

/**
 * Redirect to landing page for authentication
 */
function showLoginModal() {
	showInfoMessage("Please login via the landing page");
	setTimeout(() => {
		window.location.href = "./landing.html";
	}, 1500);
}

/**
 * Redirect to landing page for authentication
 */
function showSignupModal() {
	showInfoMessage("Please register via the landing page");
	setTimeout(() => {
		window.location.href = "./landing.html";
	}, 1500);
}

/**
 * Toggle mobile navigation
 */
function toggleMobileNav() {
	const headerActions = document.getElementById("headerActions");
	const mobileToggle = document.querySelector(".mobile-nav-toggle");

	if (headerActions && mobileToggle) {
		headerActions.classList.toggle("mobile-open");

		// Animate hamburger menu
		const spans = mobileToggle.querySelectorAll("span");
		if (headerActions.classList.contains("mobile-open")) {
			spans[0].style.transform = "rotate(45deg) translate(5px, 5px)";
			spans[1].style.opacity = "0";
			spans[2].style.transform = "rotate(-45deg) translate(7px, -6px)";
		} else {
			spans[0].style.transform = "none";
			spans[1].style.opacity = "1";
			spans[2].style.transform = "none";
		}
	}
}

/**
 * Close mobile navigation when clicking outside
 */
document.addEventListener("click", function (event) {
	const headerActions = document.getElementById("headerActions");
	const mobileToggle = document.querySelector(".mobile-nav-toggle");

	if (
		headerActions &&
		mobileToggle &&
		!headerActions.contains(event.target) &&
		!mobileToggle.contains(event.target) &&
		headerActions.classList.contains("mobile-open")
	) {
		toggleMobileNav();
	}
});

/**
 * Show success message
 */
function showSuccessMessage(message) {
	showToast(message, "success");
}

/**
 * Show error message
 */
function showErrorMessage(message) {
	showToast(message, "error");
}

/**
 * Show info message
 */
function showInfoMessage(message) {
	showToast(message, "info");
}

/**
 * Show toast notification
 */
function showToast(message, type = "info") {
	const toast = document.createElement("div");
	toast.className = `toast ${type}`;
	toast.textContent = message;

	const colors = {
		success: "#4CAF50",
		error: "#f44336",
		info: "#2196F3",
		warning: "#ff9800",
	};

	toast.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: ${colors[type]};
		color: white;
		padding: 15px 20px;
		border-radius: 8px;
		z-index: 3000;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		font-weight: 500;
		max-width: 300px;
		animation: slideInRight 0.3s ease-out;
	`;

	document.body.appendChild(toast);

	setTimeout(() => {
		toast.remove();
	}, 4000);
}

// Utility Functions
function showLoadingState() {
	// Show loading indicator if element exists
	const loadingElement = document.getElementById("loading-indicator");
	if (loadingElement) {
		loadingElement.style.display = "block";
	}

	// Disable form inputs during loading
	const inputs = document.querySelectorAll("input, button");
	inputs.forEach((input) => {
		input.disabled = true;
	});
}

function hideLoadingState() {
	// Hide loading indicator if element exists
	const loadingElement = document.getElementById("loading-indicator");
	if (loadingElement) {
		loadingElement.style.display = "none";
	}

	// Re-enable form inputs
	const inputs = document.querySelectorAll("input, button");
	inputs.forEach((input) => {
		input.disabled = false;
	});
}

function getAdvancedParameters() {
	// Return default advanced parameters
	return {
		region: "central",
		soilSeries: "default",
		management: "conventional",
		organicAmendments: false,
	};
}

/**
 * Show upgrade prompt for free users
 * @param {string} message - Error message
 */
function showUpgradePrompt(message) {
	const modal = document.createElement("div");
	modal.className = "upgrade-modal";
	modal.innerHTML = `
		<div class="modal-content">
			<div class="modal-header">
				<h3>🚀 Upgrade to Professional</h3>
				<button class="modal-close" onclick="closeUpgradeModal()">&times;</button>
			</div>
			<div class="modal-body">
				<p>${message || "You need a Professional account to access this feature."}</p>
				<div class="upgrade-benefits">
					<h4>Professional Benefits:</h4>
					<ul>
						<li>Unlimited soil analysis calculations</li>
						<li>Advanced visualization features</li>
						<li>Historical data tracking</li>
						<li>Priority customer support</li>
						<li>Export capabilities</li>
					</ul>
				</div>
			</div>
			<div class="modal-footer">
				<button onclick="window.location.href='profile.html#upgrade'" class="btn btn-primary">
					Upgrade Now
				</button>
				<button onclick="closeUpgradeModal()" class="btn btn-secondary">
					Maybe Later
				</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick="closeUpgradeModal()"></div>
	`;
	document.body.appendChild(modal);
}

/**
 * Close upgrade modal
 */
function closeUpgradeModal() {
	const modal = document.querySelector(".upgrade-modal");
	if (modal) {
		modal.remove();
	}
}

/**
 * Show connection error prompt
 * @param {string} message - Error message
 */
function showConnectionError(message) {
	const notification = document.createElement("div");
	notification.className = "connection-error-notification";
	notification.innerHTML = `
		<div class="notification-content">
			<div class="notification-icon">🌐</div>
			<div class="notification-text">
				<h4>Connection Error</h4>
				<p>${
					message ||
					"Unable to connect to soil analysis service. Please check your internet connection."
				}</p>
			</div>
			<button onclick="this.closest('.connection-error-notification').remove()" class="notification-close">
				&times;
			</button>
		</div>
	`;

	// Add styling
	notification.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 8px;
		padding: 15px;
		max-width: 350px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
		animation: slideIn 0.3s ease-out;
	`;

	document.body.appendChild(notification);

	// Auto-remove after 10 seconds
	setTimeout(() => {
		if (notification.parentNode) {
			notification.remove();
		}
	}, 10000);
}

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
			/* eslint-disable */ console.error(
				...oo_tx(
					`1837270240_772_3_772_51_11`,
					"Error loading soil data:",
					error
				)
			);
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

		// Initialize API client if not already done
		if (!window.flahaSoilAPI) {
			window.flahaSoilAPI = new FlahaSoilAPI();
		}

		// Use API for all calculations
		const response = await window.flahaSoilAPI.analyzeSoil(calculationParams);

		if (!response.success) {
			// Handle authentication errors first
			if (
				(response.error && response.error.includes("Access denied")) ||
				(response.error && response.error.includes("No token provided"))
			) {
				// User not authenticated - show login prompt
				showAuthenticationPrompt();
				return;
			}

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
		/* eslint-disable */ console.error(
			...oo_tx(
				`1837270240_1172_2_1172_63_11`,
				"Error updating water characteristics:",
				error
			)
		);

		// Check if error is authentication related
		if (
			error.message &&
			(error.message.includes("Access denied") ||
				error.message.includes("No token provided"))
		) {
			showAuthenticationPrompt();
		} else {
			// Use the toast function directly since showErrorMessage might not be in scope
			showToast(
				"Failed to calculate soil characteristics. Please try again.",
				"error"
			);
		}
	} finally {
		// Hide loading state
		hideLoadingState();
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
		/* eslint-disable */ console.error(
			...oo_tx(`1837270240_1490_2_1490_40_11`, "Upgrade error:", error)
		);
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

// Utility Functions
function showLoadingState() {
	// Show loading indicator if element exists
	const loadingElement = document.getElementById("loading-indicator");
	if (loadingElement) {
		loadingElement.style.display = "block";
	}

	// Disable form inputs during loading
	const inputs = document.querySelectorAll("input, button");
	inputs.forEach((input) => {
		input.disabled = true;
	});
}

function hideLoadingState() {
	// Hide loading indicator if element exists
	const loadingElement = document.getElementById("loading-indicator");
	if (loadingElement) {
		loadingElement.style.display = "none";
	}

	// Re-enable form inputs
	const inputs = document.querySelectorAll("input, button");
	inputs.forEach((input) => {
		input.disabled = false;
	});
}

function getAdvancedParameters() {
	// Return default advanced parameters
	return {
		region: "central",
		soilSeries: "default",
		management: "conventional",
		organicAmendments: false,
	};
}

/**
 * Show upgrade prompt for free users
 * @param {string} message - Error message
 */
function showUpgradePrompt(message) {
	const modal = document.createElement("div");
	modal.className = "upgrade-modal";
	modal.innerHTML = `
		<div class="modal-content">
			<div class="modal-header">
				<h3>🚀 Upgrade to Professional</h3>
				<button class="modal-close" onclick="closeUpgradeModal()">&times;</button>
			</div>
			<div class="modal-body">
				<p>${message || "You need a Professional account to access this feature."}</p>
				<div class="upgrade-benefits">
					<h4>Professional Benefits:</h4>
					<ul>
						<li>Unlimited soil analysis calculations</li>
						<li>Advanced visualization features</li>
						<li>Historical data tracking</li>
						<li>Priority customer support</li>
						<li>Export capabilities</li>
					</ul>
				</div>
			</div>
			<div class="modal-footer">
				<button onclick="window.location.href='profile.html#upgrade'" class="btn btn-primary">
					Upgrade Now
				</button>
				<button onclick="closeUpgradeModal()" class="btn btn-secondary">
					Maybe Later
				</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick="closeUpgradeModal()"></div>
	`;
	document.body.appendChild(modal);
}

/**
 * Close upgrade modal
 */
function closeUpgradeModal() {
	const modal = document.querySelector(".upgrade-modal");
	if (modal) {
		modal.remove();
	}
}

/**
 * Show authentication prompt for unauthenticated users
 */
function showAuthenticationPrompt() {
	const modal = document.createElement("div");
	modal.className = "auth-prompt-modal";
	modal.innerHTML = `
		<div class="modal-content">
			<div class="modal-header">
				<h3>🔐 Login Required</h3>
				<button class="modal-close" onclick="closeAuthPrompt()">&times;</button>
			</div>
			<div class="modal-body">
				<p>You need to be logged in to perform soil analysis calculations.</p>
				<div class="auth-benefits">
					<h4>With a FlahaSoil account you get:</h4>
					<ul>
						<li>✓ Professional soil analysis calculations</li>
						<li>✓ Save and track your analysis history</li>
						<li>✓ Export detailed reports</li>
						<li>✓ Access to advanced features</li>
					</ul>
				</div>
			</div>
			<div class="modal-footer">
				<button onclick="showLoginModal(); closeAuthPrompt();" class="btn btn-primary">
					Login
				</button>
				<button onclick="showSignupModal(); closeAuthPrompt();" class="btn btn-secondary">
					Create Account
				</button>
				<button onclick="closeAuthPrompt()" class="btn btn-outline">
					Maybe Later
				</button>
			</div>
		</div>
		<div class="modal-backdrop" onclick="closeAuthPrompt()"></div>
	`;
	document.body.appendChild(modal);
}

/**
 * Close authentication prompt
 */
function closeAuthPrompt() {
	const modal = document.querySelector(".auth-prompt-modal");
	if (modal) {
		modal.remove();
	}
}

/**
 * Show connection error prompt
 * @param {string} message - Error message
 */
function showConnectionError(message) {
	const notification = document.createElement("div");
	notification.className = "connection-error-notification";
	notification.innerHTML = `
		<div class="notification-content">
			<div class="notification-icon">🌐</div>
			<div class="notification-text">
				<h4>Connection Error</h4>
				<p>${
					message ||
					"Unable to connect to soil analysis service. Please check your internet connection."
				}</p>
			</div>
			<button onclick="this.closest('.connection-error-notification').remove()" class="notification-close">
				&times;
			</button>
		</div>
	`;

	// Add styling
	notification.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: #f8d7da;
		border: 1px solid #f5c6cb;
		border-radius: 8px;
		padding: 15px;
		max-width: 350px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 1000;
		animation: slideIn 0.3s ease-out;
	`;

	document.body.appendChild(notification);

	// Auto-remove after 10 seconds
	setTimeout(() => {
		if (notification.parentNode) {
			notification.remove();
		}
	}, 10000);
}
/* istanbul ignore next */ /* c8 ignore start */ /* eslint-disable */ function oo_cm() {
	try {
		return (
			(0, eval)("globalThis._console_ninja") ||
			(0, eval)(
				"/* https://github.com/wallabyjs/console-ninja#how-does-it-work */'use strict';var _0x412f05=_0x7aed;(function(_0x489e25,_0x478e0c){var _0x5ad78b=_0x7aed,_0x59e60a=_0x489e25();while(!![]){try{var _0x330aaf=-parseInt(_0x5ad78b(0x2ab))/0x1+-parseInt(_0x5ad78b(0x1cb))/0x2+-parseInt(_0x5ad78b(0x2a8))/0x3+-parseInt(_0x5ad78b(0x271))/0x4+parseInt(_0x5ad78b(0x1e6))/0x5*(parseInt(_0x5ad78b(0x1dd))/0x6)+-parseInt(_0x5ad78b(0x1e1))/0x7+parseInt(_0x5ad78b(0x273))/0x8*(parseInt(_0x5ad78b(0x2a4))/0x9);if(_0x330aaf===_0x478e0c)break;else _0x59e60a['push'](_0x59e60a['shift']());}catch(_0xbd8d73){_0x59e60a['push'](_0x59e60a['shift']());}}}(_0x2ad7,0x267f5));function _0x7aed(_0x2acfa0,_0x11ca5c){var _0x2ad728=_0x2ad7();return _0x7aed=function(_0x7aeda8,_0x4bc420){_0x7aeda8=_0x7aeda8-0x1c8;var _0x5aea33=_0x2ad728[_0x7aeda8];return _0x5aea33;},_0x7aed(_0x2acfa0,_0x11ca5c);}var G=Object[_0x412f05(0x246)],V=Object[_0x412f05(0x1ea)],ee=Object[_0x412f05(0x1fe)],te=Object['getOwnPropertyNames'],ne=Object[_0x412f05(0x26c)],re=Object[_0x412f05(0x2b4)]['hasOwnProperty'],ie=(_0x3278c2,_0x2c9f67,_0x286638,_0x4d1f31)=>{var _0x13e522=_0x412f05;if(_0x2c9f67&&typeof _0x2c9f67==_0x13e522(0x25f)||typeof _0x2c9f67==_0x13e522(0x2b7)){for(let _0x2589a6 of te(_0x2c9f67))!re[_0x13e522(0x229)](_0x3278c2,_0x2589a6)&&_0x2589a6!==_0x286638&&V(_0x3278c2,_0x2589a6,{'get':()=>_0x2c9f67[_0x2589a6],'enumerable':!(_0x4d1f31=ee(_0x2c9f67,_0x2589a6))||_0x4d1f31['enumerable']});}return _0x3278c2;},j=(_0x4d2ea4,_0x39dfb8,_0x595b7d)=>(_0x595b7d=_0x4d2ea4!=null?G(ne(_0x4d2ea4)):{},ie(_0x39dfb8||!_0x4d2ea4||!_0x4d2ea4[_0x412f05(0x1d2)]?V(_0x595b7d,_0x412f05(0x225),{'value':_0x4d2ea4,'enumerable':!0x0}):_0x595b7d,_0x4d2ea4)),q=class{constructor(_0xa53b1b,_0x1b35fc,_0x35041d,_0x5c4ecc,_0xae162c,_0x5f0aad){var _0x5d204a=_0x412f05,_0x1c0b0c,_0x1ad527,_0x3ffe43,_0x193dec;this[_0x5d204a(0x1f4)]=_0xa53b1b,this[_0x5d204a(0x1d6)]=_0x1b35fc,this[_0x5d204a(0x1c8)]=_0x35041d,this[_0x5d204a(0x288)]=_0x5c4ecc,this[_0x5d204a(0x1d5)]=_0xae162c,this[_0x5d204a(0x1f1)]=_0x5f0aad,this[_0x5d204a(0x217)]=!0x0,this['_allowedToConnectOnSend']=!0x0,this[_0x5d204a(0x261)]=!0x1,this[_0x5d204a(0x291)]=!0x1,this[_0x5d204a(0x235)]=((_0x1ad527=(_0x1c0b0c=_0xa53b1b['process'])==null?void 0x0:_0x1c0b0c[_0x5d204a(0x27e)])==null?void 0x0:_0x1ad527[_0x5d204a(0x230)])===_0x5d204a(0x1f5),this[_0x5d204a(0x268)]=!((_0x193dec=(_0x3ffe43=this[_0x5d204a(0x1f4)]['process'])==null?void 0x0:_0x3ffe43[_0x5d204a(0x2a3)])!=null&&_0x193dec[_0x5d204a(0x213)])&&!this[_0x5d204a(0x235)],this['_WebSocketClass']=null,this['_connectAttemptCount']=0x0,this[_0x5d204a(0x250)]=0x14,this[_0x5d204a(0x242)]=_0x5d204a(0x1de),this[_0x5d204a(0x211)]=(this[_0x5d204a(0x268)]?_0x5d204a(0x28c):'Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20restarting\\x20the\\x20process\\x20may\\x20help;\\x20also\\x20see\\x20')+this['_webSocketErrorDocsLink'];}async['getWebSocketClass'](){var _0x355d00=_0x412f05,_0x4ac543,_0x19f83d;if(this[_0x355d00(0x2b1)])return this[_0x355d00(0x2b1)];let _0x1ef4ad;if(this[_0x355d00(0x268)]||this[_0x355d00(0x235)])_0x1ef4ad=this[_0x355d00(0x1f4)][_0x355d00(0x1e2)];else{if((_0x4ac543=this['global'][_0x355d00(0x1e7)])!=null&&_0x4ac543[_0x355d00(0x1fb)])_0x1ef4ad=(_0x19f83d=this[_0x355d00(0x1f4)][_0x355d00(0x1e7)])==null?void 0x0:_0x19f83d[_0x355d00(0x1fb)];else try{let _0x52454b=await import(_0x355d00(0x1e0));_0x1ef4ad=(await import((await import('url'))[_0x355d00(0x267)](_0x52454b[_0x355d00(0x23e)](this[_0x355d00(0x288)],'ws/index.js'))[_0x355d00(0x20d)]()))[_0x355d00(0x225)];}catch{try{_0x1ef4ad=require(require(_0x355d00(0x1e0))[_0x355d00(0x23e)](this[_0x355d00(0x288)],'ws'));}catch{throw new Error(_0x355d00(0x275));}}}return this[_0x355d00(0x2b1)]=_0x1ef4ad,_0x1ef4ad;}['_connectToHostNow'](){var _0x3ae808=_0x412f05;this[_0x3ae808(0x291)]||this[_0x3ae808(0x261)]||this[_0x3ae808(0x2a5)]>=this[_0x3ae808(0x250)]||(this[_0x3ae808(0x26a)]=!0x1,this[_0x3ae808(0x291)]=!0x0,this['_connectAttemptCount']++,this[_0x3ae808(0x22f)]=new Promise((_0x49b8ba,_0x216c0a)=>{var _0x31220c=_0x3ae808;this[_0x31220c(0x282)]()['then'](_0xb8c5ff=>{var _0x1b51a9=_0x31220c;let _0xa3a150=new _0xb8c5ff(_0x1b51a9(0x201)+(!this[_0x1b51a9(0x268)]&&this['dockerizedApp']?'gateway.docker.internal':this[_0x1b51a9(0x1d6)])+':'+this[_0x1b51a9(0x1c8)]);_0xa3a150[_0x1b51a9(0x25b)]=()=>{var _0x4d824e=_0x1b51a9;this[_0x4d824e(0x217)]=!0x1,this['_disposeWebsocket'](_0xa3a150),this[_0x4d824e(0x259)](),_0x216c0a(new Error(_0x4d824e(0x298)));},_0xa3a150[_0x1b51a9(0x236)]=()=>{var _0xe6725b=_0x1b51a9;this[_0xe6725b(0x268)]||_0xa3a150[_0xe6725b(0x20e)]&&_0xa3a150['_socket'][_0xe6725b(0x285)]&&_0xa3a150[_0xe6725b(0x20e)][_0xe6725b(0x285)](),_0x49b8ba(_0xa3a150);},_0xa3a150[_0x1b51a9(0x299)]=()=>{var _0xba3aed=_0x1b51a9;this[_0xba3aed(0x26a)]=!0x0,this[_0xba3aed(0x233)](_0xa3a150),this[_0xba3aed(0x259)]();},_0xa3a150[_0x1b51a9(0x293)]=_0x4741c1=>{var _0x394044=_0x1b51a9;try{if(!(_0x4741c1!=null&&_0x4741c1[_0x394044(0x224)])||!this[_0x394044(0x1f1)])return;let _0x48b408=JSON['parse'](_0x4741c1[_0x394044(0x224)]);this[_0x394044(0x1f1)](_0x48b408['method'],_0x48b408[_0x394044(0x1ee)],this[_0x394044(0x1f4)],this[_0x394044(0x268)]);}catch{}};})['then'](_0x4638=>(this[_0x31220c(0x261)]=!0x0,this[_0x31220c(0x291)]=!0x1,this[_0x31220c(0x26a)]=!0x1,this[_0x31220c(0x217)]=!0x0,this['_connectAttemptCount']=0x0,_0x4638))[_0x31220c(0x210)](_0x1f6b8a=>(this[_0x31220c(0x261)]=!0x1,this[_0x31220c(0x291)]=!0x1,console[_0x31220c(0x27a)](_0x31220c(0x20f)+this[_0x31220c(0x242)]),_0x216c0a(new Error(_0x31220c(0x24e)+(_0x1f6b8a&&_0x1f6b8a[_0x31220c(0x239)])))));}));}[_0x412f05(0x233)](_0x5e3305){var _0x3d1ab1=_0x412f05;this['_connected']=!0x1,this[_0x3d1ab1(0x291)]=!0x1;try{_0x5e3305[_0x3d1ab1(0x299)]=null,_0x5e3305[_0x3d1ab1(0x25b)]=null,_0x5e3305[_0x3d1ab1(0x236)]=null;}catch{}try{_0x5e3305[_0x3d1ab1(0x200)]<0x2&&_0x5e3305[_0x3d1ab1(0x1f9)]();}catch{}}['_attemptToReconnectShortly'](){var _0x232d5b=_0x412f05;clearTimeout(this[_0x232d5b(0x22d)]),!(this[_0x232d5b(0x2a5)]>=this[_0x232d5b(0x250)])&&(this[_0x232d5b(0x22d)]=setTimeout(()=>{var _0x303ebe=_0x232d5b,_0x5a5b19;this[_0x303ebe(0x261)]||this[_0x303ebe(0x291)]||(this[_0x303ebe(0x1cf)](),(_0x5a5b19=this[_0x303ebe(0x22f)])==null||_0x5a5b19[_0x303ebe(0x210)](()=>this[_0x303ebe(0x259)]()));},0x1f4),this[_0x232d5b(0x22d)][_0x232d5b(0x285)]&&this[_0x232d5b(0x22d)][_0x232d5b(0x285)]());}async[_0x412f05(0x1db)](_0x303817){var _0x5a67f6=_0x412f05;try{if(!this[_0x5a67f6(0x217)])return;this['_allowedToConnectOnSend']&&this[_0x5a67f6(0x1cf)](),(await this['_ws'])[_0x5a67f6(0x1db)](JSON['stringify'](_0x303817));}catch(_0xd18687){this['_extendedWarning']?console['warn'](this['_sendErrorMessage']+':\\x20'+(_0xd18687&&_0xd18687[_0x5a67f6(0x239)])):(this['_extendedWarning']=!0x0,console[_0x5a67f6(0x27a)](this['_sendErrorMessage']+':\\x20'+(_0xd18687&&_0xd18687[_0x5a67f6(0x239)]),_0x303817)),this[_0x5a67f6(0x217)]=!0x1,this[_0x5a67f6(0x259)]();}}};function H(_0x47bf4a,_0x5e132b,_0x31c76b,_0x357164,_0x13599e,_0x5e5372,_0x10b56d,_0x5f1e64=oe){var _0x4de24b=_0x412f05;let _0x1858be=_0x31c76b[_0x4de24b(0x2aa)](',')['map'](_0x2a3e24=>{var _0x128d91=_0x4de24b,_0x17bf75,_0x22c211,_0x45c79d,_0x2aaf33;try{if(!_0x47bf4a[_0x128d91(0x20c)]){let _0x1de002=((_0x22c211=(_0x17bf75=_0x47bf4a[_0x128d91(0x1e7)])==null?void 0x0:_0x17bf75[_0x128d91(0x2a3)])==null?void 0x0:_0x22c211['node'])||((_0x2aaf33=(_0x45c79d=_0x47bf4a[_0x128d91(0x1e7)])==null?void 0x0:_0x45c79d[_0x128d91(0x27e)])==null?void 0x0:_0x2aaf33[_0x128d91(0x230)])===_0x128d91(0x1f5);(_0x13599e===_0x128d91(0x1d8)||_0x13599e===_0x128d91(0x29a)||_0x13599e===_0x128d91(0x1dc)||_0x13599e==='angular')&&(_0x13599e+=_0x1de002?_0x128d91(0x257):'\\x20browser'),_0x47bf4a['_console_ninja_session']={'id':+new Date(),'tool':_0x13599e},_0x10b56d&&_0x13599e&&!_0x1de002&&console[_0x128d91(0x294)]('%c\\x20Console\\x20Ninja\\x20extension\\x20is\\x20connected\\x20to\\x20'+(_0x13599e[_0x128d91(0x1ec)](0x0)[_0x128d91(0x24b)]()+_0x13599e[_0x128d91(0x2ac)](0x1))+',','background:\\x20rgb(30,30,30);\\x20color:\\x20rgb(255,213,92)',_0x128d91(0x2a1));}let _0x1dc304=new q(_0x47bf4a,_0x5e132b,_0x2a3e24,_0x357164,_0x5e5372,_0x5f1e64);return _0x1dc304[_0x128d91(0x1db)][_0x128d91(0x244)](_0x1dc304);}catch(_0x354102){return console[_0x128d91(0x27a)](_0x128d91(0x258),_0x354102&&_0x354102['message']),()=>{};}});return _0x172a39=>_0x1858be[_0x4de24b(0x2b6)](_0x3ac4af=>_0x3ac4af(_0x172a39));}function oe(_0x1e0d25,_0xc879f3,_0x28d502,_0x28827f){var _0x115306=_0x412f05;_0x28827f&&_0x1e0d25==='reload'&&_0x28d502[_0x115306(0x228)][_0x115306(0x2b5)]();}function B(_0x3f75ef){var _0x57e3bf=_0x412f05,_0x23c81c,_0x35cad5;let _0x4dd8df=function(_0x11c22f,_0x1d500d){return _0x1d500d-_0x11c22f;},_0x10e9f3;if(_0x3f75ef['performance'])_0x10e9f3=function(){var _0x54fb8d=_0x7aed;return _0x3f75ef[_0x54fb8d(0x1da)][_0x54fb8d(0x262)]();};else{if(_0x3f75ef['process']&&_0x3f75ef['process'][_0x57e3bf(0x255)]&&((_0x35cad5=(_0x23c81c=_0x3f75ef[_0x57e3bf(0x1e7)])==null?void 0x0:_0x23c81c[_0x57e3bf(0x27e)])==null?void 0x0:_0x35cad5[_0x57e3bf(0x230)])!==_0x57e3bf(0x1f5))_0x10e9f3=function(){var _0x58483c=_0x57e3bf;return _0x3f75ef['process'][_0x58483c(0x255)]();},_0x4dd8df=function(_0x3958b9,_0x4502d6){return 0x3e8*(_0x4502d6[0x0]-_0x3958b9[0x0])+(_0x4502d6[0x1]-_0x3958b9[0x1])/0xf4240;};else try{let {performance:_0xcf2161}=require(_0x57e3bf(0x254));_0x10e9f3=function(){var _0x5cc376=_0x57e3bf;return _0xcf2161[_0x5cc376(0x262)]();};}catch{_0x10e9f3=function(){return+new Date();};}}return{'elapsed':_0x4dd8df,'timeStamp':_0x10e9f3,'now':()=>Date['now']()};}function _0x2ad7(){var _0x28f6e1=['_objectToString','onerror','error','nan','autoExpandPreviousObjects','object','hostname','_connected','now','_blacklistedProperty','_isNegativeZero','undefined','HTMLAllCollection','pathToFileURL','_inBrowser','reduceLimits','_allowedToConnectOnSend','_setNodeExpandableState','getPrototypeOf','match','string','replace','resolveGetters','48056wZaTcA','_dateToString','8mtCRpS','null','failed\\x20to\\x20find\\x20and\\x20load\\x20WebSocket','_setNodePermissions','disabledLog','1748519471494','name','warn','_addObjectProperty','concat','root_exp_id','env','depth','127.0.0.1','boolean','getWebSocketClass','isExpressionToEvaluate','[object\\x20Map]','unref','number','autoExpand','nodeModules','_setNodeLabel','strLength','_undefined','Console\\x20Ninja\\x20failed\\x20to\\x20send\\x20logs,\\x20refreshing\\x20the\\x20page\\x20may\\x20help;\\x20also\\x20see\\x20','String','sortProps','_processTreeNodeResult','timeStamp','_connecting','_Symbol','onmessage','log','constructor','_getOwnPropertySymbols','stackTraceLimit','logger\\x20websocket\\x20error','onclose','remix','serialize','elapsed','push','type','Error','_getOwnPropertyDescriptor','see\\x20https://tinyurl.com/2vt8jxzw\\x20for\\x20more\\x20info.','date','versions','6098193WlOtQb','_connectAttemptCount','_getOwnPropertyNames','expressionsToEvaluate','331038qdpEYK','disabledTrace','split','205648GZcaDM','substr','_isSet','count','[object\\x20Date]','autoExpandPropertyCount','_WebSocketClass','Set','_treeNodePropertiesAfterFullValue','prototype','reload','forEach','function','totalStrLength','52252','[object\\x20Set]','1','valueOf','_additionalMetadata','port','fromCharCode','value','573148QebfPd','positiveInfinity','startsWith','_quotedRegExp','_connectToHostNow','_addProperty','_type','__es'+'Module','','Boolean','dockerizedApp','host','[object\\x20BigInt]','next.js','test','performance','send','astro','866358YPvDql','https://tinyurl.com/37x8b79t','[object\\x20Array]','path','347921LQyjly','WebSocket','toLowerCase','coverage','_setNodeExpressionPath','5Badimf','process','stack','slice','defineProperty','_sortProps','charAt','_propertyName','args','_isUndefined','_p_length','eventReceivedCallback','_ninjaIgnoreNextError','_treeNodePropertiesBeforeFullValue','global','edge','length','stringify','_p_','close','_p_name','_WebSocket','_isPrimitiveWrapperType','elements','getOwnPropertyDescriptor','symbol','readyState','ws://','capped','includes','array','Symbol','hits','_setNodeQueryPath','...','_console_ninja','autoExpandLimit','negativeZero','_console_ninja_session','toString','_socket','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host,\\x20see\\x20','catch','_sendErrorMessage','bigint','node','RegExp','_addLoadNode','_regExpToString','_allowedToSend','live-server-extension','trace','getOwnPropertySymbols','negativeInfinity','console','_cleanNode','parent','cappedElements','_setNodeId','_consoleNinjaAllowedToStart','index','Buffer','data','default','Number','indexOf','location','call','time','noFunctions','props','_reconnectTimeout','pop','_ws','NEXT_RUNTIME','_property','_addFunctionsNode','_disposeWebsocket','getter','_inNextEdge','onopen','autoExpandMaxDepth','allStrLength','message','Map','sort','_isMap','NEGATIVE_INFINITY','join','_HTMLAllCollection','endsWith','level','_webSocketErrorDocsLink',[\"localhost\",\"127.0.0.1\",\"example.cypress.io\",\"LAPTOP-H92H2SLK\",\"192.168.56.1\",\"192.168.100.59\",\"172.22.144.1\"],'bind','some','create','current','get','expId','rootExpression','toUpperCase','_hasMapOnItsPath','_isPrimitiveType','failed\\x20to\\x20connect\\x20to\\x20host:\\x20','POSITIVE_INFINITY','_maxConnectAttemptCount','_capIfString','','unknown','perf_hooks','hrtime','origin','\\x20server','logger\\x20failed\\x20to\\x20connect\\x20to\\x20host','_attemptToReconnectShortly'];_0x2ad7=function(){return _0x28f6e1;};return _0x2ad7();}function X(_0x3f5ef0,_0x2d564a,_0x5c445b){var _0x4622cb=_0x412f05,_0x1d41ab,_0x1652f0,_0x5a2c7c,_0x5bb0fa,_0x486c20;if(_0x3f5ef0[_0x4622cb(0x221)]!==void 0x0)return _0x3f5ef0['_consoleNinjaAllowedToStart'];let _0x3ef340=((_0x1652f0=(_0x1d41ab=_0x3f5ef0[_0x4622cb(0x1e7)])==null?void 0x0:_0x1d41ab[_0x4622cb(0x2a3)])==null?void 0x0:_0x1652f0[_0x4622cb(0x213)])||((_0x5bb0fa=(_0x5a2c7c=_0x3f5ef0[_0x4622cb(0x1e7)])==null?void 0x0:_0x5a2c7c[_0x4622cb(0x27e)])==null?void 0x0:_0x5bb0fa[_0x4622cb(0x230)])===_0x4622cb(0x1f5);function _0x311faa(_0x159a7a){var _0x35286c=_0x4622cb;if(_0x159a7a[_0x35286c(0x1cd)]('/')&&_0x159a7a[_0x35286c(0x240)]('/')){let _0x1f3e5a=new RegExp(_0x159a7a[_0x35286c(0x1e9)](0x1,-0x1));return _0x865c8b=>_0x1f3e5a['test'](_0x865c8b);}else{if(_0x159a7a['includes']('*')||_0x159a7a[_0x35286c(0x203)]('?')){let _0x23a98e=new RegExp('^'+_0x159a7a[_0x35286c(0x26f)](/\\./g,String['fromCharCode'](0x5c)+'.')[_0x35286c(0x26f)](/\\*/g,'.*')['replace'](/\\?/g,'.')+String[_0x35286c(0x1c9)](0x24));return _0x55a8ed=>_0x23a98e[_0x35286c(0x1d9)](_0x55a8ed);}else return _0x473ce2=>_0x473ce2===_0x159a7a;}}let _0x20cc8f=_0x2d564a['map'](_0x311faa);return _0x3f5ef0[_0x4622cb(0x221)]=_0x3ef340||!_0x2d564a,!_0x3f5ef0[_0x4622cb(0x221)]&&((_0x486c20=_0x3f5ef0[_0x4622cb(0x228)])==null?void 0x0:_0x486c20[_0x4622cb(0x260)])&&(_0x3f5ef0['_consoleNinjaAllowedToStart']=_0x20cc8f[_0x4622cb(0x245)](_0x1b2309=>_0x1b2309(_0x3f5ef0[_0x4622cb(0x228)]['hostname']))),_0x3f5ef0[_0x4622cb(0x221)];}function J(_0x7d450,_0x40d82e,_0x2c7a7b,_0x4c484d){var _0x160ba5=_0x412f05;_0x7d450=_0x7d450,_0x40d82e=_0x40d82e,_0x2c7a7b=_0x2c7a7b,_0x4c484d=_0x4c484d;let _0x5de405=B(_0x7d450),_0x23f854=_0x5de405['elapsed'],_0x1e24bd=_0x5de405[_0x160ba5(0x290)];class _0x72c007{constructor(){var _0x5669ca=_0x160ba5;this['_keyStrRegExp']=/^(?!(?:do|if|in|for|let|new|try|var|case|else|enum|eval|false|null|this|true|void|with|break|catch|class|const|super|throw|while|yield|delete|export|import|public|return|static|switch|typeof|default|extends|finally|package|private|continue|debugger|function|arguments|interface|protected|implements|instanceof)$)[_$a-zA-Z\\xA0-\\uFFFF][_$a-zA-Z0-9\\xA0-\\uFFFF]*$/,this['_numberRegExp']=/^(0|[1-9][0-9]*)$/,this[_0x5669ca(0x1ce)]=/'([^\\\\']|\\\\')*'/,this[_0x5669ca(0x28b)]=_0x7d450[_0x5669ca(0x265)],this[_0x5669ca(0x23f)]=_0x7d450[_0x5669ca(0x266)],this[_0x5669ca(0x2a0)]=Object[_0x5669ca(0x1fe)],this['_getOwnPropertyNames']=Object['getOwnPropertyNames'],this[_0x5669ca(0x292)]=_0x7d450[_0x5669ca(0x205)],this[_0x5669ca(0x216)]=RegExp[_0x5669ca(0x2b4)][_0x5669ca(0x20d)],this[_0x5669ca(0x272)]=Date[_0x5669ca(0x2b4)][_0x5669ca(0x20d)];}[_0x160ba5(0x29b)](_0x5368ea,_0x469dff,_0x15ba72,_0x4172fe){var _0x30c7fd=_0x160ba5,_0x451109=this,_0x5bdd85=_0x15ba72[_0x30c7fd(0x287)];function _0x12611c(_0x2edf67,_0x300db0,_0x47bde9){var _0x2b7210=_0x30c7fd;_0x300db0['type']=_0x2b7210(0x253),_0x300db0[_0x2b7210(0x25c)]=_0x2edf67['message'],_0x26882b=_0x47bde9[_0x2b7210(0x213)][_0x2b7210(0x247)],_0x47bde9['node'][_0x2b7210(0x247)]=_0x300db0,_0x451109[_0x2b7210(0x1f3)](_0x300db0,_0x47bde9);}let _0x5b86f7;_0x7d450['console']&&(_0x5b86f7=_0x7d450['console'][_0x30c7fd(0x25c)],_0x5b86f7&&(_0x7d450[_0x30c7fd(0x21c)][_0x30c7fd(0x25c)]=function(){}));try{try{_0x15ba72['level']++,_0x15ba72[_0x30c7fd(0x287)]&&_0x15ba72['autoExpandPreviousObjects']['push'](_0x469dff);var _0x2ca9e7,_0x4e87ac,_0x161954,_0x68f02a,_0x183e83=[],_0x4297d6=[],_0x555f40,_0x5d6638=this[_0x30c7fd(0x1d1)](_0x469dff),_0x41b8e9=_0x5d6638==='array',_0x38ee4b=!0x1,_0x15ad45=_0x5d6638==='function',_0xbbf8ff=this[_0x30c7fd(0x24d)](_0x5d6638),_0xf353fd=this[_0x30c7fd(0x1fc)](_0x5d6638),_0x415311=_0xbbf8ff||_0xf353fd,_0x28416a={},_0x14df2b=0x0,_0x5b75e1=!0x1,_0x26882b,_0x34135c=/^(([1-9]{1}[0-9]*)|0)$/;if(_0x15ba72[_0x30c7fd(0x27f)]){if(_0x41b8e9){if(_0x4e87ac=_0x469dff[_0x30c7fd(0x1f6)],_0x4e87ac>_0x15ba72[_0x30c7fd(0x1fd)]){for(_0x161954=0x0,_0x68f02a=_0x15ba72['elements'],_0x2ca9e7=_0x161954;_0x2ca9e7<_0x68f02a;_0x2ca9e7++)_0x4297d6[_0x30c7fd(0x29d)](_0x451109[_0x30c7fd(0x1d0)](_0x183e83,_0x469dff,_0x5d6638,_0x2ca9e7,_0x15ba72));_0x5368ea[_0x30c7fd(0x21f)]=!0x0;}else{for(_0x161954=0x0,_0x68f02a=_0x4e87ac,_0x2ca9e7=_0x161954;_0x2ca9e7<_0x68f02a;_0x2ca9e7++)_0x4297d6[_0x30c7fd(0x29d)](_0x451109[_0x30c7fd(0x1d0)](_0x183e83,_0x469dff,_0x5d6638,_0x2ca9e7,_0x15ba72));}_0x15ba72['autoExpandPropertyCount']+=_0x4297d6['length'];}if(!(_0x5d6638===_0x30c7fd(0x274)||_0x5d6638===_0x30c7fd(0x265))&&!_0xbbf8ff&&_0x5d6638!==_0x30c7fd(0x28d)&&_0x5d6638!==_0x30c7fd(0x223)&&_0x5d6638!=='bigint'){var _0x19fede=_0x4172fe[_0x30c7fd(0x22c)]||_0x15ba72[_0x30c7fd(0x22c)];if(this['_isSet'](_0x469dff)?(_0x2ca9e7=0x0,_0x469dff[_0x30c7fd(0x2b6)](function(_0x4c2cb4){var _0x44ff96=_0x30c7fd;if(_0x14df2b++,_0x15ba72[_0x44ff96(0x2b0)]++,_0x14df2b>_0x19fede){_0x5b75e1=!0x0;return;}if(!_0x15ba72[_0x44ff96(0x283)]&&_0x15ba72[_0x44ff96(0x287)]&&_0x15ba72['autoExpandPropertyCount']>_0x15ba72[_0x44ff96(0x20a)]){_0x5b75e1=!0x0;return;}_0x4297d6['push'](_0x451109[_0x44ff96(0x1d0)](_0x183e83,_0x469dff,_0x44ff96(0x2b2),_0x2ca9e7++,_0x15ba72,function(_0x17b5eb){return function(){return _0x17b5eb;};}(_0x4c2cb4)));})):this[_0x30c7fd(0x23c)](_0x469dff)&&_0x469dff[_0x30c7fd(0x2b6)](function(_0x35cf26,_0x45f8bc){var _0x1b7935=_0x30c7fd;if(_0x14df2b++,_0x15ba72[_0x1b7935(0x2b0)]++,_0x14df2b>_0x19fede){_0x5b75e1=!0x0;return;}if(!_0x15ba72[_0x1b7935(0x283)]&&_0x15ba72[_0x1b7935(0x287)]&&_0x15ba72[_0x1b7935(0x2b0)]>_0x15ba72[_0x1b7935(0x20a)]){_0x5b75e1=!0x0;return;}var _0x4ba67b=_0x45f8bc[_0x1b7935(0x20d)]();_0x4ba67b['length']>0x64&&(_0x4ba67b=_0x4ba67b[_0x1b7935(0x1e9)](0x0,0x64)+_0x1b7935(0x208)),_0x4297d6['push'](_0x451109[_0x1b7935(0x1d0)](_0x183e83,_0x469dff,_0x1b7935(0x23a),_0x4ba67b,_0x15ba72,function(_0x2f3d58){return function(){return _0x2f3d58;};}(_0x35cf26)));}),!_0x38ee4b){try{for(_0x555f40 in _0x469dff)if(!(_0x41b8e9&&_0x34135c[_0x30c7fd(0x1d9)](_0x555f40))&&!this[_0x30c7fd(0x263)](_0x469dff,_0x555f40,_0x15ba72)){if(_0x14df2b++,_0x15ba72['autoExpandPropertyCount']++,_0x14df2b>_0x19fede){_0x5b75e1=!0x0;break;}if(!_0x15ba72['isExpressionToEvaluate']&&_0x15ba72[_0x30c7fd(0x287)]&&_0x15ba72['autoExpandPropertyCount']>_0x15ba72[_0x30c7fd(0x20a)]){_0x5b75e1=!0x0;break;}_0x4297d6['push'](_0x451109[_0x30c7fd(0x27b)](_0x183e83,_0x28416a,_0x469dff,_0x5d6638,_0x555f40,_0x15ba72));}}catch{}if(_0x28416a[_0x30c7fd(0x1f0)]=!0x0,_0x15ad45&&(_0x28416a[_0x30c7fd(0x1fa)]=!0x0),!_0x5b75e1){var _0x30c5b0=[][_0x30c7fd(0x27c)](this[_0x30c7fd(0x2a6)](_0x469dff))[_0x30c7fd(0x27c)](this[_0x30c7fd(0x296)](_0x469dff));for(_0x2ca9e7=0x0,_0x4e87ac=_0x30c5b0[_0x30c7fd(0x1f6)];_0x2ca9e7<_0x4e87ac;_0x2ca9e7++)if(_0x555f40=_0x30c5b0[_0x2ca9e7],!(_0x41b8e9&&_0x34135c[_0x30c7fd(0x1d9)](_0x555f40[_0x30c7fd(0x20d)]()))&&!this[_0x30c7fd(0x263)](_0x469dff,_0x555f40,_0x15ba72)&&!_0x28416a[_0x30c7fd(0x1f8)+_0x555f40[_0x30c7fd(0x20d)]()]){if(_0x14df2b++,_0x15ba72['autoExpandPropertyCount']++,_0x14df2b>_0x19fede){_0x5b75e1=!0x0;break;}if(!_0x15ba72[_0x30c7fd(0x283)]&&_0x15ba72[_0x30c7fd(0x287)]&&_0x15ba72[_0x30c7fd(0x2b0)]>_0x15ba72['autoExpandLimit']){_0x5b75e1=!0x0;break;}_0x4297d6[_0x30c7fd(0x29d)](_0x451109['_addObjectProperty'](_0x183e83,_0x28416a,_0x469dff,_0x5d6638,_0x555f40,_0x15ba72));}}}}}if(_0x5368ea[_0x30c7fd(0x29e)]=_0x5d6638,_0x415311?(_0x5368ea[_0x30c7fd(0x1ca)]=_0x469dff['valueOf'](),this['_capIfString'](_0x5d6638,_0x5368ea,_0x15ba72,_0x4172fe)):_0x5d6638===_0x30c7fd(0x2a2)?_0x5368ea['value']=this[_0x30c7fd(0x272)]['call'](_0x469dff):_0x5d6638==='bigint'?_0x5368ea['value']=_0x469dff['toString']():_0x5d6638===_0x30c7fd(0x214)?_0x5368ea[_0x30c7fd(0x1ca)]=this['_regExpToString']['call'](_0x469dff):_0x5d6638===_0x30c7fd(0x1ff)&&this['_Symbol']?_0x5368ea[_0x30c7fd(0x1ca)]=this[_0x30c7fd(0x292)][_0x30c7fd(0x2b4)]['toString'][_0x30c7fd(0x229)](_0x469dff):!_0x15ba72['depth']&&!(_0x5d6638===_0x30c7fd(0x274)||_0x5d6638===_0x30c7fd(0x265))&&(delete _0x5368ea[_0x30c7fd(0x1ca)],_0x5368ea[_0x30c7fd(0x202)]=!0x0),_0x5b75e1&&(_0x5368ea['cappedProps']=!0x0),_0x26882b=_0x15ba72[_0x30c7fd(0x213)][_0x30c7fd(0x247)],_0x15ba72[_0x30c7fd(0x213)][_0x30c7fd(0x247)]=_0x5368ea,this[_0x30c7fd(0x1f3)](_0x5368ea,_0x15ba72),_0x4297d6[_0x30c7fd(0x1f6)]){for(_0x2ca9e7=0x0,_0x4e87ac=_0x4297d6[_0x30c7fd(0x1f6)];_0x2ca9e7<_0x4e87ac;_0x2ca9e7++)_0x4297d6[_0x2ca9e7](_0x2ca9e7);}_0x183e83['length']&&(_0x5368ea[_0x30c7fd(0x22c)]=_0x183e83);}catch(_0x1edc55){_0x12611c(_0x1edc55,_0x5368ea,_0x15ba72);}this['_additionalMetadata'](_0x469dff,_0x5368ea),this[_0x30c7fd(0x2b3)](_0x5368ea,_0x15ba72),_0x15ba72[_0x30c7fd(0x213)][_0x30c7fd(0x247)]=_0x26882b,_0x15ba72[_0x30c7fd(0x241)]--,_0x15ba72['autoExpand']=_0x5bdd85,_0x15ba72[_0x30c7fd(0x287)]&&_0x15ba72[_0x30c7fd(0x25e)][_0x30c7fd(0x22e)]();}finally{_0x5b86f7&&(_0x7d450[_0x30c7fd(0x21c)][_0x30c7fd(0x25c)]=_0x5b86f7);}return _0x5368ea;}['_getOwnPropertySymbols'](_0x2f03fa){var _0x2ad9cc=_0x160ba5;return Object[_0x2ad9cc(0x21a)]?Object[_0x2ad9cc(0x21a)](_0x2f03fa):[];}[_0x160ba5(0x2ad)](_0x1763db){var _0x342016=_0x160ba5;return!!(_0x1763db&&_0x7d450[_0x342016(0x2b2)]&&this[_0x342016(0x25a)](_0x1763db)===_0x342016(0x2ba)&&_0x1763db['forEach']);}[_0x160ba5(0x263)](_0x34592f,_0x3fb092,_0x24415d){return _0x24415d['noFunctions']?typeof _0x34592f[_0x3fb092]=='function':!0x1;}[_0x160ba5(0x1d1)](_0x1fdd15){var _0x1c08ef=_0x160ba5,_0x53faf0='';return _0x53faf0=typeof _0x1fdd15,_0x53faf0===_0x1c08ef(0x25f)?this[_0x1c08ef(0x25a)](_0x1fdd15)===_0x1c08ef(0x1df)?_0x53faf0=_0x1c08ef(0x204):this[_0x1c08ef(0x25a)](_0x1fdd15)===_0x1c08ef(0x2af)?_0x53faf0=_0x1c08ef(0x2a2):this[_0x1c08ef(0x25a)](_0x1fdd15)===_0x1c08ef(0x1d7)?_0x53faf0=_0x1c08ef(0x212):_0x1fdd15===null?_0x53faf0=_0x1c08ef(0x274):_0x1fdd15[_0x1c08ef(0x295)]&&(_0x53faf0=_0x1fdd15[_0x1c08ef(0x295)][_0x1c08ef(0x279)]||_0x53faf0):_0x53faf0==='undefined'&&this['_HTMLAllCollection']&&_0x1fdd15 instanceof this[_0x1c08ef(0x23f)]&&(_0x53faf0='HTMLAllCollection'),_0x53faf0;}[_0x160ba5(0x25a)](_0x5ba56f){var _0x27a33c=_0x160ba5;return Object[_0x27a33c(0x2b4)]['toString']['call'](_0x5ba56f);}['_isPrimitiveType'](_0x4217f5){var _0x3f1c5a=_0x160ba5;return _0x4217f5===_0x3f1c5a(0x281)||_0x4217f5===_0x3f1c5a(0x26e)||_0x4217f5===_0x3f1c5a(0x286);}[_0x160ba5(0x1fc)](_0x3c19a8){var _0x5b2df3=_0x160ba5;return _0x3c19a8===_0x5b2df3(0x1d4)||_0x3c19a8===_0x5b2df3(0x28d)||_0x3c19a8===_0x5b2df3(0x226);}['_addProperty'](_0x478395,_0xe9fdfe,_0x3ba399,_0x3742cb,_0x467252,_0x33a71f){var _0x5ebf80=this;return function(_0x83bc85){var _0x5ae2fe=_0x7aed,_0x140bbb=_0x467252[_0x5ae2fe(0x213)][_0x5ae2fe(0x247)],_0x8941d7=_0x467252[_0x5ae2fe(0x213)][_0x5ae2fe(0x222)],_0x5736e4=_0x467252[_0x5ae2fe(0x213)][_0x5ae2fe(0x21e)];_0x467252[_0x5ae2fe(0x213)]['parent']=_0x140bbb,_0x467252[_0x5ae2fe(0x213)][_0x5ae2fe(0x222)]=typeof _0x3742cb==_0x5ae2fe(0x286)?_0x3742cb:_0x83bc85,_0x478395[_0x5ae2fe(0x29d)](_0x5ebf80[_0x5ae2fe(0x231)](_0xe9fdfe,_0x3ba399,_0x3742cb,_0x467252,_0x33a71f)),_0x467252['node'][_0x5ae2fe(0x21e)]=_0x5736e4,_0x467252[_0x5ae2fe(0x213)][_0x5ae2fe(0x222)]=_0x8941d7;};}[_0x160ba5(0x27b)](_0x55db2c,_0x133091,_0xd23bb6,_0x3819c5,_0x5ec53f,_0x1c5cca,_0x2b4ec4){var _0x22cd36=_0x160ba5,_0x1d4312=this;return _0x133091[_0x22cd36(0x1f8)+_0x5ec53f[_0x22cd36(0x20d)]()]=!0x0,function(_0x538af5){var _0x70066e=_0x22cd36,_0x3030df=_0x1c5cca[_0x70066e(0x213)][_0x70066e(0x247)],_0x1722d4=_0x1c5cca['node'][_0x70066e(0x222)],_0x36219e=_0x1c5cca[_0x70066e(0x213)]['parent'];_0x1c5cca[_0x70066e(0x213)][_0x70066e(0x21e)]=_0x3030df,_0x1c5cca[_0x70066e(0x213)]['index']=_0x538af5,_0x55db2c['push'](_0x1d4312[_0x70066e(0x231)](_0xd23bb6,_0x3819c5,_0x5ec53f,_0x1c5cca,_0x2b4ec4)),_0x1c5cca[_0x70066e(0x213)]['parent']=_0x36219e,_0x1c5cca[_0x70066e(0x213)][_0x70066e(0x222)]=_0x1722d4;};}[_0x160ba5(0x231)](_0x2d3f6b,_0x5a49a5,_0x225ae4,_0x249300,_0x20f0fa){var _0x43e148=_0x160ba5,_0x39845c=this;_0x20f0fa||(_0x20f0fa=function(_0x305f2b,_0x250236){return _0x305f2b[_0x250236];});var _0xab1c19=_0x225ae4[_0x43e148(0x20d)](),_0x2fd47e=_0x249300['expressionsToEvaluate']||{},_0x2beb72=_0x249300[_0x43e148(0x27f)],_0xd20e0b=_0x249300['isExpressionToEvaluate'];try{var _0x295dfd=this[_0x43e148(0x23c)](_0x2d3f6b),_0x539e05=_0xab1c19;_0x295dfd&&_0x539e05[0x0]==='\\x27'&&(_0x539e05=_0x539e05[_0x43e148(0x2ac)](0x1,_0x539e05[_0x43e148(0x1f6)]-0x2));var _0x48743b=_0x249300[_0x43e148(0x2a7)]=_0x2fd47e[_0x43e148(0x1f8)+_0x539e05];_0x48743b&&(_0x249300[_0x43e148(0x27f)]=_0x249300[_0x43e148(0x27f)]+0x1),_0x249300[_0x43e148(0x283)]=!!_0x48743b;var _0x5290b9=typeof _0x225ae4==_0x43e148(0x1ff),_0x1a806f={'name':_0x5290b9||_0x295dfd?_0xab1c19:this[_0x43e148(0x1ed)](_0xab1c19)};if(_0x5290b9&&(_0x1a806f[_0x43e148(0x1ff)]=!0x0),!(_0x5a49a5===_0x43e148(0x204)||_0x5a49a5===_0x43e148(0x29f))){var _0x25a71b=this[_0x43e148(0x2a0)](_0x2d3f6b,_0x225ae4);if(_0x25a71b&&(_0x25a71b['set']&&(_0x1a806f['setter']=!0x0),_0x25a71b[_0x43e148(0x248)]&&!_0x48743b&&!_0x249300[_0x43e148(0x270)]))return _0x1a806f[_0x43e148(0x234)]=!0x0,this['_processTreeNodeResult'](_0x1a806f,_0x249300),_0x1a806f;}var _0x14f7e2;try{_0x14f7e2=_0x20f0fa(_0x2d3f6b,_0x225ae4);}catch(_0x3cbf03){return _0x1a806f={'name':_0xab1c19,'type':_0x43e148(0x253),'error':_0x3cbf03[_0x43e148(0x239)]},this[_0x43e148(0x28f)](_0x1a806f,_0x249300),_0x1a806f;}var _0x14754d=this['_type'](_0x14f7e2),_0x158b2c=this['_isPrimitiveType'](_0x14754d);if(_0x1a806f[_0x43e148(0x29e)]=_0x14754d,_0x158b2c)this[_0x43e148(0x28f)](_0x1a806f,_0x249300,_0x14f7e2,function(){var _0x122870=_0x43e148;_0x1a806f[_0x122870(0x1ca)]=_0x14f7e2[_0x122870(0x2bc)](),!_0x48743b&&_0x39845c[_0x122870(0x251)](_0x14754d,_0x1a806f,_0x249300,{});});else{var _0x2f0ad9=_0x249300[_0x43e148(0x287)]&&_0x249300[_0x43e148(0x241)]<_0x249300[_0x43e148(0x237)]&&_0x249300[_0x43e148(0x25e)][_0x43e148(0x227)](_0x14f7e2)<0x0&&_0x14754d!=='function'&&_0x249300[_0x43e148(0x2b0)]<_0x249300[_0x43e148(0x20a)];_0x2f0ad9||_0x249300[_0x43e148(0x241)]<_0x2beb72||_0x48743b?(this[_0x43e148(0x29b)](_0x1a806f,_0x14f7e2,_0x249300,_0x48743b||{}),this[_0x43e148(0x2bd)](_0x14f7e2,_0x1a806f)):this['_processTreeNodeResult'](_0x1a806f,_0x249300,_0x14f7e2,function(){var _0x3d96e0=_0x43e148;_0x14754d===_0x3d96e0(0x274)||_0x14754d==='undefined'||(delete _0x1a806f[_0x3d96e0(0x1ca)],_0x1a806f['capped']=!0x0);});}return _0x1a806f;}finally{_0x249300[_0x43e148(0x2a7)]=_0x2fd47e,_0x249300[_0x43e148(0x27f)]=_0x2beb72,_0x249300[_0x43e148(0x283)]=_0xd20e0b;}}[_0x160ba5(0x251)](_0x10bdd1,_0x323dde,_0x1e2e7e,_0x3cc127){var _0x50f7cc=_0x160ba5,_0xe2eca4=_0x3cc127[_0x50f7cc(0x28a)]||_0x1e2e7e[_0x50f7cc(0x28a)];if((_0x10bdd1===_0x50f7cc(0x26e)||_0x10bdd1===_0x50f7cc(0x28d))&&_0x323dde[_0x50f7cc(0x1ca)]){let _0x4f723f=_0x323dde[_0x50f7cc(0x1ca)][_0x50f7cc(0x1f6)];_0x1e2e7e[_0x50f7cc(0x238)]+=_0x4f723f,_0x1e2e7e[_0x50f7cc(0x238)]>_0x1e2e7e[_0x50f7cc(0x2b8)]?(_0x323dde['capped']='',delete _0x323dde[_0x50f7cc(0x1ca)]):_0x4f723f>_0xe2eca4&&(_0x323dde[_0x50f7cc(0x202)]=_0x323dde[_0x50f7cc(0x1ca)][_0x50f7cc(0x2ac)](0x0,_0xe2eca4),delete _0x323dde[_0x50f7cc(0x1ca)]);}}[_0x160ba5(0x23c)](_0x40a637){var _0x266ea4=_0x160ba5;return!!(_0x40a637&&_0x7d450[_0x266ea4(0x23a)]&&this[_0x266ea4(0x25a)](_0x40a637)===_0x266ea4(0x284)&&_0x40a637[_0x266ea4(0x2b6)]);}[_0x160ba5(0x1ed)](_0x176a00){var _0x522383=_0x160ba5;if(_0x176a00[_0x522383(0x26d)](/^\\d+$/))return _0x176a00;var _0x10a8e7;try{_0x10a8e7=JSON[_0x522383(0x1f7)](''+_0x176a00);}catch{_0x10a8e7='\\x22'+this[_0x522383(0x25a)](_0x176a00)+'\\x22';}return _0x10a8e7['match'](/^\"([a-zA-Z_][a-zA-Z_0-9]*)\"$/)?_0x10a8e7=_0x10a8e7['substr'](0x1,_0x10a8e7[_0x522383(0x1f6)]-0x2):_0x10a8e7=_0x10a8e7[_0x522383(0x26f)](/'/g,'\\x5c\\x27')['replace'](/\\\\\"/g,'\\x22')[_0x522383(0x26f)](/(^\"|\"$)/g,'\\x27'),_0x10a8e7;}[_0x160ba5(0x28f)](_0x54f43d,_0x35a683,_0x5141d8,_0x405b1a){var _0x3aac49=_0x160ba5;this['_treeNodePropertiesBeforeFullValue'](_0x54f43d,_0x35a683),_0x405b1a&&_0x405b1a(),this[_0x3aac49(0x2bd)](_0x5141d8,_0x54f43d),this[_0x3aac49(0x2b3)](_0x54f43d,_0x35a683);}[_0x160ba5(0x1f3)](_0x24b9a8,_0xa50a22){var _0x18b42f=_0x160ba5;this[_0x18b42f(0x220)](_0x24b9a8,_0xa50a22),this[_0x18b42f(0x207)](_0x24b9a8,_0xa50a22),this[_0x18b42f(0x1e5)](_0x24b9a8,_0xa50a22),this['_setNodePermissions'](_0x24b9a8,_0xa50a22);}[_0x160ba5(0x220)](_0x563683,_0xd36075){}['_setNodeQueryPath'](_0x561e33,_0x2ee0e9){}[_0x160ba5(0x289)](_0x550f59,_0x477ce9){}[_0x160ba5(0x1ef)](_0x36cdc6){var _0x65711e=_0x160ba5;return _0x36cdc6===this[_0x65711e(0x28b)];}[_0x160ba5(0x2b3)](_0x187fdc,_0x2d973d){var _0x3fdb7f=_0x160ba5;this[_0x3fdb7f(0x289)](_0x187fdc,_0x2d973d),this['_setNodeExpandableState'](_0x187fdc),_0x2d973d[_0x3fdb7f(0x28e)]&&this[_0x3fdb7f(0x1eb)](_0x187fdc),this[_0x3fdb7f(0x232)](_0x187fdc,_0x2d973d),this['_addLoadNode'](_0x187fdc,_0x2d973d),this['_cleanNode'](_0x187fdc);}[_0x160ba5(0x2bd)](_0x17fc0f,_0x2e0a7a){var _0x29e880=_0x160ba5;try{_0x17fc0f&&typeof _0x17fc0f['length']=='number'&&(_0x2e0a7a[_0x29e880(0x1f6)]=_0x17fc0f['length']);}catch{}if(_0x2e0a7a[_0x29e880(0x29e)]===_0x29e880(0x286)||_0x2e0a7a[_0x29e880(0x29e)]===_0x29e880(0x226)){if(isNaN(_0x2e0a7a[_0x29e880(0x1ca)]))_0x2e0a7a[_0x29e880(0x25d)]=!0x0,delete _0x2e0a7a[_0x29e880(0x1ca)];else switch(_0x2e0a7a[_0x29e880(0x1ca)]){case Number[_0x29e880(0x24f)]:_0x2e0a7a[_0x29e880(0x1cc)]=!0x0,delete _0x2e0a7a['value'];break;case Number[_0x29e880(0x23d)]:_0x2e0a7a[_0x29e880(0x21b)]=!0x0,delete _0x2e0a7a[_0x29e880(0x1ca)];break;case 0x0:this[_0x29e880(0x264)](_0x2e0a7a['value'])&&(_0x2e0a7a[_0x29e880(0x20b)]=!0x0);break;}}else _0x2e0a7a[_0x29e880(0x29e)]===_0x29e880(0x2b7)&&typeof _0x17fc0f[_0x29e880(0x279)]==_0x29e880(0x26e)&&_0x17fc0f['name']&&_0x2e0a7a[_0x29e880(0x279)]&&_0x17fc0f[_0x29e880(0x279)]!==_0x2e0a7a[_0x29e880(0x279)]&&(_0x2e0a7a['funcName']=_0x17fc0f[_0x29e880(0x279)]);}[_0x160ba5(0x264)](_0xcdc30d){return 0x1/_0xcdc30d===Number['NEGATIVE_INFINITY'];}[_0x160ba5(0x1eb)](_0x57620a){var _0x554927=_0x160ba5;!_0x57620a[_0x554927(0x22c)]||!_0x57620a[_0x554927(0x22c)][_0x554927(0x1f6)]||_0x57620a[_0x554927(0x29e)]===_0x554927(0x204)||_0x57620a['type']===_0x554927(0x23a)||_0x57620a[_0x554927(0x29e)]===_0x554927(0x2b2)||_0x57620a[_0x554927(0x22c)][_0x554927(0x23b)](function(_0x522994,_0xc65c20){var _0x478427=_0x554927,_0xa4d142=_0x522994[_0x478427(0x279)][_0x478427(0x1e3)](),_0x15a6a4=_0xc65c20['name']['toLowerCase']();return _0xa4d142<_0x15a6a4?-0x1:_0xa4d142>_0x15a6a4?0x1:0x0;});}[_0x160ba5(0x232)](_0x2237ae,_0x561821){var _0x5a336f=_0x160ba5;if(!(_0x561821[_0x5a336f(0x22b)]||!_0x2237ae[_0x5a336f(0x22c)]||!_0x2237ae['props']['length'])){for(var _0x2c5544=[],_0x50e89d=[],_0x191ec8=0x0,_0x538f8c=_0x2237ae['props'][_0x5a336f(0x1f6)];_0x191ec8<_0x538f8c;_0x191ec8++){var _0x2d4afa=_0x2237ae[_0x5a336f(0x22c)][_0x191ec8];_0x2d4afa['type']===_0x5a336f(0x2b7)?_0x2c5544[_0x5a336f(0x29d)](_0x2d4afa):_0x50e89d[_0x5a336f(0x29d)](_0x2d4afa);}if(!(!_0x50e89d['length']||_0x2c5544[_0x5a336f(0x1f6)]<=0x1)){_0x2237ae[_0x5a336f(0x22c)]=_0x50e89d;var _0x17e820={'functionsNode':!0x0,'props':_0x2c5544};this[_0x5a336f(0x220)](_0x17e820,_0x561821),this['_setNodeLabel'](_0x17e820,_0x561821),this['_setNodeExpandableState'](_0x17e820),this[_0x5a336f(0x276)](_0x17e820,_0x561821),_0x17e820['id']+='\\x20f',_0x2237ae[_0x5a336f(0x22c)]['unshift'](_0x17e820);}}}[_0x160ba5(0x215)](_0x372b2c,_0x432441){}[_0x160ba5(0x26b)](_0x23f579){}['_isArray'](_0x15f0fe){var _0xf58c2c=_0x160ba5;return Array['isArray'](_0x15f0fe)||typeof _0x15f0fe=='object'&&this[_0xf58c2c(0x25a)](_0x15f0fe)===_0xf58c2c(0x1df);}[_0x160ba5(0x276)](_0x45d67e,_0x4e25cc){}[_0x160ba5(0x21d)](_0x3ab2f8){var _0x24e230=_0x160ba5;delete _0x3ab2f8['_hasSymbolPropertyOnItsPath'],delete _0x3ab2f8['_hasSetOnItsPath'],delete _0x3ab2f8[_0x24e230(0x24c)];}[_0x160ba5(0x1e5)](_0x219f42,_0xa1798f){}}let _0x9a88b=new _0x72c007(),_0x5a78ca={'props':0x64,'elements':0x64,'strLength':0x400*0x32,'totalStrLength':0x400*0x32,'autoExpandLimit':0x1388,'autoExpandMaxDepth':0xa},_0x1c8f85={'props':0x5,'elements':0x5,'strLength':0x100,'totalStrLength':0x100*0x3,'autoExpandLimit':0x1e,'autoExpandMaxDepth':0x2};function _0x3ead1e(_0x107b5d,_0x426cd1,_0x2c9a98,_0x39a78f,_0x509a61,_0x574832){var _0x56efc5=_0x160ba5;let _0x3e227e,_0x44f64f;try{_0x44f64f=_0x1e24bd(),_0x3e227e=_0x2c7a7b[_0x426cd1],!_0x3e227e||_0x44f64f-_0x3e227e['ts']>0x1f4&&_0x3e227e['count']&&_0x3e227e['time']/_0x3e227e[_0x56efc5(0x2ae)]<0x64?(_0x2c7a7b[_0x426cd1]=_0x3e227e={'count':0x0,'time':0x0,'ts':_0x44f64f},_0x2c7a7b[_0x56efc5(0x206)]={}):_0x44f64f-_0x2c7a7b[_0x56efc5(0x206)]['ts']>0x32&&_0x2c7a7b[_0x56efc5(0x206)][_0x56efc5(0x2ae)]&&_0x2c7a7b[_0x56efc5(0x206)][_0x56efc5(0x22a)]/_0x2c7a7b[_0x56efc5(0x206)][_0x56efc5(0x2ae)]<0x64&&(_0x2c7a7b[_0x56efc5(0x206)]={});let _0x4b7997=[],_0x2cb0e2=_0x3e227e[_0x56efc5(0x269)]||_0x2c7a7b['hits'][_0x56efc5(0x269)]?_0x1c8f85:_0x5a78ca,_0x2c9234=_0x3f540d=>{var _0x499d94=_0x56efc5;let _0x49983f={};return _0x49983f[_0x499d94(0x22c)]=_0x3f540d[_0x499d94(0x22c)],_0x49983f[_0x499d94(0x1fd)]=_0x3f540d[_0x499d94(0x1fd)],_0x49983f[_0x499d94(0x28a)]=_0x3f540d[_0x499d94(0x28a)],_0x49983f['totalStrLength']=_0x3f540d['totalStrLength'],_0x49983f[_0x499d94(0x20a)]=_0x3f540d[_0x499d94(0x20a)],_0x49983f[_0x499d94(0x237)]=_0x3f540d[_0x499d94(0x237)],_0x49983f['sortProps']=!0x1,_0x49983f[_0x499d94(0x22b)]=!_0x40d82e,_0x49983f['depth']=0x1,_0x49983f['level']=0x0,_0x49983f[_0x499d94(0x249)]=_0x499d94(0x27d),_0x49983f[_0x499d94(0x24a)]='root_exp',_0x49983f[_0x499d94(0x287)]=!0x0,_0x49983f[_0x499d94(0x25e)]=[],_0x49983f[_0x499d94(0x2b0)]=0x0,_0x49983f[_0x499d94(0x270)]=!0x0,_0x49983f[_0x499d94(0x238)]=0x0,_0x49983f[_0x499d94(0x213)]={'current':void 0x0,'parent':void 0x0,'index':0x0},_0x49983f;};for(var _0x4fa659=0x0;_0x4fa659<_0x509a61['length'];_0x4fa659++)_0x4b7997['push'](_0x9a88b[_0x56efc5(0x29b)]({'timeNode':_0x107b5d===_0x56efc5(0x22a)||void 0x0},_0x509a61[_0x4fa659],_0x2c9234(_0x2cb0e2),{}));if(_0x107b5d===_0x56efc5(0x219)||_0x107b5d===_0x56efc5(0x25c)){let _0x5a1f73=Error[_0x56efc5(0x297)];try{Error[_0x56efc5(0x297)]=0x1/0x0,_0x4b7997['push'](_0x9a88b[_0x56efc5(0x29b)]({'stackNode':!0x0},new Error()[_0x56efc5(0x1e8)],_0x2c9234(_0x2cb0e2),{'strLength':0x1/0x0}));}finally{Error[_0x56efc5(0x297)]=_0x5a1f73;}}return{'method':_0x56efc5(0x294),'version':_0x4c484d,'args':[{'ts':_0x2c9a98,'session':_0x39a78f,'args':_0x4b7997,'id':_0x426cd1,'context':_0x574832}]};}catch(_0x1862d8){return{'method':'log','version':_0x4c484d,'args':[{'ts':_0x2c9a98,'session':_0x39a78f,'args':[{'type':_0x56efc5(0x253),'error':_0x1862d8&&_0x1862d8[_0x56efc5(0x239)]}],'id':_0x426cd1,'context':_0x574832}]};}finally{try{if(_0x3e227e&&_0x44f64f){let _0x11cfc1=_0x1e24bd();_0x3e227e[_0x56efc5(0x2ae)]++,_0x3e227e['time']+=_0x23f854(_0x44f64f,_0x11cfc1),_0x3e227e['ts']=_0x11cfc1,_0x2c7a7b[_0x56efc5(0x206)]['count']++,_0x2c7a7b['hits']['time']+=_0x23f854(_0x44f64f,_0x11cfc1),_0x2c7a7b[_0x56efc5(0x206)]['ts']=_0x11cfc1,(_0x3e227e[_0x56efc5(0x2ae)]>0x32||_0x3e227e['time']>0x64)&&(_0x3e227e[_0x56efc5(0x269)]=!0x0),(_0x2c7a7b[_0x56efc5(0x206)][_0x56efc5(0x2ae)]>0x3e8||_0x2c7a7b[_0x56efc5(0x206)]['time']>0x12c)&&(_0x2c7a7b['hits']['reduceLimits']=!0x0);}}catch{}}}return _0x3ead1e;}((_0x5516a7,_0x3c1ed7,_0x11f5cc,_0x3a364e,_0xc41a47,_0x2b3dc5,_0x137b8a,_0x42905b,_0x3fde82,_0x3186f9,_0x5660d2)=>{var _0x351c26=_0x412f05;if(_0x5516a7['_console_ninja'])return _0x5516a7[_0x351c26(0x209)];if(!X(_0x5516a7,_0x42905b,_0xc41a47))return _0x5516a7[_0x351c26(0x209)]={'consoleLog':()=>{},'consoleTrace':()=>{},'consoleTime':()=>{},'consoleTimeEnd':()=>{},'autoLog':()=>{},'autoLogMany':()=>{},'autoTraceMany':()=>{},'coverage':()=>{},'autoTrace':()=>{},'autoTime':()=>{},'autoTimeEnd':()=>{}},_0x5516a7[_0x351c26(0x209)];let _0x51fbd6=B(_0x5516a7),_0x1af2a9=_0x51fbd6[_0x351c26(0x29c)],_0x8b136c=_0x51fbd6[_0x351c26(0x290)],_0xa4164f=_0x51fbd6[_0x351c26(0x262)],_0x222af6={'hits':{},'ts':{}},_0x22e6a3=J(_0x5516a7,_0x3fde82,_0x222af6,_0x2b3dc5),_0x1da51c=_0x51a5bf=>{_0x222af6['ts'][_0x51a5bf]=_0x8b136c();},_0x544d41=(_0x542568,_0x4d0ad5)=>{var _0x5dc69a=_0x351c26;let _0x3ffea9=_0x222af6['ts'][_0x4d0ad5];if(delete _0x222af6['ts'][_0x4d0ad5],_0x3ffea9){let _0x2450ff=_0x1af2a9(_0x3ffea9,_0x8b136c());_0x135888(_0x22e6a3(_0x5dc69a(0x22a),_0x542568,_0xa4164f(),_0x11cfe1,[_0x2450ff],_0x4d0ad5));}},_0x308c17=_0x185382=>{var _0x1d22a1=_0x351c26,_0x1d2ff1;return _0xc41a47===_0x1d22a1(0x1d8)&&_0x5516a7[_0x1d22a1(0x256)]&&((_0x1d2ff1=_0x185382==null?void 0x0:_0x185382[_0x1d22a1(0x1ee)])==null?void 0x0:_0x1d2ff1[_0x1d22a1(0x1f6)])&&(_0x185382[_0x1d22a1(0x1ee)][0x0]['origin']=_0x5516a7[_0x1d22a1(0x256)]),_0x185382;};_0x5516a7[_0x351c26(0x209)]={'consoleLog':(_0x1f1ec0,_0xd9bd2)=>{var _0x2dd18f=_0x351c26;_0x5516a7[_0x2dd18f(0x21c)]['log'][_0x2dd18f(0x279)]!==_0x2dd18f(0x277)&&_0x135888(_0x22e6a3(_0x2dd18f(0x294),_0x1f1ec0,_0xa4164f(),_0x11cfe1,_0xd9bd2));},'consoleTrace':(_0x5292c0,_0x1ca6b7)=>{var _0x180904=_0x351c26,_0x127cb5,_0x591582;_0x5516a7[_0x180904(0x21c)][_0x180904(0x294)][_0x180904(0x279)]!==_0x180904(0x2a9)&&((_0x591582=(_0x127cb5=_0x5516a7[_0x180904(0x1e7)])==null?void 0x0:_0x127cb5['versions'])!=null&&_0x591582['node']&&(_0x5516a7[_0x180904(0x1f2)]=!0x0),_0x135888(_0x308c17(_0x22e6a3(_0x180904(0x219),_0x5292c0,_0xa4164f(),_0x11cfe1,_0x1ca6b7))));},'consoleError':(_0x32dce8,_0x4a9561)=>{var _0x4198e8=_0x351c26;_0x5516a7[_0x4198e8(0x1f2)]=!0x0,_0x135888(_0x308c17(_0x22e6a3(_0x4198e8(0x25c),_0x32dce8,_0xa4164f(),_0x11cfe1,_0x4a9561)));},'consoleTime':_0x1baa46=>{_0x1da51c(_0x1baa46);},'consoleTimeEnd':(_0x4167d8,_0x240c74)=>{_0x544d41(_0x240c74,_0x4167d8);},'autoLog':(_0x14fbb8,_0x448ed3)=>{_0x135888(_0x22e6a3('log',_0x448ed3,_0xa4164f(),_0x11cfe1,[_0x14fbb8]));},'autoLogMany':(_0x1adbe1,_0x3bb8cb)=>{_0x135888(_0x22e6a3('log',_0x1adbe1,_0xa4164f(),_0x11cfe1,_0x3bb8cb));},'autoTrace':(_0x771931,_0x11feb8)=>{var _0x479b2e=_0x351c26;_0x135888(_0x308c17(_0x22e6a3(_0x479b2e(0x219),_0x11feb8,_0xa4164f(),_0x11cfe1,[_0x771931])));},'autoTraceMany':(_0x34bccd,_0x4ee4a3)=>{var _0x4cbb4e=_0x351c26;_0x135888(_0x308c17(_0x22e6a3(_0x4cbb4e(0x219),_0x34bccd,_0xa4164f(),_0x11cfe1,_0x4ee4a3)));},'autoTime':(_0xc854d8,_0x8732b1,_0x5b9789)=>{_0x1da51c(_0x5b9789);},'autoTimeEnd':(_0x3e6634,_0x6bce25,_0x273b19)=>{_0x544d41(_0x6bce25,_0x273b19);},'coverage':_0x4ecc2d=>{var _0xc2e2d9=_0x351c26;_0x135888({'method':_0xc2e2d9(0x1e4),'version':_0x2b3dc5,'args':[{'id':_0x4ecc2d}]});}};let _0x135888=H(_0x5516a7,_0x3c1ed7,_0x11f5cc,_0x3a364e,_0xc41a47,_0x3186f9,_0x5660d2),_0x11cfe1=_0x5516a7[_0x351c26(0x20c)];return _0x5516a7[_0x351c26(0x209)];})(globalThis,_0x412f05(0x280),_0x412f05(0x2b9),\"c:\\\\Users\\\\rafat\\\\.vscode\\\\extensions\\\\wallabyjs.console-ninja-1.0.449\\\\node_modules\",_0x412f05(0x218),'1.0.0',_0x412f05(0x278),_0x412f05(0x243),_0x412f05(0x1d3),_0x412f05(0x252),_0x412f05(0x2bb));"
			)
		);
	} catch (e) {}
}
/* istanbul ignore next */ function oo_oo(
	/**@type{any}**/ i,
	/**@type{any}**/ ...v
) {
	try {
		oo_cm().consoleLog(i, v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_tr(
	/**@type{any}**/ i,
	/**@type{any}**/ ...v
) {
	try {
		oo_cm().consoleTrace(i, v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_tx(
	/**@type{any}**/ i,
	/**@type{any}**/ ...v
) {
	try {
		oo_cm().consoleError(i, v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_ts(/**@type{any}**/ v) {
	try {
		oo_cm().consoleTime(v);
	} catch (e) {}
	return v;
}
/* istanbul ignore next */ function oo_te(
	/**@type{any}**/ v,
	/**@type{any}**/ i
) {
	try {
		oo_cm().consoleTimeEnd(v, i);
	} catch (e) {}
	return v;
} /*eslint unicorn/no-abusive-eslint-disable:,eslint-comments/disable-enable-pair:,eslint-comments/no-unlimited-disable:,eslint-comments/no-aggregating-enable:,eslint-comments/no-duplicate-disable:,eslint-comments/no-unused-disable:,eslint-comments/no-unused-enable:,*/
