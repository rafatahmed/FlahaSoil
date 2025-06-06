/**
 * FlahaSoil Landing Page JavaScript
 * Handles authentication modals, navigation, and user interactions
 *
 * @format
 */

// Global state
let currentUser = null;

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
 * Show toast notification
 */
function showToast(message, type = "info") {
	// Remove existing toasts
	const existingToasts = document.querySelectorAll(".toast");
	existingToasts.forEach((toast) => toast.remove());

	// Create toast element
	const toast = document.createElement("div");
	toast.className = `toast toast-${type}`;
	toast.textContent = message;

	// Add toast styles
	const style = document.createElement("style");
	style.textContent = `
		.toast {
			position: fixed;
			top: 20px;
			right: 20px;
			padding: 15px 20px;
			border-radius: 8px;
			color: white;
			font-weight: 600;
			z-index: 10000;
			animation: slideIn 0.3s ease;
		}
		.toast-success { background: #4CAF50; }
		.toast-error { background: #f44336; }
		.toast-info { background: #2196F3; }
		@keyframes slideIn {
			from { transform: translateX(100%); opacity: 0; }
			to { transform: translateX(0); opacity: 1; }
		}
	`;
	document.head.appendChild(style);

	// Add toast to page
	document.body.appendChild(toast);

	// Remove toast after 3 seconds
	setTimeout(() => {
		toast.style.animation = "slideIn 0.3s ease reverse";
		setTimeout(() => toast.remove(), 300);
	}, 3000);
}

// Utility Functions
function setupSmoothScrolling() {
	// Add smooth scrolling to all anchor links
	document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
		anchor.addEventListener("click", function (e) {
			e.preventDefault();
			const target = document.querySelector(this.getAttribute("href"));
			if (target) {
				target.scrollIntoView({
					behavior: "smooth",
					block: "start",
				});
			}
		});
	});
}

function setupMobileMenu() {
	// Setup mobile menu toggle if elements exist
	const mobileMenuButton = document.querySelector(".mobile-menu-button");
	const mobileMenu = document.querySelector(".mobile-menu");

	if (mobileMenuButton && mobileMenu) {
		mobileMenuButton.addEventListener("click", function () {
			mobileMenu.classList.toggle("active");
		});
	}
}

// Initialize landing page
document.addEventListener("DOMContentLoaded", function () {
	// Initialize API client
	if (!window.flahaSoilAPI) {
		window.flahaSoilAPI = new FlahaSoilAPI();
	}

	checkAuthStatus();
	setupSmoothScrolling();
	setupMobileMenu();
});

/**
 * Check if user is already authenticated
 */
function checkAuthStatus() {
	const token = localStorage.getItem("flahasoil_token");
	const userStr = localStorage.getItem("flahasoil_user");

	if (token && userStr) {
		currentUser = JSON.parse(userStr);
		updateNavForLoggedInUser();
	}
}

/**
 * Update navigation for logged-in users
 */
function updateNavForLoggedInUser() {
	const navMenu = document.querySelector(".nav-menu");
	if (currentUser) {
		navMenu.innerHTML = `
            <a href="#features" class="nav-link">Features</a>
            <a href="#pricing" class="nav-link">Pricing</a>
            <a href="#about" class="nav-link">About</a>
            <div class="user-menu">
                <button class="btn-user" onclick="toggleUserDropdown()">
                    <span class="user-name">${currentUser.name}</span>
                    <span class="dropdown-arrow">▼</span>
                </button>
                <div class="user-dropdown" id="userDropdown">
                    <a href="./profile.html" class="dropdown-item">Profile</a>
                    <a href="./index.html" class="dropdown-item">Soil Analysis</a>
                    <a href="#" class="dropdown-item" onclick="logout()">Logout</a>
                </div>
            </div>
        `;

		// Add user menu styles
		addUserMenuStyles();
	}
}

/**
 * Add styles for user menu
 */
function addUserMenuStyles() {
	const style = document.createElement("style");
	style.textContent = `
        .user-menu {
            position: relative;
        }

        .btn-user {
            background: var(--primary-color);
            color: var(--white);
            border: none;
            padding: 10px 20px;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s ease;
        }

        .btn-user:hover {
            background: #1B5E20;
        }

        .dropdown-arrow {
            font-size: 0.8rem;
            transition: transform 0.3s ease;
        }

        .user-dropdown {
            position: absolute;
            top: 100%;
            right: 0;
            background: var(--white);
            border-radius: 8px;
            box-shadow: var(--shadow-hover);
            min-width: 180px;
            opacity: 0;
            visibility: hidden;
            transform: translateY(-10px);
            transition: all 0.3s ease;
            z-index: 1000;
        }

        .user-dropdown.show {
            opacity: 1;
            visibility: visible;
            transform: translateY(0);
        }

        .dropdown-item {
            display: block;
            padding: 12px 20px;
            color: var(--text-dark);
            text-decoration: none;
            transition: background 0.3s ease;
        }

        .dropdown-item:hover {
            background: var(--background-light);
        }

        .dropdown-item:first-child {
            border-radius: 8px 8px 0 0;
        }

        .dropdown-item:last-child {
            border-radius: 0 0 8px 8px;
        }
    `;
	document.head.appendChild(style);
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
 * Close dropdown when clicking outside
 */
document.addEventListener("click", function (event) {
	const userMenu = document.querySelector(".user-menu");
	const dropdown = document.getElementById("userDropdown");

	if (userMenu && dropdown && !userMenu.contains(event.target)) {
		dropdown.classList.remove("show");
		const arrow = document.querySelector(".dropdown-arrow");
		if (arrow) arrow.style.transform = "rotate(0deg)";
	}
});

/**
 * Show login modal
 */
function showLoginModal() {
	const modalHTML = `
        <div class="auth-modal" id="loginModal">
            <div class="modal-overlay" onclick="closeModal('loginModal')"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Welcome Back</h2>
                    <button class="modal-close" onclick="closeModal('loginModal')">&times;</button>
                </div>
                <form id="loginForm" onsubmit="handleLogin(event)">
                    <div class="form-group">
                        <label for="loginEmail">Email</label>
                        <input type="email" id="loginEmail" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" name="password" required>
                    </div>
                    <button type="submit" class="btn-submit">Login</button>
                </form>
                <div class="modal-footer">
                    <p><a href="#" onclick="showForgotPasswordModal()">Forgot your password?</a></p>
                    <p>Don't have an account? <a href="#" onclick="switchToSignup()">Sign up here</a></p>
                </div>
            </div>
        </div>
    `;

	document.getElementById("auth-modals").innerHTML = modalHTML;
	addModalStyles();
}

/**
 * Show signup modal
 */
function showSignupModal() {
	const modalHTML = `
        <div class="auth-modal" id="signupModal">
            <div class="modal-overlay" onclick="closeModal('signupModal')"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Get Started Free</h2>
                    <button class="modal-close" onclick="closeModal('signupModal')">&times;</button>
                </div>
                <form id="signupForm" onsubmit="handleSignup(event)">
                    <div class="form-group">
                        <label for="signupName">Full Name</label>
                        <input type="text" id="signupName" name="name" required>
                    </div>
                    <div class="form-group">
                        <label for="signupEmail">Email</label>
                        <input type="email" id="signupEmail" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="signupPassword">Password</label>
                        <input type="password" id="signupPassword" name="password" required minlength="6">
                    </div>
                    <button type="submit" class="btn-submit">Create Account</button>
                </form>
                <div class="modal-footer">
                    <p>Already have an account? <a href="#" onclick="switchToLogin()">Login here</a></p>
                </div>
            </div>
        </div>
    `;

	document.getElementById("auth-modals").innerHTML = modalHTML;
	addModalStyles();
}

/**
 * Add modal styles
 */
function addModalStyles() {
	if (document.getElementById("modal-styles")) return;

	const style = document.createElement("style");
	style.id = "modal-styles";
	style.textContent = `
        .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: 2000;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(5px);
        }

        .modal-content {
            background: var(--white);
            border-radius: 15px;
            padding: 0;
            max-width: 400px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: var(--shadow-hover);
        }

        .modal-header {
            padding: 30px 30px 20px;
            border-bottom: 1px solid #E9ECEF;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .modal-header h2 {
            font-family: 'Montserrat', sans-serif;
            font-weight: 700;
            color: var(--text-dark);
            margin: 0;
        }

        .modal-close {
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: var(--text-light);
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .modal-close:hover {
            color: var(--text-dark);
        }

        .modal-content form {
            padding: 20px 30px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: var(--text-dark);
        }

        .form-group input {
            width: 100%;
            padding: 12px;
            border: 2px solid #E9ECEF;
            border-radius: 8px;
            font-size: 16px;
            transition: border-color 0.3s ease;
        }

        .form-group input:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        .btn-submit {
            width: 100%;
            background: var(--primary-color);
            color: var(--white);
            border: none;
            padding: 15px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }

        .btn-submit:hover {
            background: #1B5E20;
        }

        .modal-footer {
            padding: 20px 30px 30px;
            text-align: center;
            border-top: 1px solid #E9ECEF;
        }

        .modal-footer a {
            color: var(--primary-color);
            text-decoration: none;
            font-weight: 600;
        }

        .modal-footer a:hover {
            text-decoration: underline;
        }
    `;
	document.head.appendChild(style);
}

/**
 * Handle login form submission
 */
async function handleLogin(event) {
	event.preventDefault();
	const formData = new FormData(event.target);
	const email = formData.get("email");
	const password = formData.get("password");

	try {
		const result = await window.flahaSoilAPI.login(email, password);

		if (result.success) {
			// Store user data properly
			currentUser = result.user;
			localStorage.setItem("flahasoil_token", result.token);
			localStorage.setItem("flahasoil_user", JSON.stringify(result.user));

			// Update API client authentication
			window.flahaSoilAPI.setAuth(
				result.token,
				result.user.tier,
				result.user.usageCount || 0
			);

			updateNavForLoggedInUser();
			closeModal("loginModal");
			showSuccessMessage("Login successful! Welcome back.");

			// Redirect to main app after successful login
			setTimeout(() => {
				window.location.href = "./index.html";
			}, 1500);
		} else {
			showErrorMessage(result.error || "Login failed");
		}
	} catch (error) {
		showErrorMessage("Login failed. Please try again.");
	}
}

/**
 * Handle signup form submission
 */
async function handleSignup(event) {
	event.preventDefault();
	const formData = new FormData(event.target);
	const userData = {
		name: formData.get("name"),
		email: formData.get("email"),
		password: formData.get("password"),
	};

	try {
		const result = await window.flahaSoilAPI.register(userData);

		if (result.success) {
			// Store user data properly
			currentUser = result.user;
			localStorage.setItem("flahasoil_token", result.token);
			localStorage.setItem("flahasoil_user", JSON.stringify(result.user));

			// Update API client authentication
			window.flahaSoilAPI.setAuth(
				result.token,
				result.user.tier,
				result.user.usageCount || 0
			);

			updateNavForLoggedInUser();
			closeModal("signupModal");
			showSuccessMessage("Account created successfully! Welcome to FlahaSoil.");

			// Redirect to main app after successful registration
			setTimeout(() => {
				window.location.href = "./index.html";
			}, 1500);
		} else {
			showErrorMessage(result.error || "Registration failed");
		}
	} catch (error) {
		showErrorMessage("Registration failed. Please try again.");
	}
}

/**
 * Show forgot password modal
 */
function showForgotPasswordModal() {
	const modalHTML = `
        <div class="auth-modal" id="forgotPasswordModal">
            <div class="modal-overlay" onclick="closeModal('forgotPasswordModal')"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Reset Password</h2>
                    <button class="modal-close" onclick="closeModal('forgotPasswordModal')">&times;</button>
                </div>
                <form id="forgotPasswordForm" onsubmit="handleForgotPassword(event)">
                    <div class="form-group">
                        <label for="forgotEmail">Email Address</label>
                        <input type="email" id="forgotEmail" name="email" required>
                        <small>We'll send you a password reset link</small>
                    </div>
                    <button type="submit" class="btn-submit">Send Reset Link</button>
                </form>
                <div class="modal-footer">
                    <p><a href="#" onclick="switchToLogin()">Back to Login</a></p>
                </div>
            </div>
        </div>
    `;

	document.getElementById("auth-modals").innerHTML = modalHTML;
	addModalStyles();
}

/**
 * Show reset password modal
 */
function showResetPasswordModal(token) {
	const modalHTML = `
        <div class="auth-modal" id="resetPasswordModal">
            <div class="modal-overlay" onclick="closeModal('resetPasswordModal')"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Set New Password</h2>
                    <button class="modal-close" onclick="closeModal('resetPasswordModal')">&times;</button>
                </div>
                <form id="resetPasswordForm" onsubmit="handleResetPassword(event)">
                    <input type="hidden" name="token" value="${token}">
                    <div class="form-group">
                        <label for="newPassword">New Password</label>
                        <input type="password" id="newPassword" name="newPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="confirmNewPassword">Confirm New Password</label>
                        <input type="password" id="confirmNewPassword" name="confirmNewPassword" required minlength="6">
                    </div>
                    <button type="submit" class="btn-submit">Update Password</button>
                </form>
            </div>
        </div>
    `;

	document.getElementById("auth-modals").innerHTML = modalHTML;
	addModalStyles();
}

/**
 * Handle forgot password form submission
 */
async function handleForgotPassword(event) {
	event.preventDefault();
	const formData = new FormData(event.target);
	const email = formData.get("email");

	try {
		// Show loading state
		const submitButton = event.target.querySelector('button[type="submit"]');
		const originalText = submitButton.textContent;
		submitButton.textContent = "Sending...";
		submitButton.disabled = true;

		const result = await window.flahaSoilAPI.forgotPassword(email);

		if (result.success) {
			showSuccessMessage("Password reset instructions sent to your email!");
			closeModal("forgotPasswordModal");

			// In development, auto-open reset modal with token
			if (result.resetToken) {
				setTimeout(() => {
					showResetPasswordModal(result.resetToken);
				}, 1000);
			}
		} else {
			showErrorMessage(result.error || "Failed to send reset email");
		}

		// Reset button
		submitButton.textContent = originalText;
		submitButton.disabled = false;
	} catch (error) {
		showErrorMessage("Failed to send reset email. Please try again.");
		const submitButton = event.target.querySelector('button[type="submit"]');
		submitButton.textContent = "Send Reset Link";
		submitButton.disabled = false;
	}
}

/**
 * Handle reset password form submission
 */
async function handleResetPassword(event) {
	event.preventDefault();
	const formData = new FormData(event.target);
	const token = formData.get("token");
	const newPassword = formData.get("newPassword");
	const confirmPassword = formData.get("confirmNewPassword");

	if (newPassword !== confirmPassword) {
		showErrorMessage("Passwords do not match");
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
		submitButton.textContent = "Updating...";
		submitButton.disabled = true;

		const result = await window.flahaSoilAPI.resetPassword(token, newPassword);

		if (result.success) {
			showSuccessMessage("Password updated successfully! You can now login.");
			closeModal("resetPasswordModal");
			setTimeout(() => {
				showLoginModal();
			}, 1000);
		} else {
			showErrorMessage(result.error || "Failed to reset password");
		}

		// Reset button
		submitButton.textContent = originalText;
		submitButton.disabled = false;
	} catch (error) {
		showErrorMessage("Failed to reset password. Please try again.");
		const submitButton = event.target.querySelector('button[type="submit"]');
		submitButton.textContent = "Update Password";
		submitButton.disabled = false;
	}
}

/**
 * Logout user
 */
async function logout() {
	try {
		// Call API logout
		if (window.flahaSoilAPI) {
			const result = await window.flahaSoilAPI.logout();
			if (result.success) {
				console.log("Logout successful");
			}
		}

		// Clear current user
		currentUser = null;

		// Clear all local storage
		localStorage.removeItem("flahasoil_token");
		localStorage.removeItem("flahasoil_user");
		localStorage.removeItem("flahasoil_user_plan");
		localStorage.removeItem("flahasoil_usage_count");

		// Show success message
		showSuccessMessage("Logout successful!");

		// Reload page to reset UI
		setTimeout(() => {
			location.reload();
		}, 1000);
	} catch (error) {
		console.error("Logout error:", error);
		// Even if there's an error, still clear local data and reload
		currentUser = null;
		localStorage.clear();
		location.reload();
	}
}

/**
 * Switch between login and signup modals
 */
function switchToSignup() {
	closeModal("loginModal");
	showSignupModal();
}

function switchToLogin() {
	closeModal("signupModal");
	showLoginModal();
}

/**
 * Close modal
 */
function closeModal(modalId) {
	const modal = document.getElementById(modalId);
	if (modal) {
		modal.remove();
	}
}

/**
 * Start demo (redirect to demo page)
 */
function startDemo() {
	window.location.href = "./demo.html";
}

/**
 * Navigate to main soil analysis app (only for authenticated users)
 */
function goToSoilAnalysis() {
	const token = localStorage.getItem("flahasoil_token");
	const userStr = localStorage.getItem("flahasoil_user");

	if (token && userStr) {
		// User is authenticated, redirect to main app
		window.location.href = "./index.html";
	} else {
		// User not authenticated, show login modal
		showLoginModal();
	}
}

/**
 * Select a plan and proceed to registration
 */
function selectPlan(planType) {
	// Store selected plan for registration
	sessionStorage.setItem("selected_plan", planType);

	if (planType === "FREE") {
		// For free plan, show signup modal
		showSignupModal();
	} else {
		// For paid plans, show signup modal with plan pre-selected
		showSignupWithPlan(planType);
	}
}

/**
 * Show plan selection modal
 */
function showPlanModal() {
	// Scroll to pricing section
	document.getElementById("pricing").scrollIntoView({
		behavior: "smooth",
	});
}

/**
 * Show plan selection modal
 */
function showPlanModal() {
	// Create plan selection modal
	const modal = document.createElement("div");
	modal.className = "modal plan-modal";
	modal.innerHTML = `
		<div class="modal-overlay" onclick="closePlanModal()"></div>
		<div class="modal-content plan-modal-content">
			<div class="modal-header">
				<h2>Choose Your Plan</h2>
				<button class="modal-close" onclick="closePlanModal()">&times;</button>
			</div>
			<div class="plans-container">
				<div class="plan-option" onclick="selectPlan('FREE')">
					<div class="plan-header">
						<h3>Free</h3>
						<div class="plan-price">$0<span>/month</span></div>
					</div>
					<div class="plan-features">
						<p>✓ 50 analyses per month</p>
						<p>✓ Basic calculations</p>
						<p>✓ USDA triangle</p>
						<p>✗ History & Export</p>
					</div>
					<button class="btn-select-plan">Start Free</button>
				</div>
				<div class="plan-option featured" onclick="selectPlan('PROFESSIONAL')">
					<div class="plan-badge">Recommended</div>
					<div class="plan-header">
						<h3>Professional</h3>
						<div class="plan-price">$29<span>/month</span></div>
					</div>
					<div class="plan-features">
						<p>✓ Unlimited analyses</p>
						<p>✓ Advanced features</p>
						<p>✓ History & Export</p>
						<p>✓ Priority support</p>
					</div>
					<button class="btn-select-plan btn-primary">Start Trial</button>
				</div>
				<div class="plan-option" onclick="selectPlan('ENTERPRISE')">
					<div class="plan-header">
						<h3>Enterprise</h3>
						<div class="plan-price">$199<span>/month</span></div>
					</div>
					<div class="plan-features">
						<p>✓ Everything in Pro</p>
						<p>✓ API access</p>
						<p>✓ White-label</p>
						<p>✓ Dedicated support</p>
					</div>
					<button class="btn-select-plan">Contact Sales</button>
				</div>
			</div>
			<div class="demo-option">
				<p>Want to try before deciding? <a href="#" onclick="startDemo()">Try our Demo</a></p>
			</div>
		</div>
	`;

	document.body.appendChild(modal);

	// Add plan modal styles
	addPlanModalStyles();

	// Show modal
	setTimeout(() => {
		modal.classList.add("show");
	}, 10);
}

/**
 * Close plan selection modal
 */
function closePlanModal() {
	const modal = document.querySelector(".plan-modal");
	if (modal) {
		modal.classList.remove("show");
		setTimeout(() => {
			modal.remove();
		}, 300);
	}
}

/**
 * Select a plan and show registration
 */
function selectPlan(planType) {
	// Store selected plan
	localStorage.setItem("selectedPlan", planType);

	// Close plan modal
	closePlanModal();

	// Show appropriate action based on plan
	if (planType === "ENTERPRISE") {
		contactSales();
	} else {
		// Show signup modal with plan pre-selected
		showSignupModal(planType);
	}
}

/**
 * Contact sales for enterprise
 */
function contactSales() {
	window.open(
		"mailto:sales@flahasoil.com?subject=Enterprise Plan Inquiry&body=I am interested in the Enterprise plan. Please contact me with more details.",
		"_blank"
	);
}

/**
 * Add styles for plan modal
 */
function addPlanModalStyles() {
	if (document.getElementById("planModalStyles")) return;

	const style = document.createElement("style");
	style.id = "planModalStyles";
	style.textContent = `
		.plan-modal-content {
			max-width: 900px;
			width: 90%;
			max-height: 90vh;
			overflow-y: auto;
		}

		.plans-container {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 20px;
			margin: 20px 0;
		}

		.plan-option {
			border: 2px solid #E0E0E0;
			border-radius: 12px;
			padding: 25px;
			text-align: center;
			cursor: pointer;
			transition: all 0.3s ease;
			position: relative;
			background: white;
		}

		.plan-option:hover {
			border-color: var(--primary-color);
			transform: translateY(-5px);
			box-shadow: 0 8px 25px rgba(0,0,0,0.15);
		}

		.plan-option.featured {
			border-color: var(--primary-color);
			background: linear-gradient(135deg, #F8F9FA 0%, #E8F5E8 100%);
		}

		.plan-badge {
			position: absolute;
			top: -10px;
			left: 50%;
			transform: translateX(-50%);
			background: var(--accent-color);
			color: white;
			padding: 5px 15px;
			border-radius: 15px;
			font-size: 12px;
			font-weight: 600;
		}

		.plan-header h3 {
			color: var(--text-dark);
			margin-bottom: 10px;
			font-size: 1.5rem;
		}

		.plan-price {
			font-size: 2rem;
			font-weight: 700;
			color: var(--primary-color);
			margin-bottom: 20px;
		}

		.plan-price span {
			font-size: 0.9rem;
			color: var(--text-light);
		}

		.plan-features {
			text-align: left;
			margin: 20px 0;
		}

		.plan-features p {
			margin: 8px 0;
			padding: 5px 0;
			border-bottom: 1px solid #F0F0F0;
			color: var(--text-dark);
		}

		.btn-select-plan {
			background: var(--secondary-color);
			color: white;
			border: none;
			padding: 12px 24px;
			border-radius: 6px;
			font-weight: 600;
			cursor: pointer;
			width: 100%;
			transition: all 0.3s ease;
		}

		.btn-select-plan:hover {
			background: #1565C0;
		}

		.btn-select-plan.btn-primary {
			background: var(--primary-color);
		}

		.btn-select-plan.btn-primary:hover {
			background: #1B5E20;
		}

		.demo-option {
			text-align: center;
			margin-top: 20px;
			padding-top: 20px;
			border-top: 1px solid #E0E0E0;
		}

		.demo-option a {
			color: var(--accent-color);
			text-decoration: none;
			font-weight: 600;
		}

		.demo-option a:hover {
			text-decoration: underline;
		}

		@media (max-width: 768px) {
			.plans-container {
				grid-template-columns: 1fr;
			}
		}
	`;

	document.head.appendChild(style);
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
	const toast = document.createElement("div");
	toast.className = "toast success";
	toast.textContent = message;
	toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary-color);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 3000;
        box-shadow: var(--shadow-hover);
    `;

	document.body.appendChild(toast);

	setTimeout(() => {
		toast.remove();
	}, 3000);
}

/**
 * Show error message
 */
function showErrorMessage(message) {
	const toast = document.createElement("div");
	toast.className = "toast error";
	toast.textContent = message;
	toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 3000;
        box-shadow: var(--shadow-hover);
    `;

	document.body.appendChild(toast);

	setTimeout(() => {
		toast.remove();
	}, 3000);
}
