/**
 * Test Salt Management Implementation - Phase 3 Week 10
 * Validates leaching/drainage calculations and API endpoints
 *
 * @format
 */

const axios = require("axios");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const API_BASE = "http://localhost:3001/api/v1";

// Test configuration
const testConfig = {
	// Test user credentials (Professional tier)
	testUser: {
		email: "professional@test.com",
		password: "Test123!@#",
	},

	// Test soil analysis data
	testSoilData: {
		sand: 45,
		clay: 25,
		silt: 30,
		organicMatter: 2.5,
		bulkDensity: 1.4,
		electricalConductivity: 4.2, // Moderate salinity
		ph: 7.8,
	},

	// Test salt management scenarios
	saltScenarios: [
		{
			name: "Low Salinity Tomato",
			soilEC: 2.0,
			waterEC: 1.5,
			cropThresholdEC: 2.5,
			climateZone: "gcc_arid",
			season: "summer",
			expectedLF: 0.15, // Expected leaching fraction range
		},
		{
			name: "High Salinity Barley",
			soilEC: 6.0,
			waterEC: 3.0,
			cropThresholdEC: 8.0,
			climateZone: "gcc_arid",
			season: "summer",
			expectedLF: 0.25,
		},
		{
			name: "Extreme Salinity Date Palm",
			soilEC: 12.0,
			waterEC: 5.0,
			cropThresholdEC: 18.0,
			climateZone: "gcc_arid",
			season: "summer",
			expectedLF: 0.2,
		},
	],
};

let authToken = null;
let testUserId = null;
let testSoilAnalysisId = null;

/**
 * Test authentication and get token
 */
async function testAuthentication() {
	console.log("🔐 Testing authentication...");

	try {
		const response = await axios.post(`${API_BASE}/auth/login`, {
			email: testConfig.testUser.email,
			password: testConfig.testUser.password,
		});

		if (response.data.success && response.data.token) {
			authToken = response.data.token;
			testUserId = response.data.user.id;
			console.log("✅ Authentication successful");
			console.log(`   User: ${response.data.user.email}`);
			console.log(`   User ID: ${testUserId}`);
			console.log(`   Tier: ${response.data.user.tier}`);
			return true;
		} else {
			console.log("❌ Authentication failed:", response.data);
			return false;
		}
	} catch (error) {
		console.log(
			"❌ Authentication error:",
			error.response?.data || error.message
		);
		return false;
	}
}

/**
 * Create test soil analysis
 */
async function createTestSoilAnalysis() {
	console.log("\n🌱 Creating test soil analysis...");

	try {
		const response = await axios.post(
			`${API_BASE}/soil/analyze`,
			testConfig.testSoilData,
			{
				headers: { Authorization: `Bearer ${authToken}` },
			}
		);

		if (response.data.success && response.data.data) {
			console.log("✅ Soil analysis created successfully");
			console.log(`   Texture Class: ${response.data.data.textureClass}`);
			console.log(
				`   Soil EC: ${testConfig.testSoilData.electricalConductivity} dS/m`
			);

			// Get the latest soil analysis ID from the database
			try {
				const latestAnalysis = await prisma.soilAnalysis.findFirst({
					where: {
						sand: testConfig.testSoilData.sand,
						clay: testConfig.testSoilData.clay,
					},
					orderBy: { createdAt: "desc" },
				});

				if (latestAnalysis) {
					testSoilAnalysisId = latestAnalysis.id;
					console.log(`   Analysis ID: ${testSoilAnalysisId}`);
				} else {
					// Fallback: create a test analysis record
					const testAnalysis = await prisma.soilAnalysis.create({
						data: {
							userId: testUserId,
							sand: testConfig.testSoilData.sand,
							clay: testConfig.testSoilData.clay,
							silt:
								100 -
								testConfig.testSoilData.sand -
								testConfig.testSoilData.clay,
							organicMatter: testConfig.testSoilData.organicMatter,
							fieldCapacity: parseFloat(response.data.data.fieldCapacity),
							wiltingPoint: parseFloat(response.data.data.wiltingPoint),
							plantAvailableWater: parseFloat(
								response.data.data.plantAvailableWater
							),
							saturation: parseFloat(response.data.data.saturation),
							saturatedConductivity: parseFloat(
								response.data.data.saturatedConductivity
							),
							textureClass: response.data.data.textureClass,
							calculationSource: "test",
						},
					});
					testSoilAnalysisId = testAnalysis.id;
					console.log(`   Created test analysis ID: ${testSoilAnalysisId}`);
				}
			} catch (dbError) {
				console.log("⚠️  Database query failed, using fallback ID");
				testSoilAnalysisId = "test-analysis-" + Date.now();
			}

			return true;
		} else {
			console.log("❌ Soil analysis creation failed:", response.data);
			return false;
		}
	} catch (error) {
		console.log(
			"❌ Soil analysis error:",
			error.response?.data || error.message
		);
		return false;
	}
}

/**
 * Test leaching requirement calculations
 */
async function testLeachingCalculations() {
	console.log("\n💧 Testing leaching requirement calculations...");

	const results = [];

	for (const scenario of testConfig.saltScenarios) {
		console.log(`\n📊 Testing scenario: ${scenario.name}`);

		try {
			const requestData = {
				soilEC: scenario.soilEC,
				waterEC: scenario.waterEC,
				cropThresholdEC: scenario.cropThresholdEC,
				climateZone: scenario.climateZone,
				season: scenario.season,
				soilAnalysisId: testSoilAnalysisId,
				temperature: 42, // Gulf summer temperature
				humidity: 25, // Low humidity
				evaporationRate: 12, // High evaporation
			};

			const response = await axios.post(
				`${API_BASE}/salt-management/leaching-requirement`,
				requestData,
				{
					headers: { Authorization: `Bearer ${authToken}` },
				}
			);

			if (response.data.success) {
				const result = response.data.data;

				console.log("✅ Leaching calculation successful");
				console.log(
					`   Leaching Fraction: ${result.results.leachingFraction.toFixed(3)}`
				);
				console.log(`   Leaching Depth: ${result.results.leachingDepth} mm`);
				console.log(`   Total Water Need: ${result.results.totalWaterNeed} mm`);
				console.log(`   Water Increase: ${result.results.waterIncrease}%`);
				console.log(`   Climate Factor: ${result.calculations.climateFactor}`);
				console.log(
					`   Seasonal Factor: ${result.calculations.seasonalFactor}`
				);
				console.log(`   Economic Benefit: $${result.economics.netBenefit}`);
				console.log(
					`   Recommendations: ${result.recommendations.length} items`
				);

				// Validate results
				const isValid = validateLeachingResults(result, scenario);
				results.push({
					scenario: scenario.name,
					success: true,
					valid: isValid,
					leachingFraction: result.results.leachingFraction,
					calculationId: result.calculationId,
				});
			} else {
				console.log("❌ Leaching calculation failed:", response.data);
				results.push({
					scenario: scenario.name,
					success: false,
					error: response.data.error,
				});
			}
		} catch (error) {
			console.log(
				"❌ Leaching calculation error:",
				error.response?.data || error.message
			);
			results.push({
				scenario: scenario.name,
				success: false,
				error: error.message,
			});
		}
	}

	return results;
}

/**
 * Test drainage assessment
 */
async function testDrainageAssessment() {
	console.log("\n🏗️ Testing drainage assessment...");

	try {
		const requestData = {
			soilAnalysisId: testSoilAnalysisId,
			fieldArea: 5.0, // 5 hectares
			fieldSlope: 1.5, // 1.5% slope
			groundwaterDepth: 1.8, // 1.8m depth (shallow)
			seasonalWaterTable: true, // Seasonal water table present
		};

		const response = await axios.post(
			`${API_BASE}/salt-management/drainage-assessment`,
			requestData,
			{
				headers: { Authorization: `Bearer ${authToken}` },
			}
		);

		if (response.data.success) {
			const result = response.data.data;

			console.log("✅ Drainage assessment successful");
			console.log(
				`   Drainage Required: ${result.assessment.drainageRequired}`
			);
			console.log(`   Urgency Level: ${result.assessment.urgencyLevel}`);
			console.log(`   Drainage Class: ${result.assessment.drainageClass}`);
			console.log(`   System Type: ${result.system.systemType}`);
			console.log(
				`   Installation Cost: $${result.economics.installationCost}`
			);
			console.log(`   Payback Period: ${result.economics.paybackPeriod} years`);
			console.log(
				`   Benefit/Cost Ratio: ${result.economics.benefitCostRatio}`
			);
			console.log(
				`   Implementation Duration: ${result.implementation.totalDuration}`
			);

			return {
				success: true,
				assessmentId: result.assessmentId,
				drainageRequired: result.assessment.drainageRequired,
				systemType: result.system.systemType,
			};
		} else {
			console.log("❌ Drainage assessment failed:", response.data);
			return { success: false, error: response.data.error };
		}
	} catch (error) {
		console.log(
			"❌ Drainage assessment error:",
			error.response?.data || error.message
		);
		return { success: false, error: error.message };
	}
}

/**
 * Test salt balance calculation
 */
async function testSaltBalance() {
	console.log("\n⚖️ Testing salt balance calculation...");

	try {
		const requestData = {
			soilAnalysisId: testSoilAnalysisId,
			irrigationVolume: 50, // mm
			irrigationEC: 2.5, // dS/m
			fertilizerInputs: [
				{ amount: 200, saltIndex: 0.15 }, // NPK fertilizer
				{ amount: 100, saltIndex: 0.05 }, // Organic fertilizer
			],
			precipitationVolume: 5, // mm (minimal in Gulf)
			leachingVolume: 15, // mm
			drainageVolume: 10, // mm
			cropUptake: 2, // kg/ha
			fieldArea: 5.0, // hectares
			timeperiod: "monthly",
			season: "summer",
		};

		const response = await axios.post(
			`${API_BASE}/salt-management/salt-balance`,
			requestData,
			{
				headers: { Authorization: `Bearer ${authToken}` },
			}
		);

		if (response.data.success) {
			const result = response.data.data;

			console.log("✅ Salt balance calculation successful");
			console.log(`   Total Salt Inputs: ${result.balance.totalInputs} kg/ha`);
			console.log(
				`   Total Salt Outputs: ${result.balance.totalOutputs} kg/ha`
			);
			console.log(`   Net Salt Balance: ${result.balance.netBalance} kg/ha`);
			console.log(`   Balance Status: ${result.balance.balanceStatus}`);
			console.log(`   Trend: ${result.balance.trend}`);
			console.log(`   Recommendations: ${result.recommendations.length} items`);

			// Display salt inputs breakdown
			console.log("\n   Salt Inputs Breakdown:");
			console.log(`     Irrigation: ${result.saltInputs.irrigation} kg/ha`);
			console.log(`     Fertilizer: ${result.saltInputs.fertilizer} kg/ha`);
			console.log(`     Atmospheric: ${result.saltInputs.atmospheric} kg/ha`);
			console.log(`     Groundwater: ${result.saltInputs.groundwater} kg/ha`);

			// Display salt outputs breakdown
			console.log("\n   Salt Outputs Breakdown:");
			console.log(`     Leaching: ${result.saltOutputs.leaching} kg/ha`);
			console.log(`     Drainage: ${result.saltOutputs.drainage} kg/ha`);
			console.log(`     Crop Uptake: ${result.saltOutputs.cropUptake} kg/ha`);
			console.log(
				`     Surface Runoff: ${result.saltOutputs.surfaceRunoff} kg/ha`
			);

			return {
				success: true,
				recordId: result.recordId,
				balanceStatus: result.balance.balanceStatus,
				netBalance: result.balance.netBalance,
			};
		} else {
			console.log("❌ Salt balance calculation failed:", response.data);
			return { success: false, error: response.data.error };
		}
	} catch (error) {
		console.log(
			"❌ Salt balance calculation error:",
			error.response?.data || error.message
		);
		return { success: false, error: error.message };
	}
}

/**
 * Validate leaching calculation results
 */
function validateLeachingResults(result, scenario) {
	const lf = result.results.leachingFraction;
	const expectedLF = scenario.expectedLF;

	// Check if leaching fraction is within reasonable range
	if (lf < 0 || lf > 0.5) {
		console.log(`   ⚠️  Leaching fraction out of range: ${lf}`);
		return false;
	}

	// Check if Gulf climate adjustments are applied
	if (result.calculations.climateFactor < 1.2) {
		console.log(
			`   ⚠️  Gulf climate factor too low: ${result.calculations.climateFactor}`
		);
		return false;
	}

	// Check if seasonal adjustments are applied for summer
	if (
		scenario.season === "summer" &&
		result.calculations.seasonalFactor < 1.3
	) {
		console.log(
			`   ⚠️  Summer seasonal factor too low: ${result.calculations.seasonalFactor}`
		);
		return false;
	}

	// Check if economic analysis is reasonable
	if (result.economics.benefitCostRatio < 0) {
		console.log(
			`   ⚠️  Negative benefit/cost ratio: ${result.economics.benefitCostRatio}`
		);
		return false;
	}

	console.log("   ✅ Validation passed");
	return true;
}

/**
 * Generate test summary
 */
function generateTestSummary(
	leachingResults,
	drainageResult,
	saltBalanceResult
) {
	console.log("\n📋 TEST SUMMARY");
	console.log("================");

	// Leaching calculations summary
	const successfulLeaching = leachingResults.filter((r) => r.success).length;
	const validLeaching = leachingResults.filter(
		(r) => r.success && r.valid
	).length;

	console.log(`\n💧 Leaching Calculations:`);
	console.log(`   Total Tests: ${leachingResults.length}`);
	console.log(`   Successful: ${successfulLeaching}`);
	console.log(`   Valid: ${validLeaching}`);
	console.log(
		`   Success Rate: ${(
			(successfulLeaching / leachingResults.length) *
			100
		).toFixed(1)}%`
	);

	// Drainage assessment summary
	console.log(`\n🏗️ Drainage Assessment:`);
	console.log(`   Success: ${drainageResult.success ? "Yes" : "No"}`);
	if (drainageResult.success) {
		console.log(`   Drainage Required: ${drainageResult.drainageRequired}`);
		console.log(`   System Type: ${drainageResult.systemType}`);
	}

	// Salt balance summary
	console.log(`\n⚖️ Salt Balance Calculation:`);
	console.log(`   Success: ${saltBalanceResult.success ? "Yes" : "No"}`);
	if (saltBalanceResult.success) {
		console.log(`   Balance Status: ${saltBalanceResult.balanceStatus}`);
		console.log(`   Net Balance: ${saltBalanceResult.netBalance} kg/ha`);
	}

	// Overall assessment
	const overallSuccess =
		successfulLeaching === leachingResults.length &&
		drainageResult.success &&
		saltBalanceResult.success;

	console.log(`\n🎯 Overall Assessment:`);
	console.log(`   Status: ${overallSuccess ? "✅ PASSED" : "❌ FAILED"}`);
	console.log(
		`   Phase 3 Week 10 Salt Management: ${
			overallSuccess ? "READY FOR PRODUCTION" : "NEEDS FIXES"
		}`
	);

	return overallSuccess;
}

/**
 * Main test execution
 */
async function main() {
	console.log("🧂 FlahaSoil Salt Management Test Suite - Phase 3 Week 10");
	console.log("===========================================================");

	try {
		// Step 1: Authentication
		const authSuccess = await testAuthentication();
		if (!authSuccess) {
			console.log("❌ Cannot proceed without authentication");
			return;
		}

		// Step 2: Create test soil analysis
		const soilSuccess = await createTestSoilAnalysis();
		if (!soilSuccess) {
			console.log("❌ Cannot proceed without soil analysis");
			return;
		}

		// Step 3: Test leaching calculations
		const leachingResults = await testLeachingCalculations();

		// Step 4: Test drainage assessment
		const drainageResult = await testDrainageAssessment();

		// Step 5: Test salt balance calculation
		const saltBalanceResult = await testSaltBalance();

		// Step 6: Generate summary
		const overallSuccess = generateTestSummary(
			leachingResults,
			drainageResult,
			saltBalanceResult
		);

		process.exit(overallSuccess ? 0 : 1);
	} catch (error) {
		console.error("❌ Test suite error:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run tests
main();
