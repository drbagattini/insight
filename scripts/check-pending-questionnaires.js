#!/usr/bin/env node

/**
 * Script simple para verificar cuestionarios pendientes
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkPendingQuestionnaires() {
  console.log('🔍 Verificando cuestionarios pendientes...\n');

  try {
    // Contar total de links
    const { count: totalLinks } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total de links en la tabla: ${totalLinks}`);

    // Contar links no consumidos
    const { count: notConsumed } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true })
      .eq('consumido', false);
    
    console.log(`📋 Links no consumidos: ${notConsumed}`);

    // Contar links expirados
    const { count: expired } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true })
      .lt('expira_en', new Date().toISOString());
    
    console.log(`⏰ Links expirados: ${expired}`);

    // Contar links pendientes (no consumidos Y no expirados)
    const { count: pending } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true })
      .eq('consumido', false)
      .gt('expira_en', new Date().toISOString());

    console.log(`✅ Links pendientes válidos: ${pending}`);

    // Mostrar algunos ejemplos de links pendientes
    if (pending > 0) {
      console.log('\n📋 Ejemplos de links pendientes:');
      
      const { data: examples } = await supabase
        .from('links_cuestionario')
        .select('id, token, expira_en, creado_en, consumido')
        .eq('consumido', false)
        .gt('expira_en', new Date().toISOString())
        .limit(5);

      examples?.forEach((link, i) => {
        console.log(`   ${i + 1}. Token: ${link.token.substring(0, 8)}...`);
        console.log(`      Creado: ${new Date(link.creado_en).toLocaleString('es-ES')}`);
        console.log(`      Expira: ${new Date(link.expira_en).toLocaleString('es-ES')}`);
        console.log('');
      });
    }

    return { totalLinks, notConsumed, expired, pending };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return null;
  }
}

// Función para limpiar links expirados
async function cleanExpiredLinks() {
  console.log('\n🧹 Limpiando links expirados...');
  
  try {
    const { count, error } = await supabase
      .from('links_cuestionario')
      .delete({ count: 'exact' })
      .lt('expira_en', new Date().toISOString());

    if (error) {
      console.error('❌ Error limpiando:', error.message);
      return false;
    }

    console.log(`✅ Se eliminaron ${count} links expirados`);
    return true;

  } catch (error) {
    console.error('❌ Error durante limpieza:', error.message);
    return false;
  }
}

async function main() {
  const stats = await checkPendingQuestionnaires();
  
  if (stats && stats.expired > 0) {
    console.log(`\n💡 Hay ${stats.expired} links expirados que podrían limpiarse`);
    console.log('   Para limpiarlos, ejecuta: node scripts/check-pending-questionnaires.js --clean');
  }

  // Si se pasa --clean como argumento, limpiar
  if (process.argv.includes('--clean')) {
    await cleanExpiredLinks();
    
    // Verificar de nuevo después de limpiar
    console.log('\n🔄 Verificando después de la limpieza:');
    await checkPendingQuestionnaires();
  }
}

if (require.main === module) {
  main().catch(console.error);
}
