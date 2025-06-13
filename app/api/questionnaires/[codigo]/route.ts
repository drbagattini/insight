import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import questionnairesMeta from '@/data/questionnaires-meta';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

/**
 * GET /api/questionnaires/[codigo]
 * Returns DB questionnaire row merged with static meta-data (if any).
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { codigo: string } }
) {
  const { codigo } = params;

  // Fetch questionnaire by codigo
  const { data, error, count } = await supabaseAdmin
    .from('cuestionarios')
    .select('*', { count: 'exact', head: false })
    .eq('codigo', codigo)
    .single();

  if (error) {
    console.error(`[questionnaires/${codigo}] Error fetching questionnaire:`, error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json(
      { error: `Questionnaire with code ${codigo} not found` },
      { status: 404 }
    );
  }

  const meta =
    questionnairesMeta[codigo as keyof typeof questionnairesMeta] || null;

  return NextResponse.json({ ...data, meta });
}
