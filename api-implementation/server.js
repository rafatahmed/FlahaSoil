/** @format */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
require("dotenv").config();

const app = express();

// Middleware
app.use(
	helmet({
		crossOriginEmbedderPolicy: false,
		crossOriginResourcePolicy: { policy: "cross-origin" },
	})
);

// Enhanced CORS configuration
app.use(
	cors({
		origin: [
			"http://localhost:3000",
			"http://127.0.0.1:3000",
			"http://localhost:5000",
			"http://127.0.0.1:5000",
		],
		methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		credentials: true,
		optionsSuccessStatus: 200,
	})
);

app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Handle preflight requests explicitly
app.options("*", (req, res) => {
	res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
	res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
	res.header(
		"Access-Control-Allow-Headers",
		"Content-Type,Authorization,X-Requested-With"
	);
	res.header("Access-Control-Allow-Credentials", "true");
	res.sendStatus(200);
});

// Routes
app.use("/api/v1/soil", require("./src/routes/soil"));
app.use("/api/v1/auth", require("./src/routes/auth"));
app.use("/api/v1/integrations", require("./src/routes/integrations"));
app.use("/api/v1/reports", require("./src/routes/reports"));

// Health check
app.get("/health", (req, res) => {
	res.json({ status: "OK", service: "FlahaSoil API" });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
	console.log(`FlahaSoil API running on port ${PORT}`);
});
