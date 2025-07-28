import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  try {
    console.log('[TEST SYNTHESIS CORRECTED] Testing corrected structure...');

    // Test con la estructura correcta (sin contenido)
    const correctedData = {
      patient_id: '2385677e-cf3e-45e3-8d28-9100afa90a3a',
      tipo: 'supervision',
      version: 1,
      schema_version: 1,
      status: 'final',
      urgente: false,
      data: {
        synthesis: 'Test synthesis content - corrected structure',
        conversation_length: 4,
        generated_at: new Date().toISOString(),
        ai_model: 'gemini-1.5-flash',
        synthesis_type: 'supervision_chat'
      },
      created_by: '07579d48-279d-4389-9da2-036bf64d41ae' // Dr. Bagattini ID
    };

    console.log('[TEST SYNTHESIS CORRECTED] Attempting corrected insert:', correctedData);

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('evoluciones_clinicas')
      .insert(correctedData)
      .select()
      .single();

    console.log('[TEST SYNTHESIS CORRECTED] Insert result:', { insertResult, insertError });

    if (insertResult?.id) {
      // Limpiar el registro de prueba
      await supabaseAdmin
        .from('evoluciones_clinicas')
        .delete()
        .eq('id', insertResult.id);
      console.log('[TEST SYNTHESIS CORRECTED] Cleaned up test record');
    }

    return NextResponse.json({
      success: !insertError,
      insertResult,
      insertError,
      message: insertError ? 'Insert failed' : 'Insert successful - structure is correct'
    });

  } catch (error) {
    console.error('[TEST SYNTHESIS CORRECTED] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
