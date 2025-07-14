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

  // 2) Obtener todas las respuestas del paciente
  const { data: respuestasData, error: respuestasError } = await supabaseAdmin
    .from('respuestas')
    .select('respuestas, puntuacion, creado_en')
    .eq('paciente_id', pacienteId)
    .eq('cuestionario_id', cuestionarioId)
    .order('creado_en', { ascending: true });
  if (respuestasError) {
    console.error('Error al obtener respuestas por paciente:', respuestasError);
    return NextResponse.json({ error: 'Error al obtener respuestas' }, { status: 500 });
  }

  // 3) Procesar respuestas con scoring genérico
  const processedData = respuestasData.map(respuesta => {
    const baseData = {
      puntuacion: respuesta.puntuacion,
      creado_en: respuesta.creado_en
    };

    // Si tenemos un objeto de respuestas, convertirlo en un array y calcular scores detallados
    if (respuesta.respuestas && typeof respuesta.respuestas === 'object' && !Array.isArray(respuesta.respuestas)) {
      // Convertir el objeto de respuestas a un array denso de 81 elementos
      const answersArray = Array(81).fill(null);
      for (const [key, value] of Object.entries(respuesta.respuestas)) {
        const index = parseInt(key, 10) - 1; // Los items están 1-based
        if (index >= 0 && index < 81) {
          answersArray[index] = value;
        }
      }

      const scoreResult = scoreAnswers(codigoParam, answersArray);
      if (scoreResult) {
        return {
          ...baseData,
          score_detallado: scoreResult
        };
      }
    }

    return baseData;
  });

  return NextResponse.json({ success: true, data: processedData });
}
