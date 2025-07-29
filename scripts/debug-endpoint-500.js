#!/usr/bin/env node

/**
 * Debug del error 500 en el endpoint de datos del paciente
 */

async function debugEndpoint500() {
  console.log('🔍 DEBUGGING ERROR 500 EN ENDPOINT DE DATOS');
  console.log('=' .repeat(60));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';
  const endpointUrl = `http://localhost:3000/api/informes/datos/${testPatientId}`;

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log(`\n📡 PROBANDO ENDPOINT: ${endpointUrl}`);
    console.log('⏱️  Enviando request...');

    const response = await fetch(endpointUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Debug-Script/1.0'
      }
    });

    console.log(`\n📊 RESPUESTA RECIBIDA:`);
    console.log(`   🔢 Status: ${response.status}`);
    console.log(`   📋 Status Text: ${response.statusText}`);
    console.log(`   📏 Content-Length: ${response.headers.get('content-length') || 'N/A'}`);
    console.log(`   🕒 Date: ${response.headers.get('date') || 'N/A'}`);

    if (response.status === 500) {
      console.log('\n❌ ERROR 500 CONFIRMADO');
      
      try {
        const errorText = await response.text();
        console.log('\n📝 CONTENIDO DE LA RESPUESTA:');
        console.log(errorText);
        
        // Intentar parsear como JSON si es posible
        try {
          const errorJson = JSON.parse(errorText);
          console.log('\n🔍 ERROR PARSEADO:');
          console.log(JSON.stringify(errorJson, null, 2));
        } catch (parseError) {
          console.log('\n⚠️ No se pudo parsear como JSON');
        }
        
      } catch (readError) {
        console.log('\n❌ Error leyendo respuesta:', readError.message);
      }
      
    } else if (response.ok) {
      console.log('\n✅ RESPUESTA EXITOSA');
      
      try {
        const data = await response.json();
        console.log('\n📊 DATOS RECIBIDOS:');
        console.log(`   👤 Paciente: ${data.patient?.name || 'N/A'}`);
        console.log(`   📋 Cuestionarios: ${data.questionnaires?.length || 0}`);
        console.log(`   📝 Entrevista: ${data.intake ? 'SÍ' : 'NO'}`);
        
      } catch (parseError) {
        console.log('\n❌ Error parseando JSON:', parseError.message);
      }
      
    } else {
      console.log(`\n⚠️ RESPUESTA NO EXITOSA: ${response.status}`);
      
      try {
        const errorText = await response.text();
        console.log('\n📝 CONTENIDO:');
        console.log(errorText);
      } catch (readError) {
        console.log('\n❌ Error leyendo respuesta:', readError.message);
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR DE CONEXIÓN:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🚨 El servidor no está corriendo en localhost:3000');
      console.log('   Asegúrate de que npm run dev esté activo');
    }
  }

  console.log('\n🔧 PRÓXIMOS PASOS PARA RESOLVER:');
  console.log('1. Verificar logs del servidor Next.js');
  console.log('2. Revisar autenticación NextAuth');
  console.log('3. Verificar variables de entorno');
  console.log('4. Comprobar políticas RLS de Supabase');
}

debugEndpoint500();
