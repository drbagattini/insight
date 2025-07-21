#!/usr/bin/env node

/**
 * Script para analizar en detalle los cuestionarios pendientes
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

async function analyzePendingQuestionnaires() {
  console.log('🔍 Analizando cuestionarios pendientes en detalle...\n');

  try {
    // Obtener todos los links pendientes con detalles
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
        paciente:patients(id, name, psychologist_id),
        cuestionario:cuestionarios(id, codigo, titulo)
      `)
      .eq('consumido', false)
      .gt('expira_en', new Date().toISOString())
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('❌ Error obteniendo links:', error.message);
      return;
    }

    console.log(`📊 Total de links pendientes: ${pendingLinks.length}\n`);

    // Agrupar por cuestionario
    const byQuestionnaire = {};
    const byPatient = {};
    const byPsychologist = {};

    pendingLinks.forEach(link => {
      const patient = Array.isArray(link.paciente) ? link.paciente[0] : link.paciente;
      const questionnaire = Array.isArray(link.cuestionario) ? link.cuestionario[0] : link.cuestionario;
      
      // Por cuestionario
      const qCode = questionnaire?.codigo || 'UNKNOWN';
      if (!byQuestionnaire[qCode]) byQuestionnaire[qCode] = [];
      byQuestionnaire[qCode].push(link);

      // Por paciente
      const patientName = patient?.name || 'UNKNOWN';
      if (!byPatient[patientName]) byPatient[patientName] = [];
      byPatient[patientName].push(link);

      // Por psicólogo
      const psychId = patient?.psychologist_id || 'UNKNOWN';
      if (!byPsychologist[psychId]) byPsychologist[psychId] = [];
      byPsychologist[psychId].push(link);
    });

    // Mostrar estadísticas por cuestionario
    console.log('📋 Links pendientes por tipo de cuestionario:');
    Object.entries(byQuestionnaire).forEach(([code, links]) => {
      console.log(`   ${code}: ${links.length} links`);
    });

    // Mostrar estadísticas por psicólogo
    console.log('\n👨‍⚕️ Links pendientes por psicólogo:');
    Object.entries(byPsychologist).forEach(([psychId, links]) => {
      console.log(`   Psicólogo ${psychId}: ${links.length} links`);
    });

    // Buscar duplicados (mismo paciente + mismo cuestionario)
    console.log('\n🔍 Buscando posibles duplicados...');
    const duplicates = {};
    
    pendingLinks.forEach(link => {
      const key = `${link.paciente_id}-${link.cuestionario_id}`;
      if (!duplicates[key]) duplicates[key] = [];
      duplicates[key].push(link);
    });

    const duplicateGroups = Object.entries(duplicates).filter(([key, links]) => links.length > 1);
    
    if (duplicateGroups.length > 0) {
      console.log(`   ⚠️  Encontrados ${duplicateGroups.length} grupos de posibles duplicados:`);
      
      duplicateGroups.forEach(([key, links]) => {
        const patient = Array.isArray(links[0].paciente) ? links[0].paciente[0] : links[0].paciente;
        const questionnaire = Array.isArray(links[0].cuestionario) ? links[0].cuestionario[0] : links[0].cuestionario;
        
        console.log(`\n   📝 Paciente: ${patient?.name || 'N/A'} - Cuestionario: ${questionnaire?.codigo || 'N/A'}`);
        console.log(`      ${links.length} links duplicados:`);
        
        links.forEach((link, i) => {
          console.log(`      ${i + 1}. Token: ${link.token.substring(0, 8)}... (${new Date(link.creado_en).toLocaleString('es-ES')})`);
        });
      });

      // Calcular cuántos links se podrían eliminar
      const duplicatesToRemove = duplicateGroups.reduce((total, [key, links]) => total + (links.length - 1), 0);
      console.log(`\n   💡 Se podrían eliminar ${duplicatesToRemove} links duplicados (manteniendo el más reciente de cada grupo)`);
    } else {
      console.log('   ✅ No se encontraron duplicados');
    }

    // Mostrar links que expiran pronto
    console.log('\n⏰ Links que expiran en las próximas 24 horas:');
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const expiringSoon = pendingLinks.filter(link => new Date(link.expira_en) <= tomorrow);
    
    if (expiringSoon.length > 0) {
      console.log(`   ⚠️  ${expiringSoon.length} links expiran pronto:`);
      expiringSoon.forEach((link, i) => {
        const patient = Array.isArray(link.paciente) ? link.paciente[0] : link.paciente;
        const questionnaire = Array.isArray(link.cuestionario) ? link.cuestionario[0] : link.cuestionario;
        
        console.log(`   ${i + 1}. ${patient?.name || 'N/A'} - ${questionnaire?.codigo || 'N/A'}`);
        console.log(`      Expira: ${new Date(link.expira_en).toLocaleString('es-ES')}`);
      });
    } else {
      console.log('   ✅ No hay links que expiren pronto');
    }

    return {
      total: pendingLinks.length,
      byQuestionnaire,
      byPatient,
      byPsychologist,
      duplicateGroups,
      expiringSoon
    };

  } catch (error) {
    console.error('❌ Error durante el análisis:', error.message);
    return null;
  }
}

async function main() {
  const analysis = await analyzePendingQuestionnaires();
  
  if (analysis && analysis.duplicateGroups.length > 0) {
    console.log('\n💡 Para limpiar duplicados, puedes ejecutar:');
    console.log('   node scripts/analyze-pending-questionnaires.js --clean-duplicates');
  }

  // Si se pasa --clean-duplicates, limpiar duplicados
  if (process.argv.includes('--clean-duplicates')) {
    console.log('\n🧹 Limpiando duplicados...');
    // TODO: Implementar limpieza de duplicados si es necesario
    console.log('   (Función de limpieza no implementada aún por seguridad)');
  }
}

if (require.main === module) {
  main().catch(console.error);
}
