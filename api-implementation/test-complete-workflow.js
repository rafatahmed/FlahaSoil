/**
 * Complete FlahaSoil Report Workflow Test
 * Tests the entire tier-based report generation workflow
 * @format
 */

const puppeteer = require('puppeteer');
const path = require('path');

async function testCompleteWorkflow() {
    console.log('🧪 FlahaSoil Complete Report Workflow Test');
    console.log('═'.repeat(60));
    
    const browser = await puppeteer.launch({ 
        headless: false, // Show browser for visual verification
        defaultViewport: { width: 1200, height: 800 }
    });
    
    try {
        const page = await browser.newPage();
        
        // Step 1: Navigate to the application
        console.log('🌐 Step 1: Loading FlahaSoil application...');
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle0' });
        
        // Step 2: Check if user is logged in
        console.log('🔐 Step 2: Checking authentication status...');
        
        const userToken = await page.evaluate(() => {
            return localStorage.getItem('flahasoil_token');
        });
        
        const userData = await page.evaluate(() => {
            const userStr = localStorage.getItem('flahasoil_user');
            return userStr ? JSON.parse(userStr) : null;
        });
        
        if (!userToken || !userData) {
            console.log('❌ User not logged in. Please log in first.');
            console.log('💡 Navigate to the app and log in with a Professional/Enterprise account');
            return;
        }
        
        console.log(`✅ User authenticated: ${userData.email} (${userData.tier})`);
        
        // Step 3: Check tier-based access
        console.log('🎯 Step 3: Checking tier-based report access...');
        
        if (userData.tier === 'FREE') {
            console.log('❌ FREE tier user - report features should be hidden');
            
            // Check that report buttons are hidden
            const reportControls = await page.$('#reportControls');
            const isHidden = await page.evaluate(el => {
                return el ? el.style.display === 'none' : true;
            }, reportControls);
            
            console.log(`📊 Report controls hidden: ${isHidden}`);
            return;
        }
        
        console.log(`✅ ${userData.tier} tier - report features should be available`);
        
        // Step 4: Perform soil analysis to enable report buttons
        console.log('🔬 Step 4: Performing soil analysis...');
        
        // Fill in soil data
        await page.type('#sand', '40');
        await page.type('#clay', '30');
        await page.type('#silt', '30');
        await page.type('#organicMatter', '2.5');
        
        // Click update analysis button
        await page.click('#update-point-btn');
        
        // Wait for analysis to complete
        await page.waitForSelector('.success-message', { timeout: 10000 });
        console.log('✅ Soil analysis completed successfully');
        
        // Step 5: Check if report buttons appear
        console.log('📄 Step 5: Checking report button visibility...');
        
        await page.waitForTimeout(1000); // Give time for UI updates
        
        const generateReportBtn = await page.$('#generate-report-btn');
        const printBtn = await page.$('#print-btn');
        const customReportBtn = await page.$('#custom-report-btn');
        
        const generateBtnVisible = await page.evaluate(el => {
            return el ? el.style.display !== 'none' : false;
        }, generateReportBtn);
        
        const printBtnVisible = await page.evaluate(el => {
            return el ? el.style.display !== 'none' : false;
        }, printBtn);
        
        const customBtnVisible = await page.evaluate(el => {
            return el ? el.style.display !== 'none' : false;
        }, customReportBtn);
        
        console.log(`📄 Generate PDF button visible: ${generateBtnVisible}`);
        console.log(`🖨️ Print button visible: ${printBtnVisible}`);
        console.log(`🎨 Custom report button visible: ${customBtnVisible}`);
        
        if (!generateBtnVisible) {
            console.log('❌ Generate PDF button not visible - checking capabilities...');
            
            const capabilities = await page.evaluate(async () => {
                const token = localStorage.getItem('flahasoil_token');
                const response = await fetch('http://localhost:3001/api/v1/reports/capabilities', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                return response.json();
            });
            
            console.log('📊 Report capabilities:', capabilities);
            return;
        }
        
        // Step 6: Test PDF generation
        console.log('📄 Step 6: Testing PDF generation...');
        
        // Set up response listener for PDF download
        const client = await page.target().createCDPSession();
        await client.send('Page.setDownloadBehavior', {
            behavior: 'allow',
            downloadPath: path.join(__dirname, 'debug-outputs')
        });
        
        // Click generate PDF button
        await page.click('#generate-report-btn');
        
        // Wait for PDF generation to complete
        await page.waitForSelector('.success-message', { timeout: 30000 });
        console.log('✅ PDF generation completed successfully');
        
        // Step 7: Check if print button appears after PDF generation
        console.log('🖨️ Step 7: Checking print button after PDF generation...');
        
        await page.waitForTimeout(1000);
        
        const printBtnVisibleAfterPDF = await page.evaluate(el => {
            return el ? el.style.display !== 'none' : false;
        }, printBtn);
        
        console.log(`🖨️ Print button visible after PDF: ${printBtnVisibleAfterPDF}`);
        
        // Step 8: Test print functionality
        if (printBtnVisibleAfterPDF) {
            console.log('🖨️ Step 8: Testing print functionality...');
            
            // Click print button (this will open print dialog)
            await page.click('#print-btn');
            
            // Wait a moment for print preparation
            await page.waitForTimeout(2000);
            console.log('✅ Print functionality triggered successfully');
        }
        
        console.log('\n🎉 Complete workflow test finished!');
        console.log('📊 Summary:');
        console.log(`   - User: ${userData.email} (${userData.tier})`);
        console.log(`   - PDF Generation: ${generateBtnVisible ? '✅' : '❌'}`);
        console.log(`   - Print Function: ${printBtnVisibleAfterPDF ? '✅' : '❌'}`);
        console.log(`   - Custom Reports: ${customBtnVisible ? '✅' : '❌'}`);
        
    } catch (error) {
        console.error('❌ Workflow test failed:', error);
    } finally {
        // Keep browser open for manual inspection
        console.log('\n🔍 Browser kept open for manual inspection...');
        console.log('Press Ctrl+C to close when done.');
    }
}

// Run the test
testCompleteWorkflow().catch(console.error);
