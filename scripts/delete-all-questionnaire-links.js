#!/usr/bin/env node

/**
 * Script para eliminar TODOS los links de cuestionarios
 * Usado para limpiar datos de prueba de recurrencias
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

async function deleteAllQuestionnaireLinks() {
  console.log('🗑️  Eliminando TODOS los links de cuestionarios...\n');

  try {
    // Primero mostrar estadísticas actuales
    const { count: totalLinks } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true });
    
    const { count: consumedLinks } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true })
      .eq('consumido', true);
    
    const { count: pendingLinks } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true })
      .eq('consumido', false);

    console.log('📊 Estado actual:');
    console.log(`   Total de links: ${totalLinks}`);
    console.log(`   Links consumidos: ${consumedLinks}`);
    console.log(`   Links pendientes: ${pendingLinks}`);

    if (totalLinks === 0) {
      console.log('✅ No hay links para eliminar');
      return;
    }

    // Eliminar TODOS los links
    console.log('\n🧹 Eliminando todos los links...');
    
    const { count: deletedCount, error } = await supabase
      .from('links_cuestionario')
      .delete({ count: 'exact' })
      .gte('creado_en', '1900-01-01'); // WHERE clause que coincide con todos los registros

    if (error) {
      console.error('❌ Error eliminando links:', error.message);
      return false;
    }

    console.log(`✅ Se eliminaron ${deletedCount} links de cuestionarios`);

    // Verificar que la tabla esté vacía
    const { count: remainingLinks } = await supabase
      .from('links_cuestionario')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Links restantes: ${remainingLinks}`);

    if (remainingLinks === 0) {
      console.log('🎉 Tabla links_cuestionario completamente limpia');
      console.log('💡 Los "Cuestionarios Pendientes" en el dashboard ahora mostrarán 0');
    } else {
      console.log('⚠️  Aún quedan algunos links en la tabla');
    }

    return true;

  } catch (error) {
    console.error('❌ Error durante la eliminación:', error.message);
    return false;
  }
}

async function main() {
  console.log('⚠️  ADVERTENCIA: Este script eliminará TODOS los links de cuestionarios');
  console.log('   Esto incluye links consumidos y pendientes');
  console.log('   Esta acción NO se puede deshacer\n');

  // Si se pasa --confirm, proceder directamente
  if (process.argv.includes('--confirm')) {
    await deleteAllQuestionnaireLinks();
  } else {
    console.log('💡 Para confirmar la eliminación, ejecuta:');
    console.log('   node scripts/delete-all-questionnaire-links.js --confirm');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
