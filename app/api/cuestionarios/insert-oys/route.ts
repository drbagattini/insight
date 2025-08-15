import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST() {
  try {
    console.log('📋 Insertando cuestionarios Ohio Youth Scales...');

    // Items básicos para que funcione - se pueden actualizar después
    const basicItems = [
      { id: 1, texto: "Pregunta de ejemplo 1", tipo: "likert", opciones: ["Nunca", "A veces", "Frecuentemente", "Siempre"] },
      { id: 2, texto: "Pregunta de ejemplo 2", tipo: "likert", opciones: ["Nunca", "A veces", "Frecuentemente", "Siempre"] }
    ];

    const oysQuestionnaires = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        codigo: 'OYS-PS-P-SF20',
        titulo: 'Ohio Youth Scales - Severidad de Problemas (Padres) - Forma Corta',
        descripcion: 'Cuestionario de 20 ítems para evaluar la severidad de problemas conductuales y emocionales desde la perspectiva de padres/tutores',
        activo: true,
        items: basicItems
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        codigo: 'OYS-F-P-SF20',
        titulo: 'Ohio Youth Scales - Funcionamiento (Padres) - Forma Corta',
        descripcion: 'Cuestionario de 20 ítems para evaluar el nivel de funcionamiento desde la perspectiva de padres/tutores',
        activo: true,
        items: basicItems
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440003',
        codigo: 'OYS-PS-Y-SF20',
        titulo: 'Ohio Youth Scales - Severidad de Problemas (Jóvenes) - Forma Corta',
        descripcion: 'Cuestionario de 20 ítems para evaluar la severidad de problemas conductuales y emocionales desde la perspectiva del joven',
        activo: true,
        items: basicItems
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440004',
        codigo: 'OYS-F-Y-SF20',
        titulo: 'Ohio Youth Scales - Funcionamiento (Jóvenes) - Forma Corta',
        descripcion: 'Cuestionario de 20 ítems para evaluar el nivel de funcionamiento desde la perspectiva del joven',
        activo: true,
        items: basicItems
      }
    ];

    // Verificar si ya existen
    const { data: existing } = await supabaseAdmin
      .from('cuestionarios')
      .select('codigo')
      .in('codigo', ['OYS-PS-P-SF20', 'OYS-F-P-SF20', 'OYS-PS-Y-SF20', 'OYS-F-Y-SF20']);

    const existingCodes = existing?.map(q => q.codigo) || [];
    const newQuestionnaires = oysQuestionnaires.filter(q => !existingCodes.includes(q.codigo));

    if (newQuestionnaires.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todos los cuestionarios OYS ya existen',
        inserted: 0,
        existing: existingCodes.length
      });
    }

    console.log(`📝 Insertando ${newQuestionnaires.length} cuestionarios nuevos...`);

    const results = [];
    for (const questionnaire of newQuestionnaires) {
      console.log(`  • ${questionnaire.codigo}: ${questionnaire.titulo}`);
      
      const { error } = await supabaseAdmin
        .from('cuestionarios')
        .insert(questionnaire);

      if (error) {
        console.error(`    ❌ Error: ${error.message}`);
        results.push({ codigo: questionnaire.codigo, success: false, error: error.message });
      } else {
        console.log(`    ✅ Insertado exitosamente`);
        results.push({ codigo: questionnaire.codigo, success: true });
      }
    }

    // Verificar resultado final
    const { data: allQuestionnaires } = await supabaseAdmin
      .from('cuestionarios')
      .select('codigo, titulo')
      .eq('activo', true)
      .order('titulo');

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Proceso completado: ${successCount} insertados, ${errorCount} errores`,
      inserted: successCount,
      errors: errorCount,
      results,
      totalQuestionnaires: allQuestionnaires?.length || 0,
      questionnaires: allQuestionnaires?.map(q => ({ codigo: q.codigo, titulo: q.titulo }))
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
