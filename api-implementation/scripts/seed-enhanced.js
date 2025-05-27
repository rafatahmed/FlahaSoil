/**
 * Enhanced Database Seeding Script
 * Seeds regional soil data and sample enhanced analyses
 *
 * @format
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedRegionalData() {
	console.log("🌍 Seeding regional soil data...");

	const regions = [
		{
			regionName: "US Midwest",
			country: "United States",
			state: "Iowa",
			climateZone: "Humid Continental",
			avgAnnualRainfall: 850.0,
			avgAnnualTemperature: 10.5,
			frostFreeDays: 160,
			typicalSandRange: "20-35%",
			typicalClayRange: "25-40%",
			typicalOMRange: "3-6%",
			seasonalFactors: JSON.stringify({
				spring: { moistureMultiplier: 1.2, temperatureFactor: 0.8 },
				summer: { moistureMultiplier: 0.9, temperatureFactor: 1.3 },
				fall: { moistureMultiplier: 1.1, temperatureFactor: 0.9 },
				winter: { moistureMultiplier: 1.4, temperatureFactor: 0.3 },
			}),
			climateAdjustments: JSON.stringify({
				freezeThawCycles: 25,
				droughtProbability: 0.15,
				floodRisk: 0.08,
			}),
		},
		{
			regionName: "California Central Valley",
			country: "United States",
			state: "California",
			climateZone: "Mediterranean",
			avgAnnualRainfall: 300.0,
			avgAnnualTemperature: 18.5,
			frostFreeDays: 280,
			typicalSandRange: "15-30%",
			typicalClayRange: "15-35%",
			typicalOMRange: "1-3%",
			seasonalFactors: JSON.stringify({
				spring: { moistureMultiplier: 1.1, temperatureFactor: 1.0 },
				summer: { moistureMultiplier: 0.6, temperatureFactor: 1.4 },
				fall: { moistureMultiplier: 0.8, temperatureFactor: 1.2 },
				winter: { moistureMultiplier: 1.3, temperatureFactor: 0.7 },
			}),
			climateAdjustments: JSON.stringify({
				freezeThawCycles: 2,
				droughtProbability: 0.35,
				floodRisk: 0.05,
			}),
		},
		{
			regionName: "Texas High Plains",
			country: "United States",
			state: "Texas",
			climateZone: "Semi-Arid",
			avgAnnualRainfall: 450.0,
			avgAnnualTemperature: 14.5,
			frostFreeDays: 190,
			typicalSandRange: "35-55%",
			typicalClayRange: "10-25%",
			typicalOMRange: "1-2.5%",
			seasonalFactors: JSON.stringify({
				spring: { moistureMultiplier: 1.0, temperatureFactor: 1.1 },
				summer: { moistureMultiplier: 0.7, temperatureFactor: 1.5 },
				fall: { moistureMultiplier: 0.9, temperatureFactor: 1.2 },
				winter: { moistureMultiplier: 1.1, temperatureFactor: 0.6 },
			}),
			climateAdjustments: JSON.stringify({
				freezeThawCycles: 15,
				droughtProbability: 0.25,
				floodRisk: 0.12,
			}),
		},
		{
			regionName: "European Lowlands",
			country: "Netherlands",
			state: "North Holland",
			climateZone: "Oceanic",
			avgAnnualRainfall: 750.0,
			avgAnnualTemperature: 10.0,
			frostFreeDays: 180,
			typicalSandRange: "10-25%",
			typicalClayRange: "35-55%",
			typicalOMRange: "4-8%",
			seasonalFactors: JSON.stringify({
				spring: { moistureMultiplier: 1.1, temperatureFactor: 0.9 },
				summer: { moistureMultiplier: 1.0, temperatureFactor: 1.1 },
				fall: { moistureMultiplier: 1.2, temperatureFactor: 0.8 },
				winter: { moistureMultiplier: 1.3, temperatureFactor: 0.5 },
			}),
			climateAdjustments: JSON.stringify({
				freezeThawCycles: 30,
				droughtProbability: 0.08,
				floodRisk: 0.2,
			}),
		},
		{
			regionName: "Australian Wheat Belt",
			country: "Australia",
			state: "Western Australia",
			climateZone: "Mediterranean",
			avgAnnualRainfall: 350.0,
			avgAnnualTemperature: 16.5,
			frostFreeDays: 220,
			typicalSandRange: "60-80%",
			typicalClayRange: "5-15%",
			typicalOMRange: "0.5-2%",
			seasonalFactors: JSON.stringify({
				spring: { moistureMultiplier: 1.2, temperatureFactor: 1.0 },
				summer: { moistureMultiplier: 0.5, temperatureFactor: 1.6 },
				fall: { moistureMultiplier: 0.7, temperatureFactor: 1.3 },
				winter: { moistureMultiplier: 1.4, temperatureFactor: 0.8 },
			}),
			climateAdjustments: JSON.stringify({
				freezeThawCycles: 0,
				droughtProbability: 0.4,
				floodRisk: 0.03,
			}),
		},
	];
	for (const region of regions) {
		await prisma.soilRegion.upsert({
			where: {
				regionName: region.regionName,
			},
			update: region,
			create: region,
		});
	}

	console.log(`✅ Seeded ${regions.length} regional soil datasets`);
}

async function seedSampleEnhancedAnalyses() {
	console.log("🧪 Creating sample enhanced soil analyses...");

	// Get existing soil analyses to enhance
	const existingAnalyses = await prisma.soilAnalysis.findMany({
		take: 3,
		orderBy: { createdAt: "desc" },
	});

	if (existingAnalyses.length === 0) {
		console.log("ℹ️  No existing analyses found to enhance");
		return;
	}

	const regions = await prisma.soilRegion.findMany();

	for (let i = 0; i < Math.min(existingAnalyses.length, 3); i++) {
		const analysis = existingAnalyses[i];
		const region = regions[i % regions.length];

		const enhancedData = {
			baseAnalysisId: analysis.id,
			regionId: region.id,
			latitude: 40.7 + (Math.random() - 0.5) * 10, // Random coordinates near typical farming areas
			longitude: -95.5 + (Math.random() - 0.5) * 20,
			elevation: 200 + Math.random() * 300,
			siteDescription: `Sample Field ${String.fromCharCode(65 + i)}`,
			bulkDensity: 1.2 + Math.random() * 0.4,
			totalPorosity: 45 + Math.random() * 15,
			pH: 6.0 + Math.random() * 2,
			hasVisualizationData: false,
		};

		await prisma.enhancedSoilAnalysis.upsert({
			where: { baseAnalysisId: analysis.id },
			update: enhancedData,
			create: enhancedData,
		});
	}

	console.log(
		`✅ Created ${Math.min(existingAnalyses.length, 3)} enhanced analyses`
	);
}

async function main() {
	try {
		console.log("🚀 Starting enhanced database seeding...");

		await seedRegionalData();
		await seedSampleEnhancedAnalyses();

		console.log("✅ Enhanced seeding completed successfully!");
	} catch (error) {
		console.error("❌ Error during enhanced seeding:", error);
		throw error;
	}
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
