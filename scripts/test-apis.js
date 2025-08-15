#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables de entorno de Supabase no configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCuestionariosTable() {
  console.log('🧪 Probando tabla cuestionarios...');
  
  try {
    const { data, error } = await supabase
      .from('cuestionarios')
      .select('id, codigo, nombre, destinatario')
      .eq('activo', true)
      .limit(5);

    if (error) {
      console.error('❌ Error en cuestionarios:', error);
      return false;
    }

    console.log('✅ Cuestionarios encontrados:', data?.length || 0);
    if (data && data.length > 0) {
      console.log('📋 Ejemplo:', data[0]);
    }
    return true;
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

async function testAlertasTable() {
  console.log('\n🧪 Probando tabla alertas_clinicas...');
  
  try {
    const { data, error } = await supabase
      .from('alertas_clinicas')
      .select('id')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log('⚠️  Tabla alertas_clinicas no existe (esto es normal si no se ha ejecutado la migración)');
        return false;
      }
      console.error('❌ Error en alertas_clinicas:', error);
      return false;
    }

    console.log('✅ Tabla alertas_clinicas existe y es accesible');
    return true;
  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando pruebas de APIs...\n');
  
  const cuestionariosOk = await testCuestionariosTable();
  const alertasOk = await testAlertasTable();
  
  console.log('\n📊 Resumen de pruebas:');
  console.log(`  Cuestionarios: ${cuestionariosOk ? '✅' : '❌'}`);
  console.log(`  Alertas: ${alertasOk ? '✅' : '⚠️'}`);
  
  if (cuestionariosOk) {
    console.log('\n🎉 Las APIs básicas deberían funcionar correctamente');
  } else {
    console.log('\n⚠️  Hay problemas que necesitan resolverse');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testCuestionariosTable, testAlertasTable };
