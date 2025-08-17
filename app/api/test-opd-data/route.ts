import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Endpoint temporal para debuggear datos del OPD-CA2-SQ sin autenticación
export async function POST(request: NextRequest) {
  try {
    const { pacienteId } = await request.json();
    
    if (!pacienteId) {
      return NextResponse.json(
        { error: 'ID del paciente es requerido' }, 
        { status: 400 }
      );
    }

    // Crear cliente de Supabase con service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener datos del paciente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', pacienteId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json(
        { error: 'Paciente no encontrado' }, 
        { status: 404 }
      );
    }

    // Obtener respuestas de cuestionarios
    const { data: responses, error: responsesError } = await supabase
      .from('respuestas')
      .select(`
        id,
        respuestas,
        puntuacion,
        score_detallado,
        creado_en,
        cuestionarios!inner(
          id,
          codigo,
          titulo,
          descripcion
        )
      `)
      .eq('paciente_id', pacienteId)
      .order('creado_en', { ascending: false });

    if (responsesError) {
      return NextResponse.json(
        { error: `Error obteniendo respuestas: ${responsesError.message}` }, 
        { status: 500 }
      );
    }

    // Procesar respuestas como lo hace el endpoint real
    const processedQuestionnaires = (responses || []).map((response: any) => {
      const cuestionario = Array.isArray(response.cuestionarios)
        ? response.cuestionarios[0]
        : response.cuestionarios;
      return {
        id: response.id,
        codigo: cuestionario?.codigo,
        titulo: cuestionario?.titulo,
        descripcion: cuestionario?.descripcion,
        fecha_completado: response.creado_en,
        respuestas: response.respuestas,
        puntuacion: response.puntuacion,
        score_detallado: response.score_detallado,
        metadata: {
          total_items: response.respuestas ? Object.keys(response.respuestas).length : 0,
          completed: !!response.creado_en,
          has_detailed_score: !!response.score_detallado
        }
      };
    });

    // Filtrar específicamente OPD-CA2-SQ
    const opdCa2Responses = processedQuestionnaires.filter(
      q => q.codigo === 'OPD-CA2-SQ'
    );

    const debugInfo = {
      patient_id: pacienteId,
      patient_name: patient.name,
      total_questionnaires: processedQuestionnaires.length,
      questionnaire_types: [...new Set(processedQuestionnaires.map(q => q.codigo))],
      opd_ca2_responses_count: opdCa2Responses.length,
      opd_ca2_details: opdCa2Responses.map(q => ({
        id: q.id,
        fecha_completado: q.fecha_completado,
        total_respuestas: q.metadata.total_items,
        puntuacion: q.puntuacion,
        has_detailed_score: q.metadata.has_detailed_score,
        score_detallado_keys: q.score_detallado ? Object.keys(q.score_detallado) : [],
        sample_responses: q.respuestas ? 
          Object.entries(q.respuestas).slice(0, 5).reduce((acc: any, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {}) : {},
        sample_score_detail: q.score_detallado ? {
          total: q.score_detallado.total,
          control: q.score_detallado.control,
          identity: q.score_detallado.identity,
          attachment: q.score_detallado.attachment
        } : null
      })),
      all_questionnaires_summary: processedQuestionnaires.map(q => ({
        codigo: q.codigo,
        titulo: q.titulo,
        fecha: q.fecha_completado,
        respuestas_count: q.metadata.total_items,
        has_score: !!q.puntuacion,
        has_detailed_score: q.metadata.has_detailed_score
      }))
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Error in test endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
