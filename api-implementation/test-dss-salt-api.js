const axios = require('axios');

async function testDSSWithSaltManagement() {
    try {
        console.log('🧪 Testing DSS API with Salt Management Details...');
        
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
        console.log('   Soil EC:', soilAnalysis.electricalConductivity || 'N/A');
        
        // Test DSS calculation with salt management
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
        
        console.log('📊 Sending DSS calculation request...');
        
        const dssResponse = await axios.post('http://localhost:3001/api/v1/dss/calculate', calculationData, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (dssResponse.data.success) {
            console.log('✅ DSS Calculation SUCCESSFUL!');
            console.log('   Calculation ID:', dssResponse.data.data.calculationId);
            console.log('   ETc Calculated:', dssResponse.data.data.etcCalculated, 'mm/day');
            console.log('   Irrigation Depth:', dssResponse.data.data.irrigationDepth, 'mm');
            console.log('   System Recommendation:', dssResponse.data.data.systemRecommendation);
            
            // Check for salt management results in detail
            console.log('\n🧂 SALT MANAGEMENT ANALYSIS:');
            
            if (dssResponse.data.data.saltManagement) {
                const salt = dssResponse.data.data.saltManagement;
                console.log('✅ Salt Management Results Found!');
                
                // Leaching analysis
                console.log('\n   📊 LEACHING ANALYSIS:');
                console.log('     Required:', salt.leaching.required);
                if (salt.leaching.required) {
                    console.log('     Leaching Fraction:', (salt.leaching.leachingFraction * 100).toFixed(1) + '%');
                    console.log('     Extra Water Needed:', salt.leaching.leachingDepth?.value || 'N/A', salt.leaching.leachingDepth?.unit || '');
                    console.log('     Frequency:', salt.leaching.frequency?.description || 'N/A');
                }
                
                // Drainage analysis
                console.log('\n   🚰 DRAINAGE ANALYSIS:');
                console.log('     Required:', salt.drainage.required);
                if (salt.drainage.required) {
                    console.log('     System Type:', salt.drainage.systemType);
                    console.log('     Urgency Level:', salt.drainage.urgency);
                    console.log('     Cost Estimate: $' + (salt.drainage.costEstimate?.toLocaleString() || 'TBD'));
                }
                
                // Salt balance
                console.log('\n   ⚖️  SALT BALANCE:');
                console.log('     Status:', salt.saltBalance.status);
                console.log('     Net Balance:', salt.saltBalance.netBalance?.value || 'N/A', salt.saltBalance.netBalance?.unit || '');
                console.log('     Trend:', salt.saltBalance.trend);
                
                // Overall assessment
                console.log('\n   🎯 OVERALL ASSESSMENT:');
                console.log('     Risk Level:', salt.summary.overallRisk);
                console.log('     Priority Actions:', salt.summary.priorityActions.length, 'actions');
                
                if (salt.summary.priorityActions.length > 0) {
                    console.log('     Actions:');
                    salt.summary.priorityActions.forEach((action, i) => {
                        console.log(`       ${i + 1}. ${action}`);
                    });
                }
                
                // Economic impact
                if (salt.summary.economicImpact) {
                    console.log('\n   💰 ECONOMIC IMPACT:');
                    console.log('     Total Cost: $' + (salt.summary.economicImpact.totalCost?.toLocaleString() || '0'));
                    console.log('     Total Benefit: $' + (salt.summary.economicImpact.totalBenefit?.toLocaleString() || '0'));
                    console.log('     Net Benefit: $' + (salt.summary.economicImpact.netBenefit?.toLocaleString() || '0'));
                    console.log('     Benefit-Cost Ratio:', salt.summary.economicImpact.benefitCostRatio?.toFixed(2) || 'N/A');
                }
                
            } else {
                console.log('❌ Salt Management Results NOT FOUND in API response');
                console.log('   Available keys in response:', Object.keys(dssResponse.data.data));
            }
            
        } else {
            console.log('❌ DSS Calculation Failed:', dssResponse.data);
        }
        
        await prisma.$disconnect();
        
    } catch (error) {
        console.log('❌ DSS Test Error:', error.response?.data || error.message);
        if (error.response?.data) {
            console.log('   Response status:', error.response.status);
            console.log('   Response data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testDSSWithSaltManagement();
