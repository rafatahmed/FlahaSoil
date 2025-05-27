/** @format */

/**
 * Input Sanitization Middleware for FlahaSoil API
 * Provides protection against XSS and injection attacks
 */

const validator = require("validator");

/**
 * Sanitize string input
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeString(input) {
	if (typeof input !== "string") {
		return input;
	}

	// Escape HTML characters to prevent XSS
	return validator.escape(input.trim());
}

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
function sanitizeEmail(email) {
	if (typeof email !== "string") {
		return email;
	}

	return validator.normalizeEmail(email, {
		gmail_lowercase: true,
		gmail_remove_dots: false,
		outlookdotcom_lowercase: true,
		yahoo_lowercase: true,
		icloud_lowercase: true,
	});
}

/**
 * Validate and sanitize request body
 * @param {Object} body - Request body to sanitize
 * @returns {Object} Sanitized body
 */
function sanitizeBody(body) {
	if (!body || typeof body !== "object") {
		return body;
	}

	const sanitized = {};

	for (const [key, value] of Object.entries(body)) {
		switch (key) {
			case "email":
				sanitized[key] = sanitizeEmail(value);
				break;
			case "password":
			case "newPassword":
			case "confirmPassword":
			case "token":
				// Don't sanitize passwords and tokens (just validate length)
				sanitized[key] = value;
				break;
			case "name":
			case "firstName":
			case "lastName":
				sanitized[key] = sanitizeString(value);
				break;
			default:
				if (typeof value === "string") {
					sanitized[key] = sanitizeString(value);
				} else {
					sanitized[key] = value;
				}
		}
	}

	return sanitized;
}

/**
 * Validate input fields
 * @param {Object} body - Request body to validate
 * @param {Array} requiredFields - Required field names
 * @returns {Object} Validation result
 */
function validateInput(body, requiredFields = []) {
	const errors = [];

	// Check required fields
	for (const field of requiredFields) {
		if (
			!body[field] ||
			(typeof body[field] === "string" && body[field].trim() === "")
		) {
			errors.push(`${field} is required`);
		}
	}

	// Validate email format
	if (body.email && !validator.isEmail(body.email)) {
		errors.push("Invalid email format");
	}

	// Validate password strength
	if (body.password && body.password.length < 6) {
		errors.push("Password must be at least 6 characters long");
	}

	// Validate name fields
	if (body.name && (body.name.length < 2 || body.name.length > 100)) {
		errors.push("Name must be between 2 and 100 characters");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Express middleware for input sanitization
 */
function sanitizationMiddleware(requiredFields = []) {
	return (req, res, next) => {
		try {
			// Sanitize request body
			if (req.body) {
				req.body = sanitizeBody(req.body);
			}

			// Validate input
			const validation = validateInput(req.body, requiredFields);

			if (!validation.isValid) {
				return res.status(400).json({
					success: false,
					error: "Validation failed",
					details: validation.errors,
				});
			}

			next();
		} catch (error) {
			console.error("Sanitization error:", error);
			res.status(500).json({
				success: false,
				error: "Input processing error",
			});
		}
	};
}

/**
 * Specific validation middleware for different endpoints
 */
const validationRules = {
	register: sanitizationMiddleware(["email", "password", "name"]),
	login: sanitizationMiddleware(["email", "password"]),
	forgotPassword: sanitizationMiddleware(["email"]),
	resetPassword: sanitizationMiddleware(["token", "newPassword"]),
	resendVerification: sanitizationMiddleware(["email"]),
	verifyEmail: sanitizationMiddleware(["token"]),
};

module.exports = {
	sanitizeString,
	sanitizeEmail,
	sanitizeBody,
	validateInput,
	sanitizationMiddleware,
	validationRules,
};
