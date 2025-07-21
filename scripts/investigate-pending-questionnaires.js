#!/usr/bin/env node

/**
 * Script para investigar los cuestionarios pendientes en la base de datos
 * Permite ver qué hay en la tabla links_cuestionario y limpiarla si es necesario
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigatePendingQuestionnaires() {
  console.log('🔍 Investigando cuestionarios pendientes...\n');

  try {
    // 1. Obtener estadísticas generales de links_cuestionario
    console.log('📊 Estadísticas generales de links_cuestionario:');
    
    const { count: totalLinks } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true });
    
    const { count: consumedLinks } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true })
      .eq('consumido', true);
    
    const { count: expiredLinks } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true })
      .lt('expira_en', new Date().toISOString());
    
    const { count: pendingLinks } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true })
      .eq('consumido', false)
      .gt('expira_en', new Date().toISOString());

    console.log(`   Total de links: ${totalLinks}`);
    console.log(`   Links consumidos: ${consumedLinks}`);
    console.log(`   Links expirados: ${expiredLinks}`);
    console.log(`   Links pendientes (válidos): ${pendingLinks}\n`);

    // 2. Obtener detalles de los links pendientes
    console.log('📋 Detalles de links pendientes:');
    
    const { data: pendingDetails, error } = await supabase
      .from('links_cuestionario')
      .select(`
        id,
        token,
        expira_en,
        creado_en,
        consumido,
        paciente:patients(id, name),
        cuestionario:cuestionarios(id, codigo, titulo)
      `)
      .eq('consumido', false)
      .gt('expira_en', new Date().toISOString())
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo detalles:', error);
      return;
    }

    if (pendingDetails && pendingDetails.length > 0) {
      console.log(`   Encontrados ${pendingDetails.length} links pendientes:\n`);
      
      pendingDetails.forEach((link, index) => {
        const patient = Array.isArray(link.paciente) ? link.paciente[0] : link.paciente;
        const questionnaire = Array.isArray(link.cuestionario) ? link.cuestionario[0] : link.cuestionario;
        
        console.log(`   ${index + 1}. Token: ${link.token.substring(0, 8)}...`);
        console.log(`      Paciente: ${patient?.name || 'N/A'} (ID: ${patient?.id || 'N/A'})`);
        console.log(`      Cuestionario: ${questionnaire?.codigo || 'N/A'} - ${questionnaire?.titulo || 'N/A'}`);
        console.log(`      Creado: ${new Date(link.creado_en).toLocaleString('es-ES')}`);
        console.log(`      Expira: ${new Date(link.expira_en).toLocaleString('es-ES')}`);
        console.log('');
      });
    } else {
      console.log('   ✅ No hay links pendientes válidos');
    }

    // 3. Mostrar links expirados que podrían limpiarse
    console.log('🗑️  Links expirados que podrían limpiarse:');
    
    const { data: expiredDetails } = await supabase
      .from('links_cuestionario')
      .select(`
        id,
        token,
        expira_en,
        creado_en,
        consumido,
        paciente:patients(id, name),
        cuestionario:cuestionarios(id, codigo, titulo)
      `)
      .lt('expira_en', new Date().toISOString())
      .order('expira_en', { ascending: false })
      .limit(10);

    if (expiredDetails && expiredDetails.length > 0) {
      console.log(`   Encontrados ${expiredDetails.length} links expirados (mostrando últimos 10):\n`);
      
      expiredDetails.forEach((link, index) => {
        const patient = Array.isArray(link.paciente) ? link.paciente[0] : link.paciente;
        const questionnaire = Array.isArray(link.cuestionario) ? link.cuestionario[0] : link.cuestionario;
        
        console.log(`   ${index + 1}. Token: ${link.token.substring(0, 8)}... (${link.consumido ? 'CONSUMIDO' : 'NO CONSUMIDO'})`);
        console.log(`      Paciente: ${patient?.name || 'N/A'}`);
        console.log(`      Cuestionario: ${questionnaire?.codigo || 'N/A'}`);
        console.log(`      Expiró: ${new Date(link.expira_en).toLocaleString('es-ES')}`);
        console.log('');
      });
    } else {
      console.log('   ✅ No hay links expirados');
    }

  } catch (error) {
    console.error('❌ Error durante la investigación:', error);
  }
}

async function cleanupExpiredLinks() {
  console.log('\n🧹 ¿Desea limpiar los links expirados? (y/N)');
  
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question('Respuesta: ', async (answer) => {
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        try {
          console.log('🗑️  Eliminando links expirados...');
          
          const { count, error } = await supabase
            .from('links_cuestionario')
            .delete({ count: 'exact' })
            .lt('expira_en', new Date().toISOString());

          if (error) {
            console.error('❌ Error eliminando links expirados:', error);
          } else {
            console.log(`✅ Se eliminaron ${count} links expirados`);
          }
        } catch (error) {
          console.error('❌ Error durante la limpieza:', error);
        }
      } else {
        console.log('ℹ️  No se realizó limpieza');
      }
      
      rl.close();
      resolve();
    });
  });
}

// Ejecutar el script
async function main() {
  await investigatePendingQuestionnaires();
  await cleanupExpiredLinks();
  
  console.log('\n✅ Investigación completada');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { investigatePendingQuestionnaires };
