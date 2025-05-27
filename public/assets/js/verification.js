/** @format */

/**
 * Email Verification Page JavaScript
 * Handles email verification token processing
 */

document.addEventListener("DOMContentLoaded", function () {
	verifyEmailToken();
});

/**
 * Extract token from URL and verify email
 */
async function verifyEmailToken() {
	const urlParams = new URLSearchParams(window.location.search);
	const token = urlParams.get("token");

	if (!token) {
		showVerificationError(
			"Invalid Verification Link",
			"The verification link is invalid or has expired. Please request a new verification email.",
			true
		);
		return;
	}

	try {
		const response = await fetch("/api/auth/verify-email", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ token }),
		});

		const data = await response.json();

		if (data.success) {
			showVerificationSuccess();
		} else {
			showVerificationError(
				"Verification Failed",
				data.error ||
					"An error occurred during email verification. Please try again.",
				true
			);
		}
	} catch (error) {
		console.error("Verification error:", error);
		showVerificationError(
			"Network Error",
			"Unable to connect to the server. Please check your internet connection and try again.",
			true
		);
	}
}

/**
 * Show verification success message
 */
function showVerificationSuccess() {
	const content = document.getElementById("verificationContent");
	content.innerHTML = `
        <div class="verification-success">
            <div class="success-icon">✓</div>
            <h2 class="verification-message">Email Verified Successfully!</h2>
            <p class="verification-description">
                Your email has been verified. You can now access all features of your FlahaSoil account.
            </p>
            <a href="/main.html" class="btn-primary">Access Dashboard</a>
            <a href="/index.html" class="btn-secondary">Return to Home</a>
        </div>
    `;
}

/**
 * Show verification error message
 * @param {string} title - Error title
 * @param {string} message - Error message
 * @param {boolean} showResend - Whether to show resend option
 */
function showVerificationError(title, message, showResend = false) {
	const content = document.getElementById("verificationContent");
	let resendButton = "";

	if (showResend) {
		resendButton = `
            <button onclick="showResendVerification()" class="btn-secondary">
                Resend Verification Email
            </button>
        `;
	}

	content.innerHTML = `
        <div class="verification-error">
            <div class="error-icon">✗</div>
            <h2 class="verification-message">${title}</h2>
            <p class="verification-description">${message}</p>
            <a href="/index.html" class="btn-primary">Return to Home</a>
            ${resendButton}
        </div>
    `;
}

/**
 * Show resend verification form
 */
function showResendVerification() {
	const content = document.getElementById("verificationContent");
	content.innerHTML = `
        <div class="verification-form">
            <h2 class="verification-message">Resend Verification Email</h2>
            <p class="verification-description">
                Enter your email address to receive a new verification link.
            </p>
            <form onsubmit="handleResendVerification(event)">
                <div class="form-group">
                    <input 
                        type="email" 
                        id="resendEmail" 
                        placeholder="Enter your email address"
                        required
                        style="width: 100%; padding: 12px; border: 2px solid #e2e8f0; border-radius: 8px; margin-bottom: 20px; font-size: 16px;"
                    >
                </div>
                <button type="submit" class="btn-primary" id="resendBtn">
                    Send Verification Email
                </button>
                <button type="button" onclick="verifyEmailToken()" class="btn-secondary">
                    Back
                </button>
            </form>
        </div>
    `;
}

/**
 * Handle resend verification email
 * @param {Event} event - Form submit event
 */
async function handleResendVerification(event) {
	event.preventDefault();

	const email = document.getElementById("resendEmail").value;
	const resendBtn = document.getElementById("resendBtn");

	// Show loading state
	resendBtn.textContent = "Sending...";
	resendBtn.disabled = true;

	try {
		const response = await fetch("/api/auth/resend-verification", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email }),
		});

		const data = await response.json();

		if (data.success) {
			showVerificationSuccess();
			// Override success message for resend
			const content = document.getElementById("verificationContent");
			content.innerHTML = `
                <div class="verification-success">
                    <div class="success-icon">📧</div>
                    <h2 class="verification-message">Verification Email Sent!</h2>
                    <p class="verification-description">
                        We've sent a new verification link to ${email}. Please check your email and click the link to verify your account.
                    </p>
                    <a href="/index.html" class="btn-primary">Return to Home</a>
                </div>
            `;
		} else {
			throw new Error(data.error || "Failed to send verification email");
		}
	} catch (error) {
		console.error("Resend verification error:", error);
		alert("Failed to send verification email. Please try again.");

		// Reset button state
		resendBtn.textContent = "Send Verification Email";
		resendBtn.disabled = false;
	}
}
