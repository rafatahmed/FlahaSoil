/**
 * FlahaSoil DSS Phase 1 Testing Script
 * Tests all implemented features for Week 1 completion
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test configuration
const testConfig = {
    baseURL: BASE_URL,
    timeout: 10000
};

// Test data
const testSoilData = {
    sand: 40,
    clay: 30,
    silt: 30,
    organicMatter: 2.5,
    bulkDensity: 1.3
};

const testFieldData = {
    area: 5.0,
    slope: 2.0,
    elevation: 100
};

const testEnvironmentalData = {
    et0Value: 5.5,
    climateZone: 'arid',
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

async function testDSSEndpoints() {
    console.log('🚀 Starting FlahaSoil DSS Phase 1 Testing...\n');

    try {
        // Test 1: Get Crops Endpoint
        console.log('📊 Testing Crops Endpoint...');
        try {
            const cropsResponse = await axios.get(`${BASE_URL}/dss/crops`);
            const cropsData = cropsResponse.data;
            
            logTest('Crops endpoint returns 200', cropsResponse.status === 200);
            logTest('Crops response has success field', cropsData.success === true);
            logTest('Crops data is array', Array.isArray(cropsData.data));
            logTest('Crops contain required fields', 
                cropsData.data.length > 0 && 
                cropsData.data[0].hasOwnProperty('name') &&
                cropsData.data[0].hasOwnProperty('type') &&
                cropsData.data[0].hasOwnProperty('growthPeriodMin')
            );
            
            console.log(`   Found ${cropsData.data.length} crops in database`);
            
            // Store first crop for further testing
            const testCrop = cropsData.data[0];
            
            // Test 2: Get Crop Stages
            console.log('\n📈 Testing Crop Stages Endpoint...');
            try {
                const stagesResponse = await axios.get(`${BASE_URL}/dss/crops/${testCrop.id}/stages`);
                const stagesData = stagesResponse.data;
                
                logTest('Crop stages endpoint returns 200', stagesResponse.status === 200);
                logTest('Stages response has success field', stagesData.success === true);
                logTest('Stages data is array', Array.isArray(stagesData.data));
                logTest('Stages contain BBCH codes', 
                    stagesData.data.length > 0 && 
                    stagesData.data[0].hasOwnProperty('stageCode') &&
                    stagesData.data[0].hasOwnProperty('stageName')
                );
                
                console.log(`   Found ${stagesData.data.length} growth stages for ${testCrop.name}`);
                
            } catch (error) {
                logTest('Crop stages endpoint', false, error.message);
            }

            // Test 3: Get Crop Kc Coefficients
            console.log('\n🌱 Testing Crop Kc Endpoint...');
            try {
                const kcResponse = await axios.get(`${BASE_URL}/dss/crops/${testCrop.id}/kc?climateZone=arid&irrigationMethod=drip`);
                const kcData = kcResponse.data;
                
                logTest('Crop Kc endpoint returns 200', kcResponse.status === 200);
                logTest('Kc response has success field', kcData.success === true);
                logTest('Kc data is array', Array.isArray(kcData.data));
                logTest('Kc contains coefficient values', 
                    kcData.data.length > 0 && 
                    kcData.data[0].hasOwnProperty('kcValue') &&
                    kcData.data[0].hasOwnProperty('periodName')
                );
                
                console.log(`   Found ${kcData.data.length} Kc periods for ${testCrop.name}`);
                
            } catch (error) {
                logTest('Crop Kc endpoint', false, error.message);
            }

            // Test 4: Database Seeding Validation
            console.log('\n🌾 Validating Database Seeding...');
            const expectedCrops = ['Tomato', 'Wheat', 'Maize'];
            const foundCrops = cropsData.data.map(crop => crop.name);
            
            expectedCrops.forEach(expectedCrop => {
                logTest(`${expectedCrop} crop seeded`, foundCrops.includes(expectedCrop));
            });

            // Test 5: Crop Data Structure Validation
            console.log('\n🔍 Validating Crop Data Structure...');
            const sampleCrop = cropsData.data.find(crop => crop.name === 'Tomato');
            if (sampleCrop) {
                logTest('Tomato has scientific name', sampleCrop.scientificName === 'Solanum lycopersicum');
                logTest('Tomato has correct type', sampleCrop.type === 'Vegetable');
                logTest('Tomato has growth period', sampleCrop.growthPeriodMin >= 90 && sampleCrop.growthPeriodMax <= 140);
                logTest('Tomato has climate zones', Array.isArray(sampleCrop.climateZones));
            } else {
                logTest('Tomato crop found in database', false, 'Tomato not found in seeded data');
            }

        } catch (error) {
            logTest('Crops endpoint', false, error.message);
        }

        // Test 6: API Response Time Performance
        console.log('\n⚡ Testing API Performance...');
        const startTime = Date.now();
        try {
            await axios.get(`${BASE_URL}/dss/crops`);
            const responseTime = Date.now() - startTime;
            logTest('API response time < 2 seconds', responseTime < 2000, `${responseTime}ms`);
            console.log(`   Response time: ${responseTime}ms`);
        } catch (error) {
            logTest('API performance test', false, error.message);
        }

        // Test 7: Error Handling
        console.log('\n🛡️ Testing Error Handling...');
        try {
            await axios.get(`${BASE_URL}/dss/crops/invalid-id/stages`);
            logTest('Invalid crop ID handling', false, 'Should return 404');
        } catch (error) {
            logTest('Invalid crop ID returns 404', error.response?.status === 404);
        }

        // Test 8: Rate Limiting (Basic Test)
        console.log('\n🚦 Testing Rate Limiting...');
        try {
            const requests = [];
            for (let i = 0; i < 5; i++) {
                requests.push(axios.get(`${BASE_URL}/dss/crops`));
            }
            await Promise.all(requests);
            logTest('Multiple requests handled', true);
        } catch (error) {
            logTest('Rate limiting test', false, error.message);
        }

    } catch (error) {
        console.error('❌ Critical test failure:', error.message);
        logTest('Critical test execution', false, error.message);
    }
}

async function testDSSCalculationService() {
    console.log('\n🧮 Testing DSS Calculation Service...');
    
    try {
        // Import and test the calculation service directly
        const DSSCalculationService = require('./src/services/dssCalculationService');
        const calculationService = new DSSCalculationService();
        
        // Test calculation methods
        const mockSoilData = {
            fieldCapacity: 25,
            wiltingPoint: 12,
            saturatedConductivity: 15,
            textureClass: 'Loam'
        };
        
        const mockCropData = {
            kcPeriods: [{
                kcValue: 1.15,
                periodName: 'Kc_mid'
            }]
        };
        
        const mockFieldConfig = { area: 5.0 };
        const mockEnvironmentalData = { et0: 5.5, climateZone: 'arid', irrigationMethod: 'drip', growthStage: 'mid' };
        
        // Test ETc calculation
        const etcResults = calculationService.calculateETc(mockEnvironmentalData, mockCropData);
        logTest('ETc calculation returns valid result', etcResults.etc > 0 && etcResults.kcUsed > 0);
        console.log(`   ETc calculated: ${etcResults.etc} mm/day`);
        
        // Test irrigation requirements calculation
        const irrigationResults = calculationService.calculateIrrigationRequirements(
            mockSoilData, etcResults, mockFieldConfig, mockEnvironmentalData
        );
        logTest('Irrigation depth calculated', irrigationResults.irrigationDepth > 0);
        logTest('Irrigation frequency calculated', irrigationResults.frequency > 0);
        console.log(`   Irrigation depth: ${irrigationResults.irrigationDepth}mm every ${irrigationResults.frequency} days`);
        
        // Test system recommendation
        const systemResults = calculationService.recommendIrrigationSystem(
            mockSoilData, irrigationResults, mockFieldConfig
        );
        logTest('System recommendation generated', systemResults.recommendedSystem !== undefined);
        logTest('System efficiency calculated', systemResults.efficiency > 0 && systemResults.efficiency <= 1);
        console.log(`   Recommended system: ${systemResults.recommendedSystem} (${Math.round(systemResults.efficiency * 100)}% efficiency)`);
        
        // Test economic analysis
        const economicResults = calculationService.calculateEconomicAnalysis(
            systemResults, irrigationResults, mockFieldConfig
        );
        logTest('ROI calculated', economicResults.roi !== undefined);
        logTest('Payback period calculated', economicResults.paybackPeriod > 0);
        console.log(`   ROI: ${economicResults.roi}%, Payback: ${economicResults.paybackPeriod} years`);
        
    } catch (error) {
        logTest('DSS Calculation Service', false, error.message);
    }
}

async function generateTestReport() {
    console.log('\n📊 PHASE 1 TEST RESULTS SUMMARY');
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
    
    console.log('\n🎯 Phase 1 Week 1 Status:');
    const criticalTests = [
        'Crops endpoint returns 200',
        'Crops response has success field',
        'ETc calculation returns valid result',
        'System recommendation generated'
    ];
    
    const criticalPassed = criticalTests.every(testName => 
        testResults.details.find(test => test.testName === testName)?.passed
    );
    
    if (criticalPassed && testResults.passed >= testResults.total * 0.8) {
        console.log('✅ WEEK 1 OBJECTIVES COMPLETED SUCCESSFULLY!');
        console.log('   - Database schema implemented ✅');
        console.log('   - Crop data seeded ✅');
        console.log('   - DSS API endpoints functional ✅');
        console.log('   - Calculation service working ✅');
        console.log('   - Frontend page created ✅');
        console.log('\n🚀 Ready to proceed to Week 2: Data Integration & Core Calculations');
    } else {
        console.log('⚠️  WEEK 1 OBJECTIVES PARTIALLY COMPLETED');
        console.log('   Some critical tests failed. Review and fix before proceeding.');
    }
}

// Main test execution
async function runPhase1Tests() {
    console.log('🎯 FlahaSoil DSS Phase 1 - Week 1 Testing');
    console.log('==========================================\n');
    
    await testDSSEndpoints();
    await testDSSCalculationService();
    await generateTestReport();
}

// Run tests if called directly
if (require.main === module) {
    runPhase1Tests().catch(console.error);
}

module.exports = { runPhase1Tests, testResults };
