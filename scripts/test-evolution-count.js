/**
 * Script para verificar específicamente el problema #1:
 * Contar evoluciones clínicas disponibles vs las que se cargan
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nkemjlbkqtqrjwjhqmvj.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PATIENT_ID = '2385677e-cf3e-45e3-8d28-9100afa90a3a'; // Pedro Subiria

async function testEvolutionCount() {
  if (!SUPABASE_SERVICE_KEY) {
    console.log('❌ SUPABASE_SERVICE_ROLE_KEY no configurada');
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  console.log('🔍 VERIFICANDO CONTEO DE EVOLUCIONES CLÍNICAS');
  console.log('=' .repeat(60));
  console.log(`👤 Paciente ID: ${PATIENT_ID}`);

  try {
    // Contar evoluciones en evolucion_clinica
    const { data: evolutionData, error: evolutionError } = await supabase
      .from('evolucion_clinica')
      .select('*')
      .eq('paciente_id', PATIENT_ID)
      .order('created_at', { ascending: false });

    if (evolutionError) {
      console.log('❌ Error consultando evolucion_clinica:', evolutionError);
      return;
    }

    console.log(`📋 Total evoluciones en evolucion_clinica: ${evolutionData?.length || 0}`);

    if (evolutionData && evolutionData.length > 0) {
      console.log('\n📝 Detalles de evoluciones encontradas:');
      evolutionData.forEach((entry, index) => {
        console.log(`${index + 1}. ID: ${entry.id}`);
        console.log(`   Tipo: ${entry.entry_type || 'N/A'}`);
        console.log(`   Fecha: ${entry.created_at}`);
        console.log(`   Contenido: ${entry.content?.substring(0, 100)}...`);
        console.log('   ---');
      });
    }

    // También verificar evoluciones_clinicas (tabla de síntesis)
    const { data: synthesisData, error: synthesisError } = await supabase
      .from('evoluciones_clinicas')
      .select('*')
      .eq('patient_id', PATIENT_ID)
      .order('created_at', { ascending: false });

    if (!synthesisError && synthesisData) {
      console.log(`\n🤖 Total síntesis en evoluciones_clinicas: ${synthesisData.length}`);
      
      if (synthesisData.length > 0) {
        console.log('\n🔬 Detalles de síntesis encontradas:');
        synthesisData.forEach((entry, index) => {
          console.log(`${index + 1}. ID: ${entry.id}`);
          console.log(`   Tipo: ${entry.tipo}`);
          console.log(`   Versión: ${entry.version}`);
          console.log(`   Fecha: ${entry.created_at}`);
          console.log('   ---');
        });
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICACIÓN COMPLETADA');
    console.log(`📊 Total registros de evolución disponibles: ${(evolutionData?.length || 0) + (synthesisData?.length || 0)}`);

  } catch (error) {
    console.log('❌ Error general:', error.message);
  }
}

testEvolutionCount().catch(console.error);
