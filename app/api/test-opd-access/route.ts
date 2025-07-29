import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST OPD ACCESS] Verificando acceso a datos detallados del OPD...');

    const patientId = "1"; // ID de prueba
    const messageText = "nombrame todas las dimensiones del opd-ca2-sq y referite a algunas de las afirmaciones específicas";

    // Simular la lógica del endpoint de chat
    const baseUrl = request.url.replace('/api/test-opd-access', '');
    
    const dataResponse = await fetch(`${baseUrl}/api/informes/datos/${patientId}`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || '',
        'Cookie': request.headers.get('Cookie') || ''
      }
    });

    if (!dataResponse.ok) {
      return NextResponse.json({ 
        error: 'No se pudo obtener datos del paciente', 
        status: dataResponse.status 
      }, { status: 500 });
    }

    const patientData = await dataResponse.json();

    // Aplicar la misma lógica de filtrado que en el chat
    const isSpecificQuestionnaire = messageText.includes('opd') || messageText.includes('operacionalizado') || 
                                  messageText.includes('psicodinamico') || messageText.includes('phq') || 
                                  messageText.includes('who') || messageText.includes('dimensiones') ||
                                  messageText.includes('items') || messageText.includes('afirmaciones');

    const processedQuestionnaires = patientData.questionnaires?.map((q: any) => {
      if (isSpecificQuestionnaire && (q.codigo?.toLowerCase().includes('opd') || 
                                    q.titulo?.toLowerCase().includes('opd') ||
                                    q.codigo?.toLowerCase().includes('operacionalizado') ||
                                    q.titulo?.toLowerCase().includes('operacionalizado') ||
                                    q.codigo?.toLowerCase().includes('psicodinamico') ||
                                    q.titulo?.toLowerCase().includes('psicodinamico'))) {
        return {
          codigo: q.codigo,
          titulo: q.titulo,
          puntuacion: q.puntuacion,
          fecha: q.fecha,
          responses: q.responses,
          items: q.items,
          dimensiones: q.dimensiones,
          raw_data_keys: Object.keys(q) // Para ver qué campos están disponibles
        };
      } else {
        return {
          codigo: q.codigo,
          puntuacion: q.puntuacion,
          fecha: q.fecha
        };
      }
    }) || [];

    // Buscar específicamente el OPD
    const opdQuestionnaire = patientData.questionnaires?.find((q: any) => 
      q.codigo?.toLowerCase().includes('opd') ||
      q.titulo?.toLowerCase().includes('opd') ||
      q.codigo?.toLowerCase().includes('operacionalizado') ||
      q.titulo?.toLowerCase().includes('operacionalizado') ||
      q.codigo?.toLowerCase().includes('psicodinamico') ||
      q.titulo?.toLowerCase().includes('psicodinamico')
    );

    return NextResponse.json({
      success: true,
      message: "🔍 TEST ACCESO A DATOS OPD",
      test_message: messageText,
      detection: {
        is_specific_questionnaire: isSpecificQuestionnaire,
        opd_found: !!opdQuestionnaire,
        total_questionnaires: patientData.questionnaires?.length || 0
      },
      opd_data_analysis: opdQuestionnaire ? {
        codigo: opdQuestionnaire.codigo,
        titulo: opdQuestionnaire.titulo,
        puntuacion: opdQuestionnaire.puntuacion,
        has_responses: !!opdQuestionnaire.responses,
        has_items: !!opdQuestionnaire.items,
        has_dimensiones: !!opdQuestionnaire.dimensiones,
        available_fields: Object.keys(opdQuestionnaire),
        responses_sample: opdQuestionnaire.responses ? 
          (Array.isArray(opdQuestionnaire.responses) ? 
            opdQuestionnaire.responses.slice(0, 3) : 
            "Not an array") : null,
        items_sample: opdQuestionnaire.items ? 
          (Array.isArray(opdQuestionnaire.items) ? 
            opdQuestionnaire.items.slice(0, 3) : 
            "Not an array") : null
      } : null,
      processed_questionnaires: processedQuestionnaires,
      recommendation: opdQuestionnaire ? 
        "✅ OPD encontrado - verificar si responses/items/dimensiones contienen datos útiles" :
        "❌ OPD no encontrado - verificar códigos de cuestionarios disponibles"
    });

  } catch (error) {
    console.error('[TEST OPD ACCESS] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error },
      { status: 500 }
    );
  }
}
