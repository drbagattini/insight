#!/usr/bin/env node

/**
 * DIAGNÓSTICO: Estructura de la base de datos
 */

async function diagnoseDatabaseStructure() {
  console.log('🔍 DIAGNÓSTICO: Estructura de la base de datos');
  console.log('=' .repeat(60));

  try {
    // Cargar variables de entorno
    require('dotenv').config({ path: '.env.local' });
    
    // Importar Supabase
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Variables de entorno de Supabase no configuradas');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('\n📊 VERIFICANDO TABLAS DISPONIBLES...');
    
    // 1. Verificar tabla de usuarios/psicólogos
    console.log('\n👤 TABLA DE USUARIOS:');
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('*')
        .limit(1);
      
      if (usersError) {
        console.log('   ❌ Tabla "users" no existe o error:', usersError.message);
      } else {
        console.log('   ✅ Tabla "users" existe');
        if (users && users.length > 0) {
          console.log('   📋 Campos disponibles:', Object.keys(users[0]));
        }
      }
    } catch (e) {
      console.log('   ❌ Error accediendo a tabla "users"');
    }
    
    // 2. Verificar tabla de psicólogos
    console.log('\n👨‍⚕️ TABLA DE PSICÓLOGOS:');
    try {
      const { data: psychologists, error: psychError } = await supabase
        .from('psychologists')
        .select('*')
        .limit(1);
      
      if (psychError) {
        console.log('   ❌ Tabla "psychologists" no existe o error:', psychError.message);
      } else {
        console.log('   ✅ Tabla "psychologists" existe');
        if (psychologists && psychologists.length > 0) {
          console.log('   📋 Campos disponibles:', Object.keys(psychologists[0]));
        }
      }
    } catch (e) {
      console.log('   ❌ Error accediendo a tabla "psychologists"');
    }
    
    // 3. Verificar tabla de informes
    console.log('\n📄 TABLA DE INFORMES:');
    try {
      const { data: reports, error: reportsError } = await supabase
        .from('informes')
        .select('*')
        .limit(1);
      
      if (reportsError) {
        console.log('   ❌ Tabla "informes" no existe o error:', reportsError.message);
      } else {
        console.log('   ✅ Tabla "informes" existe');
        if (reports && reports.length > 0) {
          console.log('   📋 Campos disponibles:', Object.keys(reports[0]));
        }
      }
    } catch (e) {
      console.log('   ❌ Error accediendo a tabla "informes"');
    }
    
    // 4. Verificar tabla de evolución clínica
    console.log('\n📝 TABLA DE EVOLUCIÓN CLÍNICA:');
    try {
      const { data: evolution, error: evolutionError } = await supabase
        .from('evolucion_clinica')
        .select('*')
        .limit(1);
      
      if (evolutionError) {
        console.log('   ❌ Tabla "evolucion_clinica" no existe o error:', evolutionError.message);
      } else {
        console.log('   ✅ Tabla "evolucion_clinica" existe');
        if (evolution && evolution.length > 0) {
          console.log('   📋 Campos disponibles:', Object.keys(evolution[0]));
        }
      }
    } catch (e) {
      console.log('   ❌ Error accediendo a tabla "evolucion_clinica"');
    }
    
    // 5. Verificar cuestionarios OPD-CA2-SQ
    console.log('\n📋 CUESTIONARIOS OPD-CA2-SQ:');
    try {
      const { data: opdQuestions, error: opdError } = await supabase
        .from('respuestas')
        .select('*, cuestionarios(*)')
        .eq('cuestionarios.codigo', 'OPD-CA2-SQ')
        .limit(1);
      
      if (opdError) {
        console.log('   ❌ Error buscando OPD-CA2-SQ:', opdError.message);
      } else {
        console.log('   📊 Cuestionarios OPD-CA2-SQ encontrados:', opdQuestions?.length || 0);
        if (opdQuestions && opdQuestions.length > 0) {
          console.log('   📋 Estructura:', Object.keys(opdQuestions[0]));
        }
      }
    } catch (e) {
      console.log('   ❌ Error verificando OPD-CA2-SQ');
    }
    
    console.log('\n🎯 RESUMEN DEL DIAGNÓSTICO:');
    console.log('Este análisis nos ayudará a identificar:');
    console.log('- ✅ Qué tablas existen para usuarios/psicólogos');
    console.log('- ✅ Si hay tabla de informes');
    console.log('- ✅ Si hay tabla de evolución clínica');
    console.log('- ✅ Por qué no aparecen cuestionarios OPD-CA2-SQ');

  } catch (error) {
    console.error('\n❌ ERROR en diagnóstico de BD:', error.message);
  }
}

diagnoseDatabaseStructure();
