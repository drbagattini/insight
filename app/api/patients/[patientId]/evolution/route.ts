import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { Database } from '@/types_db';
import { validateEvolutionEntry } from '@/lib/validations/evolucion-clinica';
import { ZodError } from 'zod';

// Cliente Supabase admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: { persistSession: false, autoRefreshToken: false }
  }
);

// GET - Obtener todas las entradas de evolución de un paciente
export async function GET(
  request: NextRequest,
  context: { params: { patientId: string } }
) {
  try {
    const { patientId } = context.params;

    // Verificar autenticación con NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener entradas con información del autor
    const { data: entries, error } = await (supabaseAdmin as any)
      .from('evolucion_clinica')
      .select(`
        *,
        users:author_id (
          first_name,
          last_name,
          email
        )
      `)
      .eq('paciente_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching evolution entries:', error);
      return NextResponse.json({ error: 'Error al obtener las entradas' }, { status: 500 });
    }

    // Formatear respuesta
    const formattedEntries = entries.map((entry: any) => ({
      ...entry,
      author_name: entry.users ? `${entry.users.first_name || ''} ${entry.users.last_name || ''}`.trim() : 'Usuario',
      author_email: entry.users?.email,
      users: undefined // Remover el objeto anidado
    }));

    return NextResponse.json(formattedEntries);
  } catch (error) {
    console.error('Error in GET /api/patients/[patientId]/evolution:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva entrada de evolución
export async function POST(
  request: NextRequest,
  context: { params: { patientId: string } }
) {
  try {
    const { patientId } = context.params;
    const body = await request.json();



    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Validar entrada con Zod
    let validatedData;
    try {
      validatedData = validateEvolutionEntry({
        entry_type: body.entry_type,
        content: body.content,
        tags: body.tags || [],
        metadata: body.metadata || {}
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { 
            error: 'Datos de entrada inválidos',
            details: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { entry_type, content, tags, metadata } = validatedData;
    const author_id = body.author_id || session.user.id;
    const is_draft = body.isDraft || false;



    // Crear nueva entrada
    const { data: newEntry, error } = await (supabaseAdmin as any)
      .from('evolucion_clinica')
      .insert({
        paciente_id: patientId,
        author_id: session.user.id,
        entry_type,
        content,
        metadata,
        tags,
        is_draft
      })
      .select(`
        *,
        users:author_id (
          first_name,
          last_name,
          email
        )
      `)
      .single();

    if (error) {
      console.error('Error creating evolution entry:', error);
      return NextResponse.json({ error: 'Error al crear la entrada' }, { status: 500 });
    }

    // Formatear respuesta
    const formattedEntry = {
      ...newEntry,
      author_name: newEntry.users ? `${newEntry.users.first_name || ''} ${newEntry.users.last_name || ''}`.trim() : 'Usuario',
      author_email: newEntry.users?.email,
      users: undefined
    };

    return NextResponse.json(formattedEntry, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/patients/[patientId]/evolution:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
