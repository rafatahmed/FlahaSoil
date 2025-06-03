/**
 * Complete 13-Crop Database Seeding - Week 6 Implementation
 * Comprehensive crop database with BBCH stages and Kc coefficients
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
const { enhancedCropData } = require('./seed-dss-enhanced');
const { additionalCropsData } = require('./additional-crops-data');

const prisma = new PrismaClient();

// Combine all crop data (3 enhanced + 10 additional = 13 total)
const complete13CropData = [...enhancedCropData, ...additionalCropsData];

async function seed13CropsDatabase() {
  console.log('🌱 Starting Complete 13-Crop Database Seeding - Week 6');
  console.log('📊 Target: 13 crops with comprehensive BBCH stages and Kc coefficients');
  console.log('🎯 Crops: Tomato, Wheat, Maize, Rice, Potato, Onion, Cucumber, Lettuce, Alfalfa, Cotton, Sunflower, Barley, Date Palm');

  try {
    // Clear existing DSS data
    console.log('🧹 Clearing existing DSS data...');
    await prisma.dSSCalculation.deleteMany();
    await prisma.kcPeriod.deleteMany();
    await prisma.bBCHStage.deleteMany();
    await prisma.crop.deleteMany();

    console.log('📈 Seeding complete 13-crop database...');
    
    let totalBBCHStages = 0;
    let totalKcPeriods = 0;

    // Seed all 13 crops
    for (let i = 0; i < complete13CropData.length; i++) {
      const cropInfo = complete13CropData[i];
      console.log(`📊 Seeding crop ${i + 1}/13: ${cropInfo.name}`);
      
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

      totalBBCHStages += cropInfo.bbchStages.length;
      totalKcPeriods += cropInfo.kcPeriods.length;

      console.log(`✅ Completed: ${cropInfo.name} (${cropInfo.bbchStages.length} stages, ${cropInfo.kcPeriods.length} Kc periods)`);
    }

    console.log('\n🎯 Complete 13-Crop Database Seeding Successfully Completed!');
    console.log('='.repeat(70));
    console.log('📊 FINAL SUMMARY:');
    console.log(`   🌾 Total Crops: ${complete13CropData.length}`);
    console.log(`   📈 Total BBCH Stages: ${totalBBCHStages}`);
    console.log(`   💧 Total Kc Periods: ${totalKcPeriods}`);
    console.log('');
    console.log('🌍 Crop Types Distribution:');
    
    const typeDistribution = {};
    complete13CropData.forEach(crop => {
      typeDistribution[crop.type] = (typeDistribution[crop.type] || 0) + 1;
    });
    
    Object.entries(typeDistribution).forEach(([type, count]) => {
      console.log(`   ${type}: ${count} crops`);
    });

    console.log('');
    console.log('🌡️ Climate Zones Coverage:');
    const climateZones = new Set();
    complete13CropData.forEach(crop => {
      const zones = JSON.parse(crop.climateZones);
      zones.forEach(zone => climateZones.add(zone));
    });
    console.log(`   Supported Zones: ${Array.from(climateZones).join(', ')}`);

    console.log('');
    console.log('💧 Irrigation Methods:');
    const irrigationMethods = new Set();
    complete13CropData.forEach(crop => {
      crop.kcPeriods.forEach(period => {
        irrigationMethods.add(period.irrigationMethod);
      });
    });
    console.log(`   Supported Methods: ${Array.from(irrigationMethods).join(', ')}`);

    console.log('');
    console.log('📚 Reference Sources:');
    const referenceSources = new Set();
    complete13CropData.forEach(crop => {
      crop.kcPeriods.forEach(period => {
        referenceSources.add(period.referenceSource);
      });
    });
    referenceSources.forEach(source => {
      console.log(`   - ${source}`);
    });

    console.log('');
    console.log('🎉 Week 6 Crop Database Enhancement - COMPLETED!');
    console.log('✨ Ready for advanced DSS calculations with comprehensive crop data');

  } catch (error) {
    console.error('❌ Error seeding 13-crop database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Crop information summary for documentation
function getCropSummary() {
  return complete13CropData.map((crop, index) => ({
    id: index + 1,
    name: crop.name,
    scientificName: crop.scientificName,
    type: crop.type,
    category: crop.category,
    growthPeriod: `${crop.growthPeriodMin}-${crop.growthPeriodMax} days`,
    rootDepth: `${crop.rootDepthMax}m`,
    bbchStages: crop.bbchStages.length,
    kcPeriods: crop.kcPeriods.length,
    climateZones: JSON.parse(crop.climateZones).length
  }));
}

// Run the seeding
if (require.main === module) {
  seed13CropsDatabase()
    .catch((error) => {
      console.error('❌ 13-crop seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { 
  seed13CropsDatabase, 
  complete13CropData, 
  getCropSummary 
};
