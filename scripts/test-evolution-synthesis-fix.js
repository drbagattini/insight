/**
 * Script para verificar que ahora se detectan TODAS las evoluciones,
 * incluyendo las síntesis de supervisión IA que antes no se detectaban
 */

const PATIENT_ID = '2385677e-cf3e-45e3-8d28-9100afa90a3a'; // Pedro Subiria

async function testEvolutionSynthesisFix() {
  console.log('🔍 VERIFICANDO DETECCIÓN DE SÍNTESIS DE SUPERVISIÓN IA');
  console.log('=' .repeat(70));
  console.log(`👤 Paciente: Pedro Subiria (${PATIENT_ID})`);

  try {
    console.log('\n📊 Consultando endpoint de datos del paciente...');
    
    const response = await fetch(`http://localhost:3000/api/informes/datos/${PATIENT_ID}`);
    
    if (!response.ok) {
      console.log(`❌ Error HTTP: ${response.status}`);
      const errorData = await response.text();
      console.log('📄 Respuesta:', errorData);
      return;
    }

    const patientData = await response.json();
    
    console.log('✅ Datos del paciente obtenidos correctamente');
    console.log('\n📋 RESUMEN DE EVOLUCIONES CLÍNICAS:');
    console.log('---');
    
    if (patientData.evolucion_clinica && Array.isArray(patientData.evolucion_clinica)) {
      console.log(`📊 Total evoluciones detectadas: ${patientData.evolucion_clinica.length}`);
      
      // Contar por tipo
      const manualEntries = patientData.evolucion_clinica.filter(e => 
        e.source === 'manual' || (!e.source && e.entry_type !== 'supervision_synthesis')
      );
      const synthesisEntries = patientData.evolucion_clinica.filter(e => 
        e.source === 'ai_synthesis' || e.entry_type === 'supervision_synthesis'
      );
      
      console.log(`📝 Evoluciones manuales: ${manualEntries.length}`);
      console.log(`🤖 Síntesis de supervisión IA: ${synthesisEntries.length}`);
      
      console.log('\n📋 DETALLE DE TODAS LAS EVOLUCIONES:');
      console.log('---');
      
      patientData.evolucion_clinica.forEach((entry, index) => {
        console.log(`${index + 1}. ID: ${entry.id}`);
        console.log(`   Tipo: ${entry.entry_type || 'N/A'}`);
        console.log(`   Origen: ${entry.source || 'legacy'}`);
        if (entry.version) console.log(`   Versión: ${entry.version}`);
        console.log(`   Fecha: ${entry.created_at}`);
        console.log(`   Contenido: ${entry.content?.substring(0, 100)}...`);
        console.log('   ---');
      });
      
      // Verificar si se detectan las síntesis
      if (synthesisEntries.length > 0) {
        console.log('\n✅ ÉXITO: Se detectaron síntesis de supervisión IA');
        console.log(`🎯 Total síntesis encontradas: ${synthesisEntries.length}`);
        
        // Mostrar detalles de las síntesis
        console.log('\n🤖 DETALLES DE SÍNTESIS DE SUPERVISIÓN:');
        synthesisEntries.forEach((synthesis, index) => {
          console.log(`${index + 1}. Síntesis v${synthesis.version || 'N/A'}`);
          console.log(`   ID: ${synthesis.id}`);
          console.log(`   Fecha: ${synthesis.created_at}`);
          console.log(`   Contenido: ${synthesis.content?.substring(0, 150)}...`);
          console.log('   ---');
        });
        
      } else {
        console.log('\n❌ PROBLEMA: No se detectaron síntesis de supervisión IA');
        console.log('⚠️  Puede que no existan o que aún no se estén cargando correctamente');
      }
      
    } else {
      console.log('❌ No se encontraron evoluciones clínicas o estructura incorrecta');
    }

    // Verificar summary si existe
    if (patientData.summary) {
      console.log('\n📊 RESUMEN ESTADÍSTICO:');
      console.log('---');
      console.log(`Total evoluciones: ${patientData.summary.evolution_entries || 'N/A'}`);
      console.log(`Evoluciones manuales: ${patientData.summary.manual_entries || 'N/A'}`);
      console.log(`Síntesis IA: ${patientData.summary.ai_synthesis_entries || 'N/A'}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('🎯 RESULTADO DE LA CORRECCIÓN:');
    
    const totalEvolutions = patientData.evolucion_clinica?.length || 0;
    const synthesisCount = patientData.evolucion_clinica?.filter(e => 
      e.source === 'ai_synthesis' || e.entry_type === 'supervision_synthesis'
    ).length || 0;
    
    if (totalEvolutions >= 4 && synthesisCount > 0) {
      console.log('✅ CORRECCIÓN EXITOSA: Se detectan todas las evoluciones incluyendo síntesis IA');
      console.log(`📊 Total: ${totalEvolutions} evoluciones (incluyendo ${synthesisCount} síntesis)`);
    } else if (totalEvolutions === 2 && synthesisCount === 0) {
      console.log('❌ PROBLEMA PERSISTE: Solo se detectan 2 evoluciones, faltan las síntesis IA');
    } else {
      console.log(`⚠️  ESTADO INTERMEDIO: ${totalEvolutions} evoluciones, ${synthesisCount} síntesis`);
    }

  } catch (error) {
    console.log('❌ Error ejecutando prueba:', error.message);
  }
}

testEvolutionSynthesisFix().catch(console.error);
