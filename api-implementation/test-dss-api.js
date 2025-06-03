const axios = require('axios');

async function testDSSAPI() {
    try {
        console.log('🧪 Testing DSS API...');
        
        // Login first
        const authResponse = await axios.post('http://localhost:3001/api/v1/auth/login', {
            email: 'pro@flahasoil.com',
            password: 'pro123'
        });
        
        const token = authResponse.data.token;
        console.log('✅ Authentication successful');
        
        // Test crops endpoint
        const cropsResponse = await axios.get('http://localhost:3001/api/v1/dss/crops', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('✅ Crops loaded:', cropsResponse.data.count, 'crops available');
        
        // Get a crop ID for testing
        const cropId = cropsResponse.data.data[0]?.id;
        if (!cropId) {
            console.log('❌ No crops available for testing');
            return;
        }
        
        console.log('   Using crop:', cropsResponse.data.data[0].name, '(ID:', cropId, ')');
        
        // Get soil analysis ID
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        const soilAnalysis = await prisma.soilAnalysis.findFirst({
            orderBy: { createdAt: 'desc' }
        });
        
        if (!soilAnalysis) {
            console.log('❌ No soil analysis available for testing');
            return;
        }
        
        console.log('   Using soil analysis ID:', soilAnalysis.id);
        
        // Test DSS calculation
        const calculationData = {
            soilAnalysisId: soilAnalysis.id,
            cropId: cropId,
            fieldArea: 2.5,
            et0Value: 5.0,
            et0Source: 'manual',
            climateZone: 'gcc_arid',
            irrigationMethod: 'drip',
            growthStage: 'mid'
        };
        
        const dssResponse = await axios.post('http://localhost:3001/api/v1/dss/calculate', calculationData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (dssResponse.data.success) {
            console.log('✅ DSS Calculation SUCCESSFUL!');
            console.log('   Calculation ID:', dssResponse.data.data.calculationId);
            console.log('   ETc Calculated:', dssResponse.data.data.etcCalculated, 'mm/day');
            console.log('   Irrigation Depth:', dssResponse.data.data.irrigationDepth, 'mm');
            console.log('   System Recommendation:', dssResponse.data.data.systemRecommendation);
            console.log('   Economic ROI:', dssResponse.data.data.economicROI, '%');
        } else {
            console.log('❌ DSS Calculation Failed:', dssResponse.data);
        }
        
        await prisma.$disconnect();
        
    } catch (error) {
        console.log('❌ DSS API Test Error:', error.response?.data || error.message);
    }
}

testDSSAPI();
