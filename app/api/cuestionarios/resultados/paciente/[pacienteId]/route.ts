import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';

export async function GET(
  request: Request,
  { params }: { params: { pacienteId: string } }
) {
  const pacienteId = params.pacienteId;
  if (!pacienteId) {
    return NextResponse.json({ error: 'pacienteId no proporcionado' }, { status: 400 });
  }

  // 1) Obtener ID de cuestionario WHO-5
  const { data: cuestionario, error: cuestionarioError } = await supabaseAdmin
    .from('cuestionarios')
    .select('id')
    .eq('codigo', 'WHO-5')
    .single();
  if (cuestionarioError || !cuestionario) {
    return NextResponse.json({ error: 'Cuestionario WHO-5 no encontrado' }, { status: 404 });
  }
  const cuestionarioId = cuestionario.id;

  // 2) Obtener todas las respuestas del paciente
  const { data: respuestasData, error: respuestasError } = await supabaseAdmin
    .from('respuestas')
    .select('puntuacion, creado_en')
    .eq('paciente_id', pacienteId)
    .eq('cuestionario_id', cuestionarioId)
    .order('creado_en', { ascending: true });
  if (respuestasError) {
    console.error('Error al obtener respuestas por paciente:', respuestasError);
    return NextResponse.json({ error: 'Error al obtener respuestas' }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: respuestasData });
}
