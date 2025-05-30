/**
 * Test script for SVG generation
 * Run this to validate the soil triangle SVG generator
 */

const { generateSoilTriangleSVG, generateTestSVG, validateSVG } = require('../src/utils/soilTriangleGenerator');
const fs = require('fs').promises;
const path = require('path');

async function runTests() {
    console.log('🧪 Starting SVG Generation Tests...\n');

    // Test cases with different soil compositions
    const testCases = [
        { sand: 40, clay: 30, silt: 30, name: 'Balanced Composition' },
        { sand: 70, clay: 15, silt: 15, name: 'Sandy Soil' },
        { sand: 20, clay: 60, silt: 20, name: 'Clay Soil' },
        { sand: 20, clay: 15, silt: 65, name: 'Silty Soil' },
        { sand: 85, clay: 8, silt: 7, name: 'Very Sandy' },
        { sand: 0, clay: 100, silt: 0, name: 'Pure Clay (Vertex)' },
        { sand: 100, clay: 0, silt: 0, name: 'Pure Sand (Vertex)' },
        { sand: 0, clay: 0, silt: 100, name: 'Pure Silt (Vertex)' },
        { sand: 33.3, clay: 33.3, silt: 33.4, name: 'Center Point' }
    ];

    let passedTests = 0;
    let totalTests = testCases.length;

    // Create output directory for test results
    const outputDir = path.join(__dirname, 'svg-output');
    try {
        await fs.mkdir(outputDir, { recursive: true });
        console.log(`📁 Created output directory: ${outputDir}\n`);
    } catch (error) {
        console.log(`📁 Output directory already exists: ${outputDir}\n`);
    }

    // Test each case
    for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        console.log(`🔬 Test ${i + 1}/${totalTests}: ${testCase.name}`);
        console.log(`   Composition: Sand ${testCase.sand}%, Clay ${testCase.clay}%, Silt ${testCase.silt}%`);

        try {
            // Generate SVG
            const startTime = Date.now();
            const svg = generateSoilTriangleSVG(testCase);
            const generationTime = Date.now() - startTime;

            // Validate SVG
            const isValid = validateSVG(svg);
            
            if (isValid) {
                console.log(`   ✅ SVG generated successfully (${generationTime}ms)`);
                console.log(`   📏 SVG size: ${svg.length} characters`);
                
                // Save SVG to file for visual inspection
                const filename = `test-${i + 1}-${testCase.name.toLowerCase().replace(/\s+/g, '-')}.svg`;
                const filepath = path.join(outputDir, filename);
                await fs.writeFile(filepath, svg);
                console.log(`   💾 Saved to: ${filename}`);
                
                // Create HTML wrapper for easy viewing
                const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>${testCase.name} - Soil Triangle Test</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .info { margin-bottom: 20px; padding: 15px; background: #e8f4f8; border-radius: 6px; }
        .svg-container { text-align: center; padding: 20px; border: 1px solid #ddd; background: white; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Soil Triangle Test: ${testCase.name}</h1>
        <div class="info">
            <p><strong>Test Case:</strong> ${i + 1} of ${totalTests}</p>
            <p><strong>Composition:</strong> Sand ${testCase.sand}%, Clay ${testCase.clay}%, Silt ${testCase.silt}%</p>
            <p><strong>Generation Time:</strong> ${generationTime}ms</p>
            <p><strong>SVG Size:</strong> ${svg.length} characters</p>
            <p><strong>Status:</strong> ✅ Generated Successfully</p>
        </div>
        <div class="svg-container">
            ${svg}
        </div>
    </div>
</body>
</html>`;
                
                const htmlFilename = `test-${i + 1}-${testCase.name.toLowerCase().replace(/\s+/g, '-')}.html`;
                const htmlFilepath = path.join(outputDir, htmlFilename);
                await fs.writeFile(htmlFilepath, htmlContent);
                
                passedTests++;
            } else {
                console.log(`   ❌ SVG validation failed`);
                console.log(`   📄 SVG preview: ${svg.substring(0, 100)}...`);
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log(''); // Empty line for readability
    }

    // Test the built-in test SVG
    console.log('🔬 Testing built-in test SVG...');
    try {
        const testSVG = generateTestSVG();
        const isValid = validateSVG(testSVG);
        
        if (isValid) {
            console.log('   ✅ Built-in test SVG generated successfully');
            await fs.writeFile(path.join(outputDir, 'built-in-test.svg'), testSVG);
            console.log('   💾 Saved to: built-in-test.svg');
            passedTests++;
        } else {
            console.log('   ❌ Built-in test SVG validation failed');
        }
        totalTests++;
    } catch (error) {
        console.log(`   ❌ Built-in test error: ${error.message}`);
        totalTests++;
    }

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${totalTests - passedTests}`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All tests passed! SVG generation is working correctly.');
        console.log(`📁 Check the output files in: ${outputDir}`);
    } else {
        console.log('\n⚠️ Some tests failed. Please check the error messages above.');
    }

    // Create index HTML for easy viewing
    const indexContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Soil Triangle SVG Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .summary { background: #e8f5e8; padding: 15px; border-radius: 6px; margin-bottom: 20px; }
        .test-list { list-style: none; padding: 0; }
        .test-item { margin: 10px 0; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .test-item a { text-decoration: none; color: #2E8B57; font-weight: bold; }
        .test-item a:hover { color: #4682B4; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Soil Triangle SVG Test Results</h1>
        <div class="summary">
            <h3>Test Summary</h3>
            <p><strong>Total Tests:</strong> ${totalTests}</p>
            <p><strong>Passed:</strong> ${passedTests}</p>
            <p><strong>Failed:</strong> ${totalTests - passedTests}</p>
            <p><strong>Success Rate:</strong> ${Math.round((passedTests / totalTests) * 100)}%</p>
        </div>
        <h3>Test Results</h3>
        <ul class="test-list">
            ${testCases.map((testCase, index) => `
                <li class="test-item">
                    <a href="test-${index + 1}-${testCase.name.toLowerCase().replace(/\s+/g, '-')}.html">
                        Test ${index + 1}: ${testCase.name}
                    </a>
                    <br>
                    <small>Sand ${testCase.sand}%, Clay ${testCase.clay}%, Silt ${testCase.silt}%</small>
                </li>
            `).join('')}
            <li class="test-item">
                <a href="built-in-test.svg">Built-in Test SVG</a>
                <br>
                <small>Default test case (Sand 40%, Clay 30%, Silt 30%)</small>
            </li>
        </ul>
    </div>
</body>
</html>`;

    await fs.writeFile(path.join(outputDir, 'index.html'), indexContent);
    console.log(`\n📄 Created index.html for easy viewing of all test results`);
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { runTests };
