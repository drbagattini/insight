// Test script to debug OYS questionnaire endpoint
const fetch = require('node-fetch');

async function testOYSEndpoint() {
  console.log('🧪 Testing OYS Questionnaire Endpoint\n');
  
  try {
    // Test with a sample token from the screenshot
    const testToken = 'your-token-here'; // Replace with actual token from URL
    
    console.log('1️⃣ Testing verificar endpoint...');
    const response = await fetch(`http://localhost:3000/api/cuestionarios/verificar/${testToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      console.error('❌ Response not OK:', response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('\n2️⃣ Response data structure:');
    console.log('- pacienteId:', data.pacienteId);
    console.log('- pacienteNombre:', data.pacienteNombre);
    console.log('- cuestionarioId:', data.cuestionarioId);
    console.log('- expirado:', data.expirado);
    
    console.log('\n3️⃣ Questionnaire details:');
    console.log('- codigo:', data.cuestionario?.codigo);
    console.log('- titulo:', data.cuestionario?.titulo);
    console.log('- items type:', typeof data.cuestionario?.items);
    console.log('- items is array:', Array.isArray(data.cuestionario?.items));
    console.log('- items length:', data.cuestionario?.items?.length);
    
    if (data.cuestionario?.items && Array.isArray(data.cuestionario.items)) {
      console.log('\n4️⃣ First item analysis:');
      const firstItem = data.cuestionario.items[0];
      console.log('- id:', firstItem?.id);
      console.log('- orden:', firstItem?.orden);
      console.log('- texto preview:', firstItem?.texto?.substring(0, 50) + '...');
      console.log('- has opciones_respuesta:', !!firstItem?.opciones_respuesta);
      console.log('- opciones_respuesta length:', firstItem?.opciones_respuesta?.length);
      
      if (firstItem?.opciones_respuesta) {
        console.log('\n5️⃣ Response options:');
        firstItem.opciones_respuesta.forEach((opt, i) => {
          console.log(`  ${i}: valor=${opt.valor}, texto="${opt.texto}"`);
        });
      } else {
        console.log('❌ NO RESPONSE OPTIONS FOUND!');
      }
    } else {
      console.log('❌ Items is not an array or is empty');
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error);
  }
}

console.log('📝 To test with actual token, replace "your-token-here" with the token from your browser URL');
console.log('Example: node scripts/test-oys-endpoint.js\n');

// Only run if token is provided as argument
const token = process.argv[2];
if (token && token !== 'your-token-here') {
  testOYSEndpoint();
} else {
  console.log('Usage: node scripts/test-oys-endpoint.js <token>');
  console.log('Get the token from the URL in your browser: /cuestionario/[TOKEN]');
}
