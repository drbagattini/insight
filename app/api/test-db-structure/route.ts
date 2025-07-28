import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  try {
    console.log('[TEST DB STRUCTURE] Starting test...');

    // 1. Verificar estructura de la tabla evoluciones_clinicas
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('evoluciones_clinicas')
      .select('*')
      .limit(1);

    console.log('[TEST DB STRUCTURE] Sample data:', { sampleData, sampleError });

    // 2. Verificar qué campos están disponibles
    if (sampleData && sampleData.length > 0) {
      const fields = Object.keys(sampleData[0]);
      console.log('[TEST DB STRUCTURE] Available fields:', fields);
    }

    // 3. Verificar si hay registros de supervision existentes
    const { data: supervisionData, error: supervisionError } = await supabaseAdmin
      .from('evoluciones_clinicas')
      .select('*')
      .eq('tipo', 'supervision')
      .limit(5);

    console.log('[TEST DB STRUCTURE] Supervision records:', { supervisionData, supervisionError });

    return NextResponse.json({
      success: true,
      sampleData: sampleData?.[0] || null,
      sampleError,
      supervisionData,
      supervisionError,
      availableFields: sampleData?.[0] ? Object.keys(sampleData[0]) : [],
      supervisionCount: supervisionData?.length || 0
    });

  } catch (error) {
    console.error('[TEST DB STRUCTURE] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
