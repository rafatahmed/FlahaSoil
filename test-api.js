/** @format */

// Simple test script to verify the API is working
// Using built-in fetch (Node.js 18+)

async function testAPI() {
	const baseURL = "http://localhost:3001/api/v1";

	console.log("Testing FlahaSoil API...\n");

	// Test 1: Health check
	try {
		const healthResponse = await fetch("http://localhost:3001/health");
		const healthData = await healthResponse.json();
		console.log("✅ Health check:", healthData);
	} catch (error) {
		console.log("❌ Health check failed:", error.message);
	}

	// Test 2: Soil analysis
	try {
		const soilResponse = await fetch(`${baseURL}/soil/analyze`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				sand: 33,
				clay: 33,
				organicMatter: 2.5,
				densityFactor: 1.0,
			}),
		});

		const soilData = await soilResponse.json();
		console.log("✅ Soil analysis:", soilData);
	} catch (error) {
		console.log("❌ Soil analysis failed:", error.message);
	}

	// Test 3: User registration
	try {
		const registerResponse = await fetch(`${baseURL}/auth/register`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: "test@example.com",
				password: "password123",
				name: "Test User",
			}),
		});

		const registerData = await registerResponse.json();
		console.log("✅ User registration:", registerData);
	} catch (error) {
		console.log("❌ User registration failed:", error.message);
	}

	// Test 4: Crop recommendations
	try {
		const cropResponse = await fetch(`${baseURL}/soil/recommendations`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				textureClass: "Loam",
				paw: 16,
				om: 2.5,
			}),
		});

		const cropData = await cropResponse.json();
		console.log("✅ Crop recommendations:", cropData);
	} catch (error) {
		console.log("❌ Crop recommendations failed:", error.message);
	}
}

testAPI().catch(console.error);
