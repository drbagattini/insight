import { NextResponse, NextRequest } from 'next/server';

// Endpoint para debuggear qué datos se están enviando a la IA
export async function POST(request: NextRequest) {
  try {
    const { pacienteId } = await request.json();
    
    if (!pacienteId) {
      return NextResponse.json(
        { error: 'ID del paciente es requerido' }, 
        { status: 400 }
      );
    }

    // Obtener los mismos datos que se envían a la IA
    const baseUrl = request.url.replace('/api/informes/debug-data', '');
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${pacienteId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!dataResponse.ok) {
      const errorData = await dataResponse.json();
      return NextResponse.json(
        { error: `Error obteniendo datos: ${errorData.error}` }, 
        { status: dataResponse.status }
      );
    }

    const patientData = await dataResponse.json();
    
    // Filtrar específicamente datos del OPD-CA2-SQ
    const opdCa2Data = patientData.questionnaires?.filter(
      (q: any) => q.codigo === 'OPD-CA2-SQ'
    ) || [];

    const debugInfo = {
      patient_id: pacienteId,
      total_questionnaires: patientData.questionnaires?.length || 0,
      questionnaire_types: patientData.summary?.questionnaire_types || [],
      opd_ca2_responses: opdCa2Data.length,
      opd_ca2_details: opdCa2Data.map((q: any) => ({
        id: q.id,
        fecha_completado: q.fecha_completado,
        total_respuestas: q.respuestas ? Object.keys(q.respuestas).length : 0,
        puntuacion: q.puntuacion,
        score_detallado_keys: q.score_detallado ? Object.keys(q.score_detallado) : [],
        primeras_5_respuestas: q.respuestas ? 
          Object.entries(q.respuestas).slice(0, 5).reduce((acc: any, [key, value]) => {
            acc[key] = value;
            return acc;
          }, {}) : {},
        metadata_disponible: !!q.metadata
      })),
      full_data_sample: {
        patient: patientData.patient,
        questionnaires_summary: patientData.questionnaires?.map((q: any) => ({
          codigo: q.codigo,
          titulo: q.titulo,
          fecha: q.fecha_completado,
          respuestas_count: q.respuestas ? Object.keys(q.respuestas).length : 0
        })) || []
      }
    };

    return NextResponse.json(debugInfo);

  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
