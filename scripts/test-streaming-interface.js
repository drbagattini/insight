#!/usr/bin/env node

/**
 * TEST DE INTERFAZ STREAMING: Verificar que el streaming funciona correctamente
 */

async function testStreamingInterface() {
  console.log('🧪 TEST DE INTERFAZ STREAMING');
  console.log('=' .repeat(50));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n⚡ TEST 1: Verificar endpoint de streaming');
    
    const startTime = Date.now();
    let totalChunks = 0;
    let totalContent = '';
    
    const response = await fetch(`http://localhost:3000/api/test-supervision-streaming/${testPatientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "Hola, dame un resumen breve del estado de Pedro basado en todos los datos disponibles",
        conversationHistory: []
      })
    });

    console.log(`✅ Status: ${response.status}`);
    console.log(`✅ Content-Type: ${response.headers.get('content-type')}`);
    console.log(`✅ Es streaming: ${response.headers.get('content-type')?.includes('event-stream') ? 'SÍ' : 'NO'}`);

    if (response.body) {
      console.log('\n📡 LEYENDO STREAM:');
      console.log('─'.repeat(30));
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              if (data === '[DONE]') {
                console.log('\n🎯 Stream finalizado');
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  totalContent += parsed.content;
                  totalChunks++;
                  process.stdout.write(parsed.content);
                }
              } catch (e) {
                // Ignorar líneas que no son JSON válido
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('\n\n📊 MÉTRICAS DEL STREAMING:');
    console.log('─'.repeat(30));
    console.log(`⏱️ Duración total: ${duration}ms`);
    console.log(`📦 Total chunks: ${totalChunks}`);
    console.log(`📝 Caracteres totales: ${totalContent.length}`);
    console.log(`⚡ Velocidad promedio: ${Math.round(totalContent.length / (duration / 1000))} chars/seg`);

    console.log('\n🎯 VERIFICACIONES:');
    console.log('─'.repeat(30));
    console.log(`✅ Streaming funcional: ${totalChunks > 0 ? 'SÍ' : 'NO'}`);
    console.log(`✅ Contenido recibido: ${totalContent.length > 0 ? 'SÍ' : 'NO'}`);
    console.log(`✅ Respuesta coherente: ${totalContent.includes('Pedro') ? 'SÍ' : 'NO'}`);
    console.log(`✅ Velocidad adecuada: ${duration < 15000 ? 'SÍ' : 'NO'} (${duration}ms)`);

    if (totalContent.length > 0) {
      console.log('\n📄 MUESTRA DE CONTENIDO:');
      console.log('─'.repeat(30));
      console.log(`"${totalContent.substring(0, 200)}..."`);
    }

    console.log('\n🎊 RESULTADO FINAL:');
    if (totalChunks > 0 && totalContent.length > 0 && totalContent.includes('Pedro')) {
      console.log('✅ STREAMING FUNCIONA PERFECTAMENTE');
      console.log('🚀 La interfaz de chat puede usar este endpoint');
    } else {
      console.log('❌ PROBLEMAS DETECTADOS EN STREAMING');
      console.log('🔧 Revisar configuración del endpoint');
    }

  } catch (error) {
    console.error('\n❌ ERROR en test de streaming:', error.message);
  }
}

testStreamingInterface();
