#!/usr/bin/env node

/**
 * TEST: Verificar mejoras implementadas
 */

async function testImprovements() {
  console.log('🧪 TESTING: Mejoras implementadas');
  console.log('=' .repeat(50));

  const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('\n📊 PROBANDO ENDPOINT DE DATOS MEJORADO...');
    
    // Probar endpoint de datos
    const dataResponse = await fetch(`http://localhost:3000/api/informes/datos/${testPatientId}`);
    
    if (!dataResponse.ok) {
      console.error('❌ Error en endpoint de datos:', dataResponse.status);
      return;
    }
    
    const patientData = await dataResponse.json();
    
    console.log('\n👤 VERIFICACIÓN 1: Datos del psicólogo');
    console.log('   Nombre:', patientData.psychologist?.name || 'NO DISPONIBLE');
    console.log('   Email:', patientData.psychologist?.email || 'NO DISPONIBLE');
    console.log('   ✅ Mejorado:', patientData.psychologist?.name !== 'Psicólogo Temporal' ? 'SÍ' : 'NO');
    
    console.log('\n📋 VERIFICACIÓN 2: Cuestionarios OPD-CA2-SQ');
    const opdCuestionarios = patientData.questionnaires?.filter(q => 
      q.codigo === 'OPD-CA2-SQ'
    ) || [];
    
    console.log('   OPD-CA2-SQ encontrados:', opdCuestionarios.length);
    
    if (opdCuestionarios.length > 0) {
      const firstOpd = opdCuestionarios[0];
      console.log('   ✅ Tiene ítems:', firstOpd.items ? 'SÍ' : 'NO');
      console.log('   ✅ Tiene descripción:', firstOpd.descripcion ? 'SÍ' : 'NO');
      console.log('   ✅ Respuestas:', Object.keys(firstOpd.respuestas || {}).length, 'ítems');
      
      if (firstOpd.items && firstOpd.items.items) {
        console.log('   ✅ Total preguntas disponibles:', firstOpd.items.items.length);
        console.log('   ✅ Ejemplo pregunta:', firstOpd.items.items[0]?.text?.substring(0, 50) + '...');
      }
    }
    
    console.log('\n📝 VERIFICACIÓN 3: Evolución clínica');
    console.log('   Entradas disponibles:', patientData.evolucion_clinica?.length || 0);
    console.log('   ✅ Incluida:', patientData.evolucion_clinica ? 'SÍ' : 'NO');
    
    console.log('\n📄 VERIFICACIÓN 4: Informes');
    console.log('   Informes disponibles:', patientData.informes?.length || 0);
    console.log('   ✅ Incluidos:', patientData.informes ? 'SÍ' : 'NO');
    
    console.log('\n📊 VERIFICACIÓN 5: Resumen');
    if (patientData.summary) {
      console.log('   Total cuestionarios:', patientData.summary.total_questionnaires);
      console.log('   Tipos:', patientData.summary.questionnaire_types?.join(', '));
      console.log('   Entradas evolución:', patientData.summary.evolution_entries);
    }
    
    console.log('\n🎯 RESUMEN DE MEJORAS:');
    
    // Verificar cada mejora
    const mejoras = {
      'Psicólogo real': patientData.psychologist?.name !== 'Psicólogo Temporal',
      'OPD-CA2-SQ con preguntas': opdCuestionarios.length > 0 && opdCuestionarios[0]?.items,
      'Evolución clínica': patientData.evolucion_clinica?.length > 0,
      'Informes incluidos': patientData.informes !== undefined
    };
    
    Object.entries(mejoras).forEach(([mejora, implementada]) => {
      console.log(`   ${implementada ? '✅' : '❌'} ${mejora}`);
    });
    
    console.log('\n🚀 PRÓXIMO PASO: Probar supervisión con GPT-4o');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

testImprovements();
