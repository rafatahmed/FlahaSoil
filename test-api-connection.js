/**
 * Test API Connection Script
 * Tests basic connectivity between frontend and backend
 *
 * @format
 */

const apiBaseUrl = "http://localhost:3001/api/v1";

// Test data for soil analysis
const testSoilData = {
	sand: 45,
	clay: 25,
	silt: 30,
	organicMatter: 3.2,
	ph: 6.8,
};

async function testAPIConnection() {
	console.log("🔗 Testing API Connection...\n");

	try {
		// Test 1: Health check
		console.log("1. Testing health endpoint...");
		const healthResponse = await fetch("http://localhost:3001/health");
		const healthData = await healthResponse.json();
		console.log("✅ Health check:", healthData);
		// Test 2: Demo soil analysis (no auth required)
		console.log("\n2. Testing demo soil analysis...");
		const analysisResponse = await fetch(`${apiBaseUrl}/soil/demo/analyze`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(testSoilData),
		});
		if (analysisResponse.ok) {
			const analysisData = await analysisResponse.json();
			console.log("✅ Demo analysis successful:", analysisData.success);
			console.log("   Soil Type:", analysisData.data?.soilTexture);
			console.log("   Demo Mode:", analysisData.demo);
		} else {
			console.log(
				"❌ Demo analysis failed:",
				analysisResponse.status,
				analysisResponse.statusText
			);
			const errorText = await analysisResponse.text();
			console.log("Error details:", errorText.substring(0, 200) + "...");
		}

		// Test 3: Enhanced demo analysis
		console.log("\n3. Testing enhanced demo analysis endpoint...");
		const enhancedResponse = await fetch(
			`${apiBaseUrl}/soil/demo/analyze/enhanced`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...testSoilData,
					region: "central",
					location: {
						latitude: 40.7128,
						longitude: -74.006,
					},
				}),
			}
		);
		if (enhancedResponse.ok) {
			const enhancedData = await enhancedResponse.json();
			console.log("✅ Enhanced demo analysis successful");
			console.log("   Demo Mode:", enhancedData.demo);
			console.log("   Soil Type:", enhancedData.data?.soilTexture);

			// Test 4: Demo visualization data endpoints
			console.log("\n4. Testing demo visualization data endpoints..."); // Test demo moisture-tension curve
			try {
				const curveResponse = await fetch(
					`${apiBaseUrl}/soil/demo/moisture-tension/sandy-loam`
				);
				if (curveResponse.ok) {
					const curveData = await curveResponse.json();
					console.log(
						"✅ Demo moisture-tension curve:",
						curveData.data?.length,
						"points"
					);
				}
			} catch (error) {
				console.log("⚠️  Demo moisture-tension endpoint error:", error.message);
			}

			// Test demo 3D profile
			try {
				const profileResponse = await fetch(
					`${apiBaseUrl}/soil/demo/profile-3d/sandy-loam`
				);
				if (profileResponse.ok) {
					const profileData = await profileResponse.json();
					console.log(
						"✅ Demo 3D soil profile:",
						profileData.data?.horizons?.length,
						"horizons"
					);
				}
			} catch (error) {
				console.log("⚠️  Demo 3D profile endpoint error:", error.message);
			}
		} else {
			console.log("❌ Enhanced demo analysis failed:", enhancedResponse.status);
			const errorText = await enhancedResponse.text();
			console.log("Error details:", errorText.substring(0, 200) + "...");
		}

		console.log("\n✅ API connection tests completed!");
	} catch (error) {
		console.error("❌ API connection test failed:", error.message);
	}
}

// Run the test
testAPIConnection();
