/** @format */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/database");
const {
	authLimit,
	passwordResetLimit,
	emailVerificationLimit,
} = require("../middleware/rateLimit");
const { validationRules } = require("../middleware/sanitization");
const emailService = require("../services/emailService");
const router = express.Router();

/**
 * Authentication routes for FlahaSoil API
 * Now using proper database storage with Prisma
 */

/**
 * Register a new user
 */
router.post(
	"/register",
	authLimit,
	validationRules.register,
	async (req, res) => {
		try {
			const { email, password, name, plan } = req.body;

			// Validate input
			if (!email || !password || !name) {
				return res.status(400).json({
					success: false,
					error: "Email, password, and name are required",
				});
			}

			// Validate plan type
			const validPlans = ["FREE", "PROFESSIONAL", "ENTERPRISE"];
			const selectedPlan =
				plan && validPlans.includes(plan.toUpperCase())
					? plan.toUpperCase()
					: "FREE";

			// Check if user already exists
			const existingUser = await prisma.user.findUnique({
				where: { email },
			});

			if (existingUser) {
				return res.status(400).json({
					success: false,
					error: "User already exists",
				});
			}

			// Hash password
			const hashedPassword = await bcrypt.hash(password, 12);

			// Create user in database
			const user = await prisma.user.create({
				data: {
					email,
					name,
					password: hashedPassword,
					tier: selectedPlan,
					planSelectedAt: new Date(),
					usageCount: 0,
					usageResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
				},
			});

			// Generate JWT token
			const token = jwt.sign(
				{ userId: user.id, email: user.email, tier: user.tier },
				process.env.JWT_SECRET || "fallback-secret",
				{ expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
			);

			// Generate email verification token
			const verificationToken = jwt.sign(
				{ userId: user.id, type: "email-verification" },
				process.env.JWT_SECRET || "fallback-secret",
				{ expiresIn: "24h" }
			);

			// Send welcome and verification emails
			try {
				await emailService.sendWelcomeEmail(user.email, user.name);
				await emailService.sendVerificationEmail(
					user.email,
					user.name,
					verificationToken
				);
			} catch (emailError) {
				console.error(
					"Failed to send welcome/verification emails:",
					emailError
				);
				// Continue anyway - user is registered successfully
			}
			res.json({
				success: true,
				message: "User registered successfully",
				token,
				user: {
					id: user.id,
					email: user.email,
					name: user.name,
					tier: user.tier,
					emailVerified: user.emailVerified,
					planSelectedAt: user.planSelectedAt,
					usageCount: user.usageCount,
					usageLimit: getPlanUsageLimit(user.tier),
				},
			});
		} catch (error) {
			console.error("Registration error:", error);
			res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	}
);

/**
 * Login user
 */
router.post("/login", authLimit, validationRules.login, async (req, res) => {
	try {
		const { email, password } = req.body;

		// Validate input
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				error: "Email and password are required",
			});
		}

		// Find user in database
		const user = await prisma.user.findUnique({
			where: { email },
		});

		if (!user) {
			return res.status(401).json({
				success: false,
				error: "Invalid credentials",
			});
		}

		// Verify password
		const isValidPassword = await bcrypt.compare(password, user.password);
		if (!isValidPassword) {
			return res.status(401).json({
				success: false,
				error: "Invalid credentials",
			});
		}

		// Generate JWT token
		const token = jwt.sign(
			{ userId: user.id, email: user.email, tier: user.tier },
			process.env.JWT_SECRET || "fallback-secret",
			{ expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
		);

		res.json({
			success: true,
			message: "Login successful",
			token,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				tier: user.tier,
				emailVerified: user.emailVerified,
				planSelectedAt: user.planSelectedAt,
				usageCount: user.usageCount,
				usageLimit: getPlanUsageLimit(user.tier),
				usageResetDate: user.usageResetDate,
			},
		});
	} catch (error) {
		console.error("Login error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

/**
 * Get user profile
 */
router.get("/profile", async (req, res) => {
	try {
		// Verify JWT token
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				error: "No token provided",
			});
		}

		const token = authHeader.substring(7);

		// Verify JWT token
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
		} catch (error) {
			return res.status(401).json({
				success: false,
				error: "Invalid token",
			});
		}

		// Find user in database
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
		});

		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		res.json({
			success: true,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				tier: user.tier,
				emailVerified: user.emailVerified,
				planSelectedAt: user.planSelectedAt,
				usageCount: user.usageCount,
				usageLimit: getPlanUsageLimit(user.tier),
				usageResetDate: user.usageResetDate,
			},
		});
	} catch (error) {
		console.error("Profile error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

/**
 * Forgot password - generate reset token
 */
router.post(
	"/forgot-password",
	passwordResetLimit,
	validationRules.forgotPassword,
	async (req, res) => {
		try {
			const { email } = req.body;

			// Validate input
			if (!email) {
				return res.status(400).json({
					success: false,
					error: "Email is required",
				});
			}

			// Find user
			const user = await prisma.user.findUnique({
				where: { email },
			});

			if (!user) {
				// Don't reveal if user exists or not for security
				return res.json({
					success: true,
					message:
						"If an account with that email exists, we've sent a password reset link.",
				});
			}

			// Generate reset token (expires in 1 hour)
			const resetToken = jwt.sign(
				{ userId: user.id, type: "password-reset" },
				process.env.JWT_SECRET || "fallback-secret",
				{ expiresIn: "1h" }
			);

			// Send password reset email
			try {
				await emailService.sendPasswordResetEmail(
					user.email,
					user.name,
					resetToken
				);
			} catch (emailError) {
				console.error("Failed to send password reset email:", emailError);
				// Continue anyway - don't expose email sending issues to user
			}

			// For development, also log the token
			if (process.env.NODE_ENV === "development") {
				console.log(`Password reset token for ${email}: ${resetToken}`);
			}

			res.json({
				success: true,
				message: "Password reset instructions sent to your email",
				// Remove this in production - only for testing
				resetToken:
					process.env.NODE_ENV === "development" ? resetToken : undefined,
			});
		} catch (error) {
			console.error("Forgot password error:", error);
			res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	}
);

/**
 * Reset password with token
 */
router.post(
	"/reset-password",
	validationRules.resetPassword,
	async (req, res) => {
		try {
			const { token, newPassword } = req.body;

			// Validate input
			if (!token || !newPassword) {
				return res.status(400).json({
					success: false,
					error: "Reset token and new password are required",
				});
			}

			// Verify reset token
			let decoded;
			try {
				decoded = jwt.verify(
					token,
					process.env.JWT_SECRET || "fallback-secret"
				);
				if (decoded.type !== "password-reset") {
					throw new Error("Invalid token type");
				}
			} catch (error) {
				return res.status(400).json({
					success: false,
					error: "Invalid or expired reset token",
				});
			}

			// Find user
			const user = await prisma.user.findUnique({
				where: { id: decoded.userId },
			});

			if (!user) {
				return res.status(404).json({
					success: false,
					error: "User not found",
				});
			}

			// Hash new password
			const hashedPassword = await bcrypt.hash(newPassword, 12);

			// Update password
			await prisma.user.update({
				where: { id: user.id },
				data: { password: hashedPassword },
			});

			res.json({
				success: true,
				message: "Password reset successfully",
			});
		} catch (error) {
			console.error("Reset password error:", error);
			res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	}
);

/**
 * Update user profile
 */
router.put("/profile", async (req, res) => {
	try {
		// Verify JWT token
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				error: "No token provided",
			});
		}

		const token = authHeader.substring(7);

		// Verify JWT token
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
		} catch (error) {
			return res.status(401).json({
				success: false,
				error: "Invalid token",
			});
		}

		const { name, email } = req.body;

		// Validate input
		if (!name && !email) {
			return res.status(400).json({
				success: false,
				error: "At least one field (name or email) is required",
			});
		}

		// Check if new email already exists (if email is being updated)
		if (email) {
			const existingUser = await prisma.user.findUnique({
				where: { email },
			});

			if (existingUser && existingUser.id !== decoded.userId) {
				return res.status(400).json({
					success: false,
					error: "Email already in use",
				});
			}
		}

		// Update user profile
		const updateData = {};
		if (name) updateData.name = name;
		if (email) updateData.email = email;

		const updatedUser = await prisma.user.update({
			where: { id: decoded.userId },
			data: updateData,
		});

		res.json({
			success: true,
			message: "Profile updated successfully",
			user: {
				id: updatedUser.id,
				email: updatedUser.email,
				name: updatedUser.name,
				tier: updatedUser.tier,
			},
		});
	} catch (error) {
		console.error("Profile update error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

/**
 * Logout user (invalidate token)
 */
router.post("/logout", async (req, res) => {
	try {
		// Verify JWT token
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				error: "No token provided",
			});
		}

		const token = authHeader.substring(7);

		// Verify JWT token
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
		} catch (error) {
			return res.status(401).json({
				success: false,
				error: "Invalid token",
			});
		}

		// For JWT tokens, we can't really "invalidate" them server-side without a blacklist
		// But we can log the logout event and return success
		console.log(
			`User ${decoded.email} logged out at ${new Date().toISOString()}`
		);

		res.json({
			success: true,
			message: "Logout successful",
		});
	} catch (error) {
		console.error("Logout error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

/**
 * Change password for authenticated users
 */
router.post("/change-password", async (req, res) => {
	try {
		// Verify JWT token
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				error: "No token provided",
			});
		}

		const token = authHeader.substring(7);

		// Verify JWT token
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
		} catch (error) {
			return res.status(401).json({
				success: false,
				error: "Invalid token",
			});
		}

		const { currentPassword, newPassword } = req.body;

		// Validate input
		if (!currentPassword || !newPassword) {
			return res.status(400).json({
				success: false,
				error: "Current password and new password are required",
			});
		}

		// Find user
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
		});

		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Verify current password
		const isValidPassword = await bcrypt.compare(
			currentPassword,
			user.password
		);
		if (!isValidPassword) {
			return res.status(400).json({
				success: false,
				error: "Current password is incorrect",
			});
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 12);

		// Update password
		await prisma.user.update({
			where: { id: user.id },
			data: { password: hashedPassword },
		});

		res.json({
			success: true,
			message: "Password changed successfully",
		});
	} catch (error) {
		console.error("Change password error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

/**
 * Verify email with token
 */
router.post("/verify-email", validationRules.verifyEmail, async (req, res) => {
	try {
		const { token } = req.body;

		// Validate input
		if (!token) {
			return res.status(400).json({
				success: false,
				error: "Verification token is required",
			});
		}

		// Verify token
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
			if (decoded.type !== "email-verification") {
				throw new Error("Invalid token type");
			}
		} catch (error) {
			return res.status(400).json({
				success: false,
				error: "Invalid or expired verification token",
			});
		}

		// Find user
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
		});

		if (!user) {
			return res.status(404).json({
				success: false,
				error: "User not found",
			});
		}

		// Check if already verified
		if (user.emailVerified) {
			return res.json({
				success: true,
				message: "Email already verified",
			});
		}

		// Update user to mark email as verified
		await prisma.user.update({
			where: { id: user.id },
			data: { emailVerified: true },
		});

		res.json({
			success: true,
			message: "Email verified successfully",
		});
	} catch (error) {
		console.error("Email verification error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

/**
 * Resend email verification
 */
router.post(
	"/resend-verification",
	emailVerificationLimit,
	validationRules.resendVerification,
	async (req, res) => {
		try {
			const { email } = req.body;

			if (!email) {
				return res.status(400).json({
					success: false,
					error: "Email is required",
				});
			}

			// Find user
			const user = await prisma.user.findUnique({
				where: { email },
			});

			if (!user) {
				return res.json({
					success: true,
					message:
						"If an account with that email exists, we've sent a verification email.",
				});
			}

			// Generate verification token
			const verificationToken = jwt.sign(
				{ userId: user.id, type: "email-verification" },
				process.env.JWT_SECRET || "fallback-secret",
				{ expiresIn: "24h" }
			);

			// Send verification email
			try {
				await emailService.sendVerificationEmail(
					user.email,
					user.name,
					verificationToken
				);
			} catch (emailError) {
				console.error("Failed to send verification email:", emailError);
				// Continue anyway - don't expose email sending issues to user
			}

			// For development, also log the token
			if (process.env.NODE_ENV === "development") {
				console.log(
					`Email verification token for ${email}: ${verificationToken}`
				);
			}

			res.json({
				success: true,
				message: "Verification email sent",
				// Remove this in production
				verificationToken:
					process.env.NODE_ENV === "development"
						? verificationToken
						: undefined,
			});
		} catch (error) {
			console.error("Resend verification error:", error);
			res.status(500).json({
				success: false,
				error: "Internal server error",
			});
		}
	}
);

/**
 * Plan upgrade endpoint
 */
router.post("/upgrade-plan", async (req, res) => {
	try {
		// Verify JWT token
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				error: "No token provided",
			});
		}

		const token = authHeader.substring(7);
		let decoded;
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback-secret");
		} catch (error) {
			return res.status(401).json({
				success: false,
				error: "Invalid token",
			});
		}

		const { newPlan } = req.body;
		const validPlans = ["FREE", "PROFESSIONAL", "ENTERPRISE"];

		if (!newPlan || !validPlans.includes(newPlan.toUpperCase())) {
			return res.status(400).json({
				success: false,
				error: "Invalid plan type",
			});
		}

		// Update user plan
		const user = await prisma.user.update({
			where: { id: decoded.userId },
			data: {
				tier: newPlan.toUpperCase(),
				planSelectedAt: new Date(),
				usageCount: 0, // Reset usage count on plan change
				usageResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
			},
		});

		res.json({
			success: true,
			message: "Plan upgraded successfully",
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				tier: user.tier,
				emailVerified: user.emailVerified,
				planSelectedAt: user.planSelectedAt,
				usageCount: user.usageCount,
				usageLimit: getPlanUsageLimit(user.tier),
				usageResetDate: user.usageResetDate,
			},
		});
	} catch (error) {
		console.error("Plan upgrade error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

/**
 * Get plan usage limit based on tier
 */
function getPlanUsageLimit(tier) {
	switch (tier) {
		case "FREE":
			return 50;
		case "PROFESSIONAL":
			return -1; // Unlimited
		case "ENTERPRISE":
			return -1; // Unlimited
		default:
			return 50;
	}
}

/**
 * Get plan features based on tier
 */
function getPlanFeatures(tier) {
	switch (tier) {
		case "FREE":
			return {
				analysesPerMonth: 50,
				advancedCalculations: false,
				analysisHistory: false,
				exportCapabilities: false,
				prioritySupport: false,
				batchProcessing: false,
				apiAccess: false,
				whiteLabel: false,
			};
		case "PROFESSIONAL":
			return {
				analysesPerMonth: -1, // Unlimited
				advancedCalculations: true,
				analysisHistory: true,
				exportCapabilities: true,
				prioritySupport: true,
				batchProcessing: true,
				apiAccess: false,
				whiteLabel: false,
			};
		case "ENTERPRISE":
			return {
				analysesPerMonth: -1, // Unlimited
				advancedCalculations: true,
				analysisHistory: true,
				exportCapabilities: true,
				prioritySupport: true,
				batchProcessing: true,
				apiAccess: true,
				whiteLabel: true,
			};
		default:
			return getPlanFeatures("FREE");
	}
}

module.exports = router;
