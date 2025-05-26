/** @format */

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/database");
const router = express.Router();

/**
 * Authentication routes for FlahaSoil API
 * Now using proper database storage with Prisma
 */

/**
 * Register a new user
 */
router.post("/register", async (req, res) => {
	try {
		const { email, password, name } = req.body;

		// Validate input
		if (!email || !password || !name) {
			return res.status(400).json({
				success: false,
				error: "Email, password, and name are required",
			});
		}

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
				tier: "FREE",
			},
		});

		// Generate JWT token
		const token = jwt.sign(
			{ userId: user.id, email: user.email, tier: user.tier },
			process.env.JWT_SECRET || "fallback-secret",
			{ expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
		);

		res.json({
			success: true,
			message: "User registered successfully",
			token,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				tier: user.tier,
			},
		});
	} catch (error) {
		console.error("Registration error:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

/**
 * Login user
 */
router.post("/login", async (req, res) => {
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

module.exports = router;
