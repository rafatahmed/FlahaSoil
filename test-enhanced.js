/**
 * Test enhanced demo endpoint
 *
 * @format
 */

const testData = {
	sand: 45,
	clay: 25,
	organicMatter: 3.2,
	densityFactor: 1.0,
	region: "midwest",
	location: {
		latitude: 40.7128,
		longitude: -74.006,
	},
};

async function checkEnhancedDemo() {
	try {
		console.log("Testing enhanced demo endpoint...");
		const response = await fetch(
			"http://localhost:3001/api/v1/soil/demo/analyze/enhanced",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(testData),
			}
		);

		if (response.ok) {
			const data = await response.json();
			console.log("Enhanced Response:", JSON.stringify(data, null, 2));
		} else {
			console.log("Error:", response.status, response.statusText);
			const errorText = await response.text();
			console.log("Error details:", errorText);
		}
	} catch (error) {
		console.error("Error:", error.message);
	}
}

checkEnhancedDemo();
