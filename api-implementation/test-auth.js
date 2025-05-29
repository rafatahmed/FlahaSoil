/**
 * Script to test authentication for all test users
 *
 * @format
 */

const fetch = require("node-fetch");

const API_BASE = "http://localhost:3001/api/v1";

const testUsers = [
	{
		email: "demo@flahasoil.com",
		password: "demo123",
		tier: "FREE",
	},
	{
		email: "pro@flahasoil.com",
		password: "pro123",
		tier: "PROFESSIONAL",
	},
	{
		email: "enterprise@flahasoil.com",
		password: "enterprise123",
		tier: "ENTERPRISE",
	},
];

async function testAuthentication() {
	console.log("🔐 Testing authentication for all users...\n");

	for (const user of testUsers) {
		console.log(`🧪 Testing ${user.email} (${user.tier})...`);

		try {
			// Test login
			const loginResponse = await fetch(`${API_BASE}/auth/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: user.email,
					password: user.password,
				}),
			});

			const loginResult = await loginResponse.json();

			if (loginResponse.ok && loginResult.success) {
				console.log(`✅ Login successful for ${user.email}`);
				console.log(`   - Token received: ${loginResult.token ? "Yes" : "No"}`);
				console.log(`   - User tier: ${loginResult.user?.tier || "Unknown"}`);
				console.log(`   - Usage count: ${loginResult.user?.usageCount || 0}`);

				// Test profile access with token
				if (loginResult.token) {
					const profileResponse = await fetch(`${API_BASE}/auth/profile`, {
						method: "GET",
						headers: {
							Authorization: `Bearer ${loginResult.token}`,
						},
					});

					const profileResult = await profileResponse.json();

					if (profileResponse.ok && profileResult.success) {
						console.log(`✅ Profile access successful`);
					} else {
						console.log(
							`❌ Profile access failed: ${
								profileResult.error || "Unknown error"
							}`
						);
					}
				}
			} else {
				console.log(`❌ Login failed for ${user.email}`);
				console.log(`   - Error: ${loginResult.error || "Unknown error"}`);
				console.log(`   - Status: ${loginResponse.status}`);
			}
		} catch (error) {
			console.log(`❌ Network error for ${user.email}: ${error.message}`);
		}

		console.log(""); // Empty line for readability
	}
}

// Test if server is running first
async function checkServer() {
	try {
		const response = await fetch(`${API_BASE}/health`);
		if (response.ok) {
			console.log("✅ Server is running\n");
			return true;
		} else {
			console.log("❌ Server health check failed");
			return false;
		}
	} catch (error) {
		console.log(
			"❌ Cannot connect to server. Make sure the backend is running on port 3001"
		);
		console.log(`   Error: ${error.message}\n`);
		return false;
	}
}

// Run the tests
async function runTests() {
	const serverRunning = await checkServer();
	if (serverRunning) {
		await testAuthentication();
	} else {
		console.log("💡 Start the backend server with: npm start");
	}
}

runTests();
