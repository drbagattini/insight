#!/usr/bin/env node

/**
 * TEST SIMPLE: Verificar que el endpoint de streaming responde correctamente
 */

async function testStreamingSimpleCheck() {
  console.log('🧪 TEST SIMPLE DE STREAMING');
  console.log('=' .repeat(40));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n⚡ Verificando endpoint de streaming...');
    
    const startTime = Date.now();
    
    const response = await fetch(`http://localhost:3000/api/test-supervision-streaming/${testPatientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Test rápido",
        conversationHistory: []
      })
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('\n📊 RESULTADOS:');
    console.log('─'.repeat(25));
    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Content-Type: ${response.headers.get('content-type')}`);
    console.log(`✅ Cache-Control: ${response.headers.get('cache-control')}`);
    console.log(`✅ Connection: ${response.headers.get('connection')}`);
    console.log(`⏱️ Tiempo de respuesta: ${duration}ms`);

    // Verificaciones
    const isStreaming = response.headers.get('content-type')?.includes('event-stream');
    const hasCorrectHeaders = response.headers.get('cache-control')?.includes('no-cache');
    const statusOk = response.status === 200;

    console.log('\n🎯 VERIFICACIONES:');
    console.log('─'.repeat(25));
    console.log(`✅ Status OK: ${statusOk ? 'SÍ' : 'NO'}`);
    console.log(`✅ Headers streaming: ${isStreaming ? 'SÍ' : 'NO'}`);
    console.log(`✅ Headers cache: ${hasCorrectHeaders ? 'SÍ' : 'NO'}`);
    console.log(`✅ Respuesta rápida: ${duration < 2000 ? 'SÍ' : 'NO'}`);

    console.log('\n🎊 RESULTADO:');
    if (statusOk && isStreaming && hasCorrectHeaders) {
      console.log('✅ ENDPOINT DE STREAMING CONFIGURADO CORRECTAMENTE');
      console.log('🚀 Listo para usar en la interfaz React');
    } else {
      console.log('❌ PROBLEMAS EN LA CONFIGURACIÓN');
      if (!statusOk) console.log('   - Status no es 200');
      if (!isStreaming) console.log('   - Content-Type no es event-stream');
      if (!hasCorrectHeaders) console.log('   - Headers de cache incorrectos');
    }

    // Test adicional: endpoint de datos
    console.log('\n📊 Verificando endpoint de datos...');
    
    const dataResponse = await fetch(`http://localhost:3000/api/informes/datos/${testPatientId}`);
    const dataStatus = dataResponse.status;
    
    console.log(`✅ Endpoint datos: ${dataStatus === 200 ? 'OK' : 'ERROR'} (${dataStatus})`);

    if (dataStatus === 200) {
      const data = await dataResponse.json();
      const hasIntake = !!data.intake;
      const hasQuestionnaires = data.questionnaires?.length > 0;
      const hasEvolution = data.evolucion_clinica?.length > 0;
      
      console.log(`✅ Entrevista inicial: ${hasIntake ? 'SÍ' : 'NO'}`);
      console.log(`✅ Cuestionarios: ${hasQuestionnaires ? data.questionnaires.length : 0}`);
      console.log(`✅ Evolución clínica: ${hasEvolution ? data.evolucion_clinica.length : 0}`);
      
      if (hasIntake && hasQuestionnaires && hasEvolution) {
        console.log('\n🎉 TODOS LOS DATOS ESTÁN DISPONIBLES PARA EL CHAT');
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testStreamingSimpleCheck();
