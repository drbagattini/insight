const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testResponseDetailEndpoint() {
  console.log('🧪 Testing response detail endpoint fix...');
  
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
    console.log('📋 Testing with response ID:', response.id);

    // Test the endpoint directly using Supabase admin
    const testUrl = `http://localhost:3000/api/responses/${response.id}`;
    console.log('🌐 Testing URL:', testUrl);

    // Since we can't easily test with auth, let's simulate the logic
    const cuestionario = response.cuestionarios;
    const rawAnswers = response.respuestas;
    
    console.log('🔍 Simulating endpoint logic...');
    
    // Simulate the questionsMap creation
    const questionsMap = new Map();
    const defaultLikertOptions = [
      { valor: 0, texto: 'Nada en absoluto' },
      { valor: 1, texto: 'Una o dos veces' },
      { valor: 2, texto: 'Varias veces' },
      { valor: 3, texto: 'A menudo' },
      { valor: 4, texto: 'La mayor parte del tiempo' },
      { valor: 5, texto: 'Todo el tiempo' }
    ];

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
        console.log(`📝 Mapped: ${stringId} -> "${processed.texto}"`);
      }
    });

    // Test mapping for first few answers
    console.log('🧪 Testing answer mapping:');
    rawAnswers.slice(0, 5).forEach((rawAnswer, idx) => {
      const lookupKey = String(rawAnswer.pregunta_id);
      const qDef = questionsMap.get(lookupKey);
      
      if (qDef) {
        console.log(`✅ ${lookupKey}: "${qDef.texto}" (value: ${rawAnswer.valor})`);
      } else {
        console.log(`❌ ${lookupKey}: Unknown Question`);
      }
    });

    const successfulMappings = rawAnswers.filter(answer => {
      const lookupKey = String(answer.pregunta_id);
      return questionsMap.has(lookupKey);
    }).length;

    console.log(`📊 Mapping success rate: ${successfulMappings}/${rawAnswers.length} (${Math.round(successfulMappings/rawAnswers.length*100)}%)`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testResponseDetailEndpoint();
