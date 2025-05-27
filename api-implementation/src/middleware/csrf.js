/** @format */

/**
 * CSRF Protection Middleware for FlahaSoil API
 * Provides Cross-Site Request Forgery protection
 */

const crypto = require("crypto");

class CSRFProtection {
	constructor() {
		this.tokens = new Map();
		this.tokenExpiry = 60 * 60 * 1000; // 1 hour

		// Clean up expired tokens every 10 minutes
		setInterval(() => {
			this.cleanupExpiredTokens();
		}, 10 * 60 * 1000);
	}

	/**
	 * Generate CSRF token
	 * @param {string} sessionId - Session identifier
	 * @returns {string} CSRF token
	 */
	generateToken(sessionId) {
		const token = crypto.randomBytes(32).toString("hex");
		const expiry = Date.now() + this.tokenExpiry;

		this.tokens.set(sessionId, {
			token,
			expiry,
		});

		return token;
	}

	/**
	 * Validate CSRF token
	 * @param {string} sessionId - Session identifier
	 * @param {string} token - CSRF token to validate
	 * @returns {boolean} Token validity
	 */
	validateToken(sessionId, token) {
		const storedToken = this.tokens.get(sessionId);

		if (!storedToken) {
			return false;
		}

		if (Date.now() > storedToken.expiry) {
			this.tokens.delete(sessionId);
			return false;
		}

		return storedToken.token === token;
	}

	/**
	 * Clean up expired tokens
	 */
	cleanupExpiredTokens() {
		const now = Date.now();
		for (const [sessionId, tokenData] of this.tokens.entries()) {
			if (now > tokenData.expiry) {
				this.tokens.delete(sessionId);
			}
		}
	}

	/**
	 * Express middleware for CSRF protection
	 */
	middleware() {
		return (req, res, next) => {
			// Skip CSRF for GET requests and API endpoints that don't modify data
			if (
				req.method === "GET" ||
				req.path.includes("/auth/login") ||
				req.path.includes("/auth/register")
			) {
				return next();
			}

			// Get session ID (could be from JWT token, session, or IP)
			const sessionId = this.getSessionId(req);

			// For token generation endpoint
			if (req.path === "/csrf-token") {
				const token = this.generateToken(sessionId);
				return res.json({ csrfToken: token });
			}

			// Validate CSRF token for state-changing operations
			const csrfToken = req.headers["x-csrf-token"] || req.body.csrfToken;

			if (!csrfToken || !this.validateToken(sessionId, csrfToken)) {
				return res.status(403).json({
					success: false,
					error: "Invalid CSRF token",
				});
			}

			next();
		};
	}

	/**
	 * Get session identifier for request
	 * @param {Object} req - Express request object
	 * @returns {string} Session identifier
	 */
	getSessionId(req) {
		// Try to get from JWT token first
		const authHeader = req.headers.authorization;
		if (authHeader && authHeader.startsWith("Bearer ")) {
			try {
				const jwt = require("jsonwebtoken");
				const token = authHeader.substring(7);
				const decoded = jwt.verify(
					token,
					process.env.JWT_SECRET || "fallback-secret"
				);
				return decoded.userId;
			} catch (error) {
				// Fall back to IP-based session
			}
		}

		// Fall back to IP address as session identifier
		return req.ip || req.connection.remoteAddress;
	}
}

// Export singleton instance
const csrfProtection = new CSRFProtection();

module.exports = {
	csrfProtection,
	csrfMiddleware: csrfProtection.middleware(),
};
