const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Faltan variables de entorno SUPABASE');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedWho5() {
  console.log('🔄 Actualizando cuestionario WHO-5...');
  
  try {
    // Actualizar el título del cuestionario WHO-5 existente
    const { data, error } = await supabase
      .from('cuestionarios')
      .update({ 
        titulo: 'Índice de Bienestar (WHO-5)'
      })
      .eq('codigo', 'WHO-5')
      .select();

    if (error) {
      console.error('❌ Error al actualizar WHO-5:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ WHO-5 actualizado exitosamente');
      console.log('📋 Datos actualizados:', {
        id: data[0].id,
        codigo: data[0].codigo,
        titulo: data[0].titulo
      });
    } else {
      console.log('⚠️ No se encontró el cuestionario WHO-5 para actualizar');
    }

  } catch (err) {
    console.error('❌ Error inesperado:', err);
  }
}

// Ejecutar el seeding
seedWho5().then(() => {
  console.log('🏁 Proceso completado');
  process.exit(0);
}).catch(err => {
  console.error('💥 Error fatal:', err);
  process.exit(1);
});
