import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { scoreOpdCa2 } from '@/src/scoring/opdCa2';
import { scoreBrWai } from '@/src/scoring/scoreBrWai';
import { scorePhq9 } from '@/src/scoring/scorePhq9';
import { scoreGad7 } from '@/src/scoring/scoreGad7';
import { scoreOYS, outcomes, buildFlags, type OYSCode, type Resp } from '@/lib/oys-scoring';
import { ResultadoCuestionario, ScoreDetalladoOpdCa2, ScoreDetalladoBrWai, ScoreDetalladoPhq9, ScoreDetalladoGad7 } from '@/src/types/cuestionarios';

/**
 * Manejo especial para cuestionarios OYS consolidados
 */
async function handleOYSConsolidated(pacienteId: string, codigo: string) {
  // Buscar directamente el cuestionario consolidado
  const { data: cuestionario, error: cuestionarioError } = await supabaseAdmin
    .from('cuestionarios')
    .select('id, codigo, items')
    .eq('codigo', codigo)
    .single();
    
  if (cuestionarioError || !cuestionario) {
    return NextResponse.json({ error: 'Cuestionario OYS consolidado no encontrado' }, { status: 404 });
  }
  
  // Obtener todas las respuestas del cuestionario consolidado
  const { data: respuestasData, error: respuestasError } = await supabaseAdmin
    .from('respuestas')
    .select(`
      respuestas, 
      puntuacion, 
      creado_en,
      enviado_en,
      cuestionario_id
    `)
    .eq('paciente_id', pacienteId)
    .eq('cuestionario_id', cuestionario.id)
    .order('enviado_en', { ascending: true });
    
  if (respuestasError) {
    console.error('Error al obtener respuestas OYS:', respuestasError);
    return NextResponse.json({ error: 'Error al obtener respuestas OYS' }, { status: 500 });
  }
  
  // Procesar cada respuesta del cuestionario consolidado
  const processedData: any[] = [];
  const isPadres = codigo === 'OYS-PADRES-40';
  
  for (const respuesta of respuestasData) {
    // Extraer todas las respuestas (40 ítems)
    const allAnswers = extractAnswersArray(respuesta.respuestas, 40);
    
    // Dividir en PS (ítems 1-20) y F (ítems 21-40)
    const psAnswers = allAnswers.slice(0, 20);
    const fAnswers = allAnswers.slice(20, 40);
    
    // Determinar códigos OYS para scoring
    const psCode = isPadres ? 'OYS-PS-P-SF20' : 'OYS-PS-Y-SF20';
    const fCode = isPadres ? 'OYS-F-P-SF20' : 'OYS-F-Y-SF20';
    
    // Calcular scores usando las funciones OYS
    const psScore = scoreOYS(psCode as OYSCode, psAnswers);
    const fScore = scoreOYS(fCode as OYSCode, fAnswers);
    
    // Calcular flags clínicos
    const flags = buildFlags(psCode as OYSCode, psAnswers, fAnswers);
    
    // Crear objeto de respuestas detalladas
    const respuestasDetalladas: any = {};
    allAnswers.forEach((valor, index) => {
      respuestasDetalladas[index + 1] = valor;
    });
    
    processedData.push({
      id: `${pacienteId}-${codigo}-${respuesta.enviado_en}`,
      fecha: respuesta.enviado_en,
      codigo_cuestionario: codigo,
      score_detallado: {
        problem_severity: {
          total: psScore.total,
          valido: psScore.valido,
          respuestas: psAnswers
        },
        functioning: {
          total: fScore.total,
          valido: fScore.valido,
          respuestas: fAnswers
        },
        flags: flags,
        informante: isPadres ? 'padre_tutor' : 'paciente',
        total_combinado: (psScore.total !== null && fScore.total !== null) ? psScore.total + fScore.total : null
      },
      respuestas: respuestasDetalladas,
      items: cuestionario.items // Incluir ítems del cuestionario para mostrar detalles
    });
  }
  
  return NextResponse.json({ success: true, data: processedData });
}

/**
 * Extrae respuestas como array numérico
 */
function extractAnswersArray(respuestas: any, expectedLength: number): Resp[] {
  const answersArray: Resp[] = Array(expectedLength).fill(null);
  
  if (respuestas && typeof respuestas === 'object') {
    if (Array.isArray(respuestas)) {
      respuestas.forEach((val: any, idx: number) => {
        if (idx < expectedLength) {
          answersArray[idx] = typeof val === 'object' && 'valor' in val ? val.valor : val;
        }
      });
    } else {
      for (const [key, value] of Object.entries(respuestas)) {
        const idx = parseInt(key, 10);
        if (!isNaN(idx) && idx >= 1 && idx <= expectedLength && value !== null) {
          answersArray[idx - 1] = typeof value === 'object' && value && 'valor' in value ? (value as any).valor : value as any;
        }
      }
    }
  }
  
  return answersArray;
}

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

  // Manejo especial para cuestionarios consolidados OYS
  if (codigo === 'OYS-PADRES-40' || codigo === 'OYS-JOVENES-40') {
    return await handleOYSConsolidated(pacienteId, codigo);
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
    let score_detallado: ScoreDetalladoOpdCa2 | ScoreDetalladoBrWai | ScoreDetalladoPhq9 | ScoreDetalladoGad7 | {} = {};

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
              if (!isNaN(idx) && idx >= 1 && idx <= 81 && value !== null) {
                answersArray[idx - 1] = typeof value === 'object' && value && 'valor' in value ? (value as any).valor : value as any;
              }
            }
          }
        }
        score_detallado = scoreOpdCa2(answersArray);
      }
    } else if (codigo === 'BR-WAI') {
      // 1) Si ya existe un score_detallado persistido, úsalo directamente
      if (respuesta.score_detallado && typeof respuesta.score_detallado === 'object') {
        score_detallado = respuesta.score_detallado as ScoreDetalladoBrWai;
      } else {
        // 2) De lo contrario, intenta reconstruirlo a partir de las respuestas
        const answersArray = Array(16).fill(null);
        if (respuesta.respuestas && typeof respuesta.respuestas === 'object') {
          if (Array.isArray(respuesta.respuestas)) {
            // Caso: respuestas guardadas como array indexado 0-15
            respuesta.respuestas.forEach((val: any, idx: number) => {
              if (idx < 16) answersArray[idx] = typeof val === 'object' && 'valor' in val ? (val as any).valor : val;
            });
          } else {
            // Caso: objeto con claves numéricas o UUIDs
            for (const [key, value] of Object.entries(respuesta.respuestas)) {
              const idx = parseInt(key, 10);
              if (!isNaN(idx) && idx >= 1 && idx <= 16 && value !== null) {
                answersArray[idx - 1] = typeof value === 'object' && value && 'valor' in value ? (value as any).valor : value as any;
              }
            }
          }
        }
        score_detallado = scoreBrWai(answersArray);
      }
    } else if (codigo === 'PHQ-9') {
      // 1) Si ya existe un score_detallado persistido, úsalo directamente
      if (respuesta.score_detallado && typeof respuesta.score_detallado === 'object') {
        score_detallado = respuesta.score_detallado as ScoreDetalladoPhq9;
      } else {
        // 2) De lo contrario, intenta reconstruirlo a partir de las respuestas
        const answersArray = Array(9).fill(null); // PHQ-9 tiene 9 ítems principales
        if (respuesta.respuestas && typeof respuesta.respuestas === 'object') {
          if (Array.isArray(respuesta.respuestas)) {
            // Caso: respuestas guardadas como array indexado 0-8
            respuesta.respuestas.forEach((val: any, idx: number) => {
              if (idx < 9) answersArray[idx] = typeof val === 'object' && 'valor' in val ? (val as any).valor : val;
            });
          } else {
            // Caso: objeto con claves numéricas o UUIDs
            for (const [key, value] of Object.entries(respuesta.respuestas)) {
              const idx = parseInt(key, 10);
              if (!isNaN(idx) && idx >= 1 && idx <= 9 && value !== null) {
                answersArray[idx - 1] = typeof value === 'object' && value && 'valor' in value ? (value as any).valor : value as any;
              }
            }
          }
        }
        score_detallado = scorePhq9(answersArray);
      }
    } else if (codigo === 'GAD-7') {
      // 1) Si ya existe un score_detallado persistido, úsalo directamente
      if (respuesta.score_detallado && typeof respuesta.score_detallado === 'object') {
        score_detallado = respuesta.score_detallado as ScoreDetalladoGad7;
      } else {
        // 2) De lo contrario, intenta reconstruirlo a partir de las respuestas
        const answersArray = Array(7).fill(null); // GAD-7 tiene 7 ítems
        if (respuesta.respuestas && typeof respuesta.respuestas === 'object') {
          if (Array.isArray(respuesta.respuestas)) {
            // Caso: respuestas guardadas como array indexado 0-6
            respuesta.respuestas.forEach((val: any, idx: number) => {
              if (idx < 7) answersArray[idx] = typeof val === 'object' && 'valor' in val ? (val as any).valor : val;
            });
          } else {
            // Caso: objeto con claves numéricas o UUIDs
            for (const [key, value] of Object.entries(respuesta.respuestas)) {
              const idx = parseInt(key, 10);
              if (!isNaN(idx) && idx >= 1 && idx <= 7 && value !== null) {
                answersArray[idx - 1] = typeof value === 'object' && value && 'valor' in value ? (value as any).valor : value as any;
              }
            }
          }
        }
        score_detallado = scoreGad7(answersArray);
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
