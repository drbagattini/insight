/**
 * Script para insertar el cuestionario BR-WAI en la base de datos
 * 
 * Uso: node scripts/seed-br-wai.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Variables de entorno de Supabase no encontradas');
  console.error('Asegúrate de que NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY estén configuradas en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Definición del cuestionario BR-WAI
const brWaiData = {
  codigo: 'BR-WAI',
  titulo: 'Alianza Terapéutica (BR-WAI)',
  descripcion: 'Cuestionario de 16 ítems que evalúa la calidad de la alianza terapéutica en sus dos componentes fundamentales: el vínculo emocional y el acuerdo sobre tareas y objetivos del tratamiento.',
  activo: true,
  items: [
    {
      orden: 1,
      texto: 'Mi terapeuta y yo nos entendemos mutuamente.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 2,
      texto: 'Hemos logrado una buena comprensión de los cambios que serían buenos para mí.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 3,
      texto: 'Siento que mi terapeuta me valora.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 4,
      texto: 'Creo que el tiempo que mi terapeuta y yo pasamos juntos no se aprovecha de forma eficiente.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 5,
      texto: 'Creo que mi terapeuta me aprecia.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 6,
      texto: 'Lo que hago en terapia me brinda nuevas maneras de mirar mi problema.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 7,
      texto: 'Siento que mi terapeuta se preocupa por mí aun cuando hago cosas que no aprueba.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 8,
      texto: 'Mi terapeuta no entiende lo que intento lograr en la terapia.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 9,
      texto: 'Confío en la capacidad de mi terapeuta para ayudarme.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 10,
      texto: 'Siento que lo que hago en terapia me ayudará a conseguir los cambios que deseo.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 11,
      texto: 'Mi terapeuta y yo confiamos el uno en el otro.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 12,
      texto: 'No estoy de acuerdo con mi terapeuta sobre qué debería obtener de la terapia.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 13,
      texto: 'Creo que mi terapeuta se preocupa genuinamente por mi bienestar.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 14,
      texto: 'Coincidimos en lo que es importante que trabaje.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 15,
      texto: 'Mi terapeuta y yo nos respetamos mutuamente.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    },
    {
      orden: 16,
      texto: 'Las cosas que mi terapeuta me pide que haga no tienen sentido.',
      opciones_respuesta: [
        { valor: 1, texto: 'Totalmente en desacuerdo' },
        { valor: 2, texto: 'En desacuerdo' },
        { valor: 3, texto: 'Ni de acuerdo ni en desacuerdo' },
        { valor: 4, texto: 'De acuerdo' },
        { valor: 5, texto: 'Totalmente de acuerdo' }
      ]
    }
  ]
};

async function seedBrWai() {
  try {
    console.log('🌱 Iniciando seeding del cuestionario BR-WAI...');

    // Verificar si ya existe
    const { data: existing, error: checkError } = await supabase
      .from('cuestionarios')
      .select('id')
      .eq('codigo', 'BR-WAI')
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      console.log('📝 BR-WAI ya existe. Actualizando...');
      
      const { error: updateError } = await supabase
        .from('cuestionarios')
        .update(brWaiData)
        .eq('codigo', 'BR-WAI');

      if (updateError) {
        throw updateError;
      }

      console.log('✅ BR-WAI actualizado exitosamente');
    } else {
      console.log('📝 Insertando nuevo cuestionario BR-WAI...');
      
      const { error: insertError } = await supabase
        .from('cuestionarios')
        .insert([brWaiData]);

      if (insertError) {
        throw insertError;
      }

      console.log('✅ BR-WAI insertado exitosamente');
    }

    // Verificar la inserción
    const { data: verification, error: verifyError } = await supabase
      .from('cuestionarios')
      .select('id, codigo, titulo, activo')
      .eq('codigo', 'BR-WAI')
      .single();

    if (verifyError) {
      throw verifyError;
    }

    console.log('🔍 Verificación:', {
      id: verification.id,
      codigo: verification.codigo,
      titulo: verification.titulo,
      activo: verification.activo
    });

    console.log('🎉 Seeding completado exitosamente');

  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
    process.exit(1);
  }
}

// Ejecutar el script
seedBrWai();
