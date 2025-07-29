#!/usr/bin/env node

/**
 * TEST: Streaming de respuestas GPT-4o
 */

async function testStreaming() {
  console.log('⚡ TESTING: Streaming de respuestas GPT-4o');
  console.log('=' .repeat(60));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n🚀 Iniciando test de streaming...');
    console.log('📡 URL:', `http://localhost:3000/api/test-supervision-streaming/${testPatientId}`);
    console.log('💬 Pregunta: "¿Qué observas en la evolución de Pedro?"');
    
    const startTime = Date.now();
    
    const response = await fetch(`http://localhost:3000/api/test-supervision-streaming/${testPatientId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: "¿Qué observas en la evolución de Pedro en los cuestionarios?",
        conversationHistory: []
      })
    });

    console.log('\n📊 Status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error:', errorText);
      return;
    }

    console.log('\n⚡ INICIANDO STREAMING:');
    console.log('─'.repeat(60));
    
    let fullResponse = '';
    let chunkCount = 0;
    let firstChunkTime = null;
    
    // Leer el stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data.trim() === '') continue;
          
          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'content') {
              if (firstChunkTime === null) {
                firstChunkTime = Date.now();
                const timeToFirst = firstChunkTime - startTime;
                console.log(`\n⚡ PRIMER CHUNK RECIBIDO (${timeToFirst}ms):`);
              }
              
              process.stdout.write(parsed.content);
              fullResponse += parsed.content;
              chunkCount++;
            } else if (parsed.type === 'done') {
              const totalTime = Date.now() - startTime;
              console.log('\n\n─'.repeat(60));
              console.log('✅ STREAMING COMPLETADO');
              console.log('\n📊 MÉTRICAS:');
              console.log('   Tiempo total:', totalTime, 'ms');
              console.log('   Tiempo al primer chunk:', firstChunkTime ? (firstChunkTime - startTime) : 'N/A', 'ms');
              console.log('   Chunks recibidos:', chunkCount);
              console.log('   Tokens estimados:', parsed.metadata?.tokens_used || 0);
              console.log('   Tiempo OpenAI:', parsed.metadata?.openai_duration || 0, 'ms');
              console.log('   Caracteres totales:', fullResponse.length);
              
              console.log('\n🎯 ANÁLISIS DE MEJORA:');
              const timeToFirst = firstChunkTime ? (firstChunkTime - startTime) : totalTime;
              console.log('   Percepción de velocidad:', timeToFirst < 2000 ? '✅ EXCELENTE' : timeToFirst < 4000 ? '🟡 BUENA' : '❌ LENTA');
              console.log('   Streaming funcional:', chunkCount > 10 ? '✅ SÍ' : '❌ NO');
              console.log('   Experiencia de usuario:', timeToFirst < 2000 && chunkCount > 10 ? '✅ MEJORADA' : '🟡 PARCIAL');
              
              return;
            } else if (parsed.type === 'error') {
              console.log('\n❌ Error en streaming:', parsed.error);
              return;
            }
          } catch (e) {
            // Ignorar errores de parsing
          }
        }
      }
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testStreaming();
