import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/auth';

// GET - Obtener alertas clínicas de un paciente
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get('paciente_id');
    const activas = searchParams.get('activas') === 'true';
    const tipo = searchParams.get('tipo');

    // Verificar si la tabla existe primero
    const { data: tableCheck, error: tableError } = await supabaseAdmin
      .from('alertas_clinicas')
      .select('id')
      .limit(1);

    if (tableError && tableError.code === '42P01') {
      // Tabla no existe, devolver array vacío
      console.log('Tabla alertas_clinicas no existe aún');
      return NextResponse.json({ alertas: [] });
    }

    let query = supabaseAdmin
      .from('alertas_clinicas')
      .select(`
        id,
        paciente_id,
        respuesta_id,
        tipo,
        severidad,
        mensaje,
        evidencia,
        recomendaciones,
        activa,
        revisada,
        revisada_por,
        fecha_revision,
        notas_revision,
        fecha_creacion,
        fecha_actualizacion,
        patients!inner(
          id,
          nombre,
          user_id
        )
      `)
      .eq('patients.user_id', session.user.id);

    // Filtros opcionales
    if (pacienteId) {
      query = query.eq('paciente_id', pacienteId);
    }

    if (activas) {
      query = query.eq('activa', true);
    }

    if (tipo) {
      query = query.eq('tipo', tipo);
    }

    // Ordenar por fecha de creación descendente
    query = query.order('fecha_creacion', { ascending: false });

    const { data: alertas, error } = await query;

    if (error) {
      console.error('Error fetching alertas:', error);
      return NextResponse.json({ error: 'Error al obtener alertas' }, { status: 500 });
    }

    return NextResponse.json({ alertas });

  } catch (error) {
    console.error('Error en GET /api/alertas-clinicas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// PATCH - Actualizar estado de una alerta (marcar como revisada, desactivar, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, activa, revisada, notas_revision } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de alerta requerido' }, { status: 400 });
    }

    // Verificar que la alerta pertenece a un paciente del usuario
    const { data: alerta, error: fetchError } = await supabaseAdmin
      .from('alertas_clinicas')
      .select(`
        id,
        paciente_id,
        patients!inner(user_id)
      `)
      .eq('id', id)
      .eq('patients.user_id', session.user.id)
      .single();

    if (fetchError || !alerta) {
      return NextResponse.json({ error: 'Alerta no encontrada' }, { status: 404 });
    }

    // Preparar datos de actualización
    const updateData: any = {};

    if (typeof activa === 'boolean') {
      updateData.activa = activa;
    }

    if (typeof revisada === 'boolean') {
      updateData.revisada = revisada;
      if (revisada) {
        updateData.revisada_por = session.user.id;
        updateData.fecha_revision = new Date().toISOString();
      }
    }

    if (notas_revision !== undefined) {
      updateData.notas_revision = notas_revision;
    }

    // Actualizar la alerta
    const { error: updateError } = await supabaseAdmin
      .from('alertas_clinicas')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('Error updating alerta:', updateError);
      return NextResponse.json({ error: 'Error al actualizar alerta' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Alerta actualizada correctamente' });

  } catch (error) {
    console.error('Error en PATCH /api/alertas-clinicas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
