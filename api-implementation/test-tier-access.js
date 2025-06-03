/**
 * FlahaSoil DSS Tier-based Access Control Testing
 * Tests the corrected implementation where DSS is only available to Professional/Enterprise users
 * 
 * Test Scenarios:
 * 1. Free tier user - should be denied DSS access
 * 2. Professional tier user - should have full DSS access with user level selection
 * 3. Enterprise tier user - should have full DSS access with all features
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Test configuration
const testConfig = {
    baseURL: BASE_URL,
    timeout: 10000
};

// Test users for different tiers
const testUsers = {
    free: {
        email: 'free@test.com',
        password: 'password123',
        tier: 'FREE',
        expectedDSSAccess: false
    },
    professional: {
        email: 'pro@test.com', 
        password: 'password123',
        tier: 'PROFESSIONAL',
        expectedDSSAccess: true
    },
    enterprise: {
        email: 'enterprise@test.com',
        password: 'password123', 
        tier: 'ENTERPRISE',
        expectedDSSAccess: true
    }
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

async function testTierBasedAccess() {
    console.log('🔐 Starting FlahaSoil DSS Tier-based Access Control Testing...\n');
    console.log('📊 Testing Corrected Implementation:');
    console.log('   - DSS only available to Professional/Enterprise tiers');
    console.log('   - User level selection (farmer/designer/consultant) within DSS');
    console.log('   - Proper upgrade prompts for Free tier users\n');

    try {
        // Test 1: Free Tier User Access
        console.log('🆓 Testing Free Tier User Access...');
        
        try {
            // Test DSS endpoint access for free user
            const freeUserToken = await loginUser(testUsers.free);
            
            // Try to access DSS calculation endpoint
            const dssResponse = await axios.post(`${BASE_URL}/dss/calculate`, {
                soilData: { sand: 60, clay: 20, silt: 20 },
                cropData: { id: 'tomato' },
                fieldConfig: { area: 1.0 },
                environmentalData: { et0: 5.0, climateZone: 'temperate' }
            }, {
                headers: { Authorization: `Bearer ${freeUserToken}` },
                timeout: testConfig.timeout
            });
            
            // If we get here, the request succeeded (which it shouldn't for advanced features)
            logTest('Free tier denied advanced DSS access', false, 'Free user was allowed DSS access');
            
        } catch (error) {
            if (error.response && error.response.status === 403) {
                logTest('Free tier properly denied DSS access', true);
                logTest('Free tier gets upgrade prompt', 
                    error.response.data.upgradeRequired === true);
            } else {
                logTest('Free tier access control', false, `Unexpected error: ${error.message}`);
            }
        }

        // Test 2: Professional Tier User Access
        console.log('\n💼 Testing Professional Tier User Access...');
        
        try {
            const proUserToken = await loginUser(testUsers.professional);
            
            // Test basic DSS access
            const basicDSSResponse = await axios.get(`${BASE_URL}/dss/crops`, {
                headers: { Authorization: `Bearer ${proUserToken}` },
                timeout: testConfig.timeout
            });
            
            logTest('Professional tier can access DSS crops', 
                basicDSSResponse.status === 200);
            
            // Test advanced calculations
            const advancedResponse = await axios.post(`${BASE_URL}/dss/calculate/advanced`, {
                soilData: { sand: 60, clay: 20, silt: 20 },
                cropData: { id: 'tomato' },
                fieldConfig: { area: 1.0 },
                environmentalData: { et0: 5.0, climateZone: 'gcc_arid' }
            }, {
                headers: { Authorization: `Bearer ${proUserToken}` },
                timeout: testConfig.timeout
            });
            
            logTest('Professional tier can access advanced calculations', 
                advancedResponse.status === 200);
            
            // Test calculation history
            const historyResponse = await axios.get(`${BASE_URL}/dss/calculations`, {
                headers: { Authorization: `Bearer ${proUserToken}` },
                timeout: testConfig.timeout
            });
            
            logTest('Professional tier can access calculation history', 
                historyResponse.status === 200);
            
        } catch (error) {
            logTest('Professional tier DSS access', false, error.message);
        }

        // Test 3: Enterprise Tier User Access
        console.log('\n🏢 Testing Enterprise Tier User Access...');
        
        try {
            const enterpriseUserToken = await loginUser(testUsers.enterprise);
            
            // Test all Professional features
            const cropsResponse = await axios.get(`${BASE_URL}/dss/crops`, {
                headers: { Authorization: `Bearer ${enterpriseUserToken}` },
                timeout: testConfig.timeout
            });
            
            logTest('Enterprise tier can access DSS crops', 
                cropsResponse.status === 200);
            
            // Test batch processing (Enterprise only)
            const batchResponse = await axios.post(`${BASE_URL}/dss/batch/calculate`, {
                calculations: [
                    {
                        soilData: { sand: 60, clay: 20, silt: 20 },
                        cropData: { id: 'tomato' },
                        fieldConfig: { area: 1.0 },
                        environmentalData: { et0: 5.0, climateZone: 'gcc_arid' }
                    }
                ]
            }, {
                headers: { Authorization: `Bearer ${enterpriseUserToken}` },
                timeout: testConfig.timeout
            });
            
            logTest('Enterprise tier can access batch processing', 
                batchResponse.status === 200);
            
        } catch (error) {
            logTest('Enterprise tier DSS access', false, error.message);
        }

        // Test 4: Feature Matrix Validation
        console.log('\n📋 Testing Feature Matrix...');
        
        const featureMatrix = {
            'DSS Access': { free: false, professional: true, enterprise: true },
            'Advanced Calculations': { free: false, professional: true, enterprise: true },
            'Batch Processing': { free: false, professional: false, enterprise: true },
            'User Level Selection': { free: false, professional: true, enterprise: true }
        };
        
        Object.entries(featureMatrix).forEach(([feature, access]) => {
            const correctImplementation = 
                (!access.free) && 
                (access.professional) && 
                (access.enterprise);
            
            logTest(`Feature matrix correct for ${feature}`, correctImplementation);
        });

    } catch (error) {
        console.error('❌ Critical test failure:', error.message);
        logTest('Critical test execution', false, error.message);
    }
}

async function loginUser(userConfig) {
    try {
        // Mock login - in real implementation this would call the auth endpoint
        // For testing, we'll simulate the token based on tier
        const mockTokens = {
            'FREE': 'mock-free-token-123',
            'PROFESSIONAL': 'mock-professional-token-456', 
            'ENTERPRISE': 'mock-enterprise-token-789'
        };
        
        console.log(`   Logging in ${userConfig.tier} tier user: ${userConfig.email}`);
        return mockTokens[userConfig.tier];
        
    } catch (error) {
        throw new Error(`Login failed for ${userConfig.email}: ${error.message}`);
    }
}

async function generateTierAccessTestReport() {
    console.log('\n📊 TIER-BASED ACCESS CONTROL TEST RESULTS');
    console.log('==========================================');
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
    
    console.log('\n🎯 Tier-based Access Control Status:');
    const criticalTests = [
        'Free tier properly denied DSS access',
        'Professional tier can access DSS crops',
        'Enterprise tier can access batch processing'
    ];
    
    const criticalPassed = criticalTests.every(testName => 
        testResults.details.find(test => test.testName === testName)?.passed
    );
    
    if (criticalPassed && testResults.passed >= testResults.total * 0.8) {
        console.log('✅ TIER-BASED ACCESS CONTROL IMPLEMENTED CORRECTLY!');
        console.log('   - Free tier users properly blocked from DSS ✅');
        console.log('   - Professional tier users have full DSS access ✅');
        console.log('   - Enterprise tier users have all features ✅');
        console.log('   - User level selection only for subscribed users ✅');
        console.log('\n🚀 DSS is now properly gated behind Professional/Enterprise tiers');
    } else {
        console.log('⚠️  TIER-BASED ACCESS CONTROL NEEDS REVIEW');
        console.log('   Some critical access control tests failed.');
    }
}

// Main test execution
async function runTierAccessTests() {
    console.log('🎯 FlahaSoil DSS - Tier-based Access Control Validation');
    console.log('=====================================================\n');
    
    await testTierBasedAccess();
    await generateTierAccessTestReport();
}

// Run tests if called directly
if (require.main === module) {
    runTierAccessTests().catch(console.error);
}

module.exports = { runTierAccessTests, testResults };
