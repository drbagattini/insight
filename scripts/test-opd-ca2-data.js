// Script para verificar si los datos del OPD-CA2-SQ están siendo enviados correctamente a la IA
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOpdCa2Data() {
  try {
    console.log('🔍 Testing OPD-CA2-SQ data availability...\n');

    // 1. Buscar pacientes que tengan respuestas del OPD-CA2-SQ
    console.log('1️⃣ Finding patients with OPD-CA2-SQ responses...');
    const { data: responses, error: responsesError } = await supabase
      .from('respuestas')
      .select(`
        id,
        paciente_id,
        respuestas,
        puntuacion,
        score_detallado,
        creado_en,
        cuestionarios!inner(codigo, titulo),
        patients!inner(name)
      `)
      .eq('cuestionarios.codigo', 'OPD-CA2-SQ')
      .limit(3);

    if (responsesError) {
      console.error('❌ Error fetching OPD-CA2-SQ responses:', responsesError);
      return;
    }

    if (!responses || responses.length === 0) {
      console.log('⚠️ No OPD-CA2-SQ responses found in database');
      return;
    }

    console.log(`✅ Found ${responses.length} OPD-CA2-SQ responses`);

    // 2. Analizar cada respuesta
    for (const response of responses) {
      console.log(`\n📊 Patient: ${response.patients.name} (ID: ${response.paciente_id})`);
      console.log(`   Response ID: ${response.id}`);
      console.log(`   Date: ${response.creado_en}`);
      
      // Verificar respuestas
      const respuestasCount = response.respuestas ? Object.keys(response.respuestas).length : 0;
      console.log(`   Total answers: ${respuestasCount}/81`);
      
      if (respuestasCount < 81) {
        console.log(`   ⚠️ Incomplete responses (expected 81, got ${respuestasCount})`);
      } else {
        console.log(`   ✅ Complete responses (81/81)`);
      }

      // Verificar score detallado
      if (response.score_detallado) {
        const dimensions = Object.keys(response.score_detallado);
        console.log(`   Score dimensions: ${dimensions.length} (${dimensions.join(', ')})`);
      } else {
        console.log(`   ⚠️ No detailed score available`);
      }

      // Verificar puntuación general
      console.log(`   General score: ${response.puntuacion || 'N/A'}`);

      // 3. Probar el endpoint de datos consolidados
      console.log(`\n🧪 Testing consolidated data endpoint for patient ${response.paciente_id}...`);
      
      try {
        const fetch = (await import('node-fetch')).default;
        const baseUrl = 'http://localhost:3000';
        
        // Simular llamada al endpoint (sin autenticación para prueba)
        const testResponse = await fetch(`${baseUrl}/api/informes/debug-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ pacienteId: response.paciente_id })
        });

        if (testResponse.ok) {
          const debugData = await testResponse.json();
          console.log(`   ✅ Debug endpoint accessible`);
          console.log(`   OPD-CA2-SQ responses in consolidated data: ${debugData.opd_ca2_responses}`);
          
          if (debugData.opd_ca2_details && debugData.opd_ca2_details.length > 0) {
            const opdDetail = debugData.opd_ca2_details[0];
            console.log(`   Total answers in consolidated: ${opdDetail.total_respuestas}/81`);
            console.log(`   Score detail keys: ${opdDetail.score_detallado_keys.join(', ')}`);
          }
        } else {
          console.log(`   ⚠️ Debug endpoint not accessible (status: ${testResponse.status})`);
        }
      } catch (fetchError) {
        console.log(`   ⚠️ Could not test debug endpoint: ${fetchError.message}`);
      }
    }

    // 4. Verificar metadata del cuestionario
    console.log(`\n📋 Checking OPD-CA2-SQ questionnaire metadata...`);
    const { data: questionnaire, error: qError } = await supabase
      .from('cuestionarios')
      .select('*')
      .eq('codigo', 'OPD-CA2-SQ')
      .single();

    if (qError || !questionnaire) {
      console.log('❌ OPD-CA2-SQ questionnaire not found in database');
    } else {
      console.log(`✅ Questionnaire found: ${questionnaire.titulo}`);
      console.log(`   Active: ${questionnaire.activo}`);
      console.log(`   Created: ${questionnaire.created_at}`);
    }

    // 5. Verificar ítems del cuestionario
    const { data: items, error: itemsError } = await supabase
      .from('items')
      .select('id, texto, dimension, subdimension')
      .eq('cuestionario_id', questionnaire?.id)
      .order('orden');

    if (itemsError || !items) {
      console.log('❌ Could not fetch questionnaire items');
    } else {
      console.log(`✅ Found ${items.length} items for OPD-CA2-SQ`);
      if (items.length !== 81) {
        console.log(`   ⚠️ Expected 81 items, found ${items.length}`);
      }
    }

    console.log('\n🎯 Summary:');
    console.log(`   - OPD-CA2-SQ responses found: ${responses.length}`);
    console.log(`   - Questionnaire properly configured: ${questionnaire ? '✅' : '❌'}`);
    console.log(`   - Items count: ${items?.length || 0}/81`);
    console.log('\n✅ Test completed!');

  } catch (error) {
    console.error('❌ Error during test:', error);
  }
}

// Ejecutar el test
testOpdCa2Data();
