/**
 * FlahaSoil Demo Page JavaScript
 * Restricted functionality - no user input allowed
 * @format
 */

// Disable right-click context menu
document.addEventListener("contextmenu", function (e) {
	e.preventDefault();
});

// Disable F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S
document.addEventListener("keydown", function (e) {
	// Disable F12
	if (e.keyCode === 123) {
		e.preventDefault();
	}
	// Disable Ctrl+Shift+I (Developer Tools)
	if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
		e.preventDefault();
	}
	// Disable Ctrl+U (View Source)
	if (e.ctrlKey && e.keyCode === 85) {
		e.preventDefault();
	}
	// Disable Ctrl+S (Save)
	if (e.ctrlKey && e.keyCode === 83) {
		e.preventDefault();
	}
	// Disable Ctrl+A (Select All)
	if (e.ctrlKey && e.keyCode === 65) {
		e.preventDefault();
	}
	// Disable Ctrl+C (Copy)
	if (e.ctrlKey && e.keyCode === 67) {
		e.preventDefault();
	}
	// Disable Ctrl+P (Print)
	if (e.ctrlKey && e.keyCode === 80) {
		e.preventDefault();
	}
});

// Initialize demo when page loads
document.addEventListener("DOMContentLoaded", function () {
	initializeDemo();
});

/**
 * Initialize demo with preset values
 */
function initializeDemo() {
	// Show demo notice
	showDemoNotice();

	// Disable all inputs
	disableInputs();

	// Set demo values
	setDemoValues();
}

/**
 * Show demo limitation notice
 */
function showDemoNotice() {
	setTimeout(() => {
		const notice = document.querySelector(".demo-notice");
		if (notice) {
			notice.style.animation = "fadeIn 0.5s ease-in";
		}
	}, 500);
}

/**
 * Disable all input functionality
 */
function disableInputs() {
	const inputs = document.querySelectorAll(".demo-input");
	inputs.forEach((input) => {
		input.addEventListener("focus", function () {
			this.blur();
			showUpgradePrompt();
		});

		input.addEventListener("click", function () {
			showUpgradePrompt();
		});
	});
}

/**
 * Set predefined demo values
 */
function setDemoValues() {
	document.getElementById("sandDemo").value = 45;
	document.getElementById("clayDemo").value = 25;
	document.getElementById("siltDemo").value = 30;
}

/**
 * Run demo calculation with preset values
 */
function runDemoCalculation() {
	// Show loading state
	const button = document.querySelector(".btn-calculate-demo");
	const originalText = button.textContent;
	button.textContent = "Analyzing...";
	button.disabled = true;

	// Simulate calculation delay
	setTimeout(() => {
		showDemoResults();
		button.textContent = originalText;
		button.disabled = false;

		// Generate demo triangle
		generateDemoTriangle();
	}, 1500);
}

/**
 * Show demo results
 */
function showDemoResults() {
	const resultsContainer = document.getElementById("demoResults");
	resultsContainer.style.display = "grid";
	resultsContainer.scrollIntoView({ behavior: "smooth" });

	// Add fade-in animation
	resultsContainer.style.animation = "fadeInUp 0.6s ease-out";
}

/**
 * Generate demo soil triangle visualization
 */
function generateDemoTriangle() {
	const container = document.getElementById("soilTriangle");

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

	// Add demo point (Loam classification)
	const demoPoint = calculateTrianglePosition(45, 25, 30); // Sand, Clay, Silt

	svg
		.append("circle")
		.attr("cx", demoPoint.x)
		.attr("cy", demoPoint.y)
		.attr("r", 8)
		.attr("fill", "#FF6B35")
		.attr("stroke", "white")
		.attr("stroke-width", 2);

	// Add demo point label
	svg
		.append("text")
		.attr("x", demoPoint.x)
		.attr("y", demoPoint.y - 15)
		.attr("text-anchor", "middle")
		.attr("font-weight", "bold")
		.attr("fill", "#FF6B35")
		.attr("font-size", "12px")
		.text("LOAM");

	// Add percentage labels
	svg
		.append("text")
		.attr("x", demoPoint.x + 15)
		.attr("y", demoPoint.y + 5)
		.attr("font-size", "10px")
		.attr("fill", "#666")
		.text("45% Sand, 25% Clay, 30% Silt");
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
	// Create temporary notification
	const notification = document.createElement("div");
	notification.className = "upgrade-notification";
	notification.innerHTML = `
        <div class="notification-content">
            <h4>🔒 Demo Mode</h4>
            <p>Register to input your own soil data and access all features!</p>
            <button onclick="backToLanding()" class="btn-mini">Get Full Access</button>
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
        padding: 20px;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        text-align: center;
        border: 2px solid #FF6B35;
        animation: popIn 0.3s ease-out;
    `;

	// Auto remove after 3 seconds
	setTimeout(() => {
		if (notification.parentNode) {
			notification.remove();
		}
	}, 3000);

	// Add click to close
	notification.addEventListener("click", () => {
		notification.remove();
	});
}

/**
 * Navigate back to landing page
 */
function backToLanding() {
	window.location.href = "./landing.html";
}

// Add CSS animations
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
    
    .upgrade-notification .notification-content h4 {
        margin: 0 0 10px 0;
        color: #FF6B35;
    }
    
    .upgrade-notification .notification-content p {
        margin: 0 0 15px 0;
        color: #666;
    }
    
    .btn-mini {
        background: #FF6B35;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 5px;
        cursor: pointer;
        font-weight: 600;
        font-size: 14px;
    }
    
    .btn-mini:hover {
        background: #E55A2B;
    }
`;
document.head.appendChild(style);
