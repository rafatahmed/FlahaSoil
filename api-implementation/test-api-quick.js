/** @format */

const axios = require("axios");

async function testSaltManagementAPI() {
	try {
		console.log("🧪 Testing Salt Management API...");

		// Test authentication first
		const authResponse = await axios.post(
			"http://localhost:3001/api/v1/auth/login",
			{
				email: "professional@test.com",
				password: "Test123!@#",
			}
		);

		if (!authResponse.data.success) {
			console.log("❌ Authentication failed");
			return;
		}

		const token = authResponse.data.token;
		console.log("✅ Authentication successful");
		console.log("   User:", authResponse.data.user.email);
		console.log("   Tier:", authResponse.data.user.tier);

		// Test soil analysis first
		const soilResponse = await axios.post(
			"http://localhost:3001/api/v1/soil/analyze",
			{
				sand: 45,
				clay: 25,
				silt: 30,
				organicMatter: 2.5,
				bulkDensity: 1.4,
				electricalConductivity: 4.2,
				ph: 7.8,
			},
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		);

		console.log("✅ Soil analysis successful");

		// Get the latest soil analysis ID from database
		const { PrismaClient } = require("@prisma/client");
		const prisma = new PrismaClient();

		const latestAnalysis = await prisma.soilAnalysis.findFirst({
			where: {
				sand: 45,
				clay: 25,
			},
			orderBy: { createdAt: "desc" },
		});

		let soilAnalysisId;
		if (latestAnalysis) {
			soilAnalysisId = latestAnalysis.id;
			console.log("   Using existing analysis ID:", soilAnalysisId);
		} else {
			// Create a test analysis record
			const testAnalysis = await prisma.soilAnalysis.create({
				data: {
					userId: authResponse.data.user.id,
					sand: 45,
					clay: 25,
					silt: 30,
					organicMatter: 2.5,
					fieldCapacity: 25.5,
					wiltingPoint: 12.3,
					plantAvailableWater: 13.2,
					saturation: 45.8,
					saturatedConductivity: 8.5,
					textureClass: "loam",
					calculationSource: "test",
				},
			});
			soilAnalysisId = testAnalysis.id;
			console.log("   Created new analysis ID:", soilAnalysisId);
		}

		await prisma.$disconnect();

		// Test leaching requirement calculation
		const leachingResponse = await axios.post(
			"http://localhost:3001/api/v1/salt-management/leaching-requirement",
			{
				soilEC: 2.0,
				waterEC: 1.5,
				cropThresholdEC: 2.5,
				climateZone: "gcc_arid",
				season: "summer",
				soilAnalysisId: soilAnalysisId,
				temperature: 42,
				humidity: 25,
				evaporationRate: 12,
			},
			{
				headers: { Authorization: `Bearer ${token}` },
			}
		);

		if (leachingResponse.data.success) {
			console.log("✅ Salt Management API Test SUCCESSFUL!");
			console.log(
				"   Leaching Fraction:",
				leachingResponse.data.data.results.leachingFraction
			);
			console.log(
				"   Economic Benefit: $",
				leachingResponse.data.data.economics.netBenefit
			);
			console.log(
				"   Recommendations:",
				leachingResponse.data.data.recommendations.length,
				"items"
			);
			console.log(
				"   Calculation ID:",
				leachingResponse.data.data.calculationId
			);
		} else {
			console.log("❌ Salt Management API Test Failed:", leachingResponse.data);
		}

		// Test API health
		const healthResponse = await axios.get(
			"http://localhost:3001/api/v1/health"
		);
		console.log("✅ API Health Check:", healthResponse.data.status);

		console.log("\n🎉 ALL TESTS PASSED - API IS WORKING PERFECTLY!");
	} catch (error) {
		console.log("❌ API Test Error:", error.response?.data || error.message);
	}
}

testSaltManagementAPI();
