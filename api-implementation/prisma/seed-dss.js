const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Crop data with BBCH stages and Kc coefficients based on FAO-56 and docs/advance/
const cropData = [
  {
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    type: "Vegetable",
    category: "C3",
    growthPeriodMin: 90,
    growthPeriodMax: 140,
    rootDepthMax: 1.5,
    climateZones: JSON.stringify(["temperate", "mediterranean", "arid"]),
    soilPreferences: JSON.stringify({
      "preferredTexture": ["loam", "sandy_loam"],
      "phRange": [6.0, 7.0],
      "drainageRequirement": "well_drained"
    }),
    bbchStages: [
      { stageCode: "00", stageName: "Dry seed", description: "Seed dormancy", typicalDaysFromSowing: 0, durationDays: 7, growthPeriod: "initial" },
      { stageCode: "10", stageName: "First leaves", description: "Cotyledon emergence", typicalDaysFromSowing: 7, durationDays: 14, growthPeriod: "initial" },
      { stageCode: "20", stageName: "Leaf development", description: "True leaves visible", typicalDaysFromSowing: 21, durationDays: 14, growthPeriod: "development" },
      { stageCode: "50", stageName: "Flower buds", description: "Flower buds visible", typicalDaysFromSowing: 35, durationDays: 21, growthPeriod: "development" },
      { stageCode: "60", stageName: "Flowering", description: "First flowers open", typicalDaysFromSowing: 56, durationDays: 28, growthPeriod: "mid" },
      { stageCode: "70", stageName: "Fruit development", description: "First fruits set", typicalDaysFromSowing: 84, durationDays: 35, growthPeriod: "mid" },
      { stageCode: "80", stageName: "Fruit ripening", description: "Fruits begin to ripen", typicalDaysFromSowing: 119, durationDays: 21, growthPeriod: "late" }
    ],
    kcPeriods: [
      { periodName: "Kc_ini", periodStartDays: 0, periodEndDays: 35, kcValue: 0.6, kcMin: 0.5, kcMax: 0.7, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_mid", periodStartDays: 36, periodEndDays: 90, kcValue: 1.15, kcMin: 1.0, kcMax: 1.3, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_end", periodStartDays: 91, periodEndDays: 140, kcValue: 0.8, kcMin: 0.7, kcMax: 0.9, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      // Arid climate adjustments
      { periodName: "Kc_ini", periodStartDays: 0, periodEndDays: 35, kcValue: 0.7, kcMin: 0.6, kcMax: 0.8, climateZone: "arid", irrigationMethod: "drip", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" },
      { periodName: "Kc_mid", periodStartDays: 36, periodEndDays: 90, kcValue: 1.05, kcMin: 0.9, kcMax: 1.2, climateZone: "arid", irrigationMethod: "drip", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" },
      { periodName: "Kc_end", periodStartDays: 91, periodEndDays: 140, kcValue: 0.7, kcMin: 0.6, kcMax: 0.8, climateZone: "arid", irrigationMethod: "drip", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" }
    ]
  },
  {
    name: "Wheat",
    scientificName: "Triticum aestivum",
    type: "Cereal",
    category: "C3",
    growthPeriodMin: 120,
    growthPeriodMax: 180,
    rootDepthMax: 1.8,
    climateZones: JSON.stringify(["temperate", "continental", "mediterranean"]),
    soilPreferences: JSON.stringify({
      "preferredTexture": ["loam", "clay_loam"],
      "phRange": [6.0, 7.5],
      "drainageRequirement": "moderate"
    }),
    bbchStages: [
      { stageCode: "00", stageName: "Dry seed", description: "Seed dormancy", typicalDaysFromSowing: 0, durationDays: 10, growthPeriod: "initial" },
      { stageCode: "10", stageName: "Germination", description: "Coleoptile emergence", typicalDaysFromSowing: 10, durationDays: 15, growthPeriod: "initial" },
      { stageCode: "20", stageName: "Tillering", description: "Main shoot and tillers", typicalDaysFromSowing: 25, durationDays: 30, growthPeriod: "development" },
      { stageCode: "30", stageName: "Stem elongation", description: "Pseudostem erection", typicalDaysFromSowing: 55, durationDays: 25, growthPeriod: "development" },
      { stageCode: "50", stageName: "Booting", description: "Boot swollen", typicalDaysFromSowing: 80, durationDays: 15, growthPeriod: "mid" },
      { stageCode: "60", stageName: "Flowering", description: "Anthesis", typicalDaysFromSowing: 95, durationDays: 10, growthPeriod: "mid" },
      { stageCode: "70", stageName: "Grain filling", description: "Milk development", typicalDaysFromSowing: 105, durationDays: 35, growthPeriod: "mid" },
      { stageCode: "90", stageName: "Ripening", description: "Hard dough", typicalDaysFromSowing: 140, durationDays: 20, growthPeriod: "late" }
    ],
    kcPeriods: [
      { periodName: "Kc_ini", periodStartDays: 0, periodEndDays: 25, kcValue: 0.4, kcMin: 0.3, kcMax: 0.5, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_mid", periodStartDays: 26, periodEndDays: 140, kcValue: 1.15, kcMin: 1.0, kcMax: 1.3, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_end", periodStartDays: 141, periodEndDays: 180, kcValue: 0.4, kcMin: 0.3, kcMax: 0.5, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" }
    ]
  },
  {
    name: "Maize",
    scientificName: "Zea mays",
    type: "Cereal",
    category: "C4",
    growthPeriodMin: 100,
    growthPeriodMax: 140,
    rootDepthMax: 2.0,
    climateZones: JSON.stringify(["temperate", "subtropical", "continental"]),
    soilPreferences: JSON.stringify({
      "preferredTexture": ["loam", "sandy_loam", "clay_loam"],
      "phRange": [6.0, 7.0],
      "drainageRequirement": "well_drained"
    }),
    bbchStages: [
      { stageCode: "00", stageName: "Dry seed", description: "Seed dormancy", typicalDaysFromSowing: 0, durationDays: 7, growthPeriod: "initial" },
      { stageCode: "10", stageName: "Germination", description: "Coleoptile emergence", typicalDaysFromSowing: 7, durationDays: 14, growthPeriod: "initial" },
      { stageCode: "20", stageName: "Leaf development", description: "2-3 leaves unfolded", typicalDaysFromSowing: 21, durationDays: 21, growthPeriod: "development" },
      { stageCode: "30", stageName: "Stem elongation", description: "6-8 leaves", typicalDaysFromSowing: 42, durationDays: 28, growthPeriod: "development" },
      { stageCode: "50", stageName: "Tasseling", description: "Tassel emergence", typicalDaysFromSowing: 70, durationDays: 14, growthPeriod: "mid" },
      { stageCode: "60", stageName: "Flowering", description: "Silking", typicalDaysFromSowing: 84, durationDays: 7, growthPeriod: "mid" },
      { stageCode: "70", stageName: "Grain filling", description: "Milk stage", typicalDaysFromSowing: 91, durationDays: 28, growthPeriod: "mid" },
      { stageCode: "90", stageName: "Ripening", description: "Physiological maturity", typicalDaysFromSowing: 119, durationDays: 21, growthPeriod: "late" }
    ],
    kcPeriods: [
      { periodName: "Kc_ini", periodStartDays: 0, periodEndDays: 21, kcValue: 0.3, kcMin: 0.2, kcMax: 0.4, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_mid", periodStartDays: 22, periodEndDays: 119, kcValue: 1.2, kcMin: 1.0, kcMax: 1.4, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_end", periodStartDays: 120, periodEndDays: 140, kcValue: 0.6, kcMin: 0.5, kcMax: 0.7, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" }
    ]
  }
];

async function seedDSSData() {
  console.log('🌱 Starting DSS database seeding...');

  try {
    // Clear existing DSS data
    console.log('🧹 Clearing existing DSS data...');
    await prisma.dSSCalculation.deleteMany();
    await prisma.kcPeriod.deleteMany();
    await prisma.bBCHStage.deleteMany();
    await prisma.crop.deleteMany();

    // Seed crops with BBCH stages and Kc periods
    for (const cropInfo of cropData) {
      console.log(`📊 Seeding crop: ${cropInfo.name}`);
      
      const crop = await prisma.crop.create({
        data: {
          name: cropInfo.name,
          scientificName: cropInfo.scientificName,
          type: cropInfo.type,
          category: cropInfo.category,
          growthPeriodMin: cropInfo.growthPeriodMin,
          growthPeriodMax: cropInfo.growthPeriodMax,
          rootDepthMax: cropInfo.rootDepthMax,
          climateZones: cropInfo.climateZones,
          soilPreferences: cropInfo.soilPreferences
        }
      });

      // Seed BBCH stages
      for (const stage of cropInfo.bbchStages) {
        await prisma.bBCHStage.create({
          data: {
            cropId: crop.id,
            stageCode: stage.stageCode,
            stageName: stage.stageName,
            description: stage.description,
            typicalDaysFromSowing: stage.typicalDaysFromSowing,
            durationDays: stage.durationDays,
            growthPeriod: stage.growthPeriod
          }
        });
      }

      // Seed Kc periods
      for (const kcPeriod of cropInfo.kcPeriods) {
        await prisma.kcPeriod.create({
          data: {
            cropId: crop.id,
            periodName: kcPeriod.periodName,
            periodStartDays: kcPeriod.periodStartDays,
            periodEndDays: kcPeriod.periodEndDays,
            kcValue: kcPeriod.kcValue,
            kcMin: kcPeriod.kcMin,
            kcMax: kcPeriod.kcMax,
            climateZone: kcPeriod.climateZone,
            irrigationMethod: kcPeriod.irrigationMethod,
            confidenceLevel: kcPeriod.confidenceLevel,
            referenceSource: kcPeriod.referenceSource
          }
        });
      }

      console.log(`✅ Completed seeding: ${cropInfo.name} (${cropInfo.bbchStages.length} stages, ${cropInfo.kcPeriods.length} Kc periods)`);
    }

    console.log('🎯 DSS database seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Crops: ${cropData.length}`);
    console.log(`   - BBCH Stages: ${cropData.reduce((sum, crop) => sum + crop.bbchStages.length, 0)}`);
    console.log(`   - Kc Periods: ${cropData.reduce((sum, crop) => sum + crop.kcPeriods.length, 0)}`);

  } catch (error) {
    console.error('❌ Error seeding DSS data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedDSSData()
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDSSData };
