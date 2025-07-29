#!/usr/bin/env node

/**
 * Análisis de datos de cuestionarios disponibles para GPT-4o
 */

async function analyzeQuestionnaireData() {
  console.log('🔍 ANÁLISIS DE DATOS DE CUESTIONARIOS PARA GPT-4O');
  console.log('=' .repeat(60));

  try {
    const fetch = (await import('node-fetch')).default;
    
    // Probar endpoint de datos del paciente
    const response = await fetch('http://localhost:3000/api/informes/datos/2385677e-cf3e-45e3-8d28-9100afa90a3a');
    
    if (!response.ok) {
      console.log('❌ Error accediendo a datos:', response.status);
      return;
    }

    const data = await response.json();
    
    console.log('\n📊 ESTRUCTURA DE DATOS DISPONIBLE:');
    console.log(`👤 Paciente: ${data.patient?.name || 'N/A'}`);
    console.log(`📋 Cuestionarios disponibles: ${data.questionnaires?.length || 0}`);
    
    if (data.questionnaires && data.questionnaires.length > 0) {
      console.log('\n🧪 CUESTIONARIOS ENCONTRADOS:');
      
      data.questionnaires.forEach((q, index) => {
        console.log(`\n${index + 1}. ${q.codigo} - ${q.titulo}`);
        console.log(`   📊 Puntuación: ${q.puntuacion}`);
        console.log(`   📅 Fecha: ${q.fecha_completado}`);
        
        // Analizar respuestas individuales
        if (q.respuestas && Array.isArray(q.respuestas)) {
          console.log(`   📝 Respuestas individuales: ${q.respuestas.length} ítems`);
          console.log(`   📋 Ejemplo respuesta: ${JSON.stringify(q.respuestas[0] || {})}`);
        }
        
        // Analizar score detallado
        if (q.score_detallado) {
          console.log(`   🎯 Score detallado disponible: Sí`);
          console.log(`   📊 Claves: ${Object.keys(q.score_detallado).join(', ')}`);
        }
        
        // Analizar metadata
        if (q.metadata) {
          console.log(`   📚 Metadata disponible: Sí`);
          console.log(`   🔧 Items en metadata: ${q.metadata.items?.length || 'N/A'}`);
        }
      });
    }
    
    // Verificar entrevista inicial
    if (data.intake) {
      console.log('\n📋 ENTREVISTA INICIAL:');
      console.log(`   📊 Estado: ${data.intake.estado}`);
      console.log(`   📝 Campos disponibles: ${Object.keys(data.intake.datos || {}).length}`);
      console.log(`   🔧 Campos: ${Object.keys(data.intake.datos || {}).slice(0, 5).join(', ')}...`);
    }
    
    console.log('\n✅ DATOS DISPONIBLES PARA GPT-4O');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

analyzeQuestionnaireData();
