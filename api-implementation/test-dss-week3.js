/**
 * FlahaSoil DSS Week 3 Testing Script
 * Tests Week 3 enhancements: User Interface & Experience
 * 
 * Week 3 Features:
 * - Progressive Disclosure UI (farmer/designer/consultant levels)
 * - Interactive Components (crop selection, field config, results dashboard)
 * - Mobile Responsiveness optimization
 * - Enhanced user experience features
 * - Role-based feature visibility
 */

const axios = require('axios');
const puppeteer = require('puppeteer');

const BASE_URL = 'http://localhost:3000';

// Test configuration
const testConfig = {
    baseURL: BASE_URL,
    timeout: 15000,
    headless: false // Set to true for CI/CD
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

async function testWeek3UIEnhancements() {
    console.log('🚀 Starting FlahaSoil DSS Week 3 Testing...\n');
    console.log('📊 Testing Week 3 Features:');
    console.log('   - Progressive Disclosure UI');
    console.log('   - Interactive Components');
    console.log('   - Mobile Responsiveness');
    console.log('   - Enhanced User Experience\n');

    let browser;
    let page;

    try {
        // Launch browser for UI testing
        browser = await puppeteer.launch({
            headless: testConfig.headless,
            defaultViewport: { width: 1200, height: 800 }
        });
        page = await browser.newPage();

        // Test 1: Progressive Disclosure UI
        console.log('🎯 Testing Progressive Disclosure UI...');
        await page.goto(`${BASE_URL}/advanced-dss.html`);
        
        // Check if user level selector exists
        const userLevelSelector = await page.$('.user-level-selector');
        logTest('User level selector is present', !!userLevelSelector);

        // Test level switching
        const levelCards = await page.$$('.level-card');
        logTest('Three user level cards are present', levelCards.length === 3);

        // Test farmer level
        await page.click('[data-level="farmer"]');
        await page.waitForTimeout(500);
        const farmerClass = await page.evaluate(() => document.body.classList.contains('user-level-farmer'));
        logTest('Farmer level activation works', farmerClass);

        // Test designer level
        await page.click('[data-level="designer"]');
        await page.waitForTimeout(500);
        const designerClass = await page.evaluate(() => document.body.classList.contains('user-level-designer'));
        logTest('Designer level activation works', designerClass);

        // Test consultant level
        await page.click('[data-level="consultant"]');
        await page.waitForTimeout(500);
        const consultantClass = await page.evaluate(() => document.body.classList.contains('user-level-consultant'));
        logTest('Consultant level activation works', consultantClass);

        // Test 2: Role-based Feature Visibility
        console.log('\n🔍 Testing Role-based Feature Visibility...');
        
        // Check consultant-only features are visible
        const advancedConfig = await page.$('.advanced-field-config');
        const isAdvancedVisible = await page.evaluate(el => {
            return el && window.getComputedStyle(el).display !== 'none';
        }, advancedConfig);
        logTest('Advanced configuration visible for consultant', isAdvancedVisible);

        // Switch to farmer level and check visibility
        await page.click('[data-level="farmer"]');
        await page.waitForTimeout(500);
        const isAdvancedHidden = await page.evaluate(el => {
            return !el || window.getComputedStyle(el).display === 'none';
        }, advancedConfig);
        logTest('Advanced configuration hidden for farmer', isAdvancedHidden);

        // Test 3: Interactive Crop Search
        console.log('\n🌱 Testing Interactive Crop Search...');
        
        // Switch back to designer level for search functionality
        await page.click('[data-level="designer"]');
        await page.waitForTimeout(500);

        const cropSearch = await page.$('#crop-search');
        logTest('Crop search input is present', !!cropSearch);

        if (cropSearch) {
            // Test search functionality
            await page.type('#crop-search', 'tom');
            await page.waitForTimeout(1000);
            
            const searchResults = await page.$('#crop-search-results');
            const isResultsVisible = await page.evaluate(el => {
                return el && window.getComputedStyle(el).display !== 'none';
            }, searchResults);
            logTest('Search results appear on typing', isResultsVisible);

            // Test search result selection
            const firstResult = await page.$('.search-result-item');
            if (firstResult) {
                await firstResult.click();
                const searchValue = await page.$eval('#crop-search', el => el.value);
                logTest('Crop selection from search works', searchValue.length > 0);
            }
        }

        // Test 4: Mobile Responsiveness
        console.log('\n📱 Testing Mobile Responsiveness...');
        
        // Test mobile viewport
        await page.setViewport({ width: 375, height: 667 }); // iPhone SE
        await page.waitForTimeout(500);

        // Check if mobile optimizations are applied
        const isMobileOptimized = await page.evaluate(() => {
            const userSelector = document.querySelector('.user-level-selector');
            const computedStyle = window.getComputedStyle(userSelector);
            return computedStyle.padding === '12px'; // 0.75rem converted to px
        });
        logTest('Mobile CSS optimizations applied', isMobileOptimized);

        // Test touch-friendly elements
        const buttonHeight = await page.evaluate(() => {
            const btn = document.querySelector('.btn');
            return btn ? window.getComputedStyle(btn).minHeight : '0px';
        });
        logTest('Touch-friendly button sizing', buttonHeight === '44px' || buttonHeight.includes('44'));

        // Test tablet viewport
        await page.setViewport({ width: 768, height: 1024 }); // iPad
        await page.waitForTimeout(500);

        const isTabletOptimized = await page.evaluate(() => {
            const levelCards = document.querySelectorAll('.level-card');
            return levelCards.length > 0 && levelCards[0].offsetWidth > 200;
        });
        logTest('Tablet layout optimization works', isTabletOptimized);

        // Test 5: Form Complexity Adaptation
        console.log('\n⚙️ Testing Form Complexity Adaptation...');
        
        // Reset to desktop viewport
        await page.setViewport({ width: 1200, height: 800 });
        await page.waitForTimeout(500);

        // Test farmer level simplification
        await page.click('[data-level="farmer"]');
        await page.waitForTimeout(500);

        const farmerOptions = await page.evaluate(() => {
            const climateSelect = document.getElementById('climate-zone');
            const visibleOptions = Array.from(climateSelect.options).filter(option => 
                option.style.display !== 'none' && option.className.includes('farmer-only')
            );
            return visibleOptions.length;
        });
        logTest('Farmer level shows simplified options', farmerOptions > 0);

        // Test consultant level complexity
        await page.click('[data-level="consultant"]');
        await page.waitForTimeout(500);

        const consultantOptions = await page.evaluate(() => {
            const climateSelect = document.getElementById('climate-zone');
            const visibleOptions = Array.from(climateSelect.options).filter(option => 
                option.style.display !== 'none' && option.className.includes('consultant-only')
            );
            return visibleOptions.length;
        });
        logTest('Consultant level shows detailed options', consultantOptions > 0);

        // Test 6: FlahaCalc Integration Button
        console.log('\n🌡️ Testing FlahaCalc Integration...');
        
        const flahacalcButton = await page.$('button[onclick="fetchFlahaCalcET0()"]');
        logTest('FlahaCalc fetch button is present for consultant', !!flahacalcButton);

        if (flahacalcButton) {
            const et0ValueBefore = await page.$eval('#et0-value', el => el.value);
            await flahacalcButton.click();
            await page.waitForTimeout(2000);
            
            const et0ValueAfter = await page.$eval('#et0-value', el => el.value);
            logTest('FlahaCalc button updates ET0 value', et0ValueAfter !== et0ValueBefore);
        }

        // Test 7: Performance and Accessibility
        console.log('\n⚡ Testing Performance and Accessibility...');
        
        // Test page load performance
        const performanceMetrics = await page.evaluate(() => {
            const navigation = performance.getEntriesByType('navigation')[0];
            return {
                loadTime: navigation.loadEventEnd - navigation.loadEventStart,
                domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart
            };
        });
        
        logTest('Page loads within 3 seconds', performanceMetrics.loadTime < 3000);
        logTest('DOM content loads within 1 second', performanceMetrics.domContentLoaded < 1000);

        // Test keyboard navigation
        await page.keyboard.press('Tab');
        const focusedElement = await page.evaluate(() => document.activeElement.tagName);
        logTest('Keyboard navigation works', focusedElement !== 'BODY');

    } catch (error) {
        console.error('❌ Critical test failure:', error.message);
        logTest('Critical test execution', false, error.message);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function generateWeek3TestReport() {
    console.log('\n📊 WEEK 3 TEST RESULTS SUMMARY');
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
    
    console.log('\n🎯 Week 3 Status:');
    const criticalTests = [
        'User level selector is present',
        'Progressive disclosure UI works',
        'Mobile CSS optimizations applied',
        'Interactive crop search works'
    ];
    
    const criticalPassed = criticalTests.every(testName => 
        testResults.details.find(test => test.testName.includes(testName.split(' ')[0]))?.passed
    );
    
    if (criticalPassed && testResults.passed >= testResults.total * 0.8) {
        console.log('✅ WEEK 3 OBJECTIVES COMPLETED SUCCESSFULLY!');
        console.log('   - Progressive Disclosure UI (farmer/designer/consultant) ✅');
        console.log('   - Interactive Components (crop search, field config) ✅');
        console.log('   - Mobile Responsiveness optimization ✅');
        console.log('   - Enhanced user experience features ✅');
        console.log('   - Role-based feature visibility ✅');
        console.log('\n🚀 Ready to proceed to Week 4: Basic Features & Testing');
    } else {
        console.log('⚠️  WEEK 3 OBJECTIVES PARTIALLY COMPLETED');
        console.log('   Some critical tests failed. Review and fix before proceeding.');
    }
}

// Main test execution
async function runWeek3Tests() {
    console.log('🎯 FlahaSoil DSS Week 3 - User Interface & Experience');
    console.log('====================================================\n');
    
    await testWeek3UIEnhancements();
    await generateWeek3TestReport();
}

// Run tests if called directly
if (require.main === module) {
    runWeek3Tests().catch(console.error);
}

module.exports = { runWeek3Tests, testResults };
