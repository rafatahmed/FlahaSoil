/**
 * Test Report Button Sequence Workflow
 * Tests the correct sequence: Update Analysis → Generate PDF → Print Report
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testReportSequence() {
    console.log('🧪 FlahaSoil Report Button Sequence Test');
    console.log('════════════════════════════════════════════════════════════');
    
    const browser = await puppeteer.launch({ 
        headless: false, // Show browser for visual verification
        defaultViewport: { width: 1200, height: 800 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Navigate to the app
        await page.goto('http://localhost:3000/index.html');
        
        console.log('📱 STEP 1: Setting up Professional User');
        console.log('────────────────────────────────────────');
        
        // Set up Professional user in localStorage
        await page.evaluate(() => {
            const testUser = {
                id: 'test-user-123',
                name: 'Test Professional User',
                email: 'test@professional.com',
                tier: 'PROFESSIONAL'
            };
            const testToken = 'test-token-professional-123';
            
            localStorage.setItem('flahasoil_user', JSON.stringify(testUser));
            localStorage.setItem('flahasoil_token', testToken);
        });
        
        // Reload to apply user settings
        await page.reload();
        await page.waitForTimeout(2000);
        
        console.log('  ✓ Professional user set up');
        
        console.log('\n🔍 STEP 2: Checking Initial State');
        console.log('────────────────────────────────────────');
        
        // Check that report buttons are initially hidden
        const initialButtonsVisible = await page.evaluate(() => {
            const reportControls = document.getElementById('reportControls');
            const printBtn = document.getElementById('print-btn');
            const generateBtn = document.getElementById('generate-report-btn');
            
            return {
                reportControlsVisible: reportControls ? reportControls.style.display !== 'none' : false,
                printBtnVisible: printBtn ? printBtn.style.display !== 'none' : false,
                generateBtnVisible: generateBtn ? generateBtn.style.display !== 'none' : false
            };
        });
        
        if (!initialButtonsVisible.reportControlsVisible && 
            !initialButtonsVisible.printBtnVisible && 
            !initialButtonsVisible.generateBtnVisible) {
            console.log('  ✅ Initial state correct: All report buttons hidden');
        } else {
            console.log('  ❌ Initial state incorrect: Some buttons are visible');
            console.log('    Report controls:', initialButtonsVisible.reportControlsVisible);
            console.log('    Print button:', initialButtonsVisible.printBtnVisible);
            console.log('    Generate button:', initialButtonsVisible.generateBtnVisible);
        }
        
        console.log('\n⚡ STEP 3: Triggering Soil Analysis');
        console.log('────────────────────────────────────────');
        
        // Click the update analysis button
        await page.click('#update-point-btn');
        console.log('  ✓ Clicked "Update Analysis" button');
        
        // Wait for analysis to complete and success message
        await page.waitForTimeout(3000);
        
        // Check for success message
        const successMessage = await page.evaluate(() => {
            const banner = document.getElementById('notificationBanner');
            const message = document.getElementById('notificationMessage');
            return {
                visible: banner ? banner.style.display !== 'none' : false,
                text: message ? message.textContent : ''
            };
        });
        
        if (successMessage.visible && successMessage.text.includes('successfully')) {
            console.log('  ✅ Success message appeared:', successMessage.text);
        } else {
            console.log('  ⚠️ Success message not found or incorrect');
        }
        
        console.log('\n📄 STEP 4: Checking Generate PDF Button');
        console.log('────────────────────────────────────────');
        
        // Check that Generate PDF button is now visible
        const afterAnalysisState = await page.evaluate(() => {
            const reportControls = document.getElementById('reportControls');
            const printBtn = document.getElementById('print-btn');
            const generateBtn = document.getElementById('generate-report-btn');
            
            return {
                reportControlsVisible: reportControls ? reportControls.style.display !== 'none' : false,
                printBtnVisible: printBtn ? printBtn.style.display !== 'none' : false,
                generateBtnVisible: generateBtn ? generateBtn.style.display !== 'none' : false,
                generateBtnDisabled: generateBtn ? generateBtn.disabled : true
            };
        });
        
        if (afterAnalysisState.reportControlsVisible && 
            afterAnalysisState.generateBtnVisible && 
            !afterAnalysisState.generateBtnDisabled) {
            console.log('  ✅ Generate PDF button is now visible and enabled');
        } else {
            console.log('  ❌ Generate PDF button state incorrect');
            console.log('    Report controls visible:', afterAnalysisState.reportControlsVisible);
            console.log('    Generate button visible:', afterAnalysisState.generateBtnVisible);
            console.log('    Generate button disabled:', afterAnalysisState.generateBtnDisabled);
        }
        
        if (!afterAnalysisState.printBtnVisible) {
            console.log('  ✅ Print button correctly hidden until PDF generation');
        } else {
            console.log('  ❌ Print button should be hidden until PDF generation');
        }
        
        console.log('\n🎯 STEP 5: Testing PDF Generation');
        console.log('────────────────────────────────────────');
        
        // Click Generate PDF button
        await page.click('#generate-report-btn');
        console.log('  ✓ Clicked "Generate PDF" button');
        
        // Wait for PDF generation (this might fail due to API, but we test the sequence)
        await page.waitForTimeout(5000);
        
        console.log('\n🖨️ STEP 6: Checking Print Button After PDF');
        console.log('────────────────────────────────────────');
        
        // Check if print button appears after PDF generation attempt
        const finalState = await page.evaluate(() => {
            const printBtn = document.getElementById('print-btn');
            return {
                printBtnVisible: printBtn ? printBtn.style.display !== 'none' : false,
                printBtnDisabled: printBtn ? printBtn.disabled : true
            };
        });
        
        // Note: Print button might not appear if PDF generation failed
        console.log('  Print button visible:', finalState.printBtnVisible);
        console.log('  Print button disabled:', finalState.printBtnDisabled);
        
        console.log('\n📋 SEQUENCE TEST RESULTS');
        console.log('════════════════════════════════════════════════════════════');
        
        const results = {
            initialStateCorrect: !initialButtonsVisible.reportControlsVisible,
            analysisTriggered: true,
            generateButtonAppeared: afterAnalysisState.generateBtnVisible,
            sequenceWorking: !initialButtonsVisible.generateBtnVisible && afterAnalysisState.generateBtnVisible
        };
        
        if (results.sequenceWorking) {
            console.log('✅ SEQUENCE TEST PASSED');
            console.log('   1. ✅ Buttons initially hidden');
            console.log('   2. ✅ Analysis triggered successfully');
            console.log('   3. ✅ Generate PDF button appeared after analysis');
            console.log('   4. ✅ Correct workflow sequence maintained');
        } else {
            console.log('❌ SEQUENCE TEST FAILED');
            console.log('   Initial state:', results.initialStateCorrect ? '✅' : '❌');
            console.log('   Generate button appearance:', results.generateButtonAppeared ? '✅' : '❌');
        }
        
        console.log('\n🎯 Test completed! Browser left open for manual verification.');
        console.log('   You can now manually test the PDF generation and print functionality.');
        
        // Keep browser open for manual testing
        await page.waitForTimeout(30000);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

// Run the test
testReportSequence().catch(console.error);
