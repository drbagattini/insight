import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET: Obtener la entrevista inicial de un paciente
export async function GET(request: NextRequest, { params }: any) {
  console.log('[DEBUG] GET intake - Using updated awaited params code');
  const { patientId } = await params;
  console.log(`[DEBUG] GET intake - Successfully awaited patientId: ${patientId}`);
  // Obtenemos el token JWT de NextAuth que contiene sbAccessToken
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

  // Si no hay token, retornar 401
  if (!token) {
    console.error('No se encontró token de NextAuth o sbAccessToken en GET', { tokenExists: !!token });
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Crear cliente Supabase usando el token de Supabase si está presente; de lo contrario, usa supabaseAdmin (rol de servicio)
  const supabase = token?.sbAccessToken ?
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token.sbAccessToken}`
          }
        }
      }
    ) : supabaseAdmin;

  try {
    // Se obtienen todas las entrevistas para el paciente, ordenadas por fecha de creación descendente.
    const { data: intakeList, error } = await supabase
      .from('primeras_entrevistas')
      .select('*')
      .eq('paciente_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      // Este error es de la consulta en sí, no de si se encontraron datos o no.
      console.error('Error fetching intake list:', error);
      return NextResponse.json({ error: 'Error al consultar la base de datos: ' + error.message }, { status: 500 });
    }
    
    // Si la lista de entrevistas no está vacía, se toma la primera (la más reciente).
    // Si está vacía, intakeData será null, lo que llevará a un 404.
    const intakeData = intakeList && intakeList.length > 0 ? intakeList[0] : null;

    if (!intakeData) {
      return NextResponse.json({}, { status: 404 }); // No se encontró ninguna entrevista para este paciente.
    }

    return NextResponse.json(intakeData);
  } catch (error) {
    console.error('An unexpected error occurred in GET /api/patients/.../intake:', error);
    return NextResponse.json({ error: 'Ocurrió un error inesperado en el servidor.' }, { status: 500 });
  }
}

// POST: Crear una nueva entrevista inicial
export async function POST(request: NextRequest, { params }: any) {
  const { patientId } = await params;
  // Obtenemos el token JWT de NextAuth que contiene sbAccessToken
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  // Si no hay token, retornar 401
  if (!token) {
    console.error('No se encontró token de NextAuth o sbAccessToken', { token });
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  // Crear cliente Supabase usando el token de Supabase almacenado en el JWT de NextAuth
  const supabase = token?.sbAccessToken
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token.sbAccessToken}` }
          }
        }
      )
    : supabaseAdmin;

  try {
    // Ya tenemos una sesión autenticada mediante el token

    const psicologo_id = token.id as string;

    const { data: newIntake, error } = await supabase
      .from('primeras_entrevistas')
      .insert({
        paciente_id: patientId,
        psicologo_id: psicologo_id,
        estado: 'empezada',
        fecha_inicio: new Date().toISOString(),
        datos: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating new intake:', error);
      return NextResponse.json({ error: 'Error al crear la entrevista: ' + error.message }, { status: 500 });
    }

    return NextResponse.json(newIntake, { status: 201 });
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'Ocurrió un error inesperado.' }, { status: 500 });
  }
}

// PATCH: Actualizar una entrevista existente (autoguardado o finalización)
export async function PATCH(request: NextRequest, { params }: any) {
  const { patientId } = await params;
  // Obtenemos el token JWT de NextAuth que contiene sbAccessToken
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const updateData = await request.json();
  
  // Si no hay token, retornar 401
  if (!token) {
    console.error('No se encontró token de NextAuth o sbAccessToken', { token });
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  
  // Crear cliente Supabase usando el token de Supabase almacenado en el JWT de NextAuth
  const supabase = token?.sbAccessToken
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token.sbAccessToken}` }
          }
        }
      )
    : supabaseAdmin;

  try {

    // Buscamos la entrevista más reciente para este paciente
    const { data: existingIntake, error: findError } = await supabase
        .from('primeras_entrevistas')
        .select('id')
        .eq('paciente_id', patientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (findError || !existingIntake) {
        return NextResponse.json({ error: 'No se encontró una entrevista para actualizar.' }, { status: 404 });
    }

    // Si se está finalizando la entrevista, actualizamos la fecha_fin
    if (updateData.estado === 'finalizada' && !updateData.fecha_fin) {
      updateData.fecha_fin = new Date().toISOString();
    }

    const { data: updatedIntake, error: updateError } = await supabase
      .from('primeras_entrevistas')
      .update(updateData)
      .eq('id', existingIntake.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating intake:', updateError);
      return NextResponse.json({ error: 'Error al actualizar la entrevista: ' + updateError.message }, { status: 500 });
    }

    return NextResponse.json(updatedIntake);
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    return NextResponse.json({ error: 'Ocurrió un error inesperado.' }, { status: 500 });
  }
}
