/** @format */

// Simple test to check API connection
async function testBasicAPI() {
	try {
		console.log("🔍 Testing Basic API Connection...\n");

		// Test health endpoint
		const healthResponse = await fetch("http://localhost:3001/health");
		const healthData = await healthResponse.text();
		console.log("Health check:", healthData);

		// Test registration endpoint
		console.log("\n📝 Testing Registration...");
		const testEmail = `test${Date.now()}@example.com`;

		const registerResponse = await fetch(
			"http://localhost:3001/api/v1/auth/register",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: testEmail,
					password: "TestPassword123!",
					name: "Test User",
				}),
			}
		);

		if (!registerResponse.ok) {
			console.error(
				"Registration failed with status:",
				registerResponse.status
			);
			const errorText = await registerResponse.text();
			console.error("Error:", errorText);
			return;
		}

		const registerData = await registerResponse.json();
		console.log("Registration result:", registerData);

		if (registerData.success) {
			console.log("✅ Registration successful!");
			console.log(`✉️ Email verified: ${registerData.user.emailVerified}`);

			// Test login
			console.log("\n🔐 Testing Login...");
			const loginResponse = await fetch(
				"http://localhost:3001/api/v1/auth/login",
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						email: testEmail,
						password: "TestPassword123!",
					}),
				}
			);

			const loginData = await loginResponse.json();
			console.log("Login result:", loginData);

			if (loginData.success) {
				console.log("✅ Login successful!");
				console.log("🎫 Token received:", loginData.token ? "Yes" : "No");
			} else {
				console.log("❌ Login failed:", loginData.error);
			}
		} else {
			console.log("❌ Registration failed:", registerData.error);
		}
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	}
}

// Add fetch if not available (for older Node.js versions)
if (!global.fetch) {
	global.fetch = require("node-fetch").default || require("node-fetch");
}

// Run the test
testBasicAPI();
