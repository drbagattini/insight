import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

// GET: Listar informes de un paciente
export async function GET(request: NextRequest, { params }: any) {
  const { patientId } = await params;
  
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = token?.sbAccessToken
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token.sbAccessToken}` }
          }
        }
      )
    : supabaseAdmin;

  try {
    const { data: informes, error } = await supabase
      .from('informes_clinicos')
      .select('id, titulo, fecha_generacion, fecha_actualizacion, estado, metadatos')
      .eq('paciente_id', patientId)
      .eq('psicologo_id', token.id)
      .order('fecha_generacion', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: 'Error al obtener informes' }, { status: 500 });
    }

    return NextResponse.json(informes || []);

  } catch (error) {
    console.error('Error in GET /api/informes/paciente/[patientId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST: Crear nuevo informe
export async function POST(request: NextRequest, { params }: any) {
  const { patientId } = await params;
  
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = token?.sbAccessToken
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token.sbAccessToken}` }
          }
        }
      )
    : supabaseAdmin;

  try {
    const { titulo, contenido, estado = 'borrador', metadatos = {} } = await request.json();

    if (!titulo || !contenido) {
      return NextResponse.json(
        { error: 'Título y contenido son requeridos' }, 
        { status: 400 }
      );
    }

    // Verificar que el paciente existe y pertenece al psicólogo
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id')
      .eq('id', patientId)
      .eq('psychologist_id', token.id)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado o no autorizado' }, 
        { status: 404 }
      );
    }

    const { data: nuevoInforme, error: insertError } = await supabase
      .from('informes_clinicos')
      .insert({
        paciente_id: patientId,
        psicologo_id: token.id,
        titulo,
        contenido,
        estado,
        metadatos
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating report:', insertError);
      return NextResponse.json({ error: 'Error al crear informe' }, { status: 500 });
    }

    return NextResponse.json(nuevoInforme, { status: 201 });

  } catch (error) {
    console.error('Error in POST /api/informes/paciente/[patientId]:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
