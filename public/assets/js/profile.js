/**
 * FlahaSoil Profile Page JavaScript
 * Handles user profile management, statistics, and settings
 *
 * @format
 */

// Global state
let currentUser = null;
let userStats = null;
let subscriptionData = null;
let usageAnalytics = null;

// Initialize profile page
document.addEventListener("DOMContentLoaded", function () {
	checkAuthentication();
	initializeAPIClient();
	loadUserProfile();
	loadUserStatistics();
	loadRecentAnalyses();
	loadSubscriptionDetails();
	loadUsageAnalytics();
	setupEventListeners();
	setupRealTimeUpdates();
});

/**
 * Load subscription details
 */
async function loadSubscriptionDetails() {
	try {
		// Get subscription info from API
		const response = await window.flahaSoilAPI.getUserProfile();

		if (response.success && response.data) {
			subscriptionData = {
				tier: response.data.tier,
				status: response.data.subscriptionStatus || "active",
				nextBilling: response.data.nextBilling,
				features: getFeaturesByTier(response.data.tier),
			};

			updateSubscriptionUI();
		}
	} catch (error) {
		console.error("Error loading subscription details:", error);
	}
}

/**
 * Load usage analytics
 */
async function loadUsageAnalytics() {
	try {
		// This would typically come from API
		usageAnalytics = {
			dailyUsage: [5, 8, 12, 6, 15, 9, 11],
			monthlyTrend: [45, 52, 38, 61, 73, 67],
			topFeatures: [
				{ name: "Basic Analysis", usage: 85 },
				{ name: "Advanced Parameters", usage: 42 },
				{ name: "Export Reports", usage: 23 },
			],
		};

		updateAnalyticsUI();
	} catch (error) {
		console.error("Error loading usage analytics:", error);
	}
}

/**
 * Setup real-time updates
 */
function setupRealTimeUpdates() {
	// Refresh usage statistics every 5 minutes
	setInterval(loadUserStatistics, 5 * 60 * 1000);
}

/**
 * Get features by tier
 */
function getFeaturesByTier(tier) {
	const features = {
		FREE: [
			"50 analyses per month",
			"Basic soil calculations",
			"Texture classification",
		],
		PROFESSIONAL: [
			"1,000 analyses per month",
			"Advanced soil calculations",
			"Analysis history",
			"Export capabilities",
			"Priority support",
		],
		ENTERPRISE: [
			"Unlimited analyses",
			"Full API access",
			"Bulk analysis",
			"Custom integrations",
			"Dedicated support",
		],
	};

	return features[tier] || features.FREE;
}

/**
 * Update subscription UI
 */
function updateSubscriptionUI() {
	if (!subscriptionData) return;

	// Update plan badge
	const planBadge = document.getElementById("planBadge");
	if (planBadge) {
		planBadge.textContent = subscriptionData.tier;
		planBadge.className = `plan-badge plan-${subscriptionData.tier.toLowerCase()}`;
	}

	// Update features list
	const featuresList = document.getElementById("featuresList");
	if (featuresList && subscriptionData.features) {
		featuresList.innerHTML = subscriptionData.features
			.map(
				(feature) => `<li><span class="feature-check">✓</span> ${feature}</li>`
			)
			.join("");
	}

	// Update billing info
	if (subscriptionData.nextBilling) {
		const billingDate = document.getElementById("nextBilling");
		if (billingDate) {
			billingDate.textContent = new Date(
				subscriptionData.nextBilling
			).toLocaleDateString();
		}
	}
}

/**
 * Update analytics UI
 */
function updateAnalyticsUI() {
	if (!usageAnalytics) return;

	// Update top features
	const topFeatures = document.getElementById("topFeatures");
	if (topFeatures && usageAnalytics.topFeatures) {
		topFeatures.innerHTML = usageAnalytics.topFeatures
			.map(
				(feature) => `
				<div class="feature-usage">
					<span class="feature-name">${feature.name}</span>
					<div class="usage-bar">
						<div class="usage-fill" style="width: ${feature.usage}%"></div>
					</div>
					<span class="usage-count">${feature.usage}</span>
				</div>
			`
			)
			.join("");
	}
}

/**
 * Initialize API client
 */
function initializeAPIClient() {
	if (!window.flahaSoilAPI) {
		window.flahaSoilAPI = new FlahaSoilAPI();
	}
}

/**
 * Check if user is authenticated
 */
function checkAuthentication() {
	const token = localStorage.getItem("flahasoil_token");
	const userStr = localStorage.getItem("flahasoil_user");

	if (!token || !userStr) {
		// Redirect to landing page if not authenticated
		window.location.href = "./landing.html";
		return;
	}

	currentUser = JSON.parse(userStr);
}

/**
 * Load user profile information
 */
function loadUserProfile() {
	if (!currentUser) return;

	// Update profile header
	document.getElementById("userName").textContent = currentUser.name;
	document.getElementById("userEmail").textContent = currentUser.email;
	document.getElementById("navUserName").textContent = currentUser.name;

	// Update user initials
	const initials = currentUser.name
		.split(" ")
		.map((n) => n[0])
		.join("")
		.toUpperCase();
	document.getElementById("userInitials").textContent = initials;

	// Update email verification status
	updateEmailVerificationStatus();

	// Update tier information
	const tierBadge = document.getElementById("userTier");
	const tierDescription = document.getElementById("tierDescription");

	tierBadge.textContent = currentUser.tier;
	tierBadge.className = `tier-badge ${currentUser.tier.toLowerCase()}`;

	switch (currentUser.tier) {
		case "FREE":
			tierDescription.textContent = "50 analyses per month";
			break;
		case "PROFESSIONAL":
			tierDescription.textContent = "Unlimited analyses";
			break;
		case "ENTERPRISE":
			tierDescription.textContent = "Unlimited + API access";
			break;
	}

	// Update subscription info
	updateSubscriptionInfo();
}

/**
 * Update email verification status display
 */
function updateEmailVerificationStatus() {
	const statusContainer = document.getElementById("emailVerificationStatus");
	const badge = statusContainer.querySelector(".verification-badge");
	const icon = badge.querySelector(".icon");

	if (currentUser.emailVerified) {
		badge.className = "verification-badge verified";
		icon.textContent = "✓";
		badge.innerHTML = '<i class="icon">✓</i>Email verified';
		statusContainer.classList.add("hidden");
	} else {
		badge.className = "verification-badge unverified";
		icon.textContent = "⚠";
		badge.innerHTML = '<i class="icon">⚠</i>Email not verified';
		statusContainer.classList.remove("hidden");
	}
}

/**
 * Load user statistics from API
 */
async function loadUserStatistics() {
	try {
		// Try to get usage statistics from API
		const response = await window.flahaSoilAPI.getUserUsageStats();

		let usageCount, maxUsage, remaining;

		if (response.success) {
			// Use API data
			userStats = response.data;
			usageCount = userStats.current || 0;
			maxUsage = userStats.limit || 50;
			remaining =
				currentUser.tier === "FREE"
					? Math.max(0, maxUsage - usageCount)
					: "Unlimited";
		} else {
			// Fallback to local data
			usageCount = window.flahaSoilAPI.usageCount || 0;
			maxUsage = window.flahaSoilAPI.maxFreeUsage || 50;
			remaining =
				currentUser.tier === "FREE"
					? Math.max(0, maxUsage - usageCount)
					: "Unlimited";
		}

		// Update statistics display
		document.getElementById("totalAnalyses").textContent = usageCount;
		document.getElementById("thisMonthAnalyses").textContent = usageCount;
		document.getElementById("remainingAnalyses").textContent = remaining;

		// Update progress bar
		if (currentUser.tier === "FREE") {
			const percentage = Math.min((usageCount / maxUsage) * 100, 100);
			document.getElementById("usageProgress").style.width = `${percentage}%`;
			document.getElementById(
				"usageText"
			).textContent = `${usageCount} of ${maxUsage} analyses used this month`;
		} else {
			document.getElementById("usageProgress").style.width = "100%";
			document.getElementById("usageText").textContent =
				"Unlimited analyses available";
		}
	} catch (error) {
		console.error("Error loading user statistics:", error);
		showErrorMessage("Failed to load usage statistics");
	}
}

/**
 * Load recent analyses
 */
async function loadRecentAnalyses() {
	const recentAnalysesContainer = document.getElementById("recentAnalyses");

	try {
		// For now, show sample data since we don't have a history endpoint yet
		const sampleAnalyses = [
			{
				id: 1,
				textureClass: "Clay Loam",
				sand: 33,
				clay: 33,
				date: new Date(Date.now() - 86400000).toLocaleDateString(),
			},
			{
				id: 2,
				textureClass: "Sandy Loam",
				sand: 60,
				clay: 15,
				date: new Date(Date.now() - 172800000).toLocaleDateString(),
			},
			{
				id: 3,
				textureClass: "Loam",
				sand: 40,
				clay: 20,
				date: new Date(Date.now() - 259200000).toLocaleDateString(),
			},
		];

		if (sampleAnalyses.length === 0) {
			recentAnalysesContainer.innerHTML = `
                <div class="loading">No analyses found. <a href="./index.html">Start your first analysis</a></div>
            `;
			return;
		}

		const analysesHTML = sampleAnalyses
			.map(
				(analysis) => `
            <div class="analysis-item">
                <div class="analysis-info">
                    <h4>${analysis.textureClass}</h4>
                    <p>Sand: ${analysis.sand}%, Clay: ${analysis.clay}%</p>
                </div>
                <div class="analysis-date">${analysis.date}</div>
            </div>
        `
			)
			.join("");

		recentAnalysesContainer.innerHTML = analysesHTML;
	} catch (error) {
		console.error("Error loading recent analyses:", error);
		recentAnalysesContainer.innerHTML = `
            <div class="loading">Error loading analyses. Please try again later.</div>
        `;
	}
}

/**
 * Update subscription information
 */
function updateSubscriptionInfo() {
	const currentPlan = document.getElementById("currentPlan");
	const planDescription = document.getElementById("planDescription");
	const planFeatures = document.getElementById("planFeatures");

	switch (currentUser.tier) {
		case "FREE":
			currentPlan.textContent = "Free Plan";
			planDescription.textContent = "50 analyses per month";
			planFeatures.innerHTML = `
                <div class="feature">✓ Basic soil calculations</div>
                <div class="feature">✓ USDA triangle visualization</div>
                <div class="feature">✗ Analysis history</div>
                <div class="feature">✗ Export capabilities</div>
            `;
			break;
		case "PROFESSIONAL":
			currentPlan.textContent = "Professional Plan";
			planDescription.textContent = "Unlimited analyses + advanced features";
			planFeatures.innerHTML = `
                <div class="feature">✓ Unlimited analyses</div>
                <div class="feature">✓ Analysis history</div>
                <div class="feature">✓ Export to PDF/CSV</div>
                <div class="feature">✓ Priority support</div>
            `;
			break;
		case "ENTERPRISE":
			currentPlan.textContent = "Enterprise Plan";
			planDescription.textContent = "Everything + API access";
			planFeatures.innerHTML = `
                <div class="feature">✓ Everything in Professional</div>
                <div class="feature">✓ API access</div>
                <div class="feature">✓ White-label options</div>
                <div class="feature">✓ Dedicated support</div>
            `;
			break;
	}
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
	// Close dropdown when clicking outside
	document.addEventListener("click", function (event) {
		const userMenu = document.querySelector(".user-menu");
		const dropdown = document.getElementById("userDropdown");

		if (userMenu && dropdown && !userMenu.contains(event.target)) {
			dropdown.classList.remove("show");
			const arrow = document.querySelector(".dropdown-arrow");
			if (arrow) arrow.style.transform = "rotate(0deg)";
		}
	});
}

/**
 * Toggle user dropdown menu
 */
function toggleUserDropdown() {
	const dropdown = document.getElementById("userDropdown");
	const arrow = document.querySelector(".dropdown-arrow");

	if (dropdown) {
		dropdown.classList.toggle("show");
		arrow.style.transform = dropdown.classList.contains("show")
			? "rotate(180deg)"
			: "rotate(0deg)";
	}
}

/**
 * Edit profile
 */
function editProfile() {
	const modal = document.getElementById("editProfileModal");
	const nameInput = document.getElementById("editName");
	const emailInput = document.getElementById("editEmail");

	// Pre-fill form with current data
	nameInput.value = currentUser.name;
	emailInput.value = currentUser.email;

	modal.style.display = "flex";
}

/**
 * Close edit modal
 */
function closeEditModal() {
	document.getElementById("editProfileModal").style.display = "none";
}

/**
 * Save profile changes
 */
async function saveProfile(event) {
	event.preventDefault();

	const formData = new FormData(event.target);
	const updatedData = {
		name: formData.get("name"),
		email: formData.get("email"),
	};

	try {
		// Show loading state
		const submitButton = event.target.querySelector('button[type="submit"]');
		const originalText = submitButton.textContent;
		submitButton.textContent = "Updating...";
		submitButton.disabled = true;

		// Use API to update profile
		const result = await window.flahaSoilAPI.updateProfile(updatedData);

		if (result.success) {
			// Update current user data
			currentUser = result.user;

			// Update UI
			loadUserProfile();
			closeEditModal();
			showSuccessMessage("Profile updated successfully!");
		} else {
			showErrorMessage(result.error || "Failed to update profile");
		}

		// Reset button
		submitButton.textContent = originalText;
		submitButton.disabled = false;
	} catch (error) {
		console.error("Error updating profile:", error);
		showErrorMessage("Failed to update profile. Please try again.");

		// Reset button
		const submitButton = event.target.querySelector('button[type="submit"]');
		submitButton.textContent = "Save Changes";
		submitButton.disabled = false;
	}
}

/**
 * Change password
 */
function changePassword() {
	document.getElementById("changePasswordModal").style.display = "flex";
}

/**
 * Close password modal
 */
function closePasswordModal() {
	document.getElementById("changePasswordModal").style.display = "none";
	document.getElementById("changePasswordForm").reset();
}

/**
 * Change user password
 */
async function changeUserPassword(event) {
	event.preventDefault();

	const formData = new FormData(event.target);
	const currentPassword = formData.get("currentPassword");
	const newPassword = formData.get("newPassword");
	const confirmPassword = formData.get("confirmPassword");

	if (newPassword !== confirmPassword) {
		showErrorMessage("New passwords do not match");
		return;
	}

	if (newPassword.length < 6) {
		showErrorMessage("Password must be at least 6 characters long");
		return;
	}

	try {
		// Show loading state
		const submitButton = event.target.querySelector('button[type="submit"]');
		const originalText = submitButton.textContent;
		submitButton.textContent = "Changing...";
		submitButton.disabled = true;

		// Use API to change password
		const result = await window.flahaSoilAPI.changePassword(
			currentPassword,
			newPassword
		);

		if (result.success) {
			closePasswordModal();
			showSuccessMessage("Password changed successfully!");
			// Clear form
			event.target.reset();
		} else {
			showErrorMessage(result.error || "Failed to change password");
		}

		// Reset button
		submitButton.textContent = originalText;
		submitButton.disabled = false;
	} catch (error) {
		console.error("Error changing password:", error);
		showErrorMessage("Failed to change password. Please try again.");

		// Reset button
		const submitButton = event.target.querySelector('button[type="submit"]');
		submitButton.textContent = "Change Password";
		submitButton.disabled = false;
	}
}

/**
 * Export user data
 */
function exportData() {
	try {
		const exportData = {
			user: currentUser,
			exportDate: new Date().toISOString(),
			analyses: [], // Would be populated from actual data
		};

		const dataStr = JSON.stringify(exportData, null, 2);
		const dataBlob = new Blob([dataStr], { type: "application/json" });

		const link = document.createElement("a");
		link.href = URL.createObjectURL(dataBlob);
		link.download = `flahasoil-data-${
			new Date().toISOString().split("T")[0]
		}.json`;
		link.click();

		showSuccessMessage("Data exported successfully!");
	} catch (error) {
		console.error("Error exporting data:", error);
		showErrorMessage("Failed to export data. Please try again.");
	}
}

/**
 * Upgrade plan
 */
function upgradePlan() {
	// For now, just show a message
	showInfoMessage(
		"Payment integration coming soon! Contact sales@flaha.com for upgrades."
	);
}

/**
 * Logout user
 */
async function logout() {
	try {
		// Show loading state
		showInfoMessage("Logging out...");

		// Call API logout
		if (window.flahaSoilAPI) {
			const result = await window.flahaSoilAPI.logout();
			if (result.success) {
				console.log("Logout successful");
			}
		}

		// Clear all local storage
		localStorage.removeItem("flahasoil_token");
		localStorage.removeItem("flahasoil_user");
		localStorage.removeItem("flahasoil_user_plan");
		localStorage.removeItem("flahasoil_usage_count");

		// Show success message
		showSuccessMessage("Logout successful! Redirecting...");

		// Redirect to landing page
		setTimeout(() => {
			window.location.href = "./landing.html";
		}, 1000);
	} catch (error) {
		console.error("Logout error:", error);
		// Even if there's an error, still clear local data and redirect
		localStorage.clear();
		window.location.href = "./landing.html";
	}
}

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
    `;

	document.body.appendChild(toast);

	setTimeout(() => {
		toast.remove();
	}, 3000);
}

/**
 * Resend verification email
 */
async function resendVerificationEmail() {
	try {
		const response = await window.flahaSoilAPI.resendVerificationEmail(
			currentUser.email
		);

		if (response.success) {
			showNotification(
				"Verification email sent! Please check your email.",
				"success"
			);
		} else {
			throw new Error(response.error || "Failed to send verification email");
		}
	} catch (error) {
		console.error("Resend verification error:", error);
		showNotification(
			"Failed to send verification email. Please try again.",
			"error"
		);
	}
}

/**
 * Show notification message
 * @param {string} message - The message to show
 * @param {string} type - The type of notification (success, error, info)
 */
function showNotification(message, type = "info") {
	// Create notification element
	const notification = document.createElement("div");
	notification.className = `notification ${type}`;
	notification.innerHTML = `
		<span>${message}</span>
		<button onclick="this.parentElement.remove()" style="background: none; border: none; color: inherit; font-size: 1.2rem; cursor: pointer; margin-left: 10px;">&times;</button>
	`;

	// Add styles
	notification.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		padding: 15px 20px;
		border-radius: 8px;
		color: white;
		font-weight: 500;
		z-index: 1000;
		max-width: 400px;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		display: flex;
		align-items: center;
		justify-content: space-between;
	`;

	// Set background color based on type
	switch (type) {
		case "success":
			notification.style.background = "#38a169";
			break;
		case "error":
			notification.style.background = "#e53e3e";
			break;
		case "info":
		default:
			notification.style.background = "#3182ce";
			break;
	}

	// Add to page
	document.body.appendChild(notification);

	// Auto-remove after 5 seconds
	setTimeout(() => {
		if (notification.parentElement) {
			notification.remove();
		}
	}, 5000);
}
