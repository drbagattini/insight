import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  try {
    const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

    console.log('[TEST DELETE SUPERVISION] Testing delete functionality for supervision entries...');

    // Buscar entradas de supervisión existentes
    const { data: supervisionEntries, error: fetchError } = await (supabaseAdmin as any)
      .from('evoluciones_clinicas')
      .select('id, created_by, patient_id, tipo, created_at')
      .eq('patient_id', testPatientId)
      .eq('tipo', 'supervision');

    console.log('[TEST DELETE SUPERVISION] Found supervision entries:', { 
      count: supervisionEntries?.length || 0, 
      error: fetchError 
    });

    if (supervisionEntries && supervisionEntries.length > 0) {
      const testEntry = supervisionEntries[0];
      console.log('[TEST DELETE SUPERVISION] Test entry details:', {
        id: testEntry.id,
        created_by: testEntry.created_by,
        patient_id: testEntry.patient_id,
        created_at: testEntry.created_at
      });

      // Simular búsqueda como lo haría el endpoint DELETE
      // Primero buscar en evolucion_clinica (debería fallar)
      const { data: manualEntry, error: manualError } = await (supabaseAdmin as any)
        .from('evolucion_clinica')
        .select('id, author_id, paciente_id')
        .eq('id', testEntry.id)
        .eq('paciente_id', testPatientId)
        .single();

      console.log('[TEST DELETE SUPERVISION] Manual entry search:', { 
        found: !!manualEntry, 
        error: manualError?.message 
      });

      // Luego buscar en evoluciones_clinicas (debería funcionar)
      const { data: supervisionEntry, error: supervisionError } = await (supabaseAdmin as any)
        .from('evoluciones_clinicas')
        .select('id, created_by, patient_id')
        .eq('id', testEntry.id)
        .eq('patient_id', testPatientId)
        .single();

      console.log('[TEST DELETE SUPERVISION] Supervision entry search:', { 
        found: !!supervisionEntry, 
        error: supervisionError?.message 
      });

      return NextResponse.json({
        success: true,
        message: 'Delete logic test completed',
        results: {
          supervision_entries_found: supervisionEntries.length,
          test_entry_id: testEntry.id,
          manual_search: { found: !!manualEntry, error: manualError?.message },
          supervision_search: { found: !!supervisionEntry, error: supervisionError?.message },
          delete_logic_working: !manualEntry && !!supervisionEntry
        }
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'No supervision entries found to test',
        results: {
          supervision_entries_found: 0
        }
      });
    }

  } catch (error) {
    console.error('[TEST DELETE SUPERVISION] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
