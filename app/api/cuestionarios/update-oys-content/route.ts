import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST() {
  try {
    console.log('📋 Actualizando contenido completo de Ohio Youth Scales...');

    // Cuestionario 1: OYS-PS-P-SF20 (Padre/Tutor - Problem Severity)
    const psParentItems = [
      {"id": 1, "orden": 1, "texto": "Discutir con otros"},
      {"id": 2, "orden": 2, "texto": "Meterse en peleas"},
      {"id": 3, "orden": 3, "texto": "Gritar, insultar o chillar a otros"},
      {"id": 4, "orden": 4, "texto": "Arrebatos de ira"},
      {"id": 5, "orden": 5, "texto": "Negarse a hacer lo que piden docentes o padres"},
      {"id": 6, "orden": 6, "texto": "Causar problemas sin motivo"},
      {"id": 7, "orden": 7, "texto": "Consumo de drogas o alcohol"},
      {"id": 8, "orden": 8, "texto": "Quebrantar reglas o la ley (volver después del horario, robar)"},
      {"id": 9, "orden": 9, "texto": "Faltar a la escuela o a clases"},
      {"id": 10, "orden": 10, "texto": "Mentir"},
      {"id": 11, "orden": 11, "texto": "No puede quedarse quieto/a, tiene demasiada energía"},
      {"id": 12, "orden": 12, "texto": "Hacerse daño (cortarse o rasguñarse, tomar pastillas)"},
      {"id": 13, "orden": 13, "texto": "Hablar o pensar sobre la muerte"},
      {"id": 14, "orden": 14, "texto": "Sentirse sin valor o inútil"},
      {"id": 15, "orden": 15, "texto": "Sentirse solo/a y sin amigos"},
      {"id": 16, "orden": 16, "texto": "Sentirse ansioso/a o temeroso/a"},
      {"id": 17, "orden": 17, "texto": "Preocuparse de que vaya a pasar algo malo"},
      {"id": 18, "orden": 18, "texto": "Sentirse triste o deprimido/a"},
      {"id": 19, "orden": 19, "texto": "Pesadillas"},
      {"id": 20, "orden": 20, "texto": "Problemas con la alimentación"}
    ];

    // Cuestionario 2: OYS-F-P-SF20 (Padre/Tutor - Functioning)
    const fParentItems = [
      {"id": 1, "orden": 1, "texto": "Llevarse bien con los amigos"},
      {"id": 2, "orden": 2, "texto": "Llevarse bien con la familia"},
      {"id": 3, "orden": 3, "texto": "Salir o desarrollar relaciones con novios/as"},
      {"id": 4, "orden": 4, "texto": "Llevarse bien con adultos fuera de la familia (docentes, directivos)"},
      {"id": 5, "orden": 5, "texto": "Mantenerse aseado/a y con buena apariencia"},
      {"id": 6, "orden": 6, "texto": "Atender necesidades de salud y mantener buenos hábitos (tomar medicación, cepillarse los dientes)"},
      {"id": 7, "orden": 7, "texto": "Controlar las emociones y evitar meterse en problemas"},
      {"id": 8, "orden": 8, "texto": "Estar motivado/a y terminar tareas"},
      {"id": 9, "orden": 9, "texto": "Participar en pasatiempos (colecciones, arte, etc.)"},
      {"id": 10, "orden": 10, "texto": "Participar en actividades recreativas (deportes, natación, bicicleta)"},
      {"id": 11, "orden": 11, "texto": "Cumplir tareas del hogar (ordenar la habitación, otras tareas)"},
      {"id": 12, "orden": 12, "texto": "Asistir a la escuela y obtener calificaciones aprobatorias"},
      {"id": 13, "orden": 13, "texto": "Aprender habilidades útiles para futuros trabajos"},
      {"id": 14, "orden": 14, "texto": "Sentirse bien consigo mismo/a"},
      {"id": 15, "orden": 15, "texto": "Pensar con claridad y tomar buenas decisiones"},
      {"id": 16, "orden": 16, "texto": "Concentrarse, prestar atención y completar tareas"},
      {"id": 17, "orden": 17, "texto": "Ganar dinero y aprender a usarlo con prudencia"},
      {"id": 18, "orden": 18, "texto": "Hacer cosas sin supervisión o restricciones"},
      {"id": 19, "orden": 19, "texto": "Asumir responsabilidad por las propias acciones"},
      {"id": 20, "orden": 20, "texto": "Capacidad para expresar sentimientos"}
    ];

    // Cuestionario 3: OYS-PS-Y-SF20 (Joven - Problem Severity)
    const psYouthItems = [
      {"id": 1, "orden": 1, "texto": "Discutir con otros"},
      {"id": 2, "orden": 2, "texto": "Meterse en peleas"},
      {"id": 3, "orden": 3, "texto": "Gritar, insultar o chillar a otros"},
      {"id": 4, "orden": 4, "texto": "Arrebatos de ira"},
      {"id": 5, "orden": 5, "texto": "Negarme a hacer lo que piden docentes o padres"},
      {"id": 6, "orden": 6, "texto": "Causar problemas sin motivo"},
      {"id": 7, "orden": 7, "texto": "Consumo de drogas o alcohol"},
      {"id": 8, "orden": 8, "texto": "Quebrantar reglas o la ley (volver después del horario, robar)"},
      {"id": 9, "orden": 9, "texto": "Faltar a la escuela o a clases"},
      {"id": 10, "orden": 10, "texto": "Mentir"},
      {"id": 11, "orden": 11, "texto": "No puedo quedarme quieto/a, tengo demasiada energía"},
      {"id": 12, "orden": 12, "texto": "Hacerme daño (cortarme o rasguñarme, tomar pastillas)"},
      {"id": 13, "orden": 13, "texto": "Hablar o pensar sobre la muerte"},
      {"id": 14, "orden": 14, "texto": "Sentirme sin valor o inútil"},
      {"id": 15, "orden": 15, "texto": "Sentirme solo/a y sin amigos"},
      {"id": 16, "orden": 16, "texto": "Sentirme ansioso/a o temeroso/a"},
      {"id": 17, "orden": 17, "texto": "Preocuparme de que vaya a pasar algo malo"},
      {"id": 18, "orden": 18, "texto": "Sentirme triste o deprimido/a"},
      {"id": 19, "orden": 19, "texto": "Pesadillas"},
      {"id": 20, "orden": 20, "texto": "Problemas con la alimentación"}
    ];

    // Cuestionario 4: OYS-F-Y-SF20 (Joven - Functioning)
    const fYouthItems = [
      {"id": 1, "orden": 1, "texto": "Llevarme bien con mis amigos"},
      {"id": 2, "orden": 2, "texto": "Llevarme bien con mi familia"},
      {"id": 3, "orden": 3, "texto": "Salir o desarrollar relaciones con novios/as"},
      {"id": 4, "orden": 4, "texto": "Llevarme bien con adultos fuera de mi familia (docentes, directivos)"},
      {"id": 5, "orden": 5, "texto": "Mantenerme aseado/a y con buena apariencia"},
      {"id": 6, "orden": 6, "texto": "Atender mis necesidades de salud y mantener buenos hábitos (tomar medicación, cepillarme los dientes)"},
      {"id": 7, "orden": 7, "texto": "Controlar mis emociones y evitar meterme en problemas"},
      {"id": 8, "orden": 8, "texto": "Estar motivado/a y terminar tareas"},
      {"id": 9, "orden": 9, "texto": "Participar en pasatiempos (colecciones, arte, etc.)"},
      {"id": 10, "orden": 10, "texto": "Participar en actividades recreativas (deportes, natación, bicicleta)"},
      {"id": 11, "orden": 11, "texto": "Cumplir tareas del hogar (ordenar mi habitación, otras tareas)"},
      {"id": 12, "orden": 12, "texto": "Asistir a la escuela y obtener calificaciones aprobatorias"},
      {"id": 13, "orden": 13, "texto": "Aprender habilidades útiles para futuros trabajos"},
      {"id": 14, "orden": 14, "texto": "Sentirme bien conmigo mismo/a"},
      {"id": 15, "orden": 15, "texto": "Pensar con claridad y tomar buenas decisiones"},
      {"id": 16, "orden": 16, "texto": "Concentrarme, prestar atención y completar tareas"},
      {"id": 17, "orden": 17, "texto": "Ganar dinero y aprender a usarlo con prudencia"},
      {"id": 18, "orden": 18, "texto": "Hacer cosas sin supervisión o restricciones"},
      {"id": 19, "orden": 19, "texto": "Asumir responsabilidad por mis acciones"},
      {"id": 20, "orden": 20, "texto": "Capacidad para expresar mis sentimientos"}
    ];

    const updates = [
      { codigo: 'OYS-PS-P-SF20', items: psParentItems },
      { codigo: 'OYS-F-P-SF20', items: fParentItems },
      { codigo: 'OYS-PS-Y-SF20', items: psYouthItems },
      { codigo: 'OYS-F-Y-SF20', items: fYouthItems }
    ];

    const results = [];
    
    for (const update of updates) {
      console.log(`📝 Actualizando ${update.codigo}...`);
      
      const { error } = await supabaseAdmin
        .from('cuestionarios')
        .update({ items: update.items })
        .eq('codigo', update.codigo);

      if (error) {
        console.error(`❌ Error actualizando ${update.codigo}:`, error.message);
        results.push({ codigo: update.codigo, success: false, error: error.message });
      } else {
        console.log(`✅ ${update.codigo} actualizado exitosamente`);
        results.push({ codigo: update.codigo, success: true });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Actualización completada: ${successCount} exitosos, ${errorCount} errores`,
      updated: successCount,
      errors: errorCount,
      results
    });

  } catch (error) {
    console.error('❌ Error inesperado:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
