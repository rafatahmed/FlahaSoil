/** @format */

/**
 * Password Reset Page JavaScript
 * Handles password reset token validation and password updates
 */

let resetToken = null;

document.addEventListener("DOMContentLoaded", function () {
	validateResetToken();
});

/**
 * Extract token from URL and validate it
 */
async function validateResetToken() {
	const urlParams = new URLSearchParams(window.location.search);
	resetToken = urlParams.get("token");

	if (!resetToken) {
		showResetError(
			"Invalid Reset Link",
			"The password reset link is invalid or has expired. Please request a new password reset.",
			true
		);
		return;
	}

	// For now, we'll just show the form since we trust the token
	// In a production app, you might want to validate the token first
	showResetForm();
}

/**
 * Show password reset form
 */
function showResetForm() {
	const content = document.getElementById("resetContent");
	content.innerHTML = `
        <div class="reset-form">
            <h2 class="verification-message">Create New Password</h2>
            <p class="verification-description">
                Enter your new password below. Make sure it's strong and secure.
            </p>
            <form onsubmit="handlePasswordReset(event)">
                <div class="form-group" style="margin-bottom: 20px;">
                    <input 
                        type="password" 
                        id="newPassword" 
                        placeholder="New Password"
                        required
                        minlength="6"
                        style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px;"
                    >
                </div>
                <div class="form-group" style="margin-bottom: 30px;">
                    <input 
                        type="password" 
                        id="confirmPassword" 
                        placeholder="Confirm New Password"
                        required
                        minlength="6"
                        style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px;"
                    >
                </div>
                <div class="password-requirements" style="margin-bottom: 20px; font-size: 14px; color: #718096;">
                    <p>Password requirements:</p>
                    <ul style="text-align: left; margin-left: 20px;">
                        <li>At least 6 characters long</li>
                        <li>Include both letters and numbers (recommended)</li>
                        <li>Use special characters for extra security (recommended)</li>
                    </ul>
                </div>
                <button type="submit" class="btn-primary" id="resetBtn">
                    Reset Password
                </button>
                <a href="/index.html" class="btn-secondary">Cancel</a>
            </form>
        </div>
    `;
}

/**
 * Handle password reset form submission
 * @param {Event} event - Form submit event
 */
async function handlePasswordReset(event) {
	event.preventDefault();

	const newPassword = document.getElementById("newPassword").value;
	const confirmPassword = document.getElementById("confirmPassword").value;
	const resetBtn = document.getElementById("resetBtn");

	// Validate passwords match
	if (newPassword !== confirmPassword) {
		alert("Passwords do not match. Please try again.");
		return;
	}

	// Validate password strength
	if (newPassword.length < 6) {
		alert("Password must be at least 6 characters long.");
		return;
	}

	// Show loading state
	resetBtn.textContent = "Resetting Password...";
	resetBtn.disabled = true;

	try {
		const response = await fetch("/api/auth/reset-password", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				token: resetToken,
				newPassword: newPassword,
			}),
		});

		const data = await response.json();

		if (data.success) {
			showResetSuccess();
		} else {
			throw new Error(data.error || "Failed to reset password");
		}
	} catch (error) {
		console.error("Password reset error:", error);
		alert(error.message || "Failed to reset password. Please try again.");

		// Reset button state
		resetBtn.textContent = "Reset Password";
		resetBtn.disabled = false;
	}
}

/**
 * Show password reset success message
 */
function showResetSuccess() {
	const content = document.getElementById("resetContent");
	content.innerHTML = `
        <div class="verification-success">
            <div class="success-icon">✓</div>
            <h2 class="verification-message">Password Reset Successfully!</h2>
            <p class="verification-description">
                Your password has been updated successfully. You can now log in with your new password.
            </p>
            <a href="/index.html" class="btn-primary">Go to Login</a>
        </div>
    `;
}

/**
 * Show password reset error message
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {boolean} showRequestNew - Whether to show request new reset option
 */
function showResetError(title, message, showRequestNew = false) {
	const content = document.getElementById("resetContent");
	let requestNewButton = "";

	if (showRequestNew) {
		requestNewButton = `
            <button onclick="showRequestNewReset()" class="btn-secondary">
                Request New Reset Link
            </button>
        `;
	}

	content.innerHTML = `
        <div class="verification-error">
            <div class="error-icon">✗</div>
            <h2 class="verification-message">${title}</h2>
            <p class="verification-description">${message}</p>
            <a href="/index.html" class="btn-primary">Return to Home</a>
            ${requestNewButton}
        </div>
    `;
}

/**
 * Show request new reset form
 */
function showRequestNewReset() {
	const content = document.getElementById("resetContent");
	content.innerHTML = `
        <div class="reset-form">
            <h2 class="verification-message">Request New Reset Link</h2>
            <p class="verification-description">
                Enter your email address to receive a new password reset link.
            </p>
            <form onsubmit="handleRequestNewReset(event)">
                <div class="form-group">
                    <input 
                        type="email" 
                        id="requestEmail" 
                        placeholder="Enter your email address"
                        required
                        style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; font-size: 16px;"
                    >
                </div>
                <button type="submit" class="btn-primary" id="requestBtn">
                    Send Reset Link
                </button>
                <a href="/index.html" class="btn-secondary">Cancel</a>
            </form>
        </div>
    `;
}

/**
 * Handle request new reset link
 * @param {Event} event - Form submit event
 */
async function handleRequestNewReset(event) {
	event.preventDefault();

	const email = document.getElementById("requestEmail").value;
	const requestBtn = document.getElementById("requestBtn");

	// Show loading state
	requestBtn.textContent = "Sending...";
	requestBtn.disabled = true;

	try {
		const response = await fetch("/api/auth/forgot-password", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});

		const data = await response.json();

		if (data.success) {
			// Show success message
			const content = document.getElementById("resetContent");
			content.innerHTML = `
                <div class="verification-success">
                    <div class="success-icon">📧</div>
                    <h2 class="verification-message">Reset Link Sent!</h2>
                    <p class="verification-description">
                        If an account with that email exists, we've sent a new password reset link to ${email}. Please check your email.
                    </p>
                    <a href="/index.html" class="btn-primary">Return to Home</a>
                </div>
            `;
		} else {
			throw new Error(data.error || "Failed to send reset link");
		}
	} catch (error) {
		console.error("Request new reset error:", error);
		alert("Failed to send reset link. Please try again.");

		// Reset button state
		requestBtn.textContent = "Send Reset Link";
		requestBtn.disabled = false;
	}
}
