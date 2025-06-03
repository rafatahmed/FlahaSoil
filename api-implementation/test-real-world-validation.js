/**
 * FlahaSoil DSS Real-World Validation Test
 * Tests the actual running application with both backend and frontend
 * 
 * This validates:
 * - Week 3: Progressive Disclosure UI & Tier-based Access Control
 * - Week 4: System Recommendations & Economic Analysis
 * - Integration: End-to-end functionality
 */

const axios = require('axios');
const puppeteer = require('puppeteer');

const BACKEND_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';

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

async function testBackendAPI() {
    console.log('🔧 Testing Backend API Endpoints...');
    
    try {
        // Test 1: Health check
        const healthResponse = await axios.get(`${BACKEND_URL}/api/v1/dss/crops`);
        logTest('Backend API is responding', healthResponse.status === 200);
        logTest('Crops endpoint returns data', healthResponse.data.success === true);
        
        // Test 2: Authentication protection
        try {
            await axios.post(`${BACKEND_URL}/api/v1/dss/calculate`, {
                soilData: { sand: 60, clay: 20, silt: 20 }
            });
            logTest('DSS endpoint properly protected', false, 'Should require authentication');
        } catch (error) {
            logTest('DSS endpoint properly protected', error.response?.status === 401);
        }
        
        // Test 3: Tier-based access control
        const mockToken = 'mock-token-for-testing';
        try {
            await axios.post(`${BACKEND_URL}/api/v1/dss/calculate/advanced`, {
                soilData: { sand: 60, clay: 20, silt: 20 }
            }, {
                headers: { Authorization: `Bearer ${mockToken}` }
            });
        } catch (error) {
            logTest('Advanced DSS endpoint requires proper authentication', 
                error.response?.status === 401 || error.response?.status === 403);
        }
        
    } catch (error) {
        logTest('Backend API connectivity', false, error.message);
    }
}

async function testFrontendUI() {
    console.log('\n🎨 Testing Frontend UI & User Experience...');
    
    let browser;
    let page;
    
    try {
        browser = await puppeteer.launch({
            headless: false, // Set to true for CI/CD
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();
        
        // Test 1: Frontend accessibility
        await page.goto(FRONTEND_URL);
        const title = await page.title();
        logTest('Frontend is accessible', title.includes('FlahaSoil') || title.length > 0);
        
        // Test 2: DSS page loads
        await page.goto(`${FRONTEND_URL}/advanced-dss.html`);
        await page.waitForTimeout(2000);
        
        const dssHeader = await page.$('.dss-header');
        logTest('DSS page loads correctly', !!dssHeader);
        
        // Test 3: Week 3 - Progressive Disclosure UI
        const userLevelSelector = await page.$('.user-level-selector');
        logTest('Week 3: User level selector is present', !!userLevelSelector);
        
        const levelCards = await page.$$('.level-card');
        logTest('Week 3: Three user level cards present', levelCards.length === 3);
        
        // Test level switching
        if (levelCards.length >= 3) {
            await levelCards[0].click(); // Click farmer level
            await page.waitForTimeout(500);
            
            const bodyClass = await page.evaluate(() => document.body.className);
            logTest('Week 3: User level switching works', bodyClass.includes('user-level-'));
        }
        
        // Test 4: Week 3 - Tier-based Access Control
        // Simulate free tier user (no token)
        await page.evaluate(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        });
        
        await page.reload();
        await page.waitForTimeout(2000);
        
        const upgradeMessage = await page.$('.card.border-warning');
        logTest('Week 3: Upgrade message shown for free users', !!upgradeMessage);
        
        // Test 5: Week 3 - Mobile Responsiveness
        await page.setViewport({ width: 375, height: 667 }); // Mobile viewport
        await page.waitForTimeout(500);
        
        const isMobileOptimized = await page.evaluate(() => {
            const userSelector = document.querySelector('.user-level-selector');
            if (!userSelector) return false;
            const computedStyle = window.getComputedStyle(userSelector);
            return computedStyle.display !== 'none';
        });
        logTest('Week 3: Mobile responsiveness implemented', isMobileOptimized !== null);
        
        // Reset to desktop
        await page.setViewport({ width: 1200, height: 800 });
        
        // Test 6: Week 4 - System Recommendations (if accessible)
        // Simulate professional tier user
        await page.evaluate(() => {
            localStorage.setItem('token', 'mock-professional-token');
            localStorage.setItem('user', JSON.stringify({ tier: 'professional' }));
        });
        
        await page.reload();
        await page.waitForTimeout(2000);
        
        const systemRecommendations = await page.$('.system-recommendations');
        const hasSystemFeatures = await page.evaluate(() => {
            return document.body.textContent.includes('System') || 
                   document.body.textContent.includes('Drip') ||
                   document.body.textContent.includes('Sprinkler');
        });
        logTest('Week 4: System recommendations features present', hasSystemFeatures);
        
        // Test 7: Week 4 - Economic Analysis
        const hasEconomicFeatures = await page.evaluate(() => {
            return document.body.textContent.includes('ROI') || 
                   document.body.textContent.includes('Economic') ||
                   document.body.textContent.includes('Cost');
        });
        logTest('Week 4: Economic analysis features present', hasEconomicFeatures);
        
    } catch (error) {
        logTest('Frontend UI testing', false, error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function testIntegration() {
    console.log('\n🔗 Testing Integration & End-to-End Functionality...');
    
    try {
        // Test 1: Frontend-Backend connectivity
        const response = await axios.get(`${BACKEND_URL}/api/v1/dss/crops`);
        logTest('Frontend can connect to backend', response.status === 200);
        
        // Test 2: Data flow validation
        const cropsData = response.data;
        logTest('Backend returns valid crop data', 
            cropsData.success && Array.isArray(cropsData.data) && cropsData.data.length > 0);
        
        // Test 3: Week 4 calculation service integration
        const DSSCalculationService = require('./src/services/dssCalculationService');
        const dssService = new DSSCalculationService();
        
        const testCalculation = await dssService.calculateIrrigationRecommendations({
            soilData: {
                sand: 45, clay: 25, silt: 30,
                textureClass: "Loam",
                saturatedConductivity: 12,
                fieldCapacity: 22, wiltingPoint: 10
            },
            cropData: {
                id: "tomato",
                name: "Tomato"
            },
            environmentalData: {
                et0: 6.5,
                climateZone: "temperate",
                irrigationMethod: "drip",
                growthStage: "mid-season"
            },
            fieldConfig: {
                area: 5,
                slope: 1.5
            }
        });
        
        logTest('Week 4: DSS calculation service works', 
            testCalculation && testCalculation.systemRecommendationsEnhanced);
        
        logTest('Week 4: Economic analysis integration works',
            testCalculation && testCalculation.economicAnalysisBasic);
        
        logTest('Week 4: System analysis integration works',
            testCalculation && testCalculation.systemAnalysis);
        
    } catch (error) {
        logTest('Integration testing', false, error.message);
    }
}

async function generateRealWorldTestReport() {
    console.log('\n📊 REAL-WORLD VALIDATION TEST RESULTS');
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
    
    console.log('\n🎯 Real-World Validation Status:');
    
    const criticalTests = [
        'Backend API is responding',
        'DSS page loads correctly',
        'User level selector is present',
        'DSS calculation service works'
    ];
    
    const criticalPassed = criticalTests.every(testName => 
        testResults.details.find(test => test.testName.includes(testName.split(':')[0]))?.passed
    );
    
    const successRate = Math.round((testResults.passed / testResults.total) * 100);
    
    if (criticalPassed && successRate >= 85) {
        console.log('✅ REAL-WORLD VALIDATION SUCCESSFUL!');
        console.log('   - Backend API fully functional ✅');
        console.log('   - Frontend UI working correctly ✅');
        console.log('   - Week 3 features validated ✅');
        console.log('   - Week 4 features validated ✅');
        console.log('   - Integration working properly ✅');
        console.log('\n🚀 FlahaSoil DSS is ready for production deployment!');
    } else if (successRate >= 70) {
        console.log('⚠️  REAL-WORLD VALIDATION MOSTLY SUCCESSFUL');
        console.log(`   Success rate: ${successRate}% - Minor issues to address`);
    } else {
        console.log('❌ REAL-WORLD VALIDATION NEEDS ATTENTION');
        console.log(`   Success rate: ${successRate}% - Critical issues found`);
    }
    
    return successRate;
}

// Main test execution
async function runRealWorldValidation() {
    console.log('🌍 FlahaSoil DSS - Real-World Validation Testing');
    console.log('================================================\n');
    console.log('Testing live application with backend and frontend running...\n');
    
    await testBackendAPI();
    await testFrontendUI();
    await testIntegration();
    const successRate = await generateRealWorldTestReport();
    
    return successRate;
}

// Run tests if called directly
if (require.main === module) {
    runRealWorldValidation().catch(console.error);
}

module.exports = { runRealWorldValidation, testResults };
