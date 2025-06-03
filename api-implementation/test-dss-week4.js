/**
 * FlahaSoil DSS Week 4 Testing Script
 * Tests Week 4 enhancements: Basic Features & Testing
 *
 * Week 4 Features:
 * - System Recommendations (drip/sprinkler/surface irrigation)
 * - Economic Analysis Basic (ROI calculator, payback period)
 * - Implementation Planning
 * - Performance Metrics
 * - Comprehensive Testing & Validation
 *
 * @format
 */

const DSSCalculationService = require("./src/services/dssCalculationService");

// Test configuration
const testConfig = {
	timeout: 10000,
	precision: 2, // Decimal places for comparisons
};

// Test results tracking
let testResults = {
	passed: 0,
	failed: 0,
	total: 0,
	details: [],
};

function logTest(testName, passed, details = "") {
	testResults.total++;
	if (passed) {
		testResults.passed++;
		console.log(`✅ ${testName}`);
	} else {
		testResults.failed++;
		console.log(`❌ ${testName} - ${details}`);
	}
	testResults.details.push({ testName, passed, details });
}

function roundToDecimal(value, decimals) {
	return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

async function testWeek4SystemRecommendations() {
	console.log("🎯 Testing Week 4 System Recommendations...");

	const dssService = new DSSCalculationService();

	// Test data for different scenarios
	const testScenarios = [
		{
			name: "Sandy Soil - Small Field",
			soilData: {
				sand: 70,
				clay: 15,
				silt: 15,
				textureClass: "Sandy Loam",
				saturatedConductivity: 30,
				fieldCapacity: 15,
				wiltingPoint: 5,
			},
			fieldConfig: { area: 2, slope: 1 },
			expectedSystem: "drip",
		},
		{
			name: "Clay Soil - Large Field",
			soilData: {
				sand: 20,
				clay: 50,
				silt: 30,
				textureClass: "Clay",
				saturatedConductivity: 3,
				fieldCapacity: 35,
				wiltingPoint: 18,
			},
			fieldConfig: { area: 25, slope: 0.5 },
			expectedSystem: "surface",
		},
		{
			name: "Loamy Soil - Medium Field",
			soilData: {
				sand: 40,
				clay: 30,
				silt: 30,
				textureClass: "Loam",
				saturatedConductivity: 15,
				fieldCapacity: 25,
				wiltingPoint: 12,
			},
			fieldConfig: { area: 8, slope: 2 },
			expectedSystem: "sprinkler",
		},
	];

	for (const scenario of testScenarios) {
		try {
			// Mock irrigation results
			const irrigationResults = {
				irrigationDepth: 25,
				frequency: 3,
				maxApplicationRate: scenario.soilData.saturatedConductivity,
			};

			// Mock compatibility results
			const compatibilityResults = {
				adjustmentFactor: 1.0,
				compatibilityScore: 0.85,
			};

			const systemRecommendations = dssService.generateSystemRecommendations(
				scenario.soilData,
				irrigationResults,
				scenario.fieldConfig,
				compatibilityResults
			);

			// Test system analysis exists for all three systems
			logTest(
				`${scenario.name}: System analysis includes all three systems`,
				systemRecommendations.systemAnalysis.drip &&
					systemRecommendations.systemAnalysis.sprinkler &&
					systemRecommendations.systemAnalysis.surface
			);

			// Test system comparison
			logTest(
				`${scenario.name}: System comparison generated`,
				systemRecommendations.systemComparison &&
					systemRecommendations.systemComparison.summary
			);

			// Test implementation plan
			logTest(
				`${scenario.name}: Implementation plan generated`,
				systemRecommendations.implementationPlan &&
					systemRecommendations.implementationPlan.phases &&
					systemRecommendations.implementationPlan.phases.length === 4
			);

			// Test maintenance schedule
			logTest(
				`${scenario.name}: Maintenance schedule generated`,
				systemRecommendations.maintenanceSchedule &&
					systemRecommendations.maintenanceSchedule.daily
			);

			// Test performance metrics
			logTest(
				`${scenario.name}: Performance metrics calculated`,
				systemRecommendations.performanceMetrics &&
					systemRecommendations.performanceMetrics.waterUseEfficiency > 0
			);
		} catch (error) {
			logTest(`${scenario.name}: System recommendations`, false, error.message);
		}
	}
}

async function testWeek4EconomicAnalysis() {
	console.log("\n💰 Testing Week 4 Economic Analysis...");

	const dssService = new DSSCalculationService();

	// Test economic analysis with different system types
	const economicTestCases = [
		{
			name: "Drip System Economics",
			systemDetails: {
				type: "drip",
				efficiency: 0.9,
				totalCost: 8000,
				costPerHectare: 4000,
			},
			area: 2,
		},
		{
			name: "Sprinkler System Economics",
			systemDetails: {
				type: "sprinkler",
				efficiency: 0.75,
				totalCost: 12000,
				costPerHectare: 3000,
			},
			area: 4,
		},
		{
			name: "Surface System Economics",
			systemDetails: {
				type: "surface",
				efficiency: 0.6,
				totalCost: 4000,
				costPerHectare: 1000,
			},
			area: 4,
		},
	];

	for (const testCase of economicTestCases) {
		try {
			// Test basic ROI calculation
			const roiCalculation = dssService.calculateBasicROI(
				testCase.systemDetails,
				testCase.area
			);

			logTest(
				`${testCase.name}: ROI calculation completed`,
				roiCalculation.totalInvestment === testCase.systemDetails.totalCost
			);

			logTest(
				`${testCase.name}: Annual savings calculated`,
				roiCalculation.annualSavings > 0
			);

			logTest(
				`${testCase.name}: ROI breakdown includes all components`,
				roiCalculation.breakdownPercentages.water !== undefined &&
					roiCalculation.breakdownPercentages.yield !== undefined &&
					roiCalculation.breakdownPercentages.labor !== undefined
			);

			// Test payback period calculation
			const paybackAnalysis = dssService.calculatePaybackPeriod(
				testCase.systemDetails,
				roiCalculation
			);

			logTest(
				`${testCase.name}: Payback period calculated`,
				paybackAnalysis.paybackPeriod > 0
			);

			logTest(
				`${testCase.name}: Cash flow projection generated`,
				paybackAnalysis.cashFlowProjection &&
					paybackAnalysis.cashFlowProjection.length === 10
			);

			// Test water cost savings
			const irrigationResults = { irrigationDepth: 25, frequency: 3 };
			const waterSavings = dssService.calculateWaterCostSavings(
				testCase.systemDetails,
				irrigationResults,
				testCase.area
			);

			logTest(
				`${testCase.name}: Water savings calculated`,
				waterSavings.annualWaterSaved >= 0
			);

			logTest(
				`${testCase.name}: 10-year projection generated`,
				waterSavings.yearlyProjection &&
					waterSavings.yearlyProjection.length === 10
			);
		} catch (error) {
			logTest(`${testCase.name}: Economic analysis`, false, error.message);
		}
	}
}

async function testWeek4Integration() {
	console.log("\n🔗 Testing Week 4 Integration...");

	const dssService = new DSSCalculationService();

	try {
		// Test full DSS calculation with Week 4 features
		const testData = {
			soilData: {
				sand: 45,
				clay: 25,
				silt: 30,
				textureClass: "Loam",
				saturatedConductivity: 12,
				fieldCapacity: 22,
				wiltingPoint: 10,
			},
			cropData: {
				id: "tomato",
				name: "Tomato",
				kcPeriods: [
					{ periodName: "initial", kcValue: 0.6 },
					{ periodName: "development", kcValue: 1.15 },
					{ periodName: "mid-season", kcValue: 1.15 },
					{ periodName: "late-season", kcValue: 0.8 },
				],
			},
			environmentalData: {
				et0: 6.5,
				climateZone: "temperate",
				irrigationMethod: "drip",
				growthStage: "mid-season",
				temperature: 28,
				windSpeed: 3,
				relativeHumidity: 45,
			},
			fieldConfig: {
				area: 5,
				slope: 1.5,
			},
		};

		const results = await dssService.calculateIrrigationRecommendations(
			testData
		);

		// Test Week 4 enhanced features are included
		logTest(
			"Integration: Enhanced system recommendations included",
			results.systemRecommendationsEnhanced !== undefined
		);

		logTest(
			"Integration: System analysis included",
			results.systemAnalysis !== undefined
		);

		logTest(
			"Integration: System comparison included",
			results.systemComparison !== undefined
		);

		logTest(
			"Integration: Implementation plan included",
			results.implementationPlan !== undefined
		);

		logTest(
			"Integration: Enhanced economic analysis included",
			results.economicAnalysisBasic !== undefined
		);

		logTest(
			"Integration: ROI calculation included",
			results.roiCalculation !== undefined
		);

		logTest(
			"Integration: Payback analysis included",
			results.paybackAnalysis !== undefined
		);

		logTest(
			"Integration: Water savings analysis included",
			results.waterSavingsAnalysis !== undefined
		);

		logTest(
			"Integration: Performance metrics included",
			results.performanceMetrics !== undefined
		);

		// Test data consistency
		logTest(
			"Integration: Economic data consistency",
			results.economicAnalysisBasic.totalInvestment ===
				results.roiCalculation.totalInvestment
		);
	} catch (error) {
		logTest(
			"Integration: Full DSS calculation with Week 4 features",
			false,
			error.message
		);
	}
}

async function generateWeek4TestReport() {
	console.log("\n📊 WEEK 4 TEST RESULTS SUMMARY");
	console.log("=====================================");
	console.log(`Total Tests: ${testResults.total}`);
	console.log(`Passed: ${testResults.passed} ✅`);
	console.log(`Failed: ${testResults.failed} ❌`);
	console.log(
		`Success Rate: ${Math.round(
			(testResults.passed / testResults.total) * 100
		)}%`
	);

	if (testResults.failed > 0) {
		console.log("\n❌ Failed Tests:");
		testResults.details
			.filter((test) => !test.passed)
			.forEach((test) => {
				console.log(`   - ${test.testName}: ${test.details}`);
			});
	}

	console.log("\n🎯 Week 4 Status:");
	const criticalTests = [
		"System analysis includes all three systems",
		"ROI calculation completed",
		"Enhanced system recommendations included",
		"Enhanced economic analysis included",
	];

	const criticalPassed = criticalTests.every(
		(testName) =>
			testResults.details.find((test) =>
				test.testName.includes(testName.split(" ")[0])
			)?.passed
	);

	if (criticalPassed && testResults.passed >= testResults.total * 0.9) {
		console.log("✅ WEEK 4 OBJECTIVES COMPLETED SUCCESSFULLY!");
		console.log("   - System Recommendations (drip/sprinkler/surface) ✅");
		console.log("   - Economic Analysis Basic (ROI, payback period) ✅");
		console.log("   - Implementation Planning ✅");
		console.log("   - Performance Metrics ✅");
		console.log("   - Integration Testing ✅");
		console.log("\n🎉 PHASE 1 FOUNDATION COMPLETED!");
		console.log("   Ready to proceed to Phase 2: Intelligence");
	} else {
		console.log("⚠️  WEEK 4 OBJECTIVES PARTIALLY COMPLETED");
		console.log(
			"   Some critical tests failed. Review and fix before proceeding."
		);
	}
}

// Main test execution
async function runWeek4Tests() {
	console.log("🎯 FlahaSoil DSS Week 4 - Basic Features & Testing");
	console.log("==================================================\n");

	await testWeek4SystemRecommendations();
	await testWeek4EconomicAnalysis();
	await testWeek4Integration();
	await generateWeek4TestReport();
}

// Run tests if called directly
if (require.main === module) {
	runWeek4Tests().catch(console.error);
}

module.exports = { runWeek4Tests, testResults };
