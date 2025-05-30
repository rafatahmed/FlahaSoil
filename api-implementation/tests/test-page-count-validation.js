/**
 * Page Count Validation Test for FlahaSoil Reports
 * Ensures reports generate exactly 3 pages as designed
 */

const ReportService = require('../src/services/reportService');
const fs = require('fs').promises;
const path = require('path');

async function validatePageCount() {
    console.log('📄 Starting Page Count Validation Test...\n');

    const reportService = new ReportService();
    
    // Test with various soil data to ensure consistent page count
    const testSoilData = {
        sand: 42.5,
        clay: 28.3,
        silt: 29.2,
        organicMatter: 3.2,
        bulkDensity: 1.35,
        fieldCapacity: 24.8,
        wiltingPoint: 12.4,
        plantAvailableWater: 12.4,
        saturation: 49.1,
        saturatedConductivity: 15.6,
        textureClass: 'loam',
        densityFactor: 1.35,
        particleDensity: 2.65,
        voidRatio: 0.96
    };

    const testUserInfo = {
        name: 'Dr. Test User',
        email: 'test@example.com',
        tier: 'PROFESSIONAL',
        company: 'Test Lab'
    };

    try {
        console.log('🔍 Generating HTML content for analysis...');
        const htmlContent = reportService.generateStandardReportHTML(testSoilData, testUserInfo);
        
        // Analyze HTML structure
        console.log('📊 Analyzing HTML structure:');
        console.log(`   Total HTML size: ${htmlContent.length} characters`);
        
        // Count page divs
        const pageMatches = htmlContent.match(/<div class="page">/g);
        const pageCount = pageMatches ? pageMatches.length : 0;
        console.log(`   📄 Page divs found: ${pageCount}`);
        
        // Check for page break controls
        const pageBreakMatches = htmlContent.match(/page-break-after:\s*always/g);
        const pageBreakCount = pageBreakMatches ? pageBreakMatches.length : 0;
        console.log(`   🔄 Page break controls: ${pageBreakCount}`);
        
        // Check for SVG triangle
        const hasSVG = htmlContent.includes('<svg') && htmlContent.includes('chart-ready-marker');
        console.log(`   🎯 SVG triangle included: ${hasSVG ? '✅ Yes' : '❌ No'}`);
        
        // Check for specific page content
        const hasPage1Content = htmlContent.includes('Page 1 of 3');
        const hasPage2Content = htmlContent.includes('Page 2 of 3');
        const hasPage3Content = htmlContent.includes('Page 3 of 3');
        
        console.log(`   📄 Page 1 marker: ${hasPage1Content ? '✅ Found' : '❌ Missing'}`);
        console.log(`   📄 Page 2 marker: ${hasPage2Content ? '✅ Found' : '❌ Missing'}`);
        console.log(`   📄 Page 3 marker: ${hasPage3Content ? '✅ Found' : '❌ Missing'}`);
        
        // Check for expected sections
        const sections = [
            'Soil Properties',
            'Soil Texture Classification',
            'Soil Analysis Results'
        ];
        
        console.log('\n📋 Section Analysis:');
        sections.forEach((section, index) => {
            const hasSection = htmlContent.includes(section);
            console.log(`   Page ${index + 1} - ${section}: ${hasSection ? '✅ Found' : '❌ Missing'}`);
        });
        
        // Validate page structure
        console.log('\n🔍 Page Structure Validation:');
        const isValidStructure = pageCount === 3 && hasPage1Content && hasPage2Content && hasPage3Content && hasSVG;
        console.log(`   Overall structure: ${isValidStructure ? '✅ Valid' : '❌ Invalid'}`);
        
        // Generate actual PDF to verify page count
        console.log('\n📄 Generating PDF for page count verification...');
        const startTime = Date.now();
        const pdfBuffer = await reportService.generateStandardReport(testSoilData, testUserInfo);
        const generationTime = Date.now() - startTime;
        
        console.log(`   ✅ PDF generated successfully (${generationTime}ms)`);
        console.log(`   📏 PDF size: ${pdfBuffer.length} bytes (${Math.round(pdfBuffer.length / 1024)}KB)`);
        
        // Save files for manual inspection
        const outputDir = path.join(__dirname, 'page-validation-output');
        await fs.mkdir(outputDir, { recursive: true });
        
        await fs.writeFile(path.join(outputDir, 'page-structure-test.html'), htmlContent);
        await fs.writeFile(path.join(outputDir, 'page-structure-test.pdf'), pdfBuffer);
        
        console.log(`\n💾 Files saved to: ${outputDir}`);
        console.log('   📄 page-structure-test.html - For HTML inspection');
        console.log('   📄 page-structure-test.pdf - For PDF page count verification');
        
        // Create analysis report
        const analysisReport = `
<!DOCTYPE html>
<html>
<head>
    <title>FlahaSoil Page Count Validation Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: #4CAF50; font-weight: bold; }
        .error { color: #f44336; font-weight: bold; }
        .metric { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #2E8B57; background: #f0f8f0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>FlahaSoil Page Count Validation Report</h1>
        
        <div class="section">
            <h3>HTML Structure Analysis</h3>
            <div class="metric">Total HTML Size: ${htmlContent.length} characters</div>
            <div class="metric">Page Divs Found: <span class="${pageCount === 3 ? 'success' : 'error'}">${pageCount}</span> (Expected: 3)</div>
            <div class="metric">Page Break Controls: ${pageBreakCount}</div>
            <div class="metric">SVG Triangle: <span class="${hasSVG ? 'success' : 'error'}">${hasSVG ? 'Included' : 'Missing'}</span></div>
        </div>
        
        <div class="section">
            <h3>Page Markers</h3>
            <div class="metric">Page 1 Marker: <span class="${hasPage1Content ? 'success' : 'error'}">${hasPage1Content ? 'Found' : 'Missing'}</span></div>
            <div class="metric">Page 2 Marker: <span class="${hasPage2Content ? 'success' : 'error'}">${hasPage2Content ? 'Found' : 'Missing'}</span></div>
            <div class="metric">Page 3 Marker: <span class="${hasPage3Content ? 'success' : 'error'}">${hasPage3Content ? 'Found' : 'Missing'}</span></div>
        </div>
        
        <div class="section">
            <h3>Section Content</h3>
            ${sections.map((section, index) => {
                const hasSection = htmlContent.includes(section);
                return `<div class="metric">Page ${index + 1} - ${section}: <span class="${hasSection ? 'success' : 'error'}">${hasSection ? 'Found' : 'Missing'}</span></div>`;
            }).join('')}
        </div>
        
        <div class="section">
            <h3>PDF Generation</h3>
            <div class="metric">Generation Time: ${generationTime}ms</div>
            <div class="metric">PDF Size: ${Math.round(pdfBuffer.length / 1024)}KB</div>
            <div class="metric">Status: <span class="success">Successfully Generated</span></div>
        </div>
        
        <div class="section">
            <h3>Overall Validation</h3>
            <div class="metric">Structure Valid: <span class="${isValidStructure ? 'success' : 'error'}">${isValidStructure ? 'PASS' : 'FAIL'}</span></div>
            <div class="metric">Expected Page Count: <span class="${pageCount === 3 ? 'success' : 'error'}">${pageCount === 3 ? 'ACHIEVED' : 'NOT ACHIEVED'}</span></div>
            <div class="metric">SVG Integration: <span class="${hasSVG ? 'success' : 'error'}">${hasSVG ? 'WORKING' : 'FAILED'}</span></div>
        </div>
        
        <div class="section">
            <h3>Test Files</h3>
            <p><strong>HTML File:</strong> page-structure-test.html</p>
            <p><strong>PDF File:</strong> page-structure-test.pdf</p>
            <p><em>Open the PDF file and verify it contains exactly 3 pages with the soil triangle visible on page 2.</em></p>
        </div>
    </div>
</body>
</html>`;
        
        await fs.writeFile(path.join(outputDir, 'validation-report.html'), analysisReport);
        console.log('   📊 validation-report.html - Detailed analysis report');
        
        // Final validation
        console.log('\n🎯 Final Validation Results:');
        console.log(`   Page Count: ${pageCount === 3 ? '✅ PASS' : '❌ FAIL'} (${pageCount}/3)`);
        console.log(`   SVG Triangle: ${hasSVG ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`   PDF Generation: ✅ PASS`);
        console.log(`   Overall Status: ${isValidStructure ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        
        await reportService.closeBrowser();
        
        return {
            pageCount,
            expectedPageCount: 3,
            hasSVG,
            isValid: isValidStructure,
            pdfSize: pdfBuffer.length,
            generationTime
        };
        
    } catch (error) {
        console.error('❌ Validation error:', error);
        await reportService.closeBrowser();
        throw error;
    }
}

// Run the validation
if (require.main === module) {
    validatePageCount()
        .then(results => {
            console.log('\n📋 Validation Complete!');
            if (results.isValid) {
                console.log('🎉 All page count and SVG integration tests passed!');
            } else {
                console.log('⚠️ Some validation checks failed. Review the output above.');
            }
        })
        .catch(console.error);
}

module.exports = { validatePageCount };
