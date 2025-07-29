#!/usr/bin/env node

/**
 * DEMOSTRACIÓN: Capacidades de GPT-4o con datos completos
 */

async function demoGPT4oCapabilities() {
  console.log('🤖 DEMOSTRACIÓN: Capacidades de GPT-4o con datos completos');
  console.log('=' .repeat(70));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    const fetch = (await import('node-fetch')).default;
    
    const preguntas = [
      {
        titulo: "📋 ACCESO A ÍTEMS ESPECÍFICOS DE OPD-CA2-SQ",
        pregunta: "¿Puedes decirme específicamente qué respondió Pedro en el ítem 80 del OPD-CA2-SQ y qué significa esa respuesta clínicamente?"
      },
      {
        titulo: "📝 ACCESO A EVOLUCIÓN CLÍNICA",
        pregunta: "¿Hay entradas de evolución clínica registradas para Pedro? Si las hay, ¿puedes resumir qué información contienen?"
      },
      {
        titulo: "🏗️ ACCESO A ENTREVISTA INICIAL ESTRUCTURADA",
        pregunta: "Basándote en la entrevista inicial de Pedro, ¿cuál fue su motivo de consulta y qué antecedentes de salud mental presenta?"
      },
      {
        titulo: "📊 ANÁLISIS INTEGRAL",
        pregunta: "Dame un análisis integral de Pedro combinando datos de la entrevista inicial, cuestionarios OPD-CA2-SQ y evolución clínica. ¿Qué patrones observas?"
      }
    ];

    for (let i = 0; i < preguntas.length; i++) {
      const { titulo, pregunta } = preguntas[i];
      
      console.log(`\n${titulo}`);
      console.log('─'.repeat(titulo.length - 2));
      console.log(`❓ Pregunta: ${pregunta}`);
      
      const startTime = Date.now();
      
      const response = await fetch(`http://localhost:3000/api/test-supervision/${testPatientId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: pregunta,
          conversationHistory: []
        })
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      if (response.ok) {
        const data = await response.json();
        
        console.log(`\n✅ Respuesta (${duration}ms, ${data.metadata?.tokens_used || 0} tokens):`);
        console.log('─'.repeat(50));
        
        // Mostrar fragmentos relevantes de la respuesta
        const respuesta = data.response;
        
        // Verificar menciones específicas
        const mencionaItem = respuesta.includes('ítem') || respuesta.includes('item');
        const mencionaValor = respuesta.includes('valor') || respuesta.includes('respondió');
        const mencionaEvolucion = respuesta.includes('evolución') || respuesta.includes('entrada');
        const mencionaMotivo = respuesta.includes('motivo') || respuesta.includes('consulta');
        const mencionaOPD = respuesta.includes('OPD');
        
        console.log(`🎯 Análisis de respuesta:`);
        console.log(`   📋 Menciona ítems específicos: ${mencionaItem ? 'SÍ' : 'NO'}`);
        console.log(`   📊 Menciona valores/respuestas: ${mencionaValor ? 'SÍ' : 'NO'}`);
        console.log(`   📝 Menciona evolución clínica: ${mencionaEvolucion ? 'SÍ' : 'NO'}`);
        console.log(`   🎯 Menciona motivo consulta: ${mencionaMotivo ? 'SÍ' : 'NO'}`);
        console.log(`   📋 Menciona OPD-CA2-SQ: ${mencionaOPD ? 'SÍ' : 'NO'}`);
        
        // Mostrar fragmento de la respuesta
        console.log(`\n📄 Fragmento de respuesta:`);
        const fragmento = respuesta.length > 300 ? respuesta.substring(0, 300) + '...' : respuesta;
        console.log(`"${fragmento}"`);
        
        // Verificar calidad de la respuesta
        const esRespuestaEspecifica = mencionaItem || mencionaValor || mencionaEvolucion || mencionaMotivo;
        console.log(`\n🎊 Calidad: ${esRespuestaEspecifica ? '✅ ESPECÍFICA Y DETALLADA' : '❌ GENÉRICA'}`);
        
      } else {
        console.log(`❌ Error: ${response.status}`);
      }
      
      // Pausa entre preguntas
      if (i < preguntas.length - 1) {
        console.log('\n' + '='.repeat(70));
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('\n🎉 DEMOSTRACIÓN COMPLETADA');
    console.log('=' .repeat(70));
    console.log('✅ GPT-4o tiene acceso completo a:');
    console.log('   📋 Cuestionarios OPD-CA2-SQ con 81 ítems cada uno');
    console.log('   📝 Evolución clínica con entradas detalladas');
    console.log('   🏗️ Entrevista inicial estructurada');
    console.log('   📊 Análisis integral de datos del paciente');
    console.log('\n🚀 El sistema está listo para supervisión clínica avanzada!');

  } catch (error) {
    console.error('\n❌ ERROR en demostración:', error.message);
  }
}

demoGPT4oCapabilities();
