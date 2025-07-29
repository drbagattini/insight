#!/usr/bin/env node

/**
 * DIAGNÓSTICO: Analizar exactamente qué datos recibe GPT-4o
 */

async function diagnoseGPT4oContext() {
  console.log('🔍 DIAGNÓSTICO: Analizando contexto enviado a GPT-4o');
  console.log('=' .repeat(70));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    const fetch = (await import('node-fetch')).default;
    
    // 1. Analizar datos del endpoint de datos
    console.log('\n📊 PASO 1: Analizando endpoint de datos');
    const dataResponse = await fetch(`http://localhost:3000/api/informes/datos/${testPatientId}`);
    
    if (!dataResponse.ok) {
      console.error('❌ Error en endpoint de datos:', dataResponse.status);
      return;
    }
    
    const patientData = await dataResponse.json();
    
    console.log('\n👤 DATOS DEL PSICÓLOGO:');
    console.log('   ID:', patientData.psychologist?.id || 'NO DISPONIBLE');
    console.log('   Nombre:', patientData.psychologist?.name || 'NO DISPONIBLE');
    console.log('   Email:', patientData.psychologist?.email || 'NO DISPONIBLE');
    
    console.log('\n👤 DATOS DEL PACIENTE:');
    console.log('   Nombre:', patientData.patient?.name || 'NO DISPONIBLE');
    console.log('   ID:', patientData.patient?.id || 'NO DISPONIBLE');
    
    console.log('\n📋 CUESTIONARIOS:');
    console.log('   Total:', patientData.questionnaires?.length || 0);
    
    if (patientData.questionnaires?.length > 0) {
      const opdCuestionarios = patientData.questionnaires.filter(q => 
        q.cuestionario_codigo === 'OPD-CA2-SQ'
      );
      
      console.log('   OPD-CA2-SQ encontrados:', opdCuestionarios.length);
      
      if (opdCuestionarios.length > 0) {
        const firstOpd = opdCuestionarios[0];
        console.log('\n🔍 ANÁLISIS OPD-CA2-SQ:');
        console.log('   Respuestas disponibles:', Object.keys(firstOpd.respuestas || {}).length);
        console.log('   Score detallado:', firstOpd.score_detallado ? 'SÍ' : 'NO');
        
        if (firstOpd.respuestas) {
          const firstKey = Object.keys(firstOpd.respuestas)[0];
          console.log('   Ejemplo respuesta:', firstKey, '=', firstOpd.respuestas[firstKey]);
        }
      }
    }
    
    console.log('\n📄 INFORMES:');
    console.log('   Disponibles:', patientData.informes ? 'SÍ' : 'NO');
    if (patientData.informes) {
      console.log('   Cantidad:', patientData.informes.length || 0);
    }
    
    console.log('\n📝 EVOLUCIÓN CLÍNICA:');
    console.log('   Disponible:', patientData.evolucion_clinica ? 'SÍ' : 'NO');
    if (patientData.evolucion_clinica) {
      console.log('   Entradas:', patientData.evolucion_clinica.length || 0);
    }
    
    console.log('\n📊 ENTREVISTA INICIAL:');
    console.log('   Disponible:', patientData.intake ? 'SÍ' : 'NO');
    if (patientData.intake) {
      console.log('   Campos:', Object.keys(patientData.intake).length);
      console.log('   Estructura:', typeof patientData.intake);
    }
    
    // 2. Verificar metadata de cuestionarios
    console.log('\n📋 PASO 2: Verificando metadata de cuestionarios');
    
    // Simular importación de metadata
    console.log('   Verificando questionnairesMeta.ts...');
    
    // 3. Crear JSON de prueba como lo recibe GPT-4o
    console.log('\n🤖 PASO 3: JSON enviado a GPT-4o (primeros 500 chars):');
    const jsonContext = JSON.stringify(patientData, null, 2);
    console.log(jsonContext.substring(0, 500) + '...');
    console.log('\n   Tamaño total del JSON:', jsonContext.length, 'caracteres');
    
    console.log('\n🎯 PROBLEMAS IDENTIFICADOS:');
    
    // Análisis de problemas
    if (!patientData.psychologist?.name || patientData.psychologist.name === 'Psicólogo') {
      console.log('   ❌ PROBLEMA 1: Nombre del psicólogo no disponible');
    }
    
    if (!patientData.informes) {
      console.log('   ❌ PROBLEMA 5: Informes no incluidos en contexto');
    }
    
    if (!patientData.evolucion_clinica) {
      console.log('   ❌ PROBLEMA 6: Evolución clínica no incluida');
    }
    
    const opdCount = patientData.questionnaires?.filter(q => 
      q.cuestionario_codigo === 'OPD-CA2-SQ'
    ).length || 0;
    
    if (opdCount === 0) {
      console.log('   ❌ PROBLEMA 4: No hay cuestionarios OPD-CA2-SQ');
    } else {
      console.log('   ✅ OPD-CA2-SQ: Cuestionarios encontrados');
    }

  } catch (error) {
    console.error('\n❌ ERROR en diagnóstico:', error.message);
  }
}

diagnoseGPT4oContext();
