import { NextResponse, NextRequest } from 'next/server';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import questionnairesMeta from '@/src/data/questionnairesMeta';

export const dynamic = 'force-dynamic';

// ENDPOINT DE PRUEBA: Obtener datos consolidados SIN autenticación (solo para testing)
export async function GET(request: NextRequest, { params }: any) {
  const { patientId } = await params;
  
  console.log(`[TEST-PATIENT-DATA] 🚀 Testing patient data for ID: ${patientId}`);

  try {
    // 1. Obtener datos del paciente
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      console.error('[TEST-PATIENT-DATA] ❌ Patient error:', patientError);
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    console.log(`[TEST-PATIENT-DATA] ✅ Patient found: ${patient.name}`);

    // 2. Obtener datos de la entrevista inicial
    const { data: intakeData, error: intakeError } = await supabaseAdmin
      .from('primeras_entrevistas')
      .select('*')
      .eq('paciente_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (intakeError) {
      console.error('[TEST-PATIENT-DATA] ⚠️ Intake error:', intakeError);
    } else {
      console.log(`[TEST-PATIENT-DATA] ✅ Intake data: ${intakeData?.length || 0} records`);
    }

    // 3. Obtener respuestas de cuestionarios
    const { data: responses, error: responsesError } = await supabaseAdmin
      .from('respuestas')
      .select(`
        *,
        cuestionarios!inner(codigo, titulo)
      `)
      .eq('paciente_id', patientId)
      .order('creado_en', { ascending: false });

    if (responsesError) {
      console.error('[TEST-PATIENT-DATA] ❌ Responses error:', responsesError);
      return NextResponse.json({ error: 'Error obteniendo respuestas' }, { status: 500 });
    }

    console.log(`[TEST-PATIENT-DATA] ✅ Responses found: ${responses?.length || 0}`);

    // 4. Procesar y estructurar los datos de cuestionarios
    const processedQuestionnaires = responses?.map(response => {
      const questionnaireCode = response.cuestionarios.codigo;
      const meta = questionnairesMeta[questionnaireCode as keyof typeof questionnairesMeta];
      
      return {
        id: response.id,
        codigo: questionnaireCode,
        titulo: response.cuestionarios.titulo,
        fecha_completado: response.creado_en,
        puntuacion: response.puntuacion,
        score_detallado: response.score_detallado,
        respuestas: response.respuestas,
        metadata: meta || null
      };
    }) || [];

    console.log(`[TEST-PATIENT-DATA] ✅ Processed questionnaires: ${processedQuestionnaires.length}`);

    // 5. Consolidar todos los datos
    const consolidatedData = {
      patient: {
        id: patient.id,
        name: patient.name,
        email: patient.email,
        whatsapp: patient.whatsapp,
        created_at: patient.created_at,
        metadata: patient.metadata
      },
      psychologist: {
        id: 'test-psychologist',
        name: 'Test Psychologist',
        email: 'test@example.com'
      },
      intake: intakeData && intakeData.length > 0 ? {
        id: intakeData[0].id,
        estado: intakeData[0].estado,
        datos: intakeData[0].datos,
        fecha_inicio: intakeData[0].fecha_inicio,
        fecha_fin: intakeData[0].fecha_fin,
        created_at: intakeData[0].created_at
      } : null,
      questionnaires: processedQuestionnaires,
      summary: {
        total_questionnaires: processedQuestionnaires.length,
        questionnaire_types: [...new Set(processedQuestionnaires.map(q => q.codigo))],
        has_intake: !!(intakeData && intakeData.length > 0),
        date_range: {
          earliest: responses && responses.length > 0 
            ? responses[responses.length - 1].creado_en 
            : null,
          latest: responses && responses.length > 0 
            ? responses[0].creado_en 
            : null
        }
      }
    };

    console.log(`[TEST-PATIENT-DATA] ✅ Consolidated data ready`);

    return NextResponse.json(consolidatedData);

  } catch (error) {
    console.error('[TEST-PATIENT-DATA] ❌ General error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    );
  }
}
