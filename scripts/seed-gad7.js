/**
 * Script para insertar el cuestionario GAD-7 en la base de datos
 * 
 * GAD-7 (Generalized Anxiety Disorder 7-item scale)
 * - 7 ítems sobre síntomas de ansiedad generalizada
 * - Escala Likert 0-3 (Nunca, Varios días, Más de la mitad de los días, Casi todos los días)
 * - Puntuación total: 0-21
 * - Versión español rioplatense
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const gad7Data = {
  id: 'a1b2c3d4-5678-90ab-cdef-123456789abc', // UUID fijo para GAD-7
  codigo: 'GAD-7',
  titulo: 'Ansiedad Generalizada (GAD-7)',
  descripcion: 'Cuestionario de 7 ítems que evalúa la severidad del trastorno de ansiedad generalizada durante las últimas dos semanas. Versión español rioplatense.',
  activo: true,
  items: [
    {
      id: 1,
      orden: 1,
      texto: 'Sentirse nervioso/a, ansioso/a o tenso/a',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      id: 2,
      orden: 2,
      texto: 'No poder parar ni controlar la preocupación',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      id: 3,
      orden: 3,
      texto: 'Preocuparse demasiado por diferentes cosas',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      id: 4,
      orden: 4,
      texto: 'Dificultad para relajarse',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      id: 5,
      orden: 5,
      texto: 'Estar tan inquieto/a que le cuesta quedarse quieto/a',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      id: 6,
      orden: 6,
      texto: 'Irritable o fácilmente enfadado/a',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    },
    {
      id: 7,
      orden: 7,
      texto: 'Sentir miedo como si algo terrible pudiera pasar',
      opciones_respuesta: [
        { valor: 0, texto: 'Nunca' },
        { valor: 1, texto: 'Varios días' },
        { valor: 2, texto: 'Más de la mitad de los días' },
        { valor: 3, texto: 'Casi todos los días' }
      ]
    }
  ]
};

async function seedGad7() {
  try {
    console.log('🚀 Iniciando seeding de GAD-7...');
    
    // Verificar si ya existe
    const { data: existing } = await supabase
      .from('cuestionarios')
      .select('id')
      .eq('codigo', 'GAD-7')
      .single();
    
    if (existing) {
      console.log('📝 GAD-7 ya existe, actualizando...');
      
      const { error } = await supabase
        .from('cuestionarios')
        .update({
          titulo: gad7Data.titulo,
          descripcion: gad7Data.descripcion,
          items: gad7Data.items,
          activo: gad7Data.activo
        })
        .eq('codigo', 'GAD-7');
      
      if (error) {
        throw error;
      }
      
      console.log('✅ GAD-7 actualizado exitosamente');
    } else {
      console.log('📝 Insertando nuevo GAD-7...');
      
      const { error } = await supabase
        .from('cuestionarios')
        .insert(gad7Data);
      
      if (error) {
        throw error;
      }
      
      console.log('✅ GAD-7 insertado exitosamente');
    }
    
    // Verificar inserción
    const { data: verification } = await supabase
      .from('cuestionarios')
      .select('id, codigo, titulo')
      .eq('codigo', 'GAD-7')
      .single();
    
    console.log('🔍 Verificación:', verification);
    console.log('🎉 Seeding de GAD-7 completado exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en seeding de GAD-7:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedGad7();
}

module.exports = { seedGad7 };
