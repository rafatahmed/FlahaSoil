/** @format */

const { default: fetch } = require("node-fetch");

async function testEmailVerification() {
	const baseUrl = "http://localhost:3001/api/v1/auth";

	console.log("📧 Testing Email Verification System\n");

	try {
		const testEmail = `test${Date.now()}@flaha.com`;

		// Test 1: Register a new user
		console.log("1. Registering new user...");
		const registerResponse = await fetch(`${baseUrl}/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: testEmail,
				password: "TestPassword123!",
				name: "Test User",
			}),
		});

		const registerData = await registerResponse.json();

		if (registerData.success) {
			console.log("✅ Registration successful");
			console.log(`User ID: ${registerData.user.id}`);
			console.log(`Email verified: ${registerData.user.emailVerified}`);

			const token = registerData.token;

			// Test 2: Resend verification email
			console.log("\n2. Testing resend verification email...");
			const resendResponse = await fetch(`${baseUrl}/resend-verification`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					email: testEmail,
				}),
			});

			const resendData = await resendResponse.json();
			console.log("Resend verification response:", resendData);

			if (resendData.success && resendData.verificationToken) {
				console.log("✅ Verification email sent");
				console.log("Development token:", resendData.verificationToken);

				// Test 3: Verify email with token
				console.log("\n3. Testing email verification...");
				const verifyResponse = await fetch(`${baseUrl}/verify-email`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						token: resendData.verificationToken,
					}),
				});

				const verifyData = await verifyResponse.json();
				console.log("Email verification response:", verifyData);

				if (verifyData.success) {
					console.log("✅ Email verification successful");

					// Test 4: Check profile after verification
					console.log("\n4. Checking profile after verification...");
					const profileResponse = await fetch(`${baseUrl}/profile`, {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});

					const profileData = await profileResponse.json();
					console.log("Profile after verification:", profileData);

					if (profileData.success) {
						console.log(
							`Email verified status: ${profileData.user.emailVerified}`
						);
						if (profileData.user.emailVerified) {
							console.log("✅ Email verification status updated correctly");
						} else {
							console.log("❌ Email verification status not updated");
						}
					}
				} else {
					console.log("❌ Email verification failed:", verifyData.error);
				}
			}
		} else {
			console.log("❌ Registration failed:", registerData.error);
		}
	} catch (error) {
		console.error("❌ Test failed:", error.message);
	}
}

// Run the test
testEmailVerification();
