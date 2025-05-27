/** @format */

// Complete authentication system test
const { default: fetch } = require("node-fetch");

async function testCompleteAuthentication() {
	const baseUrl = "http://localhost:3001/api/v1/auth";
	let testResults = {
		health: false,
		registration: false,
		login: false,
		profile: false,
		emailVerification: false,
		passwordReset: false,
		resendVerification: false,
		profileUpdate: false,
	};

	console.log("🚀 Complete FlahaSoil Authentication System Test\n");
	console.log("=".repeat(60));

	try {
		// Test 1: Health Check
		console.log("\n1️⃣ Testing Health Endpoint...");
		const healthResponse = await fetch("http://localhost:3001/health");
		const healthData = await healthResponse.json();
		testResults.health = healthData.status === "OK";
		console.log(
			testResults.health ? "✅ Health check passed" : "❌ Health check failed"
		);

		if (!testResults.health) return testResults;

		const testEmail = `test${Date.now()}@flaha.com`;
		const testPassword = "TestPassword123!";
		const testName = "Test User";

		// Test 2: User Registration
		console.log("\n2️⃣ Testing User Registration...");
		const registerResponse = await fetch(`${baseUrl}/register`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: testEmail,
				password: testPassword,
				name: testName,
			}),
		});

		const registerData = await registerResponse.json();
		testResults.registration = registerData.success && registerData.token;
		console.log(
			testResults.registration
				? "✅ Registration successful"
				: "❌ Registration failed"
		);

		if (!testResults.registration) {
			console.log("Error:", registerData.error);
			return testResults;
		}

		const userToken = registerData.token;
		const userId = registerData.user.id;

		console.log(`   📧 Email verified: ${registerData.user.emailVerified}`);
		console.log(`   👤 User ID: ${userId}`);

		// Test 3: User Login
		console.log("\n3️⃣ Testing User Login...");
		const loginResponse = await fetch(`${baseUrl}/login`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				email: testEmail,
				password: testPassword,
			}),
		});

		const loginData = await loginResponse.json();
		testResults.login = loginData.success && loginData.token;
		console.log(testResults.login ? "✅ Login successful" : "❌ Login failed");

		// Test 4: Profile Access
		console.log("\n4️⃣ Testing Profile Access...");
		const profileResponse = await fetch(`${baseUrl}/profile`, {
			headers: { Authorization: `Bearer ${userToken}` },
		});

		const profileData = await profileResponse.json();
		testResults.profile = profileData.success && profileData.user;
		console.log(
			testResults.profile
				? "✅ Profile access successful"
				: "❌ Profile access failed"
		);

		if (testResults.profile) {
			console.log(`   📧 Email: ${profileData.user.email}`);
			console.log(`   👤 Name: ${profileData.user.name}`);
			console.log(`   🎯 Tier: ${profileData.user.tier}`);
		}

		// Test 5: Resend Email Verification
		console.log("\n5️⃣ Testing Resend Email Verification...");
		const resendResponse = await fetch(`${baseUrl}/resend-verification`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: testEmail }),
		});

		const resendData = await resendResponse.json();
		testResults.resendVerification = resendData.success;
		console.log(
			testResults.resendVerification
				? "✅ Resend verification successful"
				: "❌ Resend verification failed"
		);

		// Test 6: Email Verification (using development token)
		if (resendData.verificationToken) {
			console.log("\n6️⃣ Testing Email Verification...");
			const verifyResponse = await fetch(`${baseUrl}/verify-email`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ token: resendData.verificationToken }),
			});

			const verifyData = await verifyResponse.json();
			testResults.emailVerification = verifyData.success;
			console.log(
				testResults.emailVerification
					? "✅ Email verification successful"
					: "❌ Email verification failed"
			);
		} else {
			console.log(
				"\n6️⃣ ⚠️ Email verification skipped (no dev token available)"
			);
		}

		// Test 7: Password Reset Request
		console.log("\n7️⃣ Testing Password Reset Request...");
		const forgotResponse = await fetch(`${baseUrl}/forgot-password`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email: testEmail }),
		});

		const forgotData = await forgotResponse.json();
		testResults.passwordReset = forgotData.success;
		console.log(
			testResults.passwordReset
				? "✅ Password reset request successful"
				: "❌ Password reset request failed"
		);

		// Test 8: Profile Update
		console.log("\n8️⃣ Testing Profile Update...");
		const updateResponse = await fetch(`${baseUrl}/profile`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${userToken}`,
			},
			body: JSON.stringify({ name: "Updated Test User" }),
		});

		const updateData = await updateResponse.json();
		testResults.profileUpdate = updateData.success;
		console.log(
			testResults.profileUpdate
				? "✅ Profile update successful"
				: "❌ Profile update failed"
		);
	} catch (error) {
		console.error("\n❌ Test suite failed:", error.message);
	}

	// Test Results Summary
	console.log("\n" + "=".repeat(60));
	console.log("📊 TEST RESULTS SUMMARY");
	console.log("=".repeat(60));

	const tests = [
		{ name: "Health Check", result: testResults.health },
		{ name: "User Registration", result: testResults.registration },
		{ name: "User Login", result: testResults.login },
		{ name: "Profile Access", result: testResults.profile },
		{ name: "Resend Verification", result: testResults.resendVerification },
		{ name: "Email Verification", result: testResults.emailVerification },
		{ name: "Password Reset", result: testResults.passwordReset },
		{ name: "Profile Update", result: testResults.profileUpdate },
	];

	let passed = 0;
	let total = tests.length;

	tests.forEach((test) => {
		const status = test.result ? "✅ PASS" : "❌ FAIL";
		console.log(`${status} | ${test.name}`);
		if (test.result) passed++;
	});

	console.log("=".repeat(60));
	console.log(`🎯 OVERALL RESULT: ${passed}/${total} tests passed`);

	if (passed === total) {
		console.log(
			"🎉 ALL TESTS PASSED! Authentication system is fully functional!"
		);
	} else if (passed >= total * 0.8) {
		console.log("⚠️ Most tests passed. Minor issues to address.");
	} else {
		console.log("❌ Multiple failures detected. Review implementation.");
	}

	return testResults;
}

// Run the complete test suite
testCompleteAuthentication();
