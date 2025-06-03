/**
 * Weather Service Test - Phase 2 Week 5 Implementation
 * Tests weather API integration and fallback strategies
 * 
 * @format
 */

const WeatherService = require('./src/services/weatherService');

async function testWeatherService() {
    console.log('🌤️  Testing Weather Service - Phase 2 Week 5');
    console.log('='.repeat(60));

    const weatherService = new WeatherService();
    
    // Test coordinates (Doha, Qatar)
    const lat = 25.276987;
    const lon = 55.296249;
    
    let testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
    };

    // Test 1: Current Weather Data
    console.log('\n📍 Test 1: Current Weather Data');
    try {
        testResults.total++;
        const currentWeather = await weatherService.getCurrentWeather(lat, lon);
        
        if (currentWeather && currentWeather.temperature !== undefined) {
            console.log('✅ Current weather data retrieved successfully');
            console.log(`   Temperature: ${currentWeather.temperature}°C`);
            console.log(`   Humidity: ${currentWeather.humidity}%`);
            console.log(`   Provider: ${currentWeather.provider}`);
            testResults.passed++;
        } else {
            throw new Error('Invalid weather data structure');
        }
    } catch (error) {
        console.log('❌ Current weather test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Current Weather: ${error.message}`);
    }

    // Test 2: Weather Forecast
    console.log('\n📅 Test 2: Weather Forecast');
    try {
        testResults.total++;
        const forecast = await weatherService.getWeatherForecast(lat, lon, 5);
        
        if (forecast && forecast.daily && forecast.daily.length > 0) {
            console.log('✅ Weather forecast retrieved successfully');
            console.log(`   Forecast days: ${forecast.daily.length}`);
            console.log(`   Provider: ${forecast.provider}`);
            console.log(`   First day temp: ${forecast.daily[0].temperature?.avg || 'N/A'}°C`);
            testResults.passed++;
        } else {
            throw new Error('Invalid forecast data structure');
        }
    } catch (error) {
        console.log('❌ Weather forecast test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Weather Forecast: ${error.message}`);
    }

    // Test 3: FlahaCalc ET₀ Integration
    console.log('\n☀️  Test 3: FlahaCalc ET₀ Integration');
    try {
        testResults.total++;
        const et0Data = await weatherService.getFlahaCalcET0(lat, lon);
        
        if (et0Data && et0Data.et0 !== undefined) {
            console.log('✅ FlahaCalc ET₀ data retrieved successfully');
            console.log(`   ET₀: ${et0Data.et0} mm/day`);
            console.log(`   Temperature: ${et0Data.temperature || 'N/A'}°C`);
            console.log(`   Data Source: ${et0Data.dataSource}`);
            console.log(`   Calculation Method: ${et0Data.calculationMethod}`);
            testResults.passed++;
        } else {
            throw new Error('Invalid ET₀ data structure');
        }
    } catch (error) {
        console.log('❌ FlahaCalc ET₀ test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`FlahaCalc ET₀: ${error.message}`);
    }

    // Test 4: Fallback ET₀ Calculation
    console.log('\n🔄 Test 4: Fallback ET₀ Calculation');
    try {
        testResults.total++;
        const fallbackET0 = await weatherService.calculateFallbackET0(lat, lon, '2025-03-03');
        
        if (fallbackET0 && fallbackET0.et0 !== undefined) {
            console.log('✅ Fallback ET₀ calculation successful');
            console.log(`   ET₀: ${fallbackET0.et0} mm/day`);
            console.log(`   Calculation Method: ${fallbackET0.calculationMethod}`);
            testResults.passed++;
        } else {
            throw new Error('Invalid fallback ET₀ data');
        }
    } catch (error) {
        console.log('❌ Fallback ET₀ test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Fallback ET₀: ${error.message}`);
    }

    // Test 5: Regional ET₀ Averages
    console.log('\n🌍 Test 5: Regional ET₀ Averages');
    try {
        testResults.total++;
        
        // Test different regions
        const gccET0 = weatherService.getRegionalET0Average(25.276987, 55.296249, '2025-07-15'); // Gulf region
        const medET0 = weatherService.getRegionalET0Average(35.0, 15.0, '2025-07-15'); // Mediterranean
        const tempET0 = weatherService.getRegionalET0Average(45.0, 2.0, '2025-07-15'); // Temperate
        
        console.log('✅ Regional ET₀ averages calculated');
        console.log(`   GCC Region (July): ${gccET0} mm/day`);
        console.log(`   Mediterranean (July): ${medET0} mm/day`);
        console.log(`   Temperate (July): ${tempET0} mm/day`);
        testResults.passed++;
    } catch (error) {
        console.log('❌ Regional ET₀ test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Regional ET₀: ${error.message}`);
    }

    // Test 6: Cache Functionality
    console.log('\n💾 Test 6: Cache Functionality');
    try {
        testResults.total++;
        
        // Clear cache first
        weatherService.clearCache();
        
        // Get initial stats
        const initialStats = weatherService.getCacheStats();
        
        // Make a request to populate cache
        await weatherService.getCurrentWeather(lat, lon);
        
        // Get updated stats
        const updatedStats = weatherService.getCacheStats();
        
        if (updatedStats.keys > initialStats.keys) {
            console.log('✅ Cache functionality working');
            console.log(`   Cache keys: ${updatedStats.keys}`);
            console.log(`   Cache hits: ${updatedStats.hits}`);
            console.log(`   Cache misses: ${updatedStats.misses}`);
            testResults.passed++;
        } else {
            throw new Error('Cache not populating correctly');
        }
    } catch (error) {
        console.log('❌ Cache test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Cache: ${error.message}`);
    }

    // Test 7: Data Normalization
    console.log('\n🔄 Test 7: Data Normalization');
    try {
        testResults.total++;
        
        // Test OpenWeatherMap data normalization
        const mockOpenWeatherData = {
            main: { temp: 25.5, humidity: 60, pressure: 1013 },
            wind: { speed: 3.5, deg: 180 },
            clouds: { all: 20 },
            weather: [{ description: 'clear sky', icon: '01d' }],
            dt: 1709467200,
            coord: { lat: 25.276987, lon: 55.296249 },
            name: 'Doha'
        };
        
        const normalized = weatherService.normalizeWeatherData(mockOpenWeatherData, 'openweather');
        
        if (normalized && normalized.temperature === 25.5 && normalized.humidity === 60) {
            console.log('✅ Data normalization working');
            console.log(`   Normalized temperature: ${normalized.temperature}°C`);
            console.log(`   Normalized humidity: ${normalized.humidity}%`);
            console.log(`   Provider: ${normalized.provider}`);
            testResults.passed++;
        } else {
            throw new Error('Data normalization failed');
        }
    } catch (error) {
        console.log('❌ Data normalization test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Data Normalization: ${error.message}`);
    }

    // Test Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 WEATHER SERVICE TEST SUMMARY');
    console.log('='.repeat(60));
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
        console.log('\n🎉 All weather service tests passed! Phase 2 Week 5 implementation successful.');
    } else if (testResults.passed >= testResults.total * 0.8) {
        console.log('\n⚠️  Most tests passed. Weather service is functional with minor issues.');
    } else {
        console.log('\n🔴 Multiple test failures. Weather service needs attention.');
    }

    return testResults;
}

// Run the test
if (require.main === module) {
    testWeatherService()
        .then((results) => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch((error) => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = testWeatherService;
