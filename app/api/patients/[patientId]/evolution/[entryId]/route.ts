import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { Database } from '@/types_db';

// Cliente Supabase admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false }
  }
);

// DELETE - Eliminar entrada de evolución
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ patientId: string; entryId: string }> }
) {
  try {
    const params = await context.params;
    const { patientId, entryId } = params;

    // Verificar autenticación con NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar la entrada en ambas tablas (evolucion_clinica y evoluciones_clinicas)
    let entry = null;
    let isSupervisionEntry = false;

    // Primero buscar en evolucion_clinica (entradas manuales)
    const { data: manualEntry, error: manualFetchError } = await (supabaseAdmin as any)
      .from('evolucion_clinica')
      .select('id, author_id, paciente_id')
      .eq('id', entryId)
      .eq('paciente_id', patientId)
      .single();

    if (manualEntry && !manualFetchError) {
      entry = manualEntry;
    } else {
      // Si no se encuentra, buscar en evoluciones_clinicas (síntesis de supervisión)
      const { data: supervisionEntry, error: supervisionFetchError } = await (supabaseAdmin as any)
        .from('evoluciones_clinicas')
        .select('id, created_by, patient_id')
        .eq('id', entryId)
        .eq('patient_id', patientId)
        .single();

      if (supervisionEntry && !supervisionFetchError) {
        entry = {
          id: supervisionEntry.id,
          author_id: supervisionEntry.created_by,
          paciente_id: supervisionEntry.patient_id
        };
        isSupervisionEntry = true;
      }
    }

    if (!entry) {
      return NextResponse.json({ error: 'Entrada no encontrada' }, { status: 404 });
    }

    // Verificar que el usuario es el autor o el dueño del paciente
    if (entry.author_id !== session.user.id) {
      // Verificar si es el dueño del paciente
      const { data: patient } = await supabaseAdmin
        .from('patients')
        .select('psychologist_id')
        .eq('id', patientId)
        .single();

      if (!patient || patient.psychologist_id !== session.user.id) {
        return NextResponse.json({ error: 'No autorizado para eliminar esta entrada' }, { status: 403 });
      }
    }

    // Eliminar entrada de la tabla correspondiente
    const tableName = isSupervisionEntry ? 'evoluciones_clinicas' : 'evolucion_clinica';
    const { error: deleteError } = await (supabaseAdmin as any)
      .from(tableName)
      .delete()
      .eq('id', entryId);

    if (deleteError) {
      console.error('Error deleting evolution entry:', deleteError);
      return NextResponse.json({ error: 'Error al eliminar la entrada' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Entrada eliminada exitosamente' });
  } catch (error) {
    console.error('Error in DELETE /api/patients/[patientId]/evolution/[entryId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PUT - Actualizar entrada de evolución
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ patientId: string; entryId: string }> }
) {
  try {
    const params = await context.params;
    const { patientId, entryId } = params;

    // Verificar autenticación con NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { entry_type, content, metadata, isDraft } = body;

    // Verificar que la entrada existe y pertenece al usuario (solo entradas manuales son editables)
    const { data: entry, error: fetchError } = await (supabaseAdmin as any)
      .from('evolucion_clinica')
      .select('id, author_id, paciente_id')
      .eq('id', entryId)
      .eq('paciente_id', patientId)
      .single();

    if (fetchError || !entry) {
      return NextResponse.json({ error: 'Entrada no encontrada o no editable' }, { status: 404 });
    }

    // Solo el autor puede editar
    if (entry.author_id !== session.user.id) {
      return NextResponse.json({ error: 'Sin permisos para editar esta entrada' }, { status: 403 });
    }

    // Actualizar entrada
    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (entry_type !== undefined) updateData.entry_type = entry_type;
    if (metadata !== undefined) updateData.metadata = metadata;
    if (isDraft !== undefined) updateData.is_draft = isDraft;

    const { data: updatedEntry, error: updateError } = await (supabaseAdmin as any)
      .from('evolucion_clinica')
      .update(updateData)
      .eq('id', entryId)
      .select(`
        *,
        users:author_id (
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating evolution entry:', updateError);
      return NextResponse.json({ error: 'Error al actualizar la entrada' }, { status: 500 });
    }

    // Formatear respuesta
    const formattedEntry = {
      ...updatedEntry,
      author_name: updatedEntry.users ? `${updatedEntry.users.first_name || ''} ${updatedEntry.users.last_name || ''}`.trim() : 'Usuario',
      author_email: updatedEntry.users?.email,
      users: undefined
    };

    return NextResponse.json(formattedEntry);
  } catch (error) {
    console.error('Error in PUT /api/patients/[patientId]/evolution/[entryId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
