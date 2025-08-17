const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Textos oficiales de los ítems según especificación
const severityItems = [
  "Discutir con otros",
  "Meterse en peleas (golpear, patear, empujar)",
  "Gritar, insultar o gritar a otros",
  "Ataques de enojo",
  "Negarse a hacer lo que piden docentes o padres",
  "Causar problemas sin razón",
  "Consumir drogas o alcohol",
  "Romper reglas o infringir la ley (quedarse fuera de horario, robar)",
  "Faltar a la escuela o a clases",
  "Mentir",
  "No poder quedarse quieto/a, tener demasiada energía",
  "Lastimarse a sí mismo/a (cortarse o rasguñarse, tomar pastillas)",
  "Hablar o pensar sobre la muerte",
  "Sentirse sin valor o inútil",
  "Sentirse solo/a y sin amigos",
  "Sentirse ansioso/a o temeroso/a",
  "Preocuparse de que vaya a pasar algo malo",
  "Sentirse triste o deprimido/a",
  "Pesadillas",
  "Problemas con la alimentación"
];

const functioningItems = [
  "Llevarse bien con los amigos",
  "Llevarse bien con la familia",
  "Desarrollar relaciones de pareja apropiadas para la edad",
  "Llevarse bien con adultos fuera de la familia (docentes, dirección)",
  "Mantenerse aseado/a y con buena apariencia",
  "Atender necesidades de salud y mantener buenos hábitos (tomar medicación o cepillarse los dientes)",
  "Controlar las emociones y mantenerse fuera de problemas",
  "Estar motivado/a y terminar proyectos",
  "Participar en pasatiempos (colecciones, música, videojuegos, arte)",
  "Participar en actividades recreativas (deportes, natación, bicicleta)",
  "Completar tareas del hogar (ordenar la habitación, otros quehaceres)",
  "Asistir a la escuela y obtener calificaciones aprobatorias",
  "Aprender habilidades que serán útiles para futuros trabajos",
  "Sentirse bien consigo mismo/a",
  "Pensar con claridad y tomar buenas decisiones",
  "Concentrarse, prestar atención y completar tareas",
  "Ganar dinero y aprender a usarlo sabiamente en formas apropiadas para la edad",
  "Hacer cosas sin supervisión o restricciones",
  "Aceptar responsabilidad por las propias acciones",
  "Capacidad para expresar sentimientos"
];

async function updateOYS40Items() {
  console.log('🔄 Actualizando textos de ítems OYS-40...');

  try {
    // Obtener los cuestionarios consolidados
    const { data: questionnaires, error: qError } = await supabase
      .from('cuestionarios')
      .select('*')
      .in('codigo', ['OYS-PADRES-40', 'OYS-JOVENES-40']);

    if (qError) {
      console.error('❌ Error obteniendo cuestionarios:', qError.message);
      return;
    }

    console.log(`✅ Encontrados ${questionnaires.length} cuestionarios consolidados`);

    for (const questionnaire of questionnaires) {
      console.log(`\n🔧 Actualizando ${questionnaire.codigo}...`);
      
      // Crear los ítems actualizados
      const updatedItems = [
        // Ítems de severidad (1-20)
        ...severityItems.map((texto, index) => ({
          id: index + 1,
          orden: index + 1,
          texto: texto,
          seccion: 'severidad_problemas',
          orden_global: index + 1
        })),
        // Ítems de funcionamiento (21-40)
        ...functioningItems.map((texto, index) => ({
          id: index + 21,
          orden: index + 21,
          texto: texto,
          seccion: 'funcionamiento',
          orden_global: index + 21
        }))
      ];

      // Actualizar el cuestionario con los nuevos ítems
      const { error: updateError } = await supabase
        .from('cuestionarios')
        .update({ items: updatedItems })
        .eq('id', questionnaire.id);

      if (updateError) {
        console.error(`❌ Error actualizando ${questionnaire.codigo}:`, updateError.message);
      } else {
        console.log(`✅ ${questionnaire.codigo} actualizado con ${updatedItems.length} ítems`);
      }
    }

    console.log('\n🎉 Actualización completada');

  } catch (error) {
    console.error('❌ Error inesperado:', error.message);
  }
}

updateOYS40Items();
