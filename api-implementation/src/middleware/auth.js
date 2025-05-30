/** @format */

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
	console.log("🔐 Auth middleware called for:", req.method, req.path);
	console.log(
		"🔐 Authorization header:",
		req.header("Authorization") ? "Present" : "Missing"
	);

	const token = req.header("Authorization")?.replace("Bearer ", "");

	if (!token) {
		console.log("❌ No token provided");
		return res.status(401).json({ error: "Access denied. No token provided." });
	}

	try {
		const decoded = jwt.verify(
			token,
			process.env.JWT_SECRET || "fallback-secret"
		);
		console.log("✅ Token verified, user:", decoded.userId || decoded.id);
		req.user = decoded;
		next();
	} catch (error) {
		console.log("❌ Token verification failed:", error.message);
		res.status(400).json({ error: "Invalid token." });
	}
};

module.exports = authMiddleware;
