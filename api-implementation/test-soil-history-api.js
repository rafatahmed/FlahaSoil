const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function testSoilHistoryAPI() {
  try {
    console.log('🔑 Creating token with JWT_SECRET...');
    
    // Create a valid token for the professional user
    const token = jwt.sign(
      { 
        userId: 'cmb9gnmgj000013l9lo1toam7',
        email: 'pro@flahasoil.com',
        tier: 'PROFESSIONAL'
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Token created successfully');
    console.log('🔍 Token preview:', token.substring(0, 50) + '...');
    
    // Test the soil history endpoint
    console.log('📡 Testing /api/v1/soil/history endpoint...');
    
    const response = await fetch('http://localhost:3001/api/v1/soil/history', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response status text:', response.statusText);
    
    const responseText = await response.text();
    console.log('📄 Raw response:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ API Response Success!');
        console.log('📋 Data structure:');
        console.log('   - success:', data.success);
        console.log('   - data length:', data.data ? data.data.length : 'N/A');
        console.log('   - pagination:', data.pagination);
        
        if (data.data && data.data.length > 0) {
          console.log('📊 First analysis sample:');
          const first = data.data[0];
          console.log('   - ID:', first.id);
          console.log('   - Sand:', first.sand + '%');
          console.log('   - Clay:', first.clay + '%');
          console.log('   - Silt:', first.silt + '%');
          console.log('   - Texture:', first.textureClass);
          console.log('   - Field Capacity:', first.fieldCapacity + '%');
          console.log('   - Wilting Point:', first.wiltingPoint + '%');
          console.log('   - PAW:', first.plantAvailableWater + '%');
          console.log('   - Ksat:', first.saturatedConductivity + ' mm/hr');
          console.log('   - Created:', first.createdAt);
        }
        
      } catch (parseError) {
        console.log('❌ Failed to parse JSON response:', parseError.message);
      }
    } else {
      console.log('❌ API Error:', response.status, response.statusText);
      console.log('❌ Error details:', responseText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

testSoilHistoryAPI();
