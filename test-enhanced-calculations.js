/**
 * Test script for enhanced soil calculations
 * Tests the new Saxton & Rawls (2006) 24-equation system
 */

const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api/v1';

async function testEnhancedCalculations() {
    console.log('🧪 Testing Enhanced Soil Calculations (Saxton & Rawls 2006)');
    console.log('=' .repeat(60));

    // Test data with enhanced parameters
    const testData = {
        sand: 40,
        clay: 30,
        organicMatter: 3.5,
        densityFactor: 1.3,
        gravelContent: 5,
        electricalConductivity: 1.2
    };

    try {
        console.log('📊 Test Parameters:');
        console.log(`   Sand: ${testData.sand}%`);
        console.log(`   Clay: ${testData.clay}%`);
        console.log(`   Silt: ${100 - testData.sand - testData.clay}%`);
        console.log(`   Organic Matter: ${testData.organicMatter}%`);
        console.log(`   Bulk Density: ${testData.densityFactor} g/cm³`);
        console.log(`   Gravel Content: ${testData.gravelContent}%`);
        console.log(`   Electrical Conductivity: ${testData.electricalConductivity} dS/m`);
        console.log('');

        // Test demo endpoint (no authentication required)
        console.log('🔬 Testing Demo Endpoint...');
        const demoResponse = await fetch(`${API_BASE}/soil/demo/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        if (demoResponse.ok) {
            const demoResult = await demoResponse.json();
            console.log('✅ Demo endpoint working!');
            console.log('📈 Results:');
            
            if (demoResult.success && demoResult.data) {
                const data = demoResult.data;
                console.log(`   Field Capacity: ${data.fieldCapacity}%`);
                console.log(`   Wilting Point: ${data.wiltingPoint}%`);
                console.log(`   Plant Available Water: ${data.plantAvailableWater}%`);
                console.log(`   Saturation: ${data.saturation}%`);
                console.log(`   Saturated Conductivity: ${data.saturatedConductivity} mm/hr`);
                console.log(`   Texture Class: ${data.textureClass}`);
                console.log(`   Soil Quality Index: ${data.soilQualityIndex}/10`);
                console.log(`   Drainage Class: ${data.drainageClass}`);
                
                // Check for enhanced features
                if (data.airEntryTension) {
                    console.log(`   Air-Entry Tension: ${data.airEntryTension} kPa`);
                }
                if (data.bulkDensity) {
                    console.log(`   Bulk Density: ${data.bulkDensity} g/cm³`);
                }
                if (data.lambda) {
                    console.log(`   Lambda (λ): ${data.lambda}`);
                }
                if (data.compactionRisk) {
                    console.log(`   Compaction Risk: ${data.compactionRisk}`);
                }
                if (data.erosionRisk) {
                    console.log(`   Erosion Risk: ${data.erosionRisk}`);
                }
                
                // Check for confidence intervals (Professional+ feature)
                if (data.rSquaredValues) {
                    console.log('📊 R² Values (Model Accuracy):');
                    Object.entries(data.rSquaredValues).forEach(([key, value]) => {
                        console.log(`   ${key}: R² = ${value}`);
                    });
                }
                
                // Check for gravel effects (Professional+ feature)
                if (data.plantAvailableWaterBulk) {
                    console.log(`   Plant Available Water (Bulk): ${data.plantAvailableWaterBulk}%`);
                    console.log(`   Bulk Conductivity: ${data.bulkConductivity} mm/hr`);
                }
                
                // Check for salinity effects (Enterprise feature)
                if (data.osmoticPotential) {
                    console.log(`   Osmotic Potential: ${data.osmoticPotential} kPa`);
                    console.log(`   Osmotic Potential (FC): ${data.osmoticPotentialFC} kPa`);
                }
            } else {
                console.log('❌ Demo endpoint returned error:', demoResult.error);
            }
        } else {
            console.log('❌ Demo endpoint failed:', demoResponse.status, demoResponse.statusText);
            const errorText = await demoResponse.text();
            console.log('Error details:', errorText);
        }

        console.log('');
        console.log('🎯 Testing Input Validation...');
        
        // Test invalid clay content (>60%)
        const invalidData = { ...testData, clay: 65 };
        const invalidResponse = await fetch(`${API_BASE}/soil/demo/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invalidData)
        });

        if (!invalidResponse.ok) {
            console.log('✅ Input validation working - rejected clay >60%');
        } else {
            console.log('❌ Input validation failed - should reject clay >60%');
        }

        // Test invalid sand + clay sum
        const invalidSum = { ...testData, sand: 70, clay: 40 };
        const invalidSumResponse = await fetch(`${API_BASE}/soil/demo/analyze`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(invalidSum)
        });

        if (!invalidSumResponse.ok) {
            console.log('✅ Input validation working - rejected sand + clay >100%');
        } else {
            console.log('❌ Input validation failed - should reject sand + clay >100%');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }

    console.log('');
    console.log('🏁 Test completed!');
}

// Run the test
testEnhancedCalculations();
