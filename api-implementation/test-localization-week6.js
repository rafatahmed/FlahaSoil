/**
 * Localization System Test - Week 6 Implementation
 * Tests the multi-language support for crop database and DSS system
 * 
 * @format
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3001/api/v1';

async function testLocalizationWeek6() {
    console.log('🌍 Testing Localization System - Week 6');
    console.log('📊 Target: Arabic and French support for 13-crop database');
    console.log('='.repeat(70));

    let testResults = {
        total: 0,
        passed: 0,
        failed: 0,
        errors: []
    };

    // Test 1: Supported Languages
    console.log('\n🗣️  Test 1: Supported Languages');
    try {
        testResults.total++;
        
        const response = await axios.get(`${API_BASE_URL}/localization/languages`);
        const data = response.data;

        if (data.success && data.data.languages.length >= 3) {
            console.log('✅ Supported languages endpoint working');
            console.log(`   Total Languages: ${data.data.totalSupported}`);
            data.data.languages.forEach(lang => {
                console.log(`   ${lang.code}: ${lang.name} (${lang.nativeName}) - ${lang.region}`);
            });
            
            // Check for required languages
            const languageCodes = data.data.languages.map(l => l.code);
            const requiredLangs = ['en', 'ar', 'fr'];
            const hasAllRequired = requiredLangs.every(lang => languageCodes.includes(lang));
            
            if (hasAllRequired) {
                console.log('✅ All required languages (en, ar, fr) supported');
                testResults.passed++;
            } else {
                throw new Error('Missing required languages');
            }
        } else {
            throw new Error('Invalid languages response');
        }
    } catch (error) {
        console.log('❌ Supported languages test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Languages: ${error.message}`);
    }

    // Test 2: English Crop Translations (Default)
    console.log('\n🇺🇸 Test 2: English Crop Translations (Default)');
    try {
        testResults.total++;
        
        const response = await axios.get(`${API_BASE_URL}/localization/crops?lang=en`);
        const data = response.data;

        if (data.success && data.data.length === 13) {
            console.log('✅ English crop translations working');
            console.log(`   Total Crops: ${data.data.length}`);
            
            // Check some specific crops
            const tomato = data.data.find(crop => crop.name === 'Tomato');
            const datePalm = data.data.find(crop => crop.name === 'Date Palm');
            
            if (tomato && datePalm) {
                console.log(`   Tomato: ${tomato.localizedName} (${tomato.localizedCategory})`);
                console.log(`   Date Palm: ${datePalm.localizedName} (${datePalm.localizedCategory})`);
                testResults.passed++;
            } else {
                throw new Error('Missing key crops in translation');
            }
        } else {
            throw new Error(`Expected 13 crops, got ${data.data?.length || 0}`);
        }
    } catch (error) {
        console.log('❌ English translations test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`English: ${error.message}`);
    }

    // Test 3: Arabic Crop Translations
    console.log('\n🇸🇦 Test 3: Arabic Crop Translations');
    try {
        testResults.total++;
        
        const response = await axios.get(`${API_BASE_URL}/localization/crops?lang=ar`);
        const data = response.data;

        if (data.success && data.data.length === 13) {
            console.log('✅ Arabic crop translations working');
            console.log(`   Total Crops: ${data.data.length}`);
            console.log(`   Language Direction: ${data.metadata.direction}`);
            
            // Check Arabic translations
            const tomato = data.data.find(crop => crop.name === 'Tomato');
            const wheat = data.data.find(crop => crop.name === 'Wheat');
            const datePalm = data.data.find(crop => crop.name === 'Date Palm');
            
            if (tomato && wheat && datePalm) {
                console.log(`   طماطم: ${tomato.localizedName} (${tomato.localizedCategory})`);
                console.log(`   قمح: ${wheat.localizedName} (${wheat.localizedCategory})`);
                console.log(`   نخيل التمر: ${datePalm.localizedName} (${datePalm.localizedCategory})`);
                
                // Verify RTL direction for Arabic
                if (data.metadata.direction === 'rtl') {
                    console.log('✅ Arabic RTL direction correctly set');
                    testResults.passed++;
                } else {
                    throw new Error('Arabic should have RTL direction');
                }
            } else {
                throw new Error('Missing key crops in Arabic translation');
            }
        } else {
            throw new Error(`Expected 13 crops, got ${data.data?.length || 0}`);
        }
    } catch (error) {
        console.log('❌ Arabic translations test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Arabic: ${error.message}`);
    }

    // Test 4: French Crop Translations
    console.log('\n🇫🇷 Test 4: French Crop Translations');
    try {
        testResults.total++;
        
        const response = await axios.get(`${API_BASE_URL}/localization/crops?lang=fr`);
        const data = response.data;

        if (data.success && data.data.length === 13) {
            console.log('✅ French crop translations working');
            console.log(`   Total Crops: ${data.data.length}`);
            
            // Check French translations
            const tomato = data.data.find(crop => crop.name === 'Tomato');
            const wheat = data.data.find(crop => crop.name === 'Wheat');
            const potato = data.data.find(crop => crop.name === 'Potato');
            
            if (tomato && wheat && potato) {
                console.log(`   Tomate: ${tomato.localizedName} (${tomato.localizedCategory})`);
                console.log(`   Blé: ${wheat.localizedName} (${wheat.localizedCategory})`);
                console.log(`   Pomme de terre: ${potato.localizedName} (${potato.localizedCategory})`);
                testResults.passed++;
            } else {
                throw new Error('Missing key crops in French translation');
            }
        } else {
            throw new Error(`Expected 13 crops, got ${data.data?.length || 0}`);
        }
    } catch (error) {
        console.log('❌ French translations test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`French: ${error.message}`);
    }

    // Test 5: BBCH Stage Translations
    console.log('\n📈 Test 5: BBCH Stage Translations');
    try {
        testResults.total++;
        
        // Test Arabic BBCH stages
        const responseAr = await axios.get(`${API_BASE_URL}/localization/bbch-stages?lang=ar`);
        const dataAr = responseAr.data;

        // Test French BBCH stages
        const responseFr = await axios.get(`${API_BASE_URL}/localization/bbch-stages?lang=fr`);
        const dataFr = responseFr.data;

        if (dataAr.success && dataFr.success) {
            console.log('✅ BBCH stage translations working');
            console.log(`   Arabic BBCH Stages: ${dataAr.data.length}`);
            console.log(`   French BBCH Stages: ${dataFr.data.length}`);
            
            // Check specific stage translations
            const stage00Ar = dataAr.data.find(stage => stage.stageCode === '00');
            const stage61Fr = dataFr.data.find(stage => stage.stageCode === '61');
            
            if (stage00Ar && stage61Fr) {
                console.log(`   Arabic Stage 00: ${stage00Ar.localizedStageName}`);
                console.log(`   French Stage 61: ${stage61Fr.localizedStageName}`);
                testResults.passed++;
            } else {
                throw new Error('Missing specific BBCH stage translations');
            }
        } else {
            throw new Error('BBCH stage translation endpoints failed');
        }
    } catch (error) {
        console.log('❌ BBCH stage translations test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`BBCH Stages: ${error.message}`);
    }

    // Test 6: DSS Interface Terms
    console.log('\n💧 Test 6: DSS Interface Terms');
    try {
        testResults.total++;
        
        // Test Arabic DSS terms
        const responseAr = await axios.get(`${API_BASE_URL}/localization/dss-terms?lang=ar`);
        const dataAr = responseAr.data;

        // Test French DSS terms
        const responseFr = await axios.get(`${API_BASE_URL}/localization/dss-terms?lang=fr`);
        const dataFr = responseFr.data;

        if (dataAr.success && dataFr.success) {
            console.log('✅ DSS interface terms working');
            
            // Check key agricultural terms
            console.log(`   Arabic Irrigation: ${dataAr.data.irrigation}`);
            console.log(`   Arabic Evapotranspiration: ${dataAr.data.evapotranspiration}`);
            console.log(`   French Irrigation: ${dataFr.data.irrigation}`);
            console.log(`   French Crop Coefficient: ${dataFr.data.cropCoefficient}`);
            
            // Verify RTL for Arabic
            if (dataAr.data.direction === 'rtl' && dataFr.data.direction === 'ltr') {
                console.log('✅ Text directions correctly set');
                testResults.passed++;
            } else {
                throw new Error('Incorrect text directions');
            }
        } else {
            throw new Error('DSS terms endpoints failed');
        }
    } catch (error) {
        console.log('❌ DSS interface terms test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`DSS Terms: ${error.message}`);
    }

    // Test 7: Crop Details with Localization
    console.log('\n🌾 Test 7: Crop Details with Localization');
    try {
        testResults.total++;
        
        // Get a crop ID first
        const cropsResponse = await axios.get(`${API_BASE_URL}/localization/crops?lang=en`);
        const tomatoCrop = cropsResponse.data.data.find(crop => crop.name === 'Tomato');
        
        if (!tomatoCrop) {
            throw new Error('Tomato crop not found');
        }

        // Get detailed crop info in Arabic
        const detailsResponse = await axios.get(`${API_BASE_URL}/localization/crops/${tomatoCrop.id}?lang=ar`);
        const detailsData = detailsResponse.data;

        if (detailsData.success && detailsData.data.bbchStages.length > 0) {
            console.log('✅ Crop details with localization working');
            console.log(`   Crop: ${detailsData.data.localizedName}`);
            console.log(`   BBCH Stages: ${detailsData.data.bbchStages.length}`);
            console.log(`   Kc Periods: ${detailsData.data.kcPeriods.length}`);
            
            // Check localized BBCH stage
            const firstStage = detailsData.data.bbchStages[0];
            console.log(`   First Stage: ${firstStage.localizedStageName}`);
            
            testResults.passed++;
        } else {
            throw new Error('Invalid crop details response');
        }
    } catch (error) {
        console.log('❌ Crop details localization test failed:', error.message);
        testResults.failed++;
        testResults.errors.push(`Crop Details: ${error.message}`);
    }

    // Test Summary
    console.log('\n' + '='.repeat(70));
    console.log('📊 LOCALIZATION SYSTEM TEST SUMMARY');
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
        console.log('\n🎉 All localization tests passed! Week 6 multi-language support successful.');
        console.log('\n✨ Key Features Verified:');
        console.log('   • Arabic (العربية) support for GCC/MENA region');
        console.log('   • French (Français) support for North Africa');
        console.log('   • RTL text direction for Arabic');
        console.log('   • Comprehensive crop name translations');
        console.log('   • BBCH stage localization');
        console.log('   • Agricultural terminology translations');
        console.log('   • DSS interface multi-language support');
    } else if (testResults.passed >= testResults.total * 0.8) {
        console.log('\n⚠️  Most tests passed. Localization system is functional with minor issues.');
    } else {
        console.log('\n🔴 Multiple test failures. Localization system needs attention.');
    }

    return testResults;
}

// Run the test
if (require.main === module) {
    testLocalizationWeek6()
        .then((results) => {
            process.exit(results.failed === 0 ? 0 : 1);
        })
        .catch((error) => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = testLocalizationWeek6;
