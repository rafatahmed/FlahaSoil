const DSSCalculationService = require('./src/services/dssCalculationService');

async function testSaltIntegration() {
    try {
        console.log('🧪 Testing Salt Management Integration...');
        
        const dssService = new DSSCalculationService();
        
        // Test data
        const soilData = {
            sand: 45,
            clay: 25,
            silt: 30,
            fieldCapacity: 25,
            wiltingPoint: 12,
            saturatedConductivity: 15,
            electricalConductivity: 2.5,
            textureClass: 'loam'
        };
        
        const irrigationResults = {
            irrigationDepth: 50,
            frequency: 3
        };
        
        const environmentalData = {
            climateZone: 'gcc_arid',
            temperature: 42,
            humidity: 25
        };
        
        const fieldConfig = {
            area: 2.5
        };
        
        console.log('📊 Testing salt management calculation...');
        
        const saltResults = await dssService.calculateSaltManagement(
            soilData,
            irrigationResults,
            environmentalData,
            fieldConfig
        );
        
        console.log('✅ Salt Management Results:');
        console.log('   Leaching Required:', saltResults.leaching.required);
        console.log('   Drainage Required:', saltResults.drainage.required);
        console.log('   Salt Balance Status:', saltResults.saltBalance.status);
        console.log('   Overall Risk:', saltResults.summary.overallRisk);
        console.log('   Priority Actions:', saltResults.summary.priorityActions.length, 'actions');
        
        if (saltResults.summary.priorityActions.length > 0) {
            console.log('   Actions:');
            saltResults.summary.priorityActions.forEach((action, i) => {
                console.log(`     ${i + 1}. ${action}`);
            });
        }
        
        console.log('✅ Salt management integration working!');
        
    } catch (error) {
        console.error('❌ Salt integration test failed:', error.message);
        console.error('   Stack:', error.stack);
    }
}

testSaltIntegration();
