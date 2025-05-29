/**
 * FlahaSoil Report Testing Suite - Complete Test Runner
 * Runs all report-related tests and generates comprehensive results
 */

const fs = require('fs').promises;
const path = require('path');

// Import test classes
const BasicReportTester = require('./test-report-basic');
const ReportTester = require('./test-report-functionality');
const ReportPerformanceTester = require('./test-report-performance');

class ComprehensiveReportTestRunner {
    constructor() {
        this.testResults = [];
        this.startTime = Date.now();
        this.outputDir = path.join(__dirname, 'test-outputs');
    }

    /**
     * Initialize test environment
     */
    async initialize() {
        console.log('🚀 FlahaSoil Report Testing Suite - Complete Validation');
        console.log('═'.repeat(80));
        console.log(`📅 Test Date: ${new Date().toLocaleString()}`);
        console.log(`📁 Output Directory: ${this.outputDir}`);
        console.log('');

        // Ensure output directory exists
        await fs.mkdir(this.outputDir, { recursive: true });
    }

    /**
     * Run basic functionality tests
     */
    async runBasicTests() {
        console.log('🔧 BASIC FUNCTIONALITY TESTS');
        console.log('─'.repeat(50));

        const tester = new BasicReportTester();
        const startTime = Date.now();
        const success = await tester.runAllTests();
        const duration = Date.now() - startTime;

        this.testResults.push({
            category: 'Basic Functionality',
            success: success,
            duration: duration,
            details: 'HTML generation, browser initialization, service methods, simple PDF generation'
        });

        return success;
    }

    /**
     * Run comprehensive functionality tests
     */
    async runFunctionalityTests() {
        console.log('\n📄 COMPREHENSIVE FUNCTIONALITY TESTS');
        console.log('─'.repeat(50));

        const tester = new ReportTester();
        const startTime = Date.now();
        const success = await tester.runAllTests();
        const duration = Date.now() - startTime;

        this.testResults.push({
            category: 'Comprehensive Functionality',
            success: success,
            duration: duration,
            details: 'PDF generation, custom branding, print layouts, memory usage'
        });

        return success;
    }

    /**
     * Run performance tests
     */
    async runPerformanceTests() {
        console.log('\n⚡ PERFORMANCE TESTS');
        console.log('─'.repeat(50));

        const tester = new ReportPerformanceTester();
        const startTime = Date.now();
        const success = await tester.runAllTests();
        const duration = Date.now() - startTime;

        this.testResults.push({
            category: 'Performance',
            success: success,
            duration: duration,
            details: 'Caching, speed optimization, concurrent generation, browser optimization'
        });

        return success;
    }

    /**
     * Generate test summary report
     */
    generateSummaryReport() {
        const totalDuration = Date.now() - this.startTime;
        const allPassed = this.testResults.every(result => result.success);
        const passedCount = this.testResults.filter(result => result.success).length;
        const totalCount = this.testResults.length;

        console.log('\n📊 COMPREHENSIVE TEST RESULTS SUMMARY');
        console.log('═'.repeat(80));

        // Individual test results
        this.testResults.forEach(result => {
            const status = result.success ? '✅ PASSED' : '❌ FAILED';
            const duration = `${(result.duration / 1000).toFixed(1)}s`;
            console.log(`${status} ${result.category} (${duration})`);
            console.log(`   ${result.details}`);
        });

        // Overall statistics
        console.log('\n📈 OVERALL STATISTICS');
        console.log('─'.repeat(40));
        console.log(`Total Test Categories: ${totalCount}`);
        console.log(`Passed: ${passedCount}`);
        console.log(`Failed: ${totalCount - passedCount}`);
        console.log(`Success Rate: ${((passedCount / totalCount) * 100).toFixed(1)}%`);
        console.log(`Total Duration: ${(totalDuration / 1000).toFixed(1)}s`);

        // Final verdict
        console.log('\n🎯 FINAL VERDICT');
        console.log('─'.repeat(40));
        if (allPassed) {
            console.log('✅ ALL TESTS PASSED - PRODUCTION READY! 🚀');
            console.log('   The FlahaSoil report system is fully validated and ready for deployment.');
        } else {
            console.log('⚠️ SOME TESTS FAILED - REVIEW REQUIRED');
            console.log('   Please review failed tests before production deployment.');
        }

        return allPassed;
    }

    /**
     * Generate detailed test report file
     */
    async generateDetailedReport() {
        const reportContent = this.createDetailedReportContent();
        const reportPath = path.join(this.outputDir, `test-report-${Date.now()}.md`);
        
        await fs.writeFile(reportPath, reportContent);
        console.log(`\n📄 Detailed report saved: ${reportPath}`);
        
        return reportPath;
    }

    /**
     * Create detailed report content
     */
    createDetailedReportContent() {
        const totalDuration = Date.now() - this.startTime;
        const allPassed = this.testResults.every(result => result.success);
        
        return `# FlahaSoil Report Testing - Detailed Results

## Test Execution Summary

**Date:** ${new Date().toLocaleString()}  
**Total Duration:** ${(totalDuration / 1000).toFixed(1)} seconds  
**Overall Status:** ${allPassed ? '✅ PASSED' : '❌ FAILED'}  

## Test Categories

${this.testResults.map(result => `
### ${result.category}
- **Status:** ${result.success ? '✅ PASSED' : '❌ FAILED'}
- **Duration:** ${(result.duration / 1000).toFixed(1)} seconds
- **Details:** ${result.details}
`).join('')}

## Test Environment

- **Node.js Version:** ${process.version}
- **Platform:** ${process.platform}
- **Architecture:** ${process.arch}
- **Memory Usage:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB

## Generated Test Files

All test artifacts are saved in: \`${this.outputDir}\`

### PDF Test Files
- Standard reports: \`test-standard-report-*.pdf\`
- Custom reports: \`test-custom-*.pdf\`
- Print layouts: \`test-print-*.pdf\`

### HTML Test Files
- Standard HTML: \`test-standard-report-*.html\`
- Custom HTML: \`test-custom-report-*.html\`

## Recommendations

${allPassed ? 
`✅ **Production Ready**
- All tests passed successfully
- Report generation is working correctly
- Performance is within acceptable limits
- Ready for production deployment` :
`⚠️ **Review Required**
- Some tests failed and need attention
- Review failed test categories above
- Fix issues before production deployment`}

## Next Steps

1. Review test results and any failed tests
2. Validate generated PDF files manually
3. Test report functionality in staging environment
4. Deploy to production when all tests pass

---
*Generated by FlahaSoil Report Testing Suite*
`;
    }

    /**
     * Run all tests and generate comprehensive report
     */
    async runAllTests() {
        await this.initialize();

        try {
            // Run all test categories
            const basicSuccess = await this.runBasicTests();
            const functionalitySuccess = await this.runFunctionalityTests();
            const performanceSuccess = await this.runPerformanceTests();

            // Generate summary
            const overallSuccess = this.generateSummaryReport();

            // Generate detailed report
            await this.generateDetailedReport();

            return overallSuccess;
        } catch (error) {
            console.error('\n❌ Test suite crashed:', error);
            return false;
        }
    }
}

// Run comprehensive tests if called directly
if (require.main === module) {
    const runner = new ComprehensiveReportTestRunner();
    runner.runAllTests()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('❌ Test runner crashed:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveReportTestRunner;
