require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables de entorno faltantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateBrwaiDescripcion() {
  try {
    console.log('🔄 Actualizando descripción del BR-WAI...');

    const nuevaDescripcion = 'Este cuestionario evalúa cómo te sientes respecto a la relación con tu terapeuta y el trabajo que están realizando juntos. Tus respuestas ayudarán a mejorar la calidad de tu tratamiento.';

    const { data, error } = await supabase
      .from('cuestionarios')
      .update({ 
        descripcion: nuevaDescripcion
      })
      .eq('codigo', 'BR-WAI')
      .select();

    if (error) {
      console.error('❌ Error al actualizar:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Descripción del BR-WAI actualizada exitosamente');
      console.log('📝 Nueva descripción:', nuevaDescripcion);
    } else {
      console.log('⚠️  No se encontró el cuestionario BR-WAI');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateBrwaiDescripcion();
