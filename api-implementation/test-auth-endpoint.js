/**
 * Test Authentication and Report Endpoint
 * Tests if the auth and report endpoints are working correctly
 * @format
 */

const fetch = require('node-fetch');

async function testAuthAndReports() {
    console.log('🧪 Testing Authentication and Report Endpoints');
    console.log('═'.repeat(50));

    // Test data
    const testUser = {
        email: 'pro@flahasoil.com',
        password: 'password123'
    };

    const testSoilData = {
        sand: 40,
        clay: 30,
        silt: 30,
        organicMatter: 2.5,
        bulkDensity: 1.3,
        gravel: 5,
        salinity: 0.2,
        fieldCapacity: 0.35,
        wiltingPoint: 0.15,
        plantAvailableWater: 0.20,
        saturatedConductivity: 25.5,
        airCapacity: 0.12,
        qualityScore: 85,
        textureClass: 'Clay Loam',
        drainageClass: 'Well Drained'
    };

    try {
        // Step 1: Test health endpoint
        console.log('🔧 Step 1: Testing health endpoint...');
        const healthResponse = await fetch('http://localhost:3001/health');
        console.log(`✅ Health check: ${healthResponse.status}`);

        // Step 2: Login to get token
        console.log('🔧 Step 2: Logging in...');
        const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });

        if (!loginResponse.ok) {
            console.log('❌ Login failed:', loginResponse.status);
            const errorText = await loginResponse.text();
            console.log('Error:', errorText);
            return;
        }

        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log('📊 User data:', loginData.user);
        
        const token = loginData.token;
        if (!token) {
            console.log('❌ No token received');
            return;
        }

        // Step 3: Test report capabilities endpoint
        console.log('🔧 Step 3: Testing report capabilities...');
        const capabilitiesResponse = await fetch('http://localhost:3001/api/v1/reports/capabilities', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (capabilitiesResponse.ok) {
            const capabilities = await capabilitiesResponse.json();
            console.log('✅ Capabilities:', capabilities);
        } else {
            console.log('❌ Capabilities failed:', capabilitiesResponse.status);
        }

        // Step 4: Test PDF generation endpoint
        console.log('🔧 Step 4: Testing PDF generation...');
        const pdfResponse = await fetch('http://localhost:3001/api/v1/reports/generate/standard', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                soilData: testSoilData
            })
        });

        console.log(`📄 PDF Response status: ${pdfResponse.status}`);
        console.log(`📄 PDF Response headers:`, Object.fromEntries(pdfResponse.headers.entries()));

        if (pdfResponse.ok) {
            const pdfBuffer = await pdfResponse.buffer();
            console.log(`✅ PDF generated successfully: ${pdfBuffer.length} bytes`);
            
            // Save the PDF for testing
            const fs = require('fs');
            const path = require('path');
            const outputPath = path.join(__dirname, 'debug-outputs', `test-api-${Date.now()}.pdf`);
            fs.writeFileSync(outputPath, pdfBuffer);
            console.log(`💾 PDF saved: ${outputPath}`);
        } else {
            const errorText = await pdfResponse.text();
            console.log('❌ PDF generation failed:', errorText);
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Run the test
testAuthAndReports().catch(console.error);
