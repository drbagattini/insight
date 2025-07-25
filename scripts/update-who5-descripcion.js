require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateWho5Descripcion() {
  try {
    console.log('🔄 Actualizando descripción del WHO-5...');

    const nuevaDescripcion = 'Por favor, responda a cada pregunta en relación a cómo se sintió en las últimas dos semanas.';

    const { data, error } = await supabase
      .from('cuestionarios')
      .update({ 
        descripcion: nuevaDescripcion
      })
      .eq('codigo', 'WHO-5')
      .select();

    if (error) {
      console.error('❌ Error al actualizar:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Descripción del WHO-5 actualizada exitosamente');
      console.log('📝 Nueva descripción:', nuevaDescripcion);
    } else {
      console.log('⚠️  No se encontró el cuestionario WHO-5');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateWho5Descripcion();
