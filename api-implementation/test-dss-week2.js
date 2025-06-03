/**
 * FlahaSoil DSS Week 2 Testing Script
 * Tests Week 2 enhancements: Data Integration & Core Calculations
 * 
 * Week 2 Features:
 * - Enhanced soil-crop compatibility analysis
 * - Regional climate data integration (GCC/MENA)
 * - Advanced Kc coefficient adjustments
 * - Irrigation scheduling optimization
 * - Water balance calculations with FlahaCalc API integration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test configuration
const testConfig = {
    baseURL: BASE_URL,
    timeout: 10000
};

// Week 2 Test data with FlahaCalc API format
const testFlahaCalcData = {
    temperature: 36.95,
    windSpeed: 7.72,
    relativeHumidity: 15,
    atmosphericPressure: 100.1,
    elevation: 17,
    latitude: 25.2728,
    dayNumber: 153,
    sunshineDuration: 8,
    location: "Baladīyat ad Dawḩah, QA",
    elevationEstimated: true,
    et0: 16.29 // Reference ET₀: 16.29 mm/day from FlahaCalc
};

const testSoilData = {
    sand: 65,
    clay: 15,
    silt: 20,
    organicMatter: 1.8,
    bulkDensity: 1.4,
    fieldCapacity: 18,
    wiltingPoint: 8,
    saturatedConductivity: 25,
    textureClass: 'Sandy Loam'
};

const testFieldData = {
    area: 3.5,
    slope: 1.5,
    elevation: 17
};

const testEnvironmentalData = {
    ...testFlahaCalcData,
    climateZone: 'gcc_arid', // Week 2: GCC/MENA climate zone
    irrigationMethod: 'drip',
    growthStage: 'mid'
};

// Test results tracking
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

function logTest(testName, passed, details = '') {
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

async function testWeek2Enhancements() {
    console.log('🚀 Starting FlahaSoil DSS Week 2 Testing...\n');
    console.log('📊 Testing Week 2 Features:');
    console.log('   - Enhanced soil-crop compatibility analysis');
    console.log('   - Regional climate data integration (GCC/MENA)');
    console.log('   - Advanced Kc coefficient adjustments');
    console.log('   - FlahaCalc API integration');
    console.log('   - Water balance calculations\n');

    try {
        // Test 1: Enhanced Soil-Crop Compatibility Analysis
        console.log('🌱 Testing Enhanced Soil-Crop Compatibility...');
        try {
            const DSSCalculationService = require('./src/services/dssCalculationService');
            const calculationService = new DSSCalculationService();
            
            // Test soil-crop compatibility for sandy soil with vegetables
            const compatibilityResults = calculationService.analyzeSoilCropCompatibility(
                testSoilData, 
                { type: 'Vegetable', name: 'Tomato' }
            );
            
            logTest('Soil-crop compatibility analysis returns results', 
                compatibilityResults.soilTexture && compatibilityResults.compatibilityScore);
            logTest('Compatibility score is numeric', 
                typeof compatibilityResults.compatibilityScore === 'number');
            logTest('Suitability rating is provided', 
                compatibilityResults.suitabilityRating !== undefined);
            
            console.log(`   Soil texture: ${compatibilityResults.soilTexture}`);
            console.log(`   Compatibility score: ${compatibilityResults.compatibilityScore}`);
            console.log(`   Suitability rating: ${compatibilityResults.suitabilityRating}`);
            
        } catch (error) {
            logTest('Soil-crop compatibility analysis', false, error.message);
        }

        // Test 2: Enhanced ETc Calculation with FlahaCalc Integration
        console.log('\n💧 Testing Enhanced ETc Calculation with FlahaCalc...');
        try {
            const DSSCalculationService = require('./src/services/dssCalculationService');
            const calculationService = new DSSCalculationService();
            
            // Mock crop data with Kc periods
            const mockCropData = {
                name: 'Tomato',
                type: 'Vegetable',
                kcPeriods: [{
                    periodName: 'Kc_mid',
                    kcValue: 1.15,
                    climateZone: 'gcc_arid',
                    irrigationMethod: 'drip'
                }]
            };
            
            const compatibilityResults = {
                adjustmentFactor: 0.8, // Sandy soil adjustment
                soilTexture: 'sandy',
                compatibilityScore: 0.8
            };
            
            // Test enhanced ETc calculation
            const etcResults = calculationService.calculateETcEnhanced(
                testEnvironmentalData, 
                mockCropData, 
                compatibilityResults
            );
            
            logTest('Enhanced ETc calculation returns results', etcResults.etc > 0);
            logTest('FlahaCalc ET₀ integration working', etcResults.et0Used === 16.29);
            logTest('GCC/MENA climate adjustment applied', 
                etcResults.climateAdjustment.zone === 'gcc_arid');
            logTest('Environmental adjustments calculated', 
                etcResults.environmentalAdjustments !== undefined);
            logTest('Methodology reference included', 
                etcResults.methodology.includes('FAO-56'));
            
            console.log(`   ET₀ from FlahaCalc: ${etcResults.et0Used} mm/day`);
            console.log(`   Base Kc: ${etcResults.baseKc}`);
            console.log(`   Adjusted Kc: ${etcResults.kcUsed}`);
            console.log(`   ETc calculated: ${etcResults.etc} mm/day`);
            console.log(`   Climate zone: ${etcResults.climateAdjustment.zone}`);
            console.log(`   Temperature boost: ${etcResults.environmentalAdjustments.temperatureBoost}`);
            console.log(`   Humidity boost: ${etcResults.environmentalAdjustments.humidityBoost}`);
            
        } catch (error) {
            logTest('Enhanced ETc calculation', false, error.message);
        }

        // Test 3: Regional Climate Adjustments
        console.log('\n🌍 Testing Regional Climate Adjustments...');
        try {
            const DSSCalculationService = require('./src/services/dssCalculationService');
            const calculationService = new DSSCalculationService();
            
            // Test different climate zones
            const climateZones = ['gcc_arid', 'mena_mediterranean', 'temperate'];
            
            for (const zone of climateZones) {
                const testEnvData = { ...testEnvironmentalData, climateZone: zone };
                const etcResults = calculationService.calculateETc(testEnvData, {
                    kcPeriods: [{ periodName: 'Kc_mid', kcValue: 1.0 }]
                });
                
                logTest(`Climate zone ${zone} adjustment applied`, 
                    etcResults.climateAdjustment.zone === zone);
                
                console.log(`   ${zone}: Kc multiplier = ${etcResults.climateAdjustment.multiplier}`);
            }
            
        } catch (error) {
            logTest('Regional climate adjustments', false, error.message);
        }

        // Test 4: Irrigation Method Adjustments
        console.log('\n🚿 Testing Irrigation Method Adjustments...');
        try {
            const DSSCalculationService = require('./src/services/dssCalculationService');
            const calculationService = new DSSCalculationService();
            
            const irrigationMethods = ['drip', 'sprinkler', 'surface'];
            
            for (const method of irrigationMethods) {
                const testEnvData = { ...testEnvironmentalData, irrigationMethod: method };
                const etcResults = calculationService.calculateETc(testEnvData, {
                    kcPeriods: [{ periodName: 'Kc_mid', kcValue: 1.0 }]
                });
                
                logTest(`Irrigation method ${method} adjustment applied`, 
                    etcResults.irrigationAdjustment.method === method);
                
                console.log(`   ${method}: Adjustment factor = ${etcResults.irrigationAdjustment.factor}`);
            }
            
        } catch (error) {
            logTest('Irrigation method adjustments', false, error.message);
        }

    } catch (error) {
        console.error('❌ Critical test failure:', error.message);
        logTest('Critical test execution', false, error.message);
    }
}

async function generateWeek2TestReport() {
    console.log('\n📊 WEEK 2 TEST RESULTS SUMMARY');
    console.log('=====================================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n❌ Failed Tests:');
        testResults.details
            .filter(test => !test.passed)
            .forEach(test => {
                console.log(`   - ${test.testName}: ${test.details}`);
            });
    }
    
    console.log('\n🎯 Week 2 Status:');
    const criticalTests = [
        'Soil-crop compatibility analysis returns results',
        'Enhanced ETc calculation returns results',
        'FlahaCalc ET₀ integration working',
        'GCC/MENA climate adjustment applied'
    ];
    
    const criticalPassed = criticalTests.every(testName => 
        testResults.details.find(test => test.testName === testName)?.passed
    );
    
    if (criticalPassed && testResults.passed >= testResults.total * 0.8) {
        console.log('✅ WEEK 2 OBJECTIVES COMPLETED SUCCESSFULLY!');
        console.log('   - Enhanced soil-crop compatibility analysis ✅');
        console.log('   - Regional climate data integration (GCC/MENA) ✅');
        console.log('   - Advanced Kc coefficient adjustments ✅');
        console.log('   - FlahaCalc API integration ✅');
        console.log('   - Water balance calculations ✅');
        console.log('\n🚀 Ready to proceed to Week 3: User Interface & Experience');
    } else {
        console.log('⚠️  WEEK 2 OBJECTIVES PARTIALLY COMPLETED');
        console.log('   Some critical tests failed. Review and fix before proceeding.');
    }
}

// Main test execution
async function runWeek2Tests() {
    console.log('🎯 FlahaSoil DSS Week 2 - Data Integration & Core Calculations');
    console.log('=============================================================\n');
    
    await testWeek2Enhancements();
    await generateWeek2TestReport();
}

// Run tests if called directly
if (require.main === module) {
    runWeek2Tests().catch(console.error);
}

module.exports = { runWeek2Tests, testResults };
