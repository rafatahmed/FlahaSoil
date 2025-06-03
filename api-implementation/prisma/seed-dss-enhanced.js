/**
 * Enhanced DSS Crop Database Seeding - Week 6 Implementation
 * Comprehensive 13-crop database with BBCH stages and Kc coefficients
 * 
 * Features:
 * - 13 major crops for GCC/MENA region
 * - Complete BBCH growth stage system
 * - Climate-specific Kc coefficients
 * - Irrigation method adjustments
 * - Scientific accuracy based on FAO-56
 * 
 * @format
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Enhanced crop data with 13 major crops for GCC/MENA region
const enhancedCropData = [
  // 1. Tomato (Enhanced)
  {
    name: "Tomato",
    scientificName: "Solanum lycopersicum",
    type: "Vegetable",
    category: "C3",
    growthPeriodMin: 90,
    growthPeriodMax: 140,
    rootDepthMax: 1.5,
    climateZones: JSON.stringify(["temperate", "mediterranean", "arid", "subtropical"]),
    soilPreferences: JSON.stringify({
      "preferredTexture": ["loam", "sandy_loam"],
      "phRange": [6.0, 7.0],
      "drainageRequirement": "well_drained",
      "salinity_tolerance": "moderate"
    }),
    bbchStages: [
      { stageCode: "00", stageName: "Dry seed", description: "Seed dormancy", typicalDaysFromSowing: 0, durationDays: 7, growthPeriod: "initial" },
      { stageCode: "09", stageName: "Emergence", description: "Cotyledon breakthrough", typicalDaysFromSowing: 7, durationDays: 7, growthPeriod: "initial" },
      { stageCode: "10", stageName: "First leaves", description: "Cotyledon fully unfolded", typicalDaysFromSowing: 14, durationDays: 7, growthPeriod: "initial" },
      { stageCode: "12", stageName: "2 true leaves", description: "2 true leaves unfolded", typicalDaysFromSowing: 21, durationDays: 7, growthPeriod: "development" },
      { stageCode: "16", stageName: "6 true leaves", description: "6 true leaves unfolded", typicalDaysFromSowing: 28, durationDays: 7, growthPeriod: "development" },
      { stageCode: "50", stageName: "Flower buds", description: "First flower buds visible", typicalDaysFromSowing: 35, durationDays: 14, growthPeriod: "development" },
      { stageCode: "60", stageName: "First flowering", description: "First flowers open", typicalDaysFromSowing: 49, durationDays: 21, growthPeriod: "mid" },
      { stageCode: "70", stageName: "First fruit set", description: "First fruits set", typicalDaysFromSowing: 70, durationDays: 21, growthPeriod: "mid" },
      { stageCode: "81", stageName: "Beginning ripening", description: "10% of fruits ripe", typicalDaysFromSowing: 91, durationDays: 28, growthPeriod: "late" },
      { stageCode: "89", stageName: "Full ripening", description: "Harvest maturity", typicalDaysFromSowing: 119, durationDays: 21, growthPeriod: "late" }
    ],
    kcPeriods: [
      // Temperate climate
      { periodName: "Kc_ini", periodStartDays: 0, periodEndDays: 35, kcValue: 0.6, kcMin: 0.5, kcMax: 0.7, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_mid", periodStartDays: 36, periodEndDays: 90, kcValue: 1.15, kcMin: 1.0, kcMax: 1.3, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_end", periodStartDays: 91, periodEndDays: 140, kcValue: 0.8, kcMin: 0.7, kcMax: 0.9, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      // Arid climate (GCC region)
      { periodName: "Kc_ini", periodStartDays: 0, periodEndDays: 35, kcValue: 0.7, kcMin: 0.6, kcMax: 0.8, climateZone: "arid", irrigationMethod: "drip", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" },
      { periodName: "Kc_mid", periodStartDays: 36, periodEndDays: 90, kcValue: 1.05, kcMin: 0.9, kcMax: 1.2, climateZone: "arid", irrigationMethod: "drip", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" },
      { periodName: "Kc_end", periodStartDays: 91, periodEndDays: 140, kcValue: 0.7, kcMin: 0.6, kcMax: 0.8, climateZone: "arid", irrigationMethod: "drip", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" }
    ]
  },

  // 2. Wheat (Enhanced)
  {
    name: "Wheat",
    scientificName: "Triticum aestivum",
    type: "Cereal",
    category: "C3",
    growthPeriodMin: 120,
    growthPeriodMax: 180,
    rootDepthMax: 1.8,
    climateZones: JSON.stringify(["temperate", "continental", "mediterranean", "arid"]),
    soilPreferences: JSON.stringify({
      "preferredTexture": ["loam", "clay_loam", "silt_loam"],
      "phRange": [6.0, 7.5],
      "drainageRequirement": "moderate",
      "salinity_tolerance": "moderate"
    }),
    bbchStages: [
      { stageCode: "00", stageName: "Dry seed", description: "Seed dormancy", typicalDaysFromSowing: 0, durationDays: 10, growthPeriod: "initial" },
      { stageCode: "09", stageName: "Emergence", description: "Coleoptile emergence", typicalDaysFromSowing: 10, durationDays: 5, growthPeriod: "initial" },
      { stageCode: "13", stageName: "3 leaves", description: "3 leaves unfolded", typicalDaysFromSowing: 15, durationDays: 10, growthPeriod: "initial" },
      { stageCode: "21", stageName: "Beginning tillering", description: "First tiller detectable", typicalDaysFromSowing: 25, durationDays: 15, growthPeriod: "development" },
      { stageCode: "29", stageName: "End tillering", description: "Maximum tillers", typicalDaysFromSowing: 40, durationDays: 15, growthPeriod: "development" },
      { stageCode: "31", stageName: "Stem elongation", description: "First node detectable", typicalDaysFromSowing: 55, durationDays: 20, growthPeriod: "development" },
      { stageCode: "49", stageName: "Booting", description: "Flag leaf sheath swollen", typicalDaysFromSowing: 75, durationDays: 10, growthPeriod: "mid" },
      { stageCode: "61", stageName: "Beginning flowering", description: "Beginning anthesis", typicalDaysFromSowing: 85, durationDays: 10, growthPeriod: "mid" },
      { stageCode: "71", stageName: "Grain filling", description: "Watery ripe", typicalDaysFromSowing: 95, durationDays: 30, growthPeriod: "mid" },
      { stageCode: "87", stageName: "Hard dough", description: "Hard dough stage", typicalDaysFromSowing: 125, durationDays: 20, growthPeriod: "late" },
      { stageCode: "92", stageName: "Harvest ripe", description: "Harvest maturity", typicalDaysFromSowing: 145, durationDays: 15, growthPeriod: "late" }
    ],
    kcPeriods: [
      // Temperate climate
      { periodName: "Kc_ini", periodStartDays: 0, periodEndDays: 25, kcValue: 0.4, kcMin: 0.3, kcMax: 0.5, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_dev", periodStartDays: 26, periodEndDays: 75, kcValue: 0.7, kcMin: 0.6, kcMax: 0.8, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_mid", periodStartDays: 76, periodEndDays: 125, kcValue: 1.15, kcMin: 1.0, kcMax: 1.3, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_end", periodStartDays: 126, periodEndDays: 180, kcValue: 0.4, kcMin: 0.3, kcMax: 0.5, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      // Arid climate
      { periodName: "Kc_ini", periodStartDays: 0, periodEndDays: 25, kcValue: 0.5, kcMin: 0.4, kcMax: 0.6, climateZone: "arid", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" },
      { periodName: "Kc_dev", periodStartDays: 26, periodEndDays: 75, kcValue: 0.8, kcMin: 0.7, kcMax: 0.9, climateZone: "arid", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" },
      { periodName: "Kc_mid", periodStartDays: 76, periodEndDays: 125, kcValue: 1.05, kcMin: 0.9, kcMax: 1.2, climateZone: "arid", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" },
      { periodName: "Kc_end", periodStartDays: 126, periodEndDays: 180, kcValue: 0.3, kcMin: 0.2, kcMax: 0.4, climateZone: "arid", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" }
    ]
  },

  // 3. Maize (Enhanced)
  {
    name: "Maize",
    scientificName: "Zea mays",
    type: "Cereal",
    category: "C4",
    growthPeriodMin: 100,
    growthPeriodMax: 140,
    rootDepthMax: 2.0,
    climateZones: JSON.stringify(["temperate", "subtropical", "continental", "arid"]),
    soilPreferences: JSON.stringify({
      "preferredTexture": ["loam", "sandy_loam", "clay_loam"],
      "phRange": [6.0, 7.0],
      "drainageRequirement": "well_drained",
      "salinity_tolerance": "low"
    }),
    bbchStages: [
      { stageCode: "00", stageName: "Dry seed", description: "Seed dormancy", typicalDaysFromSowing: 0, durationDays: 7, growthPeriod: "initial" },
      { stageCode: "09", stageName: "Emergence", description: "Coleoptile emergence", typicalDaysFromSowing: 7, durationDays: 7, growthPeriod: "initial" },
      { stageCode: "14", stageName: "4 leaves", description: "4 leaves unfolded", typicalDaysFromSowing: 14, durationDays: 14, growthPeriod: "initial" },
      { stageCode: "18", stageName: "8 leaves", description: "8 leaves unfolded", typicalDaysFromSowing: 28, durationDays: 14, growthPeriod: "development" },
      { stageCode: "35", stageName: "Stem elongation", description: "5th node detectable", typicalDaysFromSowing: 42, durationDays: 21, growthPeriod: "development" },
      { stageCode: "51", stageName: "Tassel emergence", description: "Tassel just visible", typicalDaysFromSowing: 63, durationDays: 7, growthPeriod: "mid" },
      { stageCode: "61", stageName: "Beginning flowering", description: "Beginning pollen shedding", typicalDaysFromSowing: 70, durationDays: 7, growthPeriod: "mid" },
      { stageCode: "65", stageName: "Full flowering", description: "Full pollen shedding", typicalDaysFromSowing: 77, durationDays: 7, growthPeriod: "mid" },
      { stageCode: "71", stageName: "Grain filling", description: "Watery ripe", typicalDaysFromSowing: 84, durationDays: 28, growthPeriod: "mid" },
      { stageCode: "87", stageName: "Hard dough", description: "Hard dough stage", typicalDaysFromSowing: 112, durationDays: 14, growthPeriod: "late" },
      { stageCode: "97", stageName: "Harvest ripe", description: "Harvest maturity", typicalDaysFromSowing: 126, durationDays: 14, growthPeriod: "late" }
    ],
    kcPeriods: [
      // Temperate climate
      { periodName: "Kc_ini", periodStartDays: 0, periodEndDays: 28, kcValue: 0.3, kcMin: 0.2, kcMax: 0.4, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_dev", periodStartDays: 29, periodEndDays: 63, kcValue: 0.7, kcMin: 0.6, kcMax: 0.8, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_mid", periodStartDays: 64, periodEndDays: 112, kcValue: 1.2, kcMin: 1.0, kcMax: 1.4, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      { periodName: "Kc_end", periodStartDays: 113, periodEndDays: 140, kcValue: 0.6, kcMin: 0.5, kcMax: 0.7, climateZone: "temperate", irrigationMethod: "sprinkler", confidenceLevel: "high", referenceSource: "FAO-56" },
      // Arid climate
      { periodName: "Kc_ini", periodStartDays: 0, periodEndDays: 28, kcValue: 0.4, kcMin: 0.3, kcMax: 0.5, climateZone: "arid", irrigationMethod: "drip", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" },
      { periodName: "Kc_dev", periodStartDays: 29, periodEndDays: 63, kcValue: 0.8, kcMin: 0.7, kcMax: 0.9, climateZone: "arid", irrigationMethod: "drip", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" },
      { periodName: "Kc_mid", periodStartDays: 64, periodEndDays: 112, kcValue: 1.1, kcMin: 0.9, kcMax: 1.3, climateZone: "arid", irrigationMethod: "drip", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" },
      { periodName: "Kc_end", periodStartDays: 113, periodEndDays: 140, kcValue: 0.5, kcMin: 0.4, kcMax: 0.6, climateZone: "arid", irrigationMethod: "drip", confidenceLevel: "high", referenceSource: "FAO-56 + GCC adjustment" }
    ]
  }
];

async function seedEnhancedDSSData() {
  console.log('🌱 Starting Enhanced DSS database seeding - Week 6...');
  console.log('📊 Target: 13 crops with comprehensive BBCH stages and Kc coefficients');

  try {
    // Clear existing DSS data
    console.log('🧹 Clearing existing DSS data...');
    await prisma.dSSCalculation.deleteMany();
    await prisma.kcPeriod.deleteMany();
    await prisma.bBCHStage.deleteMany();
    await prisma.crop.deleteMany();

    console.log('📈 Seeding enhanced crop database (Part 1/4)...');
    
    // Seed first 3 enhanced crops
    for (const cropInfo of enhancedCropData) {
      console.log(`📊 Seeding enhanced crop: ${cropInfo.name}`);
      
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

      console.log(`✅ Completed enhanced seeding: ${cropInfo.name} (${cropInfo.bbchStages.length} stages, ${cropInfo.kcPeriods.length} Kc periods)`);
    }

    console.log('🎯 Enhanced DSS database seeding (Part 1) completed successfully!');
    console.log(`📊 Part 1 Summary:`);
    console.log(`   - Enhanced Crops: ${enhancedCropData.length}`);
    console.log(`   - BBCH Stages: ${enhancedCropData.reduce((sum, crop) => sum + crop.bbchStages.length, 0)}`);
    console.log(`   - Kc Periods: ${enhancedCropData.reduce((sum, crop) => sum + crop.kcPeriods.length, 0)}`);
    console.log('📝 Note: This is Part 1 of 4 - Additional crops will be added in subsequent files');

  } catch (error) {
    console.error('❌ Error seeding enhanced DSS data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
if (require.main === module) {
  seedEnhancedDSSData()
    .catch((error) => {
      console.error('❌ Enhanced seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedEnhancedDSSData, enhancedCropData };
