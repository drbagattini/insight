// Using built-in fetch (Node 18+)
require('dotenv').config({ path: '.env.local' });

async function testAPIEndpoint() {
  console.log('🔍 Testing API endpoint for server errors...\n');

  try {
    // Test the questionnaires API endpoint
    const response = await fetch('http://localhost:3000/api/cuestionarios/public', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response successful');
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.questionnaires && Array.isArray(data.questionnaires)) {
      console.log(`Found ${data.questionnaires.length} questionnaires`);
      
      // Check for OYS questionnaires specifically
      const oysQuests = data.questionnaires.filter(q => q.codigo && q.codigo.includes('OYS'));
      console.log(`OYS questionnaires: ${oysQuests.length}`);
      
      oysQuests.forEach(q => {
        console.log(`  - ${q.codigo}: ${q.titulo} → ${q.destinatario || 'no destinatario'}`);
      });
    }

  } catch (error) {
    console.error('❌ Network/Connection error:', error.message);
  }
}

testAPIEndpoint();
