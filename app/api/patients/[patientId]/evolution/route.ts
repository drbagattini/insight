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
  context: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await context.params;

    // Verificar autenticación con NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

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
      .eq('paciente_id', patientId);

    if (manualError) {
      console.error('Error fetching manual evolution entries:', manualError);
    }

    // Obtener entradas de supervisión de la tabla evoluciones_clinicas
    const { data: supervisionEntries, error: supervisionError } = await (supabaseAdmin as any)
      .from('evoluciones_clinicas')
      .select('*')
      .eq('patient_id', patientId)
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

    if (supervisionError) {
      console.error('Error fetching supervision entries:', supervisionError);
    }

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

    return NextResponse.json(formattedEntries);
  } catch (error) {
    console.error('Error in GET /api/patients/[patientId]/evolution:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// POST - Crear nueva entrada de evolución
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ patientId: string }> }
) {
  try {
    const { patientId } = await context.params;
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
