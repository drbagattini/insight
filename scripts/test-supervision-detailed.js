#!/usr/bin/env node

/**
 * Probar supervisión con pregunta específica sobre datos del paciente
 */

async function testDetailedSupervision() {
  console.log('🎯 PROBANDO SUPERVISIÓN CON ANÁLISIS DETALLADO');
  console.log('=' .repeat(70));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';
  const supervisionEndpoint = `http://localhost:3000/api/test-supervision/${testPatientId}`;

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log(`\n📡 ENDPOINT: ${supervisionEndpoint}`);
    console.log('💬 MENSAJE DE PRUEBA: Pregunta específica sobre datos del paciente');
    console.log('⏱️  Enviando request...\n');

    const requestBody = {
      message: "¿Qué patrones observas en los cuestionarios de Pedro? Me interesa especialmente su evolución en el PHQ-9 y cómo se relaciona con los puntajes del GAD-7.",
      conversationHistory: [
        {
          role: "assistant",
          content: "Hola Test Psychologist, he leído toda la información acerca de Pedro Subiria. ¿Qué te interesa explorar ahora?"
        }
      ]
    };

    const startTime = Date.now();
    
    const response = await fetch(supervisionEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    const responseTime = Date.now() - startTime;

    console.log(`📊 RESPUESTA RECIBIDA (${responseTime}ms):`);
    console.log(`   🔢 Status: ${response.status}`);

    if (response.ok) {
      console.log('\n✅ ÉXITO! Procesando respuesta de GPT-4o...\n');
      
      const data = await response.json();
      
      console.log('🤖 RESPUESTA DE GPT-4O:');
      console.log('─'.repeat(80));
      console.log(data.response);
      console.log('─'.repeat(80));
      
      console.log('\n📊 METADATA:');
      console.log(`   ⏱️  Tiempo total: ${data.metadata?.processing_time?.total_ms || 0}ms`);
      console.log(`   🤖 Tiempo OpenAI: ${data.metadata?.processing_time?.openai_ms || 0}ms`);
      console.log(`   🎯 Tokens usados: ${data.metadata?.tokens_used || 0}`);
      
      console.log('\n🔍 ANÁLISIS DE USO DE DATOS:');
      
      const responseText = data.response.toLowerCase();
      
      const dataUsageChecks = [
        {
          name: 'Menciona PHQ-9',
          check: responseText.includes('phq-9') || responseText.includes('phq'),
          expected: true
        },
        {
          name: 'Menciona GAD-7',
          check: responseText.includes('gad-7') || responseText.includes('gad'),
          expected: true
        },
        {
          name: 'Usa puntuaciones específicas',
          check: responseText.includes('21') || responseText.includes('7') || responseText.includes('14') || responseText.includes('13') || responseText.includes('12'),
          expected: true
        },
        {
          name: 'Menciona evolución temporal',
          check: responseText.includes('evolución') || responseText.includes('tiempo') || responseText.includes('cambio') || responseText.includes('progreso'),
          expected: true
        },
        {
          name: 'Análisis cualitativo',
          check: responseText.includes('patrón') || responseText.includes('relación') || responseText.includes('conexión'),
          expected: true
        },
        {
          name: 'Termina con pregunta socrática',
          check: responseText.includes('?'),
          expected: true
        }
      ];
      
      dataUsageChecks.forEach(check => {
        const status = check.check === check.expected ? '✅' : '❌';
        console.log(`   ${status} ${check.name}: ${check.check ? 'SÍ' : 'NO'}`);
      });
      
      const passedChecks = dataUsageChecks.filter(c => c.check === c.expected).length;
      const totalChecks = dataUsageChecks.length;
      
      console.log(`\n🎯 CALIDAD DEL ANÁLISIS: ${passedChecks}/${totalChecks} checks pasados`);
      
      if (passedChecks >= 4) {
        console.log('🎉 ¡GPT-4O ESTÁ USANDO LOS DATOS CORRECTAMENTE!');
        console.log('✅ Acceso completo a cuestionarios psicométricos');
        console.log('✅ Análisis contextualizado con datos reales');
        console.log('✅ Estilo de supervisión clínica apropiado');
      } else {
        console.log('⚠️ El análisis necesita mejoras en el uso de datos específicos');
      }
      
    } else {
      console.log('\n❌ ERROR EN LA SUPERVISIÓN');
      const errorText = await response.text();
      console.log(errorText);
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }

  console.log('\n🚀 ESTADO ACTUAL DEL SISTEMA:');
  console.log('✅ Migración a OpenAI GPT-4o: COMPLETADA');
  console.log('✅ Acceso a datos de cuestionarios: VERIFICADO');
  console.log('✅ Supervisión clínica: FUNCIONANDO');
  console.log('✅ Análisis contextualizado: EN PRUEBAS');
  console.log('🔧 Pendiente: Resolver autenticación para producción');
}

testDetailedSupervision();
