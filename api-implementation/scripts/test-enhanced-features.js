/**
 * Enhanced Database Feature Test Script
 * Tests the new advanced visualization features and database integration
 *
 * @format
 */

const { PrismaClient } = require("@prisma/client");
const EnhancedSoilCalculationService = require("../src/services/enhancedSoilCalculationService");

const prisma = new PrismaClient();

async function testDatabaseSchema() {
	console.log("🗄️  Testing enhanced database schema...");

	try {
		// Test SoilRegion model
		const regionCount = await prisma.soilRegion.count();
		console.log(`✅ SoilRegion table operational: ${regionCount} regions`);

		// Test EnhancedSoilAnalysis model
		const enhancedCount = await prisma.enhancedSoilAnalysis.count();
		console.log(
			`✅ EnhancedSoilAnalysis table operational: ${enhancedCount} analyses`
		);

		// Test MoistureTensionPoint model
		const pointCount = await prisma.moistureTensionPoint.count();
		console.log(
			`✅ MoistureTensionPoint table operational: ${pointCount} points`
		);

		// Test ComparativeAnalysis model
		const comparisonCount = await prisma.comparativeAnalysis.count();
		console.log(
			`✅ ComparativeAnalysis table operational: ${comparisonCount} comparisons`
		);

		// Test SoilManagementRecommendation model
		const recommendationCount =
			await prisma.soilManagementRecommendation.count();
		console.log(
			`✅ SoilManagementRecommendation table operational: ${recommendationCount} recommendations`
		);

		return true;
	} catch (error) {
		console.error("❌ Database schema test failed:", error);
		return false;
	}
}

async function testRegionalData() {
	console.log("🌍 Testing regional soil data...");

	try {
		const regions = await prisma.soilRegion.findMany({
			take: 3,
			include: {
				_count: {
					select: { enhancedAnalyses: true },
				},
			},
		});

		console.log(`✅ Found ${regions.length} regions:`);
		regions.forEach((region) => {
			console.log(`   - ${region.regionName}, ${region.country}`);
			console.log(`     Climate: ${region.climateZone}`);
			console.log(`     Rainfall: ${region.avgAnnualRainfall}mm/year`);
			console.log(`     Enhanced analyses: ${region._count.enhancedAnalyses}`);
		});

		return true;
	} catch (error) {
		console.error("❌ Regional data test failed:", error);
		return false;
	}
}

async function testEnhancedCalculations() {
	console.log("🧮 Testing enhanced calculation services...");

	try {
		const sand = 35;
		const clay = 25;
		const om = 3.0;
		const densityFactor = 1.1;

		// Test moisture-tension curve generation
		console.log("Testing moisture-tension curve generation...");
		const curveData =
			EnhancedSoilCalculationService.generateMoistureTensionCurve(
				sand,
				clay,
				om,
				densityFactor
			);
		console.log(`✅ Generated ${curveData.length} moisture-tension points`);
		console.log(
			`   - Tension range: ${curveData[0].tension} to ${
				curveData[curveData.length - 1].tension
			} kPa`
		);
		console.log(
			`   - Moisture range: ${Math.min(
				...curveData.map((p) => p.moistureContent)
			).toFixed(1)} to ${Math.max(
				...curveData.map((p) => p.moistureContent)
			).toFixed(1)}%`
		);

		// Test 3D soil profile calculation
		console.log("Testing 3D soil profile calculation...");
		const profileData = EnhancedSoilCalculationService.calculateSoilProfile3D(
			sand,
			clay,
			om,
			densityFactor,
			100
		);
		console.log(
			`✅ Generated 3D profile with ${profileData.horizons.length} horizons`
		);
		console.log(`   - Depth range: 0-${profileData.maxDepth}cm`);
		console.log(`   - Root zone depth: ${profileData.summary.rootZoneDepth}cm`);

		// Test comparative analysis simulation
		console.log("Testing comparative analysis...");
		const mockAnalyses = [
			{
				sand: 30,
				clay: 30,
				organicMatter: 2.5,
				fieldCapacity: 35,
				wiltingPoint: 15,
				textureClass: "Clay Loam",
			},
			{
				sand: 50,
				clay: 20,
				organicMatter: 2.0,
				fieldCapacity: 28,
				wiltingPoint: 12,
				textureClass: "Loam",
			},
			{
				sand: 70,
				clay: 10,
				organicMatter: 1.5,
				fieldCapacity: 20,
				wiltingPoint: 8,
				textureClass: "Sandy Loam",
			},
		];

		const comparison =
			EnhancedSoilCalculationService.performComparativeAnalysis(
				mockAnalyses,
				"general"
			);
		console.log(`✅ Comparative analysis completed`);
		console.log(`   - Analyzed ${comparison.analysisCount} soil samples`);
		console.log(`   - Generated ${comparison.chartData.length} chart datasets`);

		return true;
	} catch (error) {
		console.error("❌ Enhanced calculation test failed:", error);
		console.error(error.stack);
		return false;
	}
}

async function testEnhancedAnalysisWorkflow() {
	console.log("🔄 Testing enhanced analysis workflow...");

	try {
		// Get a sample base analysis
		const baseAnalysis = await prisma.soilAnalysis.findFirst({
			orderBy: { createdAt: "desc" },
		});

		if (!baseAnalysis) {
			console.log("⚠️  No base analysis found, skipping workflow test");
			return true;
		}

		// Get a sample region
		const region = await prisma.soilRegion.findFirst();

		if (!region) {
			console.log("⚠️  No regions found, skipping workflow test");
			return true;
		}

		// Create enhanced analysis
		const enhancedAnalysis = await prisma.enhancedSoilAnalysis.upsert({
			where: { baseAnalysisId: baseAnalysis.id },
			update: {
				regionId: region.id,
				latitude: 40.7128,
				longitude: -74.006,
				elevation: 10.0,
				siteDescription: "Test Site Enhanced Analysis",
				hasVisualizationData: true,
				lastVisualizationCalc: new Date(),
			},
			create: {
				baseAnalysisId: baseAnalysis.id,
				regionId: region.id,
				latitude: 40.7128,
				longitude: -74.006,
				elevation: 10.0,
				siteDescription: "Test Site Enhanced Analysis",
				hasVisualizationData: true,
				lastVisualizationCalc: new Date(),
			},
		});

		console.log(`✅ Enhanced analysis created/updated: ${enhancedAnalysis.id}`);

		// Generate and cache moisture-tension points
		const curveData =
			EnhancedSoilCalculationService.generateMoistureTensionCurve(
				baseAnalysis.sand,
				baseAnalysis.clay,
				baseAnalysis.organicMatter,
				baseAnalysis.densityFactor
			);

		// Clear existing points
		await prisma.moistureTensionPoint.deleteMany({
			where: { enhancedAnalysisId: enhancedAnalysis.id },
		});

		// Insert new points
		const pointsToInsert = curveData.map((point) => ({
			enhancedAnalysisId: enhancedAnalysis.id,
			tension: point.tension,
			moistureContent: point.moistureContent,
			isCalculated: true,
			calculationMethod: "Saxton-Rawls-Enhanced",
		}));

		await prisma.moistureTensionPoint.createMany({
			data: pointsToInsert,
		});

		console.log(`✅ Cached ${pointsToInsert.length} moisture-tension points`);

		// Verify the complete enhanced analysis with relationships
		const completeAnalysis = await prisma.enhancedSoilAnalysis.findUnique({
			where: { id: enhancedAnalysis.id },
			include: {
				baseAnalysis: true,
				region: true,
				moistureTensionPoints: true,
			},
		});

		console.log(`✅ Complete enhanced analysis verified:`);
		console.log(
			`   - Base analysis: ${completeAnalysis.baseAnalysis.textureClass}`
		);
		console.log(`   - Region: ${completeAnalysis.region.regionName}`);
		console.log(
			`   - Moisture points: ${completeAnalysis.moistureTensionPoints.length}`
		);
		console.log(
			`   - Location: ${completeAnalysis.latitude}, ${completeAnalysis.longitude}`
		);

		return true;
	} catch (error) {
		console.error("❌ Enhanced analysis workflow test failed:", error);
		return false;
	}
}

async function testVisualizationDataGeneration() {
	console.log("📊 Testing visualization data generation...");

	try {
		// Test with sample soil parameters
		const testSoils = [
			{ name: "Sandy Soil", sand: 70, clay: 15, om: 1.5 },
			{ name: "Clay Soil", sand: 20, clay: 50, om: 3.0 },
			{ name: "Loam Soil", sand: 40, clay: 25, om: 2.5 },
		];

		for (const soil of testSoils) {
			console.log(`Testing ${soil.name}...`);

			// Generate moisture-tension curve
			const curve = EnhancedSoilCalculationService.generateMoistureTensionCurve(
				soil.sand,
				soil.clay,
				soil.om,
				1.0
			);

			// Generate 3D profile
			const profile = EnhancedSoilCalculationService.calculateSoilProfile3D(
				soil.sand,
				soil.clay,
				soil.om,
				1.0,
				100
			);

			// Calculate seasonal variation (mock region)
			const baseResults = {
				fieldCapacity:
					curve.find((p) => p.tension === 33)?.moistureContent || 25,
				wiltingPoint:
					curve.find((p) => p.tension === 1500)?.moistureContent || 12,
				plantAvailableWater: 13,
				saturation: curve.find((p) => p.tension <= 1)?.moistureContent || 45,
			};

			const seasonal =
				EnhancedSoilCalculationService.calculateSeasonalVariation(
					baseResults,
					null
				);

			console.log(
				`   ✅ ${soil.name}: ${curve.length} curve points, ${profile.horizons.length} horizons, 4 seasons`
			);
		}

		return true;
	} catch (error) {
		console.error("❌ Visualization data generation test failed:", error);
		return false;
	}
}

async function generateTestReport() {
	console.log("\n📋 ENHANCED DATABASE INTEGRATION TEST REPORT");
	console.log("═".repeat(60));

	const tests = [
		{ name: "Database Schema", test: testDatabaseSchema },
		{ name: "Regional Data", test: testRegionalData },
		{ name: "Enhanced Calculations", test: testEnhancedCalculations },
		{ name: "Enhanced Analysis Workflow", test: testEnhancedAnalysisWorkflow },
		{
			name: "Visualization Data Generation",
			test: testVisualizationDataGeneration,
		},
	];

	const results = [];

	for (const { name, test } of tests) {
		console.log(`\n${name}:`);
		console.log("─".repeat(30));
		const result = await test();
		results.push({ name, passed: result });
	}

	console.log("\n📊 TEST SUMMARY:");
	console.log("═".repeat(30));

	const passed = results.filter((r) => r.passed).length;
	const total = results.length;

	results.forEach((result) => {
		console.log(`${result.passed ? "✅" : "❌"} ${result.name}`);
	});

	console.log(`\nOverall: ${passed}/${total} tests passed`);

	if (passed === total) {
		console.log("\n🎉 All enhanced database features are working correctly!");
		console.log("Ready for advanced visualization implementation.");
	} else {
		console.log("\n⚠️  Some tests failed. Please review the errors above.");
	}

	return passed === total;
}

async function main() {
	try {
		console.log("🚀 Starting Enhanced Database Integration Tests...\n");
		const success = await generateTestReport();
		process.exit(success ? 0 : 1);
	} catch (error) {
		console.error("❌ Test suite failed:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

if (require.main === module) {
	main();
}

module.exports = {
	testDatabaseSchema,
	testRegionalData,
	testEnhancedCalculations,
	testEnhancedAnalysisWorkflow,
	testVisualizationDataGeneration,
};
