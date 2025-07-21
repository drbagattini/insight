#!/usr/bin/env node

/**
 * Script para limpiar links duplicados de cuestionarios
 * Mantiene solo el más reciente de cada grupo (paciente + cuestionario)
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

async function findDuplicates() {
  console.log('🔍 Buscando links duplicados...\n');

  try {
    // Obtener todos los links pendientes
    const { data: pendingLinks, error } = await supabase
      .from('links_cuestionario')
      .select(`
        id,
        token,
        expira_en,
        creado_en,
        consumido,
        paciente_id,
        cuestionario_id,
        paciente:patients(name),
        cuestionario:cuestionarios(codigo)
      `)
      .eq('consumido', false)
      .gt('expira_en', new Date().toISOString())
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo links:', error.message);
      return null;
    }

    // Agrupar por paciente + cuestionario
    const groups = {};
    
    pendingLinks.forEach(link => {
      const key = `${link.paciente_id}-${link.cuestionario_id}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(link);
    });

    // Encontrar grupos con duplicados
    const duplicateGroups = Object.entries(groups).filter(([key, links]) => links.length > 1);
    
    console.log(`📊 Total de links pendientes: ${pendingLinks.length}`);
    console.log(`🔍 Grupos con duplicados: ${duplicateGroups.length}`);
    
    let totalDuplicatesToRemove = 0;
    const linksToDelete = [];

    duplicateGroups.forEach(([key, links]) => {
      const patient = Array.isArray(links[0].paciente) ? links[0].paciente[0] : links[0].paciente;
      const questionnaire = Array.isArray(links[0].cuestionario) ? links[0].cuestionario[0] : links[0].cuestionario;
      
      console.log(`\n📝 ${patient?.name || 'N/A'} - ${questionnaire?.codigo || 'N/A'}: ${links.length} links`);
      
      // Ordenar por fecha de creación (más reciente primero)
      links.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
      
      // Mantener el primero (más reciente), marcar el resto para eliminar
      const [keep, ...toDelete] = links;
      
      console.log(`   ✅ Mantener: ${keep.token.substring(0, 8)}... (${new Date(keep.creado_en).toLocaleString('es-ES')})`);
      
      toDelete.forEach(link => {
        console.log(`   ❌ Eliminar: ${link.token.substring(0, 8)}... (${new Date(link.creado_en).toLocaleString('es-ES')})`);
        linksToDelete.push(link.id);
      });
      
      totalDuplicatesToRemove += toDelete.length;
    });

    console.log(`\n💡 Total de links duplicados a eliminar: ${totalDuplicatesToRemove}`);
    console.log(`📊 Links que quedarían después de la limpieza: ${pendingLinks.length - totalDuplicatesToRemove}`);

    return {
      duplicateGroups,
      linksToDelete,
      totalDuplicatesToRemove,
      totalBefore: pendingLinks.length
    };

  } catch (error) {
    console.error('❌ Error durante la búsqueda:', error.message);
    return null;
  }
}

async function cleanDuplicates(linksToDelete) {
  if (linksToDelete.length === 0) {
    console.log('✅ No hay duplicados para limpiar');
    return true;
  }

  console.log(`\n🧹 Eliminando ${linksToDelete.length} links duplicados...`);

  try {
    const { count, error } = await supabase
      .from('links_cuestionario')
      .delete({ count: 'exact' })
      .in('id', linksToDelete);

    if (error) {
      console.error('❌ Error eliminando duplicados:', error.message);
      return false;
    }

    console.log(`✅ Se eliminaron ${count} links duplicados`);
    return true;

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    return false;
  }
}

async function main() {
  const analysis = await findDuplicates();
  
  if (!analysis) {
    console.log('❌ No se pudo completar el análisis');
    return;
  }

  if (analysis.totalDuplicatesToRemove === 0) {
    console.log('✅ No hay duplicados para limpiar');
    return;
  }

  // Si se pasa --confirm, proceder con la limpieza
  if (process.argv.includes('--confirm')) {
    const success = await cleanDuplicates(analysis.linksToDelete);
    
    if (success) {
      console.log('\n🔄 Verificando resultado...');
      
      // Verificar el resultado
      const { count: finalCount } = await supabase
        .from('links_cuestionario')
        .select('*', { count: 'exact', head: true })
        .eq('consumido', false)
        .gt('expira_en', new Date().toISOString());

      console.log(`📊 Links pendientes después de la limpieza: ${finalCount}`);
      console.log(`📉 Reducción: ${analysis.totalBefore} → ${finalCount} (${analysis.totalDuplicatesToRemove} eliminados)`);
    }
  } else {
    console.log('\n💡 Para confirmar la limpieza, ejecuta:');
    console.log('   node scripts/clean-duplicate-questionnaires.js --confirm');
    console.log('\n⚠️  ADVERTENCIA: Esta acción no se puede deshacer. Revisa los duplicados antes de confirmar.');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
