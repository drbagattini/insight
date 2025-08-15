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

async function checkTableStructure() {
  console.log('🔍 Verificando estructura de tabla cuestionarios...\n');
  
  try {
    // Intentar obtener algunos registros para ver la estructura
    const { data, error } = await supabase
      .from('cuestionarios')
      .select('*')
      .limit(3);

    if (error) {
      console.error('❌ Error al consultar cuestionarios:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Estructura de la tabla cuestionarios:');
      console.log('📋 Columnas encontradas:', Object.keys(data[0]));
      console.log('\n📄 Ejemplo de registros:');
      data.forEach((row, index) => {
        console.log(`\n--- Registro ${index + 1} ---`);
        Object.entries(row).forEach(([key, value]) => {
          console.log(`${key}: ${value}`);
        });
      });
    } else {
      console.log('⚠️  Tabla cuestionarios existe pero está vacía');
      
      // Intentar insertar un cuestionario de prueba para ver la estructura esperada
      console.log('\n🧪 Intentando insertar cuestionario de prueba...');
      const { error: insertError } = await supabase
        .from('cuestionarios')
        .insert({
          id: 'test-questionnaire',
          codigo: 'TEST',
          titulo: 'Cuestionario de Prueba',
          descripcion: 'Cuestionario para verificar estructura',
          activo: true
        });
      
      if (insertError) {
        console.log('❌ Error al insertar (esto nos ayuda a ver la estructura esperada):');
        console.log(insertError);
      } else {
        console.log('✅ Cuestionario de prueba insertado exitosamente');
      }
    }
  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

async function main() {
  await checkTableStructure();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkTableStructure };
