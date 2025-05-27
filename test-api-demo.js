/**
 * Test API Demo Endpoints
 * Tests demo functionality without authentication
 *
 * @format
 */

const apiBaseUrl = "http://localhost:3001/api/v1";

// Test data for soil analysis
const testSoilData = {
	sand: 45,
	clay: 25,
	organicMatter: 3.2,
	densityFactor: 1.0,
};

async function testDemoEndpoints() {
	console.log("🧪 Testing Demo API Endpoints...\n");

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
			console.log("✅ Demo analysis successful!");
			console.log("   Success:", analysisData.success);
			console.log("   Demo Mode:", analysisData.demo);
			console.log("   Soil Type:", analysisData.data?.soilTexture);
			console.log(
				"   Field Capacity:",
				analysisData.data?.fieldCapacity?.toFixed(2)
			);
		} else {
			console.log(
				"❌ Demo analysis failed:",
				analysisResponse.status,
				analysisResponse.statusText
			);
			const errorText = await analysisResponse.text();
			console.log("Error details:", errorText.substring(0, 200));
		}

		// Test 3: Enhanced demo analysis
		console.log("\n3. Testing enhanced demo analysis...");
		const enhancedResponse = await fetch(
			`${apiBaseUrl}/soil/demo/analyze/enhanced`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					...testSoilData,
					region: "midwest",
					location: {
						latitude: 40.7128,
						longitude: -74.006,
					},
				}),
			}
		);

		if (enhancedResponse.ok) {
			const enhancedData = await enhancedResponse.json();
			console.log("✅ Enhanced demo analysis successful!");
			console.log("   Demo Mode:", enhancedData.demo);
			console.log("   Soil Type:", enhancedData.data?.soilTexture);
			console.log("   Region:", enhancedData.data?.region);
		} else {
			console.log("❌ Enhanced demo analysis failed:", enhancedResponse.status);
			const errorText = await enhancedResponse.text();
			console.log("Error details:", errorText.substring(0, 200));
		}

		// Test 4: Demo visualization endpoints
		console.log("\n4. Testing demo visualization endpoints...");

		// Test demo moisture-tension curve
		try {
			const curveResponse = await fetch(
				`${apiBaseUrl}/soil/demo/moisture-tension/sandy-loam`
			);
			if (curveResponse.ok) {
				const curveData = await curveResponse.json();
				console.log(
					"✅ Demo moisture-tension curve:",
					curveData.data?.length || 0,
					"points"
				);
			} else {
				console.log(
					"⚠️  Demo moisture-tension endpoint failed:",
					curveResponse.status
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
					profileData.data?.horizons?.length || 0,
					"horizons"
				);
			} else {
				console.log(
					"⚠️  Demo 3D profile endpoint failed:",
					profileResponse.status
				);
			}
		} catch (error) {
			console.log("⚠️  Demo 3D profile endpoint error:", error.message);
		}

		console.log("\n✅ Demo API tests completed!");
	} catch (error) {
		console.error("❌ Demo API test failed:", error.message);
	}
}

// Run the test
testDemoEndpoints();
