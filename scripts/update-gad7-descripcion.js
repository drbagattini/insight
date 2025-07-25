/**
 * Script para actualizar la descripción de GAD-7 en la base de datos
 * Cambia la descripción técnica por una consigna clara para el paciente
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateGad7Descripcion() {
  console.log('🔄 Actualizando descripción de GAD-7...');

  try {
    // Actualizar la descripción del cuestionario GAD-7
    const { data, error } = await supabase
      .from('cuestionarios')
      .update({
        descripcion: 'Durante las últimas 2 semanas, ¿con qué frecuencia ha tenido molestias debido a los siguientes problemas? Seleccione la opción que mejor describa su experiencia.'
      })
      .eq('codigo', 'GAD-7')
      .select();

    if (error) {
      console.error('❌ Error al actualizar GAD-7:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ GAD-7 actualizado exitosamente');
      console.log('📝 Nueva descripción:', data[0].descripcion);
    } else {
      console.log('⚠️ No se encontró el cuestionario GAD-7 para actualizar');
    }

    // Verificar el cambio
    const { data: verificacion, error: errorVerif } = await supabase
      .from('cuestionarios')
      .select('codigo, titulo, descripcion')
      .eq('codigo', 'GAD-7')
      .single();

    if (errorVerif) {
      console.error('❌ Error en verificación:', errorVerif);
      return;
    }

    console.log('🔍 Verificación:', {
      codigo: verificacion.codigo,
      titulo: verificacion.titulo,
      descripcion: verificacion.descripcion
    });

    console.log('🎉 Actualización de descripción GAD-7 completada exitosamente!');

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar el script
updateGad7Descripcion();
