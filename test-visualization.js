/**
 * Test demo visualization endpoints
 *
 * @format
 */

const apiBaseUrl = "http://localhost:3001/api/v1";

async function testVisualizationEndpoints() {
	console.log("🎨 Testing Demo Visualization Endpoints...\n");

	try {
		// Create demo soil data for testing
		const demoSoilData = {
			sand: 45,
			clay: 25,
			organicMatter: 3.2,
			densityFactor: 1.0,
			region: "midwest",
		};

		// Encode demo data as base64
		const encodedData = Buffer.from(JSON.stringify(demoSoilData)).toString(
			"base64"
		);

		// Test 1: Demo moisture-tension curve
		console.log("1. Testing demo moisture-tension curve...");
		const curveResponse = await fetch(
			`${apiBaseUrl}/soil/demo/moisture-tension/${encodedData}`
		);

		if (curveResponse.ok) {
			const curveData = await curveResponse.json();
			console.log("✅ Moisture-tension curve response:");
			console.log("   Success:", curveData.success);
			console.log("   Data points:", curveData.data?.length || 0);
			console.log(
				"   Sample point:",
				JSON.stringify(curveData.data?.[0], null, 2)
			);
		} else {
			console.log("❌ Moisture-tension curve failed:", curveResponse.status);
		}
		// Test 2: Demo 3D soil profile
		console.log("\n2. Testing demo 3D soil profile...");
		const profileResponse = await fetch(
			`${apiBaseUrl}/soil/demo/profile-3d/${encodedData}`
		);

		if (profileResponse.ok) {
			const profileData = await profileResponse.json();
			console.log("✅ 3D soil profile response:");
			console.log("   Success:", profileData.success);
			console.log("   Horizons:", profileData.data?.horizons?.length || 0);
			console.log("   Max depth:", profileData.data?.maxDepth);
			console.log(
				"   Sample horizon:",
				JSON.stringify(profileData.data?.horizons?.[0], null, 2)
			);
		} else {
			console.log("❌ 3D soil profile failed:", profileResponse.status);
		}

		console.log("\n✅ Visualization endpoint tests completed!");
	} catch (error) {
		console.error("❌ Visualization test failed:", error.message);
	}
}

testVisualizationEndpoints();
