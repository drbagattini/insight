import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { type Session } from 'next-auth'; // Import the base Session type
import { authOptions } from '@/app/lib/auth'; // Adjust path if necessary
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

// GET: listar plantillas de cuestionarios activas
export async function GET() {
  // The Session type is globally augmented in app/api/auth/[...nextauth]/route.ts
  const session = await getServerSession(authOptions) as Session;

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // No specific psychologist_id filter for now, assuming all active questionnaires are available to any authenticated psychologist.
  // If questionnaires were psychologist-specific, a filter like .eq('psychologist_id', session.user.id) would be needed.

  const { data, error } = await supabaseAdmin
    .from('cuestionarios')
    .select('id, codigo, nombre:titulo') // Select titulo and alias as nombre to match frontend QuestionnaireType
    .eq('activo', true)
    .order('titulo', { ascending: true });

  if (error) {
    console.error('Error al listar cuestionarios:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
