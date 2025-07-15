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
    .select('respuestas, puntuacion, creado_en, score_detallado')
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
      // 1) Si ya existe un score_detallado persistido, úsalo directamente
      if (respuesta.score_detallado && typeof respuesta.score_detallado === 'object') {
        score_detallado = respuesta.score_detallado as ScoreDetalladoOpdCa2;
      } else {
        // 2) De lo contrario, intenta reconstruirlo a partir de las respuestas
        const answersArray = Array(81).fill(null);
        if (respuesta.respuestas && typeof respuesta.respuestas === 'object') {
          if (Array.isArray(respuesta.respuestas)) {
            // Caso: respuestas guardadas como array indexado 0-80
            respuesta.respuestas.forEach((val: any, idx: number) => {
              if (idx < 81) answersArray[idx] = typeof val === 'object' && 'valor' in val ? (val as any).valor : val;
            });
          } else {
            // Caso: objeto con claves numéricas o UUIDs
            for (const [key, value] of Object.entries(respuesta.respuestas)) {
              const idx = parseInt(key, 10);
              if (!isNaN(idx) && idx >= 1 && idx <= 81) {
                answersArray[idx - 1] = typeof value === 'object' && 'valor' in value ? (value as any).valor : value as any;
              }
            }
          }
        }
        score_detallado = scoreOpdCa2(answersArray);
      }
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
