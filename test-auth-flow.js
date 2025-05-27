/**
 * Authentication Test Script
 * Tests user registration, login, and authenticated features
 *
 * @format
 */

const apiBaseUrl = "http://localhost:3001/api/v1";

// Test user credentials
const testUser = {
	email: "testuser@example.com",
	password: "TestPassword123!",
	name: "Test User",
};

async function testAuthentication() {
	console.log("🔐 Testing Authentication Flow...\n");

	try {
		// Test 1: Register a new user
		console.log("1. Testing user registration...");
		const registerResponse = await fetch(`${apiBaseUrl}/auth/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(testUser),
		});

		if (registerResponse.ok) {
			const registerData = await registerResponse.json();
			console.log("✅ Registration successful:");
			console.log(`   User ID: ${registerData.user?.id}`);
			console.log(`   Email: ${registerData.user?.email}`);
			console.log(`   Plan: ${registerData.user?.plan}`);
		} else if (registerResponse.status === 400) {
			console.log("ℹ️  User already exists, proceeding with login test...");
		} else {
			const errorText = await registerResponse.text();
			console.log(`❌ Registration failed: ${registerResponse.status}`);
			console.log(`   Error: ${errorText.substring(0, 200)}`);
		}

		// Test 2: Login with credentials
		console.log("\n2. Testing user login...");
		const loginResponse = await fetch(`${apiBaseUrl}/auth/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: testUser.email,
				password: testUser.password,
			}),
			credentials: "include", // Important for cookies
		});

		let authToken = null;
		if (loginResponse.ok) {
			const loginData = await loginResponse.json();
			authToken = loginData.token;
			console.log("✅ Login successful:");
			console.log(`   Token received: ${authToken ? "Yes" : "No"}`);
			console.log(`   User: ${loginData.user?.name}`);
			console.log(`   Plan: ${loginData.user?.plan}`);
		} else {
			const errorText = await loginResponse.text();
			console.log(`❌ Login failed: ${loginResponse.status}`);
			console.log(`   Error: ${errorText.substring(0, 200)}`);
			return;
		}

		// Test 3: Access authenticated endpoint
		console.log("\n3. Testing authenticated soil analysis...");
		const analysisResponse = await fetch(`${apiBaseUrl}/soil/analyze`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${authToken}`,
			},
			body: JSON.stringify({
				sand: 45,
				clay: 25,
				organicMatter: 3.2,
				densityFactor: 1.0,
			}),
		});

		if (analysisResponse.ok) {
			const analysisData = await analysisResponse.json();
			console.log("✅ Authenticated analysis successful:");
			console.log(`   Soil Type: ${analysisData.data?.textureClass}`);
			console.log(`   Field Capacity: ${analysisData.data?.fieldCapacity}%`);
			console.log(`   User Tier: ${analysisData.tier}`);
			console.log(
				`   Usage: ${analysisData.usage?.current}/${analysisData.usage?.limit}`
			);
		} else {
			const errorText = await analysisResponse.text();
			console.log(
				`❌ Authenticated analysis failed: ${analysisResponse.status}`
			);
			console.log(`   Error: ${errorText.substring(0, 200)}`);
		}

		// Test 4: Test professional features (if available)
		console.log("\n4. Testing professional features...");
		const advancedResponse = await fetch(
			`${apiBaseUrl}/soil/analyze/advanced`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
				body: JSON.stringify({
					sand: 45,
					clay: 25,
					organicMatter: 3.2,
					densityFactor: 1.0,
				}),
			}
		);

		if (advancedResponse.ok) {
			const advancedData = await advancedResponse.json();
			console.log("✅ Advanced analysis available:");
			console.log(`   User has Professional+ access`);
		} else if (advancedResponse.status === 403) {
			console.log("ℹ️  Advanced features require Professional+ plan");
		} else {
			console.log(`⚠️  Advanced analysis response: ${advancedResponse.status}`);
		}

		// Test 5: Check user profile
		console.log("\n5. Testing user profile access...");
		const profileResponse = await fetch(`${apiBaseUrl}/auth/profile`, {
			method: "GET",
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		});

		if (profileResponse.ok) {
			const profileData = await profileResponse.json();
			console.log("✅ Profile access successful:");
			console.log(`   Name: ${profileData.user?.name}`);
			console.log(`   Email: ${profileData.user?.email}`);
			console.log(`   Plan: ${profileData.user?.plan}`);
			console.log(`   Usage Count: ${profileData.user?.usageCount}`);
		} else {
			console.log(`❌ Profile access failed: ${profileResponse.status}`);
		}

		console.log("\n✅ Authentication testing completed!");
		console.log("\n📋 Test Credentials:");
		console.log(`   Email: ${testUser.email}`);
		console.log(`   Password: ${testUser.password}`);
		console.log("\n🌐 You can now test these credentials in the browser at:");
		console.log("   http://localhost:3000/index.html (Login page)");
		console.log("   http://localhost:3000/demo.html (Demo page)");
	} catch (error) {
		console.error("❌ Authentication test failed:", error.message);
	}
}

// Run the authentication test
testAuthentication();
