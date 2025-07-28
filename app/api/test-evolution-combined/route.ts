import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET() {
  try {
    const testPatientId = '2385677e-cf3e-45e3-8d28-9100afa90a3a';

    console.log('[TEST EVOLUTION COMBINED] Testing combined evolution endpoint logic...');

    // Obtener entradas de la tabla evolucion_clinica (entradas manuales)
    const { data: manualEntries, error: manualError } = await (supabaseAdmin as any)
      .from('evolucion_clinica')
      .select(`
        *,
        users:author_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('paciente_id', testPatientId);

    console.log('[TEST EVOLUTION COMBINED] Manual entries:', { count: manualEntries?.length || 0, error: manualError });

    // Obtener entradas de supervisión de la tabla evoluciones_clinicas
    const { data: supervisionEntries, error: supervisionError } = await (supabaseAdmin as any)
      .from('evoluciones_clinicas')
      .select('*')
      .eq('patient_id', testPatientId)
      .eq('tipo', 'supervision');

    // Obtener información de usuarios para las entradas de supervisión
    let supervisionUsersMap = {};
    if (supervisionEntries && supervisionEntries.length > 0) {
      const userIds = [...new Set(supervisionEntries.map((entry: any) => entry.created_by))];
      const { data: users } = await (supabaseAdmin as any)
        .from('users')
        .select('id, first_name, last_name, email')
        .in('id', userIds);
      
      if (users) {
        supervisionUsersMap = users.reduce((acc: any, user: any) => {
          acc[user.id] = user;
          return acc;
        }, {});
      }
    }

    console.log('[TEST EVOLUTION COMBINED] Supervision entries:', { count: supervisionEntries?.length || 0, error: supervisionError });

    // Combinar y transformar entradas
    const allEntries = [];

    // Añadir entradas manuales
    if (manualEntries) {
      allEntries.push(...manualEntries);
    }

    // Transformar y añadir entradas de supervisión
    if (supervisionEntries) {
      const transformedSupervisionEntries = supervisionEntries.map((entry: any) => {
        const user = (supervisionUsersMap as any)[entry.created_by];
        return {
          id: entry.id,
          paciente_id: entry.patient_id,
          author_id: entry.created_by,
          entry_type: 'supervision',
          content: entry.data?.synthesis || 'Síntesis de supervisión generada por IA',
          metadata: {
            ai_model: entry.data?.ai_model,
            conversation_length: entry.data?.conversation_length,
            synthesis_type: entry.data?.synthesis_type,
            version: entry.version
          },
          tags: ['supervision', 'ia', 'sintesis'],
          is_draft: false,
          created_at: entry.created_at,
          updated_at: entry.updated_at,
          users: user || null
        };
      });
      allEntries.push(...transformedSupervisionEntries);
    }

    // Ordenar por fecha de creación (más reciente primero)
    allEntries.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Formatear respuesta
    const formattedEntries = allEntries.map((entry: any) => ({
      ...entry,
      author_name: entry.users ? `${entry.users.first_name || ''} ${entry.users.last_name || ''}`.trim() : 'Usuario',
      author_email: entry.users?.email,
      users: undefined // Remover el objeto anidado
    }));

    console.log('[TEST EVOLUTION COMBINED] Final result:', { 
      totalEntries: formattedEntries.length,
      manualCount: manualEntries?.length || 0,
      supervisionCount: supervisionEntries?.length || 0
    });

    return NextResponse.json({
      success: true,
      totalEntries: formattedEntries.length,
      manualCount: manualEntries?.length || 0,
      supervisionCount: supervisionEntries?.length || 0,
      entries: formattedEntries,
      manualError,
      supervisionError
    });

  } catch (error) {
    console.error('[TEST EVOLUTION COMBINED] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
