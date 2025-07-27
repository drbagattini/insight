const { createClient } = require('@supabase/supabase-js');

// Leer variables de entorno
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSintesisIA() {
  try {
    console.log('🧪 Probando tipo sintesis_ia (más corto)...');
    
    // Obtener datos reales
    const { data: patients } = await supabase
      .from('patients')
      .select('id')
      .limit(1);
    
    const { data: users } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (!patients?.length || !users?.length) {
      console.log('⚠️ No hay pacientes o usuarios para probar');
      return;
    }

    const testData = {
      paciente_id: patients[0].id,
      author_id: users[0].id,
      entry_type: 'sintesis_ia',  // 11 caracteres - debería funcionar
      content: 'Prueba de síntesis IA - ' + new Date().toISOString(),
      metadata: { test: true, generated_at: new Date().toISOString() },
      tags: ['test', 'sintesis-ia']
    };

    console.log('📝 Intentando insertar:', {
      ...testData,
      content: testData.content.substring(0, 30) + '...'
    });
    console.log('📏 Longitud entry_type:', testData.entry_type.length, 'caracteres');

    const { data, error } = await supabase
      .from('evolucion_clinica')
      .insert(testData)
      .select();

    if (error) {
      console.error('❌ Error:', error);
      
      if (error.message.includes('entry_type')) {
        console.log('🔧 Aún hay problema con entry_type. Ejecuta en Supabase:');
        console.log(`
ALTER TABLE public.evolucion_clinica 
DROP CONSTRAINT IF EXISTS evolucion_clinica_entry_type_check;

ALTER TABLE public.evolucion_clinica 
ADD CONSTRAINT evolucion_clinica_entry_type_check 
CHECK (entry_type IN ('clinica', 'supervision', 'sesion', 'paciente', 'sintesis_ia'));
        `);
      }
      return;
    }

    console.log('✅ ¡Inserción exitosa!', data);
    
    // Limpiar
    if (data?.[0]?.id) {
      await supabase
        .from('evolucion_clinica')
        .delete()
        .eq('id', data[0].id);
      console.log('🧹 Registro de prueba eliminado');
    }

    console.log('🎉 El tipo sintesis_ia funciona correctamente');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSintesisIA();
