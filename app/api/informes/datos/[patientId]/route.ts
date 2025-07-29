import { createClient } from '@supabase/supabase-js';
import { NextResponse, NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import questionnairesMeta from '@/src/data/questionnairesMeta';

export const dynamic = 'force-dynamic';

// GET: Obtener datos consolidados para generar informe
export async function GET(request: NextRequest, { params }: any) {
  const { patientId } = await params;
  
  // TEMPORAL: Usar supabaseAdmin directamente para evitar problemas de autenticación
  // TODO: Restaurar autenticación NextAuth cuando esté configurada correctamente
  console.log(`[PATIENT-DATA] 📁 Loading data for patient: ${patientId}`);
  
  const supabase = supabaseAdmin;

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

    // 2. (Entrevista inicial se carga más adelante con estructuración)

    // 3. Obtener respuestas de cuestionarios CON ítems completos
    const { data: responses, error: responsesError } = await supabase
      .from('respuestas')
      .select(`
        *,
        cuestionarios!inner(codigo, titulo, items, descripcion)
      `)
      .eq('paciente_id', patientId)
      .order('creado_en', { ascending: false});

    if (responsesError) {
      console.error('Error fetching questionnaire responses:', responsesError);
    }

    // 4. Obtener evolución clínica
    const { data: evolutionData, error: evolutionError } = await supabase
      .from('evolucion_clinica')
      .select('*')
      .eq('paciente_id', patientId)
      .order('created_at', { ascending: false});
    
    if (evolutionError) {
      console.warn('[PATIENT-DATA] ⚠️ Error obteniendo evolución clínica:', evolutionError);
    }

    // 5. Obtener datos reales del psicólogo desde NextAuth
    const { getToken } = await import('next-auth/jwt');
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    
    let psychologist = {
      id: 'temp-psychologist',
      email: 'temp@example.com',
      first_name: 'Psicólogo',
      last_name: 'Temporal'
    };
    
    // Si hay token, buscar datos reales del usuario
    if (token && token.email) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .eq('email', token.email)
        .single();
      
      if (!userError && user) {
        psychologist = {
          id: user.id,
          email: user.email,
          first_name: user.first_name || 'Psicólogo',
          last_name: user.last_name || ''
        };
        console.log(`[PATIENT-DATA] ✅ Psicólogo encontrado: ${user.first_name} ${user.last_name}`);
      } else {
        console.warn(`[PATIENT-DATA] ⚠️ Usuario no encontrado para email: ${token.email}`);
      }
    } else {
      console.warn('[PATIENT-DATA] ⚠️ No hay token de autenticación');
    }

    // 6. Obtener entrevista inicial
    const { data: intakeData, error: intakeError } = await supabase
      .from('primeras_entrevistas')
      .select('*')
      .eq('paciente_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (intakeError) {
      console.warn('[PATIENT-DATA] ⚠️ Error obteniendo entrevista inicial:', intakeError);
    }

    // Estructurar entrevista inicial si existe
    let structuredIntake = null;
    if (intakeData && intakeData.length > 0) {
      const intake = intakeData[0];
      const { structureIntakeData, createIntakeSummaryFromRaw } = await import('../../../../../utils/structureIntakeData');
      
      structuredIntake = {
        id: intake.id,
        estado: intake.estado,
        fecha_inicio: intake.fecha_inicio,
        fecha_finalizacion: intake.fecha_finalizacion,
        datos_estructurados: structureIntakeData(intake.datos || {}),
        resumen_clinico: createIntakeSummaryFromRaw(intake.datos || {})
      };
      
      console.log('[PATIENT-DATA] ✅ Entrevista inicial estructurada incluida');
    }

    // 7. Procesar y estructurar los datos de cuestionarios
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
        items: response.cuestionarios.items, // Incluir ítems/preguntas del cuestionario
        descripcion: response.cuestionarios.descripcion,
        metadata: meta || null
      };
    }) || [];

    // 7. Consolidar todos los datos
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
        id: psychologist?.id || 'temp-psychologist',
        name: psychologist ? `${psychologist.first_name || ''} ${psychologist.last_name || ''}`.trim() : 'Psicólogo',
        email: psychologist?.email || 'temp@example.com'
      },
      intake: structuredIntake,
      questionnaires: processedQuestionnaires,
      evolucion_clinica: evolutionData?.map(entry => ({
        id: entry.id,
        entry_type: entry.entry_type,
        content: entry.content,
        tags: entry.tags,
        created_at: entry.created_at,
        author_id: entry.author_id,
        metadata: entry.metadata
      })) || [],
      summary: {
        total_questionnaires: processedQuestionnaires.length,
        questionnaire_types: [...new Set(processedQuestionnaires.map(q => q.codigo))],
        has_intake: !!(intakeData && intakeData.length > 0),
        evolution_entries: evolutionData?.length || 0,
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
