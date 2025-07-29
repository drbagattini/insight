#!/usr/bin/env node

/**
 * Verificar estructura real de la tabla respuestas
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function verifyTableStructure() {
  console.log('🔍 VERIFICANDO ESTRUCTURA REAL DE LA TABLA RESPUESTAS');
  console.log('=' .repeat(60));

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // 1. Verificar estructura de la tabla respuestas
    console.log('\n📊 CONSULTANDO ESTRUCTURA DE LA TABLA...');
    
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'respuestas' })
      .select();

    if (columnsError) {
      console.log('❌ Error consultando columnas:', columnsError.message);
      
      // Método alternativo: consultar una fila para ver campos disponibles
      console.log('\n🔄 MÉTODO ALTERNATIVO: Consultando una respuesta...');
      
      const { data: sample, error: sampleError } = await supabase
        .from('respuestas')
        .select('*')
        .limit(1);

      if (sampleError) {
        console.log('❌ Error consultando respuestas:', sampleError.message);
        return;
      }

      if (sample && sample.length > 0) {
        console.log('\n✅ CAMPOS DISPONIBLES EN LA TABLA RESPUESTAS:');
        const fields = Object.keys(sample[0]);
        fields.forEach(field => {
          console.log(`   📋 ${field}: ${typeof sample[0][field]}`);
        });

        // Verificar específicamente score_detallado
        if (fields.includes('score_detallado')) {
          console.log('\n✅ CAMPO score_detallado: EXISTE');
          console.log(`   📊 Valor ejemplo: ${JSON.stringify(sample[0].score_detallado, null, 2)}`);
        } else {
          console.log('\n❌ CAMPO score_detallado: NO EXISTE');
        }

        // Verificar respuestas
        if (fields.includes('respuestas')) {
          console.log('\n✅ CAMPO respuestas: EXISTE');
          console.log(`   📊 Tipo: ${typeof sample[0].respuestas}`);
          if (sample[0].respuestas) {
            console.log(`   📋 Estructura: ${JSON.stringify(sample[0].respuestas, null, 2).substring(0, 200)}...`);
          }
        }

      } else {
        console.log('⚠️ No hay respuestas en la tabla para analizar');
      }

    } else {
      console.log('\n✅ COLUMNAS DE LA TABLA RESPUESTAS:');
      columns.forEach(col => {
        console.log(`   📋 ${col.column_name}: ${col.data_type}`);
      });
    }

    // 2. Contar respuestas por cuestionario
    console.log('\n📊 CONTEO DE RESPUESTAS POR CUESTIONARIO:');
    
    const { data: counts, error: countError } = await supabase
      .from('respuestas')
      .select(`
        cuestionario_id,
        cuestionarios!inner(codigo, titulo)
      `);

    if (countError) {
      console.log('❌ Error contando respuestas:', countError.message);
    } else {
      const countsByCode = {};
      counts.forEach(item => {
        const code = item.cuestionarios.codigo;
        countsByCode[code] = (countsByCode[code] || 0) + 1;
      });

      Object.entries(countsByCode).forEach(([code, count]) => {
        console.log(`   📋 ${code}: ${count} respuestas`);
      });
    }

    // 3. Verificar si hay datos de score_detallado poblados
    console.log('\n🔍 VERIFICANDO DATOS DE score_detallado:');
    
    const { data: detailedScores, error: detailedError } = await supabase
      .from('respuestas')
      .select('id, score_detallado, cuestionarios!inner(codigo)')
      .not('score_detallado', 'is', null)
      .limit(5);

    if (detailedError) {
      console.log('❌ Error consultando score_detallado:', detailedError.message);
    } else if (detailedScores && detailedScores.length > 0) {
      console.log(`✅ Encontradas ${detailedScores.length} respuestas con score_detallado:`);
      detailedScores.forEach(item => {
        console.log(`   📊 ${item.cuestionarios.codigo}: ${Object.keys(item.score_detallado || {}).join(', ')}`);
      });
    } else {
      console.log('⚠️ No se encontraron respuestas con score_detallado poblado');
    }

  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

verifyTableStructure();
