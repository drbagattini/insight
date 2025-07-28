import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  try {
    // Verificar autenticación
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    console.log('[TEST SYNTHESIS DB] Session user:', session.user.id);

    // Test patientId (Pedro)
    const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

    // 1. Verificar si la tabla existe y qué estructura tiene
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('evoluciones_clinicas')
      .select('*')
      .limit(1);

    console.log('[TEST SYNTHESIS DB] Table check:', { tableInfo, tableError });

    // 2. Verificar versiones existentes para este paciente
    const { data: existingVersions, error: versionError } = await supabaseAdmin
      .from('evoluciones_clinicas')
      .select('version, tipo, status')
      .eq('patient_id', testPatientId)
      .eq('tipo', 'supervision')
      .order('version', { ascending: false });

    console.log('[TEST SYNTHESIS DB] Existing versions:', { existingVersions, versionError });

    // 3. Intentar insertar un registro de prueba
    const testData = {
      patient_id: testPatientId,
      tipo: 'supervision',
      version: 1,
      schema_version: 1,
      status: 'final',
      urgente: false,
      data: {
        synthesis: 'Test synthesis content',
        test: true,
        generated_at: new Date().toISOString()
      },
      created_by: session.user.id,
      contenido: 'Test synthesis content'
    };

    console.log('[TEST SYNTHESIS DB] Attempting insert with data:', testData);

    const { data: insertResult, error: insertError } = await supabaseAdmin
      .from('evoluciones_clinicas')
      .insert(testData)
      .select()
      .single();

    console.log('[TEST SYNTHESIS DB] Insert result:', { insertResult, insertError });

    if (insertError) {
      return NextResponse.json({
        error: 'Error en inserción',
        details: insertError,
        testData,
        tableExists: !tableError,
        existingVersions
      }, { status: 500 });
    }

    // 4. Limpiar el registro de prueba
    if (insertResult?.id) {
      await supabaseAdmin
        .from('evoluciones_clinicas')
        .delete()
        .eq('id', insertResult.id);
    }

    return NextResponse.json({
      success: true,
      message: 'Test de inserción exitoso',
      insertResult,
      existingVersions,
      tableExists: !tableError
    });

  } catch (error) {
    console.error('[TEST SYNTHESIS DB] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
