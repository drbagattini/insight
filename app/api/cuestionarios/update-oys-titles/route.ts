import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function POST() {
  try {
    console.log('📝 Actualizando títulos de cuestionarios OYS consolidados...');

    // Nuevos títulos más limpios
    const titleUpdates = [
      {
        codigo: 'OYS-PADRES-40',
        titulo: 'Ohio Youth Scales (Padres/Tutores)'
      },
      {
        codigo: 'OYS-JOVENES-40', 
        titulo: 'Ohio Youth Scales (Jóvenes)'
      }
    ];

    const results = [];

    for (const update of titleUpdates) {
      console.log(`🔄 Actualizando ${update.codigo}: "${update.titulo}"`);
      
      const { error } = await supabaseAdmin
        .from('cuestionarios')
        .update({ titulo: update.titulo })
        .eq('codigo', update.codigo);

      if (error) {
        console.error(`❌ Error actualizando ${update.codigo}:`, error.message);
        results.push({ 
          codigo: update.codigo, 
          success: false, 
          error: error.message 
        });
      } else {
        console.log(`✅ ${update.codigo} actualizado exitosamente`);
        results.push({ 
          codigo: update.codigo, 
          success: true,
          nuevoTitulo: update.titulo
        });
      }
    }

    // Verificar resultado final
    const { data: updatedQuestionnaires } = await supabaseAdmin
      .from('cuestionarios')
      .select('codigo, titulo')
      .in('codigo', ['OYS-PADRES-40', 'OYS-JOVENES-40'])
      .eq('activo', true);

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `Títulos actualizados: ${successCount} exitosos, ${errorCount} errores`,
      updated: successCount,
      errors: errorCount,
      results,
      questionnaires: updatedQuestionnaires?.map(q => ({
        codigo: q.codigo,
        titulo: q.titulo
      }))
    });

  } catch (error) {
    console.error('❌ Error inesperado actualizando títulos:', error);
    return NextResponse.json({
      success: false,
      error: 'Error interno del servidor',
      details: error instanceof Error ? error.message : 'Error desconocido'
    }, { status: 500 });
  }
}
