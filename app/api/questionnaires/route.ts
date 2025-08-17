import { NextResponse } from 'next/server';
import questionnairesMeta from '@/src/data/questionnairesMeta';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

/**
 * GET /api/questionnaires
 * Returns a list of questionnaires with minimal info required for the UI list.
 * Shape: [{ codigo, nombre, dominio }]
 */
export async function GET() {
  // Fetch active questionnaires from DB (codigo & titulo)
  const { data, error } = await supabaseAdmin
    .from('cuestionarios')
    .select('codigo, titulo')
    .eq('activo', true)
    .order('titulo', { ascending: true });

  if (error) {
    console.error('[questionnaires] Error listing questionnaires:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const response = (data || []).map((q) => ({
    codigo: q.codigo,
    nombre: q.titulo,
    dominio:
      (questionnairesMeta as Record<string, { dominio?: string }>)[q.codigo]
        ?.dominio ?? 'Otro'
  }));

  return NextResponse.json(response);
}
