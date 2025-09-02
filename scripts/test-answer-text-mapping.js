const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testAnswerTextMapping() {
  console.log('🧪 Testing answer text mapping for OYS...');
  
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
          items
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
    const rawAnswers = response.respuestas;
    
    console.log('📋 Testing with response ID:', response.id);
    
    // Test the updated answer options
    const defaultLikertOptions = [
      { valor: 0, texto: 'Nada en absoluto' },
      { valor: 1, texto: 'Una o dos veces' },
      { valor: 2, texto: 'Varias veces' },
      { valor: 3, texto: 'A menudo' },
      { valor: 4, texto: 'La mayor parte del tiempo' },
      { valor: 5, texto: 'Todo el tiempo' }
    ];

    // Simulate the questionsMap creation with updated options
    const questionsMap = new Map();

    cuestionario.items.forEach((qDefRaw, idx) => {
      let processed = { ...qDefRaw };
      if (!processed.opciones_respuesta || processed.opciones_respuesta.length === 0) {
        processed.opciones_respuesta = defaultLikertOptions;
      }
      
      // Map both numeric ID and potential string ID patterns
      questionsMap.set(String(processed.id), processed);
      
      // For OYS consolidated questionnaires, also map the item-X-Y pattern
      if (cuestionario.codigo?.includes('OYS') && cuestionario.codigo.includes('40')) {
        const stringId = `item-${idx}-${processed.id}`;
        questionsMap.set(stringId, processed);
      }
    });

    // Test answer text mapping for values that had issues
    console.log('🧪 Testing answer text mapping:');
    
    const testValues = [0, 1, 2, 3, 4, 5];
    testValues.forEach(value => {
      const matchingOption = defaultLikertOptions.find(opt => opt.valor === value);
      if (matchingOption) {
        console.log(`✅ Value ${value}: "${matchingOption.texto}"`);
      } else {
        console.log(`❌ Value ${value}: No matching text found`);
      }
    });

    // Test specific answers from the response
    console.log('\n📝 Testing actual response answers:');
    rawAnswers.slice(0, 10).forEach((rawAnswer, idx) => {
      const lookupKey = String(rawAnswer.pregunta_id);
      const qDef = questionsMap.get(lookupKey);
      
      if (qDef) {
        let answerTextToShow = String(rawAnswer.valor);
        if (qDef.opciones_respuesta) {
          const matchingOption = qDef.opciones_respuesta.find(opt => opt.valor === rawAnswer.valor);
          if (matchingOption) {
            answerTextToShow = matchingOption.texto;
          }
        }
        
        console.log(`${idx + 1}. "${qDef.texto}" - Value: ${rawAnswer.valor} → "${answerTextToShow}"`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAnswerTextMapping();
