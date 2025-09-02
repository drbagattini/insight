const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testDynamicScaleDescription() {
  console.log('🧪 Testing dynamic scale description for OYS...');
  
  try {
    // Find a recent OYS response
    const { data: responses, error: responseError } = await supabase
      .from('respuestas')
      .select(`
        id,
        cuestionario_id,
        respuestas,
        cuestionarios!inner (
          codigo,
          titulo,
          descripcion_escala
        )
      `)
      .eq('cuestionarios.codigo', 'OYS-PADRES-40')
      .limit(1);

    if (responseError || !responses || responses.length === 0) {
      console.error('❌ No OYS responses found');
      return;
    }

    const response = responses[0];
    const cuestionario = response.cuestionarios;
    
    console.log('📋 Testing with response ID:', response.id);
    console.log('📊 Questionnaire code:', cuestionario.codigo);
    
    // Test the dynamic scale description logic
    let scaleDescription = cuestionario?.descripcion_escala || 'Escala: 0 (No), 1 (Más bien no), 2 (Más o menos), 3 (Más bien sí), 4 (Sí)';
    
    console.log('🔍 Original scale description:', scaleDescription);
    
    if (cuestionario?.codigo?.includes('OYS') && cuestionario.codigo.includes('40')) {
      // For OYS consolidated, show both scales
      scaleDescription = 'Severidad (1-20): 0 (Nada en absoluto), 1 (Una o dos veces), 2 (Varias veces), 3 (A menudo), 4 (La mayor parte del tiempo), 5 (Todo el tiempo) | Funcionamiento (21-40): 0 (Problemas extremos), 1 (Bastantes problemas), 2 (Algunos problemas), 3 (Bien), 4 (Muy bien)';
      console.log('✅ Updated to dual scale description');
    } else {
      console.log('ℹ️  Using original scale description');
    }
    
    console.log('📝 Final scale description:');
    console.log(scaleDescription);
    
    // Test with a mock API call to localhost
    console.log('\n🌐 Testing actual API endpoint...');
    const testUrl = `http://localhost:3000/api/responses/${response.id}`;
    console.log('🔗 URL:', testUrl);
    
    try {
      const fetch = (await import('node-fetch')).default;
      const apiResponse = await fetch(testUrl);
      
      if (apiResponse.ok) {
        const data = await apiResponse.json();
        console.log('✅ API Response received');
        console.log('📊 Scale description from API:', data.questionnaire_scale_description);
      } else {
        console.log('⚠️  API call failed with status:', apiResponse.status);
      }
    } catch (fetchError) {
      console.log('⚠️  API call failed (server might not be running):', fetchError.message);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testDynamicScaleDescription();
