/**
 * Basic FlahaSoil Report Testing
 * Simple tests to verify core report functionality
 */

const fs = require('fs').promises;
const path = require('path');

// Import report service for testing
let ReportService;
try {
    ReportService = require('../api-implementation/src/services/reportService');
} catch (error) {
    ReportService = require('./src/services/reportService');
}

class BasicReportTester {
    constructor() {
        this.reportService = new ReportService();
        this.testOutputDir = path.join(__dirname, 'test-outputs');
    }

    /**
     * Initialize test environment
     */
    async initialize() {
        try {
            await fs.mkdir(this.testOutputDir, { recursive: true });
            console.log(`📁 Test output directory ready: ${this.testOutputDir}`);
        } catch (error) {
            console.error('Failed to create test output directory:', error);
        }
    }

    /**
     * Test HTML generation
     */
    async testHTMLGeneration() {
        console.log('\n📝 Testing HTML Generation...');
        console.log('─'.repeat(40));

        try {
            const testSoilData = {
                sand: 40,
                clay: 30,
                silt: 30,
                organicMatter: 2.5,
                densityFactor: 1.0,
                textureClass: 'clay loam',
                fieldCapacity: 0.32,
                wiltingPoint: 0.18,
                plantAvailableWater: 0.14,
                saturation: 0.45,
                saturatedConductivity: 2.5
            };

            const testUser = {
                id: 'test-user-123',
                name: 'Test User',
                email: 'test@example.com',
                plan: 'PROFESSIONAL'
            };

            // Test standard HTML generation
            console.log('  ✓ Generating standard report HTML...');
            const htmlContent = this.reportService.generateStandardReportHTML(testSoilData, testUser);

            // Validate HTML content
            if (!htmlContent || htmlContent.length === 0) {
                throw new Error('HTML content is empty');
            }

            if (!htmlContent.includes('<!DOCTYPE html>')) {
                throw new Error('Invalid HTML structure - missing DOCTYPE');
            }

            if (!htmlContent.includes('FlahaSoil Analysis Report')) {
                throw new Error('HTML missing expected title');
            }

            // Save HTML for inspection
            const htmlPath = path.join(this.testOutputDir, `test-standard-report-${Date.now()}.html`);
            await fs.writeFile(htmlPath, htmlContent);

            console.log(`  ✅ Standard HTML generated successfully (${htmlContent.length} characters)`);
            console.log(`  📁 HTML saved: ${htmlPath}`);

            // Test custom HTML generation
            console.log('  ✓ Generating custom report HTML...');
            const customOptions = {
                companyName: 'Test Company',
                primaryColor: '#1e3a8a',
                secondaryColor: '#059669',
                includeRecommendations: true
            };

            const customHtmlContent = this.reportService.generateCustomReportHTML(testSoilData, testUser, customOptions);

            if (!customHtmlContent || customHtmlContent.length === 0) {
                throw new Error('Custom HTML content is empty');
            }

            if (!customHtmlContent.includes('Test Company')) {
                throw new Error('Custom HTML missing company name');
            }

            // Save custom HTML for inspection
            const customHtmlPath = path.join(this.testOutputDir, `test-custom-report-${Date.now()}.html`);
            await fs.writeFile(customHtmlPath, customHtmlContent);

            console.log(`  ✅ Custom HTML generated successfully (${customHtmlContent.length} characters)`);
            console.log(`  📁 Custom HTML saved: ${customHtmlPath}`);

            return true;
        } catch (error) {
            console.error(`  ❌ HTML Generation Test Failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test browser initialization
     */
    async testBrowserInit() {
        console.log('\n🌐 Testing Browser Initialization...');
        console.log('─'.repeat(40));

        try {
            console.log('  ✓ Initializing browser...');
            const browser = await this.reportService.initBrowser();

            if (!browser) {
                throw new Error('Browser initialization failed');
            }

            console.log('  ✅ Browser initialized successfully');

            // Test page creation
            console.log('  ✓ Creating test page...');
            const page = await browser.newPage();

            if (!page) {
                throw new Error('Page creation failed');
            }

            console.log('  ✅ Page created successfully');

            // Test basic HTML rendering
            console.log('  ✓ Testing HTML rendering...');
            const testHTML = `
                <!DOCTYPE html>
                <html>
                <head><title>Test</title></head>
                <body><h1>Test Report</h1><p>This is a test.</p></body>
                </html>
            `;

            await page.setContent(testHTML);
            const title = await page.title();

            if (title !== 'Test') {
                throw new Error('HTML rendering failed - incorrect title');
            }

            console.log('  ✅ HTML rendering working correctly');

            // Cleanup
            await page.close();
            await this.reportService.closeBrowser();

            console.log('  ✅ Browser cleanup completed');

            return true;
        } catch (error) {
            console.error(`  ❌ Browser Initialization Test Failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test simple PDF generation
     */
    async testSimplePDFGeneration() {
        console.log('\n📄 Testing Simple PDF Generation...');
        console.log('─'.repeat(40));

        try {
            const testSoilData = {
                sand: 40,
                clay: 30,
                silt: 30,
                organicMatter: 2.5,
                densityFactor: 1.0,
                textureClass: 'clay loam',
                fieldCapacity: 32,
                wiltingPoint: 18,
                plantAvailableWater: 14,
                saturation: 45,
                saturatedConductivity: 2.5
            };

            const testUser = {
                id: 'test-user-123',
                name: 'Test User',
                email: 'test@example.com',
                plan: 'PROFESSIONAL'
            };

            console.log('  ✓ Generating PDF report...');
            const startTime = Date.now();
            
            const pdfBuffer = await this.reportService.generateStandardReport(testSoilData, testUser);
            
            const generationTime = Date.now() - startTime;

            // Validate PDF buffer
            if (!pdfBuffer || pdfBuffer.length === 0) {
                throw new Error('PDF buffer is empty or null');
            }

            console.log(`  ✅ PDF generated successfully (${pdfBuffer.length} bytes, ${generationTime}ms)`);

            // Check if it's a valid PDF (starts with %PDF)
            const pdfHeader = pdfBuffer.slice(0, 4).toString();
            if (pdfHeader === '%PDF') {
                console.log('  ✅ Valid PDF format confirmed');
            } else {
                console.log(`  ⚠️ PDF header check: ${pdfHeader} (expected %PDF)`);
                // Save buffer for inspection even if header is unexpected
            }

            // Save PDF for manual inspection
            const pdfPath = path.join(this.testOutputDir, `test-simple-report-${Date.now()}.pdf`);
            await fs.writeFile(pdfPath, pdfBuffer);
            console.log(`  📁 PDF saved: ${pdfPath}`);

            return true;
        } catch (error) {
            console.error(`  ❌ Simple PDF Generation Test Failed: ${error.message}`);
            console.error('  📋 Error details:', error.stack);
            return false;
        }
    }

    /**
     * Test report service methods
     */
    async testReportServiceMethods() {
        console.log('\n🔧 Testing Report Service Methods...');
        console.log('─'.repeat(40));

        try {
            const testSoilData = {
                sand: 35,
                clay: 25,
                silt: 40,
                organicMatter: 3.0,
                plantAvailableWater: 12,
                saturatedConductivity: 3.5
            };

            // Test soil assessment generation
            console.log('  ✓ Testing soil assessment generation...');
            const assessment = this.reportService.generateSoilAssessment(testSoilData);
            
            if (!assessment || typeof assessment !== 'string') {
                throw new Error('Soil assessment generation failed');
            }

            console.log(`  ✅ Soil assessment: "${assessment}"`);

            // Test recommendations generation
            console.log('  ✓ Testing recommendations generation...');
            const recommendations = this.reportService.generateRecommendations(testSoilData);
            
            if (!recommendations || typeof recommendations !== 'string') {
                throw new Error('Recommendations generation failed');
            }

            console.log(`  ✅ Recommendations generated (${recommendations.length} characters)`);

            return true;
        } catch (error) {
            console.error(`  ❌ Report Service Methods Test Failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Run all basic tests
     */
    async runAllTests() {
        console.log('🚀 Starting FlahaSoil Basic Report Testing...\n');
        console.log('═'.repeat(60));

        await this.initialize();

        const tests = [
            { name: 'HTML Generation', test: () => this.testHTMLGeneration() },
            { name: 'Browser Initialization', test: () => this.testBrowserInit() },
            { name: 'Report Service Methods', test: () => this.testReportServiceMethods() },
            { name: 'Simple PDF Generation', test: () => this.testSimplePDFGeneration() }
        ];

        const results = [];
        let allPassed = true;

        for (const { name, test } of tests) {
            const startTime = Date.now();
            const passed = await test();
            const duration = Date.now() - startTime;
            
            results.push({ name, passed, duration });
            if (!passed) allPassed = false;
        }

        // Generate test report
        console.log('\n📋 BASIC TEST RESULTS');
        console.log('═'.repeat(60));
        
        results.forEach(result => {
            const status = result.passed ? '✅ PASSED' : '❌ FAILED';
            console.log(`${status} ${result.name} (${result.duration}ms)`);
        });

        console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        
        // Cleanup
        try {
            await this.reportService.closeBrowser();
        } catch (error) {
            console.log('Browser cleanup completed');
        }
        
        return allPassed;
    }
}

// Export for use in other test files
module.exports = BasicReportTester;

// Run tests if called directly
if (require.main === module) {
    const tester = new BasicReportTester();
    tester.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Basic test suite crashed:', error);
            process.exit(1);
        });
}
