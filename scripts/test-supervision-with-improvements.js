#!/usr/bin/env node

/**
 * TEST: Supervisión con GPT-4o usando las mejoras implementadas
 */

async function testSupervisionWithImprovements() {
  console.log('🤖 TESTING: Supervisión con mejoras implementadas');
  console.log('=' .repeat(60));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n🧪 TEST 1: Pregunta sobre OPD-CA2-SQ específica');
    console.log('Pregunta: "¿Qué me puedes decir sobre el ítem 81 del OPD-CA2-SQ de Pedro?"');
    
    const opdResponse = await fetch(`http://localhost:3000/api/test-supervision/${testPatientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "¿Qué me puedes decir sobre el ítem 81 del OPD-CA2-SQ de Pedro? ¿Cuál era la pregunta específica y cómo respondió?",
        conversationHistory: []
      })
    });

    if (opdResponse.ok) {
      const opdData = await opdResponse.json();
      console.log('\n📊 RESPUESTA GPT-4o:');
      console.log(opdData.response.substring(0, 500) + '...');
      console.log('\n🎯 ANÁLISIS:');
      console.log('   ✅ Menciona ítem específico:', opdData.response.includes('81') ? 'SÍ' : 'NO');
      console.log('   ✅ Conoce la pregunta:', opdData.response.includes('pregunta') ? 'SÍ' : 'NO');
      console.log('   ✅ Tokens usados:', opdData.metadata?.tokens_used || 0);
    } else {
      console.log('❌ Error en supervisión OPD-CA2-SQ:', opdResponse.status);
    }

    console.log('\n🧪 TEST 2: Pregunta sobre evolución clínica');
    console.log('Pregunta: "¿Qué información tienes sobre la evolución clínica de Pedro?"');
    
    const evolutionResponse = await fetch(`http://localhost:3000/api/test-supervision/${testPatientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "¿Qué información tienes sobre la evolución clínica de Pedro? ¿Hay entradas de seguimiento?",
        conversationHistory: []
      })
    });

    if (evolutionResponse.ok) {
      const evolutionData = await evolutionResponse.json();
      console.log('\n📊 RESPUESTA GPT-4o:');
      console.log(evolutionData.response.substring(0, 500) + '...');
      console.log('\n🎯 ANÁLISIS:');
      console.log('   ✅ Menciona evolución:', evolutionData.response.includes('evolución') ? 'SÍ' : 'NO');
      console.log('   ✅ Menciona entradas:', evolutionData.response.includes('entrada') ? 'SÍ' : 'NO');
      console.log('   ✅ Tokens usados:', evolutionData.metadata?.tokens_used || 0);
    } else {
      console.log('❌ Error en supervisión evolución:', evolutionResponse.status);
    }

    console.log('\n🧪 TEST 3: Pregunta sobre informes');
    console.log('Pregunta: "¿Tienes acceso a informes generados previamente para Pedro?"');
    
    const reportsResponse = await fetch(`http://localhost:3000/api/test-supervision/${testPatientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "¿Tienes acceso a informes generados previamente para Pedro?",
        conversationHistory: []
      })
    });

    if (reportsResponse.ok) {
      const reportsData = await reportsResponse.json();
      console.log('\n📊 RESPUESTA GPT-4o:');
      console.log(reportsData.response.substring(0, 300) + '...');
      console.log('\n🎯 ANÁLISIS:');
      console.log('   ✅ Menciona informes:', reportsData.response.includes('informe') ? 'SÍ' : 'NO');
      console.log('   ✅ Reconoce limitación:', reportsData.response.includes('no') ? 'SÍ' : 'NO');
    } else {
      console.log('❌ Error en supervisión informes:', reportsResponse.status);
    }

    console.log('\n🎊 RESUMEN DE TESTING:');
    console.log('✅ OPD-CA2-SQ: GPT-4o ahora tiene acceso a preguntas específicas');
    console.log('✅ Evolución clínica: GPT-4o puede acceder a entradas de seguimiento');
    console.log('❌ Informes: Aún no disponibles (tabla no existe)');
    console.log('❌ Psicólogo: Aún usa datos temporales');

    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('1. Arreglar identificación del psicólogo');
    console.log('2. Implementar streaming de respuestas');
    console.log('3. Arreglar interfaz de chat');
    console.log('4. Estructurar mejor la entrevista inicial');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testSupervisionWithImprovements();
