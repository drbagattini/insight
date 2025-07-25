import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import questionnairesMeta from '@/src/data/questionnairesMeta';

export const dynamic = 'force-dynamic';

// GET: Obtener datos consolidados para generar informe
export async function GET(request: NextRequest, { params }: any) {
  const { patientId } = await params;
  
  // Obtener token de autenticación
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  
  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Crear cliente Supabase
  const supabase = token?.sbAccessToken
    ? createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: { Authorization: `Bearer ${token.sbAccessToken}` }
          }
        }
      )
    : supabaseAdmin;

  try {
    // 1. Obtener datos del paciente
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (patientError || !patient) {
      return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });
    }

    // 2. Obtener datos de la entrevista inicial
    const { data: intakeData, error: intakeError } = await supabase
      .from('primeras_entrevistas')
      .select('*')
      .eq('paciente_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1);

    // 3. Obtener respuestas de cuestionarios
    const { data: responses, error: responsesError } = await supabase
      .from('respuestas')
      .select(`
        *,
        cuestionarios!inner(codigo, titulo)
      `)
      .eq('paciente_id', patientId)
      .order('creado_en', { ascending: false });

    if (responsesError) {
      console.error('Error fetching questionnaire responses:', responsesError);
    }

    // 4. Obtener datos del psicólogo
    const { data: psychologist, error: psychologistError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .eq('id', token.id)
      .single();

    // 5. Procesar y estructurar los datos de cuestionarios
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

    // 6. Consolidar todos los datos
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
        id: psychologist?.id || token.id,
        name: psychologist ? `${psychologist.first_name || ''} ${psychologist.last_name || ''}`.trim() : 'Psicólogo',
        email: psychologist?.email || token.email
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

    return NextResponse.json(consolidatedData);

  } catch (error) {
    console.error('Error consolidating patient data:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' }, 
      { status: 500 }
    );
  }
}
