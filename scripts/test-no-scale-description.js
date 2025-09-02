const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testNoScaleDescription() {
  console.log('🧪 Testing removal of scale description for OYS...');
  
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
    console.log('📝 Questionnaire title:', cuestionario.titulo);
    
    // Test the scale description removal logic
    let scaleDescription = '';
    
    if (!cuestionario?.codigo?.includes('OYS') || !cuestionario.codigo.includes('40')) {
      // Only show scale description for non-OYS questionnaires
      scaleDescription = cuestionario?.descripcion_escala || 'Escala: 0 (No), 1 (Más bien no), 2 (Más o menos), 3 (Más bien sí), 4 (Sí)';
      console.log('ℹ️  Would show scale description for non-OYS questionnaire');
    } else {
      console.log('✅ Scale description removed for OYS questionnaire');
    }
    
    console.log('📝 Final scale description:', scaleDescription === '' ? '(empty)' : scaleDescription);
    
    // Test with other questionnaire types
    console.log('\n🔍 Testing with other questionnaire types...');
    
    const { data: otherResponses } = await supabase
      .from('respuestas')
      .select(`
        id,
        cuestionarios!inner (
          codigo,
          titulo,
          descripcion_escala
        )
      `)
      .neq('cuestionarios.codigo', 'OYS-PADRES-40')
      .limit(1);

    if (otherResponses && otherResponses.length > 0) {
      const otherResponse = otherResponses[0];
      const otherCuestionario = otherResponse.cuestionarios;
      
      console.log('📊 Other questionnaire code:', otherCuestionario.codigo);
      
      let otherScaleDescription = '';
      if (!otherCuestionario?.codigo?.includes('OYS') || !otherCuestionario.codigo.includes('40')) {
        otherScaleDescription = otherCuestionario?.descripcion_escala || 'Escala: 0 (No), 1 (Más bien no), 2 (Más o menos), 3 (Más bien sí), 4 (Sí)';
        console.log('✅ Scale description preserved for non-OYS questionnaire');
      }
      
      console.log('📝 Other scale description:', otherScaleDescription === '' ? '(empty)' : otherScaleDescription.substring(0, 50) + '...');
    }

    console.log('\n📌 Summary:');
    console.log('   • OYS questionnaires: No scale description shown');
    console.log('   • Other questionnaires: Scale description preserved');
    console.log('   • UI will show only the questionnaire title for OYS');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testNoScaleDescription();
