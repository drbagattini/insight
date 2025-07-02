import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { scoreAnswers } from '@/src/scoring';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ pacienteId: string }> }
) {
  const { pacienteId } = await params;
  if (!pacienteId) {
    return NextResponse.json({ error: 'pacienteId no proporcionado' }, { status: 400 });
  }

  // Obtener el código a consultar (query param)
  const url = new URL(request.url);
  const codigoParam = url.searchParams.get('codigo') || 'WHO-5';

  // 1) Obtener ID de cuestionario solicitado
  const { data: cuestionario, error: cuestionarioError } = await supabaseAdmin
    .from('cuestionarios')
    .select('id')
    .eq('codigo', codigoParam)
    .single();
  if (cuestionarioError || !cuestionario) {
    return NextResponse.json({ error: `Cuestionario ${codigoParam} no encontrado` }, { status: 404 });
  }
  const cuestionarioId = cuestionario.id;

  // 2) Obtener todas las respuestas del paciente para el cuestionario solicitado
  const { data: respuestasData, error: respuestasError } = await supabaseAdmin
    .from('respuestas')
    .select('puntuacion, creado_en, score_detallado') // Pedimos el score detallado
    .eq('paciente_id', pacienteId)
    .eq('cuestionario_id', cuestionarioId)
    .order('creado_en', { ascending: true });

  if (respuestasError) {
    console.error('Error al obtener respuestas por paciente:', respuestasError);
    return NextResponse.json({ error: 'Error al obtener respuestas' }, { status: 500 });
  }

  // 3) Simplemente pasamos los datos. El frontend (QuestionnaireChart) ya sabe cómo manejar el score_detallado.
  const processedData = respuestasData.map(respuesta => ({
    puntuacion: respuesta.puntuacion,
    creado_en: respuesta.creado_en,
    score_detallado: respuesta.score_detallado,
  }));

  return NextResponse.json({ success: true, data: processedData });
}
