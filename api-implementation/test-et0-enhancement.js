/**
 * ET₀ Enhancement Test - Phase 2 Week 5 Enhancement
 * Tests the enhanced ET₀ functionality with manual/FlahaCalc options
 * 
 * @format
 */

const axios = require('axios');

async function testET0Enhancement() {
    console.log('🌡️  Testing ET₀ Enhancement - Manual vs FlahaCalc Options');
    console.log('='.repeat(70));

    const baseURL = 'http://localhost:3001';
    
    // Test coordinates (Doha, Qatar)
    const testData = {
        latitude: 25.276987,
        longitude: 55.296249,
        soilAnalysisId: 'test-soil-id',
        cropId: 'test-crop-id',
        fieldArea: 100
    };

    let testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
    };

    // Test 1: Manual ET₀ Entry
    console.log('\n📝 Test 1: Manual ET₀ Entry');
    try {
        testResults.total++;
        
        const manualET0Data = {
            ...testData,
            et0Value: 6.5,
            et0Source: 'manual',
            climateZone: 'arid',
            irrigationMethod: 'drip',
            growthStage: 'mid'
        };

        console.log('   Testing manual ET₀ entry with value: 6.5 mm/day');
        
        // Simulate the calculation request
        const response = await axios.post(`${baseURL}/api/v1/dss/calculate`, manualET0Data, {
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success && response.data.data.et0Metadata) {
            const metadata = response.data.data.et0Metadata;
            if (metadata.source === 'manual' && metadata.value === 6.5) {
                console.log('✅ Manual ET₀ entry working correctly');
                console.log(`   Source: ${metadata.source}, Value: ${metadata.value} ${metadata.unit}`);
                testResults.passed++;
            } else {
                throw new Error('Manual ET₀ metadata incorrect');
            }
        } else {
            throw new Error('Manual ET₀ calculation failed');
        }
    } catch (error) {
        console.log('❌ Manual ET₀ test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Manual ET₀: ${error.message}`);
    }

    // Test 2: FlahaCalc ET₀ Integration
    console.log('\n🌐 Test 2: FlahaCalc ET₀ Integration');
    try {
        testResults.total++;
        
        const flahacalcET0Data = {
            ...testData,
            et0Source: 'flahacalc',
            latitude: testData.latitude,
            longitude: testData.longitude,
            calculationDate: '2025-03-03',
            climateZone: 'arid',
            irrigationMethod: 'drip',
            growthStage: 'mid'
        };

        console.log('   Testing FlahaCalc ET₀ integration');
        console.log(`   Coordinates: ${testData.latitude}, ${testData.longitude}`);
        
        const response = await axios.post(`${baseURL}/api/v1/dss/calculate`, flahacalcET0Data, {
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success && response.data.data.et0Metadata) {
            const metadata = response.data.data.et0Metadata;
            if (metadata.source === 'flahacalc' || metadata.source === 'regional_average') {
                console.log('✅ FlahaCalc ET₀ integration working');
                console.log(`   Source: ${metadata.source}, Value: ${metadata.value} ${metadata.unit}`);
                if (metadata.dataSource) {
                    console.log(`   Data Source: ${metadata.dataSource}`);
                }
                if (metadata.location) {
                    console.log(`   Location: ${metadata.location}`);
                }
                testResults.passed++;
            } else {
                throw new Error('FlahaCalc ET₀ metadata incorrect');
            }
        } else {
            throw new Error('FlahaCalc ET₀ calculation failed');
        }
    } catch (error) {
        console.log('❌ FlahaCalc ET₀ test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`FlahaCalc ET₀: ${error.message}`);
    }

    // Test 3: Weather API ET₀ Endpoint
    console.log('\n🌤️  Test 3: Weather API ET₀ Endpoint');
    try {
        testResults.total++;
        
        const weatherResponse = await axios.get(
            `${baseURL}/api/v1/weather/et0?lat=${testData.latitude}&lon=${testData.longitude}`,
            {
                headers: {
                    'Authorization': 'Bearer test-token'
                }
            }
        );

        if (weatherResponse.data.success && weatherResponse.data.data) {
            const et0Data = weatherResponse.data.data;
            console.log('✅ Weather API ET₀ endpoint working');
            console.log(`   ET₀: ${et0Data.et0} mm/day`);
            console.log(`   Data Source: ${et0Data.dataSource}`);
            console.log(`   Calculation Method: ${et0Data.calculationMethod}`);
            testResults.passed++;
        } else {
            throw new Error('Weather API ET₀ endpoint failed');
        }
    } catch (error) {
        console.log('❌ Weather API ET₀ test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Weather API ET₀: ${error.message}`);
    }

    // Test 4: ET₀ Source Validation
    console.log('\n✅ Test 4: ET₀ Source Validation');
    try {
        testResults.total++;
        
        // Test invalid manual ET₀ (missing value)
        const invalidManualData = {
            ...testData,
            et0Source: 'manual',
            // et0Value missing
            climateZone: 'arid',
            irrigationMethod: 'drip',
            growthStage: 'mid'
        };

        try {
            await axios.post(`${baseURL}/api/v1/dss/calculate`, invalidManualData, {
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                }
            });
            throw new Error('Should have failed validation');
        } catch (validationError) {
            if (validationError.response && validationError.response.status === 400) {
                console.log('✅ Manual ET₀ validation working correctly');
            } else {
                throw validationError;
            }
        }

        // Test invalid FlahaCalc ET₀ (missing coordinates)
        const invalidFlahaCalcData = {
            ...testData,
            et0Source: 'flahacalc',
            // latitude/longitude missing
            climateZone: 'arid',
            irrigationMethod: 'drip',
            growthStage: 'mid'
        };

        try {
            await axios.post(`${baseURL}/api/v1/dss/calculate`, invalidFlahaCalcData, {
                headers: {
                    'Authorization': 'Bearer test-token',
                    'Content-Type': 'application/json'
                }
            });
            throw new Error('Should have failed validation');
        } catch (validationError) {
            if (validationError.response && validationError.response.status === 400) {
                console.log('✅ FlahaCalc ET₀ validation working correctly');
            } else {
                throw validationError;
            }
        }

        testResults.passed++;
    } catch (error) {
        console.log('❌ ET₀ source validation test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`ET₀ Validation: ${error.message}`);
    }

    // Test 5: Fallback Mechanism
    console.log('\n🔄 Test 5: ET₀ Fallback Mechanism');
    try {
        testResults.total++;
        
        const fallbackData = {
            ...testData,
            et0Source: 'flahacalc',
            latitude: testData.latitude,
            longitude: testData.longitude,
            et0Value: 7.0, // Fallback value
            climateZone: 'arid',
            irrigationMethod: 'drip',
            growthStage: 'mid'
        };

        console.log('   Testing fallback mechanism with manual backup value');
        
        const response = await axios.post(`${baseURL}/api/v1/dss/calculate`, fallbackData, {
            headers: {
                'Authorization': 'Bearer test-token',
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success && response.data.data.et0Metadata) {
            const metadata = response.data.data.et0Metadata;
            console.log('✅ Fallback mechanism working');
            console.log(`   Final Source: ${metadata.source}, Value: ${metadata.value} ${metadata.unit}`);
            if (metadata.note) {
                console.log(`   Note: ${metadata.note}`);
            }
            testResults.passed++;
        } else {
            throw new Error('Fallback mechanism failed');
        }
    } catch (error) {
        console.log('❌ Fallback mechanism test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Fallback Mechanism: ${error.message}`);
    }

    // Test Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 ET₀ ENHANCEMENT TEST SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`Passed: ${testResults.passed} ✅`);
    console.log(`Failed: ${testResults.failed} ❌`);
    console.log(`Success Rate: ${Math.round((testResults.passed / testResults.total) * 100)}%`);

    if (testResults.errors.length > 0) {
        console.log('\n❌ Errors encountered:');
        testResults.errors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
        });
    }

    if (testResults.passed === testResults.total) {
        console.log('\n🎉 All ET₀ enhancement tests passed! User choice functionality working perfectly.');
    } else if (testResults.passed >= testResults.total * 0.8) {
        console.log('\n⚠️  Most tests passed. ET₀ enhancement is functional with minor issues.');
    } else {
        console.log('\n🔴 Multiple test failures. ET₀ enhancement needs attention.');
    }

    return testResults;
}

// Run the test
if (require.main === module) {
    testET0Enhancement()
        .then((results) => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch((error) => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = testET0Enhancement;
