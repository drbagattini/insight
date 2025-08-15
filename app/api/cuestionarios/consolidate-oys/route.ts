import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST() {
  try {
    console.log('🔄 Consolidando cuestionarios Ohio Youth Scales...');

    // Primero, obtener los cuestionarios existentes para extraer los ítems
    const { data: existingQuestionnaires } = await supabaseAdmin
      .from('cuestionarios')
      .select('*')
      .in('codigo', ['OYS-PS-P-SF20', 'OYS-F-P-SF20', 'OYS-PS-Y-SF20', 'OYS-F-Y-SF20']);

    if (!existingQuestionnaires || existingQuestionnaires.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No se encontraron los cuestionarios OYS originales. Ejecuta primero insert-oys y update-oys-content.'
      }, { status: 400 });
    }

    // Extraer ítems por tipo
    const psParents = existingQuestionnaires.find(q => q.codigo === 'OYS-PS-P-SF20');
    const fParents = existingQuestionnaires.find(q => q.codigo === 'OYS-F-P-SF20');
    const psYouth = existingQuestionnaires.find(q => q.codigo === 'OYS-PS-Y-SF20');
    const fYouth = existingQuestionnaires.find(q => q.codigo === 'OYS-F-Y-SF20');

    // Combinar ítems para padres (Severidad + Funcionamiento)
    const parentsItems = [
      ...(psParents?.items || []).map((item: any) => ({
        ...item,
        seccion: 'severidad_problemas',
        orden_global: item.id
      })),
      ...(fParents?.items || []).map((item: any) => ({
        ...item,
        seccion: 'funcionamiento',
        orden_global: item.id + 20
      }))
    ];

    // Combinar ítems para jóvenes (Severidad + Funcionamiento)
    const youthItems = [
      ...(psYouth?.items || []).map((item: any) => ({
        ...item,
        seccion: 'severidad_problemas',
        orden_global: item.id
      })),
      ...(fYouth?.items || []).map((item: any) => ({
        ...item,
        seccion: 'funcionamiento',
        orden_global: item.id + 20
      }))
    ];

    // Crear los 2 cuestionarios consolidados (solo campos básicos)
    const consolidatedQuestionnaires = [
      {
        id: '550e8400-e29b-41d4-a716-446655440010',
        codigo: 'OYS-PADRES-40',
        titulo: 'Ohio Youth Scales - Padres/Tutores (Forma Completa)',
        descripcion: 'Cuestionario completo de 40 ítems para evaluar severidad de problemas y funcionamiento desde la perspectiva de padres/tutores',
        activo: true,
        items: parentsItems
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440011',
        codigo: 'OYS-JOVENES-40',
        titulo: 'Ohio Youth Scales - Jóvenes (Forma Completa)',
        descripcion: 'Cuestionario completo de 40 ítems para evaluar severidad de problemas y funcionamiento desde la perspectiva del joven',
        activo: true,
        items: youthItems
      }
    ];

    // Verificar si ya existen
    const { data: existing } = await supabaseAdmin
      .from('cuestionarios')
      .select('codigo')
      .in('codigo', ['OYS-PADRES-40', 'OYS-JOVENES-40']);

    const existingCodes = existing?.map(q => q.codigo) || [];
    const newQuestionnaires = consolidatedQuestionnaires.filter(q => !existingCodes.includes(q.codigo));

    if (newQuestionnaires.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Los cuestionarios consolidados ya existen',
        existing: existingCodes.length
      });
    }

    // Insertar los nuevos cuestionarios consolidados
    const results = [];
    for (const questionnaire of newQuestionnaires) {
      console.log(`📝 Insertando: ${questionnaire.codigo} - ${questionnaire.titulo}`);
      
      const { error } = await supabaseAdmin
        .from('cuestionarios')
        .insert(questionnaire);

      if (error) {
        console.error(`❌ Error insertando ${questionnaire.codigo}:`, error.message);
        results.push({ codigo: questionnaire.codigo, success: false, error: error.message });
      } else {
        console.log(`✅ ${questionnaire.codigo} insertado exitosamente`);
        results.push({ codigo: questionnaire.codigo, success: true });
      }
    }

    // Desactivar los cuestionarios originales separados
    console.log('🔄 Desactivando cuestionarios originales separados...');
    const { error: deactivateError } = await supabaseAdmin
      .from('cuestionarios')
      .update({ activo: false })
      .in('codigo', ['OYS-PS-P-SF20', 'OYS-F-P-SF20', 'OYS-PS-Y-SF20', 'OYS-F-Y-SF20']);

    if (deactivateError) {
      console.warn('⚠️ Error desactivando cuestionarios originales:', deactivateError.message);
    } else {
      console.log('✅ Cuestionarios originales desactivados');
    }

    // Verificar resultado final
    const { data: allActive } = await supabaseAdmin
      .from('cuestionarios')
      .select('codigo, titulo, destinatario')
      .eq('activo', true)
      .order('titulo');

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Consolidación completada: ${successCount} cuestionarios creados, ${errorCount} errores`,
      inserted: successCount,
      errors: errorCount,
      results,
      activeQuestionnaires: allActive?.map(q => ({
        codigo: q.codigo,
        titulo: q.titulo,
        destinatario: q.destinatario
      }))
    });

  } catch (error) {
    console.error('❌ Error inesperado en consolidación:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
