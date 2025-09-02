const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testOYSDualScales() {
  console.log('🧪 Testing OYS dual scales implementation...');
  
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
    
    // Test the dual scale implementation
    const problemSeverityOptions = [
      { valor: 0, texto: 'Nada en absoluto' },
      { valor: 1, texto: 'Una o dos veces' },
      { valor: 2, texto: 'Varias veces' },
      { valor: 3, texto: 'A menudo' },
      { valor: 4, texto: 'La mayor parte del tiempo' },
      { valor: 5, texto: 'Todo el tiempo' }
    ];
    
    const functioningOptions = [
      { valor: 0, texto: 'Problemas extremos' },
      { valor: 1, texto: 'Bastantes problemas' },
      { valor: 2, texto: 'Algunos problemas' },
      { valor: 3, texto: 'Bien' },
      { valor: 4, texto: 'Muy bien' }
    ];

    // Simulate the questionsMap creation with dual scales
    const questionsMap = new Map();

    cuestionario.items.forEach((qDefRaw, idx) => {
      let processed = { ...qDefRaw };
      
      // Apply different scales based on item position for OYS-40
      if (cuestionario.codigo?.includes('OYS') && cuestionario.codigo.includes('40')) {
        if (idx < 20) {
          // Items 1-20: Problem Severity scale (0-5)
          processed.opciones_respuesta = problemSeverityOptions;
        } else {
          // Items 21-40: Functioning scale (0-4)
          processed.opciones_respuesta = functioningOptions;
        }
      }
      
      // Map both numeric ID and string ID patterns
      questionsMap.set(String(processed.id), processed);
      const stringId = `item-${idx}-${processed.id}`;
      questionsMap.set(stringId, processed);
    });

    // Test answer text mapping for both sections
    console.log('\n🔍 Testing Problem Severity section (items 1-20):');
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
        
        const section = idx < 20 ? 'SEVERITY' : 'FUNCTIONING';
        console.log(`${idx + 1}. [${section}] "${qDef.texto}" - Value: ${rawAnswer.valor} → "${answerTextToShow}"`);
      }
    });

    console.log('\n🔍 Testing Functioning section (items 21-40):');
    rawAnswers.slice(20, 30).forEach((rawAnswer, idx) => {
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
        
        const section = 'FUNCTIONING';
        console.log(`${idx + 21}. [${section}] "${qDef.texto}" - Value: ${rawAnswer.valor} → "${answerTextToShow}"`);
      }
    });

    // Test scale validation
    console.log('\n📊 Scale validation:');
    console.log('Problem Severity scale (0-5):', problemSeverityOptions.map(opt => `${opt.valor}="${opt.texto}"`).join(', '));
    console.log('Functioning scale (0-4):', functioningOptions.map(opt => `${opt.valor}="${opt.texto}"`).join(', '));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testOYSDualScales();
