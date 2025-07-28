import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  try {
    console.log('[TEST INSERT MINIMAL] Starting minimal insert test...');

    // Test con datos mínimos
    const minimalData = {
      patient_id: '2385677e-cf3e-45e3-8d28-9100afa90a3a',
      tipo: 'supervision',
      version: 1,
      contenido: 'Test synthesis content'
    };

    console.log('[TEST INSERT MINIMAL] Attempting minimal insert:', minimalData);

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('evoluciones_clinicas')
      .insert(minimalData)
      .select()
      .single();

    console.log('[TEST INSERT MINIMAL] Minimal insert result:', { insertResult, insertError });

    if (insertError) {
      console.log('[TEST INSERT MINIMAL] Error details:', insertError);
      
      // Intentar con más campos
      const extendedData = {
        patient_id: '2385677e-cf3e-45e3-8d28-9100afa90a3a',
        tipo: 'supervision',
        version: 1,
        schema_version: 1,
        status: 'final',
        urgente: false,
        contenido: 'Test synthesis content',
        created_by: '07579d48-279d-4389-9da2-036bf64d41ae' // Dr. Bagattini ID
      };

      console.log('[TEST INSERT MINIMAL] Attempting extended insert:', extendedData);

      const { data: extendedResult, error: extendedError } = await supabaseAdmin
        .from('evoluciones_clinicas')
        .insert(extendedData)
        .select()
        .single();

      console.log('[TEST INSERT MINIMAL] Extended insert result:', { extendedResult, extendedError });

      if (extendedResult?.id) {
        // Limpiar
        await supabaseAdmin
          .from('evoluciones_clinicas')
          .delete()
          .eq('id', extendedResult.id);
        console.log('[TEST INSERT MINIMAL] Cleaned up test record');
      }

      return NextResponse.json({
        minimalError: insertError,
        extendedResult,
        extendedError,
        success: !extendedError
      });
    }

    // Limpiar si el minimal funcionó
    if (insertResult?.id) {
      await supabaseAdmin
        .from('evoluciones_clinicas')
        .delete()
        .eq('id', insertResult.id);
      console.log('[TEST INSERT MINIMAL] Cleaned up minimal test record');
    }

    return NextResponse.json({
      success: true,
      insertResult,
      message: 'Minimal insert worked'
    });

  } catch (error) {
    console.error('[TEST INSERT MINIMAL] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
