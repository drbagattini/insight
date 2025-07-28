import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  try {
    const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

    // 1. Verificar todos los registros de supervision para Pedro
    const { data: supervisionRecords, error: supervisionError } = await supabaseAdmin
      .from('evoluciones_clinicas')
      .select('*')
      .eq('patient_id', testPatientId)
      .eq('tipo', 'supervision')
      .order('created_at', { ascending: false });

    console.log('[TEST SUPERVISION RECORDS] Supervision records:', supervisionRecords);

    // 2. Verificar todos los tipos de evoluciones para Pedro
    const { data: allRecords, error: allError } = await supabaseAdmin
      .from('evoluciones_clinicas')
      .select('tipo, version, status, created_at, data')
      .eq('patient_id', testPatientId)
      .order('created_at', { ascending: false });

    console.log('[TEST SUPERVISION RECORDS] All evolution records:', allRecords);

    // 3. Contar por tipo
    const typeCount = allRecords?.reduce((acc: any, record: any) => {
      acc[record.tipo] = (acc[record.tipo] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      supervisionRecords,
      supervisionError,
      allRecords,
      allError,
      typeCount,
      totalRecords: allRecords?.length || 0,
      supervisionCount: supervisionRecords?.length || 0
    });

  } catch (error) {
    console.error('[TEST SUPERVISION RECORDS] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
