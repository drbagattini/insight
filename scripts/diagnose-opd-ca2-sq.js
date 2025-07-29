#!/usr/bin/env node

/**
 * DIAGNÓSTICO: Por qué no aparecen cuestionarios OPD-CA2-SQ
 */

async function diagnoseOpdCa2Sq() {
  console.log('🔍 DIAGNÓSTICO: Cuestionarios OPD-CA2-SQ');
  console.log('=' .repeat(50));

  try {
    // Cargar variables de entorno
    require('dotenv').config({ path: '.env.local' });
    
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

    console.log('\n📊 PASO 1: Buscar cuestionarios OPD-CA2-SQ directamente');
    
    // Buscar en tabla cuestionarios
    const { data: questionnaires, error: qError } = await supabase
      .from('cuestionarios')
      .select('*')
      .eq('codigo', 'OPD-CA2-SQ');
    
    console.log('Cuestionarios OPD-CA2-SQ en tabla cuestionarios:', questionnaires?.length || 0);
    if (questionnaires?.length > 0) {
      console.log('Primer cuestionario:', questionnaires[0]);
    }
    
    console.log('\n📋 PASO 2: Buscar respuestas OPD-CA2-SQ');
    
    // Buscar respuestas con join
    const { data: responses, error: rError } = await supabase
      .from('respuestas')
      .select(`
        *,
        cuestionarios(codigo, titulo)
      `)
      .eq('paciente_id', testPatientId);
    
    console.log('Total respuestas para paciente:', responses?.length || 0);
    
    if (responses) {
      const opdResponses = responses.filter(r => 
        r.cuestionarios && r.cuestionarios.codigo === 'OPD-CA2-SQ'
      );
      console.log('Respuestas OPD-CA2-SQ encontradas:', opdResponses.length);
      
      if (opdResponses.length > 0) {
        console.log('\n🔍 ANÁLISIS DE RESPUESTA OPD-CA2-SQ:');
        const firstOpd = opdResponses[0];
        console.log('ID:', firstOpd.id);
        console.log('Cuestionario código:', firstOpd.cuestionarios.codigo);
        console.log('Cuestionario título:', firstOpd.cuestionarios.titulo);
        console.log('Respuestas keys:', Object.keys(firstOpd.respuestas || {}));
        console.log('Score detallado:', firstOpd.score_detallado ? 'SÍ' : 'NO');
      }
      
      // Mostrar todos los códigos de cuestionarios
      const allCodes = responses.map(r => r.cuestionarios?.codigo).filter(Boolean);
      console.log('\n📊 Todos los códigos de cuestionarios encontrados:');
      console.log([...new Set(allCodes)]);
    }
    
    console.log('\n📋 PASO 3: Verificar metadata de OPD-CA2-SQ');
    
    // Simular carga de metadata
    console.log('Verificando si OPD-CA2-SQ está en questionnairesMeta.ts...');
    
    console.log('\n🎯 CONCLUSIÓN:');
    console.log('Este diagnóstico nos dirá si:');
    console.log('- El cuestionario existe en la BD');
    console.log('- Hay respuestas para el paciente');
    console.log('- El problema está en la consulta o en el filtrado');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
  }
}

diagnoseOpdCa2Sq();
