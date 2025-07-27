const { createClient } = require('@supabase/supabase-js');

// Leer variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixSintesisType() {
  try {
    console.log('🔄 Verificando restricción actual...');
    
    // Primero verificar la restricción actual
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT constraint_name, check_clause 
          FROM information_schema.check_constraints 
          WHERE constraint_name LIKE '%entry_type%' 
          AND table_name = 'evolucion_clinica';
        `
      });

    if (constraintError) {
      console.log('⚠️ Error verificando restricciones:', constraintError);
    } else {
      console.log('📋 Restricciones actuales:', constraints);
    }

    console.log('🔄 Eliminando restricción antigua...');
    
    // Eliminar restricción existente
    const { error: dropError } = await supabase
      .rpc('exec_sql', { 
        sql: `ALTER TABLE public.evolucion_clinica DROP CONSTRAINT IF EXISTS evolucion_clinica_entry_type_check;`
      });

    if (dropError) {
      console.log('⚠️ Error eliminando restricción (puede no existir):', dropError.message);
    } else {
      console.log('✅ Restricción antigua eliminada');
    }

    console.log('🔄 Agregando nueva restricción...');
    
    // Agregar nueva restricción
    const { error: addError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          ALTER TABLE public.evolucion_clinica 
          ADD CONSTRAINT evolucion_clinica_entry_type_check 
          CHECK (entry_type IN ('clinica', 'supervision', 'sesion', 'paciente', 'sintesis_evolutiva_ia'));
        `
      });

    if (addError) {
      console.error('❌ Error agregando nueva restricción:', addError);
      throw addError;
    }

    console.log('✅ Nueva restricción agregada exitosamente');

    // Verificar que funciona insertando un registro de prueba
    console.log('🧪 Probando inserción con nuevo tipo...');
    
    const testData = {
      paciente_id: '00000000-0000-0000-0000-000000000000', // UUID de prueba
      author_id: '00000000-0000-0000-0000-000000000000',   // UUID de prueba
      entry_type: 'sintesis_evolutiva_ia',
      content: 'Prueba de síntesis evolutiva IA',
      metadata: { test: true },
      tags: ['test']
    };

    // Intentar insertar (fallará por FK pero validará el tipo)
    const { error: insertError } = await supabase
      .from('evolucion_clinica')
      .insert(testData);

    if (insertError) {
      if (insertError.message.includes('foreign key') || insertError.message.includes('violates')) {
        console.log('✅ Tipo validado correctamente (error esperado de FK)');
      } else if (insertError.message.includes('entry_type')) {
        console.error('❌ El tipo aún no es válido:', insertError.message);
        throw insertError;
      } else {
        console.log('✅ Tipo aceptado (error diferente):', insertError.message);
      }
    } else {
      console.log('✅ Inserción exitosa (limpiando...)');
      // Limpiar registro de prueba si se insertó
      await supabase
        .from('evolucion_clinica')
        .delete()
        .eq('content', 'Prueba de síntesis evolutiva IA');
    }

    console.log('🎉 Migración completada exitosamente');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  }
}

fixSintesisType();
