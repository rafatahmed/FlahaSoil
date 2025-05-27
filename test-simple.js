/**
 * Simple test to check demo endpoint response structure
 *
 * @format
 */

const testData = {
	sand: 45,
	clay: 25,
	organicMatter: 3.2,
	densityFactor: 1.0,
};

async function checkDemoResponse() {
	try {
		const response = await fetch(
			"http://localhost:3001/api/v1/soil/demo/analyze",
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
			console.log("Full Response:", JSON.stringify(data, null, 2));
		} else {
			console.log("Error:", response.status, response.statusText);
		}
	} catch (error) {
		console.error("Error:", error.message);
	}
}

checkDemoResponse();
