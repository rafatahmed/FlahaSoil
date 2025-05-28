/**
 * Comprehensive Visualization Test Script
 * Tests all demo endpoints and visualization features
 *
 * @format
 */

const API_BASE = "http://localhost:3001/api/v1";

// Test data - same as what works in our backend tests
const testSoilData = {
	sand: 40,
	clay: 30,
	silt: 30,
	organicMatter: 5,
	densityFactor: 1.3,
};

async function testEndpoint(url, description) {
	console.log(`\n🧪 Testing: ${description}`);
	console.log(`📍 URL: ${url}`);

	try {
		const response = await fetch(url, {
			method: "GET",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			throw new Error(`HTTP ${response.status}: ${response.statusText}`);
		}

		const data = await response.json();
		console.log(`✅ Success! Response structure:`);
		console.log(`   - Success: ${data.success}`);
		console.log(
			`   - Data type: ${Array.isArray(data.data) ? "Array" : "Object"}`
		);
		console.log(
			`   - Data length/keys: ${
				Array.isArray(data.data)
					? data.data.length
					: Object.keys(data.data).length
			}`
		);
		console.log(`   - Demo flag: ${data.demo}`);
		console.log(`   - Note: ${data.note}`);

		if (Array.isArray(data.data) && data.data.length > 0) {
			console.log(
				`   - First item keys: ${Object.keys(data.data[0]).join(", ")}`
			);
		} else if (data.data && typeof data.data === "object") {
			console.log(`   - Data keys: ${Object.keys(data.data).join(", ")}`);
		}

		return data;
	} catch (error) {
		console.log(`❌ Error: ${error.message}`);
		return null;
	}
}

async function testFrontendAPI() {
	console.log(`\n🌐 Testing Frontend API Integration`);

	try {
		// Import the API client (simulating browser environment)
		const { FlahaSoilAPI } = await import("./public/assets/js/apiClient.js");
		const apiClient = new FlahaSoilAPI();

		const encodedData = Buffer.from(JSON.stringify(testSoilData)).toString(
			"base64"
		);

		console.log(`🔧 Testing getMoistureTensionCurveDemo method...`);
		const moistureResult = await apiClient.getMoistureTensionCurveDemo(
			encodedData
		);
		console.log(
			`   Result: ${moistureResult.success ? "✅ Success" : "❌ Failed"}`
		);

		console.log(`🔧 Testing getSoilProfile3DDemo method...`);
		const profileResult = await apiClient.getSoilProfile3DDemo(encodedData);
		console.log(
			`   Result: ${profileResult.success ? "✅ Success" : "❌ Failed"}`
		);
	} catch (error) {
		console.log(`❌ Frontend API test error: ${error.message}`);
	}
}

async function runAllTests() {
	console.log(`🚀 FlahaSoil Visualization Test Suite`);
	console.log(`==============================================`);
	console.log(`📅 Test Date: ${new Date().toISOString()}`);
	console.log(`🧪 Test Data:`, testSoilData);

	const encodedData = Buffer.from(JSON.stringify(testSoilData)).toString(
		"base64"
	);
	console.log(`🔐 Encoded Data: ${encodedData}`);

	// Test backend endpoints directly
	await testEndpoint(
		`${API_BASE}/soil/demo/moisture-tension/${encodedData}`,
		"Moisture-Tension Curve Demo Endpoint"
	);

	await testEndpoint(
		`${API_BASE}/soil/demo/profile-3d/${encodedData}`,
		"3D Soil Profile Demo Endpoint"
	);

	// Test frontend API integration
	await testFrontendAPI();

	console.log(`\n🏁 Test Suite Complete!`);
	console.log(`==============================================`);
	console.log(`📊 Next Steps:`);
	console.log(`   1. Open http://localhost:3000/test-visualization.html`);
	console.log(`   2. Click "Test Moisture-Tension Curve" button`);
	console.log(`   3. Click "Test 3D Profile" button`);
	console.log(`   4. Open http://localhost:3000/advanced-demo.html`);
	console.log(`   5. Enter soil data and click "Generate Advanced Analysis"`);
}

// Run the tests
runAllTests().catch(console.error);
