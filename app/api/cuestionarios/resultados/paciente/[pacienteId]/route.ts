import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { scoreOpdCa2 } from '@/src/scoring/opdCa2';
import { ResultadoCuestionario, ScoreDetalladoOpdCa2 } from '@/src/types/cuestionarios';

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
  const codigo = url.searchParams.get('codigo');

  // Si no se especifica un código de cuestionario, devolver un error
  if (!codigo) {
    return NextResponse.json({ success: false, message: 'Código de cuestionario no especificado' }, { status: 400 });
  }



  // 1) Obtener ID de cuestionario solicitado
  const { data: cuestionario, error: cuestionarioError } = await supabaseAdmin
    .from('cuestionarios')
    .select('id')
    .eq('codigo', codigo)
    .single();
  if (cuestionarioError || !cuestionario) {
    return NextResponse.json({ error: `Cuestionario ${codigo} no encontrado` }, { status: 404 });
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

  // 3) Procesar respuestas y calcular scores
  const processedData: ResultadoCuestionario[] = respuestasData.map(respuesta => {
    let score_detallado: ScoreDetalladoOpdCa2 | {} = {};

    if (codigo === 'OPD-CA2-SQ') {
      const answersArray = Array(81).fill(null);
      if (respuesta.respuestas && typeof respuesta.respuestas === 'object' && !Array.isArray(respuesta.respuestas)) {
        for (const [key, value] of Object.entries(respuesta.respuestas)) {
          const index = parseInt(key, 10) - 1;
          if (index >= 0 && index < 81) {
            answersArray[index] = value;
          }
        }
      }
      // La función scoreOpdCa2 se encarga de devolver la estructura completa,
      // incluso si no hay respuestas.
      score_detallado = scoreOpdCa2(answersArray);
    } else {
      // Lógica para otros cuestionarios podría ir aquí
    }

    return {
      id: `${pacienteId}-${cuestionarioId}-${respuesta.creado_en}`,
      fecha: respuesta.creado_en,
      codigo_cuestionario: codigo,
      score_total: respuesta.puntuacion,
      score_detallado: score_detallado,
      respuestas: respuesta.respuestas
    };
  });

  return NextResponse.json({ success: true, data: processedData });
}
