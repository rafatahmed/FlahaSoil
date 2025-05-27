/** @format */

const { default: fetch } = require("node-fetch");

async function testAuthentication() {
	const baseUrl = "http://localhost:3001/api/v1/auth";

	console.log("🧪 Testing FlahaSoil Authentication System\n");

	try {
		// Test 1: Register a new user
		console.log("1. Testing user registration...");
		const registerResponse = await fetch(`${baseUrl}/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: "test@flaha.com",
				password: "TestPassword123!",
				name: "Test User",
			}),
		});

		const registerData = await registerResponse.json();
		console.log("Registration response:", registerData);

		if (registerData.success) {
			console.log("✅ Registration successful");
			const token = registerData.token;

			// Test 2: Get user profile
			console.log("\n2. Testing user profile...");
			const profileResponse = await fetch(`${baseUrl}/profile`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			const profileData = await profileResponse.json();
			console.log("Profile response:", profileData);

			if (profileData.success) {
				console.log("✅ Profile retrieval successful");
				console.log(`Email verified: ${profileData.user.emailVerified}`);
			}

			// Test 3: Test login
			console.log("\n3. Testing user login...");
			const loginResponse = await fetch(`${baseUrl}/login`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: "test@flaha.com",
					password: "TestPassword123!",
				}),
			});

			const loginData = await loginResponse.json();
			console.log("Login response:", loginData);

			if (loginData.success) {
				console.log("✅ Login successful");
			}

			// Test 4: Test forgot password
			console.log("\n4. Testing forgot password...");
			const forgotResponse = await fetch(`${baseUrl}/forgot-password`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: "test@flaha.com",
				}),
			});

			const forgotData = await forgotResponse.json();
			console.log("Forgot password response:", forgotData);

			if (forgotData.success) {
				console.log("✅ Forgot password successful");
			}
		} else {
			console.log("❌ Registration failed:", registerData.error);
		}
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	}
}

// Run the test
testAuthentication();
