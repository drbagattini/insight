import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

/**
 * GET /api/patients/[pid]/evolutions/history?tipo=intake
 * Devuelve todas las versiones (draft y final) de las evoluciones de un paciente.
 * Si no se pasa `tipo`, por defecto se filtra por 'intake'.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ patientId: string }> }
) {
  const { patientId } = await context.params;
  
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tipo = searchParams.get('tipo') ?? 'intake';

  // Se podría añadir paginación con range() si la historia puede ser muy larga.
  const { data, error } = await supabaseAdmin
    .from('evoluciones_clinicas')
    .select('*')
    .eq('patient_id', patientId)
    .eq('tipo', tipo)
    .order('version', { ascending: false });

  if (error) {
    console.error('[GET evolutions history]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 200 });
}
