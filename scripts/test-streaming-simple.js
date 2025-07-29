#!/usr/bin/env node

/**
 * TEST: Verificar que el endpoint de streaming funciona
 */

async function testStreamingSimple() {
  console.log('⚡ TESTING: Endpoint de streaming (verificación básica)');
  console.log('=' .repeat(60));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n🚀 Probando endpoint de streaming...');
    console.log('📡 URL:', `http://localhost:3000/api/test-supervision-streaming/${testPatientId}`);
    
    const startTime = Date.now();
    
    const response = await fetch(`http://localhost:3000/api/test-supervision-streaming/${testPatientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Hola, ¿puedes darme un resumen breve de Pedro?",
        conversationHistory: []
      })
    });

    console.log('\n📊 RESULTADO:');
    console.log('   Status:', response.status, response.statusText);
    console.log('   Content-Type:', response.headers.get('content-type'));
    console.log('   Cache-Control:', response.headers.get('cache-control'));
    console.log('   Connection:', response.headers.get('connection'));
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('text/event-stream')) {
        console.log('   ✅ Headers correctos para streaming');
        console.log('   ✅ Endpoint configurado para Server-Sent Events');
        
        // Intentar leer algunos bytes para verificar formato
        try {
          const text = await response.text();
          const firstLines = text.split('\n').slice(0, 5);
          console.log('\n📄 PRIMERAS LÍNEAS DEL STREAM:');
          firstLines.forEach((line, i) => {
            console.log(`   ${i + 1}: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
          });
          
          const hasDataPrefix = text.includes('data: ');
          const hasContentType = text.includes('"type":"content"');
          const hasDoneType = text.includes('"type":"done"');
          
          console.log('\n🎯 ANÁLISIS DEL FORMATO:');
          console.log('   ✅ Formato SSE (data:):', hasDataPrefix ? 'SÍ' : 'NO');
          console.log('   ✅ Eventos de contenido:', hasContentType ? 'SÍ' : 'NO');
          console.log('   ✅ Evento de finalización:', hasDoneType ? 'SÍ' : 'NO');
          
          const totalTime = Date.now() - startTime;
          console.log('\n⏱️ PERFORMANCE:');
          console.log('   Tiempo total:', totalTime, 'ms');
          console.log('   Tamaño respuesta:', text.length, 'caracteres');
          
          if (hasDataPrefix && hasContentType && hasDoneType) {
            console.log('\n🎊 STREAMING IMPLEMENTADO CORRECTAMENTE');
            console.log('✅ El endpoint está listo para usar en el frontend');
          } else {
            console.log('\n⚠️ Streaming parcialmente implementado');
          }
          
        } catch (e) {
          console.log('   ⚠️ No se pudo leer el contenido completo (normal para streams)');
        }
      } else {
        console.log('   ❌ Content-Type incorrecto para streaming');
        const text = await response.text();
        console.log('   Respuesta:', text.substring(0, 200) + '...');
      }
    } else {
      console.log('   ❌ Error en endpoint');
      const errorText = await response.text();
      console.log('   Error:', errorText);
    }

    console.log('\n🚀 PRÓXIMO PASO:');
    console.log('Implementar cliente de streaming en el frontend React');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testStreamingSimple();
