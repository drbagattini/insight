#!/usr/bin/env node

/**
 * Probar endpoint de datos sin autenticación
 */

async function testEndpointWithoutAuth() {
  console.log('🔍 PROBANDO ENDPOINT SIN AUTENTICACIÓN');
  console.log('=' .repeat(60));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';
  const testEndpointUrl = `http://localhost:3000/api/test-patient-data/${testPatientId}`;

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log(`\n📡 PROBANDO: ${testEndpointUrl}`);
    console.log('⏱️  Enviando request...');

    const response = await fetch(testEndpointUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`\n📊 RESPUESTA:`);
    console.log(`   🔢 Status: ${response.status}`);
    console.log(`   📋 Status Text: ${response.statusText}`);

    if (response.ok) {
      console.log('\n✅ ÉXITO! Obteniendo datos...');
      
      const data = await response.json();
      
      console.log('\n📊 DATOS CONSOLIDADOS:');
      console.log(`   👤 Paciente: ${data.patient?.name || 'N/A'}`);
      console.log(`   📧 Email: ${data.patient?.email || 'N/A'}`);
      console.log(`   📋 Total cuestionarios: ${data.questionnaires?.length || 0}`);
      console.log(`   📝 Entrevista inicial: ${data.intake ? 'SÍ' : 'NO'}`);
      
      if (data.questionnaires && data.questionnaires.length > 0) {
        console.log('\n🧪 CUESTIONARIOS DISPONIBLES:');
        data.questionnaires.slice(0, 5).forEach((q, index) => {
          console.log(`   ${index + 1}. ${q.codigo} - Puntuación: ${q.puntuacion}`);
          console.log(`      📅 Fecha: ${q.fecha_completado}`);
          console.log(`      🎯 Score detallado: ${q.score_detallado ? 'SÍ' : 'NO'}`);
          console.log(`      📝 Respuestas: ${q.respuestas ? q.respuestas.length : 0} ítems`);
        });
        
        if (data.questionnaires.length > 5) {
          console.log(`   ... y ${data.questionnaires.length - 5} más`);
        }
      }
      
      if (data.intake) {
        console.log('\n📋 ENTREVISTA INICIAL:');
        console.log(`   📊 Estado: ${data.intake.estado}`);
        console.log(`   📝 Campos: ${Object.keys(data.intake.datos || {}).length}`);
      }
      
      console.log('\n🎯 RESUMEN:');
      console.log(`   📊 Tipos de cuestionarios: ${data.summary?.questionnaire_types?.join(', ') || 'N/A'}`);
      console.log(`   📅 Rango de fechas: ${data.summary?.date_range?.earliest || 'N/A'} a ${data.summary?.date_range?.latest || 'N/A'}`);
      
      console.log('\n✅ ENDPOINT FUNCIONANDO CORRECTAMENTE');
      console.log('🎊 Los datos están disponibles para GPT-4o');
      
    } else {
      console.log('\n❌ ERROR EN ENDPOINT DE PRUEBA');
      
      const errorText = await response.text();
      console.log('\n📝 CONTENIDO DEL ERROR:');
      console.log(errorText);
    }

  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:', error.message);
  }
}

testEndpointWithoutAuth();
