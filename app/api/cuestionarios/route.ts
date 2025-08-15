import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { type Session } from 'next-auth'; // Import the base Session type
import { authOptions } from '@/app/lib/auth'; // Adjust path if necessary
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { applySortingToApiResponse } from '@/lib/questionnaire-order';

// GET: listar plantillas de cuestionarios activas
export async function GET() {
  // The Session type is globally augmented in app/api/auth/[...nextauth]/route.ts
  const session = await getServerSession(authOptions) as Session;

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // No specific psychologist_id filter for now, assuming all active questionnaires are available to any authenticated psychologist.
  // If questionnaires were psychologist-specific, a filter like .eq('psychologist_id', session.user.id) would be needed.

  // Intentar consulta con 'destinatario', con fallback si la columna no existe
  let data, error;
  try {
    const result = await supabaseAdmin
      .from('cuestionarios')
      .select('id, codigo, titulo, destinatario')
      .eq('activo', true)
      .order('titulo', { ascending: true });
    data = result.data;
    error = result.error;
  } catch (e) {
    const result = await supabaseAdmin
      .from('cuestionarios')
      .select('id, codigo, titulo')
      .eq('activo', true)
      .order('titulo', { ascending: true });
    data = result.data;
    error = result.error;
  }

  if (error && error.message?.includes('does not exist')) {
    // Último intento muy básico
    const result = await supabaseAdmin
      .from('cuestionarios')
      .select('*')
      .eq('activo', true)
      .limit(10);
    data = result.data;
    error = result.error;
  }

  const inferDestinatario = (codigo: string | null | undefined, titulo?: string | null) => {
    const c = (codigo || '').toUpperCase();
    const t = (titulo || '').toUpperCase();
    if (
      c.includes('-P-') || c.endsWith('-P') || c.startsWith('P-') ||
      c.includes('PADRE') || c.includes('PADRES') || c.includes('TUTOR') ||
      t.includes('PADRE') || t.includes('PADRES') || t.includes('TUTOR')
    ) {
      return 'padre_tutor';
    }
    return 'paciente';
  };

  // Transform data to ensure consistent structure (map titulo to nombre for frontend)
  const transformedData = data?.map((item: any) => ({
    id: item.id,
    codigo: item.codigo || '',
    nombre: item.titulo || item.nombre || item.name || 'Cuestionario sin nombre',
    destinatario: item.destinatario || inferDestinatario(item.codigo, item.titulo)
  })) || [];

  if (error) {
    console.error('Error al listar cuestionarios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aplicar ordenamiento específico
  const sortedData = applySortingToApiResponse(transformedData);

  return NextResponse.json(sortedData);
}
