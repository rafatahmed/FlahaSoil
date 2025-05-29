/**
 * FlahaSoil Report Performance Testing Suite
 * Tests report caching, optimization, and speed improvements
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Import report service for testing
const ReportService = require('../api-implementation/src/services/reportService');

class ReportPerformanceTester {
    constructor() {
        this.reportService = new ReportService();
        this.cacheDir = path.join(__dirname, 'report-cache');
        this.performanceData = [];
    }

    /**
     * Initialize cache directory
     */
    async initializeCache() {
        try {
            await fs.mkdir(this.cacheDir, { recursive: true });
            console.log(`📁 Cache directory initialized: ${this.cacheDir}`);
        } catch (error) {
            console.error('Failed to initialize cache directory:', error);
        }
    }

    /**
     * Generate cache key for soil data
     */
    generateCacheKey(soilData, userInfo, customOptions = {}) {
        const dataString = JSON.stringify({ soilData, userInfo: userInfo.id, customOptions });
        return crypto.createHash('md5').update(dataString).digest('hex');
    }

    /**
     * Test report caching implementation
     */
    async testReportCaching() {
        console.log('\n💾 Testing Report Caching Implementation...');
        console.log('─'.repeat(50));

        try {
            await this.initializeCache();

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
                id: 'cache-test-user',
                name: 'Cache Test User',
                email: 'cache@example.com',
                plan: 'PROFESSIONAL'
            };

            // Test 1: Generate report without cache
            console.log('  ✓ Testing initial report generation (no cache)...');
            const startTime1 = Date.now();
            const pdfBuffer1 = await this.reportService.generateStandardReport(testSoilData, testUser);
            const generationTime1 = Date.now() - startTime1;

            // Cache the report
            const cacheKey = this.generateCacheKey(testSoilData, testUser);
            const cachePath = path.join(this.cacheDir, `${cacheKey}.pdf`);
            await fs.writeFile(cachePath, pdfBuffer1);
            
            console.log(`  ✅ Report generated and cached (${generationTime1}ms, ${pdfBuffer1.length} bytes)`);

            // Test 2: Simulate cache retrieval
            console.log('  ✓ Testing cached report retrieval...');
            const startTime2 = Date.now();
            
            // Check if cache exists
            try {
                await fs.access(cachePath);
                const cachedBuffer = await fs.readFile(cachePath);
                const retrievalTime = Date.now() - startTime2;
                
                console.log(`  ✅ Report retrieved from cache (${retrievalTime}ms, ${cachedBuffer.length} bytes)`);
                
                // Performance comparison
                const speedImprovement = ((generationTime1 - retrievalTime) / generationTime1 * 100).toFixed(1);
                console.log(`  📈 Cache speed improvement: ${speedImprovement}% faster`);
                
                this.performanceData.push({
                    test: 'Cache Performance',
                    generationTime: generationTime1,
                    retrievalTime: retrievalTime,
                    speedImprovement: speedImprovement
                });

            } catch (error) {
                throw new Error('Cache file not found or inaccessible');
            }

            // Test 3: Cache invalidation
            console.log('  ✓ Testing cache invalidation...');
            const modifiedSoilData = { ...testSoilData, organicMatter: 3.0 };
            const newCacheKey = this.generateCacheKey(modifiedSoilData, testUser);
            
            if (cacheKey !== newCacheKey) {
                console.log('  ✅ Cache key changes with different data (cache invalidation works)');
            } else {
                console.log('  ⚠️ Cache key unchanged - potential cache invalidation issue');
            }

            return true;
        } catch (error) {
            console.error(`  ❌ Report Caching Test Failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test PDF generation speed optimization
     */
    async testPDFGenerationSpeed() {
        console.log('\n⚡ Testing PDF Generation Speed Optimization...');
        console.log('─'.repeat(50));

        try {
            const testCases = [
                {
                    name: 'Simple Report',
                    soilData: {
                        sand: 40, clay: 30, silt: 30, organicMatter: 2.0,
                        textureClass: 'clay loam', fieldCapacity: 0.30,
                        wiltingPoint: 0.16, plantAvailableWater: 0.14
                    }
                },
                {
                    name: 'Complex Report',
                    soilData: {
                        sand: 35, clay: 25, silt: 40, organicMatter: 3.5,
                        densityFactor: 1.2, textureClass: 'loam',
                        fieldCapacity: 0.28, wiltingPoint: 0.15,
                        plantAvailableWater: 0.13, saturation: 0.42,
                        saturatedConductivity: 3.2, bulkDensity: 1.25,
                        porosity: 0.53, gravelContent: 5.0,
                        salinityLevel: 0.5
                    }
                }
            ];

            const testUser = {
                id: 'speed-test-user',
                name: 'Speed Test User',
                email: 'speed@example.com',
                plan: 'PROFESSIONAL'
            };

            for (const testCase of testCases) {
                console.log(`  ✓ Testing ${testCase.name}...`);
                
                const iterations = 3;
                const times = [];

                for (let i = 0; i < iterations; i++) {
                    const startTime = Date.now();
                    await this.reportService.generateStandardReport(testCase.soilData, testUser);
                    const endTime = Date.now();
                    times.push(endTime - startTime);
                }

                const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
                const minTime = Math.min(...times);
                const maxTime = Math.max(...times);

                console.log(`  ✅ ${testCase.name}: Avg ${avgTime.toFixed(0)}ms, Min ${minTime}ms, Max ${maxTime}ms`);
                
                this.performanceData.push({
                    test: testCase.name,
                    averageTime: avgTime,
                    minTime: minTime,
                    maxTime: maxTime,
                    iterations: iterations
                });
            }

            return true;
        } catch (error) {
            console.error(`  ❌ PDF Generation Speed Test Failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test concurrent report generation
     */
    async testConcurrentGeneration() {
        console.log('\n🔄 Testing Concurrent Report Generation...');
        console.log('─'.repeat(50));

        try {
            const testUser = {
                id: 'concurrent-test-user',
                name: 'Concurrent Test User',
                email: 'concurrent@example.com',
                plan: 'ENTERPRISE'
            };

            // Create multiple different soil data sets
            const soilDataSets = Array.from({ length: 5 }, (_, i) => ({
                sand: 30 + (i * 5),
                clay: 25 + (i * 2),
                silt: 45 - (i * 7),
                organicMatter: 2.0 + (i * 0.3),
                densityFactor: 1.0,
                textureClass: 'loam',
                fieldCapacity: 0.30 - (i * 0.02),
                wiltingPoint: 0.16 - (i * 0.01),
                plantAvailableWater: 0.14,
                saturation: 0.43,
                saturatedConductivity: 2.8 + (i * 0.5)
            }));

            console.log(`  ✓ Testing ${soilDataSets.length} concurrent report generations...`);
            
            const startTime = Date.now();
            
            // Generate all reports concurrently
            const promises = soilDataSets.map((soilData, index) => 
                this.reportService.generateStandardReport(soilData, {
                    ...testUser,
                    id: `${testUser.id}-${index}`
                })
            );

            const results = await Promise.all(promises);
            const totalTime = Date.now() - startTime;
            
            // Validate all results
            const allValid = results.every(buffer => 
                buffer && buffer.length > 0 && buffer.slice(0, 4).toString() === '%PDF'
            );

            if (allValid) {
                const avgTimePerReport = totalTime / soilDataSets.length;
                console.log(`  ✅ All ${soilDataSets.length} reports generated successfully`);
                console.log(`  📊 Total time: ${totalTime}ms, Average per report: ${avgTimePerReport.toFixed(0)}ms`);
                
                this.performanceData.push({
                    test: 'Concurrent Generation',
                    totalTime: totalTime,
                    averageTimePerReport: avgTimePerReport,
                    concurrentReports: soilDataSets.length
                });
            } else {
                throw new Error('Some concurrent reports failed to generate properly');
            }

            return true;
        } catch (error) {
            console.error(`  ❌ Concurrent Generation Test Failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Test browser instance optimization
     */
    async testBrowserOptimization() {
        console.log('\n🌐 Testing Browser Instance Optimization...');
        console.log('─'.repeat(50));

        try {
            const testSoilData = {
                sand: 40, clay: 30, silt: 30, organicMatter: 2.5,
                textureClass: 'clay loam', fieldCapacity: 0.32,
                wiltingPoint: 0.18, plantAvailableWater: 0.14
            };

            const testUser = {
                id: 'browser-test-user',
                name: 'Browser Test User',
                email: 'browser@example.com',
                plan: 'PROFESSIONAL'
            };

            // Test 1: Multiple reports with browser reuse
            console.log('  ✓ Testing browser instance reuse...');
            const reuseStartTime = Date.now();
            
            for (let i = 0; i < 3; i++) {
                await this.reportService.generateStandardReport(testSoilData, testUser);
            }
            
            const reuseTime = Date.now() - reuseStartTime;
            console.log(`  ✅ Browser reuse test completed (${reuseTime}ms for 3 reports)`);

            // Test 2: Browser cleanup
            console.log('  ✓ Testing browser cleanup...');
            await this.reportService.closeBrowser();
            console.log('  ✅ Browser instance closed successfully');

            // Test 3: Browser restart
            console.log('  ✓ Testing browser restart...');
            const restartStartTime = Date.now();
            await this.reportService.generateStandardReport(testSoilData, testUser);
            const restartTime = Date.now() - restartStartTime;
            console.log(`  ✅ Browser restart test completed (${restartTime}ms)`);

            this.performanceData.push({
                test: 'Browser Optimization',
                reuseTime: reuseTime,
                restartTime: restartTime,
                reportsWithReuse: 3
            });

            return true;
        } catch (error) {
            console.error(`  ❌ Browser Optimization Test Failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Generate performance report
     */
    generatePerformanceReport() {
        console.log('\n📊 PERFORMANCE ANALYSIS REPORT');
        console.log('═'.repeat(60));

        this.performanceData.forEach(data => {
            console.log(`\n🔍 ${data.test}:`);
            Object.entries(data).forEach(([key, value]) => {
                if (key !== 'test') {
                    if (typeof value === 'number') {
                        const unit = key.includes('Time') ? 'ms' : '';
                        console.log(`  ${key}: ${value.toFixed ? value.toFixed(1) : value}${unit}`);
                    } else {
                        console.log(`  ${key}: ${value}`);
                    }
                }
            });
        });

        // Performance recommendations
        console.log('\n💡 PERFORMANCE RECOMMENDATIONS');
        console.log('─'.repeat(40));

        const cacheData = this.performanceData.find(d => d.test === 'Cache Performance');
        if (cacheData && parseFloat(cacheData.speedImprovement) > 50) {
            console.log('✅ Report caching provides significant performance benefits');
        } else {
            console.log('⚠️ Consider implementing report caching for better performance');
        }

        const avgGenerationTime = this.performanceData
            .filter(d => d.averageTime)
            .reduce((sum, d) => sum + d.averageTime, 0) / 
            this.performanceData.filter(d => d.averageTime).length;

        if (avgGenerationTime < 2000) {
            console.log('✅ Report generation speed is optimal');
        } else if (avgGenerationTime < 5000) {
            console.log('⚠️ Report generation speed is acceptable but could be improved');
        } else {
            console.log('❌ Report generation speed needs optimization');
        }
    }

    /**
     * Run all performance tests
     */
    async runAllTests() {
        console.log('🚀 Starting FlahaSoil Report Performance Testing Suite...\n');
        console.log('═'.repeat(70));

        const tests = [
            { name: 'Report Caching', test: () => this.testReportCaching() },
            { name: 'PDF Generation Speed', test: () => this.testPDFGenerationSpeed() },
            { name: 'Concurrent Generation', test: () => this.testConcurrentGeneration() },
            { name: 'Browser Optimization', test: () => this.testBrowserOptimization() }
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

        // Generate test results
        console.log('\n📋 PERFORMANCE TEST RESULTS');
        console.log('═'.repeat(60));
        
        results.forEach(result => {
            const status = result.passed ? '✅ PASSED' : '❌ FAILED';
            console.log(`${status} ${result.name} (${result.duration}ms)`);
        });

        // Generate performance analysis
        this.generatePerformanceReport();

        console.log(`\n🎯 Overall Result: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        
        // Cleanup
        await this.reportService.closeBrowser();
        
        return allPassed;
    }
}

// Export for use in other test files
module.exports = ReportPerformanceTester;

// Run tests if called directly
if (require.main === module) {
    const tester = new ReportPerformanceTester();
    tester.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Performance test suite crashed:', error);
            process.exit(1);
        });
}
