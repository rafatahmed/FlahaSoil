/**
 * Salt Tolerance Database Seeder for FlahaSoil DSS
 * Populates crop salt tolerance thresholds with Gulf-specific adjustments
 * Based on FAO-29, regional studies, and ICBA research
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Gulf-specific salt tolerance data with regional adjustments
const saltToleranceData = [
    // VEGETABLES
    {
        cropName: 'Tomato',
        thresholdEC: 2.5,
        slopePercent: 9.9,
        gulfAdjustedEC: 2.0,
        climateAdjustment: 0.8,
        toleranceClass: 'sensitive',
        gulfSuitability: 'moderate',
        referenceSource: 'FAO-29, Table 10',
        confidenceLevel: 'high',
        seasonalVariation: JSON.stringify({
            summer: 0.8,
            winter: 1.0,
            transition: 0.9
        })
    },
    {
        cropName: 'Cucumber',
        thresholdEC: 2.5,
        slopePercent: 13.0,
        gulfAdjustedEC: 2.0,
        climateAdjustment: 0.8,
        toleranceClass: 'sensitive',
        gulfSuitability: 'moderate',
        referenceSource: 'FAO-29, Table 10',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Eggplant',
        thresholdEC: 1.1,
        slopePercent: 5.6,
        gulfAdjustedEC: 0.9,
        climateAdjustment: 0.8,
        toleranceClass: 'very_sensitive',
        gulfSuitability: 'challenging',
        referenceSource: 'FAO-29, Table 10',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Pepper',
        thresholdEC: 1.5,
        slopePercent: 14.0,
        gulfAdjustedEC: 1.2,
        climateAdjustment: 0.8,
        toleranceClass: 'sensitive',
        gulfSuitability: 'challenging',
        referenceSource: 'FAO-29, Table 10',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Potato',
        thresholdEC: 1.7,
        slopePercent: 12.0,
        gulfAdjustedEC: 1.4,
        climateAdjustment: 0.8,
        toleranceClass: 'sensitive',
        gulfSuitability: 'moderate',
        referenceSource: 'FAO-29, Table 10',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Onion',
        thresholdEC: 1.2,
        slopePercent: 16.0,
        gulfAdjustedEC: 1.0,
        climateAdjustment: 0.8,
        toleranceClass: 'sensitive',
        gulfSuitability: 'challenging',
        referenceSource: 'FAO-29, Table 10',
        confidenceLevel: 'high'
    },

    // FIELD CROPS
    {
        cropName: 'Cotton',
        thresholdEC: 7.7,
        slopePercent: 5.2,
        gulfAdjustedEC: 8.5,
        climateAdjustment: 1.1,
        toleranceClass: 'tolerant',
        gulfSuitability: 'very_good',
        referenceSource: 'FAO-29, Table 11',
        confidenceLevel: 'high',
        seasonalVariation: JSON.stringify({
            summer: 1.1,
            winter: 1.0,
            transition: 1.05
        })
    },
    {
        cropName: 'Soybean',
        thresholdEC: 5.0,
        slopePercent: 20.0,
        gulfAdjustedEC: 4.5,
        climateAdjustment: 0.9,
        toleranceClass: 'moderate',
        gulfSuitability: 'good',
        referenceSource: 'FAO-29, Table 11',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Sunflower',
        thresholdEC: 4.8,
        slopePercent: 5.0,
        gulfAdjustedEC: 5.2,
        climateAdjustment: 1.1,
        toleranceClass: 'moderate',
        gulfSuitability: 'good',
        referenceSource: 'FAO-29, Table 11',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Safflower',
        thresholdEC: 5.3,
        slopePercent: 6.2,
        gulfAdjustedEC: 5.8,
        climateAdjustment: 1.1,
        toleranceClass: 'moderate',
        gulfSuitability: 'good',
        referenceSource: 'FAO-29, Table 11',
        confidenceLevel: 'medium'
    },

    // GRASSES & FORAGES
    {
        cropName: 'Bermuda Grass',
        thresholdEC: 6.9,
        slopePercent: 5.9,
        gulfAdjustedEC: 7.5,
        climateAdjustment: 1.1,
        toleranceClass: 'tolerant',
        gulfSuitability: 'excellent',
        referenceSource: 'FAO-29, Table 12; Taha et al. (2016)',
        confidenceLevel: 'high',
        seasonalVariation: JSON.stringify({
            summer: 1.2,
            winter: 1.0,
            transition: 1.1
        })
    },
    {
        cropName: 'Alfalfa',
        thresholdEC: 2.0,
        slopePercent: 7.3,
        gulfAdjustedEC: 1.8,
        climateAdjustment: 0.9,
        toleranceClass: 'sensitive',
        gulfSuitability: 'moderate',
        referenceSource: 'FAO-29, Table 12',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Ryegrass',
        thresholdEC: 5.6,
        slopePercent: 2.6,
        gulfAdjustedEC: 6.0,
        climateAdjustment: 1.1,
        toleranceClass: 'moderate',
        gulfSuitability: 'good',
        referenceSource: 'FAO-29, Table 12',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Sudan Grass',
        thresholdEC: 2.8,
        slopePercent: 16.0,
        gulfAdjustedEC: 3.2,
        climateAdjustment: 1.1,
        toleranceClass: 'moderate',
        gulfSuitability: 'good',
        referenceSource: 'FAO-29, Table 12',
        confidenceLevel: 'medium'
    },
    {
        cropName: 'Rhodes Grass',
        thresholdEC: 8.1,
        slopePercent: 6.8,
        gulfAdjustedEC: 8.8,
        climateAdjustment: 1.1,
        toleranceClass: 'tolerant',
        gulfSuitability: 'excellent',
        referenceSource: 'Regional Studies',
        confidenceLevel: 'medium'
    },

    // CEREALS
    {
        cropName: 'Wheat',
        thresholdEC: 6.0,
        slopePercent: 7.1,
        gulfAdjustedEC: 5.5,
        climateAdjustment: 0.9,
        toleranceClass: 'moderate',
        gulfSuitability: 'good',
        referenceSource: 'FAO-29, Table 11',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Barley',
        thresholdEC: 8.0,
        slopePercent: 5.0,
        gulfAdjustedEC: 8.5,
        climateAdjustment: 1.1,
        toleranceClass: 'tolerant',
        gulfSuitability: 'very_good',
        referenceSource: 'FAO-29, Table 11; Al-Busaidi & Cookson (2003)',
        confidenceLevel: 'high',
        seasonalVariation: JSON.stringify({
            summer: 1.1,
            winter: 1.0,
            transition: 1.05
        })
    },
    {
        cropName: 'Maize',
        thresholdEC: 1.7,
        slopePercent: 12.0,
        gulfAdjustedEC: 1.5,
        climateAdjustment: 0.9,
        toleranceClass: 'sensitive',
        gulfSuitability: 'challenging',
        referenceSource: 'FAO-29, Table 11',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Rice',
        thresholdEC: 3.0,
        slopePercent: 12.0,
        gulfAdjustedEC: 2.5,
        climateAdjustment: 0.8,
        toleranceClass: 'sensitive',
        gulfSuitability: 'moderate',
        referenceSource: 'FAO-29, Table 11',
        confidenceLevel: 'high'
    },

    // TREE CROPS & PERENNIALS
    {
        cropName: 'Date Palm',
        thresholdEC: 18.0,
        slopePercent: 3.6,
        gulfAdjustedEC: 20.0,
        climateAdjustment: 1.1,
        toleranceClass: 'highly_tolerant',
        gulfSuitability: 'excellent',
        referenceSource: 'Regional Studies; ICBA',
        confidenceLevel: 'high',
        seasonalVariation: JSON.stringify({
            summer: 1.2,
            winter: 1.0,
            transition: 1.1
        })
    },
    {
        cropName: 'Citrus',
        thresholdEC: 1.7,
        slopePercent: 13.0,
        gulfAdjustedEC: 1.4,
        climateAdjustment: 0.8,
        toleranceClass: 'sensitive',
        gulfSuitability: 'challenging',
        referenceSource: 'FAO-29, Table 13',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Olive',
        thresholdEC: 2.7,
        slopePercent: 3.8,
        gulfAdjustedEC: 3.0,
        climateAdjustment: 1.1,
        toleranceClass: 'moderate',
        gulfSuitability: 'good',
        referenceSource: 'FAO-29, Table 13',
        confidenceLevel: 'high'
    },
    {
        cropName: 'Pomegranate',
        thresholdEC: 4.0,
        slopePercent: 8.5,
        gulfAdjustedEC: 4.5,
        climateAdjustment: 1.1,
        toleranceClass: 'moderate',
        gulfSuitability: 'good',
        referenceSource: 'Regional Studies',
        confidenceLevel: 'medium'
    },
    {
        cropName: 'Fig',
        thresholdEC: 2.7,
        slopePercent: 9.6,
        gulfAdjustedEC: 3.0,
        climateAdjustment: 1.1,
        toleranceClass: 'moderate',
        gulfSuitability: 'good',
        referenceSource: 'FAO-29, Table 13',
        confidenceLevel: 'medium'
    },

    // HALOPHYTES & SALT-TOLERANT CROPS
    {
        cropName: 'Salicornia',
        thresholdEC: 25.0,
        slopePercent: 2.0,
        gulfAdjustedEC: 28.0,
        climateAdjustment: 1.1,
        toleranceClass: 'extremely_tolerant',
        gulfSuitability: 'excellent',
        referenceSource: 'ICBA Studies',
        confidenceLevel: 'medium',
        seasonalVariation: JSON.stringify({
            summer: 1.1,
            winter: 1.0,
            transition: 1.05
        })
    },
    {
        cropName: 'Quinoa',
        thresholdEC: 15.0,
        slopePercent: 5.7,
        gulfAdjustedEC: 16.0,
        climateAdjustment: 1.1,
        toleranceClass: 'highly_tolerant',
        gulfSuitability: 'excellent',
        referenceSource: 'Regional Studies; ICBA',
        confidenceLevel: 'medium'
    },
    {
        cropName: 'Atriplex',
        thresholdEC: 20.0,
        slopePercent: 4.2,
        gulfAdjustedEC: 22.0,
        climateAdjustment: 1.1,
        toleranceClass: 'highly_tolerant',
        gulfSuitability: 'excellent',
        referenceSource: 'ICBA Studies',
        confidenceLevel: 'medium'
    },
    {
        cropName: 'Seashore Paspalum',
        thresholdEC: 12.0,
        slopePercent: 6.8,
        gulfAdjustedEC: 13.0,
        climateAdjustment: 1.1,
        toleranceClass: 'highly_tolerant',
        gulfSuitability: 'very_good',
        referenceSource: 'Regional Studies',
        confidenceLevel: 'medium'
    }
];

/**
 * Seed salt tolerance thresholds for all crops
 */
async function seedSaltToleranceThresholds() {
    console.log('🧂 Starting salt tolerance threshold seeding...');

    try {
        // Get all existing crops
        const crops = await prisma.crop.findMany({
            select: { id: true, name: true }
        });

        console.log(`Found ${crops.length} crops in database`);

        let seededCount = 0;
        let skippedCount = 0;

        for (const toleranceData of saltToleranceData) {
            // Find matching crop
            const crop = crops.find(c => 
                c.name.toLowerCase() === toleranceData.cropName.toLowerCase()
            );

            if (!crop) {
                console.log(`⚠️  Crop not found: ${toleranceData.cropName}`);
                skippedCount++;
                continue;
            }

            // Check if salt tolerance already exists
            const existingTolerance = await prisma.saltToleranceThreshold.findFirst({
                where: { cropId: crop.id }
            });

            if (existingTolerance) {
                console.log(`⏭️  Salt tolerance already exists for: ${toleranceData.cropName}`);
                skippedCount++;
                continue;
            }

            // Create salt tolerance threshold
            await prisma.saltToleranceThreshold.create({
                data: {
                    cropId: crop.id,
                    thresholdEC: toleranceData.thresholdEC,
                    slopePercent: toleranceData.slopePercent,
                    gulfAdjustedEC: toleranceData.gulfAdjustedEC,
                    climateAdjustment: toleranceData.climateAdjustment,
                    seasonalVariation: toleranceData.seasonalVariation || null,
                    toleranceClass: toleranceData.toleranceClass,
                    gulfSuitability: toleranceData.gulfSuitability,
                    referenceSource: toleranceData.referenceSource,
                    confidenceLevel: toleranceData.confidenceLevel,
                    lastValidated: new Date(),
                    isActive: true
                }
            });

            console.log(`✅ Created salt tolerance for: ${toleranceData.cropName}`);
            seededCount++;
        }

        console.log(`\n🎯 Salt tolerance seeding completed:`);
        console.log(`   ✅ Created: ${seededCount} records`);
        console.log(`   ⏭️  Skipped: ${skippedCount} records`);
        console.log(`   📊 Total processed: ${saltToleranceData.length} records`);

    } catch (error) {
        console.error('❌ Error seeding salt tolerance thresholds:', error);
        throw error;
    }
}

/**
 * Main seeder function
 */
async function main() {
    try {
        await seedSaltToleranceThresholds();
    } catch (error) {
        console.error('❌ Seeding failed:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

// Run seeder if called directly
if (require.main === module) {
    main();
}

module.exports = {
    seedSaltToleranceThresholds,
    saltToleranceData
};
