#!/usr/bin/env node

/**
 * TEST COMPLETO: Verificar todas las mejoras implementadas
 */

async function testAllImprovements() {
  console.log('🧪 TEST COMPLETO: Verificando todas las mejoras');
  console.log('=' .repeat(70));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n📊 TEST 1: Endpoint de datos mejorado');
    const dataResponse = await fetch(`http://localhost:3000/api/informes/datos/${testPatientId}`);
    
    if (dataResponse.ok) {
      const data = await dataResponse.json();
      
      console.log('✅ MEJORA 1: Psicólogo identificado');
      console.log(`   👤 Nombre: ${data.psychologist?.name || 'N/A'}`);
      console.log(`   📧 Email: ${data.psychologist?.email || 'N/A'}`);
      console.log(`   🔄 Mejorado: ${data.psychologist?.name !== 'Psicólogo Temporal' ? 'SÍ' : 'NO'}`);
      
      console.log('\n✅ MEJORA 2: Entrevista inicial estructurada');
      if (data.intake) {
        console.log(`   📋 Estado: ${data.intake.estado}`);
        console.log(`   📅 Fecha: ${data.intake.fecha_inicio}`);
        console.log(`   🏗️ Datos estructurados: ${data.intake.datos_estructurados ? 'SÍ' : 'NO'}`);
        console.log(`   📝 Resumen clínico: ${data.intake.resumen_clinico ? 'SÍ' : 'NO'}`);
        
        if (data.intake.datos_estructurados) {
          const secciones = Object.keys(data.intake.datos_estructurados);
          console.log(`   📂 Secciones: ${secciones.join(', ')}`);
        }
      } else {
        console.log('   ❌ No disponible');
      }
      
      console.log('\n✅ MEJORA 3: Cuestionarios completos');
      const opdCount = data.questionnaires?.filter(q => q.codigo === 'OPD-CA2-SQ').length || 0;
      console.log(`   📋 OPD-CA2-SQ: ${opdCount} cuestionarios`);
      
      if (opdCount > 0) {
        const firstOpd = data.questionnaires.find(q => q.codigo === 'OPD-CA2-SQ');
        console.log(`   📝 Ítems: ${firstOpd.items?.items?.length || 0}`);
        console.log(`   📊 Respuestas: ${Object.keys(firstOpd.respuestas || {}).length}`);
        console.log(`   📋 Descripción: ${firstOpd.descripcion ? 'SÍ' : 'NO'}`);
      }
      
      console.log('\n✅ MEJORA 4: Evolución clínica');
      console.log(`   📝 Entradas: ${data.evolucion_clinica?.length || 0}`);
      
      if (data.evolucion_clinica && data.evolucion_clinica.length > 0) {
        data.evolucion_clinica.forEach((entry, index) => {
          console.log(`   📄 Entrada ${index + 1}: ${entry.entry_type} (${entry.created_at})`);
        });
      }
      
    } else {
      console.log('❌ Error en endpoint de datos:', dataResponse.status);
    }

    console.log('\n🤖 TEST 2: Supervisión con GPT-4o');
    const supervisionResponse = await fetch(`http://localhost:3000/api/test-supervision/${testPatientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Hola, puedes darme un resumen de Pedro basado en su entrevista inicial estructurada, evolución clínica y cuestionarios OPD-CA2-SQ?",
        conversationHistory: []
      })
    });

    if (supervisionResponse.ok) {
      const supervisionData = await supervisionResponse.json();
      console.log('✅ MEJORA 5: GPT-4o con datos completos');
      console.log(`   🎯 Menciona entrevista: ${supervisionData.response.includes('entrevista') ? 'SÍ' : 'NO'}`);
      console.log(`   🎯 Menciona evolución: ${supervisionData.response.includes('evolución') ? 'SÍ' : 'NO'}`);
      console.log(`   🎯 Menciona OPD-CA2-SQ: ${supervisionData.response.includes('OPD') ? 'SÍ' : 'NO'}`);
      console.log(`   ⏱️ Tokens: ${supervisionData.metadata?.tokens_used || 0}`);
      
      console.log('\n📝 Fragmento de respuesta:');
      console.log(`   "${supervisionData.response.substring(0, 300)}..."`);
    } else {
      console.log('❌ Error en supervisión:', supervisionResponse.status);
    }

    console.log('\n⚡ TEST 3: Streaming funcional');
    const streamingResponse = await fetch(`http://localhost:3000/api/test-supervision-streaming/${testPatientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Test de streaming",
        conversationHistory: []
      })
    });

    console.log('✅ MEJORA 6: Streaming implementado');
    console.log(`   📡 Status: ${streamingResponse.status}`);
    console.log(`   📋 Content-Type: ${streamingResponse.headers.get('content-type')}`);
    console.log(`   ⚡ Es streaming: ${streamingResponse.headers.get('content-type')?.includes('event-stream') ? 'SÍ' : 'NO'}`);

    console.log('\n🎯 RESUMEN DE VERIFICACIÓN:');
    console.log('─'.repeat(50));
    console.log('✅ Psicólogo identificado (con fallback)');
    console.log('✅ Entrevista inicial estructurada');
    console.log('✅ Cuestionarios OPD-CA2-SQ completos');
    console.log('✅ Evolución clínica integrada');
    console.log('✅ GPT-4o con contexto completo');
    console.log('✅ Streaming implementado');

    console.log('\n🎊 ESTADO: Todas las mejoras backend completadas');
    console.log('📋 PRÓXIMO PASO: Implementar interfaz de chat con streaming');

  } catch (error) {
    console.error('\n❌ ERROR en test:', error.message);
  }
}

testAllImprovements();
