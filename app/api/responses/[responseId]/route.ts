import { createClient } from '@supabase/supabase-js';
import { supabaseAdmin } from '@/app/lib/supabaseAdmin';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/lib/auth';
import type { Session as NextAuthSession } from 'next-auth';
import { NextResponse, NextRequest } from 'next/server'; // Import NextRequest
import type { Database } from '@/types/supabase';
import type { ResponseDetail, ResponseItemDetail } from '@/types/patient-responses';

export const dynamic = 'force-dynamic';

interface CustomSession extends NextAuthSession { 
  sbAccessToken?: string;
  sbRefreshToken?: string;
}

interface RouteHandlerParams {
  responseId: string;
}

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<RouteHandlerParams> }
) {
  const { responseId } = await paramsPromise;
  if (!responseId) {
    return NextResponse.json({ error: 'Response ID is required' }, { status: 400 });
  }

  const nextAuthSession = await getServerSession(authOptions) as CustomSession | null;

  if (!nextAuthSession) {
    console.log('[API /responses/[responseId]] No NextAuth session found.');
    return NextResponse.json({ error: 'Unauthorized: No NextAuth session' }, { status: 401 });
  }

  if (!nextAuthSession.user || !nextAuthSession.user.id) { 
    console.log('[API /responses/[responseId]] NextAuth session found, but user or user ID is missing.');
    return NextResponse.json({ error: 'Unauthorized: User or User ID missing in NextAuth session' }, { status: 401 });
  }
  const psychologistId = nextAuthSession.user.id; 
  console.log('[API /responses/[responseId]] NextAuth session found. User ID (Psychologist ID):', psychologistId);

  const supabaseAccessToken = nextAuthSession.sbAccessToken;

  let supabase;
  if (!supabaseAccessToken) {
    console.warn('[API /responses/[responseId]] sbAccessToken missing; falling back to supabaseAdmin (service role) for read-only access.');
    supabase = supabaseAdmin;
  } else {
    console.log('[API /responses/[responseId]] Supabase access token found in NextAuth session.');
    try {
      supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${supabaseAccessToken}`,
            },
          },
        }
      );
    } catch (e: any) {
      console.error('[API /responses/[responseId]] Error creating Supabase client:', e.message);
      return NextResponse.json({ error: 'Failed to initialize Supabase client', details: e.message }, { status: 500 });
    }
  }

  if (supabaseAccessToken) {
    console.log('[API /responses/[responseId]] Initialized Supabase client with Bearer token. Verifying user...');
    const { data: { user: supabaseUser }, error: getUserError } = await supabase.auth.getUser();

    if (getUserError || !supabaseUser) {
      console.error('[API /responses/[responseId]] Error verifying Supabase user via Bearer token:', getUserError?.message);
      return NextResponse.json({ error: 'Unauthorized: Failed to verify Supabase user', details: getUserError?.message }, { status: 401 });
    }

    if (supabaseUser.id !== psychologistId) {
      console.error(`[API /responses/[responseId]] Mismatch between NextAuth user ID (${psychologistId}) and Supabase user ID (${supabaseUser.id}) after Bearer verification.`);
      return NextResponse.json({ error: 'User ID mismatch after session synchronization' }, { status: 500 });
    }
  } else {
    console.log('[API /responses/[responseId]] Skipping Supabase user verification due to admin fallback.');
  }

  try {
    // 2. Fetch response details and verify ownership (using the initialized supabase client)
    const { data: responseData, error: responseError } = await supabase
      .from('respuestas')
      .select(`
        id,
        paciente_id,
        enviado_en,
        puntuacion,
        respuestas,
        cuestionarios (
          id,
          codigo,
          titulo,
          items,
          descripcion_escala
        )
      `)
      .eq('id', responseId)
      .single();
      
    // Definimos tipos para facilitar el manejo de datos
    type ItemCuestionario = {
      id: number;
      texto: string;
    };
    
    type Cuestionario = {
      id: string;
      codigo: string;
      titulo: string;
      descripcion_escala?: string;
      items: ItemCuestionario[];
    };

    // Loguear los datos recibidos para depuración
    if (responseData) {
      // Determinar si cuestionarios es un array o un objeto individual
      console.log(`[API /responses/${responseId}] Response data type:`, {
        cuestionarios_is_array: Array.isArray(responseData.cuestionarios),
        cuestionarios_type: typeof responseData.cuestionarios
      });
      
      // Acceder al primer elemento si es un array, o directamente si es un objeto
      const cuestionario = Array.isArray(responseData.cuestionarios) 
        ? responseData.cuestionarios[0] as Cuestionario 
        : responseData.cuestionarios as unknown as Cuestionario;
      
      console.log(`[API /responses/${responseId}] Response data:`, {
        id: responseData.id,
        paciente_id: responseData.paciente_id,
        cuestionario: cuestionario ? {
          id: cuestionario.id,
          codigo: cuestionario.codigo,
          titulo: cuestionario.titulo,
          items_count: Array.isArray(cuestionario.items) ? cuestionario.items.length : 'not an array'
        } : null
      });
    }

    if (responseError) {
      console.error(`[API /responses/${responseId}] Error fetching response ${responseId}:`, responseError);
      if (responseError.code === 'PGRST116') { 
        return NextResponse.json({ error: 'Response not found' }, { status: 404 });
      }
      return NextResponse.json({ error: 'Error fetching response details', details: responseError.message }, { status: 500 });
    }

    if (!responseData) { 
      return NextResponse.json({ error: 'Response not found' }, { status: 404 });
    }
    
    // Verificar que tenemos un paciente_id válido
    if (!responseData.paciente_id) {
      console.error(`[API /responses/${responseId}] Response ${responseId} is missing paciente_id`);
      return NextResponse.json({ error: 'Response data is missing patient information' }, { status: 500 });
    }

    // Consulta explícita a la tabla 'patients' para obtener el psychologist_id
    const { data: patientData, error: patientError } = await supabase
      .from('patients')
      .select('psychologist_id')
      .eq('id', responseData.paciente_id)
      .single();

    if (patientError || !patientData) {
      console.error(`[API /responses/${responseId}] Error fetching patient data for paciente_id ${responseData.paciente_id}:`, patientError);
      return NextResponse.json({ 
        error: 'Could not verify patient ownership', 
        details: patientError?.message || 'Patient data not found' 
      }, { status: patientError?.code === 'PGRST116' ? 404 : 500 });
    }

    const patientPsychologistId = patientData.psychologist_id;

    // Verificar que el psicólogo del paciente coincida con el de la sesión
    if (patientPsychologistId !== psychologistId) {
      console.warn(`[API /responses/${responseId}] Unauthorized access attempt. ` +
        `Session psychologist ID: ${psychologistId}, ` +
        `Patient's psychologist ID: ${patientPsychologistId}`);
      return NextResponse.json({ 
        error: 'Forbidden: You do not have access to this response.' 
      }, { status: 403 });
    }
    
    interface RawAnswerItem {
      pregunta_id: number | string; // Allow string IDs
      valor: number;
    }

    interface AnswerOption {
      valor: number | string;
      texto: string;
    }

    interface QuestionDefinitionDB {
      id: number | string; // Allow string IDs
      texto: string;
      opciones_respuesta?: AnswerOption[];
    } // Make optional as not all questions might have predefined options

    // Acceder al cuestionario (como primer elemento del array o directamente)
    const cuestionario = Array.isArray(responseData.cuestionarios) 
      ? responseData.cuestionarios[0] as unknown as Cuestionario 
      : responseData.cuestionarios as unknown as Cuestionario;
    
    // Handle potential nested 'items' structure for some questionnaires like OPD-CA2-SQ
    let actualQuestionDefinitions = cuestionario?.items;
    if (cuestionario?.items && !Array.isArray(cuestionario.items) && (cuestionario.items as any).items && Array.isArray((cuestionario.items as any).items)) {
      console.log(`[API /responses/${responseId}] Found nested items structure, using the inner array.`);
      actualQuestionDefinitions = (cuestionario.items as any).items;
    }

    const questionDefinitions = actualQuestionDefinitions as QuestionDefinitionDB[] | undefined;
    
    // Defensively get the raw answers array, as it might be nested
    let rawAnswers: RawAnswerItem[] | undefined;
    if (Array.isArray(responseData.respuestas)) {
      rawAnswers = responseData.respuestas as RawAnswerItem[];
    } else if (responseData.respuestas && typeof responseData.respuestas === 'object' && Array.isArray((responseData.respuestas as any).respuestas)) {
      console.warn(`[API /responses/${responseId}] 'respuestas' column contained a nested object. Using the inner array.`);
      rawAnswers = (responseData.respuestas as any).respuestas as RawAnswerItem[];
    }
    let enrichedItems: ResponseItemDetail[] = [];

    if (questionDefinitions && Array.isArray(questionDefinitions) && rawAnswers && Array.isArray(rawAnswers)) {
      console.log(`[API /responses/${responseId}] Processing ${questionDefinitions.length} question definitions and ${rawAnswers.length} answers`);
      
      // Use a map that can handle both string and number IDs
      const questionsMap = new Map<string | number, QuestionDefinitionDB>(); 
      questionDefinitions.forEach(qDef => {
        if (qDef.id !== undefined && qDef.id !== null) { 
          questionsMap.set(qDef.id, qDef);
        }
      });

      enrichedItems = rawAnswers.map((rawAnswer): ResponseItemDetail | null => {
        if (rawAnswer.pregunta_id === undefined || rawAnswer.pregunta_id === null) { 
          console.warn(`[API /responses/${responseId}] Raw answer item missing or invalid pregunta_id:`, rawAnswer);
          return null; 
        }
        // The key in the map will match the type of pregunta_id (string or number)
        const qDef = questionsMap.get(rawAnswer.pregunta_id);
        
        if (!qDef) {
          console.warn(`[API /responses/${responseId}] Question definition not found for pregunta_id: ${rawAnswer.pregunta_id}`);
          return {
            questionId: String(rawAnswer.pregunta_id),
            questionText: `Unknown Question (ID: ${rawAnswer.pregunta_id})`,
            answerValue: rawAnswer.valor,
            answerText: typeof rawAnswer.valor === 'number' ? String(rawAnswer.valor) : undefined,
          };
        }

        let answerTextToShow: string | undefined = undefined;
        // Default to string representation of the value if it's a number or string, otherwise undefined.
        if (typeof rawAnswer.valor === 'number' || typeof rawAnswer.valor === 'string') {
          answerTextToShow = String(rawAnswer.valor);
        }

        // If question definition and its options are available, try to find the qualitative text.
        if (qDef.opciones_respuesta && Array.isArray(qDef.opciones_respuesta)) {
          const matchingOption = qDef.opciones_respuesta.find(opt => opt.valor === rawAnswer.valor);
          if (matchingOption) {
            answerTextToShow = matchingOption.texto;
          }
        }

        return {
          questionId: String(rawAnswer.pregunta_id),
          questionText: qDef.texto,
          answerValue: rawAnswer.valor,
          answerText: answerTextToShow, // Use the resolved qualitative text or fallback
        };
      }).filter(item => item !== null) as ResponseItemDetail[];
    } else {
      if (!questionDefinitions || !Array.isArray(questionDefinitions)) {
        console.warn(`[API /responses/${responseId}] Questionnaire items (cuestionarios.items) is missing or not an array.`);
      }
      if (!rawAnswers || !Array.isArray(rawAnswers)) {
        console.warn(`[API /responses/${responseId}] Patient answers (respuestas.respuestas) is missing or not an array.`);
      }
    }

    const detailedResponse: ResponseDetail = {
      id: responseData.id,
      patient_id: responseData.paciente_id,
      questionnaire_code: cuestionario?.codigo || 'N/A',
      questionnaire_name: cuestionario?.titulo || 'Unknown Questionnaire',
      questionnaire_scale_description: cuestionario?.descripcion_escala, // Añadir la descripción de la escala
      date: responseData.enviado_en as string,
      score: responseData.puntuacion,
      items: enrichedItems, 
    };

    console.log('[API /responses/[responseId]] Detailed Response:', JSON.stringify(detailedResponse, null, 2));

    return NextResponse.json(detailedResponse, { status: 200 });

  } catch (error: any) {
    console.error(`[API /responses/${responseId}] Unexpected error in main processing block:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
